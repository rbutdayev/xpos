# TASK-007: Update POSController for Product Variant Support

**Assigned To:** Agent (Developer)
**Phase:** 2.4 - Backend Controllers (POS Integration)
**Priority:** CRITICAL
**Estimated Time:** 5-6 hours
**Due Date:** Day 7-8

---

## 📋 Task Description

Update the existing `POSController` to support product variants in the Point of Sale system. This is **CRITICAL** for the XPOS clothes retail system as customers need to select size and color when selling products.

---

## 🎯 Objectives

1. Update product search to include variant information
2. Add variant selection logic for products with variants
3. Update barcode scanning to recognize variant barcodes
4. Update cart/sale creation to store variant_id
5. Update stock deduction to use variant_id
6. Ensure multi-tenant safety throughout
7. Handle products both WITH and WITHOUT variants

---

## 📥 Input Files

**Files to Update:**
- `app/Http/Controllers/POSController.php` (existing)

**Reference Files:**
- `app/Models/ProductVariant.php` (TASK-002 output)
- `app/Models/Product.php` (existing)
- `app/Http/Controllers/ProductVariantController.php` (TASK-004 output)

**Dependencies:**
- ⚠️ **BLOCKED BY:** TASK-002 (ProductVariant model), TASK-004 (ProductVariantController)

---

## 🔧 Implementation Requirements

### 1. Update Product Search Method

**Current:** Returns products only
**NEW:** Return products with variant information

```php
/**
 * Search products for POS (with variant support)
 *
 * @param Request $request
 * @return \Illuminate\Http\JsonResponse
 */
public function searchProducts(Request $request)
{
    $accountId = auth()->user()->account_id;
    $search = $request->input('q');

    $products = Product::where('account_id', $accountId)
        ->where('is_active', true)
        ->where(function($query) use ($search) {
            $query->where('name', 'like', "%{$search}%")
                  ->orWhere('barcode', $search)
                  ->orWhere('sku', $search);
        })
        ->with(['variants' => function($q) use ($accountId) {
            $q->where('account_id', $accountId)
              ->where('is_active', true)
              ->with(['stock' => function($sq) use ($accountId) {
                  $sq->where('account_id', $accountId);
              }]);
        }])
        ->limit(20)
        ->get()
        ->map(function($product) {
            return [
                'id' => $product->id,
                'name' => $product->name,
                'sku' => $product->sku,
                'barcode' => $product->barcode,
                'sale_price' => $product->sale_price,
                'has_variants' => $product->variants->isNotEmpty(),
                'variants' => $product->variants->map(function($variant) {
                    return [
                        'id' => $variant->id,
                        'size' => $variant->size,
                        'color' => $variant->color,
                        'color_code' => $variant->color_code,
                        'display_name' => $variant->display_name,
                        'short_display' => $variant->short_display,
                        'final_price' => $variant->final_price,
                        'barcode' => $variant->barcode,
                        'sku' => $variant->sku,
                        'total_stock' => $variant->getTotalStock(),
                        'is_active' => $variant->is_active,
                    ];
                }),
                'category' => $product->category?->name,
            ];
        });

    return response()->json($products);
}
```

---

### 2. Add Barcode Scanner with Variant Support

**Current:** Scans product barcodes only
**NEW:** Scan variant barcodes first, then product barcodes

