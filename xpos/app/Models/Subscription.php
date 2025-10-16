<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class Subscription extends Model
{
    protected $fillable = [
        'account_id',
        'plan_type',
        'price',
        'starts_at',
        'expires_at',
        'status',
        'billing_cycle',
        'features',
        'last_payment_at',
        'next_payment_at',
    ];

    protected $casts = [
        'starts_at' => 'date',
        'expires_at' => 'date',
        'features' => 'array',
        'last_payment_at' => 'datetime',
        'next_payment_at' => 'datetime',
        'price' => 'decimal:2',
    ];

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    public function isActive(): bool
    {
        return $this->status === 'active' && $this->expires_at >= now()->toDateString();
    }

    public function isExpired(): bool
    {
        return $this->expires_at < now()->toDateString();
    }

    public function getDaysUntilExpiry(): int
    {
        return Carbon::parse($this->expires_at)->diffInDays(now(), false);
    }

    public function getPlanLimits(): array
    {
        return match($this->plan_type) {
            'başlanğıc' => [
                'branches' => 1,
                'warehouses' => 1,
                'users' => 3,
                'products' => 1000,
                'sms_monthly' => 100,
            ],
            'professional' => [
                'branches' => 3,
                'warehouses' => 5,
                'users' => 10,
                'products' => 10000,
                'sms_monthly' => 1000,
            ],
            'enterprise' => [
                'branches' => -1, // unlimited
                'warehouses' => -1, // unlimited
                'users' => 50,
                'products' => -1, // unlimited
                'sms_monthly' => 5000,
            ],
            default => []
        };
    }
}
