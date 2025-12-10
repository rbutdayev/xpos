# Multi-Currency Support Implementation

## Overview
This document outlines the implementation of multi-currency support for XPOS. Each account/company operates in ONE currency (no exchange rate conversion needed).

---

## 1. Database Schema

### 1.1 Companies Table
```php
Schema::table('companies', function (Blueprint $table) {
    $table->string('currency_code', 3)->default('USD');
    $table->string('currency_symbol', 10)->default('$');
    $table->unsignedTinyInteger('currency_decimal_places')->default(2);
    $table->enum('currency_symbol_position', ['before', 'after'])->default('before');
});
```

**Fields:**
- `currency_code`: ISO 4217 currency code (USD, EUR, GBP, AZN, etc.)
- `currency_symbol`: Display symbol ($, €, £, ₼, etc.)
- `currency_decimal_places`: Number of decimal places (2 for most, 0 for JPY)
- `currency_symbol_position`: Symbol placement (before: $100, after: 100₼)

### 1.2 Currencies Reference Table
```php
Schema::create('currencies', function (Blueprint $table) {
    $table->string('code', 3)->primary();
    $table->string('name', 100);
    $table->string('symbol', 10);
    $table->unsignedTinyInteger('decimal_places')->default(2);
    $table->enum('symbol_position', ['before', 'after'])->default('before');
    $table->boolean('active')->default(true);
    $table->timestamps();
});
```

---

## 2. Supported Currencies

### Initial Currency List
| Code | Name | Symbol | Decimals | Position | Common In |
|------|------|--------|----------|----------|-----------|
| USD | US Dollar | $ | 2 | before | USA, International |
| EUR | Euro | € | 2 | before | EU Countries |
| GBP | British Pound | £ | 2 | before | UK |
| AZN | Azerbaijani Manat | ₼ | 2 | after | Azerbaijan |
| TRY | Turkish Lira | ₺ | 2 | before | Turkey |
| RUB | Russian Ruble | ₽ | 2 | after | Russia |
| JPY | Japanese Yen | ¥ | 0 | before | Japan |
| CNY | Chinese Yuan | ¥ | 2 | before | China |
| INR | Indian Rupee | ₹ | 2 | before | India |
| SAR | Saudi Riyal | ﷼ | 2 | before | Saudi Arabia |
| AED | UAE Dirham | د.إ | 2 | before | UAE |
| CAD | Canadian Dollar | C$ | 2 | before | Canada |
| AUD | Australian Dollar | A$ | 2 | before | Australia |

---

## 3. Backend Implementation

### 3.1 Currency Helper

**File:** `app/Helpers/CurrencyHelper.php`

```php
<?php

namespace App\Helpers;

use App\Models\Currency;
use Illuminate\Support\Facades\Cache;

class CurrencyHelper
{
    /**
     * Format amount with currency symbol
     */
    public static function format(float $amount, ?string $currencyCode = null): string
    {
        $currency = self::getCurrency($currencyCode);

        // Format with decimal places
        $formatted = number_format(
            $amount,
            $currency->decimal_places,
            '.',
            ','
        );

        // Add symbol based on position
        return $currency->symbol_position === 'before'
            ? $currency->symbol . $formatted
            : $formatted . $currency->symbol;
    }

    /**
     * Get currency symbol
     */
    public static function symbol(?string $currencyCode = null): string
    {
        return self::getCurrency($currencyCode)->symbol;
    }

    /**
     * Get decimal places
     */
    public static function decimals(?string $currencyCode = null): int
    {
        return self::getCurrency($currencyCode)->decimal_places;
    }

    /**
     * Get symbol position
     */
    public static function position(?string $currencyCode = null): string
    {
        return self::getCurrency($currencyCode)->symbol_position;
    }

    /**
     * Get currency object (from current company or by code)
     */
    protected static function getCurrency(?string $currencyCode = null): object
    {
        if (!$currencyCode) {
            // Get current company's currency
            $company = auth()->user()?->currentCompany;
            if (!$company) {
                // Fallback to USD
                $currencyCode = 'USD';
            } else {
                return (object) [
                    'code' => $company->currency_code,
                    'symbol' => $company->currency_symbol,
                    'decimal_places' => $company->currency_decimal_places,
                    'symbol_position' => $company->currency_symbol_position,
                ];
            }
        }

        // Load from database with caching
        return Cache::remember("currency:{$currencyCode}", 3600, function () use ($currencyCode) {
            $currency = Currency::where('code', $currencyCode)->first();

            if (!$currency) {
                // Fallback to USD
                $currency = Currency::where('code', 'USD')->first();
            }

            return (object) [
                'code' => $currency->code,
                'symbol' => $currency->symbol,
                'decimal_places' => $currency->decimal_places,
                'symbol_position' => $currency->symbol_position,
            ];
        });
    }
}
```

