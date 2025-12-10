# Translation Implementation Guide

## Overview
This document covers the complete setup of translation infrastructure for both Laravel backend and React frontend.

---

## Part 1: Backend Translation (Laravel)

### 1.1 Directory Structure

Create the following structure:

```
xpos/
├── lang/
│   ├── en/
│   │   ├── common.php
│   │   ├── validation.php
│   │   ├── auth.php
│   │   ├── models.php
│   │   ├── enums.php
│   │   ├── messages.php
│   │   └── fiscal.php
│   └── az/
│       ├── common.php
│       ├── validation.php
│       ├── auth.php
│       ├── models.php
│       ├── enums.php
│       ├── messages.php
│       └── fiscal.php
```

### 1.2 Translation Files Content

#### `lang/en/common.php`
```php
<?php

return [
    'save' => 'Save',
    'cancel' => 'Cancel',
    'delete' => 'Delete',
    'edit' => 'Edit',
    'create' => 'Create',
    'update' => 'Update',
    'search' => 'Search',
    'filter' => 'Filter',
    'export' => 'Export',
    'import' => 'Import',
    'print' => 'Print',
    'download' => 'Download',
    'upload' => 'Upload',
    'submit' => 'Submit',
    'reset' => 'Reset',
    'back' => 'Back',
    'next' => 'Next',
    'previous' => 'Previous',
    'close' => 'Close',
    'confirm' => 'Confirm',
    'yes' => 'Yes',
    'no' => 'No',
    'select' => 'Select',
    'select_all' => 'Select All',
    'deselect_all' => 'Deselect All',
    'actions' => 'Actions',
    'options' => 'Options',
    'settings' => 'Settings',
    'total' => 'Total',
    'subtotal' => 'Subtotal',
    'tax' => 'Tax',
    'discount' => 'Discount',
    'date' => 'Date',
    'time' => 'Time',
    'status' => 'Status',
    'active' => 'Active',
    'inactive' => 'Inactive',
    'enabled' => 'Enabled',
    'disabled' => 'Disabled',
    'required' => 'Required',
    'optional' => 'Optional',
];
```

#### `lang/az/common.php`
```php
<?php

return [
    'save' => 'Yadda saxla',
    'cancel' => 'Ləğv et',
    'delete' => 'Sil',
    'edit' => 'Redaktə et',
    'create' => 'Yarat',
    'update' => 'Yenilə',
    'search' => 'Axtar',
    'filter' => 'Filtr',
    'export' => 'İxrac',
    'import' => 'İdxal',
    'print' => 'Çap et',
    'download' => 'Yüklə',
    'upload' => 'Yüklə',
    'submit' => 'Təsdiq et',
    'reset' => 'Sıfırla',
    'back' => 'Geri',
    'next' => 'Növbəti',
    'previous' => 'Əvvəlki',
    'close' => 'Bağla',
    'confirm' => 'Təsdiq et',
    'yes' => 'Bəli',
    'no' => 'Xeyr',
    'select' => 'Seç',
    'select_all' => 'Hamısını seç',
    'deselect_all' => 'Seçimi ləğv et',
    'actions' => 'Əməliyyatlar',
    'options' => 'Seçimlər',
    'settings' => 'Tənzimləmələr',
    'total' => 'Cəmi',
    'subtotal' => 'Ara cəmi',
    'tax' => 'Vergi',
    'discount' => 'Endirim',
    'date' => 'Tarix',
    'time' => 'Vaxt',
    'status' => 'Status',
    'active' => 'Aktiv',
    'inactive' => 'Qeyri-aktiv',
    'enabled' => 'Aktiv',
    'disabled' => 'Qeyri-aktiv',
    'required' => 'Məcburi',
    'optional' => 'İstəyə bağlı',
];
```

