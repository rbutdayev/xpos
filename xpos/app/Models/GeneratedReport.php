<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GeneratedReport extends Model
{
    protected $fillable = [
        'account_id',
        'user_id',
        'type',
        'date_from',
        'date_to',
        'data'
    ];

    protected $casts = [
        'data' => 'array',
        'date_from' => 'date',
        'date_to' => 'date'
    ];

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getFormattedTypeAttribute(): string
    {
        $types = [
            'sales' => __('app.sales_report'),
            'inventory' => __('app.inventory_report'),
            'financial' => __('app.financial_report'),
            'customer' => __('app.customer_report'),
            'service' => 'Servis Hesabatı'
        ];

        return $types[$this->type] ?? $this->type;
    }

    public function getPeriodAttribute(): string
    {
        return "{$this->date_from->format('d.m.Y')} - {$this->date_to->format('d.m.Y')}";
    }
}