### 3.2 Currency Service

**File:** `app/Services/CurrencyService.php`

```php
<?php

namespace App\Services;

use App\Models\Currency;
use App\Models\Company;
use App\Helpers\CurrencyHelper;

class CurrencyService
{
    /**
     * Get current company's currency settings
     */
    public function getCompanyCurrency(): array
    {
        $company = auth()->user()->currentCompany;

        return [
            'code' => $company->currency_code,
            'symbol' => $company->currency_symbol,
            'decimal_places' => $company->currency_decimal_places,
            'symbol_position' => $company->currency_symbol_position,
            'formatted_example' => CurrencyHelper::format(1234.56, $company->currency_code),
        ];
    }

    /**
     * Format money using company currency
     */
    public function formatMoney(float $amount): string
    {
        return CurrencyHelper::format($amount);
    }

    /**
     * Get all active currencies
     */
    public function getAllCurrencies(): array
    {
        return Currency::where('active', true)
            ->orderBy('code')
            ->get()
            ->map(function ($currency) {
                return [
                    'code' => $currency->code,
                    'name' => $currency->name,
                    'symbol' => $currency->symbol,
                    'decimal_places' => $currency->decimal_places,
                    'symbol_position' => $currency->symbol_position,
                    'formatted_example' => CurrencyHelper::format(1234.56, $currency->code),
                ];
            })
            ->toArray();
    }

    /**
     * Update company currency
     */
    public function updateCompanyCurrency(string $code): bool
    {
        $currency = Currency::where('code', $code)
            ->where('active', true)
            ->firstOrFail();

        $company = auth()->user()->currentCompany;

        return $company->update([
            'currency_code' => $currency->code,
            'currency_symbol' => $currency->symbol,
            'currency_decimal_places' => $currency->decimal_places,
            'currency_symbol_position' => $currency->symbol_position,
        ]);
    }
}
```

### 3.3 Currency Model

**File:** `app/Models/Currency.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Currency extends Model
{
    protected $primaryKey = 'code';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'code',
        'name',
        'symbol',
        'decimal_places',
        'symbol_position',
        'active',
    ];

    protected $casts = [
        'decimal_places' => 'integer',
        'active' => 'boolean',
    ];

    /**
     * Scope: Active currencies only
     */
    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    /**
     * Get formatted example
     */
    public function getFormattedExampleAttribute(): string
    {
        $formatted = number_format(1234.56, $this->decimal_places, '.', ',');

        return $this->symbol_position === 'before'
            ? $this->symbol . $formatted
            : $formatted . $this->symbol;
    }
}
```

### 3.4 Currency Seeder

**File:** `database/seeders/CurrencySeeder.php`

