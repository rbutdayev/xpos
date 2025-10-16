<?php

namespace App\Models;

use App\Traits\BelongsToAccount;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MinMaxAlert extends Model
{
    use HasFactory, BelongsToAccount;

    protected $primaryKey = 'alert_id';

    protected $fillable = [
        'account_id',
        'warehouse_id',
        'product_id',
        'variant_id',
        'current_stock',
        'min_level',
        'max_level',
        'alert_type',
        'status',
        'alert_date',
        'resolved_at',
        'resolved_by',
        'resolution_notes',
    ];

    protected $casts = [
        'alert_date' => 'datetime',
        'resolved_at' => 'datetime',
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

    public function resolvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by', 'id');
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeResolved($query)
    {
        return $query->where('status', 'resolved');
    }

    public function scopeByAlertType($query, string $type)
    {
        return $query->where('alert_type', $type);
    }

    public function getFormattedAlertTypeAttribute(): string
    {
        $types = [
            'min_level' => 'Minimum səviyyə',
            'max_level' => 'Maksimum səviyyə',
            'zero_stock' => 'Sıfır stok',
        ];

        return $types[$this->alert_type] ?? $this->alert_type;
    }

    public function getFormattedStatusAttribute(): string
    {
        $statuses = [
            'active' => 'Aktiv',
            'acknowledged' => 'Qəbul edildi',
            'resolved' => 'Həll edildi',
        ];

        return $statuses[$this->status] ?? $this->status;
    }

    public function getPriorityAttribute(): string
    {
        return match($this->alert_type) {
            'zero_stock' => 'kritik',
            'min_level' => 'yuksek',
            'max_level' => 'orta',
            default => 'alacaq'
        };
    }

    public function markAsViewed(): void
    {
        $this->update(['status' => 'acknowledged']);
    }

    public function markAsResolved(?int $employeeId = null, ?string $notes = null): void
    {
        $this->update([
            'status' => 'resolved',
            'resolved_at' => now(),
            'resolved_by' => $employeeId,
            'resolution_notes' => $notes,
        ]);
    }
}
