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
        'amount',
        'remaining_amount',
        'description',
        'reference_number',
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
    }
}
