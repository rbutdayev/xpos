<?php

namespace App\Models;

use App\Traits\BelongsToAccount;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletes;

class Rental extends Model
{
    use HasFactory, BelongsToAccount, SoftDeletes;

    protected $fillable = [
        'account_id',
        'rental_number',
        'customer_id',
        'branch_id',
        'user_id',
        'rental_start_date',
        'rental_end_date',
        'actual_return_date',
        'rental_price',
        'deposit_amount',
        'late_fee',
        'damage_fee',
        'total_cost',
        'paid_amount',
        'credit_amount',
        'payment_status',
        'status',
        'collateral_type',
        'collateral_amount',
        'collateral_document_type',
        'collateral_document_number',
        'collateral_photo_path',
        'collateral_notes',
        'collateral_returned',
        'collateral_returned_at',
        'condition_on_rental',
        'condition_on_return',
        'damage_notes',
        'sms_sent',
        'sms_sent_at',
        'telegram_sent',
        'telegram_sent_at',
        'reminder_sent',
        'reminder_sent_at',
        'overdue_alert_sent',
        'overdue_alert_sent_at',
        'notes',
        'internal_notes',
    ];

    protected function casts(): array
    {
        return [
            'rental_start_date' => 'date',
            'rental_end_date' => 'date',
            'actual_return_date' => 'date',
            'rental_price' => 'decimal:2',
            'deposit_amount' => 'decimal:2',
            'late_fee' => 'decimal:2',
            'damage_fee' => 'decimal:2',
            'total_cost' => 'decimal:2',
            'paid_amount' => 'decimal:2',
            'credit_amount' => 'decimal:2',
            'condition_on_rental' => 'json',
            'condition_on_return' => 'json',
            'sms_sent' => 'boolean',
            'telegram_sent' => 'boolean',
            'reminder_sent' => 'boolean',
            'overdue_alert_sent' => 'boolean',
            'collateral_returned' => 'boolean',
            'sms_sent_at' => 'datetime',
            'telegram_sent_at' => 'datetime',
            'reminder_sent_at' => 'datetime',
            'overdue_alert_sent_at' => 'datetime',
            'collateral_returned_at' => 'datetime',
        ];
    }