#### `lang/en/enums.php`
```php
<?php

return [
    'payment_methods' => [
        'cash' => 'Cash',
        'card' => 'Card',
        'bank_transfer' => 'Bank Transfer',
        'bank_credit' => 'Bank Credit',
        'gift_card' => 'Gift Card',
    ],

    'expense_types' => [
        'salary' => 'Salary',
        'expenses' => 'Expenses',
        'payments' => 'Payments',
        'utilities' => 'Utilities',
        'transport' => 'Transport',
        'other' => 'Other',
    ],

    'subscription_plans' => [
        'starter' => 'Starter',
        'professional' => 'Professional',
        'enterprise' => 'Enterprise',
    ],

    'user_roles' => [
        'admin' => 'Admin',
        'manager' => 'Manager',
        'cashier' => 'Cashier',
        'staff' => 'Staff',
    ],

    'sale_statuses' => [
        'pending' => 'Pending',
        'completed' => 'Completed',
        'cancelled' => 'Cancelled',
        'refunded' => 'Refunded',
    ],
];
```

#### `lang/az/enums.php`
```php
<?php

return [
    'payment_methods' => [
        'cash' => 'Nağd',
        'card' => 'Kart',
        'bank_transfer' => 'Bank köçürməsi',
        'bank_credit' => 'Bank krediti',
        'gift_card' => 'Hədiyyə kartı',
    ],

    'expense_types' => [
        'salary' => 'Maaş',
        'expenses' => 'Xərclər',
        'payments' => 'Ödənişlər',
        'utilities' => 'Kommunal',
        'transport' => 'Nəqliyyat',
        'other' => 'Digər',
    ],

    'subscription_plans' => [
        'starter' => 'Başlanğıc',
        'professional' => 'Professional',
        'enterprise' => 'Korporativ',
    ],

    'user_roles' => [
        'admin' => 'Administrator',
        'manager' => 'Menecer',
        'cashier' => 'Kassir',
        'staff' => 'İşçi',
    ],

    'sale_statuses' => [
        'pending' => 'Gözləyir',
        'completed' => 'Tamamlandı',
        'cancelled' => 'Ləğv edildi',
        'refunded' => 'Geri qaytarıldı',
    ],
];
```

#### `lang/en/validation.php`
```php
<?php

return [
    'required' => 'The :attribute field is required.',
    'required_if' => 'The :attribute field is required when :other is :value.',
    'min' => [
        'numeric' => 'The :attribute must be at least :min.',
        'string' => 'The :attribute must be at least :min characters.',
    ],
    'max' => [
        'numeric' => 'The :attribute may not be greater than :max.',
        'string' => 'The :attribute may not be greater than :max characters.',
    ],
    'email' => 'The :attribute must be a valid email address.',
    'unique' => 'The :attribute has already been taken.',
    'exists' => 'The selected :attribute is invalid.',
    'in' => 'The selected :attribute is invalid.',
    'numeric' => 'The :attribute must be a number.',
    'integer' => 'The :attribute must be an integer.',
    'string' => 'The :attribute must be a string.',
    'array' => 'The :attribute must be an array.',
    'date' => 'The :attribute is not a valid date.',
    'after' => 'The :attribute must be a date after :date.',
    'before' => 'The :attribute must be a date before :date.',

    // Custom validation messages
    'custom' => [
        'amount' => [
            'min' => 'Payment amount must be at least :min :currency.',
        ],
        'collateral_amount' => [
            'required_if' => 'Cash deposit amount must be entered.',
        ],
        'items' => [
            'required' => 'At least one product must be added.',
        ],
        'method' => [
            'in' => 'Invalid payment method selected.',
        ],
    ],

    'attributes' => [
        'email' => 'email address',
        'password' => 'password',
        'name' => 'name',
        'amount' => 'amount',
        'method' => 'payment method',
        'phone' => 'phone number',
        'address' => 'address',
        'tax_number' => 'tax number',
        'voen' => 'VOEN',
    ],
];
```

