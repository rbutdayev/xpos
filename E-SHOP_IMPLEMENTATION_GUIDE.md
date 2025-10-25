# 📖 E-SHOP IMPLEMENTATION - COMPLETE DOCUMENTATION

## 🎯 PROJECT OVERVIEW

### What We're Building
A **simple online shop** integrated into existing XPOS multi-tenant system where:
- Each merchant (account) can enable their own shop
- URL format: `xpos.az/{merchant_business_name}`
- Customers browse products and place quick orders (no registration)
- Orders go directly into existing POS system
- Merchants get notified via email/SMS

### Multi-Tenant Considerations ⚠️
**CRITICAL:** This is a multi-tenant system where:
- Each `account` represents a different merchant/business
- All data must be isolated by `account_id`
- Each merchant has their own products, customers, sales
- **Each merchant gets their own independent shop URL**
- Data leakage between accounts must be prevented
- **Each merchant uses their own SMS credentials and balance**

---

## 📊 SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                    XPOS MULTI-TENANT SYSTEM                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Account A   │  │  Account B   │  │  Account C   │         │
│  │  (Boutique)  │  │  (Electronics)│  │  (Tailor)    │         │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤         │
│  │ Products     │  │ Products     │  │ Products     │         │
│  │ Sales        │  │ Sales        │  │ Sales        │         │
│  │ SMS Creds    │  │ SMS Creds    │  │ SMS Creds    │         │
│  │              │  │              │  │              │         │
│  │ Shop URL:    │  │ Shop URL:    │  │ Shop URL:    │         │
│  │ /boutique    │  │ /electronics │  │ /tailor      │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 IMPLEMENTATION STEPS

## STEP 1: DATABASE CHANGES

### Migration 1: Add Shop Settings to Accounts

**File:** `database/migrations/2025_10_25_000001_add_shop_settings_to_accounts.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            // Shop URL slug (unique across all merchants)
            $table->string('shop_slug', 100)->unique()->nullable()
                ->after('email')
                ->comment('Business name for shop URL: xpos.az/{shop_slug}');

            // Enable/disable shop per merchant
            $table->boolean('shop_enabled')->default(false)
                ->after('shop_slug')
                ->comment('Whether online shop is active for this account');

            // Optional: Shop-specific settings (JSON)
            $table->json('shop_settings')->nullable()
                ->after('shop_enabled')
                ->comment('Shop customization: colors, banner text, etc.');
        });

        // Add index for shop lookups
        Schema::table('accounts', function (Blueprint $table) {
            $table->index(['shop_slug', 'shop_enabled'], 'idx_shop_lookup');
        });
    }

    public function down(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            $table->dropIndex('idx_shop_lookup');
            $table->dropColumn(['shop_slug', 'shop_enabled', 'shop_settings']);
        });
    }
};
```

### Migration 2: Extend Sales for Online Orders

**File:** `database/migrations/2025_10_25_000002_add_online_order_fields_to_sales.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            // Flag to identify online orders
            $table->boolean('is_online_order')->default(false)
                ->after('sale_number')
                ->comment('TRUE if order came from online shop');

            // Customer info for quick orders (no customer record needed)
            $table->string('customer_name', 255)->nullable()
                ->after('customer_id')
                ->comment('Quick order customer name (no registration)');

            $table->string('customer_phone', 50)->nullable()
                ->after('customer_name')
                ->comment('Quick order customer phone');

            // Optional: Customer requested delivery/pickup info
            $table->text('delivery_notes')->nullable()
                ->after('notes')
                ->comment('Customer delivery preferences');
        });

        // Add index for filtering online orders
        Schema::table('sales', function (Blueprint $table) {
            $table->index(['account_id', 'is_online_order', 'created_at'], 'idx_online_orders');
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropIndex('idx_online_orders');
            $table->dropColumn(['is_online_order', 'customer_name', 'customer_phone', 'delivery_notes']);
        });
    }
};
```

### Migration 3: SMS Notification Settings

