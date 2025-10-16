<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkAssignment extends Model
{
    use HasFactory;

    protected $primaryKey = 'assignment_id';

    protected $fillable = [
        'employee_id',
        'service_id',
        'hours_worked',
        'labor_cost',
        'completed_at',
        'notes',
    ];

    protected $casts = [
        'hours_worked' => 'decimal:2',
        'labor_cost' => 'decimal:2',
        'completed_at' => 'datetime',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'employee_id', 'id');
    }

    public function serviceRecord(): BelongsTo
    {
        return $this->belongsTo(TailorService::class, 'service_id');
    }

    public function calculateLaborCost(): void
    {
        if ($this->employee && $this->hours_worked > 0) {
            $this->labor_cost = $this->hours_worked * $this->employee->hourly_rate;
        }
    }

    public function markCompleted(): void
    {
        $this->completed_at = now();
        $this->save();
    }

    public function scopeCompleted($query)
    {
        return $query->whereNotNull('completed_at');
    }

    public function scopePending($query)
    {
        return $query->whereNull('completed_at');
    }
}
