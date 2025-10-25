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
            'packaging_quantity' => 'decimal:3',
            'unit_price' => 'decimal:4',
            'weight' => 'decimal:3',
            'attributes' => 'json',
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

        // Add any product-specific boot logic here
    }
}
