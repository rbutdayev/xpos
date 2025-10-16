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
            'sale_date' => 'datetime',
            'credit_due_date' => 'date',
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
        $date = now()->format('Ymd');
        $lastSale = static::where('account_id', $accountId)
            ->whereDate('created_at', today())
            ->orderBy('sale_id', 'desc')
            ->first();

        $sequence = $lastSale ? ((int) substr($lastSale->sale_number, -3)) + 1 : 1;

        return $prefix . $date . str_pad($sequence, 3, '0', STR_PAD_LEFT);
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
