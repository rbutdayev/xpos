<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class StockHistory extends Model
{
    use HasFactory;

    protected $table = 'stock_history';

    protected $fillable = [
        'product_id',
        'warehouse_id',
        'quantity_before',
        'quantity_change',
        'quantity_after',
        'type',
        'reference_type',
        'reference_id',
        'user_id',
        'notes',
        'occurred_at',
    ];

    protected function casts(): array
    {
        return [
            'quantity_before' => 'decimal:3',
            'quantity_change' => 'decimal:3',
            'quantity_after' => 'decimal:3',
            'occurred_at' => 'datetime',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeByType(Builder $query, string $type): Builder
    {
        return $query->where('type', $type);
    }

    public function scopeByReference(Builder $query, string $referenceType, int $referenceId): Builder
    {
        return $query->where('reference_type', $referenceType)
                    ->where('reference_id', $referenceId);
    }

    public function scopeRecent(Builder $query, int $days = 30): Builder
    {
        return $query->where('occurred_at', '>=', now()->subDays($days));
    }

    public function scopeBetweenDates(Builder $query, string $startDate, string $endDate): Builder
    {
        return $query->whereBetween('occurred_at', [$startDate, $endDate]);
    }

    public function isInbound(): bool
    {
        return in_array($this->type, ['daxil_olma', 'transfer_in', 'adjustment']) && $this->quantity_change > 0;
    }

    public function isOutbound(): bool
    {
        return in_array($this->type, ['xaric_olma', 'transfer_out', 'adjustment']) && $this->quantity_change < 0;
    }

    public function getMovementDescriptionAttribute(): string
    {
        $descriptions = [
            'daxil_olma' => 'Daxil olma',
            'xaric_olma' => 'Xaric olma',
            'transfer_in' => 'Transfer (daxil)',
            'transfer_out' => 'Transfer (xaric)',
            'adjustment' => 'Düzəliş',
            'inventory' => 'İnventar',
        ];

        return $descriptions[$this->type] ?? $this->type;
    }
}
