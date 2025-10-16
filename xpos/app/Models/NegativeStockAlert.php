<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class NegativeStockAlert extends Model
{
    use HasFactory;

    protected $primaryKey = 'alert_id';

    protected $fillable = [
        'sale_id',
        'service_id',
        'product_id',
        'quantity_sold',
        'stock_level',
        'message',
        'status',
        'alert_date',
        'acknowledged_by',
        'acknowledged_at',
    ];

    protected function casts(): array
    {
        return [
            'quantity_sold' => 'integer',
            'stock_level' => 'integer',
            'alert_date' => 'datetime',
            'acknowledged_at' => 'datetime',
        ];
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class, 'sale_id', 'sale_id');
    }
    
    public function serviceRecord(): BelongsTo
    {
        return $this->belongsTo(TailorService::class, 'service_id', 'id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function acknowledgedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'acknowledged_by');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'active');
    }

    public function scopeAcknowledged(Builder $query): Builder
    {
        return $query->where('status', 'acknowledged');
    }

    public function scopeResolved(Builder $query): Builder
    {
        return $query->where('status', 'resolved');
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function isAcknowledged(): bool
    {
        return $this->status === 'acknowledged';
    }

    public function isResolved(): bool
    {
        return $this->status === 'resolved';
    }

    public function acknowledge(int $userId): bool
    {
        $this->status = 'acknowledged';
        $this->acknowledged_by = $userId;
        $this->acknowledged_at = now();
        
        return $this->save();
    }

    public function resolve(): bool
    {
        $this->status = 'resolved';
        
        return $this->save();
    }

    public function getStatusDisplayAttribute(): string
    {
        return match($this->status) {
            'active' => 'Aktiv',
            'acknowledged' => 'Qəbul edildi',
            'resolved' => 'Həll edildi',
            default => $this->status,
        };
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($alert) {
            if (empty($alert->alert_date)) {
                $alert->alert_date = now();
            }
            if (empty($alert->message)) {
                $alert->message = "Məhsul '{$alert->product->name}' üçün mənfi stok: {$alert->quantity_sold} satıldı, {$alert->stock_level} qalıb";
            }
        });
    }
}
