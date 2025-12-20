<?php

namespace App\Models;

use App\Traits\BelongsToAccount;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletes;
use Carbon\Carbon;

class GoodsReceipt extends Model
{
    use HasFactory, BelongsToAccount, SoftDeletes;

    protected $fillable = [
        'account_id',
        'warehouse_id',
        'supplier_id',
        'employee_id',
        'receipt_number',
        'invoice_number',    // Supplier's invoice number (optional)
        'total_cost',        // Sum of all items' total_cost
        'document_path',
        'notes',
        'additional_data',   // Receipt-level metadata
        'payment_status',
        'payment_method',
        'due_date',
        'supplier_credit_id',
        'status',            // Draft or completed status
    ];

    protected function casts(): array
    {
        return [
            'total_cost' => 'decimal:2',
            'additional_data' => 'json',
            'due_date' => 'date',
        ];
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function items()
    {
        return $this->hasMany(GoodsReceiptItem::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'employee_id', 'id');
    }

    public function supplierCredit(): BelongsTo
    {
        return $this->belongsTo(SupplierCredit::class);
    }

    public function expenses()
    {
        return $this->hasMany(Expense::class, 'goods_receipt_id', 'id');
    }

    public function scopeByWarehouse(Builder $query, $warehouseId): Builder
    {
        return $query->where('warehouse_id', $warehouseId);
    }

    public function scopeBySupplier(Builder $query, $supplierId): Builder
    {
        return $query->where('supplier_id', $supplierId);
    }

    public function scopeByDateRange(Builder $query, $startDate, $endDate): Builder
    {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }

    public function scopeByInvoice(Builder $query, $invoiceNumber): Builder
    {
        return $query->where('invoice_number', $invoiceNumber);
    }

    public function scopeDrafts(Builder $query): Builder
    {
        return $query->where('status', 'draft');
    }

    public function scopeCompleted(Builder $query): Builder
    {
        return $query->where('status', 'completed');
    }

    public function generateReceiptNumber(): string
    {
        $prefix = 'MQ-' . date('Y') . '-';
        $lastReceipt = static::where('account_id', $this->account_id)
            ->where('receipt_number', 'like', "{$prefix}%")
            ->orderByDesc('receipt_number')
            ->first();

        if ($lastReceipt) {
            $lastNumber = (int) str_replace($prefix, '', $lastReceipt->receipt_number);
            $nextNumber = $lastNumber + 1;
        } else {
            $nextNumber = 1;
        }

        return $prefix . str_pad($nextNumber, 6, '0', STR_PAD_LEFT);
    }

    /**
     * Calculate total cost from all items
     */
    public function calculateTotalCost(): float
    {
        return (float) $this->items()->sum('total_cost');
    }

    /**
     * Get item count
     */
    public function getItemCountAttribute(): int
    {
        return $this->items()->count();
    }

    public function hasDocument(): bool
    {
        return !empty($this->document_path);
    }

    /**
     * Check if the goods receipt payment is unpaid
     */
    public function isUnpaid(): bool
    {
        return $this->payment_status === 'unpaid';
    }

    /**
     * Check if the goods receipt is a draft
     */
    public function isDraft(): bool
    {
        return $this->status === 'draft';
    }

    /**
     * Check if the goods receipt is completed
     */
    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    /**
     * Calculate due date using supplier payment terms
     */
    public function calculateDueDate(): ?Carbon
    {
        if (!$this->supplier) {
            return null;
        }

        $paymentTermsDays = $this->supplier->payment_terms_days ?? 0;
        
        if ($paymentTermsDays === 0) {
            // No payment terms means immediate payment
            return null;
        }

        return $this->created_at->addDays($paymentTermsDays);
    }

    /**
     * Create linked supplier credit for unpaid goods receipt
     */
    public function createSupplierCredit(): SupplierCredit
    {
        $supplierCredit = SupplierCredit::create([
            'account_id' => $this->account_id,
            'supplier_id' => $this->supplier_id,
            'branch_id' => $this->warehouse->branches->first()?->id ?? Branch::where('account_id', $this->account_id)->first()?->id,
            'type' => 'credit',
            'amount' => $this->total_cost,
            'remaining_amount' => $this->total_cost,
            'description' => "Mal qəbulu üçün borc - {$this->receipt_number}",
            'credit_date' => $this->created_at,
            'due_date' => $this->due_date,
            'status' => 'pending',
            'user_id' => $this->employee_id,
            'notes' => "Avtomatik yaradıldı - Mal qəbulu: {$this->receipt_number}",
        ]);

        // Link the supplier credit to this goods receipt
        $this->update(['supplier_credit_id' => $supplierCredit->id]);

        return $supplierCredit;
    }

    /**
     * Mark goods receipt as paid
     */
    public function markAsPaid(): void
    {
        $this->update(['payment_status' => 'paid']);

        // If there's a linked supplier credit, mark it as paid too
        if ($this->supplierCredit) {
            $this->supplierCredit->update([
                'status' => 'paid',
                'remaining_amount' => 0,
            ]);
        }
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($goodsReceipt) {
            // Only generate receipt_number for completed receipts, not drafts
            if (empty($goodsReceipt->receipt_number) && $goodsReceipt->status === 'completed') {
                $goodsReceipt->receipt_number = $goodsReceipt->generateReceiptNumber();
            }

            // Don't auto-calculate total_cost here - it's set in the controller with discount applied
        });

        // Removed updating event - total_cost is now managed in controller with discount logic
    }
}