```php
/**
 * Scan barcode (supports both product and variant barcodes)
 *
 * @param Request $request
 * @return \Illuminate\Http\JsonResponse
 */
public function scanBarcode(Request $request)
{
    $accountId = auth()->user()->account_id;
    $barcode = $request->input('barcode');

    if (empty($barcode)) {
        return response()->json(['error' => 'Barcode is required'], 400);
    }

    // First, try to find variant by barcode
    $variant = ProductVariant::where('account_id', $accountId)
        ->where('barcode', $barcode)
        ->where('is_active', true)
        ->with(['product' => function($q) use ($accountId) {
            $q->where('account_id', $accountId);
        }])
        ->first();

    if ($variant && $variant->product && $variant->product->is_active) {
        // Found variant - return with product data
        return response()->json([
            'type' => 'variant',
            'product' => [
                'id' => $variant->product->id,
                'name' => $variant->product->name,
                'category' => $variant->product->category?->name,
                'has_variants' => true,
            ],
            'variant' => [
                'id' => $variant->id,
                'size' => $variant->size,
                'color' => $variant->color,
                'color_code' => $variant->color_code,
                'display_name' => $variant->display_name,
                'short_display' => $variant->short_display,
                'final_price' => $variant->final_price,
                'barcode' => $variant->barcode,
                'total_stock' => $variant->getTotalStock(),
            ]
        ]);
    }

    // If variant not found, try to find product by barcode
    $product = Product::where('account_id', $accountId)
        ->where('barcode', $barcode)
        ->where('is_active', true)
        ->with(['variants' => function($q) use ($accountId) {
            $q->where('account_id', $accountId)
              ->where('is_active', true);
        }])
        ->first();

    if ($product) {
        // Found product
        $hasVariants = $product->variants->isNotEmpty();

        return response()->json([
            'type' => 'product',
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'sku' => $product->sku,
                'barcode' => $product->barcode,
                'sale_price' => $product->sale_price,
                'category' => $product->category?->name,
                'has_variants' => $hasVariants,
                'variants' => $hasVariants ? $product->variants->map(function($v) {
                    return [
                        'id' => $v->id,
                        'size' => $v->size,
                        'color' => $v->color,
                        'color_code' => $v->color_code,
                        'display_name' => $v->display_name,
                        'final_price' => $v->final_price,
                        'total_stock' => $v->getTotalStock(),
                    ];
                }) : null,
            ],
            'variant' => null, // Requires user to select variant
        ]);
    }

    // Not found
    return response()->json(['error' => 'Product or variant not found'], 404);
}
```

---

### 3. Update Add to Cart Method

**Add variant_id support:**

```php
/**
 * Add product to cart (with variant support)
 *
 * @param Request $request
 * @return \Illuminate\Http\JsonResponse
 */
public function addToCart(Request $request)
{
    $accountId = auth()->user()->account_id;

    $validated = $request->validate([
        'product_id' => 'required|exists:products,id',
        'variant_id' => 'nullable|exists:product_variants,id',
        'quantity' => 'required|numeric|min:0.01',
        'price' => 'required|numeric|min:0',
    ]);

    // Verify product belongs to account
    $product = Product::where('account_id', $accountId)
        ->where('id', $validated['product_id'])
        ->firstOrFail();

    // If variant provided, verify it belongs to account and product
    $variant = null;
    if (!empty($validated['variant_id'])) {
        $variant = ProductVariant::where('account_id', $accountId)
            ->where('product_id', $validated['product_id'])
            ->where('id', $validated['variant_id'])
            ->firstOrFail();
    }

    // Check if product requires variant but none provided
    $hasVariants = ProductVariant::where('account_id', $accountId)
        ->where('product_id', $product->id)
        ->where('is_active', true)
        ->exists();

    if ($hasVariants && !$variant) {
        return response()->json([
            'error' => 'Please select a variant (size/color) for this product'
        ], 422);
    }

    // Add to session cart
    $cart = session()->get('pos_cart', []);

    // Generate unique cart key (product + variant)
    $cartKey = $product->id . '_' . ($variant?->id ?? '0');

    if (isset($cart[$cartKey])) {
        // Update existing cart item
        $cart[$cartKey]['quantity'] += $validated['quantity'];
    } else {
        // Add new cart item
        $cart[$cartKey] = [
            'product_id' => $product->id,
            'variant_id' => $variant?->id,
            'product_name' => $product->name,
            'variant_display' => $variant?->short_display,
            'quantity' => $validated['quantity'],
            'price' => $validated['price'],
            'subtotal' => $validated['price'] * $validated['quantity'],
        ];
    }

    session()->put('pos_cart', $cart);

    return response()->json([
        'success' => true,
        'cart' => $cart,
        'cart_count' => count($cart),
        'cart_total' => array_sum(array_column($cart, 'subtotal')),
    ]);
}
```

---

### 4. Update Create Sale Method

