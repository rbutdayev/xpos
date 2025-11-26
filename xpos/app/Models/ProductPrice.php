<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class ProductPrice extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'branch_id',
        'purchase_price',
        'sale_price',
        'discount_percentage',
        'min_sale_price',
        'effective_from',
        'effective_until',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'purchase_price' => 'decimal:2',
            'sale_price' => 'decimal:2',
            'discount_percentage' => 'decimal:2',
            'min_sale_price' => 'decimal:2',
            'effective_from' => 'date',
            'effective_until' => 'date',
            'is_active' => 'boolean',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeEffective(Builder $query): Builder
    {
        $today = now()->toDateString();
        return $query->where('effective_from', '<=', $today)
                    ->where(function ($q) use ($today) {
                        $q->whereNull('effective_until')
                          ->orWhere('effective_until', '>=', $today);
                    });
    }

    public function scopeExpired(Builder $query): Builder
    {
        $today = now()->toDateString();
        return $query->whereNotNull('effective_until')
                    ->where('effective_until', '<', $today);
    }

    public function scopeForBranch(Builder $query, ?int $branchId): Builder
    {
        if ($branchId) {
            // Look for prices specific to this branch OR prices for all branches (null)
            // Prioritize branch-specific prices by ordering
            return $query->where(function ($q) use ($branchId) {
                $q->where('branch_id', $branchId)
                  ->orWhereNull('branch_id');
            })->orderByRaw('branch_id IS NULL ASC');
        }
        return $query->whereNull('branch_id');
    }

    public function isEffective(): bool
    {
        $today = now()->toDateString();
        return $this->effective_from <= $today && 
               ($this->effective_until === null || $this->effective_until >= $today);
    }

    public function getDiscountedPriceAttribute(): float
    {
        if ($this->discount_percentage > 0) {
            return (float) ($this->sale_price * (1 - $this->discount_percentage / 100));
        }
        
        return (float) $this->sale_price;
    }
}
