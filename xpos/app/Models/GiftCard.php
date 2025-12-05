<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GiftCard extends Model
{
    const STATUS_FREE = 'free';           // Blank card from super admin
    const STATUS_CONFIGURED = 'configured'; // Tenant set denomination, ready to sell
    const STATUS_ACTIVE = 'active';        // Sold to customer, has balance
    const STATUS_DEPLETED = 'depleted';    // Balance reached 0
    const STATUS_EXPIRED = 'expired';      // Passed expiry date
    const STATUS_INACTIVE = 'inactive';    // Deactivated by admin

    protected $fillable = [
        'card_number',
        'denomination',
        'initial_balance',
        'current_balance',
        'status',
        'account_id',
        'customer_id',
        'expiry_date',
        'activated_at',
        'fiscal_document_id',
        'fiscal_number',
        'notes',
    ];

    protected $casts = [
        'denomination' => 'decimal:2',
        'initial_balance' => 'decimal:2',
        'current_balance' => 'decimal:2',
        'expiry_date' => 'date',
        'activated_at' => 'datetime',
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

    public function transactions(): HasMany
    {
        return $this->hasMany(GiftCardTransaction::class);
    }

    public function scopeFree($query)
    {
        return $query->where('status', self::STATUS_FREE);
    }

    public function scopeConfigured($query)
    {
        return $query->where('status', self::STATUS_CONFIGURED);
    }

    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    public function scopeDepleted($query)
    {
        return $query->where('status', self::STATUS_DEPLETED);
    }

    public function scopeExpired($query)
    {
        return $query->where('status', self::STATUS_EXPIRED);
    }

    public function scopeInactive($query)
    {
        return $query->where('status', self::STATUS_INACTIVE);
    }

    public function scopeUsed($query)
    {
        return $query->where('status', self::STATUS_DEPLETED);
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

    public function isConfigured(): bool
    {
        return $this->status === self::STATUS_CONFIGURED;
    }

    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE &&
               (!$this->expiry_date || $this->expiry_date->isFuture());
    }

    public function isDepleted(): bool
    {
        return $this->status === self::STATUS_DEPLETED;
    }

    public function isExpired(): bool
    {
        return $this->status === self::STATUS_EXPIRED ||
               ($this->expiry_date && $this->expiry_date->isPast());
    }

    public function isInactive(): bool
    {
        return $this->status === self::STATUS_INACTIVE;
    }

    public function canBeUsed(): bool
    {
        return $this->isActive() &&
               $this->current_balance > 0 &&
               !$this->isExpired();
    }

    public function markAsDepleted(): void
    {
        $this->update([
            'status' => self::STATUS_DEPLETED,
            'current_balance' => 0,
        ]);
    }

    public function configure(float $denomination): void
    {
        $this->update([
            'denomination' => $denomination,
            'status' => self::STATUS_CONFIGURED,
        ]);
    }

    public function markAsExpired(): void
    {
        $this->update([
            'status' => self::STATUS_EXPIRED,
        ]);
    }

    public function markAsInactive(): void
    {
        $this->update([
            'status' => self::STATUS_INACTIVE,
        ]);
    }

    public function activate(?int $customerId = null): void
    {
        $this->update([
            'status' => self::STATUS_ACTIVE,
            'customer_id' => $customerId,
            'activated_at' => now(),
        ]);
    }

    public function resetForResale(): void
    {
        $this->update([
            'status' => self::STATUS_CONFIGURED,
            'current_balance' => null,
            'initial_balance' => null,
            'customer_id' => null,
            'activated_at' => null,
            'expiry_date' => null,
            'fiscal_document_id' => null,
            'fiscal_number' => null,
        ]);
    }

    public static function generateUniqueCardNumber(): string
    {
        do {
            // Format: GIFTXXXXXXXXXXXX (16 characters total)
            $cardNumber = 'GIFT' . strtoupper(substr(str_replace(['-', '_'], '', \Illuminate\Support\Str::uuid()), 0, 12));
        } while (self::where('card_number', $cardNumber)->exists());

        return $cardNumber;
    }
}
