<?php

namespace App\Models;

use App\Traits\BelongsToAccount;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TailorServiceItem extends Model
{
    use HasFactory, BelongsToAccount;

    protected $fillable = [
        'account_id',
        'tailor_service_id',
        'item_type',
        'product_id',
        'item_name',
        'quantity',
        'unit_price',
        'total_price',
        'notes',
    ];

    protected $casts = [
        'quantity' => 'decimal:3',
        'unit_price' => 'decimal:2',
        'total_price' => 'decimal:2',
    ];

    protected $appends = [
        'display_name',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($item) {
            // Get account_id from tailor service if not set
            if (!$item->account_id && $item->tailor_service_id) {
                $service = TailorService::find($item->tailor_service_id);
                if ($service) {
                    $item->account_id = $service->account_id;
                }
            }
        });

        static::saving(function ($item) {
            // Auto-calculate total price
            $item->total_price = $item->quantity * $item->unit_price;
        });

        static::saved(function ($item) {
            // Recalculate service costs
            $item->tailorService->recalculateCosts();
        });

        static::deleted(function ($item) {
            // Recalculate service costs
            $item->tailorService->recalculateCosts();
        });
    }

    // Relationships
    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    public function tailorService(): BelongsTo
    {
        return $this->belongsTo(TailorService::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    // Accessors
    public function getDisplayNameAttribute(): string
    {
        if ($this->item_type === 'product' && $this->product) {
            return $this->product->name . ($this->product->sku ? " ({$this->product->sku})" : '');
        }
        return $this->item_name ?? '';
    }
}