**File:** `database/migrations/2025_10_25_000003_add_shop_sms_settings.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            // === MERCHANT NOTIFICATIONS ===
            // Enable SMS notifications when new order arrives
            $table->boolean('shop_sms_merchant_notifications')->default(false)
                ->after('shop_settings')
                ->comment('Send SMS to merchant when new online order arrives');

            // Phone number to receive order notifications (can differ from account phone)
            $table->string('shop_notification_phone', 50)->nullable()
                ->after('shop_sms_merchant_notifications')
                ->comment('Phone number to receive merchant order notifications');

            // === CUSTOMER NOTIFICATIONS ===
            // Enable sending confirmation SMS to customers
            $table->boolean('shop_sms_customer_notifications')->default(false)
                ->after('shop_notification_phone')
                ->comment('Send confirmation SMS to customers after order');

            // Custom SMS template for customers (optional)
            $table->text('shop_customer_sms_template')->nullable()
                ->after('shop_sms_customer_notifications')
                ->comment('Custom SMS template for customer notifications. Variables: {customer_name}, {order_number}, {total}, {shop_name}, {shop_phone}');
        });
    }

    public function down(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            $table->dropColumn([
                'shop_sms_merchant_notifications',
                'shop_notification_phone',
                'shop_sms_customer_notifications',
                'shop_customer_sms_template',
            ]);
        });
    }
};
```

---

## STEP 2: UPDATE MODELS

### Update Account Model

**File:** `app/Models/Account.php`

```php
// Add to $fillable array
protected $fillable = [
    // ... existing fields
    'shop_slug',
    'shop_enabled',
    'shop_settings',
    'shop_sms_merchant_notifications',
    'shop_notification_phone',
    'shop_sms_customer_notifications',
    'shop_customer_sms_template',
];

// Add to $casts array
protected $casts = [
    // ... existing casts
    'shop_enabled' => 'boolean',
    'shop_settings' => 'array',
    'shop_sms_merchant_notifications' => 'boolean',
    'shop_sms_customer_notifications' => 'boolean',
];

// Add helper methods
public function isShopEnabled(): bool
{
    return $this->shop_enabled && $this->shop_slug;
}

public function getShopUrl(): ?string
{
    if (!$this->isShopEnabled()) {
        return null;
    }
    return url('/shop/' . $this->shop_slug);
}

public function getShopSetting(string $key, $default = null)
{
    return data_get($this->shop_settings, $key, $default);
}

public function updateShopSettings(array $settings): void
{
    $this->update([
        'shop_settings' => array_merge($this->shop_settings ?? [], $settings)
    ]);
}

public function hasSmsConfigured(): bool
{
    // Check if SMS credentials exist for this account
    return \App\Models\SmsCredential::where('account_id', $this->id)
        ->where('is_active', true)
        ->exists();
}

public function getCustomerSmsTemplate(): string
{
    // Default template if not customized
    $default = "Hörmətli {customer_name}, sifarişiniz qəbul edildi!\n"
        . "Sifariş №: {order_number}\n"
        . "Məbləğ: {total} ₼\n"
        . "Əlaqə: {shop_phone}\n"
        . "{shop_name}";

    return $this->shop_customer_sms_template ?: $default;
}

public function getMerchantNotificationPhone(): ?string
{
    return $this->shop_notification_phone ?: $this->phone;
}
```

### Update Sale Model

**File:** `app/Models/Sale.php`

```php
// Add to $fillable array
protected $fillable = [
    // ... existing fields
    'is_online_order',
    'customer_name',
    'customer_phone',
    'delivery_notes',
];

// Add to $casts array
protected $casts = [
    // ... existing casts
    'is_online_order' => 'boolean',
];

// Add scope for online orders
public function scopeOnlineOrders(Builder $query): Builder
{
    return $query->where('is_online_order', true);
}

// Add scope for POS orders
public function scopePosOrders(Builder $query): Builder
{
    return $query->where('is_online_order', false);
}

// Helper method
public function isOnlineOrder(): bool
{
    return $this->is_online_order;
}
```

---

## STEP 3: ADMIN SETTINGS (BACKEND)

### Create Settings Controller

**File:** `app/Http/Controllers/Settings/ShopSettingsController.php`

