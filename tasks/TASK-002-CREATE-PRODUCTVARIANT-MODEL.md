# TASK-002: Create ProductVariant Model

**Assigned To:** Agent (Developer)
**Phase:** 1.2 - Database & Models
**Priority:** HIGH
**Estimated Time:** 3-4 hours
**Due Date:** Day 2

---

## 📋 Task Description

Create the `ProductVariant` model with full multi-tenant support, relationships, computed attributes, scopes, and stock management methods. This model is **CRITICAL** for the entire XPOS system.

---

## 🎯 Objectives

1. Create `app/Models/ProductVariant.php` with BelongsToAccount trait
2. Define all relationships (product, account, stock, saleItems)
3. Add computed attributes (final_price, display_name)
4. Add scopes (forAccount, active, byBarcode, bySize, byColor)
5. Add stock calculation methods
6. Ensure multi-tenant safety throughout

---

## 📥 Input Files

**Reference Files:**
- `tasks/NEXT-STEPS-IMPLEMENTATION.md` (lines 302-376)
- `app/Traits/BelongsToAccount.php` (read to understand the trait)
- `app/Models/Product.php` (existing model for reference)
- `tasks/TASK-001-OUTPUT.md` (migration review - verify table structure)

**Dependencies:**
- ⚠️ **BLOCKED BY:** TASK-001 (migration must be verified first)
- Migration must be confirmed correct before implementing this model

---

## 🔧 Implementation Requirements

### File to Create:
`app/Models/ProductVariant.php`

---

## 📐 Model Specification

### 1. Namespace & Imports

```php
<?php

namespace App\Models;

use App\Traits\BelongsToAccount;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;
```

---

### 2. Class Declaration & Traits

```php
class ProductVariant extends Model
{
    use BelongsToAccount, SoftDeletes;

    protected $table = 'product_variants';
}
```

---

### 3. Fillable Fields

**All fields that can be mass-assigned:**

```php
protected $fillable = [
    'account_id',      // ⚠️ CRITICAL - Always required!
    'product_id',
    'sku',
    'barcode',
    'size',
    'color',
    'color_code',      // Hex color code (#FF0000)
    'pattern',         // e.g., "striped", "solid", "dotted"
    'fit',             // e.g., "slim", "regular", "loose"
    'material',        // e.g., "cotton", "polyester"
    'price_adjustment', // Additional price (+/- from base product price)
    'is_active',
];
```

---

### 4. Casts

```php
protected $casts = [
    'price_adjustment' => 'decimal:2',
    'is_active' => 'boolean',
    'deleted_at' => 'datetime',
];
```

---

### 5. Appended Attributes

```php
protected $appends = [
    'final_price',
    'display_name',
];
```

---

### 6. Relationships

#### 6.1 BelongsTo Relationships

```php
/**
 * Get the account that owns this variant
 */
public function account(): BelongsTo
{
    return $this->belongsTo(Account::class);
}

/**
 * Get the product this variant belongs to
 * ⚠️ CRITICAL: Always verify account_id matches!
 */
public function product(): BelongsTo
{
    return $this->belongsTo(Product::class)
        ->where('account_id', $this->account_id);
}
```

#### 6.2 HasMany Relationships

```php
/**
 * Get stock records for this variant
 * ⚠️ CRITICAL: Must filter by account_id
 */
public function stock(): HasMany
{
    return $this->hasMany(ProductStock::class, 'variant_id')
        ->where('account_id', $this->account_id);
}

/**
 * Get sale items for this variant
 */
public function saleItems(): HasMany
{
    return $this->hasMany(SaleItem::class, 'variant_id')
        ->where('account_id', $this->account_id);
}

/**
 * Get goods receipt items for this variant
 */
public function goodsReceiptItems(): HasMany
{
    return $this->hasMany(GoodsReceiptItem::class, 'variant_id')
        ->where('account_id', $this->account_id);
}
```

---

### 7. Computed Attributes (Accessors)

```php
/**
 * Get the final price (base product price + adjustment)
 */
public function getFinalPriceAttribute(): float
{
    $basePrice = $this->product ? $this->product->sale_price : 0;
    return round($basePrice + $this->price_adjustment, 2);
}

/**
 * Get display name: "Product Name - Size Color"
 * Example: "Cotton T-Shirt - M Red"
 */
public function getDisplayNameAttribute(): string
{
    $parts = [];

    if ($this->product) {
        $parts[] = $this->product->name;
    }

    if ($this->size) {
        $parts[] = $this->size;
    }

    if ($this->color) {
        $parts[] = $this->color;
    }

    return implode(' - ', $parts);
}

/**
 * Get short display: "Size/Color"
 * Example: "M/Red"
 */
public function getShortDisplayAttribute(): string
{
    $parts = [];

    if ($this->size) {
        $parts[] = $this->size;
    }

    if ($this->color) {
        $parts[] = $this->color;
    }

    return implode('/', $parts);
}
```

