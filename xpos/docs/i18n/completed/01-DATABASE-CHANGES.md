# Database Changes for Internationalization

## Overview
This document outlines all database schema changes required to support multi-language functionality in XPOS.

## Current State
- **Database enums**: Azerbaijani values (`'nağd'`, `'kart'`, `'köçürmə'`, etc.)
- **Language support**: Account-level `language` field exists but unused
- **Currency**: Hardcoded AZN
- **Test data only**: 3 accounts, 52 sales, 204 customers (can be cleared)

## Target State
- **Database enums**: English values (`'cash'`, `'card'`, `'bank_transfer'`, etc.)
- **Language support**: Active account + user level language preferences
- **Currency**: Multi-currency support with per-account configuration
- **Clean migration**: Fresh start with international-friendly schema

---

## 1. Enum Value Migrations

### 1.1 Payment Methods

**Current Values (Azerbaijani):**
```php
'nağd'          // Cash
'kart'          // Card
'köçürmə'       // Bank transfer
'bank_kredit'   // Bank credit
'hədiyyə_kartı' // Gift card
```

**New Values (English):**
```php
'cash'
'card'
'bank_transfer'
'bank_credit'
'gift_card'
```

**Affected Tables:**
- `payments` - `method` column
- `sales` - `payment_method` column (if exists)
- `returns` - payment method tracking
- `fiscal_printer_jobs` - payment method in receipt data

**Migration Required:**
```php
// Migration: update_payment_method_enum_to_english.php
DB::statement("
    UPDATE payments
    SET method = CASE
        WHEN method = 'nağd' THEN 'cash'
        WHEN method = 'kart' THEN 'card'
        WHEN method = 'köçürmə' THEN 'bank_transfer'
        WHEN method = 'bank_kredit' THEN 'bank_credit'
        WHEN method = 'hədiyyə_kartı' THEN 'gift_card'
        ELSE method
    END
");

// Update enum constraint if exists
DB::statement("
    ALTER TABLE payments
    DROP CONSTRAINT IF EXISTS payments_method_check;

    ALTER TABLE payments
    ADD CONSTRAINT payments_method_check
    CHECK (method IN ('cash', 'card', 'bank_transfer', 'bank_credit', 'gift_card'))
");
```

### 1.2 Expense Types

**Current Values (Azerbaijani):**
```php
'maaş'         // Salary
'xərclər'      // Expenses
'ödənişlər'    // Payments
'kommunal'     // Utilities
'nəqliyyat'    // Transport
'digər'        // Other
```

**New Values (English):**
```php
'salary'
'expenses'
'payments'
'utilities'
'transport'
'other'
```

**Affected Tables:**
- `expenses` - `type` column

**Migration Required:**
```php
DB::statement("
    UPDATE expenses
    SET type = CASE
        WHEN type = 'maaş' THEN 'salary'
        WHEN type = 'xərclər' THEN 'expenses'
        WHEN type = 'ödənişlər' THEN 'payments'
        WHEN type = 'kommunal' THEN 'utilities'
        WHEN type = 'nəqliyyat' THEN 'transport'
        WHEN type = 'digər' THEN 'other'
        ELSE type
    END
");
```

### 1.3 Subscription Plans

**Current Values (Azerbaijani):**
```php
'başlanğıc'     // Basic/Starter
'professional'  // Professional (already English)
'enterprise'    // Enterprise (already English)
```

**New Values (English):**
```php
'starter'
'professional'
'enterprise'
```

**Affected Tables:**
- `subscriptions` - `plan` column
- `accounts` - `subscription_plan` column

**Migration Required:**
```php
DB::statement("
    UPDATE subscriptions
    SET plan = 'starter'
    WHERE plan = 'başlanğıc'
");

DB::statement("
    UPDATE accounts
    SET subscription_plan = 'starter'
    WHERE subscription_plan = 'başlanğıc'
");
```

---

## 2. New Columns for Language Support

### 2.1 Add User-Level Language Preference

**Table:** `users`

**New Column:**
```php
Schema::table('users', function (Blueprint $table) {
    $table->string('language', 5)->nullable()->after('email');
    $table->index('language');
});
```

**Purpose:**
- Allow individual users to override account-level language
- Falls back to `accounts.language` if null

### 2.2 Update Account Language Column

**Table:** `accounts`

**Update:**
```php
Schema::table('accounts', function (Blueprint $table) {
    $table->string('language', 5)->default('en')->change();
    // Change default from 'az' to 'en'
});
```

