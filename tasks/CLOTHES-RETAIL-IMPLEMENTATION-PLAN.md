# Clothes Retail Implementation Plan - Complete Architecture

## 📋 Summary of Your Questions:

1. ✅ **Is product_variants table + UI enough?** → NO, need changes everywhere
2. ✅ **What about all stock processes?** → Need variant_id in 8 tables + all controllers
3. ✅ **Barcode integration?** → Already exists, just extend for variants
4. ✅ **Separate clothes retail mode?** → YES! Use `business_type` field on Account
5. ✅ **How to avoid breaking existing functionality?** → Nullable columns + conditional logic

---

## 🎯 ANSWER 1: What Needs Changes (Complete List)

### Database Changes Required (8 Tables)

```sql
-- 1. New table
CREATE TABLE product_variants

-- 2-8. Add variant_id to these tables:
ALTER TABLE product_stock ADD variant_id
ALTER TABLE sale_items ADD variant_id
ALTER TABLE goods_receipts ADD variant_id
ALTER TABLE stock_movements ADD variant_id
ALTER TABLE warehouse_transfers ADD variant_id
ALTER TABLE product_returns ADD variant_id
ALTER TABLE service_items ADD variant_id (for products used in service)
ALTER TABLE stock_history ADD variant_id
```

### ALL Stock Processes That Need Updates:

#### ✅ **Process 1: Goods Receipt (Mal Qəbulu)**
**Current Flow:**
```
User selects: Product → Quantity (decimal) → Unit (L or qab) → Calculates base quantity
Creates: goods_receipt record → Updates product_stock.quantity
Creates: stock_movement (type: daxil_olma)
```

**New Flow for Clothes:**
```
User selects: Product → Variant (Size-Color) → Quantity (integer)
Creates: goods_receipt with variant_id → Updates product_stock WHERE variant_id
Creates: stock_movement with variant_id
```

**Files to Change:**
- ✏️ `app/Http/Controllers/GoodsReceiptController.php` - Add variant handling
- ✏️ `app/Models/GoodsReceipt.php` - Add variant relationship
- ✏️ `resources/js/Pages/GoodsReceipts/Components/GoodsReceiptForm.tsx` - Variant selector

---

#### ✅ **Process 2: POS Sales**
**Current Flow:**
```
User scans barcode → Finds product → Selects unit (L or qab)
Adds to cart → On checkout: Creates sale + sale_items
Updates: product_stock.quantity (-quantity)
Creates: stock_movement (type: xaric_olma)
```

**New Flow for Clothes:**
```
User scans barcode → Finds variant directly (unique barcode per variant)
Adds to cart → On checkout: Creates sale + sale_items with variant_id
Updates: product_stock WHERE variant_id
Creates: stock_movement with variant_id
```

**Files to Change:**
- ✏️ `app/Http/Controllers/POSController.php` - Variant-based stock deduction
- ✏️ `app/Models/SaleItem.php` - Add variant relationship
- ✏️ `resources/js/Pages/POS/Index.tsx` - Show variant info
- ✏️ `resources/js/Pages/POS/components/CartSection.tsx` - Display size/color

---

#### ✅ **Process 3: Warehouse Transfers**
**Current Flow:**
```
User: Product → From Warehouse → To Warehouse → Quantity
Status: gozlemede → tesdiq_edilib → tamamlanib
On complete: Deduct from warehouse_A, Add to warehouse_B
Creates: 2 stock_movements (xaric_olma, daxil_olma)
```

**New Flow for Clothes:**
```
User: Product → Variant → From Warehouse → To Warehouse → Quantity
Same status flow
On complete: Update stock WHERE product_id AND variant_id for both warehouses
Creates: 2 stock_movements with variant_id
```

**Files to Change:**
- ✏️ `app/Http/Controllers/WarehouseTransferController.php`
- ✏️ `app/Models/WarehouseTransfer.php`
- ✏️ `resources/js/Pages/WarehouseTransfers/Create.tsx`

---

#### ✅ **Process 4: Product Returns to Supplier**
**Current Flow:**
```
User: Product → Quantity → Reason → Status flow
Updates: product_stock.quantity (-quantity)
Creates: stock_movement (type: xaric_olma)
```

