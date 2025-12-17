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
        return $query->where('method', 'cash');
    }

    public function scopeCard(Builder $query): Builder
    {
        return $query->where('method', 'card');
    }

    public function scopeTransfer(Builder $query): Builder
    {
        return $query->where('method', 'bank_transfer');
    }

    // Method checkers
    public function isCash(): bool
    {
        return $this->method === 'cash';
    }

    public function isCard(): bool
    {
        return $this->method === 'card';
    }

    public function isTransfer(): bool
    {
        return $this->method === 'bank_transfer';
    }

    // Display attribute
    public function getMethodDisplayAttribute(): string
    {
        return match($this->method) {
            'cash' => 'Nağd',
            'card' => 'Kart',
            'bank_transfer' => 'Köçürmə',
            'bank_credit' => 'Bank Kredit',
            'gift_card' => 'Hədiyyə Kartı',
            null => 'Bilinmir',
            default => $this->method ?? 'Bilinmir',
        };
    }
}
