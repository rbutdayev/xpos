<?php

namespace App\Models;

use App\Traits\BelongsToAccount;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GoodsReceiptItem extends Model
{
    use HasFactory, BelongsToAccount;

    protected $fillable = [
        'goods_receipt_id',
        'account_id',
        'product_id',
        'variant_id',
        'quantity',
        'unit',
        'unit_cost',
        'total_cost',
        'discount_percent',
        'additional_data',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:3',
            'unit_cost' => 'decimal:2',
            'total_cost' => 'decimal:2',
            'discount_percent' => 'decimal:2',
            'additional_data' => 'json',
        ];
    }

    public function goodsReceipt(): BelongsTo
    {
        return $this->belongsTo(GoodsReceipt::class);
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'variant_id')
            ->where('account_id', $this->account_id);
    }

    /**
     * Get subtotal before discount
     */
    public function getSubtotalAttribute(): float
    {
        return (float) ($this->unit_cost * $this->quantity);
    }

    /**
     * Get discount amount
     */
    public function getDiscountAmountAttribute(): float
    {
        return (float) (($this->subtotal * $this->discount_percent) / 100);
    }

    /**
     * Get the display name for this item (product name + variant info)
     */
    public function getDisplayNameAttribute(): string
    {
        $name = $this->product->name ?? '';

        if ($this->variant) {
            $variantInfo = [];
            if ($this->variant->size) {
                $variantInfo[] = $this->variant->size;
            }
            if ($this->variant->color) {
                $variantInfo[] = $this->variant->color;
            }
            if (!empty($variantInfo)) {
                $name .= ' (' . implode(', ', $variantInfo) . ')';
            }
        }

        return $name;
    }
}
