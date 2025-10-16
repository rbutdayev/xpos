<?php

namespace App\Models;

use App\Traits\BelongsToAccount;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class ProductStock extends Model
{
    use HasFactory, BelongsToAccount;

    protected $table = 'product_stock';

    protected $fillable = [
        'account_id',
        'product_id',
        'variant_id',
        'warehouse_id',
        'quantity',
        'reserved_quantity',
        'min_level',
        'max_level',
        'reorder_point',
        'reorder_quantity',
        'location',
        'last_counted_at',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:3',
            'reserved_quantity' => 'decimal:3',
            'min_level' => 'decimal:3',
            'max_level' => 'decimal:3',
            'reorder_point' => 'decimal:3',
            'reorder_quantity' => 'decimal:3',
            'last_counted_at' => 'date',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'variant_id');
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function scopeLowStock(Builder $query): Builder
    {
        return $query->whereColumn('quantity', '<=', 'min_level');
    }

    public function scopeOutOfStock(Builder $query): Builder
    {
        return $query->where('quantity', '<=', 0);
    }

    public function scopeNeedsReorder(Builder $query): Builder
    {
        return $query->whereNotNull('reorder_point')
                    ->whereColumn('quantity', '<=', 'reorder_point');
    }

    public function getAvailableQuantityAttribute(): float
    {
        return max(0, $this->quantity - $this->reserved_quantity);
    }

    public function isLowStock(): bool
    {
        return $this->quantity <= $this->min_level;
    }

    public function isOutOfStock(): bool
    {
        return $this->quantity <= 0;
    }

    public function needsReorder(): bool
    {
        return $this->reorder_point !== null && $this->quantity <= $this->reorder_point;
    }

    public function canFulfill(float $requiredQuantity): bool
    {
        return $this->available_quantity >= $requiredQuantity;
    }

    public function reserve(float $quantity): bool
    {
        if ($this->canFulfill($quantity)) {
            $this->increment('reserved_quantity', $quantity);
            return true;
        }
        
        return false;
    }

    public function unreserve(float $quantity): void
    {
        $this->decrement('reserved_quantity', min($quantity, $this->reserved_quantity));
    }
}