**New Flow for Clothes:**
```
User: Product → Variant → Quantity → Reason
Updates: product_stock WHERE variant_id
Creates: stock_movement with variant_id
```

**Files to Change:**
- ✏️ `app/Http/Controllers/ProductReturnController.php`
- ✏️ `app/Models/ProductReturn.php`
- ✏️ `resources/js/Pages/ProductReturns/Create.tsx`

---

#### ✅ **Process 5: Stock Adjustments (Manual)**
**Current Flow:**
```
Admin: Product → Adjustment type (itki_zerer, etc.) → Quantity
Creates: stock_movement → Updates product_stock
```

**New Flow for Clothes:**
```
Admin: Product → Variant → Adjustment type → Quantity
Creates: stock_movement with variant_id → Updates stock WHERE variant_id
```

**Files to Change:**
- ✏️ `app/Http/Controllers/StockMovementController.php`
- ✏️ `resources/js/Pages/StockMovements/Create.tsx`

---

#### ✅ **Process 6: Stock Alerts (Min/Max)**
**Current:** Checks `product_stock.quantity` against `min_level`
**New:** Check per variant: "T-Shirt M-Red low stock" not just "T-Shirt low stock"

**Files to Change:**
- ✏️ `app/Models/MinMaxAlert.php` - Add variant checking
- ✏️ `app/Services/StockAlertService.php` (if exists)

---

#### ✅ **Process 7: Reports**
**Current:** Product-level reports (total sales per product)
**New:** Variant-level reports (sales per size, per color)

**Files to Change:**
- ✏️ `app/Http/Controllers/ReportController.php`
- ✏️ All report queries

---

#### ✅ **Process 8: Service Records (using products/parts)**
**Current:** Service can use products (parts, oil, etc.)
**New:** If using clothes (rare), need variant selection

**Files to Change:**
- ✏️ `app/Models/ServiceItem.php` - Add variant_id
- ✏️ `resources/js/Pages/ServiceRecords/Edit.tsx`

---

## 🎯 ANSWER 2: Barcode Integration

### Current Barcode System
You already have:
- ✅ Barcode generation (`route('products.generate-barcode')`)
- ✅ Barcode types (EAN-13, UPC-A, Code-128, QR-Code)
- ✅ Barcode printing (`window.printBarcode()`)
- ✅ Barcode scanning in POS (search by barcode)

**File:** `resources/js/Pages/Products/Components/BasicInfoSection.tsx` (lines 109-135)

### What You Need to Add:

```typescript
// NEW: Bulk variant barcode generation
POST /api/products/{product}/variants/generate-barcodes
{
  "variants": [
    { "size": "M", "color": "Red" },
    { "size": "L", "color": "Red" }
  ],
  "barcode_type": "EAN-13"
}

Response:
{
  "barcodes": [
    { "variant_id": 1, "sku": "TS-001-M-R", "barcode": "1234567890123" },
    { "variant_id": 2, "sku": "TS-001-L-R", "barcode": "1234567890124" }
  ]
}
```

### Backend Changes:

```php
// ProductController.php
public function generateVariantBarcodes(Product $product, Request $request)
{
    $barcodeType = $request->input('barcode_type', 'EAN-13');
    $results = [];

    foreach ($product->variants()->whereNull('barcode')->get() as $variant) {
        $barcode = $this->generateUniqueBarcode($barcodeType);
        $variant->update(['barcode' => $barcode]);
        $results[] = [
            'variant_id' => $variant->id,
            'sku' => $variant->sku,
            'barcode' => $barcode
        ];
    }

    return response()->json(['barcodes' => $results]);
}
```

### POS Barcode Scanning:

**Current Logic:**
```php
// POSController searches: Product::where('barcode', $scanned)
```

**New Logic (backward compatible):**
```php
// 1. Try to find variant first
$variant = ProductVariant::where('barcode', $scanned)
    ->where('account_id', auth()->user()->account_id)
    ->first();

if ($variant) {
    return $variant->product->with('selectedVariant', $variant);
}

// 2. Fallback: Find base product (for non-clothes items)
$product = Product::where('barcode', $scanned)
    ->where('account_id', auth()->user()->account_id)
    ->first();

return $product;
```