---

### 8. Query Scopes

```php
/**
 * Scope to filter by account ID
 * ⚠️ CRITICAL: Always use this scope!
 */
public function scopeForAccount(Builder $query, int $accountId): Builder
{
    return $query->where('account_id', $accountId);
}

/**
 * Scope to get only active variants
 */
public function scopeActive(Builder $query): Builder
{
    return $query->where('is_active', true);
}

/**
 * Scope to find by barcode
 * ⚠️ CRITICAL: Must be scoped by account!
 */
public function scopeByBarcode(Builder $query, string $barcode, int $accountId): Builder
{
    return $query->where('account_id', $accountId)
        ->where('barcode', $barcode);
}

/**
 * Scope to find by SKU
 */
public function scopeBySku(Builder $query, string $sku, int $accountId): Builder
{
    return $query->where('account_id', $accountId)
        ->where('sku', $sku);
}

/**
 * Scope to filter by size
 */
public function scopeBySize(Builder $query, string $size): Builder
{
    return $query->where('size', $size);
}

/**
 * Scope to filter by color
 */
public function scopeByColor(Builder $query, string $color): Builder
{
    return $query->where('color', $color);
}

/**
 * Scope to filter by product
 */
public function scopeForProduct(Builder $query, int $productId): Builder
{
    return $query->where('product_id', $productId);
}
```

---

### 9. Stock Management Methods

```php
/**
 * Get total stock across all warehouses
 * ⚠️ CRITICAL: Must filter by account_id
 */
public function getTotalStock(): float
{
    return $this->stock()
        ->where('account_id', $this->account_id)
        ->sum('quantity');
}

/**
 * Get stock in a specific warehouse
 */
public function getStockInWarehouse(int $warehouseId): float
{
    return $this->stock()
        ->where('account_id', $this->account_id)
        ->where('warehouse_id', $warehouseId)
        ->sum('quantity');
}

/**
 * Check if variant has sufficient stock in warehouse
 */
public function hasStock(int $warehouseId, float $quantity = 1): bool
{
    return $this->getStockInWarehouse($warehouseId) >= $quantity;
}

/**
 * Check if variant is in stock (any warehouse)
 */
public function isInStock(): bool
{
    return $this->getTotalStock() > 0;
}
```

---

### 10. Model Events (Boot Method)

```php
/**
 * Boot the model
 */
protected static function boot()
{
    parent::boot();

    // Auto-set account_id if not set
    static::creating(function ($variant) {
        if (!$variant->account_id && auth()->check()) {
            $variant->account_id = auth()->user()->account_id;
        }
    });

    // Validate account_id matches product's account_id
    static::creating(function ($variant) {
        if ($variant->product_id && $variant->product) {
            if ($variant->account_id !== $variant->product->account_id) {
                throw new \Exception('Variant account_id must match product account_id');
            }
        }
    });
}
```

---

## 📤 Expected Output

### 1. Create Model File

**File:** `app/Models/ProductVariant.php`

Complete implementation following the specification above.

---

### 2. Create Test File (Optional but Recommended)

**File:** `tests/Unit/Models/ProductVariantTest.php`

