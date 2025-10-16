<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BlockedIP extends Model
{
    protected $table = 'blocked_ips';
    
    protected $fillable = [
        'ip_address',
        'reason',
        'is_permanent',
        'blocked_at',
        'expires_at',
        'blocked_by'
    ];

    protected $casts = [
        'is_permanent' => 'boolean',
        'blocked_at' => 'datetime',
        'expires_at' => 'datetime'
    ];

    public function blockedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'blocked_by');
    }

    public function scopeActive($query)
    {
        return $query->where(function ($q) {
            $q->where('is_permanent', true)
              ->orWhere('expires_at', '>', now());
        });
    }

    public function scopeExpired($query)
    {
        return $query->where('is_permanent', false)
                    ->where('expires_at', '<=', now());
    }

    public function scopeForIP($query, $ip)
    {
        return $query->where('ip_address', $ip);
    }

    public function isActive(): bool
    {
        return $this->is_permanent || 
               ($this->expires_at && $this->expires_at->isFuture());
    }
}
