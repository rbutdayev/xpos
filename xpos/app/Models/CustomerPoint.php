<?php

namespace App\Models;

use App\Traits\BelongsToAccount;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class CustomerPoint extends Model
{
    use HasFactory, BelongsToAccount;

    protected $fillable = [
        'customer_id',
        'account_id',
        'sale_id',
        'transaction_type',
        'points',
        'balance_after',
        'description',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'points' => 'integer',
            'balance_after' => 'integer',
            'expires_at' => 'datetime',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function scopeEarned(Builder $query): Builder
    {
        return $query->where('transaction_type', 'earned');
    }

    public function scopeRedeemed(Builder $query): Builder
    {
        return $query->where('transaction_type', 'redeemed');
    }

    public function scopeExpired(Builder $query): Builder
    {
        return $query->where('transaction_type', 'expired');
    }

    public function scopeNotExpired(Builder $query): Builder
    {
        return $query->where(function ($q) {
            $q->whereNull('expires_at')
              ->orWhere('expires_at', '>', now());
        });
    }

    public function scopeForCustomer(Builder $query, int $customerId): Builder
    {
        return $query->where('customer_id', $customerId);
    }

    /**
     * Check if this point transaction has expired
     */
    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }
}
