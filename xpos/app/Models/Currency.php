<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Currency extends Model
{
    protected $primaryKey = 'code';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'code',
        'name',
        'symbol',
        'decimal_places',
        'symbol_position',
        'active',
    ];

    protected $casts = [
        'decimal_places' => 'integer',
        'active' => 'boolean',
    ];

    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    public function formatAmount(float $amount): string
    {
        $formattedAmount = number_format($amount, $this->decimal_places);

        return $this->symbol_position === 'before'
            ? $this->symbol . $formattedAmount
            : $formattedAmount . $this->symbol;
    }

    public function getFormattedExampleAttribute(): string
    {
        return $this->formatAmount(1234.56);
    }
}
