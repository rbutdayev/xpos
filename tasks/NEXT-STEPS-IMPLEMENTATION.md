# XPOS Next Steps - Implementation Roadmap

**Date:** 2025-10-16
**Status:** Ready to implement
**Cleanup:** ✅ Complete (Option 1 - Fresh Start)

---

## 📖 IMPORTANT: Read This First (For AI Agents & Developers)

### What is XPOS?
**XPOS** is a **clothes retail Point of Sale (POS) system** transformed from an auto-service system (E-Service). This is a **Laravel + React (Inertia.js)** application with a **multi-tenant architecture**.

### Core Architecture: Multi-Tenant System
**CRITICAL:** This is a **multi-tenant SaaS application** where multiple businesses (accounts) share the same codebase and database, but their data is completely isolated.

**Every query, every model, every controller MUST respect `account_id` isolation!**

```php
// ✅ CORRECT - Always filter by account_id
Product::where('account_id', auth()->user()->account_id)->get();

ProductVariant::where('account_id', auth()->user()->account_id)
    ->where('barcode', $scanned)
    ->first();

// ❌ WRONG - Never query without account_id (data leak!)
Product::all(); // DANGEROUS!
ProductVariant::find($id); // DANGEROUS!
```

### Why We're Doing This Transformation

**Original System (E-Service):**
- Auto repair shop management
- Vehicle tracking (plate numbers, VIN, mileage)
- Auto service records (oil changes, repairs)
- Complex product packaging (liters, kg, bottles, cans)
- Units: L, kq, ml, qab, teneke, şüşə, çəllək

**Target System (XPOS - Clothes Retail):**
- Clothes retail shop management
- Customer item tracking (jackets, dresses, suits)
- Tailor services (alterations, repairs, custom orders)
- **Product variants** (Size × Color) - **THIS IS THE KEY FEATURE**
- Simple units: ədəd (pieces) only

### The Big Change: Product Variants

**Before (E-Service):**
```
Product: "Motor Oil 5W-30"
- Has packaging: 5 liters per bottle
- Sold by: liter or bottle
- Stock tracked by: base quantity in liters
```

**After (XPOS):**
```
Product: "Cotton T-Shirt"
- Has variants:
  - Size S × Red (barcode: 123...)
  - Size S × Blue (barcode: 456...)
  - Size M × Red (barcode: 789...)
  - Size M × Blue (barcode: 012...)
- Sold by: pieces (ədəd)
- Stock tracked by: variant_id + quantity
```

**Why this matters:**
Every table that references `product_id` now also needs `variant_id`:
- `product_stock` - Stock per variant
- `sale_items` - Sales per variant
- `goods_receipts` - Receiving stock per variant
- `stock_movements` - Moving stock per variant
- `warehouse_transfers` - Transferring stock per variant
- `product_returns` - Returning stock per variant
- `service_items` - Using products in tailor services (per variant)
- `stock_history` - Historical tracking per variant

### Database Transformation Overview

```
OLD (E-Service)                    NEW (XPOS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
vehicles                     →     customer_items
  - plate_number                     - item_type (Jacket, Dress)
  - vin                              - item_description
  - engine_type                      - fabric, size
  - mileage                          - special_instructions

service_records              →     tailor_services
  - vehicle_id                       - customer_item_id
  - vehicle_mileage                  - customer_item_condition
  - service_number                   - order_number
  - parts_total                      - materials_total
                                     - service_type (alteration/repair)
                                     - delivery_date

products                     →     products (simplified)
  - packaging_size (removed)         - has_variants (NEW)
  - packaging_quantity (removed)     - Simple unit: "ədəd"
  - unit (L/kq/ml)
  - base_unit

                             →     product_variants (NEW TABLE)
                                     - product_id
                                     - account_id ⚠️ CRITICAL
                                     - size, color, color_code
                                     - barcode (unique per variant)
                                     - sku (unique per variant)
                                     - price_adjustment
```

### Multi-Tenant Safety Rules (ALWAYS FOLLOW!)

#### Rule 1: Every New Table MUST Have account_id
```sql
CREATE TABLE product_variants (
    id BIGINT UNSIGNED PRIMARY KEY,
    account_id BIGINT UNSIGNED NOT NULL, -- ⚠️ CRITICAL!
    product_id BIGINT UNSIGNED NOT NULL,
    -- ... other columns
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    UNIQUE KEY (account_id, barcode), -- NOT globally unique!
    INDEX idx_account_product (account_id, product_id)
);
```

