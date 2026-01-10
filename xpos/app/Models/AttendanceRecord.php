<?php

namespace App\Models;

use App\Traits\BelongsToAccount;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;
use Carbon\Carbon;

class AttendanceRecord extends Model
{
    use HasFactory, BelongsToAccount;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'account_id',
        'user_id',
        'branch_id',
        'type',
        'recorded_at',
        'latitude',
        'longitude',
        'gps_accuracy',
        'is_within_branch_radius',
        'distance_from_branch',
        'ip_address',
        'user_agent',
        'device_type',
        'device_info',
        'notes',
        'photo_path',
        'is_manual',
        'created_by_admin_id',
        'admin_notes',
    ];

    /**
     * Fields that can NEVER be mass assigned (security)
     */
    protected $guarded = [
        'id',
        'is_locked',  // Always true, cannot be changed
    ];

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'recorded_at' => 'datetime',
            'latitude' => 'decimal:8',
            'longitude' => 'decimal:8',
            'gps_accuracy' => 'decimal:2',
            'is_within_branch_radius' => 'boolean',
            'distance_from_branch' => 'decimal:2',
            'device_info' => 'json',
            'is_manual' => 'boolean',
            'is_locked' => 'boolean',
        ];
    }

    /**
     * Relationships
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function createdByAdmin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_admin_id');
    }

    /**
     * Scopes
     */
    public function scopeCheckIns(Builder $query): Builder
    {
        return $query->where('type', 'check_in');
    }

    public function scopeCheckOuts(Builder $query): Builder
    {
        return $query->where('type', 'check_out');
    }

    public function scopeForUser(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    public function scopeForBranch(Builder $query, int $branchId): Builder
    {
        return $query->where('branch_id', $branchId);
    }

    public function scopeOnDate(Builder $query, string $date): Builder
    {
        return $query->whereDate('recorded_at', $date);
    }

    public function scopeBetweenDates(Builder $query, string $startDate, string $endDate): Builder
    {
        return $query->whereBetween('recorded_at', [$startDate, $endDate]);
    }

    public function scopeWithinRadius(Builder $query): Builder
    {
        return $query->where('is_within_branch_radius', true);
    }

    public function scopeOutsideRadius(Builder $query): Builder
    {
        return $query->where('is_within_branch_radius', false);
    }

    public function scopeManualRecords(Builder $query): Builder
    {
        return $query->where('is_manual', true);
    }

    public function scopeAutoRecords(Builder $query): Builder
    {
        return $query->where('is_manual', false);
    }

    /**
     * Helper Methods
     */
    public function isCheckIn(): bool
    {
        return $this->type === 'check_in';
    }

    public function isCheckOut(): bool
    {
        return $this->type === 'check_out';
    }

    public function isWithinRadius(): bool
    {
        return $this->is_within_branch_radius;
    }

    public function isManual(): bool
    {
        return $this->is_manual;
    }

    public function hasPhoto(): bool
    {
        return !is_null($this->photo_path);
    }

    public function hasGpsData(): bool
    {
        return !is_null($this->latitude) && !is_null($this->longitude);
    }

    /**
     * Get the corresponding check-in for a check-out (or vice versa)
     * Finds the nearest opposite type record for the same user
     */
    public function getCorrespondingRecord(): ?AttendanceRecord
    {
        $oppositeType = $this->isCheckIn() ? 'check_out' : 'check_in';

        if ($this->isCheckIn()) {
            // For check-in, find the next check-out
            return static::where('account_id', $this->account_id)
                ->where('user_id', $this->user_id)
                ->where('type', $oppositeType)
                ->where('recorded_at', '>', $this->recorded_at)
                ->orderBy('recorded_at')
                ->first();
        } else {
            // For check-out, find the previous check-in
            return static::where('account_id', $this->account_id)
                ->where('user_id', $this->user_id)
                ->where('type', $oppositeType)
                ->where('recorded_at', '<', $this->recorded_at)
                ->orderByDesc('recorded_at')
                ->first();
        }
    }

    /**
     * Calculate work duration if this is a check-out with a corresponding check-in
     * Returns duration in minutes
     */
    public function calculateWorkDuration(): ?int
    {
        if (!$this->isCheckOut()) {
            return null;
        }

        $checkIn = $this->getCorrespondingRecord();
        if (!$checkIn) {
            return null;
        }

        return $checkIn->recorded_at->diffInMinutes($this->recorded_at);
    }

    /**
     * Format work duration as human-readable string
     */
    public function getFormattedWorkDurationAttribute(): ?string
    {
        $minutes = $this->calculateWorkDuration();
        if (is_null($minutes)) {
            return null;
        }

        $hours = floor($minutes / 60);
        $mins = $minutes % 60;

        return sprintf('%dh %dm', $hours, $mins);
    }

    /**
     * Get all attendance records for a user on a specific date
     * Returns pairs of check-in/check-out
     */
    public static function getDailyRecordsForUser(int $accountId, int $userId, string $date): array
    {
        $records = static::withoutGlobalScope('account')
            ->where('account_id', $accountId)
            ->where('user_id', $userId)
            ->whereDate('recorded_at', $date)
            ->orderBy('recorded_at')
            ->get();

        $pairs = [];
        $checkIn = null;

        foreach ($records as $record) {
            if ($record->isCheckIn()) {
                $checkIn = $record;
            } elseif ($record->isCheckOut() && $checkIn) {
                $pairs[] = [
                    'check_in' => $checkIn,
                    'check_out' => $record,
                    'duration_minutes' => $checkIn->recorded_at->diffInMinutes($record->recorded_at),
                ];
                $checkIn = null;
            }
        }

        // Handle unclosed check-in
        if ($checkIn) {
            $pairs[] = [
                'check_in' => $checkIn,
                'check_out' => null,
                'duration_minutes' => null,
            ];
        }

        return $pairs;
    }

    /**
     * Enforce immutability - prevent updates after creation
     */
    protected static function boot()
    {
        parent::boot();

        // Prevent updates to locked records
        static::updating(function ($record) {
            if ($record->is_locked && !$record->isDirty('is_locked')) {
                throw new \Exception('Attendance records are immutable and cannot be modified.');
            }
        });

        // Lock record on creation
        static::creating(function ($record) {
            $record->is_locked = true;
        });
    }

    /**
     * Override delete to prevent deletion of locked records
     */
    public function delete()
    {
        if ($this->is_locked) {
            throw new \Exception('Locked attendance records cannot be deleted. Contact system administrator.');
        }

        return parent::delete();
    }
}
