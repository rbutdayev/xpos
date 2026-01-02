<?php

namespace App\Models;

use App\Traits\BelongsToAccount;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

/**
 * Kiosk Device Token Model
 *
 * Manages authentication tokens for kiosk devices with offline POS capabilities.
 * Separate from fiscal printer bridge tokens for security and isolation.
 *
 * @property int $id
 * @property int $account_id
 * @property int|null $branch_id
 * @property string $device_name
 * @property string $token
 * @property string $status
 * @property \Carbon\Carbon|null $last_heartbeat
 * @property array|null $device_info
 * @property int $created_by
 * @property \Carbon\Carbon|null $created_at
 * @property \Carbon\Carbon|null $updated_at
 */
class KioskDeviceToken extends Model
{
    use BelongsToAccount, HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'account_id',
        'branch_id',
        'device_name',
        'token',
        'status',
        'last_heartbeat',
        'device_info',
        'created_by',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'last_heartbeat' => 'datetime',
        'device_info' => 'array',
    ];

    /**
     * Generate a new unique kiosk token.
     *
     * Format: ksk_<56 random characters>
     * Total length: 60 characters
     *
     * @return string
     */
    public static function generateToken(): string
    {
        return 'ksk_' . Str::random(56);
    }

    /**
     * Update the last heartbeat timestamp.
     *
     * Optionally updates device info if provided.
     *
     * @param array|null $deviceInfo Device information (version, platform, etc.)
     * @return void
     */
    public function updateHeartbeat(?array $deviceInfo = null): void
    {
        $data = ['last_heartbeat' => now()];

        if ($deviceInfo !== null) {
            $data['device_info'] = $deviceInfo;
        }

        $this->update($data);
    }

    /**
     * Revoke this kiosk token.
     *
     * @return void
     */
    public function revoke(): void
    {
        $this->update(['status' => 'revoked']);
    }

    /**
     * Suspend this kiosk token.
     *
     * @return void
     */
    public function suspend(): void
    {
        $this->update(['status' => 'suspended']);
    }

    /**
     * Activate this kiosk token.
     *
     * @return void
     */
    public function activate(): void
    {
        $this->update(['status' => 'active']);
    }

    /**
     * Check if the device is online (last heartbeat within 1 minute).
     *
     * @return bool
     */
    public function isOnline(): bool
    {
        if (!$this->last_heartbeat) {
            return false;
        }

        return $this->last_heartbeat->gt(now()->subMinute());
    }

    /**
     * Check if token is active.
     *
     * @return bool
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    /**
     * Check if token is revoked.
     *
     * @return bool
     */
    public function isRevoked(): bool
    {
        return $this->status === 'revoked';
    }

    /**
     * Check if token is suspended.
     *
     * @return bool
     */
    public function isSuspended(): bool
    {
        return $this->status === 'suspended';
    }

    /**
     * Scope to filter only active tokens.
     *
     * @param Builder $query
     * @return Builder
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope to filter by account ID.
     *
     * @param Builder $query
     * @param int $accountId
     * @return Builder
     */
    public function scopeByAccount(Builder $query, int $accountId): Builder
    {
        return $query->where('account_id', $accountId);
    }

    /**
     * Scope to filter online devices (heartbeat within last minute).
     *
     * @param Builder $query
     * @return Builder
     */
    public function scopeOnline(Builder $query): Builder
    {
        return $query->where('last_heartbeat', '>', now()->subMinute());
    }

    /**
     * Scope to filter offline devices.
     *
     * @param Builder $query
     * @return Builder
     */
    public function scopeOffline(Builder $query): Builder
    {
        return $query->where(function ($query) {
            $query->whereNull('last_heartbeat')
                ->orWhere('last_heartbeat', '<=', now()->subMinute());
        });
    }

    /**
     * Relationship: The account this token belongs to.
     *
     * @return BelongsTo
     */
    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    /**
     * Relationship: The branch this kiosk device is assigned to.
     *
     * @return BelongsTo
     */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    /**
     * Relationship: The user who created this token.
     *
     * @return BelongsTo
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Relationship: Sync logs for this device.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function syncLogs()
    {
        return $this->hasMany(KioskSyncLog::class);
    }
}