    // Relationships
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(RentalItem::class);
    }

    public function agreement(): HasOne
    {
        return $this->hasOne(RentalAgreement::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class, 'rental_id');
    }

    // Scopes
    public function scopeReserved(Builder $query): Builder
    {
        return $query->where('status', 'reserved');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'active');
    }

    public function scopeReturned(Builder $query): Builder
    {
        return $query->where('status', 'returned');
    }

    public function scopeOverdue(Builder $query): Builder
    {
        return $query->where('status', 'overdue');
    }

    public function scopeCancelled(Builder $query): Builder
    {
        return $query->where('status', 'cancelled');
    }

    public function scopeUnreturned(Builder $query): Builder
    {
        return $query->whereIn('status', ['reserved', 'active', 'overdue']);
    }

    public function scopePaid(Builder $query): Builder
    {
        return $query->where('payment_status', 'paid');
    }

    public function scopeCredit(Builder $query): Builder
    {
        return $query->where('payment_status', 'credit');
    }

    public function scopePartial(Builder $query): Builder
    {
        return $query->where('payment_status', 'partial');
    }

    public function scopeDueToday(Builder $query): Builder
    {
        return $query->where('rental_end_date', today())
            ->whereIn('status', ['reserved', 'active']);
    }

    public function scopeDueWithinDays(Builder $query, int $days): Builder
    {
        return $query->whereBetween('rental_end_date', [today(), today()->addDays($days)])
            ->whereIn('status', ['reserved', 'active']);
    }

    public function scopeCurrentlyRented(Builder $query): Builder
    {
        return $query->where('status', 'active')
            ->where('rental_start_date', '<=', today())
            ->where('rental_end_date', '>=', today());
    }

    // Status Check Methods
    public function isReserved(): bool
    {
        return $this->status === 'reserved';
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function isReturned(): bool
    {
        return $this->status === 'returned';
    }

    public function isOverdue(): bool
    {
        return $this->status === 'overdue';
    }

    public function isCancelled(): bool
    {
        return $this->status === 'cancelled';
    }

    // Payment Methods
    public function isFullyPaid(): bool
    {
        return $this->paid_amount >= $this->total_cost;
    }

    public function hasCredit(): bool
    {
        return $this->credit_amount > 0;
    }

    public function getRemainingBalanceAttribute(): float
    {
        return max(0, $this->total_cost - $this->paid_amount);
    }

    // Date Methods
    public function getDaysRentedAttribute(): int
    {
        $endDate = $this->actual_return_date ?? today();
        return $this->rental_start_date->diffInDays($endDate);
    }

    public function getDaysOverdueAttribute(): int
    {
        if ($this->isReturned() || $this->isCancelled()) {
            return 0;
        }

        $today = today();
        if ($today->lte($this->rental_end_date)) {
            return 0;
        }

        return $this->rental_end_date->diffInDays($today);
    }

    public function isDueToday(): bool
    {
        return $this->rental_end_date->isToday() && !$this->isReturned();
    }

    public function isDueSoon(int $days = 3): bool
    {
        if ($this->isReturned() || $this->isCancelled()) {
            return false;
        }

        return $this->rental_end_date->isBetween(today(), today()->addDays($days));
    }

    // Collateral Methods
    public function hasCollateral(): bool
    {
        return !empty($this->collateral_type);
    }

    public function isCollateralReturned(): bool
    {
        return $this->collateral_returned;
    }

    public function isCollateralDocument(): bool
    {
        return in_array($this->collateral_type, [
            'passport',
            'id_card',
            'drivers_license',
            'other_document'
        ]);
    }

    public function isCollateralCash(): bool
    {
        return $this->collateral_type === 'deposit_cash';
    }

    // Calculate Methods
    public function calculateLateFee(float $dailyLateFee = null): float
    {
        if ($this->isReturned() || $this->isCancelled()) {
            return 0;
        }

        $daysOverdue = $this->days_overdue;
        if ($daysOverdue <= 0) {
            return 0;
        }

        // Use provided daily late fee or calculate as percentage of daily rental rate
        $dailyFee = $dailyLateFee ?? ($this->rental_price / $this->rental_start_date->diffInDays($this->rental_end_date)) * 0.1;

        return round($daysOverdue * $dailyFee, 2);
    }

    public function calculateTotalCost(): void
    {
        $this->total_cost = $this->rental_price + $this->late_fee + $this->damage_fee;
        $this->save();
    }

    // Status Update Methods
    public function markAsActive(): void
    {
        $this->status = 'active';
        $this->save();
    }

    public function markAsOverdue(): void
    {
        $this->status = 'overdue';
        $this->save();
    }

    public function markAsReturned($returnDate = null): void
    {
        $this->status = 'returned';
        $this->actual_return_date = $returnDate ?? now();
        $this->save();
    }

    public function markAsCancelled(): void
    {
        $this->status = 'cancelled';
        $this->save();
    }

    // Boot method
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($rental) {
            if (empty($rental->rental_number)) {
                $rental->rental_number = static::generateRentalNumber($rental->account_id);
            }
        });

        static::updating(function ($rental) {
            // Auto-update status to overdue if past due date
            if (!$rental->isReturned() && !$rental->isCancelled()) {
                if (today()->gt($rental->rental_end_date) && !$rental->isOverdue()) {
                    $rental->status = 'overdue';
                }
            }
        });
    }

    public static function generateRentalNumber(int $accountId): string
    {
        $prefix = 'RNT';
        $date = now()->format('Ymd');

        // Use a raw SQL query with FOR UPDATE to atomically get and lock the max sequence
        $result = \DB::select(
            "SELECT COALESCE(MAX(CAST(SUBSTRING(rental_number, 12) AS UNSIGNED)), 0) as max_sequence
             FROM rentals
             WHERE account_id = ?
             AND rental_number LIKE ?
             FOR UPDATE",
            [$accountId, $prefix . $date . '%']
        );

        $sequence = ($result[0]->max_sequence ?? 0) + 1;

        return $prefix . $date . str_pad($sequence, 3, '0', STR_PAD_LEFT);
    }
}
