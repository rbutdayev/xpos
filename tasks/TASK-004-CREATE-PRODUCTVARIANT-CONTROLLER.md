# TASK-004: Create ProductVariantController

**Assigned To:** Agent (Developer)
**Phase:** 2.1 - Backend Controllers
**Priority:** HIGH
**Estimated Time:** 4-5 hours
**Due Date:** Day 3-4

---

## 📋 Task Description

Create a new `ProductVariantController` to handle CRUD operations for product variants. This controller is **CRITICAL** for the XPOS clothes retail system as it manages Size × Color variant combinations.

---

## 🎯 Objectives

1. Create `app/Http/Controllers/ProductVariantController.php`
2. Implement CRUD methods with multi-tenant safety
3. Add bulk variant generation endpoint
4. Add barcode generation endpoint
5. Add variant activation/deactivation endpoint
6. Ensure all operations are account-scoped
7. Return proper JSON responses for Inertia.js/React frontend

---

## 📥 Input Files

**Reference Files:**
- `app/Models/ProductVariant.php` (TASK-002 output)
- `app/Models/Product.php` (existing)
- `app/Http/Controllers/ProductController.php` (existing - for reference)
- `tasks/NEXT-STEPS-IMPLEMENTATION.md` (lines 489-525)

**Dependencies:**
- ⚠️ **BLOCKED BY:** TASK-002 (ProductVariant model must exist)

---

## 🔧 Implementation Requirements

### File to Create:
`app/Http/Controllers/ProductVariantController.php`

---

## 📐 Controller Specification

### 1. Namespace & Imports

```php
<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
```

---

### 2. Controller Class

```php
class ProductVariantController extends Controller
{
    /**
     * Get account ID from authenticated user
     * ⚠️ CRITICAL: Use in every method for multi-tenant safety
     */
    protected function getAccountId(): int
    {
        return auth()->user()->account_id;
    }
}
```

---

### 3. Method 1: Index - List Variants for a Product

**Route:** `GET /products/{product}/variants`

**Requirements:**
- ⚠️ Must verify product belongs to current account
- Return all variants for the product (active and inactive)
- Include stock information per variant
- Return Inertia response with product and variants data

```php
/**
 * Display variants for a specific product
 *
 * @param Product $product
 * @return Response
 */
public function index(Product $product): Response
{
    $accountId = $this->getAccountId();

    // ⚠️ CRITICAL: Verify product belongs to account
    if ($product->account_id !== $accountId) {
        abort(403, 'Unauthorized access to product');
    }

    // Get variants with stock information
    $variants = ProductVariant::where('account_id', $accountId)
        ->where('product_id', $product->id)
        ->with(['stock' => function($query) use ($accountId) {
            $query->where('account_id', $accountId);
        }])
        ->orderBy('size')
        ->orderBy('color')
        ->get()
        ->map(function($variant) {
            return [
                'id' => $variant->id,
                'sku' => $variant->sku,
                'barcode' => $variant->barcode,
                'size' => $variant->size,
                'color' => $variant->color,
                'color_code' => $variant->color_code,
                'pattern' => $variant->pattern,
                'fit' => $variant->fit,
                'material' => $variant->material,
                'price_adjustment' => $variant->price_adjustment,
                'final_price' => $variant->final_price,
                'display_name' => $variant->display_name,
                'is_active' => $variant->is_active,
                'total_stock' => $variant->getTotalStock(),
            ];
        });

    return Inertia::render('Products/Variants/Index', [
        'product' => [
            'id' => $product->id,
            'name' => $product->name,
            'sale_price' => $product->sale_price,
        ],
        'variants' => $variants,
    ]);
}
```

---

### 4. Method 2: Store - Create New Variant(s)

**Route:** `POST /products/{product}/variants`

**Requirements:**
- ⚠️ Must verify product belongs to current account
- Support creating single variant OR bulk variants (matrix)
- Validate barcode/SKU uniqueness per account
- Auto-set account_id
- Return created variant(s)