#### Rule 2: Every Model MUST Use BelongsToAccount Trait
```php
use App\Traits\BelongsToAccount; // This adds account scoping

class ProductVariant extends Model
{
    use BelongsToAccount; // ⚠️ ALWAYS INCLUDE THIS!

    protected $fillable = ['account_id', ...]; // ⚠️ ALWAYS INCLUDE account_id
}
```

#### Rule 3: Every Controller Query MUST Filter by account_id
```php
// ✅ CORRECT
$variants = ProductVariant::where('account_id', auth()->user()->account_id)
    ->where('product_id', $productId)
    ->get();

// ✅ CORRECT - Using relationship with account check
$product = Product::where('account_id', auth()->user()->account_id)
    ->with(['variants' => function($q) {
        $q->where('account_id', auth()->user()->account_id);
    }])
    ->findOrFail($id);

// ❌ WRONG - Data leak! Can access other accounts' data
$variants = ProductVariant::where('product_id', $productId)->get();
```

#### Rule 4: Unique Constraints Are Per-Account
```sql
-- ✅ CORRECT - Barcode unique per account (not globally)
UNIQUE KEY unique_barcode_per_account (account_id, barcode)

-- ❌ WRONG - This would prevent different accounts from using same barcode
UNIQUE KEY (barcode)
```

**Why?** Account A can have barcode "12345" for their red shirt, and Account B can have barcode "12345" for their blue pants. They're different businesses!

#### Rule 5: Always Validate Account Ownership Before Updates
```php
// ✅ CORRECT
public function update(Request $request, $id)
{
    $variant = ProductVariant::where('account_id', auth()->user()->account_id)
        ->where('id', $id)
        ->firstOrFail(); // 404 if not found or wrong account

    $variant->update($request->validated());
}

// ❌ WRONG - Could update another account's variant!
public function update(Request $request, $id)
{
    $variant = ProductVariant::find($id); // DANGEROUS!
    $variant->update($request->validated());
}
```

#### Rule 6: Foreign Keys Respect Account Boundaries
```php
// When creating variant, always set account_id
$variant = new ProductVariant();
$variant->account_id = auth()->user()->account_id; // ⚠️ REQUIRED!
$variant->product_id = $productId;
$variant->save();

// Or use relationship:
$product->variants()->create([
    'account_id' => $product->account_id, // ⚠️ Must match product's account!
    'size' => 'M',
    'color' => 'Red',
]);
```

### Tech Stack
- **Backend:** Laravel 12 (PHP 8.2+)
- **Frontend:** React 18 + TypeScript + Inertia.js 2.0
- **Styling:** TailwindCSS 3
- **Build:** Vite 7
- **Database:** MySQL/PostgreSQL (with multi-tenant architecture)

### File Structure
```
xpos/
├── app/
│   ├── Models/          # All models MUST use BelongsToAccount trait
│   ├── Http/Controllers/ # All queries MUST filter by account_id
│   └── Traits/
│       └── BelongsToAccount.php  # Critical trait for multi-tenancy
├── database/
│   └── migrations/
│       └── 2025_10_16_000000_create_xpos_schema.php  # ONE consolidated migration
├── resources/js/
│   ├── Pages/          # Inertia pages
│   ├── Components/     # Reusable React components
│   └── Layouts/        # Layout components
└── routes/
    └── web.php         # All routes protected by auth + account middleware
```

### When Implementing Any Feature, Ask Yourself:
1. ✅ Does my query filter by `account_id`?
2. ✅ Does my model use `BelongsToAccount` trait?
3. ✅ Are unique constraints scoped per account?
4. ✅ Do I validate account ownership before updates/deletes?
5. ✅ Are foreign keys pointing to records in the same account?
6. ✅ Did I add `account_id` to fillable array?
7. ✅ Did I add `account_id` to indexes for performance?

### Testing Multi-Tenant Isolation
```php
// Create 2 test accounts
$accountA = Account::create(['name' => 'Shop A']);
$accountB = Account::create(['name' => 'Shop B']);

// Create variant for Account A
$variantA = ProductVariant::create([
    'account_id' => $accountA->id,
    'barcode' => '12345',
    'size' => 'M',
]);

// Try to access it from Account B (should fail!)
auth()->user()->account_id = $accountB->id;
$result = ProductVariant::where('account_id', auth()->user()->account_id)
    ->where('barcode', '12345')
    ->first();

// Should be NULL - perfect isolation! ✅
assert($result === null);
```