#### `lang/az/validation.php`
```php
<?php

return [
    'required' => ':attribute daxil edilməlidir.',
    'required_if' => ':other :value olduqda :attribute daxil edilməlidir.',
    'min' => [
        'numeric' => ':attribute ən azı :min olmalıdır.',
        'string' => ':attribute ən azı :min simvol olmalıdır.',
    ],
    'max' => [
        'numeric' => ':attribute maksimum :max ola bilər.',
        'string' => ':attribute maksimum :max simvol ola bilər.',
    ],
    'email' => ':attribute düzgün email ünvanı olmalıdır.',
    'unique' => 'Bu :attribute artıq mövcuddur.',
    'exists' => 'Seçilmiş :attribute yanlışdır.',
    'in' => 'Seçilmiş :attribute yanlışdır.',
    'numeric' => ':attribute rəqəm olmalıdır.',
    'integer' => ':attribute tam ədəd olmalıdır.',
    'string' => ':attribute mətn olmalıdır.',
    'array' => ':attribute massiv olmalıdır.',
    'date' => ':attribute düzgün tarix deyil.',
    'after' => ':attribute :date tarixindən sonra olmalıdır.',
    'before' => ':attribute :date tarixindən əvvəl olmalıdır.',

    // Custom validation messages
    'custom' => [
        'amount' => [
            'min' => 'Ödəniş məbləği minimum :min :currency olmalıdır.',
        ],
        'collateral_amount' => [
            'required_if' => 'Nağd depozit məbləği daxil edilməlidir.',
        ],
        'items' => [
            'required' => 'Ən azı bir məhsul əlavə edilməlidir.',
        ],
        'method' => [
            'in' => 'Yanlış ödəniş üsulu seçildi.',
        ],
    ],

    'attributes' => [
        'email' => 'email ünvanı',
        'password' => 'şifrə',
        'name' => 'ad',
        'amount' => 'məbləğ',
        'method' => 'ödəniş üsulu',
        'phone' => 'telefon nömrəsi',
        'address' => 'ünvan',
        'tax_number' => 'vergi nömrəsi',
        'voen' => 'VÖEN',
    ],
];
```

### 1.3 Language Detection Middleware

Create middleware to set the application locale based on account/user preference:

**File:** `app/Http/Middleware/SetLocale.php`

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Auth;

class SetLocale
{
    public function handle(Request $request, Closure $next)
    {
        // Default locale
        $locale = config('app.locale', 'en');

        // If user is authenticated, check their language preference
        if (Auth::check()) {
            $user = Auth::user();

            // 1. First priority: User's personal language preference
            if ($user->language) {
                $locale = $user->language;
            }
            // 2. Second priority: Account's default language
            elseif ($user->account && $user->account->language) {
                $locale = $user->account->language;
            }
            // 3. Third priority: Company's default language
            elseif ($user->currentCompany && $user->currentCompany->default_language) {
                $locale = $user->currentCompany->default_language;
            }
        }

        // For API requests, allow language override via header
        if ($request->hasHeader('X-Locale')) {
            $requestedLocale = $request->header('X-Locale');
            if (in_array($requestedLocale, ['en', 'az'])) {
                $locale = $requestedLocale;
            }
        }

        // Set the application locale
        App::setLocale($locale);

        return $next($request);
    }
}
```

**Register in:** `app/Http/Kernel.php`

```php
protected $middlewareGroups = [
    'web' => [
        // ... other middleware
        \App\Http\Middleware\SetLocale::class,
    ],

    'api' => [
        // ... other middleware
        \App\Http\Middleware\SetLocale::class,
    ],
];
```

### 1.4 Translation Helper Service

Create a service for consistent translation handling:

**File:** `app/Services/TranslationService.php`

```php
<?php

namespace App\Services;

class TranslationService
{
    /**
     * Translate enum value
     */
    public static function enum(string $type, string $value): string
    {
        return __("enums.{$type}.{$value}");
    }

    /**
     * Get all translations for an enum type
     */
    public static function enumOptions(string $type): array
    {
        $translations = __("enums.{$type}");

        if (!is_array($translations)) {
            return [];
        }

        return $translations;
    }

    /**
     * Translate payment method
     */
    public static function paymentMethod(string $method): string
    {
        return self::enum('payment_methods', $method);
    }