**Store variant_id in sale_items:**

```php
/**
 * Create sale (with variant support)
 *
 * @param Request $request
 * @return \Illuminate\Http\RedirectResponse
 */
public function store(Request $request)
{
    $accountId = auth()->user()->account_id;
    $warehouseId = auth()->user()->default_warehouse_id;

    $validated = $request->validate([
        'customer_id' => 'nullable|exists:customers,id',
        'items' => 'required|array|min:1',
        'items.*.product_id' => 'required|exists:products,id',
        'items.*.variant_id' => 'nullable|exists:product_variants,id',
        'items.*.quantity' => 'required|numeric|min:0.01',
        'items.*.price' => 'required|numeric|min:0',
        'discount' => 'nullable|numeric|min:0',
        'payment_method' => 'required|in:cash,card,credit',
        'paid_amount' => 'required_if:payment_method,cash,card|numeric|min:0',
    ]);

    DB::beginTransaction();
    try {
        // Create sale
        $sale = Sale::create([
            'account_id' => $accountId,
            'customer_id' => $validated['customer_id'] ?? null,
            'branch_id' => auth()->user()->branch_id,
            'warehouse_id' => $warehouseId,
            'user_id' => auth()->id(),
            'sale_date' => now(),
            'discount' => $validated['discount'] ?? 0,
            'payment_method' => $validated['payment_method'],
            'status' => 'completed',
        ]);

        $subtotal = 0;

        // Create sale items and deduct stock
        foreach ($validated['items'] as $item) {
            // Verify product and variant belong to account
            $product = Product::where('account_id', $accountId)
                ->findOrFail($item['product_id']);

            $variant = null;
            if (!empty($item['variant_id'])) {
                $variant = ProductVariant::where('account_id', $accountId)
                    ->where('product_id', $item['product_id'])
                    ->findOrFail($item['variant_id']);
            }

            $itemTotal = $item['price'] * $item['quantity'];
            $subtotal += $itemTotal;

            // Create sale item with variant_id
            SaleItem::create([
                'sale_id' => $sale->id,
                'product_id' => $item['product_id'],
                'variant_id' => $item['variant_id'] ?? null, // ⚠️ Store variant_id
                'quantity' => $item['quantity'],
                'price' => $item['price'],
                'total' => $itemTotal,
            ]);

            // Deduct stock (with variant support)
            $this->deductStock(
                $accountId,
                $warehouseId,
                $item['product_id'],
                $item['variant_id'] ?? null,
                $item['quantity']
            );
        }

        // Update sale totals
        $sale->update([
            'subtotal' => $subtotal,
            'total' => $subtotal - ($validated['discount'] ?? 0),
            'paid_amount' => $validated['paid_amount'] ?? 0,
        ]);

        DB::commit();

        return redirect()
            ->route('pos.index')
            ->with('success', "Sale #{$sale->id} created successfully");

    } catch (\Exception $e) {
        DB::rollBack();
        return redirect()
            ->back()
            ->withInput()
            ->with('error', 'Failed to create sale: ' . $e->getMessage());
    }
}
```

---

### 5. Update Stock Deduction Method

**Add variant_id parameter:**

```php
/**
 * Deduct stock from warehouse (with variant support)
 *
 * @param int $accountId
 * @param int $warehouseId
 * @param int $productId
 * @param int|null $variantId
 * @param float $quantity
 * @return void
 */
protected function deductStock(
    int $accountId,
    int $warehouseId,
    int $productId,
    ?int $variantId,
    float $quantity
): void
{
    // Find or create product stock record
    $stock = ProductStock::firstOrCreate(
        [
            'account_id' => $accountId,
            'warehouse_id' => $warehouseId,
            'product_id' => $productId,
            'variant_id' => $variantId, // ⚠️ Include variant_id in lookup
        ],
        [
            'quantity' => 0,
        ]
    );

    // Deduct quantity
    $newQuantity = $stock->quantity - $quantity;
    $stock->update(['quantity' => $newQuantity]);

    // Create stock movement record
    StockMovement::create([
        'account_id' => $accountId,
        'warehouse_id' => $warehouseId,
        'product_id' => $productId,
        'variant_id' => $variantId, // ⚠️ Store variant_id
        'movement_type' => 'xaric_olma', // Outgoing
        'quantity' => $quantity,
        'balance_after' => $newQuantity,
        'reference_type' => 'sale',
        'notes' => 'POS Sale',
        'user_id' => auth()->id(),
    ]);

    // Alert if negative stock
    if ($newQuantity < 0) {
        NegativeStockAlert::create([
            'account_id' => $accountId,
            'warehouse_id' => $warehouseId,
            'product_id' => $productId,
            'variant_id' => $variantId, // ⚠️ Store variant_id
            'quantity' => abs($newQuantity),
            'alert_date' => now(),
        ]);
    }
}
```