---

## 🎯 ANSWER 3: Separate Clothes Retail Mode (RECOMMENDED!)

### The Solution: Business Type Field

Add `business_type` to `accounts` table:

```sql
ALTER TABLE accounts
ADD COLUMN business_type ENUM('auto_service', 'clothes_retail', 'general') DEFAULT 'general';
```

### How It Works:

#### **1. Onboarding/Setup**
When user first creates account:

```typescript
// New onboarding screen
<select name="business_type">
  <option value="auto_service">Avtomobil Servisi</option>
  <option value="clothes_retail">Geyim Mağazası</option>
  <option value="general">Ümumi (Hər şey)</option>
</select>
```

#### **2. Conditional UI Rendering**

**Frontend (React/Vue):**
```typescript
// Get from auth context
const businessType = auth.account.business_type;

// Show/hide based on type
{businessType === 'clothes_retail' && (
  <VariantSelector />
)}

{businessType === 'auto_service' && (
  <VehicleSelector />
  <ServiceRecordMenu />
)}

{businessType !== 'clothes_retail' && (
  <PackagingFields /> // Show unit, packaging for auto/general
)}
```

**Backend (Blade/Inertia props):**
```php
// AppServiceProvider or Middleware
Inertia::share([
    'auth.account.business_type' => fn() => auth()->user()->account->business_type
]);
```

#### **3. Navigation Menu Conditional**

```typescript
// Layouts/AuthenticatedLayout.tsx
const menuItems = useMemo(() => {
  const items = [
    { name: 'Dashboard', href: '/' },
    { name: 'Satış (POS)', href: '/pos' },
    { name: 'Məhsullar', href: '/products' },
    { name: 'Müştərilər', href: '/customers' },
    { name: 'Təchizatçılar', href: '/suppliers' },
    { name: 'Anbar', href: '/warehouse' },
  ];

  if (businessType === 'auto_service') {
    items.push(
      { name: 'Avtomaşınlar', href: '/vehicles' },
      { name: 'Servis Qeydləri', href: '/service-records' }
    );
  }

  // Remove service-related for clothes retail
  if (businessType === 'clothes_retail') {
    // Don't show vehicles, service records
  }

  return items;
}, [businessType]);
```

#### **4. Product Form Conditional Fields**

```typescript
// Products/Components/BasicInfoSection.tsx
{businessType === 'clothes_retail' ? (
  <>
    {/* CLOTHES MODE */}
    <VariantMatrixBuilder />
    <SizeSelector />
    <ColorPicker />
  </>
) : (
  <>
    {/* AUTO/GENERAL MODE */}
    <PackagingFields />
    <UnitSelector />
    <BaseUnitSelector />
  </>
)}
```

#### **5. Database Validation (Nullable Approach)**

**Migration Strategy:**
```sql
-- Make packaging fields nullable (if not already)
ALTER TABLE products
MODIFY COLUMN packaging_size VARCHAR(255) NULL,
MODIFY COLUMN packaging_quantity DECIMAL(10,3) NULL,
MODIFY COLUMN base_unit VARCHAR(50) NULL,
MODIFY COLUMN unit_price DECIMAL(10,4) NULL;

-- Make variant_id nullable (for backward compatibility)
ALTER TABLE sale_items
ADD COLUMN variant_id BIGINT NULL,
ADD FOREIGN KEY (variant_id) REFERENCES product_variants(id);

-- Same for all 8 tables mentioned above
```

**Backend Validation:**
```php
// ProductController validation
public function store(Request $request)
{
    $rules = [
        'name' => 'required|string',
        'sale_price' => 'required|numeric',
    ];

    // Conditional validation based on business type
    if (auth()->user()->account->business_type === 'clothes_retail') {
        $rules['variants'] = 'required|array';
        $rules['variants.*.size'] = 'required|string';
        $rules['variants.*.color'] = 'required|string';
    } else {
        $rules['packaging_quantity'] = 'required|numeric';
        $rules['base_unit'] = 'required|string';
    }

    $validated = $request->validate($rules);
    // ...
}
```

