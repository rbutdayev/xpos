<?php

namespace App\Models;

use App\Traits\BelongsToAccount;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Employee extends Model
{
    use HasFactory, BelongsToAccount;

    protected $primaryKey = 'employee_id';

    protected $fillable = [
        'account_id',
        'name',
        'phone',
        'email',
        'position',
        'hire_date',
        'hourly_rate',
        'branch_id',
        'is_active',
        'notes',
    ];

    protected $casts = [
        'hire_date' => 'date',
        'hourly_rate' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function workAssignments(): HasMany
    {
        return $this->hasMany(WorkAssignment::class, 'employee_id');
    }

    public function serviceRecords(): HasMany
    {
        return $this->hasMany(ServiceRecord::class, 'employee_id');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function getFormattedPhoneAttribute(): ?string
    {
        if (!$this->phone) {
            return null;
        }

        $phone = preg_replace('/[^0-9]/', '', $this->phone);
        
        if (strlen($phone) === 12 && str_starts_with($phone, '994')) {
            return '+994 ' . substr($phone, 3, 2) . ' ' . substr($phone, 5, 3) . ' ' . substr($phone, 8, 2) . ' ' . substr($phone, 10, 2);
        }
        
        return $this->phone;
    }

    public function getTotalHoursWorkedAttribute(): float
    {
        return $this->workAssignments()->sum('hours_worked') ?? 0;
    }

    public function getTotalLaborEarnedAttribute(): float
    {
        return $this->workAssignments()->sum('labor_cost') ?? 0;
    }
}
