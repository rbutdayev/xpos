<?php

namespace App\Models;

use App\Traits\BelongsToAccount;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WarehouseTransfer extends Model
{
    use HasFactory, BelongsToAccount;

    protected $primaryKey = 'transfer_id';

    protected $fillable = [
        'account_id',
        'from_warehouse_id',
        'to_warehouse_id',
        'product_id',
        'variant_id',        // Product variant (size/color) - nullable
        'quantity',
        'status',
        'requested_by',
        'approved_by',
        'requested_at',
        'approved_at',
        'completed_at',
        'notes',
        'rejection_reason',
    ];

    protected $casts = [
        'requested_at' => 'datetime',
        'approved_at' => 'datetime',
        'completed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    public function fromWarehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'from_warehouse_id');
    }

    public function toWarehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'to_warehouse_id');
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

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by', 'id');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by', 'id');
    }

    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopePending($query)
    {
        return $query->where('status', 'gozlemede');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'tesdiq_edilib');
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
            'leyv_edilib' => 'Ləyv edilib',
            'tamamlanib' => 'Tamamlanıb',
            'imtina_edilib' => 'İmtina edilib',
        ];

        return $statuses[$this->status] ?? $this->status;
    }

    public function canBeApproved(): bool
    {
        return $this->status === 'gozlemede';
    }

    public function canBeCompleted(): bool
    {
        return $this->status === 'tesdiq_edilib';
    }

    public function canBeCancelled(): bool
    {
        return in_array($this->status, ['gozlemede', 'tesdiq_edilib']);
    }
}
