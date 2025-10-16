<?php

namespace App\Models;

use App\Traits\BelongsToAccount;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class BarcodeSequence extends Model
{
    use HasFactory, BelongsToAccount;

    protected $fillable = [
        'account_id',
        'prefix',
        'current_number',
        'format',
        'barcode_type',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'current_number' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeByType(Builder $query, string $type): Builder
    {
        return $query->where('barcode_type', $type);
    }

    public function generateNext(): string
    {
        $this->increment('current_number');
        return $this->formatBarcode($this->current_number);
    }

    public function formatBarcode(int $number): string
    {
        // Replace placeholders in format template
        $barcode = str_replace('{prefix}', $this->prefix, $this->format);
        
        // Handle number formatting (e.g., {number:06} for 6-digit padding)
        if (preg_match('/\{number:(\d+)\}/', $barcode, $matches)) {
            $padding = (int) $matches[1];
            $barcode = str_replace($matches[0], str_pad($number, $padding, '0', STR_PAD_LEFT), $barcode);
        } else {
            $barcode = str_replace('{number}', $number, $barcode);
        }
        
        return $barcode;
    }

    public function preview(): string
    {
        return $this->formatBarcode($this->current_number + 1);
    }

    public function getCurrentFormattedAttribute(): string
    {
        return $this->formatBarcode($this->current_number);
    }

    public function getNextFormattedAttribute(): string
    {
        return $this->formatBarcode($this->current_number + 1);
    }

    public static function generateBarcodeForProduct(int $accountId, string $type = 'Code-128'): string
    {
        $sequence = static::where('account_id', $accountId)
                          ->where('barcode_type', $type)
                          ->where('is_active', true)
                          ->first();

        if (!$sequence) {
            // Create default sequence if none exists
            $sequence = static::create([
                'account_id' => $accountId,
                'prefix' => 'PRD',
                'current_number' => 0,
                'format' => '{prefix}{number:06}',
                'barcode_type' => $type,
                'is_active' => true,
            ]);
        }

        return $sequence->generateNext();
    }
}
