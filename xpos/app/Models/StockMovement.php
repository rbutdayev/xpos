<?php

namespace App\Models;

use App\Traits\BelongsToAccount;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockMovement extends Model
{
    use HasFactory, BelongsToAccount;

    protected $primaryKey = 'movement_id';

    protected $fillable = [
        'account_id',
        'warehouse_id',
        'product_id',
        'variant_id',        // Product variant (size/color) - nullable
        'movement_type',
        'quantity',
        'unit_cost',
        'reference_type',
        'reference_id',
        'employee_id',
        'notes',
    ];

    protected $casts = [
        'quantity' => 'decimal:3',
        'unit_cost' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
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

    public function employee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'employee_id', 'id');
    }

    public function scopeByMovementType($query, string $type)
    {
        return $query->where('movement_type', $type);
    }

    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }

    public function scopeByWarehouse($query, $warehouseId)
    {
        return $query->where('warehouse_id', $warehouseId);
    }

    public function scopeByProduct($query, $productId)
    {
        return $query->where('product_id', $productId);
    }

    public function getFormattedMovementTypeAttribute(): string
    {
        $types = [
            'daxil_olma' => 'Daxil olma',
            'xaric_olma' => 'Xaric olma',
            'transfer' => 'Transfer',
            'qaytarma' => 'Qaytarma',
            'itki_zerer' => 'İtki/Zərər',
        ];

        return $types[$this->movement_type] ?? $this->movement_type ?? 'Bilinməyən';
    }

    public function getTotalCostAttribute(): float
    {
        return $this->quantity * ($this->unit_cost ?? 0);
    }
}
