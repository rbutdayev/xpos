<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class SaleItem extends Model
{
    use HasFactory;

    protected $primaryKey = 'item_id';

    protected $fillable = [
        'sale_id',
        'product_id',
        'variant_id',
        'quantity',
        'unit_price',
        'discount_amount',
        'total',
        'stock_level_at_sale',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:3',
            'unit_price' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'total' => 'decimal:2',
            'stock_level_at_sale' => 'decimal:3',
        ];
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class, 'sale_id', 'sale_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'variant_id');
    }

    public function calculateTotal(): float
    {
        return ($this->quantity * $this->unit_price) - $this->discount_amount;
    }

    public function getDiscountPercentageAttribute(): float
    {
        $subtotal = $this->quantity * $this->unit_price;
        if ($subtotal == 0) {
            return 0;
        }
        return ($this->discount_amount / $subtotal) * 100;
    }

    public function getProfitAttribute(): float
    {
        if (!$this->product) {
            return 0;
        }
        
        $costPrice = $this->product->purchase_price ?? 0;
        $netPrice = $this->unit_price - ($this->discount_amount / $this->quantity);
        
        return ($netPrice - $costPrice) * $this->quantity;
    }

    protected static function boot()
    {
        parent::boot();

        static::saving(function ($saleItem) {
            $saleItem->total = $saleItem->calculateTotal();
        });
    }
}
