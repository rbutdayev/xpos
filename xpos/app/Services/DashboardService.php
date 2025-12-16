<?php

namespace App\Services;

use App\Models\Account;
use App\Models\User;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SaleReturn;
use App\Models\Expense;
use App\Models\CustomerCredit;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

/**
 * Dashboard Service
 *
 * Centralized service for calculating all dashboard KPIs and metrics.
 * Implements caching and follows the DASHBOARD_SPECIFICATION.md guidelines.
 */
class DashboardService
{
    /**
     * Cache duration in seconds (15 minutes)
     */
    private const CACHE_TTL = 900;

    /**
     * Get financial KPIs for the current month
     */
    public function getFinancialMetrics(Account $account): array
    {
        $cacheKey = "dashboard:financial:{$account->id}:" . Carbon::now()->format('Y-m-d-H');

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($account) {
            $currentMonth = Carbon::now();
            $previousMonth = Carbon::now()->subMonth();

            // Current month revenue
            $monthlyRevenue = $this->calculateRevenue($account, $currentMonth);
            $prevMonthRevenue = $this->calculateRevenue($account, $previousMonth);

            // Current month expenses
            $monthlyExpenses = $this->calculateExpenses($account, $currentMonth);
            $prevMonthExpenses = $this->calculateExpenses($account, $previousMonth);

            // Calculate growth
            $revenueGrowth = $prevMonthRevenue > 0
                ? (($monthlyRevenue - $prevMonthRevenue) / $prevMonthRevenue) * 100
                : 0;

            $expenseGrowth = $prevMonthExpenses > 0
                ? (($monthlyExpenses - $prevMonthExpenses) / $prevMonthExpenses) * 100
                : 0;

            $profit = $monthlyRevenue - $monthlyExpenses;
            $prevProfit = $prevMonthRevenue - $prevMonthExpenses;

            $profitGrowth = $prevProfit > 0
                ? (($profit - $prevProfit) / $prevProfit) * 100
                : 0;

            $profitMargin = $monthlyRevenue > 0
                ? ($profit / $monthlyRevenue) * 100
                : 0;

            // Pending payments (customer credit) - Alacaq
            $pendingPayments = CustomerCredit::where('account_id', $account->id)
                ->where('remaining_amount', '>', 0)
                ->sum('remaining_amount') ?? 0;

            $pendingPaymentsCount = CustomerCredit::where('account_id', $account->id)
                ->where('remaining_amount', '>', 0)
                ->distinct()
                ->count('customer_id');

            // Supplier debts (supplier credit) - Borclar
            $supplierDebts = \App\Models\SupplierCredit::where('account_id', $account->id)
                ->where('remaining_amount', '>', 0)
                ->sum('remaining_amount') ?? 0;

            $supplierDebtsCount = \App\Models\SupplierCredit::where('account_id', $account->id)
                ->where('remaining_amount', '>', 0)
                ->distinct()
                ->count('supplier_id');

            return [
                'revenue' => [
                    'value' => round($monthlyRevenue, 2),
                    'growth' => round($revenueGrowth, 1),
                ],
                'expenses' => [
                    'value' => round($monthlyExpenses, 2),
                    'growth' => round($expenseGrowth, 1),
                ],
                'profit' => [
                    'value' => round($profit, 2),
                    'growth' => round($profitGrowth, 1),
                    'margin' => round($profitMargin, 1),
                ],
                'pending_payments' => [
                    'value' => round($pendingPayments, 2),
                    'count' => $pendingPaymentsCount,
                ],
                'supplier_debts' => [
                    'value' => round($supplierDebts, 2),
                    'count' => $supplierDebtsCount,
                ],
            ];
        });
    }

    /**
     * Calculate revenue for a given month
     */
    private function calculateRevenue(Account $account, Carbon $month): float
    {
        // Sales revenue
        $salesRevenue = Sale::where('account_id', $account->id)
            ->countable()
            ->whereYear('sale_date', $month->year)
            ->whereMonth('sale_date', $month->month)
            ->sum('total') ?? 0;

        // Subtract returns
        $returns = SaleReturn::where('account_id', $account->id)
            ->where('status', 'completed')
            ->whereYear('return_date', $month->year)
            ->whereMonth('return_date', $month->month)
            ->sum('total') ?? 0;

        $revenue = $salesRevenue - $returns;

        // Add rental revenue (if module enabled)
        if ($account->isRentModuleEnabled()) {
            $rentalRevenue = \App\Models\Rental::where('account_id', $account->id)
                ->whereYear('rental_start_date', $month->year)
                ->whereMonth('rental_start_date', $month->month)
                ->sum('rental_price') ?? 0;
            $revenue += $rentalRevenue;
        }

        // Add service revenue (if module enabled)
        if ($account->isServicesModuleEnabled()) {
            $serviceRevenue = \App\Models\TailorService::where('account_id', $account->id)
                ->where('status', 'completed')
                ->whereYear('updated_at', $month->year)
                ->whereMonth('updated_at', $month->month)
                ->sum('total_cost') ?? 0;
            $revenue += $serviceRevenue;
        }

        return $revenue;
    }

    /**
     * Calculate expenses for a given month
     * Note: Supplier payments are now part of the Expense model
     */
    private function calculateExpenses(Account $account, Carbon $month): float
    {
        return Expense::where('account_id', $account->id)
            ->whereYear('expense_date', $month->year)
            ->whereMonth('expense_date', $month->month)
            ->sum('amount') ?? 0;
    }

    /**
     * Get operational metrics
     */
    public function getOperationalMetrics(Account $account, ?int $warehouseId = null): array
    {
        $cacheKey = "dashboard:operational:{$account->id}:" . ($warehouseId ?? 'all') . ':' . Carbon::now()->format('Y-m-d-H');

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($account, $warehouseId) {
            // Active customers (purchased in last 90 days)
            $activeCustomers = Sale::where('account_id', $account->id)
                ->where('sale_date', '>=', Carbon::now()->subDays(90))
                ->whereNotNull('customer_id')
                ->distinct()
                ->count('customer_id');

            // New customers this month
            $newCustomers = $account->customers()
                ->whereYear('created_at', Carbon::now()->year)
                ->whereMonth('created_at', Carbon::now()->month)
                ->count();

            // Products in stock
            $productsInStock = DB::table('product_stock')
                ->join('products', 'product_stock.product_id', '=', 'products.id')
                ->where('products.account_id', $account->id)
                ->when($warehouseId, fn($q) => $q->where('product_stock.warehouse_id', $warehouseId))
                ->where('product_stock.quantity', '>', 0)
                ->distinct()
                ->count('product_stock.product_id');

            // Total products count
            $productsCount = $account->products()->count();

            // Stock value (cost basis)
            $stockValueCost = DB::table('product_stock')
                ->join('products', 'product_stock.product_id', '=', 'products.id')
                ->where('products.account_id', $account->id)
                ->when($warehouseId, fn($q) => $q->where('product_stock.warehouse_id', $warehouseId))
                ->sum(DB::raw('product_stock.quantity * products.purchase_price')) ?? 0;

            // Stock value (sale basis)
            $stockValueSale = DB::table('product_stock')
                ->join('products', 'product_stock.product_id', '=', 'products.id')
                ->where('products.account_id', $account->id)
                ->when($warehouseId, fn($q) => $q->where('product_stock.warehouse_id', $warehouseId))
                ->sum(DB::raw('product_stock.quantity * products.sale_price')) ?? 0;

            // Stock turnover ratio (simplified calculation)
            $cogs = SaleItem::whereHas('sale', function ($q) use ($account) {
                $q->where('account_id', $account->id)
                    ->where('sale_date', '>=', Carbon::now()->subMonth());
            })->sum(DB::raw('quantity * purchase_price')) ?? 0;

            $avgInventory = $stockValueCost > 0 ? $stockValueCost : 1;
            $turnoverRatio = ($cogs / $avgInventory) * 12; // Annualized

            return [
                'active_customers' => $activeCustomers,
                'new_customers' => $newCustomers,
                'products_in_stock' => $productsInStock,
                'products_count' => $productsCount,
                'stock_value' => [
                    'cost' => round($stockValueCost, 2),
                    'sale' => round($stockValueSale, 2),
                    'potential_profit' => round($stockValueSale - $stockValueCost, 2),
                ],
                'stock_turnover' => round($turnoverRatio, 1),
            ];
        });
    }

    /**
     * Get operational metrics for warehouse managers (without pricing)
     */
    public function getOperationalMetricsForWarehouse(Account $account, ?int $warehouseId = null): array
    {
        $cacheKey = "dashboard:operational_warehouse:{$account->id}:" . ($warehouseId ?? 'all') . ':' . Carbon::now()->format('Y-m-d-H');

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($account, $warehouseId) {
            // Products in stock
            $productsInStock = DB::table('product_stock')
                ->join('products', 'product_stock.product_id', '=', 'products.id')
                ->where('products.account_id', $account->id)
                ->when($warehouseId, fn($q) => $q->where('product_stock.warehouse_id', $warehouseId))
                ->where('product_stock.quantity', '>', 0)
                ->distinct()
                ->count('product_stock.product_id');

            // Total products count
            $productsCount = $account->products()->count();

            // Total quantity in stock (all units)
            $totalQuantity = DB::table('product_stock')
                ->join('products', 'product_stock.product_id', '=', 'products.id')
                ->where('products.account_id', $account->id)
                ->when($warehouseId, fn($q) => $q->where('product_stock.warehouse_id', $warehouseId))
                ->sum('product_stock.quantity') ?? 0;

            return [
                'products_in_stock' => $productsInStock,
                'products_count' => $productsCount,
                'total_quantity' => round($totalQuantity, 2),
                // Pricing information hidden for warehouse managers
                'stock_value' => null,
                'stock_turnover' => null,
            ];
        });
    }

    /**
     * Get inventory alerts
     */
    public function getInventoryAlerts(Account $account, ?int $warehouseId = null): array
    {
        $cacheKey = "dashboard:inventory_alerts:{$account->id}:" . ($warehouseId ?? 'all') . ':' . Carbon::now()->format('Y-m-d-H');

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($account, $warehouseId) {
            $baseQuery = DB::table('product_stock')
                ->join('products', 'product_stock.product_id', '=', 'products.id')
                ->where('products.account_id', $account->id)
                ->when($warehouseId, fn($q) => $q->where('product_stock.warehouse_id', $warehouseId));

            return [
                'low_stock' => (clone $baseQuery)
                    ->whereColumn('product_stock.quantity', '<=', 'product_stock.min_level')
                    ->where('product_stock.min_level', '>', 0)
                    ->where('product_stock.quantity', '>', 0)
                    ->count(),
                'out_of_stock' => (clone $baseQuery)
                    ->where('product_stock.quantity', '=', 0)
                    ->count(),
                'negative_stock' => (clone $baseQuery)
                    ->where('product_stock.quantity', '<', 0)
                    ->count(),
                'pending_goods_receipts' => \App\Models\GoodsReceipt::where('account_id', $account->id)
                    ->where('payment_status', 'pending')
                    ->count(),
            ];
        });
    }

    /**
     * Get service metrics (only if module enabled)
     */
    public function getServiceMetrics(Account $account, ?int $userId = null): array
    {
        if (!$account->isServicesModuleEnabled()) {
            return [];
        }

        $cacheKey = "dashboard:services:{$account->id}:" . ($userId ?? 'all') . ':' . Carbon::now()->format('Y-m-d-H');

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($account, $userId) {
            $baseQuery = \App\Models\TailorService::where('account_id', $account->id)
                ->when($userId, fn($q) => $q->where('employee_id', $userId));

            $currentMonth = Carbon::now();
            $previousMonth = Carbon::now()->subMonth();

            $completedThisMonth = (clone $baseQuery)
                ->where('status', 'completed')
                ->whereYear('updated_at', $currentMonth->year)
                ->whereMonth('updated_at', $currentMonth->month)
                ->count();

            $completedLastMonth = (clone $baseQuery)
                ->where('status', 'completed')
                ->whereYear('updated_at', $previousMonth->year)
                ->whereMonth('updated_at', $previousMonth->month)
                ->count();

            $completedGrowth = $completedLastMonth > 0
                ? (($completedThisMonth - $completedLastMonth) / $completedLastMonth) * 100
                : 0;

            $revenue = (clone $baseQuery)
                ->where('status', 'completed')
                ->whereYear('updated_at', $currentMonth->year)
                ->whereMonth('updated_at', $currentMonth->month)
                ->sum('total_cost') ?? 0;

            $prevRevenue = (clone $baseQuery)
                ->where('status', 'completed')
                ->whereYear('updated_at', $previousMonth->year)
                ->whereMonth('updated_at', $previousMonth->month)
                ->sum('total_cost') ?? 0;

            $revenueGrowth = $prevRevenue > 0
                ? (($revenue - $prevRevenue) / $prevRevenue) * 100
                : 0;

            return [
                'pending' => (clone $baseQuery)->where('status', 'pending')->count(),
                'in_progress' => (clone $baseQuery)->where('status', 'in_progress')->count(),
                'completed_this_month' => $completedThisMonth,
                'completed_growth' => round($completedGrowth, 1),
                'revenue' => round($revenue, 2),
                'revenue_growth' => round($revenueGrowth, 1),
            ];
        });
    }

    /**
     * Get rental metrics (only if module enabled)
     */
    public function getRentalMetrics(Account $account, ?int $userId = null): array
    {
        if (!$account->isRentModuleEnabled()) {
            return [];
        }

        $cacheKey = "dashboard:rentals:{$account->id}:" . ($userId ?? 'all') . ':' . Carbon::now()->format('Y-m-d-H');

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($account, $userId) {
            $baseQuery = \App\Models\Rental::where('account_id', $account->id)
                ->when($userId, fn($q) => $q->where('user_id', $userId));

            $currentMonth = Carbon::now();

            return [
                'active' => (clone $baseQuery)->where('status', 'active')->count(),
                'monthly_revenue' => (clone $baseQuery)
                    ->whereYear('rental_start_date', $currentMonth->year)
                    ->whereMonth('rental_start_date', $currentMonth->month)
                    ->sum('rental_price') ?? 0,
                'pending_returns' => (clone $baseQuery)
                    ->whereIn('status', ['reserved', 'active'])
                    ->whereBetween('rental_end_date', [today(), today()->addDays(3)])
                    ->count(),
                'overdue' => (clone $baseQuery)->where('status', 'overdue')->count(),
            ];
        });
    }

    /**
     * Get credit statistics
     */
    public function getCreditStatistics(Account $account): array
    {
        $cacheKey = "dashboard:credits:{$account->id}:" . Carbon::now()->format('Y-m-d-H');

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($account) {
            $currentMonth = Carbon::now();

            return [
                'total_outstanding' => CustomerCredit::where('account_id', $account->id)
                    ->where('remaining_amount', '>', 0)
                    ->sum('remaining_amount') ?? 0,
                'credits_given_this_month' => CustomerCredit::where('account_id', $account->id)
                    ->whereYear('credit_date', $currentMonth->year)
                    ->whereMonth('credit_date', $currentMonth->month)
                    ->sum('amount') ?? 0,
                'payments_received_this_month' => CustomerCredit::where('account_id', $account->id)
                    ->whereYear('updated_at', $currentMonth->year)
                    ->whereMonth('updated_at', $currentMonth->month)
                    ->sum(DB::raw('amount - remaining_amount')) ?? 0,
                'active_credit_customers' => CustomerCredit::where('account_id', $account->id)
                    ->where('remaining_amount', '>', 0)
                    ->distinct()
                    ->count('customer_id'),
            ];
        });
    }

    /**
     * Clear cache for an account
     * Uses Redis pattern matching to delete all cached dashboard data
     */
    public function clearCache(Account $account): void
    {
        // Use Redis pattern matching to find and delete all cache keys for this account
        $patterns = [
            "dashboard:financial:{$account->id}:*",
            "dashboard:operational:{$account->id}:*",
            "dashboard:operational_warehouse:{$account->id}:*",
            "dashboard:inventory_alerts:{$account->id}:*",
            "dashboard:services:{$account->id}:*",
            "dashboard:rentals:{$account->id}:*",
            "dashboard:credits:{$account->id}:*",
        ];

        try {
            // Get the Redis connection
            $redis = Cache::getStore()->getRedis();

            foreach ($patterns as $pattern) {
                // Add Laravel's cache prefix to the pattern
                $prefixedPattern = config('cache.prefix') . ':' . $pattern;

                // Find all keys matching the pattern
                $keys = $redis->keys($prefixedPattern);

                // Delete each key
                if (!empty($keys)) {
                    foreach ($keys as $key) {
                        // Remove the Laravel cache prefix before forgetting
                        $keyWithoutPrefix = str_replace(config('cache.prefix') . ':', '', $key);
                        Cache::forget($keyWithoutPrefix);
                    }
                }
            }
        } catch (\Exception $e) {
            // If Redis pattern matching fails, fall back to clearing specific keys
            \Log::warning('Dashboard cache clearing with pattern failed, using fallback method: ' . $e->getMessage());

            // Generate keys for the last 24 hours + next hour as fallback
            $now = Carbon::now();
            $hours = [];
            for ($i = -24; $i <= 1; $i++) {
                $hours[] = $now->copy()->addHours($i)->format('Y-m-d-H');
            }

            // Clear specific keys without warehouse variations
            $simplePrefixes = [
                "dashboard:financial:{$account->id}:",
                "dashboard:inventory_alerts:{$account->id}:",
                "dashboard:credits:{$account->id}:",
            ];

            foreach ($simplePrefixes as $prefix) {
                foreach ($hours as $hour) {
                    Cache::forget($prefix . $hour);
                }
            }
        }
    }
}