```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CurrencySeeder extends Seeder
{
    public function run()
    {
        $currencies = [
            ['code' => 'USD', 'name' => 'US Dollar', 'symbol' => '$', 'decimal_places' => 2, 'symbol_position' => 'before', 'active' => true],
            ['code' => 'EUR', 'name' => 'Euro', 'symbol' => '€', 'decimal_places' => 2, 'symbol_position' => 'before', 'active' => true],
            ['code' => 'GBP', 'name' => 'British Pound', 'symbol' => '£', 'decimal_places' => 2, 'symbol_position' => 'before', 'active' => true],
            ['code' => 'AZN', 'name' => 'Azerbaijani Manat', 'symbol' => '₼', 'decimal_places' => 2, 'symbol_position' => 'after', 'active' => true],
            ['code' => 'TRY', 'name' => 'Turkish Lira', 'symbol' => '₺', 'decimal_places' => 2, 'symbol_position' => 'before', 'active' => true],
            ['code' => 'RUB', 'name' => 'Russian Ruble', 'symbol' => '₽', 'decimal_places' => 2, 'symbol_position' => 'after', 'active' => true],
            ['code' => 'JPY', 'name' => 'Japanese Yen', 'symbol' => '¥', 'decimal_places' => 0, 'symbol_position' => 'before', 'active' => true],
            ['code' => 'CNY', 'name' => 'Chinese Yuan', 'symbol' => '¥', 'decimal_places' => 2, 'symbol_position' => 'before', 'active' => true],
            ['code' => 'INR', 'name' => 'Indian Rupee', 'symbol' => '₹', 'decimal_places' => 2, 'symbol_position' => 'before', 'active' => true],
            ['code' => 'SAR', 'name' => 'Saudi Riyal', 'symbol' => '﷼', 'decimal_places' => 2, 'symbol_position' => 'before', 'active' => true],
            ['code' => 'AED', 'name' => 'UAE Dirham', 'symbol' => 'د.إ', 'decimal_places' => 2, 'symbol_position' => 'before', 'active' => true],
            ['code' => 'CAD', 'name' => 'Canadian Dollar', 'symbol' => 'C$', 'decimal_places' => 2, 'symbol_position' => 'before', 'active' => true],
            ['code' => 'AUD', 'name' => 'Australian Dollar', 'symbol' => 'A$', 'decimal_places' => 2, 'symbol_position' => 'before', 'active' => true],
        ];

        DB::table('currencies')->insert($currencies);
    }
}
```

---

## 4. API Endpoints

### 4.1 Routes

**File:** `routes/api.php`

```php
use App\Http\Controllers\CurrencyController;

Route::middleware('auth:sanctum')->group(function () {
    // Get all currencies
    Route::get('/currencies', [CurrencyController::class, 'index']);

    // Get current company currency
    Route::get('/company/currency', [CurrencyController::class, 'show']);

    // Update company currency
    Route::put('/company/currency', [CurrencyController::class, 'update']);
});
```

### 4.2 Controller

**File:** `app/Http/Controllers/CurrencyController.php`

```php
<?php

namespace App\Http\Controllers;

use App\Services\CurrencyService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class CurrencyController extends Controller
{
    protected $currencyService;

    public function __construct(CurrencyService $currencyService)
    {
        $this->currencyService = $currencyService;
    }

    /**
     * Get all active currencies
     */
    public function index()
    {
        $currencies = $this->currencyService->getAllCurrencies();

        return response()->json($currencies);
    }

    /**
     * Get current company's currency
     */
    public function show()
    {
        Gate::authorize('access-account-data');

        $currency = $this->currencyService->getCompanyCurrency();

        return response()->json($currency);
    }

    /**
     * Update company currency
     */
    public function update(Request $request)
    {
        Gate::authorize('manage-settings');

        $request->validate([
            'code' => 'required|exists:currencies,code',
        ]);

        $this->currencyService->updateCompanyCurrency($request->code);

        return response()->json([
            'message' => 'Currency updated successfully',
            'currency' => $this->currencyService->getCompanyCurrency(),
        ]);
    }
}
```

---

## 5. Frontend Implementation

