<?php

namespace App\Models;

use App\Traits\BelongsToAccount;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class SupplierPayment extends Model
{
    use HasFactory, BelongsToAccount;

    protected $primaryKey = 'payment_id';

    protected $fillable = [
        'account_id',
        'supplier_id',
        'amount',
        'description',
        'payment_date',
        'payment_method',
        'reference_number',
        'invoice_number',
        'user_id',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'payment_date' => 'date',
        ];
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class, 'supplier_id', 'id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function expense()
    {
        return $this->hasOne(Expense::class, 'supplier_payment_id', 'payment_id');
    }

    public function scopeBySupplier(Builder $query, $supplierId): Builder
    {
        return $query->where('supplier_id', $supplierId);
    }

    public function scopeByDateRange(Builder $query, $startDate, $endDate): Builder
    {
        return $query->whereBetween('payment_date', [$startDate, $endDate]);
    }

    public function scopeByPaymentMethod(Builder $query, string $method): Builder
    {
        return $query->where('payment_method', $method);
    }

    public function scopeThisMonth(Builder $query): Builder
    {
        return $query->whereMonth('payment_date', now()->month)
                    ->whereYear('payment_date', now()->year);
    }

    public function scopeThisYear(Builder $query): Builder
    {
        return $query->whereYear('payment_date', now()->year);
    }

    public function generateReferenceNumber(): string
    {
        $prefix = 'SPY-' . date('Y') . '-';
        $lastPayment = static::where('account_id', $this->account_id)
            ->where('reference_number', 'like', "{$prefix}%")
            ->orderByDesc('reference_number')
            ->first();

        if ($lastPayment) {
            $lastNumber = (int) str_replace($prefix, '', $lastPayment->reference_number);
            $nextNumber = $lastNumber + 1;
        } else {
            $nextNumber = 1;
        }

        return $prefix . str_pad($nextNumber, 6, '0', STR_PAD_LEFT);
    }

    public static function getPaymentMethods(): array
    {
        return [
            'nağd' => 'Nağd',
            'kart' => 'Kart',
            'köçürmə' => 'Köçürmə'
        ];
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($payment) {
            if (empty($payment->reference_number)) {
                $payment->reference_number = $payment->generateReferenceNumber();
            }
        });

        static::deleting(function ($payment) {
            // Delete associated expense if exists
            // The expense's deleting event will handle reversing supplier credits and goods receipt statuses
            if ($payment->expense) {
                $payment->expense->delete();
            }
        });
    }
}