---

## ✅ Completed: Cleanup Phase (Option 1)

- ✅ Project renamed: `onyx-eservis` → `xpos`
- ✅ Migrations consolidated: 85 files → 1 file (`2025_10_16_000000_create_xpos_schema.php`)
- ✅ [composer.json](../xpos/composer.json) updated to "onyx/xpos"
- ✅ [package.json](../xpos/package.json) updated to "xpos"
- ✅ Dependencies installed (node_modules, vendor present)

---

## 🎯 Implementation Phases

### Phase 1: Database & Models (Week 1)

#### 1.1 Review & Verify Consolidated Migration
**File:** [database/migrations/2025_10_16_000000_create_xpos_schema.php](../xpos/database/migrations/2025_10_16_000000_create_xpos_schema.php)

**Actions:**
- [ ] Review the consolidated schema
- [ ] Verify `product_variants` table exists with proper structure
- [ ] Verify `variant_id` columns added to 8 tables:
  - [ ] `product_stock`
  - [ ] `sale_items`
  - [ ] `goods_receipt_items` (if exists)
  - [ ] `stock_movements`
  - [ ] `warehouse_transfers`
  - [ ] `product_returns`
  - [ ] `service_items`
  - [ ] `stock_history`
- [ ] Verify `customer_items` table (renamed from vehicles)
- [ ] Verify `tailor_services` table (renamed from service_records)
- [ ] Test migration: `php artisan migrate:fresh`

---

#### 1.2 Create ProductVariant Model
**File:** [app/Models/ProductVariant.php](../xpos/app/Models/ProductVariant.php) (NEW)

**⚠️ MULTI-TENANT CRITICAL:**
- MUST use `BelongsToAccount` trait
- MUST include `account_id` in fillable
- MUST have `scopeForAccount()` method
- ALL relationships MUST filter by account_id

**Requirements:**
```php
<?php

namespace App\Models;

use App\Traits\BelongsToAccount;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProductVariant extends Model
{
    use BelongsToAccount, SoftDeletes;

    protected $fillable = [
        'account_id',
        'product_id',
        'sku',
        'barcode',
        'size',
        'color',
        'color_code',
        'pattern',
        'fit',
        'material',
        'price_adjustment',
        'is_active',
    ];

    protected $casts = [
        'price_adjustment' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    protected $appends = [
        'final_price',
        'display_name',
    ];

    // Relationships
    public function account();
    public function product();
    public function stock();
    public function saleItems();

    // Computed attributes
    public function getFinalPriceAttribute(): float;
    public function getDisplayNameAttribute(): string;

    // Scopes
    public function scopeForAccount($query, int $accountId);
    public function scopeActive($query);

    // Stock methods
    public function getTotalStock(): float;
    public function getStockInWarehouse(int $warehouseId): float;
}
```

**Actions:**
- [ ] Create model file
- [ ] Add relationships
- [ ] Add computed attributes
- [ ] Add scopes
- [ ] Add stock methods

---

#### 1.3 Transform Vehicle → CustomerItem
**Files to Create/Rename:**
- [app/Models/CustomerItem.php](../xpos/app/Models/CustomerItem.php) (rename from Vehicle.php)
- [app/Http/Controllers/CustomerItemController.php](../xpos/app/Http/Controllers/CustomerItemController.php) (rename from VehicleController.php)

**⚠️ MULTI-TENANT NOTE:**
- CustomerItem is scoped through customer → account relationship
- No direct `account_id` needed (inherited from customer)
- ALL queries MUST use: `whereHas('customer', fn($q) => $q->where('account_id', $accountId))`

**Model Changes:**
```php
// OLD fields (vehicles)          → NEW fields (customer_items)
plate_number                      → (removed)
vin                              → (removed)
engine_type                      → (removed)
mileage                          → (removed)
brand                            → item_type (e.g., "Jacket", "Dress")
model                            → item_description
year                             → purchase_date
color                            → color (keep)
notes                            → notes (keep)
                                 → fabric (NEW)
                                 → size (NEW)
                                 → special_instructions (NEW)
```

**Actions:**
- [ ] Rename model file
- [ ] Update fillable fields
- [ ] Update relationships (`vehicles` → `customerItems`, `serviceRecords` → `tailorServices`)
- [ ] Update computed attributes
- [ ] Rename controller
- [ ] Update controller methods
- [ ] Update validation rules