### 5.1 Currency Utility

**File:** `resources/js/Utils/currency.ts`

```typescript
export interface Currency {
    code: string;
    symbol: string;
    decimal_places: number;
    symbol_position: 'before' | 'after';
}

/**
 * Format amount with currency
 */
export function formatCurrency(
    amount: number,
    currency: Currency
): string {
    // Format number with proper decimal places
    const formatted = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: currency.decimal_places,
        maximumFractionDigits: currency.decimal_places,
    }).format(amount);

    // Add currency symbol based on position
    return currency.symbol_position === 'before'
        ? `${currency.symbol}${formatted}`
        : `${formatted}${currency.symbol}`;
}

/**
 * Format amount with default company currency
 */
export function formatMoney(amount: number): string {
    // Get currency from page props (available globally via Inertia)
    const currency = (window as any).currency;

    if (!currency) {
        // Fallback to USD
        return `$${amount.toFixed(2)}`;
    }

    return formatCurrency(amount, currency);
}

/**
 * Parse formatted currency string to number
 */
export function parseCurrency(value: string, currency: Currency): number {
    // Remove currency symbol and commas
    const cleaned = value
        .replace(currency.symbol, '')
        .replace(/,/g, '')
        .trim();

    return parseFloat(cleaned) || 0;
}
```

### 5.2 Currency Selector Component

**File:** `resources/js/Components/CurrencySelector.tsx`

```tsx
import { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';

interface Currency {
    code: string;
    name: string;
    symbol: string;
    decimal_places: number;
    symbol_position: string;
    formatted_example: string;
}

interface Props {
    value: string;
    onChange: (code: string) => void;
}

export default function CurrencySelector({ value, onChange }: Props) {
    const [currencies, setCurrencies] = useState<Currency[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch currencies from API
        fetch('/api/currencies')
            .then(res => res.json())
            .then(data => {
                setCurrencies(data);
                setLoading(false);
            })
            .catch(error => {
                console.error('Failed to load currencies:', error);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return <div>Loading currencies...</div>;
    }

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency
            </label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
                {currencies.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                        {currency.code} - {currency.name} ({currency.formatted_example})
                    </option>
                ))}
            </select>
        </div>
    );
}
```

### 5.3 Add Currency to Inertia Shared Data

**File:** `app/Http/Middleware/HandleInertiaRequests.php`

```php
public function share(Request $request): array
{
    return array_merge(parent::share($request), [
        'auth' => [
            'user' => $request->user(),
        ],
        // Add currency to shared data
        'currency' => function () use ($request) {
            if (!$request->user()) {
                return null;
            }

            $company = $request->user()->currentCompany;

            if (!$company) {
                return null;
            }

            return [
                'code' => $company->currency_code,
                'symbol' => $company->currency_symbol,
                'decimal_places' => $company->currency_decimal_places,
                'symbol_position' => $company->currency_symbol_position,
            ];
        },
    ]);
}
```

---

## 6. Integration Points

### 6.1 Onboarding Flow
Add currency selection during company setup:

```tsx
// In onboarding/registration form
<CurrencySelector
    value={data.currency_code}
    onChange={(code) => setData('currency_code', code)}
/>
```

### 6.2 Settings Page
Allow currency change in company settings:

```tsx
// In Settings page
import CurrencySelector from '@/Components/CurrencySelector';

export default function CompanySettings() {
    const { currency } = usePage().props;

    const handleCurrencyUpdate = (code: string) => {
        router.put('/api/company/currency', { code }, {
            onSuccess: () => {
                alert('Currency updated successfully');
            },
        });
    };

    return (
        <div>
            <h2>Currency Settings</h2>
            <CurrencySelector
                value={currency.code}
                onChange={handleCurrencyUpdate}
            />
            <p className="mt-2 text-sm text-gray-600">
                Current format: {currency.symbol}1,234.56
            </p>
        </div>
    );
}
```

