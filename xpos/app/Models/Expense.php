<?php

namespace App\Models;

use App\Traits\BelongsToAccount;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class Expense extends Model
{
    use HasFactory, BelongsToAccount;

    protected $primaryKey = 'expense_id';

    protected $fillable = [
        'account_id',
        'branch_id',
        'category_id',
        'amount',
        'description',
        'expense_date',
        'reference_number',
        'payment_method',
        'user_id',
        'supplier_id',
        'supplier_payment_id',
        'supplier_credit_id',
        'credit_payment_amount',
        'goods_receipt_id',
        'receipt_file_path',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'credit_payment_amount' => 'decimal:2',
            'expense_date' => 'date',
        ];
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(ExpenseCategory::class, 'category_id', 'category_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function supplierCredit(): BelongsTo
    {
        return $this->belongsTo(SupplierCredit::class);
    }

    public function goodsReceipt(): BelongsTo
    {
        return $this->belongsTo(GoodsReceipt::class);
    }

    public function supplierPayment(): BelongsTo
    {
        return $this->belongsTo(SupplierPayment::class, 'supplier_payment_id', 'payment_id');
    }

    public function scopeByBranch(Builder $query, $branchId): Builder
    {
        return $query->where('branch_id', $branchId);
    }

    public function scopeByCategory(Builder $query, $categoryId): Builder
    {
        return $query->where('category_id', $categoryId);
    }

    public function scopeByDateRange(Builder $query, $startDate, $endDate): Builder
    {
        return $query->whereBetween('expense_date', [$startDate, $endDate]);
    }

    public function scopeByPaymentMethod(Builder $query, string $method): Builder
    {
        return $query->where('payment_method', $method);
    }

    public function scopeThisMonth(Builder $query): Builder
    {
        return $query->whereMonth('expense_date', now()->month)
                    ->whereYear('expense_date', now()->year);
    }

    public function scopeThisYear(Builder $query): Builder
    {
        return $query->whereYear('expense_date', now()->year);
    }

    public function generateReferenceNumber(): string
    {
        $prefix = 'EXP-' . date('Y') . '-';
        $lastExpense = static::where('account_id', $this->account_id)
            ->where('reference_number', 'like', "{$prefix}%")
            ->orderByDesc('reference_number')
            ->first();

        if ($lastExpense) {
            $lastNumber = (int) str_replace($prefix, '', $lastExpense->reference_number);
            $nextNumber = $lastNumber + 1;
        } else {
            $nextNumber = 1;
        }

        return $prefix . str_pad($nextNumber, 6, '0', STR_PAD_LEFT);
    }

    public function hasReceipt(): bool
    {
        return !empty($this->receipt_file_path) && \Storage::disk('documents')->exists($this->receipt_file_path);
    }

    public static function getPaymentMethods(): array
    {
        $methods = [];
        foreach (\App\Enums\PaymentMethod::cases() as $method) {
            $methods[$method->value] = $method->label();
        }
        return $methods;
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($expense) {
            if (empty($expense->reference_number)) {
                $expense->reference_number = $expense->generateReferenceNumber();
            }
        });

        static::deleting(function ($expense) {
            // If this expense paid a supplier credit, reverse the payment
            if ($expense->supplier_credit_id && $expense->credit_payment_amount > 0) {
                $supplierCredit = SupplierCredit::find($expense->supplier_credit_id);

                if ($supplierCredit) {
                    // Restore the remaining amount
                    $supplierCredit->remaining_amount += $expense->credit_payment_amount;

                    // Update status based on remaining amount
                    if ($supplierCredit->remaining_amount >= $supplierCredit->amount) {
                        $supplierCredit->status = 'pending';
                    } elseif ($supplierCredit->remaining_amount > 0) {
                        $supplierCredit->status = 'partial';
                    } else {
                        $supplierCredit->status = 'paid';
                    }

                    // Add reversal entry to payment history
                    $paymentHistory = $supplierCredit->payment_history ?? [];
                    $paymentHistory[] = [
                        'amount' => -$expense->credit_payment_amount,
                        'date' => now()->toDateString(),
                        'description' => "Ödəmə ləğv edildi: {$expense->reference_number} (Xerc silindi)",
                    ];
                    $supplierCredit->payment_history = $paymentHistory;

                    $supplierCredit->save();
                }
            }

            // If this expense paid a goods receipt, restore its payment status
            if ($expense->goods_receipt_id) {
                $goodsReceipt = GoodsReceipt::find($expense->goods_receipt_id);

                if ($goodsReceipt && $goodsReceipt->supplierCredit) {
                    // Update goods receipt status based on supplier credit remaining amount
                    $supplierCredit = $goodsReceipt->supplierCredit;

                    if ($supplierCredit->remaining_amount >= $supplierCredit->amount) {
                        $goodsReceipt->payment_status = 'unpaid';
                    } elseif ($supplierCredit->remaining_amount > 0) {
                        $goodsReceipt->payment_status = 'partial';
                    } else {
                        $goodsReceipt->payment_status = 'paid';
                    }

                    $goodsReceipt->save();
                }
            }
        });
    }
}