```php
<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Account;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ShopSettingsController extends Controller
{
    public function index()
    {
        $account = Auth::user()->account;

        return Inertia::render('Settings/ShopSettings', [
            'settings' => [
                'shop_enabled' => $account->shop_enabled,
                'shop_slug' => $account->shop_slug,
                'shop_url' => $account->getShopUrl(),
                'shop_sms_merchant_notifications' => $account->shop_sms_merchant_notifications,
                'shop_notification_phone' => $account->shop_notification_phone,
                'shop_sms_customer_notifications' => $account->shop_sms_customer_notifications,
                'shop_customer_sms_template' => $account->shop_customer_sms_template,
                'has_sms_configured' => $account->hasSmsConfigured(),
                'sms_balance' => $this->getSmsBalance($account),
            ],
        ]);
    }

    public function update(Request $request)
    {
        $account = Auth::user()->account;

        $validated = $request->validate([
            'shop_enabled' => 'boolean',
            'shop_slug' => [
                'required_if:shop_enabled,true',
                'nullable',
                'regex:/^[a-z0-9-]+$/',
                'min:3',
                'max:100',
                // IMPORTANT: Ensure slug is unique ACROSS ALL ACCOUNTS
                Rule::unique('accounts', 'shop_slug')->ignore($account->id),
            ],
            'shop_sms_merchant_notifications' => 'boolean',
            'shop_notification_phone' => 'nullable|string|max:50',
            'shop_sms_customer_notifications' => 'boolean',
            'shop_customer_sms_template' => 'nullable|string|max:500',
        ], [
            'shop_slug.required_if' => 'Biznes adı mütləqdir',
            'shop_slug.regex' => 'Yalnız kiçik hərflər, rəqəmlər və tire istifadə edin',
            'shop_slug.unique' => 'Bu biznes adı artıq istifadə olunur',
            'shop_slug.min' => 'Minimum 3 simvol',
        ]);

        // If disabling shop, clear the slug
        if (isset($validated['shop_enabled']) && !$validated['shop_enabled']) {
            $validated['shop_slug'] = null;
        }

        // If SMS not configured, disable SMS notifications
        if (!$account->hasSmsConfigured()) {
            $validated['shop_sms_merchant_notifications'] = false;
            $validated['shop_sms_customer_notifications'] = false;
        }

        // MULTI-TENANT CHECK: Ensure we're only updating current user's account
        $account->update($validated);

        return back()->with('success', 'Mağaza parametrləri yeniləndi');
    }

    private function getSmsBalance(Account $account): ?int
    {
        try {
            $smsCredential = \App\Models\SmsCredential::where('account_id', $account->id)
                ->where('is_active', true)
                ->first();

            if (!$smsCredential) {
                return null;
            }

            // Get balance from SMS service
            $smsService = app(\App\Services\SmsService::class);
            return $smsService->getBalance($account->id);
        } catch (\Exception $e) {
            \Log::warning('Failed to get SMS balance', [
                'account_id' => $account->id,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }
}
```

### Add Routes

**File:** `routes/web.php`

```php
// Shop Settings (authenticated admin)
Route::middleware(['auth'])->group(function () {
    Route::get('/settings/shop', [App\Http\Controllers\Settings\ShopSettingsController::class, 'index'])
        ->name('settings.shop');
    Route::patch('/settings/shop', [App\Http\Controllers\Settings\ShopSettingsController::class, 'update'])
        ->name('settings.shop.update');
});
```

---

## STEP 4: PUBLIC SHOP CONTROLLER

**File:** `app/Http/Controllers/PublicShopController.php`

