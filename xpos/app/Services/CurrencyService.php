<?php

namespace App\Services;

use App\Models\Currency;
use App\Models\Company;
use Illuminate\Support\Facades\Cache;

class CurrencyService
{
    /**
     * Get current company's currency settings
     *
     * @return array
     */
    public function getCompanyCurrency(): array
    {
        $company = $this->getCompany();

        if (!$company) {
            return $this->getDefaultCurrency();
        }

        $currency = Currency::find($company->currency_code);

        if (!$currency) {
            return $this->getDefaultCurrency();
        }

        return [
            'code' => $currency->code,
            'name' => $currency->name,
            'symbol' => $currency->symbol,
            'decimal_places' => $currency->decimal_places,
            'symbol_position' => $currency->symbol_position,
        ];
    }

    /**
     * Format money using company currency
     *
     * @param float $amount
     * @return string
     */
    public function formatMoney(float $amount): string
    {
        $currency = $this->getCompanyCurrency();

        $formattedAmount = number_format($amount, $currency['decimal_places']);

        return $currency['symbol_position'] === 'before'
            ? $currency['symbol'] . $formattedAmount
            : $formattedAmount . $currency['symbol'];
    }

    /**
     * Get all active currencies
     *
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getAllCurrencies()
    {
        return Cache::remember('currencies_active', 3600, function () {
            return Currency::active()
                ->orderBy('code')
                ->get();
        });
    }

    /**
     * Update company currency
     *
     * @param string $code
     * @return bool
     */
    public function updateCompanyCurrency(string $code): bool
    {
        $company = $this->getCompany();

        if (!$company) {
            return false;
        }

        $currency = Currency::find($code);

        if (!$currency) {
            return false;
        }

        $company->update([
            'currency_code' => $currency->code,
            'currency_symbol' => $currency->symbol,
            'currency_decimal_places' => $currency->decimal_places,
            'currency_symbol_position' => $currency->symbol_position,
        ]);

        // Clear cache
        Cache::forget("currency_{$code}");
        Cache::forget("currency_{$company->currency_code}");

        return true;
    }

    /**
     * Get current company
     *
     * @return Company|null
     */
    protected function getCompany(): ?Company
    {
        $user = auth()->user();

        if (!$user || !$user->account) {
            return null;
        }

        return $user->account->companies->first();
    }

    /**
     * Get default currency (USD)
     *
     * @return array
     */
    protected function getDefaultCurrency(): array
    {
        return [
            'code' => 'USD',
            'name' => 'US Dollar',
            'symbol' => '$',
            'decimal_places' => 2,
            'symbol_position' => 'before',
        ];
    }
}