#### **6. Controller Logic (Smart Defaults)**

```php
// POSController.php - Sale creation
public function storeSale(Request $request)
{
    $businessType = auth()->user()->account->business_type;

    foreach ($request->items as $item) {
        $saleItem = new SaleItem();
        $saleItem->product_id = $item['product_id'];

        // Conditional: clothes use variant_id
        if ($businessType === 'clothes_retail') {
            $saleItem->variant_id = $item['variant_id'] ?? null;
            // Stock deduction uses variant
            $this->deductStockWithVariant($item);
        } else {
            // Stock deduction uses product only
            $this->deductStockProduct($item);
        }

        $saleItem->save();
    }
}

private function deductStockWithVariant($item)
{
    $stock = ProductStock::where('product_id', $item['product_id'])
        ->where('variant_id', $item['variant_id'])
        ->where('warehouse_id', $item['warehouse_id'])
        ->first();

    $stock->decrement('quantity', $item['quantity']);
}

private function deductStockProduct($item)
{
    // Existing logic - works for auto service products
    $stock = ProductStock::where('product_id', $item['product_id'])
        ->where('warehouse_id', $item['warehouse_id'])
        ->first();

    $stock->decrement('quantity', $item['base_quantity'] ?? $item['quantity']);
}
```

---

## 🔥 How to NOT Break Existing Functionality

### Strategy 1: Nullable Columns + Defaults

```sql
-- Add new columns as NULLABLE
ALTER TABLE sale_items ADD COLUMN variant_id BIGINT NULL;
ALTER TABLE product_stock ADD COLUMN variant_id BIGINT NULL;

-- Existing records will have NULL variant_id
-- New clothes records will have variant_id populated
-- Queries work for both:
SELECT * FROM sale_items WHERE product_id = 1 AND (variant_id = 5 OR variant_id IS NULL);
```

### Strategy 2: Model Scopes

```php
// ProductStock.php
public function scopeForProduct($query, $productId, $variantId = null)
{
    $query->where('product_id', $productId);

    if ($variantId) {
        $query->where('variant_id', $variantId);
    } else {
        // For non-variant products, only match NULL variant_id
        $query->whereNull('variant_id');
    }

    return $query;
}

// Usage:
ProductStock::forProduct($productId, $variantId)->first();
```

### Strategy 3: Feature Flags in Settings

```php
// Account settings JSON field
{
  "features": {
    "variants_enabled": true,
    "vehicle_service_enabled": false,
    "multi_unit_pricing": false
  }
}

// Check in code:
if (auth()->user()->account->settings['features']['variants_enabled']) {
    // Use variant logic
} else {
    // Use classic product logic
}
```

### Strategy 4: Separate Routes (Optional)

```php
// routes/web.php
Route::group(['prefix' => 'clothes', 'middleware' => 'business_type:clothes_retail'], function() {
    Route::get('/pos', [ClothesRetailPOSController::class, 'index']);
    Route::get('/products', [ClothesProductController::class, 'index']);
});

Route::group(['prefix' => 'auto', 'middleware' => 'business_type:auto_service'], function() {
    Route::get('/pos', [AutoServicePOSController::class, 'index']);
    Route::get('/service-records', [ServiceRecordController::class, 'index']);
});
```

### Strategy 5: Database Triggers (Advanced)

```sql
-- Auto-populate defaults for non-clothes accounts
DELIMITER $$
CREATE TRIGGER set_product_defaults BEFORE INSERT ON products
FOR EACH ROW
BEGIN
  DECLARE biz_type VARCHAR(50);
  SELECT business_type INTO biz_type FROM accounts WHERE id = NEW.account_id;

  IF biz_type != 'clothes_retail' THEN
    IF NEW.unit IS NULL THEN SET NEW.unit = 'ədəd'; END IF;
    IF NEW.base_unit IS NULL THEN SET NEW.base_unit = 'ədəd'; END IF;
  END IF;
END$$
DELIMITER ;
```

---

## 📊 Complete Migration Plan (Step-by-Step)

### Phase 1: Preparation (Week 1)
**Goal:** Add business_type without breaking anything