```php
<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Product;
use App\Models\Category;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Services\DocumentUploadService;
use App\Mail\NewOnlineOrder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class PublicShopController extends Controller
{
    public function __construct(
        private DocumentUploadService $documentService
    ) {}

    /**
     * MULTI-TENANT: Load account by shop_slug and set context
     */
    private function loadShopAccount(string $shop_slug): Account
    {
        $account = Account::where('shop_slug', $shop_slug)
            ->where('shop_enabled', true)
            ->where('is_active', true)
            ->firstOrFail();

        // Set account context for this request
        app()->instance('shop_account', $account);

        return $account;
    }

    /**
     * Shop Homepage
     */
    public function index(string $shop_slug)
    {
        $account = $this->loadShopAccount($shop_slug);

        // MULTI-TENANT: Only get products for THIS account
        $products = Product::where('account_id', $account->id)
            ->where('type', 'product')
            ->active()
            ->with(['documents', 'category'])
            ->latest()
            ->paginate(12);

        // Load images
        foreach ($products as $product) {
            $firstDoc = $product->documents->first();
            $product->image_url = $firstDoc
                ? $this->documentService->getThumbnailUrl($firstDoc) ?? $this->documentService->getDocumentUrl($firstDoc)
                : null;
        }

        // MULTI-TENANT: Only get categories for THIS account
        $categories = Category::where('account_id', $account->id)
            ->products()
            ->active()
            ->whereNull('parent_id')
            ->with(['children' => function($q) use ($account) {
                $q->where('account_id', $account->id)
                  ->active()
                  ->orderBy('sort_order');
            }])
            ->orderBy('sort_order')
            ->get();

        return Inertia::render('Shop/Home', [
            'account' => $this->formatAccountForPublic($account),
            'products' => $products,
            'categories' => $categories,
        ]);
    }

    /**
     * Product Detail Page
     */
    public function show(string $shop_slug, int $id)
    {
        $account = $this->loadShopAccount($shop_slug);

        // MULTI-TENANT: Ensure product belongs to THIS account
        $product = Product::where('account_id', $account->id)
            ->where('id', $id)
            ->where('type', 'product')
            ->active()
            ->with(['documents', 'category', 'activeVariants'])
            ->firstOrFail();

        // Load all images
        $product->images = $product->documents->map(function($doc) {
            return [
                'id' => $doc->id,
                'url' => $this->documentService->getDocumentUrl($doc),
                'thumbnail' => $this->documentService->getThumbnailUrl($doc),
            ];
        });

        return Inertia::render('Shop/Product', [
            'account' => $this->formatAccountForPublic($account),
            'product' => $product,
        ]);
    }

    /**
     * Create Order (Quick Order)
     */
    public function createOrder(Request $request, string $shop_slug)
    {
        $account = $this->loadShopAccount($shop_slug);

        $validated = $request->validate([
            'customer_name' => 'required|string|max:255',
            'customer_phone' => 'required|string|max:50',
            'items' => 'required|array|min:1',
            'items.*.product_id' => [
                'required',
                'exists:products,id',
                // MULTI-TENANT: Ensure product belongs to this account
                function ($attribute, $value, $fail) use ($account) {
                    if (!Product::where('id', $value)->where('account_id', $account->id)->exists()) {
                        $fail('Məhsul tapılmadı');
                    }
                },
            ],
            'items.*.variant_id' => 'nullable|exists:product_variants,id',
            'items.*.quantity' => 'required|integer|min:1|max:9999',
            'items.*.price' => 'required|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
        ]);

        DB::beginTransaction();
        try {
            // Calculate totals
            $subtotal = 0;
            foreach ($validated['items'] as $item) {
                $subtotal += $item['price'] * $item['quantity'];
            }

            // MULTI-TENANT: Create sale for THIS account
            $sale = Sale::create([
                'account_id' => $account->id, // CRITICAL: Set account_id
                'sale_number' => $this->generateOnlineSaleNumber($account->id),
                'is_online_order' => true,
                'customer_name' => $validated['customer_name'],
                'customer_phone' => $validated['customer_phone'],
                'subtotal' => $subtotal,
                'tax_amount' => 0,
                'discount_amount' => 0,
                'total' => $subtotal,
                'paid_amount' => 0,
                'credit_amount' => $subtotal,
                'payment_status' => 'unpaid',
                'notes' => $validated['notes'],
                'delivery_notes' => $request->delivery_notes,
                'sale_date' => now(),
            ]);

            // Create sale items
            foreach ($validated['items'] as $item) {
                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $item['product_id'],
                    'product_variant_id' => $item['variant_id'] ?? null,
                    'quantity' => $item['quantity'],
                    'price' => $item['price'],
                    'subtotal' => $item['price'] * $item['quantity'],
                    'discount_amount' => 0,
                    'tax_amount' => 0,
                    'total' => $item['price'] * $item['quantity'],
                ]);
            }

            DB::commit();

            // Send notifications (async)
            $this->sendOrderNotifications($account, $sale);

            return response()->json([
                'success' => true,
                'message' => 'Sifarişiniz qəbul edildi! Tezliklə sizinlə əlaqə saxlanılacaq.',
                'order_number' => $sale->sale_number,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Online order creation failed', [
                'account_id' => $account->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.',
            ], 500);
        }
    }

    /**
     * Generate unique sale number for online orders
     */
    private function generateOnlineSaleNumber(int $account_id): string
    {
        $prefix = 'WEB';
        $year = date('Y');

        // MULTI-TENANT: Get last sale for THIS account only
        $lastSale = Sale::where('account_id', $account_id)
            ->where('sale_number', 'like', "$prefix-$year-%")
            ->latest('id')
            ->first();

        $newNumber = $lastSale
            ? ((int) substr($lastSale->sale_number, -6)) + 1
            : 1;

        return sprintf('%s-%s-%06d', $prefix, $year, $newNumber);
    }

    /**
     * Send order notifications (email + SMS to merchant + SMS to customer)
     */
    private function sendOrderNotifications(Account $account, Sale $sale): void
    {
        // 1. Email notification to merchant
        if ($account->email) {
            try {
                Mail::to($account->email)->send(new NewOnlineOrder($sale));
            } catch (\Exception $e) {
                Log::warning('Failed to send order email', [
                    'account_id' => $account->id,
                    'sale_id' => $sale->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // 2. SMS notification to merchant
        if ($account->shop_sms_merchant_notifications && $account->hasSmsConfigured()) {
            try {
                $phone = $account->getMerchantNotificationPhone();
                $message = "Yeni online sifariş #{$sale->sale_number}\n"
                    . "Müştəri: {$sale->customer_name}\n"
                    . "Tel: {$sale->customer_phone}\n"
                    . "Məbləğ: {$sale->total} ₼";

                $smsService = app(\App\Services\SmsService::class);
                $smsService->send($phone, $message, $account->id);

            } catch (\Exception $e) {
                Log::warning('Failed to send merchant SMS', [
                    'account_id' => $account->id,
                    'sale_id' => $sale->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // 3. SMS confirmation to customer
        if ($account->shop_sms_customer_notifications && $account->hasSmsConfigured() && $sale->customer_phone) {
            try {
                $template = $account->getCustomerSmsTemplate();
                $message = $this->renderSmsTemplate($template, $account, $sale);

                $smsService = app(\App\Services\SmsService::class);
                $smsService->send($sale->customer_phone, $message, $account->id);

            } catch (\Exception $e) {
                Log::warning('Failed to send customer SMS', [
                    'account_id' => $account->id,
                    'sale_id' => $sale->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }

    /**
     * Render SMS template with variables
     */
    private function renderSmsTemplate(string $template, Account $account, Sale $sale): string
    {
        return str_replace(
            ['{customer_name}', '{order_number}', '{total}', '{shop_name}', '{shop_phone}'],
            [
                $sale->customer_name,
                $sale->sale_number,
                number_format($sale->total, 2),
                $account->company_name,
                $account->phone,
            ],
            $template
        );
    }

    /**
     * Format account data for public display (hide sensitive info)
     */
    private function formatAccountForPublic(Account $account): array
    {
        return [
            'company_name' => $account->company_name,
            'shop_slug' => $account->shop_slug,
            'phone' => $account->phone,
            'email' => $account->email,
            'address' => $account->address,
        ];
    }
}
```

