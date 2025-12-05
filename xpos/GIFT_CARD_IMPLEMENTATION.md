# Gift Card System Implementation Guide

## ✅ COMPLETED (Phase 1 & 2)

### Database Schema (All Migrated Successfully)

#### 1. `gift_cards` table
```sql
- id (PK)
- card_number (string, 16, unique)
- denomination (decimal, nullable) - Set when tenant configures (50/100/200)
- initial_balance (decimal, nullable)
- current_balance (decimal, nullable)
- status (ENUM: 'free', 'configured', 'active', 'depleted', 'expired', 'inactive')
- account_id (FK to accounts, nullable)
- customer_id (FK to customers, nullable)
- expiry_date (date, nullable)
- activated_at (timestamp, nullable)
- fiscal_document_id (string, nullable) - LONG fiscal ID from prepayment
- fiscal_number (string, 50, nullable) - Short fiscal reference
- notes (text, nullable)
- timestamps

Indexes:
- card_number
- status
- account_id + status
- fiscal_document_id
- fiscal_number
```

#### 2. `gift_card_transactions` table
```sql
- id (PK)
- gift_card_id (FK to gift_cards)
- sale_id (FK to sales.sale_id, nullable) - Note: sales PK is sale_id, not id!
- transaction_type (ENUM: 'issue', 'activate', 'redeem', 'refund', 'adjust', 'expire', 'cancel')
- amount (decimal)
- balance_before (decimal)
- balance_after (decimal)
- user_id (FK to users)
- notes (text, nullable)
- timestamps

Indexes:
- gift_card_id
- sale_id
- transaction_type
- created_at
```

#### 3. `payments` table (Updated)
```sql
+ gift_card_id (FK to gift_cards, nullable)
+ method ENUM updated to include: 'hədiyyə_kartı'
```

#### 4. `accounts` table (Updated)
```sql
+ gift_cards_module_enabled (boolean, default false, GUARDED - super admin only)
```

---

## Models Updated

### GiftCard Model (`app/Models/GiftCard.php`)

**Status Constants:**
```php
const STATUS_FREE = 'free';           // Blank card from super admin, not configured
const STATUS_CONFIGURED = 'configured'; // Tenant set denomination, ready to sell
const STATUS_ACTIVE = 'active';        // Sold to customer, has balance, in use
const STATUS_DEPLETED = 'depleted';    // Balance reached 0
const STATUS_EXPIRED = 'expired';      // Passed expiry date
const STATUS_INACTIVE = 'inactive';    // Deactivated by admin
```

**Fillable Fields:**
```php
'card_number', 'denomination', 'initial_balance', 'current_balance',
'status', 'account_id', 'customer_id', 'expiry_date', 'activated_at',
'fiscal_document_id', 'fiscal_number', 'notes'
```

**Key Methods:**
- `scopeFree()`, `scopeConfigured()`, `scopeActive()`, `scopeDepleted()`
- `scopeByAccount($accountId = null)` - CRITICAL: Filters by account
- `isFree()`, `isConfigured()`, `isActive()`, `isDepleted()`, `isExpired()`
- `canBeUsed()` - Checks if card can be used for payment
- `configure(float $denomination)` - Tenant sets denomination (50/100/200)
- `markAsDepleted()` - When balance reaches 0
- `markAsExpired()`, `markAsInactive()`, `activate()`
- `generateUniqueCardNumber()` - Format: `GIFTXXXXXXXXXXXX` (16 chars)

**Relationships:**
- `belongsTo(Account)`, `belongsTo(Customer)`, `hasMany(GiftCardTransaction)`

---

### Account Model (`app/Models/Account.php`)

**Added:**
```php
// In $guarded array:
'gift_cards_module_enabled',

// In $casts array:
'gift_cards_module_enabled' => 'boolean',

// Helper method:
public function isGiftCardsModuleEnabled(): bool {
    return $this->gift_cards_module_enabled ?? false;
}
```

---

### Authorization Gates (`app/Providers/AuthorizationServiceProvider.php`)

```php
// Super Admin only
Gate::define('manage-gift-cards', function (User $user) {
    return $user->isSuperAdmin();
});

// Tenant users (if module enabled)
Gate::define('use-gift-cards', function (User $user) {
    return $user->isActive() &&
           $user->account->isActive() &&
           $user->account->isGiftCardsModuleEnabled();
});
```

