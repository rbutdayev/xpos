<?php

namespace App\Models;

use App\Traits\BelongsToAccount;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class ProductVariant extends Model
{
    use HasFactory, BelongsToAccount, SoftDeletes;

    protected $table = 'product_variants';

    protected $fillable = [
        'account_id',      // CRITICAL - Always required for multi-tenant safety!
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

    protected $casts = [
        'price_adjustment' => 'decimal:2',
        'is_active' => 'boolean',
        'deleted_at' => 'datetime',
    ];

    protected $appends = [
        'final_price',
        'display_name',
    ];

    // ========================================
    // RELATIONSHIPS
    // ========================================

    /**
     * Get the account that owns this variant
     * Provided by BelongsToAccount trait
     */
    // public function account(): BelongsTo - Defined in BelongsToAccount trait

    /**
     * Get the product this variant belongs to
     * CRITICAL: Always verify account_id matches!
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class)
            ->where('account_id', $this->account_id);
    }

    /**
     * Get stock records for this variant
     * CRITICAL: Must filter by account_id
     */
    public function stock(): HasMany
    {
        return $this->hasMany(ProductStock::class, 'variant_id')
            ->where('account_id', $this->account_id);
    }

    /**
     * Alias for stock() - for consistency with Product model
     */
    public function productStocks(): HasMany
    {
        return $this->stock();
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
     * Get goods receipts for this variant
     */
    public function goodsReceipts(): HasMany
    {
        return $this->hasMany(GoodsReceipt::class, 'variant_id')
            ->where('account_id', $this->account_id);
    }

    // ========================================
    // COMPUTED ATTRIBUTES (ACCESSORS)
    // ========================================

    /**
     * Get the final price (base product price + adjustment)
     * Note: Uses regular sale_price for backwards compatibility
     * For discounted prices, use getFinalPriceForBranch($branchId)
     */
    public function getFinalPriceAttribute(): float
    {
        $basePrice = $this->product ? $this->product->sale_price : 0;
        return round($basePrice + $this->price_adjustment, 2);
    }

    /**
     * Get the final price considering active ProductPrice discounts
     * Uses the effective (discounted) price as the base
     *
     * @param int|null $branchId Branch ID to check for branch-specific pricing
     * @return float The final price with discount applied
     */
    public function getFinalPriceForBranch(?int $branchId = null): float
    {
        $basePrice = $this->product ? $this->product->getEffectivePrice($branchId) : 0;
        return round($basePrice + $this->price_adjustment, 2);
    }

    /**
     * Get the discount information for this variant's product
     *
     * @param int|null $branchId Branch ID to check for branch-specific pricing
     * @return array|null Discount information or null
     */
    public function getActiveDiscount(?int $branchId = null): ?array
    {
        return $this->product ? $this->product->getActiveDiscount($branchId) : null;
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

    /**
     * Get full name with localized labels (legacy support)
     * Example: "Product Name | Ölçü: M | Rəng: Red"
     */
    public function getFullNameAttribute(): string
    {
        $parts = [$this->product->name ?? 'Unknown Product'];

        if ($this->size) {
            $parts[] = "Ölçü: {$this->size}";
        }

        if ($this->color) {
            $parts[] = "Rəng: {$this->color}";
        }

        return implode(' | ', $parts);
    }

    // ========================================
    // QUERY SCOPES
    // ========================================

    /**
     * Scope to filter by account ID
     * CRITICAL: Always use this scope!
     * Note: BelongsToAccount trait adds a global scope and forAccount method
     */
    // public function scopeForAccount() - Provided by BelongsToAccount trait

    /**
     * Scope to get only active variants
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to find by barcode
     * CRITICAL: Must be scoped by account!
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

    /**
     * Legacy scope - kept for backward compatibility
     */
    public function scopeByProduct(Builder $query, int $productId): Builder
    {
        return $query->forProduct($productId);
    }

    // ========================================
    // STOCK MANAGEMENT METHODS
    // ========================================

    /**
     * Get total stock across all warehouses
     * CRITICAL: Must filter by account_id
     */
    public function getTotalStock(): float
    {
        return $this->stock()
            ->where('account_id', $this->account_id)
            ->sum('quantity');
    }

    /**
     * Get total stock as attribute (legacy support)
     */
    public function getTotalStockAttribute(): float
    {
        return $this->getTotalStock();
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
     * Legacy method name - kept for backward compatibility
     */
    public function hasStockInWarehouse(int $warehouseId, float $quantity = 1): bool
    {
        return $this->hasStock($warehouseId, $quantity);
    }

    /**
     * Check if variant is in stock (any warehouse)
     */
    public function isInStock(): bool
    {
        return $this->getTotalStock() > 0;
    }

    // ========================================
    // MODEL EVENTS (BOOT METHOD)
    // ========================================

    /**
     * Boot the model
     */
    protected static function boot()
    {
        parent::boot();

        // Auto-set account_id if not set (additional safety on top of BelongsToAccount trait)
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

        // Also validate on update if product_id changes
        static::updating(function ($variant) {
            if ($variant->isDirty('product_id') && $variant->product) {
                if ($variant->account_id !== $variant->product->account_id) {
                    throw new \Exception('Variant account_id must match product account_id');
                }
            }
        });
    }
}
