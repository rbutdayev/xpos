<?php

namespace App\Services;

use App\Models\Account;
use App\Models\ModulePricingSetting;
use App\Models\ModuleUsageHistory;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ModuleBillingService
{
    /**
     * Calculate the financial impact of toggling a module
     *
     * @param Account $account The account to calculate for
     * @param string $moduleName The module being toggled
     * @param bool $isEnabling Whether the module is being enabled (true) or disabled (false)
     * @return array Impact data including price, prorated amount, days, etc.
     */
    public function calculateModuleToggleImpact(Account $account, string $moduleName, bool $isEnabling): array
    {
        $price = ModulePricingSetting::getModulePrice($moduleName);

        // Get current date info
        $today = Carbon::today();
        $dayOfMonth = $today->day;
        $daysInMonth = $today->daysInMonth;

        // Calculate days used
        if ($isEnabling) {
            // When enabling: FIRST MONTH FREE - no prorated charge
            $daysUsed = $daysInMonth - $dayOfMonth + 1; // Track days but don't charge
            $proratedAmount = 0; // First month is FREE
        } else {
            // When disabling: refund for remaining days, charge only for days used
            $daysUsed = $dayOfMonth - 1;
            // Calculate pro-rated amount for refund
            $proratedAmount = ($price / $daysInMonth) * $daysUsed;
        }

        // Calculate new monthly total
        $currentMonthlyTotal = (float) $account->monthly_payment_amount;
        $newMonthlyTotal = $isEnabling
            ? $currentMonthlyTotal + $price
            : $currentMonthlyTotal - $price;

        return [
            'module_name' => $moduleName,
            'action' => $isEnabling ? 'enabled' : 'disabled',
            'price' => $price,
            'is_paid_module' => $price > 0,
            'effective_date' => $today->toDateString(),
            'day_of_month' => $dayOfMonth,
            'days_in_month' => $daysInMonth,
            'days_used' => $daysUsed,
            'prorated_amount' => round($proratedAmount, 2),
            'current_monthly_total' => $currentMonthlyTotal,
            'new_monthly_total' => round($newMonthlyTotal, 2),
            'monthly_change' => $isEnabling ? $price : -$price,
        ];
    }

    /**
     * Apply module toggle with billing changes
     *
     * @param Account $account The account to update
     * @param string $moduleName The module being toggled
     * @param bool $isEnabling Whether to enable or disable
     * @param int $userId The user making the change
     * @return bool Success status
     * @throws \Exception
     */
    public function applyModuleToggle(Account $account, string $moduleName, bool $isEnabling, int $userId): bool
    {
        return DB::transaction(function () use ($account, $moduleName, $isEnabling, $userId) {
            // Calculate impact
            $impact = $this->calculateModuleToggleImpact($account, $moduleName, $isEnabling);

            // Only process billing if it's a paid module
            if ($impact['is_paid_module']) {
                // Update account monthly payment amount
                $account->monthly_payment_amount = $impact['new_monthly_total'];

                // Auto-set payment_start_date if null and enabling a paid module
                if ($isEnabling && !$account->payment_start_date) {
                    $account->payment_start_date = Carbon::today();
                }

                $account->save();

                // Create usage history record
                ModuleUsageHistory::create([
                    'account_id' => $account->id,
                    'module_name' => $moduleName,
                    'action' => $impact['action'],
                    'price_at_time' => $impact['price'],
                    'effective_date' => $impact['effective_date'],
                    'days_in_month' => $impact['days_in_month'],
                    'days_used' => $impact['days_used'],
                    'prorated_amount' => $impact['prorated_amount'],
                    'previous_monthly_total' => $impact['current_monthly_total'],
                    'new_monthly_total' => $impact['new_monthly_total'],
                    'changed_by' => $userId,
                ]);
            }

            return true;
        });
    }

    /**
     * Get billing breakdown for an account
     * Shows all enabled modules and their costs
     *
     * @param Account $account The account to get breakdown for
     * @return array Breakdown data
     */
    public function getAccountBillingBreakdown(Account $account): array
    {
        // Map module names to database columns
        $moduleFields = [
            'services' => 'services_module_enabled',
            'rent' => 'rent_module_enabled',
            'loyalty' => 'loyalty_module_enabled',
            'shop' => 'shop_enabled',
            'discounts' => 'discounts_module_enabled',
            'gift_cards' => 'gift_cards_module_enabled',
            'expeditor' => 'expeditor_module_enabled',
            'wolt' => 'wolt_enabled',
            'yango' => 'yango_enabled',
            'bolt' => 'bolt_enabled',
            'attendance' => 'attendance_module_enabled',
        ];

        // Get all module prices
        $modulePrices = ModulePricingSetting::getAllActivePrices();

        $enabledModules = [];
        $totalMonthlyAmount = 0;

        foreach ($moduleFields as $moduleName => $fieldName) {
            if ($account->$fieldName) {
                $price = $modulePrices[$moduleName] ?? 0;
                if ($price > 0) {
                    $enabledModules[] = [
                        'module_name' => $moduleName,
                        'monthly_price' => $price,
                    ];
                    $totalMonthlyAmount += $price;
                }
            }
        }

        return [
            'enabled_modules' => $enabledModules,
            'total_monthly_amount' => round($totalMonthlyAmount, 2),
            'account_monthly_payment_amount' => (float) $account->monthly_payment_amount,
            'payment_start_date' => $account->payment_start_date?->toDateString(),
            'has_payment_configured' => $account->payment_start_date !== null,
        ];
    }

    /**
     * Get module usage history for an account
     *
     * @param int $accountId The account ID
     * @param string|null $moduleName Optional filter by module name
     * @return Collection Module usage history records
     */
    public function getAccountModuleHistory(int $accountId, ?string $moduleName = null): Collection
    {
        $query = ModuleUsageHistory::where('account_id', $accountId)
            ->with('changedBy:id,name')
            ->orderBy('effective_date', 'desc')
            ->orderBy('created_at', 'desc');

        if ($moduleName) {
            $query->where('module_name', $moduleName);
        }

        return $query->get();
    }
}