```php
/**
 * Store new variant(s) for a product
 * Supports single variant or bulk creation
 *
 * @param Request $request
 * @param Product $product
 * @return \Illuminate\Http\JsonResponse
 */
public function store(Request $request, Product $product)
{
    $accountId = $this->getAccountId();

    // ⚠️ CRITICAL: Verify product belongs to account
    if ($product->account_id !== $accountId) {
        abort(403, 'Unauthorized access to product');
    }

    // Validate request
    $validated = $request->validate([
        'variants' => 'required|array|min:1',
        'variants.*.size' => 'nullable|string|max:50',
        'variants.*.color' => 'nullable|string|max:50',
        'variants.*.color_code' => 'nullable|string|max:7|regex:/^#[0-9A-Fa-f]{6}$/',
        'variants.*.pattern' => 'nullable|string|max:50',
        'variants.*.fit' => 'nullable|string|max:50',
        'variants.*.material' => 'nullable|string|max:100',
        'variants.*.sku' => [
            'nullable',
            'string',
            'max:100',
            Rule::unique('product_variants', 'sku')
                ->where('account_id', $accountId)
        ],
        'variants.*.barcode' => [
            'nullable',
            'string',
            'max:100',
            Rule::unique('product_variants', 'barcode')
                ->where('account_id', $accountId)
        ],
        'variants.*.price_adjustment' => 'nullable|numeric',
    ]);

    DB::beginTransaction();
    try {
        $createdVariants = [];

        foreach ($validated['variants'] as $variantData) {
            // Check if variant already exists (by size + color)
            $existing = ProductVariant::where('account_id', $accountId)
                ->where('product_id', $product->id)
                ->where('size', $variantData['size'] ?? null)
                ->where('color', $variantData['color'] ?? null)
                ->first();

            if ($existing) {
                continue; // Skip duplicates
            }

            $variant = ProductVariant::create([
                'account_id' => $accountId,
                'product_id' => $product->id,
                'size' => $variantData['size'] ?? null,
                'color' => $variantData['color'] ?? null,
                'color_code' => $variantData['color_code'] ?? null,
                'pattern' => $variantData['pattern'] ?? null,
                'fit' => $variantData['fit'] ?? null,
                'material' => $variantData['material'] ?? null,
                'sku' => $variantData['sku'] ?? null,
                'barcode' => $variantData['barcode'] ?? null,
                'price_adjustment' => $variantData['price_adjustment'] ?? 0,
                'is_active' => true,
            ]);

            $createdVariants[] = $variant;
        }

        DB::commit();

        return response()->json([
            'message' => count($createdVariants) . ' variant(s) created successfully',
            'variants' => $createdVariants,
        ], 201);

    } catch (\Exception $e) {
        DB::rollBack();

        return response()->json([
            'message' => 'Failed to create variants',
            'error' => $e->getMessage(),
        ], 500);
    }
}
```

---

### 5. Method 3: Update - Update Single Variant

**Route:** `PUT /variants/{variant}`

**Requirements:**
- ⚠️ Must verify variant belongs to current account
- Validate barcode/SKU uniqueness (excluding current variant)
- Update only allowed fields
- Return updated variant

```php
/**
 * Update a specific variant
 *
 * @param Request $request
 * @param int $variantId
 * @return \Illuminate\Http\JsonResponse
 */
public function update(Request $request, int $variantId)
{
    $accountId = $this->getAccountId();

    // ⚠️ CRITICAL: Get variant scoped by account
    $variant = ProductVariant::where('account_id', $accountId)
        ->where('id', $variantId)
        ->firstOrFail();

    // Validate request
    $validated = $request->validate([
        'size' => 'nullable|string|max:50',
        'color' => 'nullable|string|max:50',
        'color_code' => 'nullable|string|max:7|regex:/^#[0-9A-Fa-f]{6}$/',
        'pattern' => 'nullable|string|max:50',
        'fit' => 'nullable|string|max:50',
        'material' => 'nullable|string|max:100',
        'sku' => [
            'nullable',
            'string',
            'max:100',
            Rule::unique('product_variants', 'sku')
                ->where('account_id', $accountId)
                ->ignore($variant->id)
        ],
        'barcode' => [
            'nullable',
            'string',
            'max:100',
            Rule::unique('product_variants', 'barcode')
                ->where('account_id', $accountId)
                ->ignore($variant->id)
        ],
        'price_adjustment' => 'nullable|numeric',
        'is_active' => 'nullable|boolean',
    ]);

    $variant->update($validated);

    return response()->json([
        'message' => 'Variant updated successfully',
        'variant' => $variant->fresh(),
    ]);
}
```

---

### 6. Method 4: Destroy - Delete Variant

**Route:** `DELETE /variants/{variant}`

**Requirements:**
- ⚠️ Must verify variant belongs to current account
- Check if variant has stock (prevent deletion if stock exists)
- Use soft delete
- Return success message

```php
/**
 * Delete a variant (soft delete)
 *
 * @param int $variantId
 * @return \Illuminate\Http\JsonResponse
 */
public function destroy(int $variantId)
{
    $accountId = $this->getAccountId();

    // ⚠️ CRITICAL: Get variant scoped by account
    $variant = ProductVariant::where('account_id', $accountId)
        ->where('id', $variantId)
        ->firstOrFail();

    // Check if variant has stock
    $totalStock = $variant->getTotalStock();
    if ($totalStock > 0) {
        return response()->json([
            'message' => 'Cannot delete variant with existing stock',
            'stock' => $totalStock,
        ], 422);
    }

    $variant->delete(); // Soft delete

    return response()->json([
        'message' => 'Variant deleted successfully',
    ]);
}
```