---

## Controllers Created

### 1. Admin\GiftCardController (Super Admin)
**Location:** `app/Http/Controllers/Admin/GiftCardController.php`

**Routes:** `/admin/gift-cards/*` (under superadmin middleware)

**Methods:**
- `index()` - List all gift cards (all accounts), filters, stats
- `generate()` - Bulk create blank cards for specific account
- `show($card)` - View card details & transactions
- `activate($card)` - Reactivate deactivated card
- `deactivate($card)` - Deactivate card
- `reports()` - Cards by account, redemptions, balances

**Key Logic:**
- Creates cards with status='free', no denomination, no balance
- Assigns cards to specific account_id
- Cards are blank - tenant will configure later

---

### 2. GiftCardController (Tenant)
**Location:** `app/Http/Controllers/GiftCardController.php`

**Routes:** `/gift-cards/*` (tenant routes)

**Methods:**
- `index()` - List cards for this account only (uses byAccount scope)
- `show($card)` - View card details & transaction history
- `activate()` - Activate card when sold to customer
- `lookup()` - AJAX endpoint for POS (check balance by card code)
- `validate()` - Validate card for redemption

**Key Logic:**
- ALL queries use `byAccount()` scope - CRITICAL for multitenant
- Only shows cards assigned to this account

---

## Routes

### Super Admin Routes (`routes/web.php` lines 141-149)
```php
Route::prefix('gift-cards')->name('gift-cards.')->group(function () {
    Route::get('/', [Admin\GiftCardController::class, 'index'])->name('index');
    Route::post('/generate', [Admin\GiftCardController::class, 'generate'])->name('generate');
    Route::get('/{card}', [Admin\GiftCardController::class, 'show'])->name('show');
    Route::post('/{card}/deactivate', [Admin\GiftCardController::class, 'deactivate'])->name('deactivate');
    Route::post('/{card}/activate', [Admin\GiftCardController::class, 'activate'])->name('activate');
    Route::get('/reports/summary', [Admin\GiftCardController::class, 'reports'])->name('reports');
});
```

### Tenant Routes (`routes/web.php` lines 633-640)
```php
Route::prefix('gift-cards')->name('gift-cards.')->group(function () {
    Route::get('/', [GiftCardController::class, 'index'])->name('index');
    Route::get('/{card}', [GiftCardController::class, 'show'])->name('show');
    Route::post('/activate', [GiftCardController::class, 'activate'])->name('activate');
    Route::post('/lookup', [GiftCardController::class, 'lookup'])->name('lookup');
    Route::post('/validate', [GiftCardController::class, 'validate'])->name('validate');
});
```

---

## Frontend Integration

### Inertia Middleware (`app/Http/Middleware/HandleInertiaRequests.php`)
**Added line 62:**
```php
'giftCardsEnabled' => $user && $user->account ?
    ($user->account->gift_cards_module_enabled ?? false) : false,
```

### SalesNavigation Component (`resources/js/Components/SalesNavigation.tsx`)
**Updated:**
- Added `GiftIcon` import from `@heroicons/react/24/outline`
- Added `showGiftCards` prop to interface
- Added nav item for "Hədiyyə Kartları" (conditional on module enabled)

**Usage in pages:**
```tsx
<SalesNavigation
    showDiscounts={discountsEnabled}
    showGiftCards={giftCardsEnabled}
/>
```

---

## 🔄 REMAINING IMPLEMENTATION (Critical - Fiscal Integration)

### Complete Gift Card Flow

#### FLOW 1: Super Admin → Tenant Card Configuration

1. **Super Admin creates blank cards**
   - POST `/admin/gift-cards/generate`
   - Body: `{ quantity: 100, account_id: 1 }`
   - Cards created with: status='free', no denomination, no balance
   - Assigned to account_id

2. **Tenant sees free cards**
   - GET `/gift-cards` → Shows cards with status='free'
   - **NEED TO BUILD:** Configuration page where tenant can:
     - Select cards (e.g., 30 cards)
     - Set denomination (50/100/200 AZN)
     - This updates: status='configured', denomination=50
     - **Creates/updates Product** for "Hədiyyə Kartı 50 AZN"
     - **Updates product stock** +30

