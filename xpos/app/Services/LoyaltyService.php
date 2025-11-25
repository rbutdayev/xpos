<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\CustomerPoint;
use App\Models\LoyaltyProgram;
use App\Models\Sale;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class LoyaltyService
{
    /**
     * Get loyalty program for an account
     */
    public function getProgramForAccount(int $accountId): ?LoyaltyProgram
    {
        return LoyaltyProgram::where('account_id', $accountId)->first();
    }

    /**
     * Award points to a customer for a purchase
     */
    public function earnPoints(
        Customer $customer,
        Sale $sale,
        float $amount,
        ?string $description = null
    ): ?CustomerPoint {
        $program = $this->getProgramForAccount($customer->account_id);

        if (!$program || !$program->is_active) {
            return null;
        }

        // Calculate points to award
        $points = $program->calculatePointsEarned($amount);

        if ($points <= 0) {
            return null;
        }

        return DB::transaction(function () use ($customer, $sale, $points, $description, $program) {
            // Calculate new balance
            $newBalance = $customer->current_points + $points;

            // Create point transaction
            $pointTransaction = CustomerPoint::create([
                'customer_id' => $customer->id,
                'account_id' => $customer->account_id,
                'sale_id' => $sale->id,
                'transaction_type' => 'earned',
                'points' => $points,
                'balance_after' => $newBalance,
                'description' => $description ?? "Earned from purchase #{$sale->id}",
                'expires_at' => $program->points_expiry_days
                    ? Carbon::now()->addDays($program->points_expiry_days)
                    : null,
            ]);

            // Update customer points
            $customer->current_points = $newBalance;
            $customer->lifetime_points += $points;
            $customer->save();

            return $pointTransaction;
        });
    }

    /**
     * Redeem points for a discount
     */
    public function redeemPoints(
        Customer $customer,
        int $pointsToRedeem,
        Sale $sale,
        ?string $description = null
    ): ?CustomerPoint {
        $program = $this->getProgramForAccount($customer->account_id);

        if (!$program || !$program->is_active) {
            throw new \Exception('Loyalty program is not active.');
        }

        // Check if customer has enough points
        $availablePoints = $this->getAvailablePoints($customer);
        if ($pointsToRedeem > $availablePoints) {
            throw new \Exception('Insufficient points balance.');
        }

        // Check minimum redemption
        if (!$program->canRedeemPoints($pointsToRedeem)) {
            throw new \Exception("Minimum {$program->min_redemption_points} points required to redeem.");
        }

        return DB::transaction(function () use ($customer, $pointsToRedeem, $sale, $description) {
            // Calculate new balance
            $newBalance = $customer->current_points - $pointsToRedeem;

            // Create point transaction
            $pointTransaction = CustomerPoint::create([
                'customer_id' => $customer->id,
                'account_id' => $customer->account_id,
                'sale_id' => $sale->id,
                'transaction_type' => 'redeemed',
                'points' => -$pointsToRedeem,
                'balance_after' => $newBalance,
                'description' => $description ?? "Redeemed for purchase #{$sale->id}",
                'expires_at' => null,
            ]);

            // Update customer points
            $customer->current_points = $newBalance;
            $customer->save();

            return $pointTransaction;
        });
    }

    /**
     * Reverse points (for refunds/cancellations)
     */
    public function reversePoints(Sale $sale): void
    {
        $pointTransactions = CustomerPoint::where('sale_id', $sale->id)
            ->whereIn('transaction_type', ['earned', 'redeemed'])
            ->get();

        foreach ($pointTransactions as $transaction) {
            DB::transaction(function () use ($transaction) {
                $customer = $transaction->customer;

                // Reverse the transaction
                $reversalPoints = -$transaction->points;
                $newBalance = $customer->current_points + $reversalPoints;

                // Create reversal transaction
                CustomerPoint::create([
                    'customer_id' => $customer->id,
                    'account_id' => $customer->account_id,
                    'sale_id' => $transaction->sale_id,
                    'transaction_type' => 'reversed',
                    'points' => $reversalPoints,
                    'balance_after' => $newBalance,
                    'description' => "Reversed from sale #{$transaction->sale_id}",
                    'expires_at' => null,
                ]);

                // Update customer points
                $customer->current_points = $newBalance;

                // Adjust lifetime points if this was an earned transaction being reversed
                if ($transaction->transaction_type === 'earned') {
                    $customer->lifetime_points = max(0, $customer->lifetime_points - abs($transaction->points));
                }

                $customer->save();
            });
        }
    }

    /**
     * Expire old points
     */
    public function expirePoints(): int
    {
        $expiredCount = 0;

        // Find all earned points that have expired but haven't been processed
        $expiredPoints = CustomerPoint::where('transaction_type', 'earned')
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', now())
            ->get();

        foreach ($expiredPoints as $earnedPoint) {
            // Check if these points were already used or expired
            $customer = $earnedPoint->customer;

            if ($customer->current_points >= abs($earnedPoint->points)) {
                DB::transaction(function () use ($earnedPoint, $customer) {
                    $newBalance = $customer->current_points - abs($earnedPoint->points);

                    // Create expiration transaction
                    CustomerPoint::create([
                        'customer_id' => $customer->id,
                        'account_id' => $customer->account_id,
                        'sale_id' => null,
                        'transaction_type' => 'expired',
                        'points' => -abs($earnedPoint->points),
                        'balance_after' => $newBalance,
                        'description' => "Points expired from transaction #{$earnedPoint->id}",
                        'expires_at' => null,
                    ]);

                    // Update customer points
                    $customer->current_points = $newBalance;
                    $customer->save();
                });

                $expiredCount++;
            }

            // Mark the earned point as processed by updating expires_at to a past date
            // This prevents double-processing
            $earnedPoint->expires_at = now()->subDay();
            $earnedPoint->save();
        }

        return $expiredCount;
    }

    /**
     * Get available (non-expired) points for a customer
     */
    public function getAvailablePoints(Customer $customer): int
    {
        return $customer->current_points ?? 0;
    }

    /**
     * Get point transaction history for a customer
     */
    public function getPointHistory(Customer $customer, int $limit = 50)
    {
        return CustomerPoint::where('customer_id', $customer->id)
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Manually adjust points (admin function)
     */
    public function adjustPoints(
        Customer $customer,
        int $points,
        string $reason
    ): CustomerPoint {
        return DB::transaction(function () use ($customer, $points, $reason) {
            $newBalance = $customer->current_points + $points;

            $pointTransaction = CustomerPoint::create([
                'customer_id' => $customer->id,
                'account_id' => $customer->account_id,
                'sale_id' => null,
                'transaction_type' => 'adjusted',
                'points' => $points,
                'balance_after' => $newBalance,
                'description' => "Manual adjustment: {$reason}",
                'expires_at' => null,
            ]);

            // Update customer points
            $customer->current_points = $newBalance;
            if ($points > 0) {
                $customer->lifetime_points += $points;
            }
            $customer->save();

            return $pointTransaction;
        });
    }
}
