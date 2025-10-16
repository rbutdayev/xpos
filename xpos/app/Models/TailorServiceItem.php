<?php

namespace App\Models;

use App\Traits\BelongsToAccount;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TailorServiceItem extends Model
{
    use HasFactory, BelongsToAccount;

    protected $table = 'tailor_service_items';

    protected $fillable = [
        'account_id',           // ⚠️ CRITICAL - Multi-tenant
        'tailor_service_id',    // Renamed from service_record_id
        'product_id',
        'variant_id',           // Support for product variants
        'service_id_ref',
        'item_type',
        'item_name',
        'quantity',
        'base_quantity',
        'unit_price',
        'total_price',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:3',
            'base_quantity' => 'decimal:3',
            'unit_price' => 'decimal:4',
            'total_price' => 'decimal:2',
        ];
    }

    protected $appends = [
        'display_name',
        'formatted_total_price',
        'formatted_unit_price',
        'formatted_quantity',
        'formatted_base_quantity'
    ];

    protected static function boot()
    {
        parent::boot();

        static::saving(function ($serviceItem) {
            // Automatically calculate total price
            $serviceItem->total_price = $serviceItem->quantity * $serviceItem->unit_price;
        });

        static::saved(function ($serviceItem) {
            // Update service record parts total
            $serviceItem->tailorService->updatePartsTotal();
        });

        static::deleted(function ($serviceItem) {
            // Update service record parts total
            $serviceItem->tailorService->updatePartsTotal();
        });
    }

    /**
     * Get the tailor service
     */
    public function tailorService(): BelongsTo
    {
        return $this->belongsTo(TailorService::class, 'tailor_service_id')
            ->where('account_id', $this->account_id);
    }

    /**
     * Get the product
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class)
            ->where('account_id', $this->account_id);
    }

    /**
     * Get the product variant (if applicable)
     */
    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'variant_id')
            ->where('account_id', $this->account_id);
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'service_id_ref')
            ->where('account_id', $this->account_id);
    }

    public function getFormattedTotalPriceAttribute(): string
    {
        return number_format((float) $this->total_price, 2) . ' AZN';
    }

    public function getFormattedUnitPriceAttribute(): string
    {
        return number_format((float) $this->unit_price, 4) . ' AZN';
    }

    public function getFormattedQuantityAttribute(): string
    {
        return number_format((float) $this->quantity, 3);
    }

    public function getFormattedBaseQuantityAttribute(): string
    {
        return number_format((float) ($this->base_quantity ?? $this->quantity), 3);
    }

    public function getDisplayNameAttribute(): string
    {
        if ($this->item_type === 'product' && $this->product) {
            $name = $this->product->name;

            // Add variant info if exists
            if ($this->variant) {
                $variantInfo = [];
                if ($this->variant->size) $variantInfo[] = $this->variant->size;
                if ($this->variant->color) $variantInfo[] = $this->variant->color;
                if (!empty($variantInfo)) {
                    $name .= ' (' . implode(', ', $variantInfo) . ')';
                }
            } elseif ($this->product->sku) {
                $name .= " ({$this->product->sku})";
            }

            return $name;
        } elseif ($this->item_type === 'service' && $this->service) {
            return $this->service->name . ($this->service->code ? " ({$this->service->code})" : '');
        } elseif ($this->item_name) {
            return $this->item_name;
        }

        return 'Bilinməyən məhsul/xidmət';
    }
}