3. **Tenant creates gift card products**
   - **NEED TO BUILD:** Initial setup page (when module first enabled)
   - Tenant enters denominations: "50, 100, 200"
   - System creates products:
     - Product: "Hədiyyə Kartı 50 AZN", Price: 50, Stock: 0
     - Product: "Hədiyyə Kartı 100 AZN", Price: 100, Stock: 0
     - Product: "Hədiyyə Kartı 200 AZN", Price: 200, Stock: 0

---

#### FLOW 2: Selling Gift Card (Creating Fiscal Prepayment)

**POS Sale:**
1. Customer wants to buy "Hədiyyə Kartı 50 AZN"
2. Staff adds product to cart, processes sale
3. **POSController detects gift card product** (by checking product.gift_card_denomination or similar)

**Critical Steps:**
```php
// In POSController@storeSale:

// 1. Find available configured card
$giftCard = GiftCard::byAccount()
    ->configured()
    ->where('denomination', 50)
    ->first();

// 2. Create FISCAL PREPAYMENT document
$fiscalResponse = $this->fiscalPrinterService->createGiftCardPrepayment(
    auth()->user()->account_id,
    $giftCard,
    [
        'payment_method' => $request->payment_method, // 'nağd' or 'kart'
        'cash_amount' => $cashAmount,
        'card_amount' => $cardAmount,
    ]
);

// 3. Activate gift card and store fiscal IDs
$giftCard->update([
    'status' => GiftCard::STATUS_ACTIVE,
    'current_balance' => $giftCard->denomination,
    'initial_balance' => $giftCard->denomination,
    'activated_at' => now(),
    'expiry_date' => now()->addYear(), // 12 months from sale
    'fiscal_document_id' => $fiscalResponse['fiscal_document_id'], // CRITICAL!
    'fiscal_number' => $fiscalResponse['fiscal_number'],
    'customer_id' => $customer_id, // optional
]);

// 4. Create transaction record
GiftCardTransaction::createTransaction(
    $giftCard,
    GiftCardTransaction::TYPE_ISSUE,
    $giftCard->denomination,
    auth()->id(),
    $sale->sale_id,
    'Hədiyyə kartı satıldı'
);

// 5. Decrease product stock
$product->decrementStock(1);

// 6. Return card code to print (customer receives physical card with barcode)
return ['card_number' => $giftCard->card_number];
```

---

#### FLOW 3: Using Gift Card for Payment (Sale with Prepayment Reference)

**POS Payment:**
1. Customer has physical card with barcode (e.g., balance: 50 AZN)
2. Staff scans card at POS
3. Customer buys products worth 30 AZN

**Critical Steps:**
```php
// In POSController@storeSale:

// 1. Lookup gift card
$giftCard = GiftCard::byAccount()
    ->where('card_number', $scannedCardNumber)
    ->first();

// 2. Validate card
if (!$giftCard->canBeUsed()) {
    throw new Exception('Kartı istifadə etmək mümkün deyil');
}

if ($giftCard->current_balance < $amountToUse) {
    throw new Exception('Kartda kifayət qədər balans yoxdur');
}

// 3. Create FISCAL SALE with PREPAYMENT REFERENCE
$fiscalResponse = $this->fiscalPrinterService->createSaleWithGiftCardPayment(
    auth()->user()->account_id,
    $sale,
    $giftCard, // Contains fiscal_document_id to reference
    [
        'gift_card_amount' => $amountToUse, // 30 AZN
        'cash_amount' => $remainingAmount,  // 0 AZN (if fully covered)
        'card_amount' => 0,
    ]
);

// 4. Deduct from gift card balance
$giftCard->decrement('current_balance', $amountToUse);

// 5. Check if depleted
if ($giftCard->current_balance <= 0) {
    $giftCard->markAsDepleted();
}

// 6. Create transaction record
GiftCardTransaction::createTransaction(
    $giftCard,
    GiftCardTransaction::TYPE_REDEEM,
    $amountToUse,
    auth()->id(),
    $sale->sale_id,
    'Hədiyyə kartı istifadə edildi'
);

// 7. Store gift card payment
Payment::create([
    'sale_id' => $sale->sale_id,
    'method' => 'hədiyyə_kartı',
    'amount' => $amountToUse,
    'gift_card_id' => $giftCard->id,
]);
```

---

## Fiscal Printer API Specifications

### Caspos API (prepaymentProducts)

