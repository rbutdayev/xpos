<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReturnItem extends Model
{
    use HasFactory;

    protected $primaryKey = 'return_item_id';

    protected $fillable = [
        'return_id',
        'sale_item_id',
        'product_id',
        'variant_id',
        'quantity',
        'unit_price',
        'total',
        'reason',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:3',
            'unit_price' => 'decimal:2',
            'total' => 'decimal:2',
        ];
    }

    // Relationships
    public function saleReturn(): BelongsTo
    {
        return $this->belongsTo(SaleReturn::class, 'return_id', 'return_id');
    }

    public function saleItem(): BelongsTo
    {
        return $this->belongsTo(SaleItem::class, 'sale_item_id', 'item_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'variant_id');
    }

    // Calculate total
    public function calculateTotal(): float
    {
        return $this->quantity * $this->unit_price;
    }

    // Boot method
    protected static function boot()
    {
        parent::boot();

        static::saving(function ($returnItem) {
            $returnItem->total = $returnItem->calculateTotal();
        });
    }
}