```php
<?php

namespace Tests\Unit\Models;

use Tests\TestCase;
use App\Models\ProductVariant;
use App\Models\Product;
use App\Models\Account;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ProductVariantTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_belongs_to_an_account()
    {
        $account = Account::factory()->create();
        $product = Product::factory()->create(['account_id' => $account->id]);
        $variant = ProductVariant::factory()->create([
            'account_id' => $account->id,
            'product_id' => $product->id,
        ]);

        $this->assertInstanceOf(Account::class, $variant->account);
        $this->assertEquals($account->id, $variant->account->id);
    }

    /** @test */
    public function it_belongs_to_a_product()
    {
        $account = Account::factory()->create();
        $product = Product::factory()->create(['account_id' => $account->id]);
        $variant = ProductVariant::factory()->create([
            'account_id' => $account->id,
            'product_id' => $product->id,
        ]);

        $this->assertInstanceOf(Product::class, $variant->product);
        $this->assertEquals($product->id, $variant->product->id);
    }

    /** @test */
    public function it_calculates_final_price_correctly()
    {
        $account = Account::factory()->create();
        $product = Product::factory()->create([
            'account_id' => $account->id,
            'sale_price' => 100.00,
        ]);
        $variant = ProductVariant::factory()->create([
            'account_id' => $account->id,
            'product_id' => $product->id,
            'price_adjustment' => 15.50,
        ]);

        $this->assertEquals(115.50, $variant->final_price);
    }

    /** @test */
    public function it_generates_correct_display_name()
    {
        $account = Account::factory()->create();
        $product = Product::factory()->create([
            'account_id' => $account->id,
            'name' => 'Cotton T-Shirt',
        ]);
        $variant = ProductVariant::factory()->create([
            'account_id' => $account->id,
            'product_id' => $product->id,
            'size' => 'M',
            'color' => 'Red',
        ]);

        $this->assertEquals('Cotton T-Shirt - M - Red', $variant->display_name);
    }

    /** @test */
    public function it_filters_by_account_correctly()
    {
        $account1 = Account::factory()->create();
        $account2 = Account::factory()->create();

        $product1 = Product::factory()->create(['account_id' => $account1->id]);
        $product2 = Product::factory()->create(['account_id' => $account2->id]);

        $variant1 = ProductVariant::factory()->create([
            'account_id' => $account1->id,
            'product_id' => $product1->id,
        ]);
        $variant2 = ProductVariant::factory()->create([
            'account_id' => $account2->id,
            'product_id' => $product2->id,
        ]);

        $account1Variants = ProductVariant::forAccount($account1->id)->get();

        $this->assertCount(1, $account1Variants);
        $this->assertEquals($variant1->id, $account1Variants->first()->id);
    }
}
```

---

### 3. Create Output Report

**File:** `tasks/TASK-002-OUTPUT.md`

```markdown
# TASK-002 Output: ProductVariant Model Implementation

**Implemented By:** [Agent Name]
**Date:** [Date]
**Status:** ✅ Complete / ⚠️ Issues Found

---

## ✅ Completed Items

- [x] Created app/Models/ProductVariant.php
- [x] Added BelongsToAccount trait
- [x] Defined all fillable fields
- [x] Implemented all relationships
- [x] Added computed attributes
- [x] Implemented query scopes
- [x] Added stock management methods
- [x] Implemented boot method with validation
- [x] Created unit tests (optional)

---

## 🧪 Testing Results

### Manual Testing Commands Run:

```bash
# Test 1: Create variant
php artisan tinker
> $account = Account::first();
> $product = Product::where('account_id', $account->id)->first();
> $variant = ProductVariant::create([
    'account_id' => $account->id,
    'product_id' => $product->id,
    'size' => 'M',
    'color' => 'Red',
    'barcode' => '12345',
    'price_adjustment' => 10.00
]);
> $variant->display_name; // Should show: "Product Name - M - Red"
> $variant->final_price; // Should show base price + 10.00
```

**Result:** [✅ Pass / ❌ Fail - describe result]

---

## ⚠️ Issues Encountered

[List any issues, errors, or concerns]

1. **Issue 1:** [Description]
   - **Solution:** [How it was resolved]

---

## 📝 Notes

[Any additional notes, observations, or recommendations]

---

## ✅ Definition of Done

- [x] Model file created and follows specification
- [x] All relationships work correctly
- [x] Multi-tenant safety verified (account_id filtering)
- [x] Computed attributes return expected values
- [x] Scopes filter correctly
- [x] Stock methods calculate correctly
- [x] Output report created
```

---

## ✅ Definition of Done

- [ ] `app/Models/ProductVariant.php` created
- [ ] All sections from specification implemented
- [ ] BelongsToAccount trait used correctly
- [ ] All relationships defined with account_id filtering
- [ ] All computed attributes implemented
- [ ] All scopes implemented
- [ ] All stock methods implemented
- [ ] Boot method with validation implemented
- [ ] Code follows Laravel conventions
- [ ] Multi-tenant safety verified (no queries without account_id)
- [ ] Output report created at `tasks/TASK-002-OUTPUT.md`

---

## 🔗 Related Tasks

- **Depends On:** TASK-001 (migration must be verified)
- **Blocks:** TASK-002-B (ProductVariant Controller)
- **Related:** TASK-003 (needs to update Product model to add variants relationship)

---

## ⚠️ Multi-Tenant Safety Reminders

Before submitting, verify:

1. ✅ All relationships include `->where('account_id', $this->account_id)`
2. ✅ All scopes that search include `account_id` parameter
3. ✅ Boot method validates account_id matches product's account_id
4. ✅ Stock methods filter by account_id
5. ✅ No Model::find() or Model::all() without account filtering

---

## 📞 Questions or Issues?

If you encounter problems:
1. Document in output report
2. Continue with what's possible
3. Flag blocking issues clearly
