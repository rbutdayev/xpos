<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Services\DashboardService;
use App\Models\Account;
use App\Models\User;
use App\Models\Sale;
use App\Models\SaleItem;
use Carbon\Carbon;

class DashboardController extends Controller
{
    private DashboardService $dashboardService;

    public function __construct(DashboardService $dashboardService)
    {
        $this->middleware(['auth', 'account.access']);
        $this->dashboardService = $dashboardService;
    }

    /**
     * Main dashboard entry point
     * Routes to role-specific dashboard based on user role
     */
    public function index(Request $request)
    {
        Gate::authorize('access-dashboard');

        $user = Auth::user();

        // Redirect super admins to their panel
        if ($user->role === 'super_admin') {
            return redirect()->route('superadmin.dashboard');
        }

        $account = $user->account;

        // Check if user needs to complete company setup
        if (!$account->companies()->exists()) {
            return redirect()->route('setup.wizard');
        }

        // Validate warehouse access for sales_staff
        $selectedWarehouseId = $request->session()->get('selected_warehouse_id');
        if ($user->role === 'sales_staff' && $user->branch_id && $selectedWarehouseId) {
            $hasAccess = \App\Models\WarehouseBranchAccess::where('warehouse_id', $selectedWarehouseId)
                ->where('branch_id', $user->branch_id)
                ->where('can_view_stock', true)
                ->exists();

            if (!$hasAccess) {
                $request->session()->forget('selected_warehouse_id');
                return redirect()->route('dashboard');
            }
        }

        // Route to role-specific dashboard data
        $data = match($user->role) {
            'account_owner', 'admin' => $this->getFullDashboard($account, $user, $request),
            'accountant' => $this->getFinancialDashboard($account, $user, $request),
            'warehouse_manager' => $this->getInventoryDashboard($account, $user, $request),
            'sales_staff' => $this->getSalesDashboard($account, $user, $request),
            'tailor' => $this->getServiceDashboard($account, $user, $request),
            'branch_manager' => $this->getBranchDashboard($account, $user, $request),
            'cashier' => $this->getCashierDashboard($account, $user, $request),
            default => abort(403, 'Unauthorized role')
        };

        // Use DashboardNew (Cuba-style) for account owners/admins
        $viewName = in_array($user->role, ['account_owner', 'admin']) ? 'DashboardNew' : 'Dashboard';

        return Inertia::render($viewName, $data);
    }