```sql
-- Step 1.1: Add business_type to accounts
ALTER TABLE accounts
ADD COLUMN business_type ENUM('auto_service', 'clothes_retail', 'general')
DEFAULT 'auto_service'; -- Default to existing behavior

-- Step 1.2: Set all existing accounts to 'auto_service'
UPDATE accounts SET business_type = 'auto_service';

-- Step 1.3: Create product_variants table
CREATE TABLE product_variants (...);

-- Step 1.4: Add variant_id to all 8 tables (NULLABLE)
ALTER TABLE product_stock ADD COLUMN variant_id BIGINT NULL;
ALTER TABLE sale_items ADD COLUMN variant_id BIGINT NULL;
-- ... (repeat for all 8 tables)
```

**Test:** ✅ System still works for existing auto service accounts

---

### Phase 2: Backend Support (Week 2)
**Goal:** Add variant logic without affecting existing flows

```php
// Step 2.1: Create ProductVariant model
class ProductVariant extends Model { ... }

// Step 2.2: Add relationships
// Product.php
public function variants() {
    return $this->hasMany(ProductVariant::class);
}

// Step 2.3: Update controllers with conditional logic
// Example: POSController
if (auth()->user()->account->business_type === 'clothes_retail') {
    // New variant logic
} else {
    // Existing logic unchanged
}
```

**Test:** ✅ Auto service accounts still work, clothes_retail accounts ready

---

### Phase 3: Frontend Conditional UI (Week 3)
**Goal:** Show variant UI only for clothes accounts

```typescript
// Step 3.1: Add business_type to Inertia shared data
// AppServiceProvider.php
Inertia::share([
    'auth.account.business_type' => fn() => auth()->user()->account->business_type
]);

// Step 3.2: Update product form
// BasicInfoSection.tsx
const { auth } = usePage<PageProps>();
const isClothesRetail = auth.account.business_type === 'clothes_retail';

{isClothesRetail ? <VariantFields /> : <PackagingFields />}

// Step 3.3: Update POS
// CartSection.tsx
{item.variant ? (
  <span>Size: {item.variant.size}, Color: {item.variant.color}</span>
) : (
  <span>Unit: {item.unit}</span>
)}
```

**Test:** ✅ Auto accounts see old UI, clothes accounts see new UI

---

### Phase 4: Test Clothes Retail (Week 4)
**Goal:** Create test clothes retail account and verify all flows

```bash
# Step 4.1: Create test account
php artisan tinker
$account = Account::create(['business_type' => 'clothes_retail', ...]);

# Step 4.2: Test all processes:
- ✅ Create product with variants
- ✅ Generate barcodes for variants
- ✅ Goods receipt with variant selection
- ✅ POS sale with variant
- ✅ Stock movements with variant
- ✅ Warehouse transfer with variant
- ✅ Product return with variant
- ✅ Reports showing variant data
```

---

### Phase 5: Onboarding (Week 5)
**Goal:** Let new users choose business type

```typescript
// Step 5.1: Add to registration/onboarding
<select name="business_type" required>
  <option value="auto_service">Avtomobil Servisi</option>
  <option value="clothes_retail">Geyim Mağazası</option>
  <option value="general">Ümumi Mağaza</option>
</select>

// Step 5.2: Seed initial data based on type
if ($businessType === 'clothes_retail') {
    $this->createClothesCategories($account);
    $this->createSizeChart($account);
} else {
    $this->createAutoServiceCategories($account);
}
```

---

### Phase 6: Rollout (Week 6)
**Goal:** Enable for production

```bash
# Step 6.1: Deploy with feature flag
# .env
FEATURE_CLOTHES_RETAIL=true

# Step 6.2: Announce to users
# Step 6.3: Monitor for issues
# Step 6.4: Provide support/training
```

---

## 🎨 UI Mockups

### Product Form - Clothes Mode