**Supported Languages (Initially):**
- `'en'` - English (default)
- `'az'` - Azerbaijani

---

## 3. Currency Support

### 3.1 Add Currency Columns to Companies

**Table:** `companies`

**New Columns:**
```php
Schema::table('companies', function (Blueprint $table) {
    $table->string('currency_code', 3)->default('USD')->after('default_language');
    $table->string('currency_symbol', 10)->default('$')->after('currency_code');
    $table->unsignedTinyInteger('currency_decimal_places')->default(2)->after('currency_symbol');
    $table->enum('currency_symbol_position', ['before', 'after'])->default('before')->after('currency_decimal_places');

    $table->index('currency_code');
});
```

**Fields Explanation:**
- `currency_code`: ISO 4217 code (USD, EUR, AZN, GBP, TRY, etc.)
- `currency_symbol`: Display symbol ($, €, ₼, £, ₺)
- `currency_decimal_places`: Number of decimal places (2 for most, 0 for JPY, 3 for KWD)
- `currency_symbol_position`: Where to place symbol ($100 vs 100$)

### 3.2 Currency Reference Table (Optional)

Create a currencies reference table for supported currencies:

```php
Schema::create('currencies', function (Blueprint $table) {
    $table->string('code', 3)->primary(); // ISO 4217
    $table->string('name', 100);
    $table->string('symbol', 10);
    $table->unsignedTinyInteger('decimal_places')->default(2);
    $table->enum('symbol_position', ['before', 'after'])->default('before');
    $table->boolean('active')->default(true);
    $table->timestamps();
});
```

**Seed Data:**
```php
// CurrencySeeder.php
$currencies = [
    ['code' => 'USD', 'name' => 'US Dollar', 'symbol' => '$', 'decimal_places' => 2, 'symbol_position' => 'before'],
    ['code' => 'EUR', 'name' => 'Euro', 'symbol' => '€', 'decimal_places' => 2, 'symbol_position' => 'before'],
    ['code' => 'GBP', 'name' => 'British Pound', 'symbol' => '£', 'decimal_places' => 2, 'symbol_position' => 'before'],
    ['code' => 'AZN', 'name' => 'Azerbaijani Manat', 'symbol' => '₼', 'decimal_places' => 2, 'symbol_position' => 'after'],
    ['code' => 'TRY', 'name' => 'Turkish Lira', 'symbol' => '₺', 'decimal_places' => 2, 'symbol_position' => 'before'],
    ['code' => 'RUB', 'name' => 'Russian Ruble', 'symbol' => '₽', 'decimal_places' => 2, 'symbol_position' => 'after'],
    ['code' => 'JPY', 'name' => 'Japanese Yen', 'symbol' => '¥', 'decimal_places' => 0, 'symbol_position' => 'before'],
    ['code' => 'CNY', 'name' => 'Chinese Yuan', 'symbol' => '¥', 'decimal_places' => 2, 'symbol_position' => 'before'],
    ['code' => 'INR', 'name' => 'Indian Rupee', 'symbol' => '₹', 'decimal_places' => 2, 'symbol_position' => 'before'],
];

DB::table('currencies')->insert($currencies);
```

---

## 4. Fiscal Printer Configuration Updates

### 4.1 Make Tax Name Translatable

**Table:** `fiscal_printer_configs`

**Current:**
```php
$table->string('default_tax_name')->default('ƏDV'); // Azerbaijani VAT
```

**Update:**
Since fiscal printer is Azerbaijan-specific, keep as-is but allow customization:

```php
Schema::table('fiscal_printer_configs', function (Blueprint $table) {
    $table->string('default_tax_name')->default('VAT')->change();
    // Change default from 'ƏDV' to 'VAT'
});
```

**Note:** For Azerbaijani accounts, this will be set to 'ƏDV' during fiscal printer setup.

---

## 5. Translation Tables (Optional - Future Enhancement)

For future support of translatable content (product names, category names, etc.):

### 5.1 Polymorphic Translations Table

```php
Schema::create('translations', function (Blueprint $table) {
    $table->id();
    $table->morphs('translatable'); // translatable_type, translatable_id
    $table->string('locale', 5);
    $table->string('key', 100); // field name being translated
    $table->text('value');
    $table->timestamps();

    $table->unique(['translatable_type', 'translatable_id', 'locale', 'key']);
    $table->index(['translatable_type', 'locale']);
});
```