    /**
     * Translate expense type
     */
    public static function expenseType(string $type): string
    {
        return self::enum('expense_types', $type);
    }

    /**
     * Get current locale
     */
    public static function currentLocale(): string
    {
        return app()->getLocale();
    }

    /**
     * Check if current locale is Azerbaijani
     */
    public static function isAzerbaijani(): bool
    {
        return self::currentLocale() === 'az';
    }

    /**
     * Check if current locale is English
     */
    public static function isEnglish(): bool
    {
        return self::currentLocale() === 'en';
    }
}
```

### 1.5 Update API Resources to Include Translations

**Example:** `app/Http/Resources/PaymentResource.php`

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use App\Services\TranslationService;

class PaymentResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'amount' => $this->amount,
            'method' => $this->method, // Keep original value
            'method_label' => TranslationService::paymentMethod($this->method), // Translated label
            'date' => $this->created_at->format('Y-m-d H:i:s'),
            // ... other fields
        ];
    }
}
```

---

## Part 2: Frontend Translation (React + i18next)

### 2.1 Install Dependencies

```bash
cd xpos
npm install i18next react-i18next i18next-http-backend i18next-browser-languagedetector
```

### 2.2 Directory Structure

```
xpos/resources/js/
├── i18n/
│   ├── index.ts
│   ├── locales/
│   │   ├── en/
│   │   │   ├── common.json
│   │   │   ├── products.json
│   │   │   ├── sales.json
│   │   │   ├── customers.json
│   │   │   ├── inventory.json
│   │   │   ├── reports.json
│   │   │   └── settings.json
│   │   └── az/
│   │       ├── common.json
│   │       ├── products.json
│   │       ├── sales.json
│   │       ├── customers.json
│   │       ├── inventory.json
│   │       ├── reports.json
│   │       └── settings.json
├── hooks/
│   └── useTranslation.ts
└── types/
    └── i18next.d.ts
```

### 2.3 i18next Configuration

**File:** `resources/js/i18n/index.ts`

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import commonEN from './locales/en/common.json';
import commonAZ from './locales/az/common.json';
import productsEN from './locales/en/products.json';
import productsAZ from './locales/az/products.json';
import salesEN from './locales/en/sales.json';
import salesAZ from './locales/az/sales.json';
import customersEN from './locales/en/customers.json';
import customersAZ from './locales/az/customers.json';

const resources = {
    en: {
        common: commonEN,
        products: productsEN,
        sales: salesEN,
        customers: customersEN,
    },
    az: {
        common: commonAZ,
        products: productsAZ,
        sales: salesAZ,
        customers: customersAZ,
    },
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        defaultNS: 'common',
        ns: ['common', 'products', 'sales', 'customers'],

        interpolation: {
            escapeValue: false, // React already escapes
        },

        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
            lookupLocalStorage: 'i18nextLng',
        },

        react: {
            useSuspense: false,
        },
    });

