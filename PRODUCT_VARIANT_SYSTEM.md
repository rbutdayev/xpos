# Product Variant System - Implementation Guide

## Overview

Your XPOS system now supports **two methods** for managing product variants:

### Method 1: Parent-Child Products (NEW ✅)
- **1 Parent Product** = "Jacket" (displayed in shop)
- **Multiple Child Products** = Separate product records for each variant
  - Each has own: SKU, Barcode, Price, Stock
  - Linked via `parent_product_id` field
  - Attributes stored in JSON: `{size: "M", color: "Red", color_code: "#FF0000"}`

### Method 2: ProductVariants Table (Existing)
- **1 Product** = Main product
- **Multiple ProductVariants** = Variants in separate table
  - Each has: size, color, color_code, price_adjustment
  - Linked via `product_id` field

---

## How It Works

### Database Structure

```sql
products table:
  - id
  - parent_product_id (NEW!)  -- NULL = parent, NOT NULL = child
  - name
  - sku, barcode
  - sale_price
  - attributes (JSON)
  - ...

Example:
| id | parent_product_id | name             | sku           | barcode     | attributes                        |
|----|-------------------|------------------|---------------|-------------|-----------------------------------|
| 1  | NULL              | Jacket           | JACKET-MAIN   | NULL        | NULL                              |
| 2  | 1                 | Jacket S White   | JACKET-S-WHT  | 1234567890  | {"size":"S","color":"White"}      |
| 3  | 1                 | Jacket S Red     | JACKET-S-RED  | 1234567891  | {"size":"S","color":"Red"}        |
| 4  | 1                 | Jacket M White   | JACKET-M-WHT  | 1234567892  | {"size":"M","color":"White"}      |
```

### Backend Logic

#### Product Model
- `parentProduct()` - Get parent if this is a child
- `childProducts()` - Get all children if this is a parent
- `isParentProduct()` - Check if has children
- `isChildProduct()` - Check if has parent
- `scopeParentProducts()` - Query only parent products

#### PublicShopController
1. **Homepage**: Shows only parent products (`->parentProducts()`)
2. **Extracts variants**: From child products OR ProductVariants table
3. **Calculates price range**: Min/Max from all variants
4. **Product Detail**: Shows all size/color options from children

### Frontend (Shop UI)

#### Home Page ([Home.tsx](xpos/resources/js/Pages/Shop/Home.tsx))
- Shows 1 card per parent product
- Displays size badges (first 4)
- Displays color swatches (first 5)
- Shows price range if variants have different prices

#### Product Page ([Product.tsx](xpos/resources/js/Pages/Shop/Product.tsx))
- Customer selects size and color
- Updates price based on selection
- Shows stock availability
- On order: Uses child product ID directly

---

## How to Use

### Creating Product Variants

You have **2 options**:

#### Option A: Create Separate Products (Manual)

1. Create parent product:
```php
$parent = Product::create([
    'account_id' => $accountId,
    'name' => 'Jacket',
    'parent_product_id' => null,  // This is the parent
    'sku' => 'JACKET-MAIN',
    'type' => 'product',
    // ... other fields
]);
```

2. Create child products:
```php
$sizes = ['S', 'M', 'L', 'XL'];
$colors = [
    ['name' => 'White', 'code' => '#FFFFFF'],
    ['name' => 'Red', 'code' => '#FF0000'],
    ['name' => 'Black', 'code' => '#000000']
];

foreach ($sizes as $size) {
    foreach ($colors as $color) {
        Product::create([
            'account_id' => $accountId,
            'parent_product_id' => $parent->id,  // Link to parent
            'name' => "Jacket {$size} {$color['name']}",
            'sku' => "JACKET-{$size}-" . strtoupper(substr($color['name'], 0, 3)),
            'barcode' => generateBarcode(),
            'sale_price' => 49.99,
            'type' => 'product',
            'attributes' => [
                'size' => $size,
                'color' => $color['name'],
                'color_code' => $color['code']
            ]
        ]);
    }
}
```

#### Option B: Use ProductVariants Table

```php
$product = Product::create([
    'account_id' => $accountId,
    'name' => 'Jacket',
    'sale_price' => 49.99,
    // ... other fields
]);

ProductVariant::create([
    'account_id' => $accountId,
    'product_id' => $product->id,
    'sku' => 'JACKET-S-WHT',
    'barcode' => generateBarcode(),
    'size' => 'S',
    'color' => 'White',
    'color_code' => '#FFFFFF',
    'price_adjustment' => 0,
]);
```

---

## Shop Display Behavior

### Homepage
```
┌─────────────────────────────────┐
│   [Image]                       │
│                                 │
│   Jacket                        │
│   Category: Outerwear           │
│                                 │
│   Sizes: S M L XL               │
│   Colors: ● ● ● +2              │
│                                 │
│   39.99 - 59.99 ₼               │
│   Variant qiymətləri            │
│                                 │
│   [Seç →]                       │
└─────────────────────────────────┘
```

### Product Detail Page
```
Customer clicks → Sees all options:

Ölçü seçin:
[S] [M] [L] [XL]

Rəng seçin:
[● White] [● Red] [● Black]

✓ Selected: M • Red
✓ In stock (15 units)

Price: 49.99 ₼

[Order Now]
```

---

## POS Integration

### Barcode Scanning
Each variant has its own barcode:
- Scan barcode → Finds child product by barcode
- Adds to sale using `product_id` (child product ID)
- Stock is tracked per child product

### Sales Table
```php
SaleItem::create([
    'sale_id' => $saleId,
    'product_id' => $childProductId,  // ID of "Jacket M Red"
    'variant_id' => null,              // Not used for child products
    'quantity' => 1,
    'unit_price' => 49.99,
]);
```

---

## Migration Applied

✅ **2025_10_25_023028_add_parent_product_id_to_products_table.php**
- Added `parent_product_id` column to products table
- Added foreign key constraint
- Added index for performance

---

## Next Steps

1. **Decide on method**: Will you use child products or ProductVariants?
2. **Import existing data**: Migrate current products to new structure
3. **Update product creation UI**: Add interface to create variants easily
4. **Test workflow**: Create a test product with variants and test ordering

---

## Questions?

- **Q: Can I mix both methods?**
  - A: Yes! The system checks for both and uses whichever exists.

- **Q: How do I bulk create variants?**
  - A: Create a seeder or admin UI to generate combinations.

- **Q: What about variant images?**
  - A: Each child product can have its own photos via ProductPhotos table.

- **Q: Can variants have different categories?**
  - A: No, use the parent product's category.
