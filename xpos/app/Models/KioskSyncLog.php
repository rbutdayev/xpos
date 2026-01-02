<?php

namespace App\Models;

use App\Traits\BelongsToAccount;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Kiosk Sync Log Model
 *
 * Tracks all synchronization activities between kiosk devices and the backend server.
 * Used for monitoring, debugging, and audit purposes.
 *
 * @property int $id
 * @property int $account_id
 * @property int $kiosk_device_token_id
 * @property string $sync_type
 * @property string $direction
 * @property int $records_count
 * @property string $status
 * @property string|null $error_message
 * @property \Carbon\Carbon $started_at
 * @property \Carbon\Carbon|null $completed_at
 * @property \Carbon\Carbon|null $created_at
 * @property \Carbon\Carbon|null $updated_at
 */
class KioskSyncLog extends Model
{
    use BelongsToAccount, HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'account_id',
        'kiosk_device_token_id',
        'sync_type',
        'direction',
        'records_count',
        'status',
        'error_message',
        'started_at',
        'completed_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'records_count' => 'integer',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    /**
     * Calculate the duration of the sync operation in seconds.
     *
     * @return float|null
     */
    public function getDurationSeconds(): ?float
    {
        if (!$this->completed_at) {
            return null;
        }

        return $this->started_at->diffInSeconds($this->completed_at);
    }

    /**
     * Check if the sync was successful.
     *
     * @return bool
     */
    public function isSuccessful(): bool
    {
        return $this->status === 'success';
    }

    /**
     * Check if the sync failed.
     *
     * @return bool
     */
    public function isFailed(): bool
    {
        return $this->status === 'failed';
    }

    /**
     * Check if the sync was partial.
     *
     * @return bool
     */
    public function isPartial(): bool
    {
        return $this->status === 'partial';
    }

    /**
     * Check if the sync is still in progress.
     *
     * @return bool
     */
    public function isInProgress(): bool
    {
        return $this->completed_at === null;
    }

    /**
     * Scope to filter successful syncs.
     *
     * @param Builder $query
     * @return Builder
     */
    public function scopeSuccessful(Builder $query): Builder
    {
        return $query->where('status', 'success');
    }

    /**
     * Scope to filter failed syncs.
     *
     * @param Builder $query
     * @return Builder
     */
    public function scopeFailed(Builder $query): Builder
    {
        return $query->where('status', 'failed');
    }

    /**
     * Scope to filter partial syncs.
     *
     * @param Builder $query
     * @return Builder
     */
    public function scopePartial(Builder $query): Builder
    {
        return $query->where('status', 'partial');
    }

    /**
     * Scope to filter by sync type.
     *
     * @param Builder $query
     * @param string $syncType
     * @return Builder
     */
    public function scopeOfType(Builder $query, string $syncType): Builder
    {
        return $query->where('sync_type', $syncType);
    }

    /**
     * Scope to filter by direction.
     *
     * @param Builder $query
     * @param string $direction
     * @return Builder
     */
    public function scopeDirection(Builder $query, string $direction): Builder
    {
        return $query->where('direction', $direction);
    }

    /**
     * Scope to filter uploads.
     *
     * @param Builder $query
     * @return Builder
     */
    public function scopeUploads(Builder $query): Builder
    {
        return $query->where('direction', 'upload');
    }

    /**
     * Scope to filter downloads.
     *
     * @param Builder $query
     * @return Builder
     */
    public function scopeDownloads(Builder $query): Builder
    {
        return $query->where('direction', 'download');
    }

    /**
     * Scope to filter by device.
     *
     * @param Builder $query
     * @param int $deviceId
     * @return Builder
     */
    public function scopeForDevice(Builder $query, int $deviceId): Builder
    {
        return $query->where('kiosk_device_token_id', $deviceId);
    }

    /**
     * Scope to get recent logs (last 24 hours by default).
     *
     * @param Builder $query
     * @param int $hours
     * @return Builder
     */
    public function scopeRecent(Builder $query, int $hours = 24): Builder
    {
        return $query->where('created_at', '>', now()->subHours($hours));
    }

    /**
     * Scope to order by most recent first.
     *
     * @param Builder $query
     * @return Builder
     */
    public function scopeLatest(Builder $query): Builder
    {
        return $query->orderBy('created_at', 'desc');
    }

    /**
     * Relationship: The account this sync log belongs to.
     *
     * @return BelongsTo
     */
    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    /**
     * Relationship: The kiosk device token that performed this sync.
     *
     * @return BelongsTo
     */
    public function kioskDeviceToken(): BelongsTo
    {
        return $this->belongsTo(KioskDeviceToken::class);
    }

    /**
     * Relationship: The device that performed this sync (alias).
     *
     * @return BelongsTo
     */
    public function device(): BelongsTo
    {
        return $this->kioskDeviceToken();
    }
}