**Create Prepayment (Selling Gift Card):**
```json
{
  "operation": "prepaymentProducts",
  "username": "username",
  "password": "password",
  "data": {
    "documentUUID": "unique-uuid",
    "sum": 150.0,
    "vatType": 1,
    "cashPayment": 150.0,
    "cardPayment": 0.0,
    "bonusPayment": 0.0,
    "items": [{
      "name": "Gift card",
      "code": "GIFT123456789ABC",
      "quantity": 1.0,
      "salePrice": 150.0,
      "codeType": 1,
      "quantityType": 1,
      "vatType": 1
    }],
    "clientName": "Customer Name",
    "cashierName": "Cashier Name",
    "currency": "AZN",
    "note": "Hədiyyə kartı"
  }
}
```

**Response:**
```json
{
  "data": {
    "document_id": "EMnVW3qyEbUSsJ4xTJbMytDStusgXMDauaCQxdJE1wuM", // ← STORE THIS!
    "document_number": 7045,
    "short_document_id": "EMnVW3qyEbUS",
    "number": "180724A1A1197045"
  }
}
```

**Use Prepayment (Customer Pays with Gift Card):**
```json
{
  "operation": "sale",
  "username": "username",
  "password": "password",
  "data": {
    "documentUUID": "unique-uuid",
    "prepaymentDocumentId": "EMnVW3qyEbUSsJ4xTJbMytDStusgXMDauaCQxdJE1wuM", // ← Reference prepayment!
    "depositPayment": 30.0, // Amount from gift card
    "cashPayment": 0.0,
    "cardPayment": 0.0,
    "items": [
      // Regular sale items here
    ],
    "cashierName": "Cashier Name",
    "currency": "AZN"
  }
}
```

---

### Omnitech API (prepay)

**Create Prepayment (Selling Gift Card):**
```json
{
  "requestData": {
    "tokenData": {
      "parameters": {
        "doc_type": "prepay",
        "data": {
          "cashier": "Cashier Name",
          "currency": "AZN",
          "sum": 150.0,
          "cashSum": 150.0,
          "cashlessSum": 0.0,
          "prepaymentSum": 0.0,
          "creditSum": 0.0,
          "bonusSum": 0.0,
          "incomingSum": 150.0,
          "items": [{
            "itemName": "Gift card",
            "itemCodeType": 1,
            "itemCode": "GIFT123456789ABC",
            "itemQuantityType": 0,
            "itemQuantity": 1.0,
            "itemPrice": 150.0,
            "itemSum": 150.0,
            "itemVatPercent": 18.0
          }],
          "vatAmounts": [{
            "vatSum": 150.0,
            "vatPercent": 18.0
          }]
        }
      },
      "operationId": "createDocument",
      "version": 1
    },
    "checkData": {
      "check_type": 34
    }
  }
}
```

**Response:**
```json
{
  "fiscal_document_id": "69qHZoApyNYzs1mY9cBtXhTSxEfqyzksR6jfiXB9dzB4", // ← STORE THIS!
  "fiscal_number": "ABC123"
}
```

**Use Prepayment (Customer Pays with Gift Card):**
```json
{
  "requestData": {
    "tokenData": {
      "parameters": {
        "doc_type": "sale",
        "data": {
          "cashier": "Cashier Name",
          "currency": "AZN",
          "parents": ["69qHZoApyNYzs1mY9cBtXhTSxEfqyzksR6jfiXB9dzB4"], // ← Reference prepayment!
          "sum": 0.0,
          "cashSum": 0.0,
          "cashlessSum": 0.0,
          "prepaymentSum": 30.0, // Amount from gift card
          "creditSum": 0.0,
          "bonusSum": 0.0,
          "incomingSum": 0.0,
          "items": [
            // Regular sale items here
          ],
          "vatAmounts": [{
            "vatSum": 0.0,
            "vatPercent": 18.0
          }]
        }
      },
      "operationId": "createDocument",
      "version": 1
    },
    "checkData": {
      "check_type": 1
    }
  }
}
```

---

## TODO - Implementation Remaining

### Phase 3: Fiscal Integration (CRITICAL)

**File:** `app/Services/FiscalPrinterService.php`

