<?php

namespace App\Models;

use App\Traits\BelongsToAccount;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use HasFactory, BelongsToAccount, SoftDeletes;

    protected $fillable = [
        'account_id',
        'parent_product_id',  // Link to parent product for variants
        'name',
        'sku',
        'barcode',
        'gift_card_denomination',  // If set, this product is a gift card with this denomination
        'barcode_type',
        'has_custom_barcode',
        'category_id',
        'service_type',  // Filter products by service sector: tailor, phone_repair, electronics, general
        'type',
        'description',
        'purchase_price',
        'sale_price',
        'unit',
        'packaging_size',
        'base_unit',
        'packaging_quantity',
        'unit_price',
        'allow_negative_stock',
        'weight',
        'dimensions',
        'brand',
        'model',
        'attributes',
        'image_url',
        'is_active',
        // Rental fields
        'rental_category',
        'rental_daily_rate',
        'rental_weekly_rate',
        'rental_monthly_rate',
        'rental_deposit',
        'is_rentable',
        'rental_min_days',
        'rental_max_days',
    ];

    protected $appends = [
        'total_stock'
    ];

    protected function casts(): array
    {
        return [
            'has_custom_barcode' => 'boolean',
            'allow_negative_stock' => 'boolean',
            'is_active' => 'boolean',
            'purchase_price' => 'decimal:2',
            'sale_price' => 'decimal:2',
            'gift_card_denomination' => 'decimal:2',
            'packaging_quantity' => 'decimal:3',
            'unit_price' => 'decimal:4',
            'weight' => 'decimal:3',
            'attributes' => 'json',
            // Rental field casts
            'is_rentable' => 'boolean',
            'rental_daily_rate' => 'decimal:2',
            'rental_weekly_rate' => 'decimal:2',
            'rental_monthly_rate' => 'decimal:2',
            'rental_deposit' => 'decimal:2',
            'rental_min_days' => 'integer',
            'rental_max_days' => 'integer',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function prices(): HasMany
    {
        return $this->hasMany(ProductPrice::class);
    }

    public function stock(): HasMany
    {
        return $this->hasMany(ProductStock::class);
    }

    public function stockHistory(): HasMany
    {
        return $this->hasMany(StockHistory::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(ProductDocument::class);
    }

    public function suppliers(): BelongsToMany
    {
        return $this->belongsToMany(Supplier::class, 'supplier_products')
            ->withPivot([
                'supplier_price',
                'supplier_sku',
                'lead_time_days',
                'minimum_order_quantity',
                'discount_percentage',
                'notes',
                'is_preferred',
                'is_active'
            ])
            ->withTimestamps();
    }

    public function supplierProducts(): HasMany
    {
        return $this->hasMany(SupplierProduct::class);
    }

    public function goodsReceipts(): HasMany
    {
        return $this->hasMany(GoodsReceipt::class);
    }

    public function productStocks(): HasMany
    {
        return $this->hasMany(ProductStock::class);
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class);
    }

    public function activeVariants(): HasMany
    {
        return $this->hasMany(ProductVariant::class)->where('is_active', true);
    }

    public function photos(): HasMany
    {
        return $this->hasMany(ProductPhoto::class);
    }

    public function primaryPhoto(): HasMany
    {
        return $this->hasMany(ProductPhoto::class)->where('is_primary', true);
    }

    public function orderedPhotos(): HasMany
    {
        return $this->hasMany(ProductPhoto::class)->orderBy('sort_order')->orderBy('created_at');
    }

    /**
     * Get the parent product (if this is a variant)
     */
    public function parentProduct(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'parent_product_id');
    }

    /**
     * Get child products (variants of this product)
     */
    public function childProducts(): HasMany
    {
        return $this->hasMany(Product::class, 'parent_product_id');
    }

    /**
     * Get active child products only
     */
    public function activeChildProducts(): HasMany
    {
        return $this->hasMany(Product::class, 'parent_product_id')->where('is_active', true);
    }


    public function scopeProducts(Builder $query): Builder
    {
        return $query->where('type', 'product');
    }

    public function scopeServices(Builder $query): Builder
    {
        return $query->where('type', 'service');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeByServiceType(Builder $query, ?string $serviceType): Builder
    {
        if (!$serviceType) {
            return $query;
        }
        // Products with matching service_type OR NULL (available for all services)
        return $query->where(function($q) use ($serviceType) {
            $q->where('service_type', $serviceType)
              ->orWhereNull('service_type');
        });
    }

    public function scopeWithBarcode(Builder $query): Builder
    {
        return $query->whereNotNull('barcode');
    }

    public function scopeWithoutBarcode(Builder $query): Builder
    {
        return $query->whereNull('barcode');
    }

    /**
     * Scope to get only parent products (no parent_product_id)
     */
    public function scopeParentProducts(Builder $query): Builder
    {
        return $query->whereNull('parent_product_id');
    }

    /**
     * Scope to get only child products (have parent_product_id)
     */
    public function scopeChildProducts(Builder $query): Builder
    {
        return $query->whereNotNull('parent_product_id');
    }

    public function isProduct(): bool
    {
        return $this->type === 'product';
    }

    public function isService(): bool
    {
        return $this->type === 'service';
    }

    public function hasBarcode(): bool
    {
        return !empty($this->barcode);
    }

    public function hasCustomBarcode(): bool
    {
        return $this->has_custom_barcode;
    }

    /**
     * Check if this product is a gift card
     */
    public function isGiftCard(): bool
    {
        return !is_null($this->gift_card_denomination);
    }

    /**
     * Scope to filter only gift card products
     */
    public function scopeGiftCards(Builder $query): Builder
    {
        return $query->whereNotNull('gift_card_denomination');
    }

    /**
     * Scope to filter products by gift card denomination
     */
    public function scopeWithGiftCardDenomination(Builder $query, float $denomination): Builder
    {
        return $query->where('gift_card_denomination', $denomination);
    }

    public function getTotalStockAttribute(): float
    {
        return $this->stock()->sum('quantity');
    }

    public function getStockInWarehouse(int $warehouseId): float
    {
        $stock = $this->stock()->where('warehouse_id', $warehouseId)->first();
        return $stock ? $stock->quantity : 0;
    }

    public function getProfitMarginAttribute(): float
    {
        if ($this->purchase_price == 0) {
            return 0;
        }

        return (($this->sale_price - $this->purchase_price) / $this->purchase_price) * 100;
    }

    /**
     * Get the effective sale price considering active ProductPrice discounts
     * Returns discounted price if there's an active discount for the branch, otherwise regular sale_price
     *
     * @param int|null $branchId Branch ID to check for branch-specific pricing
     * @return float The effective sale price
     */
    public function getEffectivePrice(?int $branchId = null): float
    {
        // Try to find an active, effective ProductPrice for this branch
        $productPrice = $this->prices()
            ->active()
            ->effective()
            ->forBranch($branchId)
            ->first();

        // If we found a product price with discount, return the discounted price
        if ($productPrice && $productPrice->discount_percentage > 0) {
            return $productPrice->discounted_price;
        }

        // Otherwise return regular sale price
        return (float) $this->sale_price;
    }

    /**
     * Get the discount information for this product
     * Returns null if no active discount, otherwise returns discount details
     *
     * @param int|null $branchId Branch ID to check for branch-specific pricing
     * @return array|null Discount information or null
     */
    public function getActiveDiscount(?int $branchId = null): ?array
    {
        $productPrice = $this->prices()
            ->active()
            ->effective()
            ->forBranch($branchId)
            ->first();

        if ($productPrice && $productPrice->discount_percentage > 0) {
            return [
                'discount_percentage' => $productPrice->discount_percentage,
                'original_price' => $this->sale_price,
                'discounted_price' => $productPrice->discounted_price,
                'effective_from' => $productPrice->effective_from,
                'effective_until' => $productPrice->effective_until,
            ];
        }

        return null;
    }

    /**
     * Check if product has variants
     */
    public function hasVariants(): bool
    {
        return $this->variants()->count() > 0;
    }

    /**
     * Check if product has active variants
     */
    public function hasActiveVariants(): bool
    {
        return $this->activeVariants()->count() > 0;
    }

    /**
     * Get all unique sizes from variants
     */
    public function getAvailableSizes(): array
    {
        return $this->activeVariants()
            ->whereNotNull('size')
            ->pluck('size')
            ->unique()
            ->values()
            ->toArray();
    }

    /**
     * Get all unique colors from variants
     */
    public function getAvailableColors(): array
    {
        return $this->activeVariants()
            ->whereNotNull('color')
            ->pluck('color', 'color_code')
            ->toArray();
    }

    /**
     * Check if this product is a parent (has child products)
     */
    public function isParentProduct(): bool
    {
        return $this->parent_product_id === null && $this->childProducts()->exists();
    }

    /**
     * Check if this product is a child variant
     */
    public function isChildProduct(): bool
    {
        return $this->parent_product_id !== null;
    }

    /**
     * Get the master product (parent if child, self if parent)
     */
    public function getMasterProduct(): Product
    {
        return $this->isChildProduct() ? $this->parentProduct : $this;
    }

    /**
     * Get all variant products including self if parent
     */
    public function getAllVariantProducts()
    {
        if ($this->isParentProduct()) {
            return $this->activeChildProducts;
        } elseif ($this->isChildProduct()) {
            return $this->parentProduct->activeChildProducts;
        }
        return collect([$this]);
    }

    protected static function boot()
    {
        parent::boot();

        // Clear barcode image cache when barcode changes
        static::updating(function ($product) {
            if ($product->isDirty('barcode') || $product->isDirty('barcode_type')) {
                // Get original barcode value
                $originalBarcode = $product->getOriginal('barcode');

                if ($originalBarcode) {
                    // Clear all cached images for this barcode
                    self::clearBarcodeImageCache($originalBarcode);
                }

                // Also clear cache for new barcode if it exists
                if ($product->barcode && $product->barcode !== $originalBarcode) {
                    self::clearBarcodeImageCache($product->barcode);
                }
            }
        });

        // Clear barcode image cache when product is deleted
        static::deleting(function ($product) {
            if ($product->barcode) {
                self::clearBarcodeImageCache($product->barcode);
            }
            
            // Mark rental inventory items when product is deleted
            RentalInventory::handleProductDeletion($product->id);
        });
    }

    /**
     * Clear all cached images for a barcode
     */
    private static function clearBarcodeImageCache(string $barcode): void
    {
        // Clear all possible combinations of format, width, height for this barcode
        $formats = ['png', 'svg'];
        $widths = range(1, 10);
        $heights = range(10, 200);

        // Clear common sizes (most likely to be cached)
        $commonSizes = [
            ['png', 2, 30],   // Default size
            ['png', 3, 60],   // Print size
            ['png', 3, 80],   // Large size
            ['svg', 2, 30],
            ['svg', 3, 60],
            ['svg', 3, 80],
        ];

        foreach ($commonSizes as [$format, $width, $height]) {
            $cacheKey = "barcode_image:{$barcode}:{$format}:{$width}:{$height}";
            \Cache::forget($cacheKey);
        }

        // Optional: Clear all possible combinations (use with caution on large systems)
        // This is commented out for performance reasons, but can be enabled if needed
        /*
        foreach ($formats as $format) {
            foreach ($widths as $width) {
                foreach ($heights as $height) {
                    $cacheKey = "barcode_image:{$barcode}:{$format}:{$width}:{$height}";
                    \Cache::forget($cacheKey);
                }
            }
        }
        */
    }
}
