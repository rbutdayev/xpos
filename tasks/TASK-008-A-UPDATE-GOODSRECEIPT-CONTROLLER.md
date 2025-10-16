# TASK-008-A: Update GoodsReceiptController for Variant Support

**Created:** 2025-10-16
**Priority:** 🔴 HIGH
**Est. Time:** 2-3 hours
**Status:** In Progress

---

## 📋 Task Overview

Update the **GoodsReceiptController** to support receiving stock with product variants. This is part of the larger TASK-008 which updates all stock management controllers to handle Size × Color variants.

---

## 🎯 Objectives

1. Add `variant_id` support to goods receipt creation and updates
2. Update barcode scanning to detect variant barcodes first
3. Validate that variants belong to the correct product and account
4. Update stock movements to include `variant_id`
5. Update ProductStock queries to include `variant_id`

---

## 📂 Files to Modify

### 1. **Controller**
- File: `app/Http/Controllers/GoodsReceiptController.php`
- Methods to update:
  - `store()` - Add variant_id to creation
  - `update()` - Add variant_id to updates
  - `searchProductByBarcode()` - Check variants first
  - `destroy()` - Handle variant_id in stock deduction

### 2. **Model** (Already supports variants)
- File: `app/Models/GoodsReceipt.php`
- Already has relationships with variants through ProductVariant model
- May need to add `variant_id` to fillable array

---

## 🔧 Implementation Details

### A. Update `store()` Method

**Current Behavior:**
```php
foreach ($request->products as $productData) {
    $goodsReceipt = new GoodsReceipt();
    $goodsReceipt->product_id = $productData['product_id'];
    // ... other fields
}
```

**New Behavior:**
```php
foreach ($request->products as $productData) {
    $goodsReceipt = new GoodsReceipt();
    $goodsReceipt->product_id = $productData['product_id'];
    $goodsReceipt->variant_id = $productData['variant_id'] ?? null;  // NEW

    // Validate variant belongs to product and account
    if ($goodsReceipt->variant_id) {
        $variant = ProductVariant::where('id', $productData['variant_id'])
            ->where('account_id', auth()->user()->account_id)
            ->where('product_id', $productData['product_id'])
            ->first();

        if (!$variant) {
            throw new \Exception('Invalid variant for this product');
        }
    }
    // ... rest of creation
}
```

**Validation Rules to Add:**
```php
$request->validate([
    // ... existing rules
    'products.*.variant_id' => 'nullable|exists:product_variants,id',
]);
```

### B. Update StockMovement Creation

**Current:**
```php
$stockMovement = new StockMovement();
$stockMovement->product_id = $productData['product_id'];
// ... other fields
```

**New:**
```php
$stockMovement = new StockMovement();
$stockMovement->product_id = $productData['product_id'];
$stockMovement->variant_id = $productData['variant_id'] ?? null;  // NEW
// ... other fields
```

### C. Update ProductStock Queries

**Current:**
```php
$productStock = ProductStock::firstOrCreate(
    [
        'product_id' => $productData['product_id'],
        'warehouse_id' => $request->warehouse_id,
        'account_id' => auth()->user()->account_id,
    ],
    [
        'quantity' => 0,
        'reserved_quantity' => 0,
        'min_level' => 3,
    ]
);
```

**New:**
```php
$productStock = ProductStock::firstOrCreate(
    [
        'product_id' => $productData['product_id'],
        'variant_id' => $productData['variant_id'] ?? null,  // NEW
        'warehouse_id' => $request->warehouse_id,
        'account_id' => auth()->user()->account_id,
    ],
    [
        'quantity' => 0,
        'reserved_quantity' => 0,
        'min_level' => 3,
    ]
);
```

### D. Update `searchProductByBarcode()` Method

**Current Logic:**
1. Search product by barcode
2. Return product

**New Logic:**
1. Search **variant** barcode first
2. If variant found, return variant + product
3. If not found, search product barcode
4. Return result

**Implementation:**
```php
public function searchProductByBarcode(Request $request)
{
    $barcode = trim($request->barcode);

    // STEP 1: Check if it's a variant barcode
    $variant = ProductVariant::byAccount(auth()->user()->account_id)
        ->where('barcode', $barcode)
        ->with('product')
        ->active()
        ->first();

    if ($variant) {
        return response()->json([
            'success' => true,
            'type' => 'variant',
            'variant' => [
                'id' => $variant->id,
                'size' => $variant->size,
                'color' => $variant->color,
                'color_code' => $variant->color_code,
                'barcode' => $variant->barcode,
                'sku' => $variant->sku,
                'final_price' => $variant->final_price,
            ],
            'product' => [
                'id' => $variant->product->id,
                'name' => $variant->product->name,
                'sku' => $variant->product->sku,
                'unit' => $variant->product->unit,
                'has_variants' => true,
            ],
        ]);
    }

    // STEP 2: Check if it's a product barcode
    $product = Product::byAccount(auth()->user()->account_id)
        ->where('barcode', $barcode)
        ->active()
        ->products()
        ->first();

    if (!$product) {
        return response()->json([
            'success' => false,
            'message' => 'Bu barkodla məhsul tapılmadı',
        ], 404);
    }

    // Check if product has variants
    $hasVariants = $product->variants()->active()->exists();

    return response()->json([
        'success' => true,
        'type' => 'product',
        'product' => [
            'id' => $product->id,
            'name' => $product->name,
            'sku' => $product->sku,
            'barcode' => $product->barcode,
            'unit' => $product->unit,
            'has_variants' => $hasVariants,
        ],
        'variants' => $hasVariants ? $product->variants()->active()->get() : [],
    ]);
}
```