---

#### 1.4 Transform ServiceRecord → TailorService
**Files to Create/Rename:**
- [app/Models/TailorService.php](../xpos/app/Models/TailorService.php) (rename from ServiceRecord.php)
- [app/Models/TailorServiceItem.php](../xpos/app/Models/TailorServiceItem.php) (rename from ServiceItem.php)
- [app/Http/Controllers/TailorServiceController.php](../xpos/app/Http/Controllers/TailorServiceController.php) (rename from ServiceRecordController.php)

**⚠️ MULTI-TENANT CRITICAL:**
- TailorService MUST have `account_id` column (already exists from service_records)
- MUST use `BelongsToAccount` trait
- Order number generation MUST be scoped by account_id
- ALL queries MUST filter by account_id

**Model Changes:**
```php
// OLD fields                     → NEW fields
vehicle_id                       → customer_item_id
vehicle_mileage                  → customer_item_condition (text)
service_number                   → order_number
parts_total                      → materials_total
                                 → service_type (NEW: "alteration", "repair", "custom")
                                 → delivery_date (NEW)
```

**Actions:**
- [ ] Rename model files (2 files)
- [ ] Update fillable fields
- [ ] Update relationships
- [ ] Add service_type enum/text handling
- [ ] Update order number generation (TS prefix)
- [ ] Rename controller
- [ ] Update controller methods
- [ ] Update validation rules
- [ ] Add `variant_id` to TailorServiceItem

---

#### 1.5 Update Product Model
**File:** [app/Models/Product.php](../xpos/app/Models/Product.php)

**Changes:**
```php
// ADD: Variant support
public function variants(): HasMany
public function activeVariants(): HasMany
public function hasVariants(): bool
public function getDefaultVariant(): ?ProductVariant

// UPDATE: Stock calculation to include variants
public function getTotalStockAttribute(): float // Now variant-aware

// REMOVE: Packaging methods (auto-service specific)
parsePackagingSize() ❌
calculateUnitPrice() ❌
calculatePriceForQuantity() ❌
getPackagingPrice() ❌
getPriceByUnit() ❌
updatePackagingFromSize() ❌

// SIMPLIFY: Boot method (remove packaging calculations)
```

**Actions:**
- [ ] Add variant relationships
- [ ] Update stock calculations
- [ ] Remove packaging methods
- [ ] Simplify boot method
- [ ] Test model methods

---

### Phase 2: Backend Controllers (Week 2)

#### 2.1 Create ProductVariantController
**File:** [app/Http/Controllers/ProductVariantController.php](../xpos/app/Http/Controllers/ProductVariantController.php) (NEW)

**⚠️ MULTI-TENANT CRITICAL:**
```php
// EVERY method MUST start with:
$accountId = auth()->user()->account_id;

// EVERY query MUST include:
->where('account_id', $accountId)

// Barcode uniqueness check MUST be scoped:
ProductVariant::where('account_id', $accountId)
    ->where('barcode', $barcode)
    ->exists(); // Check per account, not globally!
```

**Methods:**
- [ ] `index()` - List variants for a product (filtered by account_id)
- [ ] `store()` - Create variant(s) (with account_id validation)
- [ ] `update()` - Update variant (verify account ownership first!)
- [ ] `destroy()` - Delete variant (verify account ownership first!)
- [ ] `generateBarcodes()` - Bulk barcode generation (account-scoped uniqueness)
- [ ] `toggleStatus()` - Activate/deactivate variant (verify account ownership first!)

---

#### 2.2 Update ProductController
**File:** [app/Http/Controllers/ProductController.php](../xpos/app/Http/Controllers/ProductController.php)

**Changes:**
- [ ] Add variant creation in `store()` method
- [ ] Add variant updates in `update()` method
- [ ] Include variants in `show()` method
- [ ] Add variant barcode generation endpoint
- [ ] Remove packaging-related logic

---

#### 2.3 Update Stock Management Controllers (8 Controllers)

**⚠️ MULTI-TENANT CRITICAL FOR ALL 8 CONTROLLERS:**
Every stock operation MUST:
1. Filter by `account_id` first
2. Include `variant_id` in stock queries (WHERE product_id AND variant_id)
3. Verify account ownership before ANY update/delete
4. Use account-scoped barcode/SKU lookups

