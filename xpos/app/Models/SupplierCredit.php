<?php

namespace App\Models;

use App\Traits\BelongsToAccount;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class SupplierCredit extends Model
{
    use HasFactory, BelongsToAccount;

    protected $fillable = [
        'account_id',
        'supplier_id',
        'branch_id',
        'type',
        'entry_type',
        'amount',
        'remaining_amount',
        'description',
        'reference_number',
        'old_system_reference',
        'credit_date',
        'due_date',
        'status',
        'user_id',
        'payment_history',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'remaining_amount' => 'decimal:2',
            'credit_date' => 'date',
            'due_date' => 'date',
            'payment_history' => 'array',
        ];
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function goodsReceipt()
    {
        return $this->hasOne(GoodsReceipt::class, 'supplier_credit_id');
    }

    public function scopeBySupplier(Builder $query, $supplierId): Builder
    {
        return $query->where('supplier_id', $supplierId);
    }

    public function scopeByStatus(Builder $query, string $status): Builder
    {
        return $query->where('status', $status);
    }

    public function scopeByType(Builder $query, string $type): Builder
    {
        return $query->where('type', $type);
    }

    public function scopePending(Builder $query): Builder
    {
        return $query->whereIn('status', ['pending', 'partial']);
    }

    public function scopeManualEntries(Builder $query): Builder
    {
        return $query->whereIn('entry_type', ['manual', 'migration']);
    }

    public function scopeAutomatic(Builder $query): Builder
    {
        return $query->where('entry_type', 'automatic');
    }

    public function scopeByEntryType(Builder $query, string $entryType): Builder
    {
        return $query->where('entry_type', $entryType);
    }

    public function generateReferenceNumber(): string
    {
        $prefix = 'SC-' . date('Y') . '-';
        $lastRecord = static::where('account_id', $this->account_id)
            ->where('reference_number', 'like', "{$prefix}%")
            ->latest('reference_number')
            ->first();

        if ($lastRecord) {
            $lastNumber = (int) str_replace($prefix, '', $lastRecord->reference_number);
            $nextNumber = $lastNumber + 1;
        } else {
            $nextNumber = 1;
        }

        return $prefix . str_pad($nextNumber, 6, '0', STR_PAD_LEFT);
    }

    public function addPayment(float $paymentAmount, ?string $description = null): bool
    {
        if ($paymentAmount <= 0 || $paymentAmount > $this->remaining_amount) {
            return false;
        }

        $this->remaining_amount = $this->remaining_amount - $paymentAmount;
        
        if ($this->remaining_amount == 0) {
            $this->status = 'paid';
        } else {
            $this->status = 'partial';
        }

        $paymentHistory = $this->payment_history ?? [];
        $paymentHistory[] = [
            'amount' => $paymentAmount,
            'date' => now()->toDateString(),
            'description' => $description,
        ];
        $this->payment_history = $paymentHistory;

        return $this->save();
    }

    public function getTotalPaidAmount(): float
    {
        return $this->amount - $this->remaining_amount;
    }

    public function getStatusTextAttribute(): string
    {
        return match($this->status) {
            'pending' => 'Gözləyir',
            'partial' => 'Qismən ödənib',
            'paid' => 'Ödənilib',
            default => $this->status,
        };
    }

    public function getTypeTextAttribute(): string
    {
        return match($this->type) {
            'credit' => 'Borc',
            'payment' => 'Ödəmə',
            default => $this->type,
        };
    }

    public function getEntryTypeTextAttribute(): string
    {
        return match($this->entry_type) {
            'automatic' => 'Avtomatik',
            'manual' => 'Əl ilə',
            'migration' => 'Köçürmə',
            default => $this->entry_type,
        };
    }

    public function isManualEntry(): bool
    {
        return in_array($this->entry_type, ['manual', 'migration']);
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($credit) {
            if (empty($credit->reference_number)) {
                $credit->reference_number = $credit->generateReferenceNumber();
            }
            if ($credit->type === 'credit') {
                $credit->remaining_amount = $credit->amount;
            }
        });

        // Sync goods receipt payment status when supplier credit status changes
        static::updated(function ($credit) {
            // Only sync if this credit is linked to a goods receipt
            if ($credit->goodsReceipt) {
                $goodsReceipt = $credit->goodsReceipt;

                // Determine correct payment status based on credit status
                if ($credit->remaining_amount == 0) {
                    $newStatus = 'paid';
                } elseif ($credit->remaining_amount < $credit->amount) {
                    $newStatus = 'partial';
                } else {
                    $newStatus = 'unpaid';
                }

                // Only update if status has changed to avoid unnecessary queries
                if ($goodsReceipt->payment_status !== $newStatus) {
                    $goodsReceipt->update(['payment_status' => $newStatus]);
                }
            }
        });
    }
}