### Add Public Routes

**File:** `routes/web.php`

```php
// Public shop routes (no auth, rate limiting only)
Route::prefix('shop/{shop_slug}')->name('shop.')->middleware(['throttle:60,1'])->group(function () {
    Route::get('/', [App\Http\Controllers\PublicShopController::class, 'index'])->name('home');
    Route::get('/product/{id}', [App\Http\Controllers\PublicShopController::class, 'show'])->name('product');
    Route::post('/order', [App\Http\Controllers\PublicShopController::class, 'createOrder'])->name('order');
});
```

---

## STEP 5: EMAIL NOTIFICATION

### Create Mailable

**File:** `app/Mail/NewOnlineOrder.php`

```php
<?php

namespace App\Mail;

use App\Models\Sale;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class NewOnlineOrder extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Sale $sale)
    {
        $this->sale->load(['items.product', 'items.variant']);
    }

    public function build()
    {
        return $this->subject("Yeni Online Sifariş #{$this->sale->sale_number}")
            ->markdown('emails.new-online-order');
    }
}
```

### Create Email Template

**File:** `resources/views/emails/new-online-order.blade.php`

```blade
@component('mail::message')
# Yeni Online Sifariş

Salam! Yeni online sifariş daxil olub.

## Sifariş məlumatları

**Sifariş nömrəsi:** {{ $sale->sale_number }}
**Tarix:** {{ $sale->created_at->format('d.m.Y H:i') }}

## Müştəri məlumatları

**Ad:** {{ $sale->customer_name }}
**Telefon:** {{ $sale->customer_phone }}

@if($sale->notes)
**Qeyd:** {{ $sale->notes }}
@endif

## Sifariş edilən məhsullar

@foreach($sale->items as $item)
- **{{ $item->product->name }}**
  @if($item->variant)
  ({{ $item->variant->size }} {{ $item->variant->color }})
  @endif
  <br>
  Miqdar: {{ $item->quantity }} x {{ number_format($item->price, 2) }} ₼ = {{ number_format($item->total, 2) }} ₼
@endforeach

---

**Cəm məbləğ:** {{ number_format($sale->total, 2) }} ₼

## Növbəti addımlar

1. Müştəri ilə əlaqə saxlayın: **{{ $sale->customer_phone }}**
2. Sifarişi təsdiq edin
3. Ödəniş və çatdırılma təfərrüatlarını müzakirə edin

@component('mail::button', ['url' => config('app.url') . '/sales'])
Sifarişləri idarə et
@endcomponent

Təşəkkürlər,<br>
{{ config('app.name') }}
@endcomponent
```

