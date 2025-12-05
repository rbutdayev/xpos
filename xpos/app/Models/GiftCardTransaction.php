<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GiftCardTransaction extends Model
{
    const TYPE_ISSUE = 'issue';
    const TYPE_ACTIVATE = 'activate';
    const TYPE_REDEEM = 'redeem';
    const TYPE_REFUND = 'refund';
    const TYPE_ADJUST = 'adjust';
    const TYPE_EXPIRE = 'expire';
    const TYPE_CANCEL = 'cancel';
    const TYPE_RESET = 'reset';

    protected $fillable = [
        'gift_card_id',
        'sale_id',
        'transaction_type',
        'amount',
        'balance_before',
        'balance_after',
        'user_id',
        'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'balance_before' => 'decimal:2',
        'balance_after' => 'decimal:2',
    ];

    public function giftCard(): BelongsTo
    {
        return $this->belongsTo(GiftCard::class);
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public static function createTransaction(
        GiftCard $giftCard,
        string $type,
        float $amount,
        ?int $userId = null,
        ?int $saleId = null,
        ?string $notes = null
    ): self {
        return self::create([
            'gift_card_id' => $giftCard->id,
            'sale_id' => $saleId,
            'transaction_type' => $type,
            'amount' => $amount,
            'balance_before' => $giftCard->current_balance,
            'balance_after' => $giftCard->current_balance - $amount,
            'user_id' => $userId ?? auth()->id(),
            'notes' => $notes,
        ]);
    }
}
