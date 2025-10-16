# TASK-009: Update ReportController with Product Variant Support

**Created:** 2025-10-16
**Priority:** 🟡 MEDIUM
**Estimated Time:** 4-5 hours
**Type:** Backend - Controller Update
**Status:** ⏳ IN PROGRESS

---

## 📋 Overview

Update the ReportController to include product variant information in all reports. This ensures that sales reports, inventory reports, and other analytics show variant details (size, color, etc.) for proper inventory tracking and business intelligence.

---

## 🎯 Objectives

1. **Update Inventory Report** - Show stock levels per product variant
2. **Update Sales Report** - Show which variants were sold
3. **Add Variant Filters** - Allow filtering reports by variant attributes
4. **Update Export Functions** - Include variant columns in CSV/Excel/PDF exports
5. **Update Low Stock Alerts** - Track stock levels per variant

---

## 📊 Reports to Update

### 1. Inventory Report (`generateInventoryReport`)
**Current State:** Shows stock aggregated per product
**Required Changes:**
- Show each variant as a separate line item
- Include columns: Size, Color, Variant SKU/Barcode
- Calculate stock value per variant
- Low stock alerts should check per variant

### 2. Sales Report (`generateSalesReport`)
**Current State:** Shows products sold without variant details
**Required Changes:**
- Include variant information for each sale item
- Show size and color in product details
- Group sales by product + variant combination

### 3. Low Stock Report (Part of Inventory)
**Current State:** Checks min_stock_level per product
**Required Changes:**
- Check stock levels per variant
- Alert when any variant is below minimum

### 4. Download/Export Functions
**Current State:** CSV export without variant columns
**Required Changes:**
- Add variant columns to all export formats
- Update CSV headers
- Update download() method formatting

---

## 🔧 Implementation Details

### A. Update `generateInventoryReport()` Method

#### Current Implementation:
```php
$products = Product::where('account_id', $account->id)
    ->with('category')
    ->withSum('productStocks', 'quantity')
    ->get();

$inventoryData = $products->map(function ($product) {
    $totalStock = $product->product_stocks_sum_quantity ?? 0;
    return [
        'name' => $product->name,
        'sku' => $product->sku,
        'category' => $product->category->name ?? 'Kateqoriyasız',
        'current_stock' => $totalStock,
        // ...
    ];
});
```

#### Required Changes:
```php
// Get products with variants and stock
$products = Product::where('account_id', $account->id)
    ->with(['category', 'variants.productStocks'])
    ->get();

$inventoryData = [];

foreach ($products as $product) {
    if ($product->variants->isNotEmpty()) {
        // Product has variants - show each variant separately
        foreach ($product->variants as $variant) {
            $variantStock = $variant->productStocks->sum('quantity');

            $inventoryData[] = [
                'name' => $product->name,
                'sku' => $product->sku,
                'variant_id' => $variant->id,
                'variant_display' => $variant->short_display, // e.g., "M / Red"
                'size' => $variant->size,
                'color' => $variant->color,
                'barcode' => $variant->barcode,
                'category' => $product->category->name ?? 'Kateqoriyasız',
                'current_stock' => $variantStock,
                'min_level' => $product->min_stock_level,
                'purchase_price' => $variant->final_price ?? $product->purchase_price,
                'sale_price' => $variant->final_price ?? $product->sale_price,
                'stock_value' => $variantStock * ($variant->final_price ?? $product->purchase_price),
                'status' => $this->getStockStatus($variantStock, $product->min_stock_level),
                'has_variant' => true,
            ];
        }
    } else {
        // Product has no variants - show as before
        $totalStock = $product->productStocks->sum('quantity');

        $inventoryData[] = [
            'name' => $product->name,
            'sku' => $product->sku,
            'variant_id' => null,
            'variant_display' => null,
            'size' => null,
            'color' => null,
            'barcode' => null,
            'category' => $product->category->name ?? 'Kateqoriyasız',
            'current_stock' => $totalStock,
            'min_level' => $product->min_stock_level,
            'purchase_price' => $product->purchase_price,
            'sale_price' => $product->sale_price,
            'stock_value' => $totalStock * $product->purchase_price,
            'status' => $this->getStockStatus($totalStock, $product->min_stock_level),
            'has_variant' => false,
        ];
    }
}

// Update summary calculations to account for variants
$summary = [
    'total_products' => $products->count(),
    'total_variants' => collect($inventoryData)->where('has_variant', true)->count(),
    'total_stock_value' => collect($inventoryData)->sum('stock_value'),
    'low_stock_items' => collect($inventoryData)->filter(function ($item) {
        return $item['status'] === 'low_stock';
    })->count(),
    'out_of_stock_items' => collect($inventoryData)->filter(function ($item) {
        return $item['status'] === 'out_of_stock';
    })->count(),
];
```

---

### B. Update `generateSalesReport()` Method

#### Current Implementation:
```php
$salesData = $sales->map(function ($sale) {
    return [
        // ... sale fields
        'products' => $sale->items->map(function ($item) {
            return [
                'name' => $item->product->name ?? 'Naməlum Məhsul',
                'sku' => $item->product->sku ?? '',
                'quantity' => $item->quantity,
                'unit_price' => $item->unit_price,
                'total' => $item->total
            ];
        })->toArray()
    ];
});
```