---

## STEP 6: SMS SERVICE UPDATES

**File:** `app/Services/SmsService.php` (Update existing)

Add these methods to your existing SmsService:

```php
/**
 * Send SMS with account-specific credentials
 *
 * @param string $phone Phone number
 * @param string $message SMS content
 * @param int $accountId Account ID for multi-tenant SMS credentials
 * @return bool Success status
 */
public function send(string $phone, string $message, int $accountId): bool
{
    try {
        // MULTI-TENANT: Get SMS credentials for THIS account
        $credentials = \App\Models\SmsCredential::where('account_id', $accountId)
            ->where('is_active', true)
            ->firstOrFail();

        // Log SMS attempt
        $smsLog = \App\Models\SmsLog::create([
            'account_id' => $accountId,
            'phone' => $phone,
            'message' => $message,
            'status' => 'pending',
        ]);

        // Send SMS using provider API (adjust based on your SMS provider)
        $response = Http::post($credentials->api_url, [
            'username' => $credentials->username,
            'password' => $credentials->password,
            'sender' => $credentials->sender_name,
            'recipient' => $phone,
            'message' => $message,
        ]);

        $success = $response->successful();

        // Update log
        $smsLog->update([
            'status' => $success ? 'sent' : 'failed',
            'provider_response' => $response->body(),
            'sent_at' => $success ? now() : null,
        ]);

        return $success;

    } catch (\Exception $e) {
        \Log::error('SMS send failed', [
            'account_id' => $accountId,
            'phone' => $phone,
            'error' => $e->getMessage(),
        ]);

        return false;
    }
}

/**
 * Get SMS balance for account
 */
public function getBalance(int $accountId): int
{
    try {
        $credentials = \App\Models\SmsCredential::where('account_id', $accountId)
            ->where('is_active', true)
            ->firstOrFail();

        // Call provider API to get balance (adjust based on your SMS provider)
        $response = Http::get($credentials->api_url . '/balance', [
            'username' => $credentials->username,
            'password' => $credentials->password,
        ]);

        if ($response->successful()) {
            return (int) $response->json('balance', 0);
        }

        return 0;
    } catch (\Exception $e) {
        \Log::error('Failed to get SMS balance', [
            'account_id' => $accountId,
            'error' => $e->getMessage(),
        ]);
        return 0;
    }
}
```

---

## 🔒 MULTI-TENANT SECURITY CHECKLIST

### ⚠️ CRITICAL Security Points

1. **Always filter by `account_id`:**
   ```php
   // ✅ CORRECT
   Product::where('account_id', $account->id)->get();

   // ❌ WRONG - Can leak data from other accounts!
   Product::all();
   ```

2. **Validate product ownership in orders:**
   ```php
   // Ensure product belongs to account before creating order
   Product::where('id', $productId)
          ->where('account_id', $account->id)
          ->firstOrFail();
   ```

3. **Use unique constraints wisely:**
   ```php
   // shop_slug must be unique ACROSS ALL ACCOUNTS
   $table->string('shop_slug')->unique();

   // But sale_number only needs to be unique PER ACCOUNT
   // (handled in code, not database constraint)
   ```

