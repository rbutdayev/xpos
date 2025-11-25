<?php

namespace App\Models;

use App\Traits\BelongsToAccount;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class LoyaltyProgram extends Model
{
    use HasFactory, BelongsToAccount;

    protected $fillable = [
        'account_id',
        'points_per_currency_unit',
        'redemption_rate',
        'min_redemption_points',
        'points_expiry_days',
        'max_points_per_transaction',
        'earn_on_discounted_items',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'points_per_currency_unit' => 'decimal:2',
            'redemption_rate' => 'decimal:2',
            'min_redemption_points' => 'integer',
            'points_expiry_days' => 'integer',
            'max_points_per_transaction' => 'integer',
            'earn_on_discounted_items' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Calculate points earned for a given amount
     */
    public function calculatePointsEarned(float $amount): int
    {
        $points = (int) floor($amount * $this->points_per_currency_unit);

        if ($this->max_points_per_transaction && $points > $this->max_points_per_transaction) {
            return $this->max_points_per_transaction;
        }

        return max(0, $points);
    }

    /**
     * Calculate discount amount for given points
     */
    public function calculateDiscount(int $points): float
    {
        if ($points < $this->min_redemption_points) {
            return 0;
        }

        return round($points / $this->redemption_rate, 2);
    }

    /**
     * Get points needed for a specific discount amount
     */
    public function getPointsNeeded(float $discountAmount): int
    {
        return (int) ceil($discountAmount * $this->redemption_rate);
    }

    /**
     * Check if points can be redeemed
     */
    public function canRedeemPoints(int $points): bool
    {
        return $this->is_active && $points >= $this->min_redemption_points;
    }
}