---

## 📤 Expected Output

### 1. Updated Controller File

**File:** `app/Http/Controllers/POSController.php`

Complete updates following the specifications above.

---

### 2. Create Output Report

**File:** `tasks/TASK-007-OUTPUT.md`

```markdown
# TASK-007 Output: POSController Variant Support

**Implemented By:** [Agent Name]
**Date:** [Date]
**Status:** ✅ Complete / ⚠️ Issues Found

---

## ✅ Completed Items

- [x] Updated searchProducts() method with variant support
- [x] Updated/created scanBarcode() method with variant detection
- [x] Updated addToCart() method with variant_id
- [x] Updated store() method to save variant_id in sale_items
- [x] Updated deductStock() method with variant_id parameter
- [x] Added variant requirement validation
- [x] Multi-tenant safety verified

---

## 🧪 Testing Results

### Test 1: Search Products with Variants
```bash
GET /pos/search?q=Shirt
```
**Result:** [✅ Pass / ❌ Fail - describe]

### Test 2: Scan Variant Barcode
```bash
POST /pos/scan-barcode
{"barcode": "001123456789"}
```
**Result:** [✅ Returns variant / ❌ Not found]

### Test 3: Add Variant to Cart
```bash
POST /pos/add-to-cart
{"product_id": 1, "variant_id": 5, "quantity": 2, "price": 50}
```
**Result:** [✅ Added / ❌ Error]

### Test 4: Create Sale with Variants
```bash
POST /pos/sales
{"items": [{"product_id": 1, "variant_id": 5, "quantity": 1, "price": 50}], ...}
```
**Result:** [✅ Sale created / ❌ Error]

### Test 5: Stock Deduction
- Check ProductStock record includes variant_id
- Check StockMovement record includes variant_id
- **Result:** [✅ Correct / ❌ Missing variant_id]

---

## ⚠️ Issues Encountered

[List any issues]

---

## ✅ Multi-Tenant Safety Verified

- [x] All product queries filter by account_id
- [x] All variant queries filter by account_id
- [x] Product and variant ownership verified before operations
- [x] Stock operations scoped by account_id

---

## ✅ Definition of Done

- [x] All methods updated
- [x] Variant support added
- [x] Multi-tenant safety verified
- [x] Output report created
```

---

## ✅ Definition of Done

- [ ] `POSController.php` updated
- [ ] searchProducts() returns variants
- [ ] scanBarcode() detects variant barcodes
- [ ] addToCart() accepts variant_id
- [ ] store() saves variant_id in sale_items
- [ ] deductStock() uses variant_id
- [ ] Multi-tenant safety verified
- [ ] PHP syntax valid
- [ ] Output report created at `tasks/TASK-007-OUTPUT.md`

---

## 🔗 Related Tasks

- **Depends On:** TASK-002 (ProductVariant model), TASK-004 (ProductVariantController)
- **Blocks:** Frontend POS updates (Phase 3)
- **Related:** TASK-008 (Stock management with variants)

---

## ⚠️ Multi-Tenant Safety Reminders

1. ✅ All queries filter by `account_id`
2. ✅ Verify product belongs to account before operations
3. ✅ Verify variant belongs to account AND product
4. ✅ Stock operations include account_id and variant_id

---

**START THIS TASK AFTER TASK-002 AND TASK-004 ARE COMPLETE**