4. **SMS Isolation:**
   ```php
   // Each account uses their OWN SMS credentials
   // Never use another account's SMS balance
   SmsCredential::where('account_id', $account->id)->first();
   ```

5. **Test account isolation:**
   - Try accessing Account A's shop with Account B's products → Should fail
   - Try creating order with Account A's product in Account B's shop → Should fail
   - Verify SMS sent from Account A deducts from Account A's balance only

---

## 📊 SMS NOTIFICATION FLOW

```
Online Order Created
         │
         ├─────────────────────────┬──────────────────────────┐
         │                         │                          │
         ▼                         ▼                          ▼
   Email to Merchant      SMS to Merchant          SMS to Customer
   (always if email)      (if enabled)             (if enabled)
         │                         │                          │
         ▼                         ▼                          ▼
   Account email          Account's SMS             Account's SMS
                          credentials               credentials
                          & balance                 & balance
```

---

## 📋 IMPLEMENTATION TIMELINE

| Phase | Task | Time | Priority |
|-------|------|------|----------|
| 1 | Database migrations | 1 hour | Critical |
| 2 | Update models | 1 hour | Critical |
| 3 | Backend controllers | 4 hours | Critical |
| 4 | Admin settings frontend | 4 hours | High |
| 5 | Public shop frontend | 2 days | Critical |
| 6 | Email templates | 2 hours | High |
| 7 | SMS integration | 3 hours | Medium |
| 8 | Testing & debugging | 1 day | Critical |
| **TOTAL** | **5-6 days** | **1 developer** |

---

## 🧪 TESTING CHECKLIST

### Basic Functionality
- [ ] Admin can enable/disable shop
- [ ] Admin can set unique shop slug
- [ ] Shop accessible at `xpos.az/{slug}`
- [ ] Products displayed correctly
- [ ] Cart works (add, remove, update quantity)
- [ ] Quick order form submits successfully
- [ ] Order appears in admin sales list with `is_online_order = TRUE`

### Multi-Tenant Isolation
- [ ] Account A cannot access Account B's products
- [ ] Shop slug is unique across all accounts
- [ ] Orders created with correct `account_id`
- [ ] Each account sees only their own online orders

### Notifications
- [ ] Email sent to merchant on new order
- [ ] Merchant SMS sent (if enabled and configured)
- [ ] Customer SMS sent (if enabled)
- [ ] SMS template variables replaced correctly
- [ ] SMS balance deducted from correct account

### Edge Cases
- [ ] Shop disabled → Public pages return 404
- [ ] Invalid shop slug → 404
- [ ] Product out of stock → Can still order
- [ ] SMS not configured → No error, just no SMS
- [ ] Email fails → Order still created
- [ ] Duplicate shop slug → Validation error

---

## 📝 MAINTENANCE NOTES

### Daily Operations
- Monitor online orders in sales list (filter by `is_online_order = TRUE`)
- Check SMS balance if using SMS notifications
- Review error logs for failed notifications

### Common Issues
1. **Shop not accessible:**
   - Check `shop_enabled = TRUE`
   - Check `shop_slug` is set
   - Check account `is_active = TRUE`

2. **SMS not sending:**
   - Verify SMS credentials configured
   - Check SMS balance > 0
   - Review `sms_logs` table for errors

3. **Email not received:**
   - Check account email is valid
   - Review mail logs
   - Check spam folder

### Future Enhancements
- [ ] Product categories filter on shop
- [ ] Product search functionality
- [ ] Image gallery for products
- [ ] Customer order tracking (without login)
- [ ] WhatsApp integration
- [ ] Custom shop themes/colors
- [ ] Shop analytics dashboard

---

## 🎯 SUCCESS CRITERIA

The implementation is successful when:
1. ✅ Each merchant can enable their shop with unique URL
2. ✅ Customers can browse products and place orders without registration
3. ✅ Orders appear in merchant's POS system immediately
4. ✅ Merchants receive email notifications
5. ✅ SMS notifications work (if configured)
6. ✅ Multi-tenant data isolation is verified
7. ✅ No errors in production logs
8. ✅ Mobile responsive design works

---

**Document Version:** 1.0
**Last Updated:** October 25, 2025
**Author:** Implementation Team