    /**
     * Account Owner / Admin Dashboard - Full access
     */
    private function getFullDashboard(Account $account, User $user, Request $request): array
    {
        $selectedWarehouseId = $request->session()->get('selected_warehouse_id');
        $selectedWarehouse = $selectedWarehouseId ? $account->warehouses()->find($selectedWarehouseId) : null;

        // Get all KPIs
        $financial = $this->dashboardService->getFinancialMetrics($account);
        $operational = $this->dashboardService->getOperationalMetrics($account, $selectedWarehouseId);
        $alerts = $this->dashboardService->getInventoryAlerts($account, $selectedWarehouseId);
        $credits = $this->dashboardService->getCreditStatistics($account);

        // Get primary company
        $company = $account->companies()->where('is_active', true)->first()
            ?? $account->companies()->first();

        // Module-based metrics
        $services = $account->isServicesModuleEnabled()
            ? $this->dashboardService->getServiceMetrics($account)
            : null;

        $rentals = $account->isRentModuleEnabled()
            ? $this->dashboardService->getRentalMetrics($account)
            : null;

        // Online orders alert (if shop enabled)
        $onlineOrders = ['pending' => 0];
        if ($account->isShopEnabled()) {
            $onlineOrders['pending'] = Sale::where('account_id', $account->id)
                ->onlineOrders()
                ->where('payment_status', 'credit')
                ->count();
        }

        // Charts and tables
        $timeRange = $request->get('timeRange', '30days');
        $salesTrend = $this->getSalesTrendData($account, $timeRange);
        $topProducts = $this->getTopProducts($account, $timeRange);
        $recentSales = $this->getRecentSales($account, $timeRange);
        $lowStockProducts = $this->getLowStockProducts($account, $selectedWarehouseId);
        $stockByUnit = $this->getStockByUnit($account, $selectedWarehouseId);
        $paymentMethods = $this->getPaymentMethodsBreakdown($account);
        $expenseBreakdown = $this->getExpenseBreakdown($account);

        // Payment alert
        $paymentAlert = $this->checkAccountPaymentAlert($account, $request);

        return [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'role' => $user->role,
            ],
            'account' => [
                'name' => $company->name ?? $account->name,
                'modules' => [
                    'services_enabled' => $account->isServicesModuleEnabled(),
                    'rentals_enabled' => $account->isRentModuleEnabled(),
                    'shop_enabled' => $account->isShopEnabled(),
                    'loyalty_enabled' => $account->isLoyaltyModuleEnabled(),
                    'discounts_enabled' => $account->isDiscountsModuleEnabled(),
                ],
            ],
            'financial' => $financial,
            'operational' => $operational,
            'services' => $services,
            'rentals' => $rentals,
            'alerts' => $alerts,
            'online_orders' => $onlineOrders,
            'credits' => $credits,
            'stock_by_unit' => $stockByUnit,
            'charts' => [
                'sales_trend' => $salesTrend,
                'payment_methods' => $paymentMethods,
                'top_products' => $topProducts,
                'expense_breakdown' => $expenseBreakdown,
            ],
            'tables' => [
                'recent_sales' => $recentSales,
                'low_stock_products' => $lowStockProducts,
            ],
            'selected_warehouse' => $selectedWarehouse,
            'warehouse_context' => $selectedWarehouseId ? 'specific' : 'all',
            'payment_alert' => $paymentAlert,
        ];
    }

    /**
     * Accountant Dashboard - Financial focus
     */
    private function getFinancialDashboard(Account $account, User $user, Request $request): array
    {
        $company = $account->companies()->where('is_active', true)->first()
            ?? $account->companies()->first();

        $financial = $this->dashboardService->getFinancialMetrics($account);
        $credits = $this->dashboardService->getCreditStatistics($account);

        // Revenue breakdown by source
        $currentMonth = Carbon::now();
        $salesRevenue = Sale::where('account_id', $account->id)
            ->countable()
            ->whereYear('sale_date', $currentMonth->year)
            ->whereMonth('sale_date', $currentMonth->month)
            ->sum('total') ?? 0;

        $revenueBreakdown = ['sales' => $salesRevenue];

        if ($account->isServicesModuleEnabled()) {
            $serviceRevenue = \App\Models\TailorService::where('account_id', $account->id)
                ->where('status', 'completed')
                ->whereYear('updated_at', $currentMonth->year)
                ->whereMonth('updated_at', $currentMonth->month)
                ->sum('total_cost') ?? 0;
            $revenueBreakdown['services'] = $serviceRevenue;
        }

        if ($account->isRentModuleEnabled()) {
            $rentalRevenue = \App\Models\Rental::where('account_id', $account->id)
                ->whereYear('rental_start_date', $currentMonth->year)
                ->whereMonth('rental_start_date', $currentMonth->month)
                ->sum('rental_price') ?? 0;
            $revenueBreakdown['rentals'] = $rentalRevenue;
        }

        // Expense breakdown
        $expenseBreakdown = $this->getExpenseBreakdown($account);

        // Inventory valuation
        $stockValueCost = DB::table('product_stock')
            ->join('products', 'product_stock.product_id', '=', 'products.id')
            ->where('products.account_id', $account->id)
            ->sum(DB::raw('product_stock.quantity * products.purchase_price')) ?? 0;

        $stockValueSale = DB::table('product_stock')
            ->join('products', 'product_stock.product_id', '=', 'products.id')
            ->where('products.account_id', $account->id)
            ->sum(DB::raw('product_stock.quantity * products.sale_price')) ?? 0;

        $stockCount = DB::table('product_stock')
            ->join('products', 'product_stock.product_id', '=', 'products.id')
            ->where('products.account_id', $account->id)
            ->where('product_stock.quantity', '>', 0)
            ->count();

        return [
            'user' => ['id' => $user->id, 'name' => $user->name, 'role' => $user->role],
            'account' => [
                'name' => $company->name ?? $account->name,
                'modules' => [
                    'services_enabled' => $account->isServicesModuleEnabled(),
                    'rentals_enabled' => $account->isRentModuleEnabled(),
                ],
            ],
            'financial' => $financial,
            'revenue_breakdown' => $revenueBreakdown,
            'expense_breakdown' => $expenseBreakdown,
            'credits' => $credits,
            'inventory_valuation' => [
                'cost' => round($stockValueCost, 2),
                'sale' => round($stockValueSale, 2),
                'potential_profit' => round($stockValueSale - $stockValueCost, 2),
                'items_count' => $stockCount,
            ],
            'charts' => [
                'payment_methods' => $this->getPaymentMethodsBreakdown($account),
            ],
        ];
    }

    /**
     * Warehouse Manager Dashboard - Inventory focus
     */
    private function getInventoryDashboard(Account $account, User $user, Request $request): array
    {
        $company = $account->companies()->where('is_active', true)->first()
            ?? $account->companies()->first();

        $selectedWarehouseId = $request->session()->get('selected_warehouse_id');
        $selectedWarehouse = $selectedWarehouseId ? $account->warehouses()->find($selectedWarehouseId) : null;

        $operational = $this->dashboardService->getOperationalMetrics($account, $selectedWarehouseId);
        $alerts = $this->dashboardService->getInventoryAlerts($account, $selectedWarehouseId);
        $stockByUnit = $this->getStockByUnit($account, $selectedWarehouseId);
        $lowStockProducts = $this->getLowStockProducts($account, $selectedWarehouseId);

        return [
            'user' => ['id' => $user->id, 'name' => $user->name, 'role' => $user->role],
            'account' => ['name' => $company->name ?? $account->name],
            'operational' => $operational,
            'alerts' => $alerts,
            'stock_by_unit' => $stockByUnit,
            'tables' => [
                'low_stock_products' => $lowStockProducts,
            ],
            'selected_warehouse' => $selectedWarehouse,
            'warehouse_context' => $selectedWarehouseId ? 'specific' : 'all',
        ];
    }

    /**
     * Sales Staff Dashboard - Sales and service queue focus
     */
    private function getSalesDashboard(Account $account, User $user, Request $request): array
    {
        $company = $account->companies()->where('is_active', true)->first()
            ?? $account->companies()->first();

        // Personal performance
        $currentMonth = Carbon::now();
        $mySales = Sale::where('account_id', $account->id)
            ->where('created_by', $user->id)
            ->whereYear('sale_date', $currentMonth->year)
            ->whereMonth('sale_date', $currentMonth->month)
            ->count();

        $mySalesRevenue = Sale::where('account_id', $account->id)
            ->where('created_by', $user->id)
            ->whereYear('sale_date', $currentMonth->year)
            ->whereMonth('sale_date', $currentMonth->month)
            ->sum('total') ?? 0;

        $myCustomers = Sale::where('account_id', $account->id)
            ->where('created_by', $user->id)
            ->whereYear('sale_date', $currentMonth->year)
            ->whereMonth('sale_date', $currentMonth->month)
            ->whereNotNull('customer_id')
            ->distinct()
            ->count('customer_id');

        $avgTicket = $mySales > 0 ? $mySalesRevenue / $mySales : 0;

        $performance = [
            'my_sales_count' => $mySales,
            'my_sales_revenue' => round($mySalesRevenue, 2),
            'my_customers_served' => $myCustomers,
            'avg_ticket_size' => round($avgTicket, 2),
        ];

        // Service queue (if enabled and assigned)
        $services = null;
        if ($account->isServicesModuleEnabled()) {
            $services = $this->dashboardService->getServiceMetrics($account, $user->id);
        }

        // Stock alerts (read-only awareness)
        $alerts = $this->dashboardService->getInventoryAlerts($account);

        return [
            'user' => ['id' => $user->id, 'name' => $user->name, 'role' => $user->role],
            'account' => [
                'name' => $company->name ?? $account->name,
                'modules' => ['services_enabled' => $account->isServicesModuleEnabled()],
            ],
            'performance' => $performance,
            'services' => $services,
            'alerts' => [
                'low_stock' => $alerts['low_stock'],
                'out_of_stock' => $alerts['out_of_stock'],
            ],
        ];
    }

    /**
     * Tailor / Service Staff Dashboard - Service queue focus
     */
    private function getServiceDashboard(Account $account, User $user, Request $request): array
    {
        $company = $account->companies()->where('is_active', true)->first()
            ?? $account->companies()->first();

        if (!$account->isServicesModuleEnabled()) {
            abort(403, 'Services module is not enabled');
        }

        $services = $this->dashboardService->getServiceMetrics($account, $user->id);

        return [
            'user' => ['id' => $user->id, 'name' => $user->name, 'role' => $user->role],
            'account' => ['name' => $company->name ?? $account->name],
            'services' => $services,
        ];
    }

    /**
     * Branch Manager Dashboard - Branch operations focus
     */
    private function getBranchDashboard(Account $account, User $user, Request $request): array
    {
        $company = $account->companies()->where('is_active', true)->first()
            ?? $account->companies()->first();

        $branchId = $user->branch_id;
        $currentMonth = Carbon::now();

        // Branch performance
        $branchRevenue = Sale::where('account_id', $account->id)
            ->where('branch_id', $branchId)
            ->whereYear('sale_date', $currentMonth->year)
            ->whereMonth('sale_date', $currentMonth->month)
            ->sum('total') ?? 0;

        $branchSalesCount = Sale::where('account_id', $account->id)
            ->where('branch_id', $branchId)
            ->whereYear('sale_date', $currentMonth->year)
            ->whereMonth('sale_date', $currentMonth->month)
            ->count();

        $branchStaff = User::where('account_id', $account->id)
            ->where('branch_id', $branchId)
            ->where('status', 'active')
            ->count();

        $branchCustomers = Sale::where('account_id', $account->id)
            ->where('branch_id', $branchId)
            ->whereYear('sale_date', $currentMonth->year)
            ->whereMonth('sale_date', $currentMonth->month)
            ->whereNotNull('customer_id')
            ->distinct()
            ->count('customer_id');

        return [
            'user' => ['id' => $user->id, 'name' => $user->name, 'role' => $user->role],
            'account' => ['name' => $company->name ?? $account->name],
            'branch_performance' => [
                'revenue' => round($branchRevenue, 2),
                'sales_count' => $branchSalesCount,
                'staff_count' => $branchStaff,
                'customers_count' => $branchCustomers,
            ],
        ];
    }

    /**
     * Cashier Dashboard - Minimal POS focus
     */
    private function getCashierDashboard(Account $account, User $user, Request $request): array
    {
        $company = $account->companies()->where('is_active', true)->first()
            ?? $account->companies()->first();

        $today = Carbon::today();

        $mySalesToday = Sale::where('account_id', $account->id)
            ->where('created_by', $user->id)
            ->whereDate('sale_date', $today)
            ->count();

        $mySalesRevenue = Sale::where('account_id', $account->id)
            ->where('created_by', $user->id)
            ->whereDate('sale_date', $today)
            ->sum('total') ?? 0;

        $myCustomersToday = Sale::where('account_id', $account->id)
            ->where('created_by', $user->id)
            ->whereDate('sale_date', $today)
            ->whereNotNull('customer_id')
            ->distinct()
            ->count('customer_id');

        // Cash in hand (from payments)
        $cashCollected = DB::table('payments')
            ->join('sales', 'payments.sale_id', '=', 'sales.sale_id')
            ->where('sales.account_id', $account->id)
            ->where('sales.created_by', $user->id)
            ->whereDate('sales.sale_date', $today)
            ->where('payments.method', 'nağd')
            ->sum('payments.amount') ?? 0;

        $cardTransfers = DB::table('payments')
            ->join('sales', 'payments.sale_id', '=', 'sales.sale_id')
            ->where('sales.account_id', $account->id)
            ->where('sales.created_by', $user->id)
            ->whereDate('sales.sale_date', $today)
            ->whereIn('payments.method', ['kart', 'köçürmə'])
            ->sum('payments.amount') ?? 0;

        return [
            'user' => ['id' => $user->id, 'name' => $user->name, 'role' => $user->role],
            'account' => ['name' => $company->name ?? $account->name],
            'shift_summary' => [
                'sales_count' => $mySalesToday,
                'sales_revenue' => round($mySalesRevenue, 2),
                'customers_served' => $myCustomersToday,
                'cash_collected' => round($cashCollected, 2),
                'card_transfers' => round($cardTransfers, 2),
            ],
        ];
    }

    // ========== HELPER METHODS ==========

    private function getSalesTrendData(Account $account, string $timeRange): array
    {
        $days = match($timeRange) {
            '1day' => 1,
            '7days' => 7,
            '30days' => 30,
            '90days' => 90,
            default => 30
        };

        $data = [];
        for ($i = $days - 1; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);

            $salesCount = Sale::where('account_id', $account->id)
                ->countable()
                ->whereDate('sale_date', $date)
                ->count();

            $revenue = Sale::where('account_id', $account->id)
                ->countable()
                ->whereDate('sale_date', $date)
                ->sum('total') ?? 0;

            $data[] = [
                'date' => $date->format('Y-m-d'),
                'sales_count' => $salesCount,
                'revenue' => (float) $revenue,
            ];
        }

        return $data;
    }

    private function getTopProducts(Account $account, string $timeRange): array
    {
        $days = match($timeRange) {
            '1day' => 1,
            '7days' => 7,
            '30days' => 30,
            '90days' => 90,
            default => 30
        };

        return SaleItem::whereHas('sale', function ($q) use ($account, $days) {
                $q->where('account_id', $account->id)
                    ->where('sale_date', '>=', Carbon::now()->subDays($days));
            })
            ->with('product')
            ->selectRaw('product_id, SUM(quantity) as total_sold, SUM(total) as revenue')
            ->groupBy('product_id')
            ->orderBy('revenue', 'desc')
            ->limit(5)
            ->get()
            ->filter(fn($item) => $item->product !== null)
            ->map(fn($item) => [
                'id' => $item->product->id,
                'name' => $item->product->name,
                'total_sold' => (int) $item->total_sold,
                'revenue' => (float) $item->revenue,
            ])
            ->values()
            ->toArray();
    }

    private function getRecentSales(Account $account, string $timeRange): array
    {
        $days = match($timeRange) {
            '1day' => 1,
            '7days' => 7,
            '30days' => 30,
            '90days' => 90,
            default => 30
        };

        return Sale::where('account_id', $account->id)
            ->countable()
            ->where('sale_date', '>=', Carbon::now()->subDays($days))
            ->with(['customer', 'items'])
            ->latest('sale_date')
            ->limit(10)
            ->get()
            ->map(fn($sale) => [
                'id' => $sale->sale_id,
                'customer' => $sale->customer->name ?? 'Anonim müştəri',
                'amount' => (float) $sale->total,
                'date' => $sale->sale_date,
                'time' => Carbon::parse($sale->sale_date)->format('H:i'),
                'status' => $sale->payment_status === 'paid' ? 'Ödənilib' : 'Borc',
                'items_count' => $sale->items->count(),
            ])
            ->toArray();
    }

    private function getLowStockProducts(Account $account, ?int $warehouseId): array
    {
        return \App\Models\ProductStock::with(['product', 'warehouse'])
            ->whereHas('product', fn($q) => $q->where('account_id', $account->id))
            ->whereColumn('quantity', '<=', 'min_level')
            ->where('min_level', '>', 0)
            ->when($warehouseId, fn($q) => $q->where('warehouse_id', $warehouseId))
            ->limit(10)
            ->get()
            ->map(fn($stock) => [
                'id' => $stock->product->id,
                'name' => $stock->product->name,
                'current' => (float) $stock->quantity,
                'min' => (float) $stock->min_level,
                'unit' => $stock->product->unit,
                'warehouse' => $stock->warehouse->name ?? null,
            ])
            ->toArray();
    }

    private function getStockByUnit(Account $account, ?int $warehouseId): array
    {
        return DB::table('product_stock')
            ->join('products', 'product_stock.product_id', '=', 'products.id')
            ->where('products.account_id', $account->id)
            ->when($warehouseId, fn($q) => $q->where('product_stock.warehouse_id', $warehouseId))
            ->selectRaw('products.unit, SUM(product_stock.quantity) as total_quantity, COUNT(DISTINCT product_stock.product_id) as sku_count, SUM(product_stock.quantity * products.sale_price) as value')
            ->groupBy('products.unit')
            ->get()
            ->map(fn($item) => [
                'unit' => $item->unit,
                'quantity' => (float) $item->total_quantity,
                'sku_count' => (int) $item->sku_count,
                'value' => (float) $item->value,
            ])
            ->toArray();
    }

    private function getPaymentMethodsBreakdown(Account $account): array
    {
        $currentMonth = Carbon::now();
        $data = DB::table('payments')
            ->join('sales', 'payments.sale_id', '=', 'sales.sale_id')
            ->where('sales.account_id', $account->id)
            ->whereYear('sales.sale_date', $currentMonth->year)
            ->whereMonth('sales.sale_date', $currentMonth->month)
            ->selectRaw('payments.method, SUM(payments.amount) as total')
            ->groupBy('payments.method')
            ->get()
            ->pluck('total', 'method')
            ->toArray();

        return [
            'labels' => ['Nağd', 'Kart', 'Köçürmə'],
            'values' => [
                $data['nağd'] ?? 0,
                $data['kart'] ?? 0,
                $data['köçürmə'] ?? 0,
            ],
        ];
    }

    private function getExpenseBreakdown(Account $account): array
    {
        $currentMonth = Carbon::now();
        return \App\Models\Expense::where('account_id', $account->id)
            ->whereYear('expense_date', $currentMonth->year)
            ->whereMonth('expense_date', $currentMonth->month)
            ->with('category')
            ->selectRaw('category_id, SUM(amount) as total')
            ->groupBy('category_id')
            ->get()
            ->map(fn($item) => [
                'category' => $item->category->name ?? 'Digər',
                'amount' => (float) $item->total,
            ])
            ->toArray();
    }

    private function checkAccountPaymentAlert(Account $account, Request $request): ?array
    {
        if (!$account->monthly_payment_amount || !$account->payment_start_date) {
            return null;
        }

        $startDate = Carbon::parse($account->payment_start_date);
        $today = Carbon::today();

        if ($today->lt($startDate)) {
            return null;
        }

        $latestPaidPayment = \App\Models\AccountPayment::where('account_id', $account->id)
            ->where('status', 'paid')
            ->latest('due_date')
            ->first();

        $nextDueDate = $latestPaidPayment
            ? Carbon::parse($latestPaidPayment->due_date)->addMonth()
            : $startDate->copy()->addMonth();

        $isOverdue = $today->gte($nextDueDate);

        if ($isOverdue && !$request->session()->get('payment_alert_shown')) {
            $request->session()->put('payment_alert_shown', true);
            return [
                'amount' => $account->monthly_payment_amount,
                'due_date' => $nextDueDate->format('d.m.Y'),
                'days_overdue' => $today->diffInDays($nextDueDate),
            ];
        }

        return null;
    }
}