1. **Add method:** `createGiftCardPrepayment()`
   - Input: `$accountId, GiftCard $card, $paymentData`
   - Returns: `['fiscal_document_id' => '...', 'fiscal_number' => '...']`
   - Handles both Caspos and Omnitech
   - Follows pattern of existing `printReceipt()` method

2. **Add method:** `formatGiftCardPrepaymentRequest()`
   - Input: `FiscalPrinterConfig $config, GiftCard $card, $data`
   - Returns: formatted request array
   - Follows pattern of existing `formatAdvanceSaleRequest()`
   - Provider switch: `if ($config->provider === 'caspos')` vs `'omnitech'`

3. **Update method:** `sendToTerminal()` or create `sendPrepaymentToTerminal()`
   - Handle prepayment-specific responses
   - Extract `document_id` (Caspos) or `fiscal_document_id` (Omnitech)

4. **Add method:** `createSaleWithGiftCardPayment()`
   - Input: `$accountId, Sale $sale, GiftCard $card, $paymentData`
   - Creates sale fiscal with prepayment reference
   - Handles both providers

5. **Add method:** `formatSaleWithGiftCardRequest()`
   - Formats sale with prepayment reference
   - Caspos: includes `prepaymentDocumentId` field
   - Omnitech: includes `parents` array

---

### Phase 4: POSController Integration

**File:** `app/Http/Controllers/POSController.php`

**Method:** `storeSale()` (around line 143)

**Changes needed:**

1. **Detect gift card product sale:**
```php
foreach ($saleItems as $item) {
    if ($product->gift_card_denomination) {
        // This is a gift card product sale
        $isGiftCardSale = true;
        $giftCardDenomination = $product->gift_card_denomination;
    }
}
```

2. **After sale created, if gift card sale:**
```php
if ($isGiftCardSale) {
    // Find available configured card
    $giftCard = GiftCard::byAccount()
        ->configured()
        ->where('denomination', $giftCardDenomination)
        ->firstOrFail();

    // Create fiscal prepayment
    $fiscalResponse = app(FiscalPrinterService::class)
        ->createGiftCardPrepayment(
            auth()->user()->account_id,
            $giftCard,
            [
                'cash_amount' => $request->payment_method === 'nağd' ? $total : 0,
                'card_amount' => $request->payment_method === 'kart' ? $total : 0,
            ]
        );

    // Activate card with fiscal IDs
    $giftCard->update([
        'status' => GiftCard::STATUS_ACTIVE,
        'current_balance' => $giftCard->denomination,
        'initial_balance' => $giftCard->denomination,
        'activated_at' => now(),
        'expiry_date' => now()->addYear(),
        'fiscal_document_id' => $fiscalResponse['fiscal_document_id'],
        'fiscal_number' => $fiscalResponse['fiscal_number'],
    ]);

    // Create transaction
    GiftCardTransaction::createTransaction(
        $giftCard,
        GiftCardTransaction::TYPE_ISSUE,
        $giftCard->denomination,
        auth()->id(),
        $sale->sale_id,
        'Hədiyyə kartı satıldı'
    );
}
```

3. **Handle gift card payment:**
```php
if ($request->gift_card_code) {
    $giftCard = GiftCard::byAccount()
        ->where('card_number', $request->gift_card_code)
        ->firstOrFail();

    // Validate
    if (!$giftCard->canBeUsed()) {
        return back()->with('error', 'Kart istifadə edilə bilməz');
    }

    $giftCardAmount = min($giftCard->current_balance, $total);

    // Create sale with prepayment reference
    $fiscalResponse = app(FiscalPrinterService::class)
        ->createSaleWithGiftCardPayment(
            auth()->user()->account_id,
            $sale,
            $giftCard,
            [
                'gift_card_amount' => $giftCardAmount,
                'cash_amount' => $total - $giftCardAmount,
            ]
        );

    // Deduct balance
    $giftCard->decrement('current_balance', $giftCardAmount);

    if ($giftCard->current_balance <= 0) {
        $giftCard->markAsDepleted();
    }

    // Create transaction
    GiftCardTransaction::createTransaction(
        $giftCard,
        GiftCardTransaction::TYPE_REDEEM,
        $giftCardAmount,
        auth()->id(),
        $sale->sale_id
    );

    // Create payment record
    Payment::create([
        'sale_id' => $sale->sale_id,
        'method' => 'hədiyyə_kartı',
        'amount' => $giftCardAmount,
        'gift_card_id' => $giftCard->id,
    ]);
}
```

