<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class Refund extends Model
{
    use HasFactory;

    protected $primaryKey = 'refund_id';

    protected $fillable = [
        'return_id',
        'payment_id',
        'method',
        'amount',
        'transaction_id',
        'reference_number',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
        ];
    }

    // Relationships
    public function saleReturn(): BelongsTo
    {
        return $this->belongsTo(SaleReturn::class, 'return_id', 'return_id');
    }

    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class, 'payment_id', 'payment_id');
    }

    // Scopes
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

    // Method checkers
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

    // Display attribute
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
