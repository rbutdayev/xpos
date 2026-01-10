<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ModuleUsageHistory extends Model
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'module_usage_history';

    protected $fillable = [
        'account_id',
        'module_name',
        'action',
        'price_at_time',
        'effective_date',
        'days_in_month',
        'days_used',
        'prorated_amount',
        'previous_monthly_total',
        'new_monthly_total',
        'changed_by',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'effective_date' => 'date',
            'price_at_time' => 'decimal:2',
            'prorated_amount' => 'decimal:2',
            'previous_monthly_total' => 'decimal:2',
            'new_monthly_total' => 'decimal:2',
            'days_in_month' => 'integer',
            'days_used' => 'integer',
        ];
    }

    /**
     * Get the account that this usage history belongs to
     */
    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    /**
     * Get the user who made this change
     */
    public function changedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