---

### Phase 5: Gift Card Configuration (Tenant)

**Create:** `app/Http/Controllers/GiftCardConfigurationController.php`

**Methods:**
1. `index()` - Show free cards, configured cards grouped by denomination
2. `bulkConfigure(Request $request)` - Configure selected cards with denomination
3. `createProducts(Request $request)` - Initial setup: create gift card products

**Routes to add:**
```php
Route::get('/gift-cards/configure', [GiftCardConfigurationController::class, 'index']);
Route::post('/gift-cards/bulk-configure', [GiftCardConfigurationController::class, 'bulkConfigure']);
Route::post('/gift-cards/setup-products', [GiftCardConfigurationController::class, 'createProducts']);
```

---

## Products Integration

**Option 1: Add field to products table**
```sql
ALTER TABLE products ADD COLUMN gift_card_denomination DECIMAL(10,2) NULL;
```

**Option 2: Use product category/SKU pattern**
- Product name: "Hədiyyə Kartı 50 AZN"
- SKU: "GIFT-50"
- Identify by name pattern or SKU

**Recommendation:** Option 1 (explicit field) - cleaner and more reliable

---

## Key Security & Multitenancy Rules

1. **ALWAYS use `byAccount()` scope** in tenant controllers
2. **ALWAYS validate `account_id`** when showing card to tenant
3. **Fiscal document IDs are CRITICAL** - must be stored and referenced correctly
4. **Card status workflow must be enforced:**
   - free → configured → active → depleted (OR expired)
5. **Expiry date set at sale time** (12 months from sale)
6. **Balance updates must be atomic** (use transactions)
7. **All operations must be logged** in gift_card_transactions

---

## Testing Checklist

- [ ] Super admin creates blank cards
- [ ] Tenant sees free cards
- [ ] Tenant configures cards (sets denomination)
- [ ] Product stock updates automatically
- [ ] Selling gift card creates fiscal prepayment
- [ ] Gift card activated with correct fiscal IDs
- [ ] Customer uses gift card (full amount)
- [ ] Customer uses gift card (partial amount)
- [ ] Gift card marked as depleted when balance = 0
- [ ] Multiple uses of same card (30 + 20 from 50 balance)
- [ ] Expired card cannot be used
- [ ] Inactive card cannot be used
- [ ] Both Caspos and Omnitech work correctly
- [ ] Multitenant isolation (Account A can't see Account B's cards)

---

## Important Notes

1. **Sales table PK is `sale_id`, not `id`!** - Use this in foreign keys
2. **Caspos uses `prepaymentProducts`** - NOT `prepayment` (that's for simple advance)
3. **Omnitech uses `prepay`** - same as regular prepayment but with items
4. **Fiscal document ID is LONG** - don't truncate
5. **Card number must be barcodeable** - format: GIFT + 12 chars
6. **This is PRODUCTION** - don't break existing fiscal code!
7. **Follow existing patterns** - don't refactor working code
8. **Provider-specific code** - use if/elseif, easy to add more providers

---

## Language (Pure Azerbaijani)

- Hədiyyə Kartları - Gift Cards
- Kart nömrəsi - Card number
- Balans - Balance
- Aktiv - Active
- İstifadə olunub - Used
- Qeyri-aktiv - Inactive
- Aktivləşdir - Activate
- Yaradılma tarixi - Creation date
- Hədiyyə kartı satıldı - Gift card sold
- Hədiyyə kartı istifadə edildi - Gift card used
- Kartda kifayət qədər balans yoxdur - Insufficient balance on card

---

## Architecture Decisions

1. **Why fiscal prepayment?** - Tax department requires it (not optional)
2. **Why store fiscal IDs with card?** - Must reference in future sales
3. **Why status workflow?** - Track card lifecycle, prevent misuse
4. **Why denomination field?** - Cards are blank, tenant configures
5. **Why separate configuration?** - Flexibility, tenant controls
6. **Why partial payment support?** - User requirement (changed from single-use)
7. **Why expiry at sale time?** - Fair to customer, 12 months from purchase

---

**END OF IMPLEMENTATION GUIDE**
**Created:** 2025-12-04
**Status:** Phase 1 & 2 Complete, Phase 3-5 Pending (Fiscal Integration Critical)
