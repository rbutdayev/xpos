<?php

namespace App\Models;

use App\Traits\BelongsToAccount;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductReturn extends Model
{
    use HasFactory, BelongsToAccount;

    protected $primaryKey = 'return_id';

    protected $fillable = [
        'account_id',
        'supplier_id',
        'product_id',
        'variant_id',
        'warehouse_id',
        'quantity',
        'unit_cost',
        'total_cost',
        'reason',
        'status',
        'return_date',
        'requested_by',
        'approved_by',
        'supplier_response',
        'refund_amount',
        'refund_date',
    ];

    protected $casts = [
        'unit_cost' => 'decimal:2',
        'total_cost' => 'decimal:2',
        'refund_amount' => 'decimal:2',
        'return_date' => 'date',
        'refund_date' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
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

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'requested_by', 'id');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'approved_by', 'id');
    }

    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopePending($query)
    {
        return $query->where('status', 'gozlemede');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'tamamlanib');
    }

    public function getFormattedStatusAttribute(): string
    {
        $statuses = [
            'gozlemede' => 'Gözləmədə',
            'tesdiq_edilib' => 'Təsdiq edilib',
            'gonderildi' => 'Göndərildi',
            'tamamlanib' => 'Tamamlanıb',
            'imtina_edilib' => 'İmtina edilib',
        ];

        return $statuses[$this->status] ?? $this->status;
    }

    public function canBeApproved(): bool
    {
        return $this->status === 'gozlemede';
    }

    public function canBeSent(): bool
    {
        return $this->status === 'tesdiq_edilib';
    }

    public function canBeCompleted(): bool
    {
        return $this->status === 'gonderildi';
    }

    public function calculateTotalCost(): void
    {
        $this->total_cost = $this->quantity * $this->unit_cost;
    }
}
