<?php

namespace App\Models;

use App\Traits\BelongsToAccount;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class Sale extends Model
{
    use HasFactory, BelongsToAccount;

    protected $primaryKey = 'sale_id';

    protected $fillable = [
        'account_id',
        'branch_id',
        'customer_id',
        'sale_number',
        'fiscal_number',
        'use_fiscal_printer',
        'subtotal',
        'tax_amount',
        'discount_amount',
        'total',
        'status',
        'has_negative_stock',
        'user_id',
        'notes',
        'sale_date',
        'payment_status',
        'paid_amount',
        'credit_amount',
        'credit_due_date',
        'customer_credit_id',
        'is_online_order',
        'customer_name',
        'customer_phone',
        'delivery_notes',
    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'total' => 'decimal:2',
            'paid_amount' => 'decimal:2',
            'credit_amount' => 'decimal:2',
            'has_negative_stock' => 'boolean',
            'use_fiscal_printer' => 'boolean',
            'sale_date' => 'datetime',
            'credit_due_date' => 'date',
            'is_online_order' => 'boolean',
        ];
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
        return $this->hasMany(SaleItem::class, 'sale_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class, 'sale_id');
    }

    public function negativeStockAlerts(): HasMany
    {
        return $this->hasMany(NegativeStockAlert::class, 'sale_id');
    }

    public function customerCredit(): BelongsTo
    {
        return $this->belongsTo(CustomerCredit::class);
    }

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

    public function scopeWithNegativeStock(Builder $query): Builder
    {
        return $query->where('has_negative_stock', true);
    }

    public function scopeToday(Builder $query): Builder
    {
        return $query->whereDate('sale_date', today());
    }

    public function scopeOnlineOrders(Builder $query): Builder
    {
        return $query->where('is_online_order', true);
    }

    public function scopePosOrders(Builder $query): Builder
    {
        return $query->where('is_online_order', false);
    }

    /**
     * Scope to only include sales that should be counted in reports/lists
     * - All regular POS sales (regardless of status)
     * - Only COMPLETED online orders
     */
    public function scopeCountable(Builder $query): Builder
    {
        return $query->where(function($q) {
            $q->where('is_online_order', false)
              ->orWhere(function($q) {
                  $q->where('is_online_order', true)
                    ->where('status', 'completed');
              });
        });
    }

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

    public function hasNegativeStock(): bool
    {
        return $this->has_negative_stock;
    }

    public function isOnlineOrder(): bool
    {
        return $this->is_online_order;
    }

    public function getTotalPaidAttribute(): float
    {
        return $this->payments()->sum('amount');
    }

    public function getRemainingBalanceAttribute(): float
    {
        return $this->total - $this->total_paid;
    }

    public function isFullyPaid(): bool
    {
        return $this->remaining_balance <= 0;
    }

    public function calculateTotals(): void
    {
        $this->subtotal = $this->items()->sum(DB::raw('quantity * unit_price'));
        $this->total = $this->subtotal + $this->tax_amount - $this->discount_amount;
        $this->save();
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($sale) {
            if (empty($sale->sale_number)) {
                $sale->sale_number = static::generateSaleNumber($sale->account_id);
            }
            if (empty($sale->sale_date)) {
                $sale->sale_date = now();
            }
        });
    }

    public static function generateSaleNumber(int $accountId): string
    {
        $prefix = 'SAT';

        // Use a raw SQL query with FOR UPDATE to atomically get and lock the max sequence
        // This prevents race conditions when multiple sales are created simultaneously
        // The lock is scoped to the specific account_id, ensuring tenant isolation
        // Only look at new format numbers (SAT + 4 digits, length = 7)
        $result = \DB::select(
            "SELECT COALESCE(MAX(CAST(SUBSTRING(sale_number, 4) AS UNSIGNED)), 0) as max_sequence
             FROM sales
             WHERE account_id = ?
             AND sale_number LIKE ?
             AND LENGTH(sale_number) = 7
             FOR UPDATE",
            [$accountId, $prefix . '%']
        );

        $sequence = ($result[0]->max_sequence ?? 0) + 1;

        return $prefix . str_pad($sequence, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Set sale as credit sale and create customer credit record
     */
    public function setAsCredit(float $creditAmount, ?string $dueDate = null, ?string $description = null): CustomerCredit
    {
        $this->credit_amount = $creditAmount;
        $this->credit_due_date = $dueDate;
        
        // Create customer credit record
        $customerCredit = CustomerCredit::create([
            'account_id' => $this->account_id,
            'customer_id' => $this->customer_id,
            'branch_id' => $this->branch_id,
            'type' => 'credit',
            'amount' => $creditAmount,
            'description' => $description ?: "Satış borcu: {$this->sale_number}",
            'credit_date' => now()->toDateString(),
            'due_date' => $dueDate,
            'user_id' => auth()->id(),
        ]);

        $this->customer_credit_id = $customerCredit->id;
        $this->save();

        return $customerCredit;
    }

    /**
     * Check if sale has unpaid credit
     */
    public function hasUnpaidCredit(): bool
    {
        return $this->customer_credit_id && $this->credit_amount > 0;
    }

    /**
     * Check if sale is fully paid (including credits)
     */
    public function isFullyPaidIncludingCredit(): bool
    {
        if ($this->customer_credit_id) {
            return $this->credit_amount <= 0;
        }
        return $this->isFullyPaid();
    }

    /**
     * Get credit status text
     */
    public function getCreditStatusTextAttribute(): string
    {
        if (!$this->customer_credit_id) {
            return 'Ödənilib';
        }
        
        if ($this->credit_amount > 0) {
            return 'Borclu';
        }
        
        return 'Ödənilib';
    }

    /**
     * Get credit status color
     */
    public function getCreditStatusColorAttribute(): string
    {
        if (!$this->customer_credit_id) {
            return 'green';
        }
        
        if ($this->credit_amount > 0) {
            return 'red';
        }
        
        return 'green';
    }
}