**Files to Update:**
1. [app/Http/Controllers/POSController.php](../xpos/app/Http/Controllers/POSController.php)
   - [ ] Add variant selection in product search (account-scoped)
   - [ ] Update barcode lookup (variant barcodes, account-scoped)
   - [ ] Update stock deduction (with variant_id, account-scoped)
   - [ ] Update sale_items creation (include variant_id, verify account ownership)

2. [app/Http/Controllers/GoodsReceiptController.php](../xpos/app/Http/Controllers/GoodsReceiptController.php)
   - [ ] Add variant selection in receipt form
   - [ ] Update stock addition (with variant_id)
   - [ ] Update goods_receipt_items (include variant_id)

3. [app/Http/Controllers/StockMovementController.php](../xpos/app/Http/Controllers/StockMovementController.php)
   - [ ] Add variant selection
   - [ ] Update stock movement records (with variant_id)

4. [app/Http/Controllers/WarehouseTransferController.php](../xpos/app/Http/Controllers/WarehouseTransferController.php)
   - [ ] Add variant selection
   - [ ] Update transfer logic (with variant_id)

5. [app/Http/Controllers/ProductReturnController.php](../xpos/app/Http/Controllers/ProductReturnController.php)
   - [ ] Add variant selection
   - [ ] Update return logic (with variant_id)

6. [app/Http/Controllers/StockAlertController.php](../xpos/app/Http/Controllers/StockAlertController.php) (if exists)
   - [ ] Update alerts to be variant-aware

7. [app/Http/Controllers/ReportController.php](../xpos/app/Http/Controllers/ReportController.php)
   - [ ] Add variant-level reporting
   - [ ] Update stock reports
   - [ ] Update sales reports

8. [app/Http/Controllers/DashboardController.php](../xpos/app/Http/Controllers/DashboardController.php) (if exists)
   - [ ] Update stock widgets (variant-aware)

---

### Phase 3: Frontend Components (Week 3)

#### 3.1 Create Variant Components

**Component 1: VariantMatrixBuilder.tsx**
**File:** [resources/js/Pages/Products/Components/VariantMatrixBuilder.tsx](../xpos/resources/js/Pages/Products/Components/VariantMatrixBuilder.tsx) (NEW)

**Features:**
- Size selector (XS, S, M, L, XL, XXL, XXXL)
- Color picker with hex codes
- Matrix preview (Size × Color)
- Bulk variant generation
- Price adjustment per variant

**Actions:**
- [ ] Create component file
- [ ] Implement size selection UI
- [ ] Implement color picker UI
- [ ] Add matrix preview
- [ ] Add bulk generation logic
- [ ] Add price adjustment fields

---

**Component 2: VariantSelector.tsx**
**File:** [resources/js/Pages/Products/Components/VariantSelector.tsx](../xpos/resources/js/Pages/Products/Components/VariantSelector.tsx) (NEW)

**Features:**
- Dropdown/modal for variant selection
- Show available stock per variant
- Visual color display
- Quick barcode entry

**Actions:**
- [ ] Create component file
- [ ] Implement variant dropdown
- [ ] Show stock levels
- [ ] Add visual color indicators
- [ ] Add barcode quick entry

---

**Component 3: VariantDisplay.tsx**
**File:** [resources/js/Components/VariantDisplay.tsx](../xpos/resources/js/Components/VariantDisplay.tsx) (NEW)

**Features:**
- Compact variant info display (Size - Color)
- Used in cart, receipts, reports

**Actions:**
- [ ] Create component file
- [ ] Design compact display format
- [ ] Add color swatch display

---

#### 3.2 Update Product Form
**File:** [resources/js/Pages/Products/Components/BasicInfoSection.tsx](../xpos/resources/js/Pages/Products/Components/BasicInfoSection.tsx)

**Changes:**
```tsx
// REMOVE (lines ~53-105):
- Packaging fields (unit, packaging_quantity, base_unit, packaging_size)
- Complex unit dropdowns (şüşə, qutu, teneke, çəllək)

// ADD:
- Checkbox: "Bu məhsulun variantları var"
- VariantMatrixBuilder component (conditional)
- Simplified unit field (always "ədəd" for clothes)
```

**Actions:**
- [ ] Remove packaging fields
- [ ] Add variant checkbox
- [ ] Integrate VariantMatrixBuilder
- [ ] Update form submission
- [ ] Update validation