export default i18n;
```

### 2.4 Translation Files

#### `resources/js/i18n/locales/en/common.json`

```json
{
  "actions": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "create": "Create",
    "update": "Update",
    "search": "Search",
    "filter": "Filter",
    "export": "Export",
    "import": "Import",
    "print": "Print",
    "close": "Close",
    "confirm": "Confirm",
    "back": "Back",
    "next": "Next"
  },
  "labels": {
    "total": "Total",
    "subtotal": "Subtotal",
    "tax": "Tax",
    "discount": "Discount",
    "date": "Date",
    "time": "Time",
    "status": "Status",
    "active": "Active",
    "inactive": "Inactive"
  },
  "messages": {
    "success": "Operation completed successfully",
    "error": "An error occurred",
    "confirm_delete": "Are you sure you want to delete this item?",
    "no_data": "No data available"
  }
}
```

#### `resources/js/i18n/locales/az/common.json`

```json
{
  "actions": {
    "save": "Yadda saxla",
    "cancel": "Ləğv et",
    "delete": "Sil",
    "edit": "Redaktə et",
    "create": "Yarat",
    "update": "Yenilə",
    "search": "Axtar",
    "filter": "Filtr",
    "export": "İxrac",
    "import": "İdxal",
    "print": "Çap et",
    "close": "Bağla",
    "confirm": "Təsdiq et",
    "back": "Geri",
    "next": "Növbəti"
  },
  "labels": {
    "total": "Cəmi",
    "subtotal": "Ara cəmi",
    "tax": "Vergi",
    "discount": "Endirim",
    "date": "Tarix",
    "time": "Vaxt",
    "status": "Status",
    "active": "Aktiv",
    "inactive": "Qeyri-aktiv"
  },
  "messages": {
    "success": "Əməliyyat uğurla tamamlandı",
    "error": "Xəta baş verdi",
    "confirm_delete": "Bu elementi silmək istədiyinizə əminsiniz?",
    "no_data": "Məlumat yoxdur"
  }
}
```

#### `resources/js/i18n/locales/en/products.json`

```json
{
  "title": "Products",
  "new_product": "New Product",
  "edit_product": "Edit Product",
  "product_name": "Product Name",
  "product_code": "Product Code",
  "barcode": "Barcode",
  "price": "Price",
  "cost": "Cost",
  "quantity": "Quantity",
  "category": "Category",
  "stock": "Stock",
  "low_stock": "Low Stock",
  "out_of_stock": "Out of Stock",
  "in_stock": "In Stock"
}
```

#### `resources/js/i18n/locales/az/products.json`

```json
{
  "title": "Məhsullar",
  "new_product": "Yeni Məhsul",
  "edit_product": "Məhsulu Redaktə Et",
  "product_name": "Məhsulun Adı",
  "product_code": "Məhsul Kodu",
  "barcode": "Barkod",
  "price": "Qiymət",
  "cost": "Dəyər",
  "quantity": "Miqdar",
  "category": "Kateqoriya",
  "stock": "Stok",
  "low_stock": "Az Stok",
  "out_of_stock": "Stokda Yoxdur",
  "in_stock": "Stokda Var"
}
```

### 2.5 Initialize i18n in App

**File:** `resources/js/app.tsx`

```typescript
import './bootstrap';
import '../css/app.css';

import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';

// Import i18n configuration
import './i18n';

const appName = window.document.getElementsByTagName('title')[0]?.innerText || 'XPOS';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});
```

### 2.6 Usage in Components

**Before:**
```tsx
// Products/Index.tsx
<h1>Məhsullar</h1>
<button>Yeni Məhsul</button>
```

**After:**
```tsx
// Products/Index.tsx
import { useTranslation } from 'react-i18next';

export default function ProductsIndex() {
    const { t } = useTranslation('products');

    return (
        <>
            <h1>{t('title')}</h1>
            <button>{t('new_product')}</button>
        </>
    );
}
```

**With common namespace:**
```tsx
import { useTranslation } from 'react-i18next';

export default function SomeComponent() {
    const { t } = useTranslation(['products', 'common']);

    return (
        <>
            <h1>{t('products:title')}</h1>
            <button>{t('common:actions.save')}</button>
        </>
    );
}
```

### 2.7 Language Switcher Component

**File:** `resources/js/Components/LanguageSwitcher.tsx`

```tsx
import { useTranslation } from 'react-i18next';
import { router } from '@inertiajs/react';
import { useState } from 'react';

const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'az', name: 'Azərbaycan', flag: '🇦🇿' },
];

export default function LanguageSwitcher() {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);

    const changeLanguage = (langCode: string) => {
        // Update i18next
        i18n.changeLanguage(langCode);

        // Save to localStorage
        localStorage.setItem('i18nextLng', langCode);

        // Optional: Update user preference on backend
        router.post('/api/user/language', {
            language: langCode,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setIsOpen(false);
            },
        });
    };

    const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100"
            >
                <span>{currentLanguage.flag}</span>
                <span>{currentLanguage.name}</span>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    {languages.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => changeLanguage(lang.code)}
                            className={`w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2 ${
                                i18n.language === lang.code ? 'bg-gray-50' : ''
                            }`}
                        >
                            <span>{lang.flag}</span>
                            <span>{lang.name}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
