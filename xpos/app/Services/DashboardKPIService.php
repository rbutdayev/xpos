<?php

namespace App\Services;

use App\Models\Sale;
use App\Models\Customer;
use App\Models\Product;
use App\Models\ServiceRecord;
use App\Models\DailySummary;
use App\Models\ProductStock;
use App\Models\MinMaxAlert;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardKPIService
{
    protected $accountId;
    protected $branchId;

    public function __construct(int $accountId, ?int $branchId = null)
    {
        $this->accountId = $accountId;
        $this->branchId = $branchId;
    }

    public function getAllKPIs(): array
    {
        return [
            'sales_kpis' => $this->getSalesKPIs(),
            'customer_kpis' => $this->getCustomerKPIs(),
            'inventory_kpis' => $this->getInventoryKPIs(),
            'service_kpis' => $this->getServiceKPIs(),
            'financial_kpis' => $this->getFinancialKPIs(),
        ];
    }

    public function getSalesKPIs(): array
    {
        $today = Carbon::today();
        $yesterday = Carbon::yesterday();
        $thisWeek = [Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()];
        $lastWeek = [Carbon::now()->subWeek()->startOfWeek(), Carbon::now()->subWeek()->endOfWeek()];
        $thisMonth = [Carbon::now()->startOfMonth(), Carbon::now()->endOfMonth()];
        $lastMonth = [Carbon::now()->subMonth()->startOfMonth(), Carbon::now()->subMonth()->endOfMonth()];

        $query = Sale::where('account_id', $this->accountId)
            ->where('status', 'completed');

        if ($this->branchId) {
            $query->where('branch_id', $this->branchId);
        }

        // Today's sales
        $todaySales = (clone $query)->whereDate('sale_date', $today)
            ->selectRaw('COUNT(*) as count, SUM(total) as total, AVG(total) as average')
            ->first();

        // Yesterday's sales for comparison
        $yesterdaySales = (clone $query)->whereDate('sale_date', $yesterday)
            ->selectRaw('COUNT(*) as count, SUM(total) as total')
            ->first();

        // This week vs last week
        $thisWeekSales = (clone $query)->whereBetween('sale_date', $thisWeek)
            ->selectRaw('COUNT(*) as count, SUM(total) as total')
            ->first();

        $lastWeekSales = (clone $query)->whereBetween('sale_date', $lastWeek)
            ->selectRaw('COUNT(*) as count, SUM(total) as total')
            ->first();

        // This month vs last month
        $thisMonthSales = (clone $query)->whereBetween('sale_date', $thisMonth)
            ->selectRaw('COUNT(*) as count, SUM(total) as total')
            ->first();

        $lastMonthSales = (clone $query)->whereBetween('sale_date', $lastMonth)
            ->selectRaw('COUNT(*) as count, SUM(total) as total')
            ->first();

        return [
            'today' => [
                'count' => $todaySales->count ?? 0,
                'total' => $todaySales->total ?? 0,
                'average' => $todaySales->average ?? 0,
                'change_from_yesterday' => $this->calculatePercentageChange(
                    $yesterdaySales->total ?? 0,
                    $todaySales->total ?? 0
                ),
            ],
            'this_week' => [
                'count' => $thisWeekSales->count ?? 0,
                'total' => $thisWeekSales->total ?? 0,
                'change_from_last_week' => $this->calculatePercentageChange(
                    $lastWeekSales->total ?? 0,
                    $thisWeekSales->total ?? 0
                ),
            ],
            'this_month' => [
                'count' => $thisMonthSales->count ?? 0,
                'total' => $thisMonthSales->total ?? 0,
                'change_from_last_month' => $this->calculatePercentageChange(
                    $lastMonthSales->total ?? 0,
                    $thisMonthSales->total ?? 0
                ),
            ],
        ];
    }

    public function getCustomerKPIs(): array
    {
        $query = Customer::where('account_id', $this->accountId);

        $totalCustomers = $query->count();
        $activeCustomers = (clone $query)->where('is_active', true)->count();
        
        // Customers with recent sales (last 30 days)
        $recentCustomers = (clone $query)
            ->whereHas('sales', function ($q) {
                $q->where('sale_date', '>=', Carbon::now()->subDays(30));
            })
            ->count();

        // New customers this month
        $newThisMonth = (clone $query)
            ->whereBetween('created_at', [
                Carbon::now()->startOfMonth(),
                Carbon::now()->endOfMonth()
            ])
            ->count();

        // Customer retention rate (customers who made purchases in last 3 months)
        $retentionRate = $totalCustomers > 0 ? 
            ((clone $query)
                ->whereHas('sales', function ($q) {
                    $q->where('sale_date', '>=', Carbon::now()->subMonths(3));
                })
                ->count() / $totalCustomers) * 100 : 0;

        return [
            'total_customers' => $totalCustomers,
            'active_customers' => $activeCustomers,
            'recent_customers' => $recentCustomers,
            'new_this_month' => $newThisMonth,
            'retention_rate' => round($retentionRate, 2),
        ];
    }

    public function getInventoryKPIs(): array
    {
        $query = Product::where('account_id', $this->accountId);

        $totalProducts = $query->count();
        $activeProducts = (clone $query)->where('is_active', true)->count();

        // Stock levels
        $stockQuery = ProductStock::where('account_id', $this->accountId);

        $lowStockItems = (clone $stockQuery)
            ->whereRaw('quantity <= min_level')
            ->count();

        $outOfStockItems = (clone $stockQuery)
            ->where('quantity', '<=', 0)
            ->count();

        $negativeStockItems = (clone $stockQuery)
            ->where('quantity', '<', 0)
            ->count();

        // Total inventory value with unit-aware calculation
        // Uses purchase_price from products table correctly
        $inventoryValue = DB::table('product_stock')
            ->join('products', 'product_stock.product_id', '=', 'products.id')
            ->where('products.account_id', $this->accountId)
            ->where('product_stock.account_id', $this->accountId)
            ->where('products.type', 'product') // Only physical products
            ->selectRaw('SUM(product_stock.quantity * products.purchase_price) as total_value')
            ->value('total_value') ?? 0;

        // Total inventory value at sale price
        $inventoryValueSale = DB::table('product_stock')
            ->join('products', 'product_stock.product_id', '=', 'products.id')
            ->where('products.account_id', $this->accountId)
            ->where('product_stock.account_id', $this->accountId)
            ->where('products.type', 'product')
            ->selectRaw('SUM(product_stock.quantity * products.sale_price) as total_value')
            ->value('total_value') ?? 0;

        // Total stock quantity with unit breakdown
        $stockByUnit = DB::table('product_stock')
            ->join('products', 'product_stock.product_id', '=', 'products.id')
            ->where('products.account_id', $this->accountId)
            ->where('product_stock.account_id', $this->accountId)
            ->where('products.type', 'product')
            ->selectRaw('
                products.base_unit,
                products.unit,
                SUM(product_stock.quantity) as total_quantity,
                COUNT(DISTINCT products.id) as products_count
            ')
            ->groupBy('products.base_unit', 'products.unit')
            ->get();

        // Active alerts
        $activeAlerts = MinMaxAlert::where('account_id', $this->accountId)
            ->where('status', 'aktiv')
            ->count();

        // Potential profit (difference between sale and purchase value)
        $potentialProfit = $inventoryValueSale - $inventoryValue;

        return [
            'total_products' => $totalProducts,
            'active_products' => $activeProducts,
            'low_stock_items' => $lowStockItems,
            'out_of_stock_items' => $outOfStockItems,
            'negative_stock_items' => $negativeStockItems,
            'inventory_value_cost' => round($inventoryValue, 2),
            'inventory_value_sale' => round($inventoryValueSale, 2),
            'potential_profit' => round($potentialProfit, 2),
            'profit_margin_percentage' => $inventoryValue > 0 ? round(($potentialProfit / $inventoryValue) * 100, 1) : 0,
            'active_alerts' => $activeAlerts,
            'stock_by_unit' => $stockByUnit,
        ];
    }

    public function getServiceKPIs(): array
    {
        $query = ServiceRecord::where('account_id', $this->accountId);

        $today = Carbon::today();
        $thisWeek = [Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()];
        $thisMonth = [Carbon::now()->startOfMonth(), Carbon::now()->endOfMonth()];

        // Today's services
        $todayServices = (clone $query)->whereDate('service_date', $today)
            ->selectRaw('
                COUNT(*) as count,
                SUM(total_cost) as revenue,
                AVG(total_cost) as average_value
            ')
            ->first();

        // This week's services
        $weekServices = (clone $query)->whereBetween('service_date', $thisWeek)
            ->selectRaw('COUNT(*) as count, SUM(total_cost) as revenue')
            ->first();

        // This month's services
        $monthServices = (clone $query)->whereBetween('service_date', $thisMonth)
            ->selectRaw('COUNT(*) as count, SUM(total_cost) as revenue')
            ->first();

        // Services by status
        $servicesByStatus = (clone $query)
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        // Average completion time (completed services in last 30 days)
        $avgCompletionTime = (clone $query)
            ->where('status', 'completed')
            ->where('service_date', '>=', Carbon::now()->subDays(30))
            ->selectRaw('AVG(DATEDIFF(updated_at, created_at)) as avg_days')
            ->first()->avg_days ?? 0;

        return [
            'today' => [
                'count' => $todayServices->count ?? 0,
                'revenue' => $todayServices->revenue ?? 0,
                'average_value' => $todayServices->average_value ?? 0,
            ],
            'this_week' => [
                'count' => $weekServices->count ?? 0,
                'revenue' => $weekServices->revenue ?? 0,
            ],
            'this_month' => [
                'count' => $monthServices->count ?? 0,
                'revenue' => $monthServices->revenue ?? 0,
            ],
            'by_status' => $servicesByStatus,
            'average_completion_days' => round($avgCompletionTime, 1),
        ];
    }

    public function getFinancialKPIs(): array
    {
        $thisMonth = [Carbon::now()->startOfMonth(), Carbon::now()->endOfMonth()];
        $lastMonth = [Carbon::now()->subMonth()->startOfMonth(), Carbon::now()->subMonth()->endOfMonth()];

        // Revenue from sales
        $salesQuery = Sale::where('account_id', $this->accountId)->where('status', 'completed');
        
        if ($this->branchId) {
            $salesQuery->where('branch_id', $this->branchId);
        }

        $thisMonthSalesRevenue = (clone $salesQuery)
            ->whereBetween('sale_date', $thisMonth)
            ->sum('total');

        $lastMonthSalesRevenue = (clone $salesQuery)
            ->whereBetween('sale_date', $lastMonth)
            ->sum('total');

        // Revenue from services
        $serviceQuery = ServiceRecord::where('account_id', $this->accountId)->where('status', 'completed');

        $thisMonthServiceRevenue = (clone $serviceQuery)
            ->whereBetween('service_date', $thisMonth)
            ->sum('total_cost');

        $lastMonthServiceRevenue = (clone $serviceQuery)
            ->whereBetween('service_date', $lastMonth)
            ->sum('total_cost');

        $totalThisMonth = $thisMonthSalesRevenue + $thisMonthServiceRevenue;
        $totalLastMonth = $lastMonthSalesRevenue + $lastMonthServiceRevenue;

        // Payment methods breakdown (this month)
        $paymentBreakdown = Sale::where('account_id', $this->accountId)
            ->where('status', 'completed')
            ->whereBetween('sale_date', $thisMonth)
            ->with('payments')
            ->get()
            ->flatMap(fn($sale) => $sale->payments)
            ->groupBy('method')
            ->map(fn($payments) => $payments->sum('amount'))
            ->toArray();

        return [
            'this_month' => [
                'sales_revenue' => $thisMonthSalesRevenue,
                'service_revenue' => $thisMonthServiceRevenue,
                'total_revenue' => $totalThisMonth,
            ],
            'last_month' => [
                'total_revenue' => $totalLastMonth,
            ],
            'revenue_change' => $this->calculatePercentageChange($totalLastMonth, $totalThisMonth),
            'payment_breakdown' => $paymentBreakdown,
        ];
    }

    public function getTopProducts(int $limit = 10): array
    {
        $thisMonth = [Carbon::now()->startOfMonth(), Carbon::now()->endOfMonth()];

        return DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.sale_id')
            ->join('products', 'sale_items.product_id', '=', 'products.product_id')
            ->where('sales.account_id', $this->accountId)
            ->where('sales.status', 'completed')
            ->whereBetween('sales.sale_date', $thisMonth)
            ->when($this->branchId, function ($query) {
                return $query->where('sales.branch_id', $this->branchId);
            })
            ->selectRaw('
                products.name,
                products.sku,
                SUM(sale_items.quantity) as total_quantity,
                SUM(sale_items.total) as total_revenue,
                COUNT(DISTINCT sales.sale_id) as sales_count
            ')
            ->groupBy('products.product_id', 'products.name', 'products.sku')
            ->orderByDesc('total_quantity')
            ->limit($limit)
            ->get()
            ->toArray();
    }

    public function getSalesChart(string $period = 'week'): array
    {
        $query = Sale::where('account_id', $this->accountId)->where('status', 'completed');
        
        if ($this->branchId) {
            $query->where('branch_id', $this->branchId);
        }

        switch ($period) {
            case 'week':
                $startDate = Carbon::now()->startOfWeek();
                $endDate = Carbon::now()->endOfWeek();
                $groupBy = 'DATE(sale_date)';
                break;
            case 'month':
                $startDate = Carbon::now()->startOfMonth();
                $endDate = Carbon::now()->endOfMonth();
                $groupBy = 'DATE(sale_date)';
                break;
            case 'year':
                $startDate = Carbon::now()->startOfYear();
                $endDate = Carbon::now()->endOfYear();
                $groupBy = 'MONTH(sale_date)';
                break;
            default:
                $startDate = Carbon::now()->subDays(7);
                $endDate = Carbon::now();
                $groupBy = 'DATE(sale_date)';
        }

        return $query->whereBetween('sale_date', [$startDate, $endDate])
            ->selectRaw("
                {$groupBy} as period,
                COUNT(*) as sales_count,
                SUM(total) as total_revenue
            ")
            ->groupBy('period')
            ->orderBy('period')
            ->get()
            ->toArray();
    }

    private function calculatePercentageChange($oldValue, $newValue): float
    {
        if ($oldValue == 0) {
            return $newValue > 0 ? 100 : 0;
        }

        return round((($newValue - $oldValue) / $oldValue) * 100, 2);
    }
}