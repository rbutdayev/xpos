<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoyaltyCard extends Model
{
    const STATUS_FREE = 'free';
    const STATUS_USED = 'used';
    const STATUS_INACTIVE = 'inactive';

    protected $fillable = [
        'card_number',
        'status',
        'account_id',
        'customer_id',
        'assigned_at',
    ];

    protected $casts = [
        'assigned_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();

        static::saving(function ($card) {
            if ($card->card_number) {
                $card->card_number = strtoupper($card->card_number);
            }
        });
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function scopeFree($query)
    {
        return $query->where('status', self::STATUS_FREE);
    }

    public function scopeUsed($query)
    {
        return $query->where('status', self::STATUS_USED);
    }

    public function scopeInactive($query)
    {
        return $query->where('status', self::STATUS_INACTIVE);
    }

    public function scopeByAccount($query, $accountId = null)
    {
        $accountId = $accountId ?? auth()->user()?->account_id;
        return $query->where('account_id', $accountId);
    }

    public function isFree(): bool
    {
        return $this->status === self::STATUS_FREE;
    }

    public function isUsed(): bool
    {
        return $this->status === self::STATUS_USED;
    }

    public function isInactive(): bool
    {
        return $this->status === self::STATUS_INACTIVE;
    }

    public function markAsUsed($customerId, $accountId): void
    {
        $this->update([
            'status' => self::STATUS_USED,
            'customer_id' => $customerId,
            'account_id' => $accountId,
            'assigned_at' => now(),
        ]);
    }

    public function markAsFree(): void
    {
        $this->update([
            'status' => self::STATUS_FREE,
            'customer_id' => null,
            'account_id' => null,
            'assigned_at' => null,
        ]);
    }

    public function markAsInactive(): void
    {
        $this->update([
            'status' => self::STATUS_INACTIVE,
        ]);
    }

    public static function generateUniqueCardNumber(): string
    {
        do {
            $cardNumber = strtoupper(substr(str_replace(['-', '_'], '', \Illuminate\Support\Str::uuid()), 0, 14));
        } while (self::where('card_number', $cardNumber)->exists());

        return $cardNumber;
    }
}