### 6.3 Update All Price Displays
Replace hardcoded price formatting:

```tsx
// Before:
<span>{product.price} AZN</span>

// After:
import { formatMoney } from '@/Utils/currency';

<span>{formatMoney(product.price)}</span>
```

---

## 7. Testing

### 7.1 Backend Tests

```php
// tests/Feature/CurrencyTest.php
public function test_can_get_all_currencies()
{
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->getJson('/api/currencies');

    $response->assertOk()
        ->assertJsonCount(13); // 13 currencies seeded
}

public function test_can_update_company_currency()
{
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->putJson('/api/company/currency', ['code' => 'EUR']);

    $response->assertOk();

    $this->assertEquals('EUR', $user->currentCompany->fresh()->currency_code);
    $this->assertEquals('€', $user->currentCompany->fresh()->currency_symbol);
}

public function test_currency_helper_formats_correctly()
{
    // USD: before, 2 decimals
    $formatted = CurrencyHelper::format(1234.56, 'USD');
    $this->assertEquals('$1,234.56', $formatted);

    // AZN: after, 2 decimals
    $formatted = CurrencyHelper::format(1234.56, 'AZN');
    $this->assertEquals('1,234.56₼', $formatted);

    // JPY: before, 0 decimals
    $formatted = CurrencyHelper::format(1234.56, 'JPY');
    $this->assertEquals('¥1,235', $formatted);
}
```

### 7.2 Frontend Tests

Test different currencies visually:
1. Set currency to USD → Verify prices show as $100.00
2. Set currency to EUR → Verify prices show as €100.00
3. Set currency to AZN → Verify prices show as 100.00₼
4. Set currency to JPY → Verify prices show as ¥100 (no decimals)

---

## 8. Migration Path

For existing customers with AZN hardcoded:

```php
// Migration to set existing companies to AZN
Schema::table('companies', function (Blueprint $table) {
    // Existing companies default to AZN
    DB::table('companies')->update([
        'currency_code' => 'AZN',
        'currency_symbol' => '₼',
        'currency_decimal_places' => 2,
        'currency_symbol_position' => 'after',
    ]);
});
```

---

## 9. Future Enhancements (Optional)

### 9.1 Exchange Rate Conversion (If Needed Later)
If you want to support multi-currency pricing or reporting:

```php
Schema::create('exchange_rates', function (Blueprint $table) {
    $table->id();
    $table->string('from_currency', 3);
    $table->string('to_currency', 3);
    $table->decimal('rate', 16, 8);
    $table->date('date');
    $table->timestamps();

    $table->unique(['from_currency', 'to_currency', 'date']);
});
```

### 9.2 Multi-Currency Product Pricing
Allow products to have prices in multiple currencies:

```php
Schema::create('product_prices', function (Blueprint $table) {
    $table->id();
    $table->foreignId('product_id')->constrained();
    $table->string('currency_code', 3);
    $table->decimal('price', 10, 2);
    $table->timestamps();

    $table->unique(['product_id', 'currency_code']);
});
```

---

## 10. Timeline

| Task | Time | Complexity |
|------|------|-----------|
| Create Currency model & seeder | 1 hour | Low |
| Create CurrencyHelper | 1 hour | Low |
| Create CurrencyService | 1 hour | Low |
| Create API endpoints & controller | 2 hours | Medium |
| Create frontend currency utility | 1 hour | Low |
| Create CurrencySelector component | 2 hours | Medium |
| Add to Inertia shared data | 30 mins | Low |
| Add to onboarding flow | 1 hour | Medium |
| Add to settings page | 1 hour | Medium |
| Update all price displays | 3-4 hours | Medium |
| Testing | 2 hours | Medium |
| **TOTAL** | **15-16 hours** | **~2 days** |

---

**Document Version:** 1.0
**Last Updated:** 2025-12-09
**Status:** Ready for Implementation