**Usage Example (Future):**
```php
// Product translations
Translation::create([
    'translatable_type' => 'App\Models\Product',
    'translatable_id' => 1,
    'locale' => 'en',
    'key' => 'name',
    'value' => 'Leather Jacket'
]);

Translation::create([
    'translatable_type' => 'App\Models\Product',
    'translatable_id' => 1,
    'locale' => 'az',
    'key' => 'name',
    'value' => 'Dəri Gödəkçə'
]);
```

**Note:** This is OPTIONAL for Phase 1. Start without this - add later if customers request multi-language product catalogs.

---

## 6. Migration Execution Plan

### Phase 1: Backup & Preparation
```bash
# 1. Backup current database
php artisan db:backup

# 2. Clear test data (since it's all test)
php artisan db:wipe
php artisan migrate:fresh
```

### Phase 2: Create New Migrations

**Migration Files to Create:**
1. `2025_12_09_001_update_payment_method_enums.php`
2. `2025_12_09_002_update_expense_type_enums.php`
3. `2025_12_09_003_update_subscription_plan_enums.php`
4. `2025_12_09_004_add_user_language_column.php`
5. `2025_12_09_005_add_currency_support_to_companies.php`
6. `2025_12_09_006_create_currencies_table.php`
7. `2025_12_09_007_update_fiscal_printer_defaults.php`

### Phase 3: Code Updates Required

**Files to Update:**
- `app/Models/Payment.php` - Update casts and constants
- `app/Models/Expense.php` - Update type constants
- `app/Models/Account.php` - Update language default
- `app/Services/FiscalPrinterService.php` - Update payment method checks
- All Request validation classes - Update enum validation rules
- All seeders - Update with English values

---

## 7. Validation Rules Updates

### Before:
```php
// StorePaymentRequest.php
'method' => ['required', 'in:nağd,kart,köçürmə,bank_kredit,hədiyyə_kartı'],
```

### After:
```php
// StorePaymentRequest.php
'method' => ['required', 'in:cash,card,bank_transfer,bank_credit,gift_card'],

// Or better, use enum class:
'method' => ['required', new Enum(PaymentMethod::class)],
```

### Create Enum Classes:
```php
// app/Enums/PaymentMethod.php
enum PaymentMethod: string
{
    case CASH = 'cash';
    case CARD = 'card';
    case BANK_TRANSFER = 'bank_transfer';
    case BANK_CREDIT = 'bank_credit';
    case GIFT_CARD = 'gift_card';
}
```

---

## 8. Data Integrity Checks

### Post-Migration Validation:
```php
// Check all payment methods are valid
DB::table('payments')
    ->whereNotIn('method', ['cash', 'card', 'bank_transfer', 'bank_credit', 'gift_card'])
    ->count(); // Should return 0

// Check all expense types are valid
DB::table('expenses')
    ->whereNotIn('type', ['salary', 'expenses', 'payments', 'utilities', 'transport', 'other'])
    ->count(); // Should return 0

// Check all accounts have valid language
DB::table('accounts')
    ->whereNotIn('language', ['en', 'az'])
    ->count(); // Should return 0
```

---

## 9. Rollback Plan

If issues arise, rollback with:

```bash
# Rollback last batch of migrations
php artisan migrate:rollback

# Or restore from backup
php artisan db:restore backup_file_name.sql
```

---

## 10. Timeline Estimate

| Task | Time | Complexity |
|------|------|-----------|
| Create enum migration files | 2-3 hours | Medium |
| Create currency tables & seeders | 1-2 hours | Low |
| Add language columns | 30 mins | Low |
| Update model constants | 2-3 hours | Medium |
| Update validation rules | 2-3 hours | Medium |
| Create Enum classes | 1 hour | Low |
| Testing & validation | 2-3 hours | Medium |
| **TOTAL** | **11-15 hours** | **~2 days** |

---

## 11. Critical Notes

⚠️ **Before running migrations:**
1. Confirm all data is test data
2. Create full database backup
3. Test on local environment first
4. Update `.env` to set `APP_LOCALE=en`

✅ **After migrations:**
1. Run data integrity checks
2. Test payment processing
3. Test fiscal printer (if enabled)
4. Verify all enum dropdowns work

---

## Next Steps

After database changes complete:
1. ➡️ See `02-TRANSLATION-SETUP.md` for backend/frontend i18n setup
2. ➡️ See `03-CURRENCY-SUPPORT.md` for currency formatting implementation
3. ➡️ See `04-LANGUAGE-SWITCHING.md` for language switcher UI

---

**Document Version:** 1.0
**Last Updated:** 2025-12-09
**Status:** Draft - Awaiting Review