#### Required Changes:
```php
$sales = Sale::where('account_id', $account->id)
    ->whereBetween('sale_date', [$dateFrom, $dateTo])
    ->with(['customer', 'items.product', 'items.variant']) // Add variant
    ->get();

$salesData = $sales->map(function ($sale) {
    return [
        'sale_number' => $sale->sale_number,
        'customer_name' => $sale->customer->name ?? 'Naməlum',
        'sale_date' => $sale->sale_date,
        'total' => $sale->total,
        'items_count' => $sale->items->count(),
        'status' => $sale->status ?? 'completed',
        'products' => $sale->items->map(function ($item) {
            $productName = $item->product->name ?? 'Naməlum Məhsul';

            // Add variant info if exists
            if ($item->variant) {
                $productName .= " ({$item->variant->short_display})";
            }

            return [
                'name' => $productName,
                'sku' => $item->product->sku ?? '',
                'variant_id' => $item->variant_id,
                'variant_display' => $item->variant?->short_display,
                'size' => $item->variant?->size,
                'color' => $item->variant?->color,
                'quantity' => $item->quantity,
                'unit_price' => $item->unit_price,
                'total' => $item->total,
            ];
        })->toArray()
    ];
});
```

---

### C. Update `download()` Method - CSV Export

#### Current CSV Headers (Inventory):
```php
fputcsv($file, ['Məhsul Adı', 'SKU', 'Kateqoriya', 'Mövcud Stok', 'Minimum Səviyyə', 'Alış Qiyməti', 'Satış Qiyməti', 'Stok Dəyəri', 'Status']);
```

#### Required Changes (Inventory):
```php
// Add variant columns
fputcsv($file, [
    'Məhsul Adı',
    'SKU',
    'Variant', // NEW
    'Ölçü', // NEW (Size)
    'Rəng', // NEW (Color)
    'Barkod', // NEW
    'Kateqoriya',
    'Mövcud Stok',
    'Minimum Səviyyə',
    'Alış Qiyməti',
    'Satış Qiyməti',
    'Stok Dəyəri',
    'Status'
]);

foreach ($data['inventory'] as $item) {
    fputcsv($file, [
        $item['name'],
        $item['sku'],
        $item['variant_display'] ?? '-', // NEW
        $item['size'] ?? '-', // NEW
        $item['color'] ?? '-', // NEW
        $item['barcode'] ?? '-', // NEW
        $item['category'],
        $item['current_stock'],
        $item['min_level'],
        $item['purchase_price'],
        $item['sale_price'],
        $item['stock_value'],
        $item['status']
    ]);
}
```

#### Current CSV Headers (Sales):
```php
fputcsv($file, ['Satış Nömrəsi', 'Müştəri', 'Satış Tarixi', 'Məhsul Adı', 'SKU', 'Miqdar', 'Vahid Qiyməti', 'Məhsul Cəmi', 'Satış Cəmi', 'Status']);
```

#### Required Changes (Sales):
```php
fputcsv($file, [
    'Satış Nömrəsi',
    'Müştəri',
    'Satış Tarixi',
    'Məhsul Adı',
    'SKU',
    'Variant', // NEW
    'Ölçü', // NEW
    'Rəng', // NEW
    'Miqdar',
    'Vahid Qiyməti',
    'Məhsul Cəmi',
    'Satış Cəmi',
    'Status'
]);

foreach ($data['sales'] as $item) {
    if (!empty($item['products'])) {
        foreach ($item['products'] as $product) {
            fputcsv($file, [
                $item['sale_number'],
                $item['customer_name'],
                $item['sale_date'],
                $product['name'],
                $product['sku'],
                $product['variant_display'] ?? '-', // NEW
                $product['size'] ?? '-', // NEW
                $product['color'] ?? '-', // NEW
                $product['quantity'],
                $product['unit_price'],
                $product['total'],
                $item['total'],
                $item['status']
            ]);
        }
    }
}
```

---

### D. Add ProductVariant Import

```php
use App\Models\ProductVariant;
```

---

## 📋 Implementation Checklist

### Model/Controller Updates:
- [ ] Add `use App\Models\ProductVariant;` import to ReportController
- [ ] Update `generateInventoryReport()` to show variants
- [ ] Update `generateSalesReport()` to include variant details
- [ ] Update inventory summary to count variants separately
- [ ] Update sales items to show variant information
- [ ] Update eager loading to include `'variant'` relationship

### Export Functions:
- [ ] Update CSV headers for inventory report (add 4 columns)
- [ ] Update CSV headers for sales report (add 3 columns)
- [ ] Update CSV data output for inventory (include variant fields)
- [ ] Update CSV data output for sales (include variant fields)
- [ ] Handle null/empty variant data gracefully (show '-' or 'N/A')

### Stock Status:
- [ ] Update low stock calculations to check per variant
- [ ] Update out of stock calculations to check per variant
- [ ] Add variant count to inventory summary