---

#### 3.3 Update POS Interface
**Files to Update:**
1. [resources/js/Pages/POS/Index.tsx](../xpos/resources/js/Pages/POS/Index.tsx)
   - [ ] Add variant selector after product selection
   - [ ] Update barcode search (variant lookup)
   - [ ] Update cart display (show variant info)
   - [ ] Update checkout logic (include variant_id)

2. [resources/js/Pages/POS/Components/CartSection.tsx](../xpos/resources/js/Pages/POS/Components/CartSection.tsx)
   - [ ] Display variant info (Size - Color)
   - [ ] Show color swatch
   - [ ] Update line item format

3. [resources/js/Pages/POS/Components/ProductSearchSection.tsx](../xpos/resources/js/Pages/POS/Components/ProductSearchSection.tsx)
   - [ ] Add variant filtering
   - [ ] Update barcode scanner

---

#### 3.4 Transform Vehicles → CustomerItems Pages
**Files to Rename:**
- [resources/js/Pages/CustomerItems/](../xpos/resources/js/Pages/CustomerItems/) (rename from Vehicles/)
  - Index.tsx
  - Create.tsx
  - Edit.tsx
  - Show.tsx

**Changes:**
- [ ] Update all references: `vehicles` → `customerItems`
- [ ] Update table columns:
  - `plate_number` → Remove
  - `brand` → `item_type`
  - `model` → `item_description`
  - Add: `fabric`, `size`, `special_instructions`
- [ ] Update forms
- [ ] Update API calls

---

#### 3.5 Transform ServiceRecords → TailorServices Pages
**Files to Rename:**
- [resources/js/Pages/TailorServices/](../xpos/resources/js/Pages/TailorServices/) (rename from ServiceRecords/)
  - Index.tsx
  - Create.tsx
  - Edit.tsx
  - Show.tsx

**Changes:**
- [ ] Update all references: `serviceRecords` → `tailorServices`
- [ ] Update fields:
  - `service_number` → `order_number`
  - `vehicle` → `customerItem`
  - `parts_total` → `materials_total`
  - Add: `service_type`, `delivery_date`
- [ ] Update forms
- [ ] Add service_type selector
- [ ] Update API calls

---

#### 3.6 Update Navigation & Routes
**Files to Update:**
1. [resources/js/Layouts/AuthenticatedLayout.tsx](../xpos/resources/js/Layouts/AuthenticatedLayout.tsx)
   ```tsx
   // REMOVE:
   - { name: 'Avtomaşınlar', href: '/vehicles' }
   - { name: 'Servis', href: '/service-records' }

   // ADD:
   - { name: 'Müştəri Məhsulları', href: '/customer-items' }
   - { name: 'Dərzi Xidmətləri', href: '/tailor-services' }
   ```

2. [routes/web.php](../xpos/routes/web.php)
   ```php
   // REMOVE:
   Route::resource('vehicles', VehicleController::class);
   Route::resource('service-records', ServiceRecordController::class);

   // ADD:
   Route::resource('customer-items', CustomerItemController::class);
   Route::resource('tailor-services', TailorServiceController::class);
   Route::post('products/{product}/variants', [ProductVariantController::class, 'store']);
   Route::post('products/{product}/variants/generate-barcodes', [ProductVariantController::class, 'generateBarcodes']);
   ```

**Actions:**
- [ ] Update navigation menu
- [ ] Update routes file
- [ ] Update breadcrumbs
- [ ] Remove old routes

---

### Phase 4: Configuration & Branding (Week 4)

#### 4.1 Update Configuration Files

**File 1:** [.env](../xpos/.env)
```env
APP_NAME="XPOS - Clothes Retail POS"
```

**File 2:** [config/app.php](../xpos/config/app.php)
```php
'name' => env('APP_NAME', 'XPOS'),
```

**Actions:**
- [ ] Update .env
- [ ] Update config/app.php
- [ ] Update email templates
- [ ] Update receipt templates

---

#### 4.2 Update Documentation
**Files to Update:**
- [ ] [README.md](../xpos/README.md) - Update description
- [ ] Create user manual (optional)
- [ ] Create API documentation (optional)

---

### Phase 5: Testing & Seeding (Week 5)

#### 5.1 Database Testing
**Actions:**
- [ ] Run migration: `php artisan migrate:fresh`
- [ ] Verify all tables created
- [ ] Test foreign keys
- [ ] Test cascade deletes
- [ ] Test multi-tenant isolation

