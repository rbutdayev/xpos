<?php

namespace App\Models;

use App\Traits\BelongsToAccount;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class SaleReturn extends Model
{
    use HasFactory, BelongsToAccount;

    protected $table = 'returns';
    protected $primaryKey = 'return_id';

    protected $fillable = [
        'account_id',
        'sale_id',
        'branch_id',
        'customer_id',
        'user_id',
        'return_number',
        'fiscal_number',
        'fiscal_document_id',
        'use_fiscal_printer',
        'subtotal',
        'tax_amount',
        'total',
        'status',
        'reason',
        'notes',
        'return_date',
    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'total' => 'decimal:2',
            'use_fiscal_printer' => 'boolean',
            'return_date' => 'datetime',
        ];
    }

    // Relationships
    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class, 'sale_id', 'sale_id');
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(ReturnItem::class, 'return_id', 'return_id');
    }

    public function refunds(): HasMany
    {
        return $this->hasMany(Refund::class, 'return_id', 'return_id');
    }

    // Scopes
    public function scopeCompleted(Builder $query): Builder
    {
        return $query->where('status', 'completed');
    }

    public function scopePending(Builder $query): Builder
    {
        return $query->where('status', 'pending');
    }

    public function scopeCancelled(Builder $query): Builder
    {
        return $query->where('status', 'cancelled');
    }

    public function scopeToday(Builder $query): Builder
    {
        return $query->whereDate('return_date', today());
    }

    // Status checkers
    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isCancelled(): bool
    {
        return $this->status === 'cancelled';
    }

    // Calculated attributes
    public function getTotalRefundedAttribute(): float
    {
        return $this->refunds()->sum('amount');
    }

    public function getRemainingRefundAttribute(): float
    {
        return $this->total - $this->total_refunded;
    }

    public function isFullyRefunded(): bool
    {
        return $this->remaining_refund <= 0;
    }

    public function calculateTotals(): void
    {
        $this->subtotal = $this->items()->sum(\DB::raw('quantity * unit_price'));
        $this->total = $this->subtotal + $this->tax_amount;
        $this->save();
    }

    // Boot method
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($return) {
            if (empty($return->return_number)) {
                $return->return_number = static::generateReturnNumber($return->account_id);
            }
            if (empty($return->return_date)) {
                $return->return_date = now();
            }
        });
    }

    // Generate unique return number
    public static function generateReturnNumber(int $accountId): string
    {
        $prefix = 'RET';

        $result = \DB::select(
            "SELECT COALESCE(MAX(CAST(SUBSTRING(return_number, 4) AS UNSIGNED)), 0) as max_sequence
             FROM returns
             WHERE account_id = ?
             AND return_number LIKE ?
             AND LENGTH(return_number) = 7
             FOR UPDATE",
            [$accountId, $prefix . '%']
        );

        $sequence = ($result[0]->max_sequence ?? 0) + 1;

        return $prefix . str_pad($sequence, 4, '0', STR_PAD_LEFT);
    }
}
