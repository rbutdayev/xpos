<?php

namespace App\Models;

use App\Traits\BelongsToAccount;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class EmployeeSalary extends Model
{
    use HasFactory, BelongsToAccount;

    protected $primaryKey = 'salary_id';

    public function getRouteKeyName()
    {
        return 'salary_id';
    }

    public function resolveRouteBinding($value, $field = null)
    {
        return $this->where($field ?? $this->getRouteKeyName(), $value)
                   ->where('account_id', auth()->user()->account_id)
                   ->first();
    }

    protected $fillable = [
        'account_id',
        'employee_id',
        'amount',
        'month',
        'year',
        'status',
        'payment_date',
        'bonus_amount',
        'deduction_amount',
        'bonus_reason',
        'deduction_reason',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'bonus_amount' => 'decimal:2',
            'deduction_amount' => 'decimal:2',
            'payment_date' => 'date',
            'month' => 'integer',
            'year' => 'integer',
        ];
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'employee_id', 'id');
    }

    public function scopeByEmployee(Builder $query, $employeeId): Builder
    {
        return $query->where('employee_id', $employeeId);
    }

    public function scopeByStatus(Builder $query, string $status): Builder
    {
        return $query->where('status', $status);
    }

    public function scopeByYear(Builder $query, int $year): Builder
    {
        return $query->where('year', $year);
    }

    public function scopeByMonth(Builder $query, int $month): Builder
    {
        return $query->where('month', $month);
    }

    public function scopeByPeriod(Builder $query, int $year, int $month): Builder
    {
        return $query->where('year', $year)->where('month', $month);
    }

    public function scopePending(Builder $query): Builder
    {
        return $query->where('status', 'hazırlanıb');
    }

    public function scopePaid(Builder $query): Builder
    {
        return $query->where('status', 'ödənilib');
    }

    public function scopeOverdue(Builder $query): Builder
    {
        return $query->where('status', 'gecikib');
    }

    public function getTotalAmountAttribute(): float
    {
        return $this->amount + $this->bonus_amount - $this->deduction_amount;
    }

    public function getMonthNameAttribute(): string
    {
        $months = [
            1 => 'Yanvar',
            2 => 'Fevral',
            3 => 'Mart',
            4 => 'Aprel',
            5 => 'May',
            6 => 'İyun',
            7 => 'İyul',
            8 => 'Avqust',
            9 => 'Sentyabr',
            10 => 'Oktyabr',
            11 => 'Noyabr',
            12 => 'Dekabr',
        ];

        return $months[$this->month] ?? '';
    }

    public function getPeriodDisplayAttribute(): string
    {
        return $this->month_name . ' ' . $this->year;
    }

    public static function getStatuses(): array
    {
        return [
            'hazırlanıb' => 'Hazırlanıb',
            'ödənilib' => 'Ödənilib',
            'gecikib' => 'Gecikib'
        ];
    }

    public static function getMonths(): array
    {
        return [
            1 => 'Yanvar',
            2 => 'Fevral',
            3 => 'Mart',
            4 => 'Aprel',
            5 => 'May',
            6 => 'İyun',
            7 => 'İyul',
            8 => 'Avqust',
            9 => 'Sentyabr',
            10 => 'Oktyabr',
            11 => 'Noyabr',
            12 => 'Dekabr',
        ];
    }

    public function markAsPaid(?string $paymentDate = null): void
    {
        $this->update([
            'status' => 'ödənilib',
            'payment_date' => $paymentDate ?: now()->toDateString()
        ]);
    }

    public function markAsOverdue(): void
    {
        $this->update(['status' => 'gecikib']);
    }
}