---

#### 5.2 Create Sample Data Seeder
**File:** [database/seeders/XPOSSeeder.php](../xpos/database/seeders/XPOSSeeder.php) (NEW)

**Seed Data:**
- [ ] Sample account (clothes retail)
- [ ] Sample users
- [ ] Sample branches
- [ ] Sample warehouses
- [ ] Sample categories (T-Shirts, Jeans, Dresses, Jackets)
- [ ] Sample products with variants
- [ ] Sample customers
- [ ] Sample customer items
- [ ] Sample tailor services

**Actions:**
- [ ] Create seeder file
- [ ] Add sample data
- [ ] Test seeding: `php artisan db:seed --class=XPOSSeeder`

---

#### 5.3 Integration Testing
**Test Scenarios:**
- [ ] Product creation with variants
- [ ] Barcode generation for variants
- [ ] Goods receipt with variants
- [ ] POS sale with variants
- [ ] Stock movements with variants
- [ ] Warehouse transfer with variants
- [ ] Product return with variants
- [ ] Tailor service creation
- [ ] Reports with variant data

---

### Phase 6: Deployment (Week 6)

#### 6.1 Build & Deploy
**Actions:**
- [ ] Run build: `npm run build`
- [ ] Test production build
- [ ] Clear caches: `php artisan optimize:clear`
- [ ] Run optimizer: `php artisan optimize`
- [ ] Test application

---

#### 6.2 Final Verification Checklist

**Database:**
- [ ] Only 1 consolidated migration exists
- [ ] Migration runs successfully
- [ ] All tables have `account_id` where needed
- [ ] `product_variants` table exists
- [ ] `variant_id` columns exist in 8 tables
- [ ] No vehicle-related tables exist
- [ ] `customer_items` and `tailor_services` tables exist

**Backend:**
- [ ] No Vehicle model exists
- [ ] TailorService model exists
- [ ] CustomerItem model exists
- [ ] ProductVariant model exists
- [ ] All models use BelongsToAccount trait
- [ ] Routes updated (no /vehicles, has /tailor-services)
- [ ] All controllers handle variants

**Frontend:**
- [ ] No Vehicles page exists
- [ ] CustomerItems page exists
- [ ] TailorServices page exists
- [ ] Product form has variant builder
- [ ] POS has variant selector
- [ ] Navigation updated
- [ ] No packaging fields in product form

**Configuration:**
- [ ] APP_NAME = "XPOS"
- [ ] composer.json updated ✅
- [ ] package.json updated ✅
- [ ] Directory renamed to "xpos" ✅

---

## 📊 Progress Tracking

### Week 1: Database & Models
- Phase 1.1: ⏳ Pending
- Phase 1.2: ⏳ Pending
- Phase 1.3: ⏳ Pending
- Phase 1.4: ⏳ Pending
- Phase 1.5: ⏳ Pending

### Week 2: Backend Controllers
- Phase 2.1: ⏳ Pending
- Phase 2.2: ⏳ Pending
- Phase 2.3: ⏳ Pending

### Week 3: Frontend Components
- Phase 3.1: ⏳ Pending
- Phase 3.2: ⏳ Pending
- Phase 3.3: ⏳ Pending
- Phase 3.4: ⏳ Pending
- Phase 3.5: ⏳ Pending
- Phase 3.6: ⏳ Pending

### Week 4: Configuration & Branding
- Phase 4.1: ⏳ Pending
- Phase 4.2: ⏳ Pending

### Week 5: Testing & Seeding
- Phase 5.1: ⏳ Pending
- Phase 5.2: ⏳ Pending
- Phase 5.3: ⏳ Pending

### Week 6: Deployment
- Phase 6.1: ⏳ Pending
- Phase 6.2: ⏳ Pending

---

## 🚀 Quick Start Commands

```bash
# Navigate to project
cd /Users/ruslan/projects/xpos/xpos

# 1. Run migrations
php artisan migrate:fresh

# 2. Seed sample data
php artisan db:seed --class=XPOSSeeder

# 3. Build frontend
npm run build

# 4. Start development
npm run dev

# 5. In another terminal, start Laravel server
php artisan serve

# 6. Access application
# http://localhost:8000
```

---

## 📞 Next Immediate Action

**START WITH: Phase 1.1 - Review Consolidated Migration**