```

### 2.8 Sync Language with Backend

**Backend Route:** `routes/api.php`

```php
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/user/language', [UserController::class, 'updateLanguage']);
});
```

**Controller:** `app/Http/Controllers/UserController.php`

```php
public function updateLanguage(Request $request)
{
    $request->validate([
        'language' => 'required|in:en,az',
    ]);

    auth()->user()->update([
        'language' => $request->language,
    ]);

    return response()->json(['message' => 'Language updated successfully']);
}
```

---

## Part 3: Translation Workflow

### 3.1 Adding New Translations

**Process:**
1. Add key to English file: `resources/js/i18n/locales/en/[namespace].json`
2. Add corresponding Azerbaijani translation: `resources/js/i18n/locales/az/[namespace].json`
3. Use in component: `t('namespace:key')`

**Example:**
```json
// en/sales.json
{
  "complete_sale": "Complete Sale"
}

// az/sales.json
{
  "complete_sale": "Satışı Tamamla"
}
```

```tsx
// Component
const { t } = useTranslation('sales');
<button>{t('complete_sale')}</button>
```

### 3.2 Translation with Variables

**JSON:**
```json
{
  "welcome_user": "Welcome, {{name}}!",
  "items_count": "{{count}} items"
}
```

**Usage:**
```tsx
{t('welcome_user', { name: user.name })}
{t('items_count', { count: items.length })}
```

### 3.3 Pluralization

**JSON:**
```json
{
  "product": "Product",
  "product_plural": "Products",
  "product_count": "{{count}} product",
  "product_count_plural": "{{count}} products"
}
```

**Usage:**
```tsx
{t('product_count', { count: productCount })}
```

---

## Part 4: Testing

### 4.1 Backend Testing

```php
// tests/Feature/TranslationTest.php
public function test_locale_is_set_from_user_preference()
{
    $user = User::factory()->create(['language' => 'az']);

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertSuccessful();

    $this->assertEquals('az', app()->getLocale());
}

public function test_payment_method_is_translated()
{
    app()->setLocale('az');

    $translated = TranslationService::paymentMethod('cash');

    $this->assertEquals('Nağd', $translated);
}
```

### 4.2 Frontend Testing

```typescript
// Test translation loading
import { renderWithI18n } from '@/test-utils';
import ProductsIndex from '@/Pages/Products/Index';

test('renders translated product title', () => {
    const { getByText } = renderWithI18n(<ProductsIndex />);
    expect(getByText('Products')).toBeInTheDocument();
});
```

---

## Part 5: Timeline

| Task | Time | Status |
|------|------|--------|
| Create lang directory structure | 1 hour | Pending |
| Write English translation files | 4-6 hours | Pending |
| Write Azerbaijani translations | 4-6 hours | Pending |
| Create SetLocale middleware | 1 hour | Pending |
| Create TranslationService | 1 hour | Pending |
| Update API Resources | 2-3 hours | Pending |
| Install i18next packages | 15 mins | Pending |
| Configure i18next | 1 hour | Pending |
| Create JSON translation files | 6-8 hours | Pending |
| Create LanguageSwitcher component | 2 hours | Pending |
| Update 50+ components | 20-30 hours | Pending |
| Testing | 4-6 hours | Pending |
| **TOTAL** | **46-64 hours** | **~6-8 days** |

---

## Next Steps

After translation setup:
1. ➡️ See `03-CURRENCY-SUPPORT.md` for currency formatting
2. ➡️ See `04-LANGUAGE-SWITCHING.md` for advanced language switching
3. ➡️ See `05-IMPLEMENTATION-PLAN.md` for step-by-step execution plan

---

**Document Version:** 1.0
**Last Updated:** 2025-12-09
**Status:** Draft - Awaiting Review
