<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class Payment extends Model
{
    use HasFactory;

    protected $primaryKey = 'payment_id';

    protected $fillable = [
        'sale_id',
        'method',
        'amount',
        'transaction_id',
        'card_type',
        'reference_number',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
        ];
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class, 'sale_id', 'sale_id');
    }

    public function scopeCash(Builder $query): Builder
    {
        return $query->where('method', 'nağd');
    }

    public function scopeCard(Builder $query): Builder
    {
        return $query->where('method', 'kart');
    }

    public function scopeTransfer(Builder $query): Builder
    {
        return $query->where('method', 'köçürmə');
    }


    public function isCash(): bool
    {
        return $this->method === 'nağd';
    }

    public function isCard(): bool
    {
        return $this->method === 'kart';
    }

    public function isTransfer(): bool
    {
        return $this->method === 'köçürmə';
    }

    public function getMethodDisplayAttribute(): string
    {
        return match($this->method) {
            'nağd' => 'Nağd',
            'kart' => 'Kart',
            'köçürmə' => 'Köçürmə',
            null => 'Bilinmir',
            default => $this->method ?? 'Bilinmir',
        };
    }
}