Let me know when you're ready to begin, and I'll help you:
1. Review the consolidated migration file
2. Verify the schema structure
3. Test the migration
4. Move to the next phase

---

---

## ⚠️ Common Multi-Tenant Pitfalls to Avoid

### Pitfall 1: Direct Model::find() Calls
```php
// ❌ WRONG - Can access any account's data!
$variant = ProductVariant::find($id);

// ✅ CORRECT - Always filter by account first
$variant = ProductVariant::where('account_id', auth()->user()->account_id)
    ->where('id', $id)
    ->firstOrFail();
```

### Pitfall 2: Forgetting account_id in Relationships
```php
// ❌ WRONG - Loads all variants from all accounts!
$product->variants;

// ✅ CORRECT - Filter variants by account
$product->variants()->where('account_id', auth()->user()->account_id)->get();
```

### Pitfall 3: Global Unique Constraints
```sql
-- ❌ WRONG - Barcode must be globally unique
UNIQUE KEY (barcode)

-- ✅ CORRECT - Barcode unique per account
UNIQUE KEY (account_id, barcode)
```

### Pitfall 4: Missing account_id in Mass Assignment
```php
// ❌ WRONG - account_id not set!
$variant = ProductVariant::create([
    'product_id' => $productId,
    'size' => 'M',
    'color' => 'Red',
]);

// ✅ CORRECT - Always set account_id
$variant = ProductVariant::create([
    'account_id' => auth()->user()->account_id, // ⚠️ CRITICAL!
    'product_id' => $productId,
    'size' => 'M',
    'color' => 'Red',
]);
```

### Pitfall 5: Forgetting Account Scope in Eager Loading
```php
// ❌ WRONG - Eager loads variants from all accounts!
$products = Product::with('variants')->get();

// ✅ CORRECT - Constrain eager load by account
$products = Product::where('account_id', $accountId)
    ->with(['variants' => function($q) use ($accountId) {
        $q->where('account_id', $accountId);
    }])
    ->get();
```

### Pitfall 6: Stock Queries Without variant_id
```php
// ❌ WRONG - Gets total stock for product across all variants
$stock = ProductStock::where('product_id', $productId)->sum('quantity');

// ✅ CORRECT - Get stock for specific variant
$stock = ProductStock::where('account_id', $accountId)
    ->where('product_id', $productId)
    ->where('variant_id', $variantId) // ⚠️ Don't forget variant!
    ->where('warehouse_id', $warehouseId)
    ->sum('quantity');
```

### Pitfall 7: Forgetting Account in Order Number Generation
```php
// ❌ WRONG - Order numbers clash across accounts!
$lastOrder = TailorService::orderBy('order_number', 'desc')->first();

// ✅ CORRECT - Order numbers scoped per account
$lastOrder = TailorService::where('account_id', $accountId)
    ->orderBy('order_number', 'desc')
    ->first();
```

### Pitfall 8: Frontend Not Respecting Account Scope
```typescript
// ❌ WRONG - Searches all barcodes globally
axios.get(`/api/variants/search?barcode=${scanned}`);

// ✅ CORRECT - Backend automatically filters by auth user's account
// Just ensure backend controller does:
// ->where('account_id', auth()->user()->account_id)
```

---

## 📝 Code Review Checklist (Use This!)

Before committing ANY code, verify:

- [ ] ✅ All queries include `->where('account_id', auth()->user()->account_id)`
- [ ] ✅ All models have `use BelongsToAccount;` trait
- [ ] ✅ All models have `'account_id'` in `$fillable` array
- [ ] ✅ All mass assignments set `'account_id' => auth()->user()->account_id`
- [ ] ✅ All unique constraints include `account_id` in composite key
- [ ] ✅ All foreign keys have proper indexes with `account_id`
- [ ] ✅ All eager loads constrain by `account_id`
- [ ] ✅ All update/delete operations verify account ownership first
- [ ] ✅ All barcode/SKU lookups are account-scoped
- [ ] ✅ All order/reference number generation is account-scoped
- [ ] ✅ Stock queries include both `product_id` AND `variant_id`
- [ ] ✅ Tested with 2+ accounts to verify isolation

---

**Document Created:** 2025-10-16
**Last Updated:** 2025-10-16
**Total Estimated Time:** 6 weeks
**Current Status:** Ready to start Phase 1
**Multi-Tenant Architecture:** ⚠️ CRITICAL - Read the guide above!
