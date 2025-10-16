<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class SupplierProduct extends Model
{
    use HasFactory;

    protected $fillable = [
        'supplier_id',
        'product_id',
        'supplier_price',
        'supplier_sku',
        'lead_time_days',
        'minimum_order_quantity',
        'discount_percentage',
        'notes',
        'is_preferred',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'supplier_price' => 'decimal:2',
            'discount_percentage' => 'decimal:2',
            'lead_time_days' => 'integer',
            'minimum_order_quantity' => 'integer',
            'is_preferred' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopePreferred(Builder $query): Builder
    {
        return $query->where('is_preferred', true);
    }

    public function getFinalPriceAttribute(): float
    {
        if ($this->discount_percentage > 0) {
            return $this->supplier_price * (1 - ($this->discount_percentage / 100));
        }
        
        return $this->supplier_price;
    }

    public function getSavingsAttribute(): float
    {
        if ($this->discount_percentage > 0) {
            return $this->supplier_price * ($this->discount_percentage / 100);
        }
        
        return 0;
    }

    public function getLeadTimeTextAttribute(): string
    {
        if ($this->lead_time_days === 0) {
            return 'Dərhal';
        } elseif ($this->lead_time_days === 1) {
            return '1 gün';
        } else {
            return "{$this->lead_time_days} gün";
        }
    }
}