### E. Update `update()` Method

Add variant_id handling to the update method:

```php
// Validate
$request->validate([
    // ... existing rules
    'variant_id' => 'nullable|exists:product_variants,id',
]);

// Update goods receipt
$goodsReceipt->variant_id = $request->variant_id;

// Update stock queries to include variant_id
$productStock = ProductStock::where('product_id', $goodsReceipt->product_id)
    ->where('variant_id', $goodsReceipt->variant_id)
    ->where('warehouse_id', $goodsReceipt->warehouse_id)
    ->where('account_id', $goodsReceipt->account_id)
    ->first();
```

### F. Update `destroy()` Method

Update the stock deduction to include variant_id:

```php
$stockMovement = StockMovement::where('reference_type', 'goods_receipt')
    ->where('reference_id', $goodsReceipt->id)
    ->first();

if ($stockMovement) {
    $productStock = ProductStock::where('product_id', $goodsReceipt->product_id)
        ->where('variant_id', $goodsReceipt->variant_id)  // NEW
        ->where('warehouse_id', $goodsReceipt->warehouse_id)
        ->where('account_id', $goodsReceipt->account_id)
        ->first();

    if ($productStock) {
        $productStock->decrement('quantity', (float) $goodsReceipt->quantity);
    }

    $stockMovement->delete();
}
```

---

## 🔒 Multi-Tenant Safety Checklist

- [ ] All variant queries include `account_id` filter
- [ ] Validate variant belongs to correct account before using
- [ ] Validate variant belongs to correct product
- [ ] ProductStock queries include both `product_id` AND `variant_id`
- [ ] StockMovement records include `variant_id`

---

## ✅ Testing Checklist

### Test Case 1: Receive Stock WITHOUT Variant
- [ ] Create goods receipt for product without variants
- [ ] Verify stock increases correctly
- [ ] Verify variant_id is NULL in database

### Test Case 2: Receive Stock WITH Variant
- [ ] Create goods receipt with variant_id
- [ ] Verify stock increases for correct variant
- [ ] Verify variant_id is stored correctly

### Test Case 3: Barcode Scanning
- [ ] Scan variant barcode → Should return variant + product
- [ ] Scan product barcode (no variants) → Should return product
- [ ] Scan product barcode (has variants) → Should return product + variant list

### Test Case 4: Multi-Tenant Isolation
- [ ] Account A cannot receive stock for Account B's variants
- [ ] Variant validation rejects cross-account variants
- [ ] Stock queries are isolated per account

### Test Case 5: Update & Delete
- [ ] Update goods receipt with variant
- [ ] Delete goods receipt with variant
- [ ] Verify stock adjusts correctly

---

## 📊 Database Changes Required

### GoodsReceipt Model
- Add `variant_id` to `$fillable` array (if not already present)
- Ensure relationship with ProductVariant exists

### Example Migration (if needed):
```php
Schema::table('goods_receipts', function (Blueprint $table) {
    $table->unsignedBigInteger('variant_id')->nullable()->after('product_id');

    $table->foreign('variant_id')
        ->references('id')
        ->on('product_variants')
        ->onDelete('set null');
});
```

---

## 🚀 Deployment Steps

1. ✅ Update GoodsReceipt model (add variant_id to fillable)
2. ✅ Update GoodsReceiptController methods
3. ✅ Test all scenarios locally
4. ✅ Review code for multi-tenant safety
5. ⏳ Deploy to staging
6. ⏳ Run integration tests
7. ⏳ Deploy to production

---

## 📝 Notes

- **Backward Compatibility:** Products without variants will have `variant_id = null`
- **Stock Tracking:** Always use both `product_id` AND `variant_id` in ProductStock queries
- **Barcode Precedence:** Variant barcode takes precedence over product barcode
- **Validation:** Always validate that variant belongs to the selected product AND account

---

## 🔗 Related Tasks

- **TASK-007:** POSController variant support (prerequisite)
- **TASK-008-B:** StockMovementController (next)
- **TASK-008-C:** WarehouseTransferController (next)
- **TASK-008-D:** ProductReturnController (next)

---

**Status:** Ready for implementation
**Assigned To:** Claude Code
**Last Updated:** 2025-10-16
