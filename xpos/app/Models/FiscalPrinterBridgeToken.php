<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class FiscalPrinterBridgeToken extends Model
{
    protected $fillable = [
        'account_id',
        'token',
        'name',
        'status',
        'last_seen_at',
        'bridge_version',
        'bridge_info',
        'created_by',
    ];

    protected $casts = [
        'last_seen_at' => 'datetime',
        'bridge_info' => 'array',
    ];

    /**
     * Generate a new unique token
     */
    public static function generateToken(): string
    {
        return 'xpos_' . Str::random(56);
    }

    /**
     * Check if token is online (last seen within 1 minute)
     */
    public function isOnline(): bool
    {
        if (!$this->last_seen_at) {
            return false;
        }

        return $this->last_seen_at->gt(now()->subMinute());
    }

    /**
     * Check if token is active
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    /**
     * Update last seen timestamp
     */
    public function updateHeartbeat(?string $version = null, ?array $info = null): void
    {
        $data = ['last_seen_at' => now()];

        if ($version) {
            $data['bridge_version'] = $version;
        }

        if ($info) {
            $data['bridge_info'] = $info;
        }

        $this->update($data);
    }

    /**
     * Relationships
     */
    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
