<?php

namespace App\Helpers;

use App\Models\Currency;
use Illuminate\Support\Facades\Cache;

class CurrencyHelper
{
    /**
     * Format an amount with currency symbol
     *
     * @param float $amount
     * @param string|null $currencyCode
     * @return string
     */
    public static function format(float $amount, ?string $currencyCode = null): string
    {
        $currency = self::getCurrency($currencyCode);

        if (!$currency) {
            return number_format($amount, 2);
        }

        $formattedAmount = number_format($amount, $currency->decimal_places);

        return $currency->symbol_position === 'before'
            ? $currency->symbol . $formattedAmount
            : $formattedAmount . $currency->symbol;
    }

    /**
     * Get currency symbol
     *
     * @param string|null $currencyCode
     * @return string
     */
    public static function symbol(?string $currencyCode = null): string
    {
        $currency = self::getCurrency($currencyCode);
        return $currency ? $currency->symbol : '$';
    }

    /**
     * Get currency decimal places
     *
     * @param string|null $currencyCode
     * @return int
     */
    public static function decimals(?string $currencyCode = null): int
    {
        $currency = self::getCurrency($currencyCode);
        return $currency ? $currency->decimal_places : 2;
    }

    /**
     * Get currency symbol position
     *
     * @param string|null $currencyCode
     * @return string
     */
    public static function position(?string $currencyCode = null): string
    {
        $currency = self::getCurrency($currencyCode);
        return $currency ? $currency->symbol_position : 'before';
    }

    /**
     * Get currency from code or default to company currency
     *
     * @param string|null $currencyCode
     * @return Currency|null
     */
    protected static function getCurrency(?string $currencyCode = null): ?Currency
    {
        if ($currencyCode) {
            return Cache::remember("currency_{$currencyCode}", 3600, function () use ($currencyCode) {
                return Currency::find($currencyCode);
            });
        }

        // Get from current company
        $company = auth()->user()?->account?->companies?->first();
        if (!$company) {
            return null;
        }

        $code = $company->currency_code ?? 'USD';
        return Cache::remember("currency_{$code}", 3600, function () use ($code) {
            return Currency::find($code);
        });
    }
}