```
┌─────────────────────────────────────────────────────────┐
│ Məhsul Yaradın - Geyim Mağazası                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Əsas Məlumat                                           │
│ ┌─────────────────────────────────────────┐           │
│ │ Məhsul Adı: [Cotton T-Shirt            ]│           │
│ │ Kateqoriya: [T-Shirts ▾                ]│           │
│ │ Bazis Qiymət: [25.00 AZN               ]│           │
│ └─────────────────────────────────────────┘           │
│                                                         │
│ Variant Matrisi                                        │
│ ┌─────────────────────────────────────────┐           │
│ │      │ Qırmızı │ Göy  │ Qara  │ Ağ     │           │
│ │──────┼─────────┼──────┼───────┼────────│           │
│ │  S   │    ✓    │  ✓   │   ✓   │   ✓    │           │
│ │  M   │    ✓    │  ✓   │   ✓   │   ✓    │           │
│ │  L   │    ✓    │  ✓   │   ✓   │   ✓    │           │
│ │  XL  │    ✓    │  ✓   │   ✓   │   ✓    │           │
│ │──────┴─────────┴──────┴───────┴────────│           │
│ │ 16 variant yaradılacaq                  │           │
│ └─────────────────────────────────────────┘           │
│                                                         │
│ [◄ Ləğv et]              [Variantları Yarat ►]       │
└─────────────────────────────────────────────────────────┘
```

### Product Form - Auto Service Mode (Existing)

```
┌─────────────────────────────────────────────────────────┐
│ Məhsul Yaradın - Avtomobil Servisi                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Əsas Məlumat                                           │
│ ┌─────────────────────────────────────────┐           │
│ │ Məhsul Adı: [Mühərrik Yağı 5W-30       ]│           │
│ │ Paket Növü: [şüşə ▾                    ]│           │
│ │ Paketdəki Miqdar: [5                   ]│           │
│ │ Satış Vahidi: [litr ▾                  ]│           │
│ │ Packaging Size: 5 litr                  │           │
│ └─────────────────────────────────────────┘           │
│                                                         │
│ [◄ Ləğv et]              [Məhsul Yarat ►]            │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Final Checklist

### Database
- [ ] Add `business_type` to `accounts` table
- [ ] Create `product_variants` table
- [ ] Add `variant_id` to 8 tables (nullable)
- [ ] Make packaging fields nullable
- [ ] Add indexes for variant queries

### Backend Models
- [ ] Create `ProductVariant` model
- [ ] Add variant relationships to all models
- [ ] Update scopes for variant filtering
- [ ] Add conditional validation

### Backend Controllers
- [ ] Update `ProductController` for variants
- [ ] Update `POSController` for variant sales
- [ ] Update `GoodsReceiptController`
- [ ] Update `WarehouseTransferController`
- [ ] Update `ProductReturnController`
- [ ] Update `StockMovementController`
- [ ] Update `ReportController`
- [ ] Add variant barcode generation endpoint

### Frontend Components
- [ ] Create `VariantMatrixBuilder.tsx`
- [ ] Create `VariantSelector.tsx`
- [ ] Update `BasicInfoSection.tsx` (conditional)
- [ ] Update `CartSection.tsx` (show variant)
- [ ] Update `ProductSearchSection.tsx`
- [ ] Update `GoodsReceiptForm.tsx`
- [ ] Update navigation menu (conditional)

### Testing
- [ ] Test auto service account (should work unchanged)
- [ ] Test clothes retail account (all flows)
- [ ] Test mixed account (general type)
- [ ] Test migration script
- [ ] Test barcode scanning
- [ ] Test reporting

### Documentation
- [ ] User manual for clothes retail
- [ ] Migration guide
- [ ] API documentation
- [ ] Video tutorials

---

## 📞 Next Steps

1. **Review this plan** - Any concerns or questions?
2. **Answer remaining questions:**
   - Do you want separate prices per variant?
   - Should we support both auto + clothes in one account?
   - Do you need pattern/fit or just size+color?
3. **Approve database structure**
4. **Start with Phase 1** (1 week)
5. **Weekly check-ins**

**Estimated Total Time:** 6 weeks (1.5 months)
**Risk Level:** Low (backward compatible approach)
**Priority:** High (new market opportunity)

---

**Report Generated:** 2025-10-16
**System Analyzed:** Onyx E-Service POS
**Strategy:** Multi-tenant with business_type switching
