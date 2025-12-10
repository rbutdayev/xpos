<?php

namespace App\Models;

use App\Enums\PaymentMethod as PaymentMethodEnum;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class Payment extends Model
{
    use HasFactory;

    protected $primaryKey = 'payment_id';

    protected $fillable = [
        'sale_id',
        'rental_id',
        'method',
        'amount',
        'transaction_id',
        'card_type',
        'reference_number',
        'notes',
        'gift_card_id',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'method' => PaymentMethodEnum::class,
        ];
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class, 'sale_id', 'sale_id');
    }

    public function rental(): BelongsTo
    {
        return $this->belongsTo(Rental::class, 'rental_id', 'id');
    }

    public function giftCard(): BelongsTo
    {
        return $this->belongsTo(GiftCard::class, 'gift_card_id', 'id');
    }

    public function scopeCash(Builder $query): Builder
    {
        return $query->where('method', PaymentMethodEnum::CASH);
    }

    public function scopeCard(Builder $query): Builder
    {
        return $query->where('method', PaymentMethodEnum::CARD);
    }

    public function scopeTransfer(Builder $query): Builder
    {
        return $query->where('method', PaymentMethodEnum::BANK_TRANSFER);
    }

    public function scopeBankCredit(Builder $query): Builder
    {
        return $query->where('method', PaymentMethodEnum::BANK_CREDIT);
    }

    public function scopeGiftCard(Builder $query): Builder
    {
        return $query->where('method', PaymentMethodEnum::GIFT_CARD);
    }

    public function isCash(): bool
    {
        return $this->method === PaymentMethodEnum::CASH;
    }

    public function isCard(): bool
    {
        return $this->method === PaymentMethodEnum::CARD;
    }

    public function isTransfer(): bool
    {
        return $this->method === PaymentMethodEnum::BANK_TRANSFER;
    }

    public function isBankCredit(): bool
    {
        return $this->method === PaymentMethodEnum::BANK_CREDIT;
    }

    public function isGiftCard(): bool
    {
        return $this->method === PaymentMethodEnum::GIFT_CARD;
    }

    public function getMethodDisplayAttribute(): string
    {
        if (!$this->method) {
            return __('Unknown');
        }

        return $this->method->label();
    }
}
