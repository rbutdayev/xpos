<?php

namespace App\Enums;

enum PaymentMethod: string
{
    case CASH = 'cash';
    case CARD = 'card';
    case BANK_TRANSFER = 'bank_transfer';
    case BANK_CREDIT = 'bank_credit';
    case GIFT_CARD = 'gift_card';

    /**
     * Get all values as an array
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * Get the display name for the payment method
     */
    public function label(): string
    {
        return match($this) {
            self::CASH => __('enums.payment_methods.cash'),
            self::CARD => __('enums.payment_methods.card'),
            self::BANK_TRANSFER => __('enums.payment_methods.bank_transfer'),
            self::BANK_CREDIT => __('enums.payment_methods.bank_credit'),
            self::GIFT_CARD => __('enums.payment_methods.gift_card'),
        };
    }

    /**
     * Get Azerbaijani translation (legacy support)
     */
    public function labelAz(): string
    {
        return match($this) {
            self::CASH => 'Nağd',
            self::CARD => 'Kart',
            self::BANK_TRANSFER => 'Köçürmə',
            self::BANK_CREDIT => 'Bank Kredit',
            self::GIFT_CARD => 'Hədiyyə Kartı',
        };
    }
}