---

### 7. Method 5: Generate Barcodes - Bulk Barcode Generation

**Route:** `POST /products/{product}/variants/generate-barcodes`

**Requirements:**
- ⚠️ Must verify product belongs to current account
- Generate unique barcodes for variants without barcodes
- Use EAN-13 or custom format
- Return updated variants

```php
/**
 * Generate barcodes for variants that don't have one
 *
 * @param Product $product
 * @return \Illuminate\Http\JsonResponse
 */
public function generateBarcodes(Product $product)
{
    $accountId = $this->getAccountId();

    // ⚠️ CRITICAL: Verify product belongs to account
    if ($product->account_id !== $accountId) {
        abort(403, 'Unauthorized access to product');
    }

    // Get variants without barcodes
    $variants = ProductVariant::where('account_id', $accountId)
        ->where('product_id', $product->id)
        ->whereNull('barcode')
        ->get();

    if ($variants->isEmpty()) {
        return response()->json([
            'message' => 'All variants already have barcodes',
            'count' => 0,
        ]);
    }

    DB::beginTransaction();
    try {
        $updated = 0;

        foreach ($variants as $variant) {
            // Generate unique barcode (EAN-13 format or custom)
            $barcode = $this->generateUniqueBarcode($accountId);

            $variant->update(['barcode' => $barcode]);
            $updated++;
        }

        DB::commit();

        return response()->json([
            'message' => "Barcodes generated for {$updated} variant(s)",
            'count' => $updated,
        ]);

    } catch (\Exception $e) {
        DB::rollBack();

        return response()->json([
            'message' => 'Failed to generate barcodes',
            'error' => $e->getMessage(),
        ], 500);
    }
}

/**
 * Generate a unique barcode for the account
 * Format: Account-scoped EAN-13 compatible
 *
 * @param int $accountId
 * @return string
 */
protected function generateUniqueBarcode(int $accountId): string
{
    do {
        // Generate 12-digit number (EAN-13 without check digit)
        $barcode = str_pad($accountId, 3, '0', STR_PAD_LEFT)
                 . str_pad(mt_rand(0, 999999999), 9, '0', STR_PAD_LEFT);

        // Check if barcode exists in this account
        $exists = ProductVariant::where('account_id', $accountId)
            ->where('barcode', $barcode)
            ->exists();

    } while ($exists);

    return $barcode;
}
```

---

### 8. Method 6: Toggle Status - Activate/Deactivate Variant

**Route:** `POST /variants/{variant}/toggle-status`

**Requirements:**
- ⚠️ Must verify variant belongs to current account
- Toggle is_active status
- Return updated variant

```php
/**
 * Toggle variant active status
 *
 * @param int $variantId
 * @return \Illuminate\Http\JsonResponse
 */
public function toggleStatus(int $variantId)
{
    $accountId = $this->getAccountId();

    // ⚠️ CRITICAL: Get variant scoped by account
    $variant = ProductVariant::where('account_id', $accountId)
        ->where('id', $variantId)
        ->firstOrFail();

    $variant->update([
        'is_active' => !$variant->is_active,
    ]);

    return response()->json([
        'message' => 'Variant status updated',
        'variant' => $variant->fresh(),
    ]);
}
```

---

## 📤 Expected Output

### 1. Create Controller File

**File:** `app/Http/Controllers/ProductVariantController.php`

Complete implementation following the specification above.

---

### 2. Update Routes

**File:** `routes/web.php`

Add these routes:

```php
// Product Variants
Route::prefix('products/{product}')->group(function() {
    Route::get('/variants', [ProductVariantController::class, 'index'])
        ->name('products.variants.index');
    Route::post('/variants', [ProductVariantController::class, 'store'])
        ->name('products.variants.store');
    Route::post('/variants/generate-barcodes', [ProductVariantController::class, 'generateBarcodes'])
        ->name('products.variants.generate-barcodes');
});

Route::prefix('variants')->group(function() {
    Route::put('/{variant}', [ProductVariantController::class, 'update'])
        ->name('variants.update');
    Route::delete('/{variant}', [ProductVariantController::class, 'destroy'])
        ->name('variants.destroy');
    Route::post('/{variant}/toggle-status', [ProductVariantController::class, 'toggleStatus'])
        ->name('variants.toggle-status');
});
```

---