### Testing:
- [ ] Test inventory report with products that have variants
- [ ] Test inventory report with products that have NO variants
- [ ] Test sales report with variant sales
- [ ] Test CSV export includes variant columns
- [ ] Verify summary calculations are correct
- [ ] Test multi-tenant isolation (variants scoped to account)

---

## 🧪 Testing Scenarios

### Test Case 1: Inventory Report with Variants
**Setup:**
- Product A: Has 3 variants (S, M, L)
- Product B: No variants

**Expected Output:**
```
Inventory Report:
- Product A - Variant: S / Red - Stock: 10
- Product A - Variant: M / Red - Stock: 5
- Product A - Variant: L / Red - Stock: 2
- Product B - Variant: - - Stock: 15

Summary:
- Total Products: 2
- Total Variants: 3
- Low Stock: 1 (Product A - L / Red)
```

### Test Case 2: Sales Report with Variants
**Setup:**
- Sale #001: Sold Product A (M / Red) x2, Product B x1

**Expected Output:**
```
Sales Report:
Sale #001:
- Product A (M / Red) - Qty: 2 - Price: $25.00
- Product B - Qty: 1 - Price: $30.00
Total: $80.00
```

### Test Case 3: CSV Export
**Expected CSV:**
```csv
Məhsul Adı,SKU,Variant,Ölçü,Rəng,Barkod,Kateqoriya,Mövcud Stok,...
"T-Shirt","TS001","M / Red","M","Red","1234567890","Geyim",10,...
"T-Shirt","TS001","L / Blue","L","Blue","1234567891","Geyim",5,...
"Jeans","JN001","-","-","-","-","Geyim",15,...
```

---

## ⚠️ Important Notes

### Multi-Tenant Safety:
- All variant queries MUST filter by `account_id`
- Ensure eager loading includes account scoping
- Variants should only show for products in current account

### Backward Compatibility:
- Products without variants should still work
- Show "-" or null for variant columns when no variant exists
- Don't break existing reports for non-variant products

### Performance:
- Use eager loading to avoid N+1 queries
- Load `'variants.productStocks'` in single query
- Calculate summaries efficiently with collections

### Data Integrity:
- Handle deleted variants gracefully
- Show "Deleted Variant" if variant_id exists but variant is soft-deleted
- Don't crash if variant relationship is null

---

## 📁 Files to Modify

| File | Changes |
|------|---------|
| `app/Http/Controllers/ReportController.php` | All method updates |

**No new files to create** - This task only modifies existing controller.

---

## 🔗 Related Tasks

- **TASK-007:** POSController variant support (✅ Complete)
- **TASK-008-A/B/C/D:** Stock management controllers (✅ Complete)
- **TASK-010:** Database Seeder (Pending - needed for testing)
- **TASK-011:** Product Form Frontend (Pending)

---

## 📊 Success Criteria

After completing TASK-009:

### Functional Requirements:
- ✅ Inventory report shows each variant as separate line
- ✅ Sales report includes variant details (size/color)
- ✅ Low stock alerts work per variant
- ✅ CSV exports include variant columns
- ✅ Products without variants still work correctly

### Technical Requirements:
- ✅ No N+1 query issues
- ✅ Multi-tenant isolation maintained
- ✅ Backward compatible with non-variant products
- ✅ All eager loading includes 'variant'

### Testing:
- ✅ Can generate all 5 report types
- ✅ CSV download includes variant data
- ✅ Summary statistics are accurate
- ✅ Frontend displays variant info correctly

---

## 📝 Implementation Notes

### Pattern to Follow:
Use the same variant handling pattern established in TASK-007 and TASK-008:

```php
// 1. Eager load variants
->with(['product', 'variant'])

// 2. Display variant info
if ($item->variant) {
    $display = "{$product->name} ({$item->variant->short_display})";
} else {
    $display = $product->name;
}

// 3. Export variant columns
'variant_display' => $item->variant?->short_display ?? '-',
'size' => $item->variant?->size ?? '-',
'color' => $item->variant?->color ?? '-',
```

### Common Pitfalls to Avoid:
1. ❌ Don't forget to eager load 'variant' relationship
2. ❌ Don't assume variant always exists (use null coalescing)
3. ❌ Don't break products without variants
4. ❌ Don't calculate stock incorrectly (must sum per variant)
5. ❌ Don't forget to update CSV export headers

---

## ⏱️ Estimated Time Breakdown

| Task | Time |
|------|------|
| Update `generateInventoryReport()` | 1.5 hours |
| Update `generateSalesReport()` | 1 hour |
| Update `download()` CSV export | 1 hour |
| Testing all reports | 1 hour |
| Documentation | 0.5 hours |
| **Total** | **4-5 hours** |

---

## 🚀 Next Steps After Completion

1. Create TASK-009-OUTPUT.md with results
2. Test with real data (use TASK-010 seeder when ready)
3. Update frontend to display new variant columns
4. Consider adding variant filters in future enhancement

---

**Created:** 2025-10-16
**Status:** ⏳ Ready to Start
**Assignee:** Available for immediate assignment