### 3. Create Output Report

**File:** `tasks/TASK-004-OUTPUT.md`

```markdown
# TASK-004 Output: ProductVariantController Implementation

**Implemented By:** [Agent Name]
**Date:** [Date]
**Status:** ✅ Complete / ⚠️ Issues Found

---

## ✅ Completed Items

- [x] Created app/Http/Controllers/ProductVariantController.php
- [x] Implemented index() method with account scoping
- [x] Implemented store() method with bulk support
- [x] Implemented update() method with validation
- [x] Implemented destroy() method with stock check
- [x] Implemented generateBarcodes() method
- [x] Implemented toggleStatus() method
- [x] Added routes to routes/web.php
- [x] Multi-tenant safety verified in all methods

---

## 🧪 Testing Results

### Test 1: Create Variant via API
```bash
curl -X POST http://localhost:8000/products/1/variants \
  -H "Content-Type: application/json" \
  -d '{
    "variants": [
      {"size": "M", "color": "Red", "color_code": "#FF0000", "price_adjustment": 0},
      {"size": "L", "color": "Red", "color_code": "#FF0000", "price_adjustment": 5}
    ]
  }'
```

**Result:** [✅ Pass / ❌ Fail - describe result]

### Test 2: Generate Barcodes
```bash
curl -X POST http://localhost:8000/products/1/variants/generate-barcodes
```

**Result:** [✅ Pass / ❌ Fail - describe result]

### Test 3: Multi-Tenant Isolation
- Created variant for Account A
- Attempted to access from Account B
- **Result:** [✅ 403 Forbidden / ❌ Security breach]

---

## ⚠️ Issues Encountered

[List any issues, errors, or concerns]

---

## 📝 Routes Added

- GET /products/{product}/variants
- POST /products/{product}/variants
- POST /products/{product}/variants/generate-barcodes
- PUT /variants/{variant}
- DELETE /variants/{variant}
- POST /variants/{variant}/toggle-status

---

## ✅ Multi-Tenant Safety Verified

- [x] All methods call getAccountId()
- [x] All queries filter by account_id
- [x] Product ownership verified before variant operations
- [x] Variant ownership verified before update/delete
- [x] Barcode uniqueness scoped per account
- [x] SKU uniqueness scoped per account

---

## 📊 Statistics

- Lines of code: ~XXX
- Methods implemented: 6 + 2 helpers
- Routes added: 6
- Validation rules: XX+

---

## ✅ Definition of Done

- [x] Controller file created
- [x] All 6 methods implemented
- [x] Routes added
- [x] Multi-tenant safety verified
- [x] Output report created
```

---

## ✅ Definition of Done

- [ ] `app/Http/Controllers/ProductVariantController.php` created
- [ ] All 6 methods implemented (index, store, update, destroy, generateBarcodes, toggleStatus)
- [ ] getAccountId() helper method implemented
- [ ] All methods include account_id filtering
- [ ] Validation rules include account-scoped uniqueness
- [ ] Barcode generation algorithm implemented
- [ ] Stock check before deletion implemented
- [ ] Routes added to routes/web.php
- [ ] PHP syntax valid (no errors)
- [ ] Multi-tenant safety verified (all methods check account ownership)
- [ ] Output report created at `tasks/TASK-004-OUTPUT.md`

---

## 🔗 Related Tasks

- **Depends On:** TASK-002 (ProductVariant model - COMPLETE)
- **Blocks:** Frontend variant components (Phase 3)
- **Related:** TASK-005, TASK-006 (other controllers)

---

## ⚠️ Multi-Tenant Safety Reminders

Before submitting, verify:

1. ✅ Every method calls `$this->getAccountId()`
2. ✅ Every query includes `->where('account_id', $accountId)`
3. ✅ Product ownership verified before accessing variants
4. ✅ Variant ownership verified before update/delete
5. ✅ Barcode/SKU uniqueness uses `Rule::unique()->where('account_id', $accountId)`
6. ✅ No direct Product::find() or ProductVariant::find() without account check

---

## 📞 Testing Checklist

Manual tests to run:

```bash
# 1. Test variant creation
php artisan tinker
> $product = Product::first();
> $response = (new ProductVariantController)->store($request, $product);

# 2. Test barcode generation
> $response = (new ProductVariantController)->generateBarcodes($product);

# 3. Test multi-tenant isolation
> // Login as Account A user
> $variantA = ProductVariant::first();
> // Switch to Account B user
> $response = (new ProductVariantController)->update($request, $variantA->id);
> // Should return 404 (variant not found in Account B scope)
```

---

**START THIS TASK AFTER TASK-002 IS VERIFIED COMPLETE**
