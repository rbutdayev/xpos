<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Models\Product;
use App\Models\Customer;
use App\Models\Supplier;
use App\Models\Warehouse;
use App\Models\Branch;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SaleReturn;
use App\Models\Expense;
use App\Models\CustomerCredit;
use App\Models\SupplierPayment;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth', 'account.access']);
    }

    public function index(Request $request)
    {
        $user = Auth::user();
        
        // Redirect super admins to their panel
        if ($user->role === 'super_admin') {
            return redirect()->route('superadmin.dashboard');
        }
        
        $account = $user->account;
        $selectedWarehouseId = $request->session()->get('selected_warehouse_id');

        // Check if user needs to complete company setup
        if (!$account->companies()->exists()) {
            return redirect()->route('setup.wizard');
        }

        // Validate warehouse access for sales_staff
        if ($user->role === 'sales_staff' && $user->branch_id && $selectedWarehouseId) {
            $hasAccess = \App\Models\WarehouseBranchAccess::where('warehouse_id', $selectedWarehouseId)
                ->where('branch_id', $user->branch_id)
                ->where('can_view_stock', true)
                ->exists();
                
            if (!$hasAccess) {
                // Clear invalid warehouse selection and redirect
                $request->session()->forget('selected_warehouse_id');
                return redirect()->route('dashboard');
            }
        }

        // Get warehouse-specific statistics
        $warehouseQuery = $account->warehouses();
        if ($selectedWarehouseId) {
            $warehouseQuery->where('id', $selectedWarehouseId);
            $selectedWarehouse = $account->warehouses()->find($selectedWarehouseId);
        } else {
            $selectedWarehouse = null;
        }

        
        // Get dashboard statistics - these remain account-wide regardless of warehouse selection
        $stats = [
            'products_count' => $account->products()->count(),
            'customers_count' => $account->customers()->count(),
            'suppliers_count' => $account->suppliers()->count(),
            'warehouses_count' => $account->warehouses()->count(),
            'branches_count' => $account->branches()->count(),
            'active_customers' => $account->customers()->where('is_active', true)->count(),
        ];

        // Warehouse-specific stock statistics
        // Unified approach for consistent stock calculations across all widgets
        
        // Stock value calculation - respects warehouse selection
        $stats['total_stock_value'] = DB::table('product_stock')
            ->join('products', 'product_stock.product_id', '=', 'products.id')
            ->where('products.account_id', $account->id)
            ->where('product_stock.account_id', $account->id)
            ->when($selectedWarehouseId, function ($query) use ($selectedWarehouseId) {
                return $query->where('product_stock.warehouse_id', $selectedWarehouseId);
            })
            ->sum(DB::raw('product_stock.quantity * products.purchase_price')) ?? 0;
        
        // Product count - unique products in selected warehouse(s)
        $stats['total_product_count'] = DB::table('product_stock')
            ->join('products', 'product_stock.product_id', '=', 'products.id')
            ->where('products.account_id', $account->id)
            ->where('product_stock.account_id', $account->id)
            ->when($selectedWarehouseId, function ($query) use ($selectedWarehouseId) {
                return $query->where('product_stock.warehouse_id', $selectedWarehouseId);
            })
            ->distinct('product_stock.product_id')
            ->count('product_stock.product_id');
        
        // Low stock count - products below minimum level
        $stats['low_stock_count'] = DB::table('product_stock')
            ->join('products', 'product_stock.product_id', '=', 'products.id')
            ->where('products.account_id', $account->id)
            ->where('product_stock.account_id', $account->id)
            ->whereColumn('product_stock.quantity', '<=', 'product_stock.min_level')
            ->where('product_stock.min_level', '>', 0) // Only count items with valid min levels
            ->when($selectedWarehouseId, function ($query) use ($selectedWarehouseId) {
                return $query->where('product_stock.warehouse_id', $selectedWarehouseId);
            })
            ->count();
        
        // Out of stock count - products with zero or negative quantity
        $stats['out_of_stock_count'] = DB::table('product_stock')
            ->join('products', 'product_stock.product_id', '=', 'products.id')
            ->where('products.account_id', $account->id)
            ->where('product_stock.account_id', $account->id)
            ->where('product_stock.quantity', '<=', 0)
            ->when($selectedWarehouseId, function ($query) use ($selectedWarehouseId) {
                return $query->where('product_stock.warehouse_id', $selectedWarehouseId);
            })
            ->count();
        
        // Get stock quantities grouped by unit type - respects warehouse selection
        $stockByUnits = DB::table('product_stock')
            ->join('products', 'product_stock.product_id', '=', 'products.id')
            ->where('products.account_id', $account->id)
            ->where('product_stock.account_id', $account->id)
            ->when($selectedWarehouseId, function ($query) use ($selectedWarehouseId) {
                return $query->where('product_stock.warehouse_id', $selectedWarehouseId);
            })
            ->selectRaw('products.unit, SUM(product_stock.quantity) as total_quantity')
            ->groupBy('products.unit')
            ->orderByRaw('CASE 
                WHEN products.unit = "ədəd" THEN 1 
                WHEN products.unit = "dənə" THEN 2 
                WHEN products.unit = "paket" THEN 3 
                WHEN products.unit = "qutu" THEN 4 
                WHEN products.unit = "litr" THEN 5 
                WHEN products.unit = "kq" THEN 6 
                ELSE 7 
            END')
            ->get();
            
        $stats['stock_by_units'] = $stockByUnits->map(function ($item) {
            return [
                'unit' => $item->unit,
                'quantity' => (float) $item->total_quantity
            ];
        })->toArray();

        // Recent activity
        $recentCustomers = $account->customers()
            ->latest()
            ->limit(5)
            ->get();

        // Low stock alerts with warehouse context - consistent with stats calculation
        $lowStockQuery = \App\Models\ProductStock::with(['product.category', 'warehouse'])
            ->whereHas('product', function ($q) use ($account) {
                $q->where('account_id', $account->id);
            })
            ->whereColumn('quantity', '<=', 'min_level')
            ->where('min_level', '>', 0); // Only show items with valid min levels

        if ($selectedWarehouseId) {
            $lowStockQuery->where('warehouse_id', $selectedWarehouseId);
        }

        $lowStockData = $lowStockQuery->limit(10)->get();
        
        // Transform the data to match frontend expectations
        $lowStockProducts = $lowStockData->map(function ($stock) {
            return [
                'id' => $stock->product->id,
                'name' => $stock->product->name,
                'sku' => $stock->product->sku,
                'stock_quantity' => (int) $stock->quantity,
                'min_stock_level' => (int) $stock->min_level,
                'category_name' => $stock->product->category->name ?? null,
                'price' => $stock->product->sale_price ?? $stock->product->purchase_price ?? 0,
                'warehouse_name' => $stock->warehouse->name ?? null,
            ];
        });

        // Sales chart data based on selected time range
        $timeRange = $request->get('timeRange', '30days');
        $salesChartData = [];
        
        switch ($timeRange) {
            case '1day':
                // Hourly data for today
                for ($i = 23; $i >= 0; $i--) {
                    $hour = Carbon::now()->subHours($i);
                    $salesQuery = Sale::where('account_id', $account->id)
                        ->countable() // Only include POS sales + completed online orders
                        ->whereBetween('sale_date', [
                            $hour->copy()->startOfHour(),
                            $hour->copy()->endOfHour()
                        ]);
                    
                    // Note: Sales are linked to branches, not warehouses directly
                    // If a warehouse is selected, we may need to filter by associated branch
                    if ($selectedWarehouseId) {
                        // For now, we'll still show all sales since warehouse-branch relationship 
                        // may not be 1:1. This can be refined based on your business logic.
                        // $salesQuery->where('branch_id', $selectedWarehouseId);
                    }
                    
                    $salesData = $salesQuery->selectRaw('COUNT(*) as sales, COALESCE(SUM(total), 0) as revenue')->first();

                    $salesChartData[] = [
                        'date' => $hour->format('Y-m-d H:i'),
                        'sales' => $salesData->sales ?? 0,
                        'revenue' => $salesData->revenue ?? 0,
                    ];
                }
                break;
            case '7days':
                $days = 7;
                break;
            case '30days':
                $days = 30;
                break;
            case '90days':
                $days = 90;
                break;
            default:
                $days = 30;
        }
        
        // Daily data for multi-day periods
        if ($timeRange !== '1day') {
            for ($i = $days - 1; $i >= 0; $i--) {
                $date = Carbon::now()->subDays($i);
                $salesQuery = Sale::where('account_id', $account->id)
                    ->countable() // Only include POS sales + completed online orders
                    ->whereDate('sale_date', $date);
                
                // Note: Sales filtering by warehouse commented out as sales are branch-based
                // if ($selectedWarehouseId) {
                //     $salesQuery->where('branch_id', $selectedWarehouseId);
                // }
                
                $salesData = $salesQuery->selectRaw('COUNT(*) as sales, COALESCE(SUM(total), 0) as revenue')->first();

                $salesChartData[] = [
                    'date' => $date->format('Y-m-d'),
                    'sales' => $salesData->sales ?? 0,
                    'revenue' => $salesData->revenue ?? 0,
                ];
            }
        }

        // Top products based on selected time range
        $topProductsDays = match($timeRange) {
            '1day' => 1,
            '7days' => 7,
            '30days' => 30,
            '90days' => 90,
            default => 30
        };
        
        $topProducts = SaleItem::whereHas('sale', function ($query) use ($account, $topProductsDays) {
                $query->where('account_id', $account->id)
                      ->where('sale_date', '>=', Carbon::now()->subDays($topProductsDays));
                // Note: Warehouse filtering removed as sales are branch-based
            })
            ->with(['product.category'])
            ->selectRaw('product_id, SUM(quantity) as total_sold, SUM(total) as total_revenue')
            ->groupBy('product_id')
            ->orderBy('total_sold', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($item) {
                $stockQuantity = $item->product->productStocks()->sum('quantity') ?? 0;
                return [
                    'id' => $item->product->id,
                    'name' => $item->product->name,
                    'category_name' => $item->product->category->name ?? null,
                    'total_sold' => (int) $item->total_sold,
                    'total_revenue' => (float) $item->total_revenue,
                    'stock_quantity' => (int) $stockQuantity,
                ];
            });

        // Recent sales based on selected time range
        $recentSalesQuery = Sale::where('account_id', $account->id)
            ->countable() // Only include POS sales + completed online orders
            ->where('sale_date', '>=', Carbon::now()->subDays($topProductsDays));
        
        // Note: Warehouse filtering removed as sales are branch-based
        // if ($selectedWarehouseId) {
        //     $recentSalesQuery->where('branch_id', $selectedWarehouseId);
        // }
        
        $recentSales = $recentSalesQuery
            ->with(['customer', 'items'])
            ->latest()
            ->limit(10)
            ->get()
            ->map(function ($sale) {
                return [
                    'id' => $sale->sale_id,
                    'customer_name' => $sale->customer->name ?? null,
                    'total_amount' => (float) $sale->total,
                    'sale_date' => $sale->sale_date,
                    'status' => $sale->status ?? 'completed',
                    'items_count' => $sale->items->count(),
                ];
            });

        // Financial data
        $currentMonth = Carbon::now();
        $previousMonth = Carbon::now()->subMonth();

        // Current month revenue and expenses
        $monthlyRevenue = Sale::where('account_id', $account->id)
            ->countable() // Only include POS sales + completed online orders
            ->whereYear('sale_date', $currentMonth->year)
            ->whereMonth('sale_date', $currentMonth->month)
            ->sum('total') ?? 0;

        // Subtract returns from monthly revenue
        $monthlyReturns = SaleReturn::where('account_id', $account->id)
            ->where('status', 'completed')
            ->whereYear('return_date', $currentMonth->year)
            ->whereMonth('return_date', $currentMonth->month)
            ->sum('total') ?? 0;

        $monthlyRevenue -= $monthlyReturns;

        // Add rental revenue to monthly revenue - Only if rent module is enabled
        if ($account->isRentModuleEnabled()) {
            $monthlyRentalRevenue = \App\Models\Rental::where('account_id', $account->id)
                ->whereYear('rental_start_date', $currentMonth->year)
                ->whereMonth('rental_start_date', $currentMonth->month)
                ->sum('rental_price') ?? 0;
            $monthlyRevenue += $monthlyRentalRevenue;
        }

        // Add service revenue to monthly revenue - Only if services module is enabled
        if ($account->isServicesModuleEnabled()) {
            $monthlyServiceRevenue = \App\Models\TailorService::where('account_id', $account->id)
                ->whereIn('status', ['completed'])
                ->whereYear('updated_at', $currentMonth->year)
                ->whereMonth('updated_at', $currentMonth->month)
                ->sum('total_cost') ?? 0;
            $monthlyRevenue += $monthlyServiceRevenue;
        }

        $monthlyExpenses = Expense::where('account_id', $account->id)
            ->whereYear('expense_date', $currentMonth->year)
            ->whereMonth('expense_date', $currentMonth->month)
            ->sum('amount') ?? 0;

        $monthlySupplierPayments = SupplierPayment::where('account_id', $account->id)
            ->whereYear('payment_date', $currentMonth->year)
            ->whereMonth('payment_date', $currentMonth->month)
            ->sum('amount') ?? 0;

        $monthlyExpenses += $monthlySupplierPayments;

        // Previous month for growth calculation
        $prevMonthRevenue = Sale::where('account_id', $account->id)
            ->countable() // Only include POS sales + completed online orders
            ->whereYear('sale_date', $previousMonth->year)
            ->whereMonth('sale_date', $previousMonth->month)
            ->sum('total') ?? 0;

        // Subtract returns from previous month revenue
        $prevMonthReturns = SaleReturn::where('account_id', $account->id)
            ->where('status', 'completed')
            ->whereYear('return_date', $previousMonth->year)
            ->whereMonth('return_date', $previousMonth->month)
            ->sum('total') ?? 0;

        $prevMonthRevenue -= $prevMonthReturns;

        // Add rental revenue to previous month revenue - Only if rent module is enabled
        if ($account->isRentModuleEnabled()) {
            $prevMonthRentalRevenue = \App\Models\Rental::where('account_id', $account->id)
                ->whereYear('rental_start_date', $previousMonth->year)
                ->whereMonth('rental_start_date', $previousMonth->month)
                ->sum('rental_price') ?? 0;
            $prevMonthRevenue += $prevMonthRentalRevenue;
        }

        // Add service revenue to previous month revenue - Only if services module is enabled
        if ($account->isServicesModuleEnabled()) {
            $prevMonthServiceRevenue = \App\Models\TailorService::where('account_id', $account->id)
                ->whereIn('status', ['completed'])
                ->whereYear('updated_at', $previousMonth->year)
                ->whereMonth('updated_at', $previousMonth->month)
                ->sum('total_cost') ?? 0;
            $prevMonthRevenue += $prevMonthServiceRevenue;
        }

        $prevMonthExpenses = Expense::where('account_id', $account->id)
            ->whereYear('expense_date', $previousMonth->year)
            ->whereMonth('expense_date', $previousMonth->month)
            ->sum('amount') ?? 0;

        $prevMonthSupplierPayments = SupplierPayment::where('account_id', $account->id)
            ->whereYear('payment_date', $previousMonth->year)
            ->whereMonth('payment_date', $previousMonth->month)
            ->sum('amount') ?? 0;

        $prevMonthExpenses += $prevMonthSupplierPayments;

        // Total revenue and expenses (all time)
        $totalRevenue = Sale::where('account_id', $account->id)
            ->countable() // Only include POS sales + completed online orders
            ->sum('total') ?? 0;

        // Subtract all returns from total revenue
        $totalReturns = SaleReturn::where('account_id', $account->id)
            ->where('status', 'completed')
            ->sum('total') ?? 0;

        $totalRevenue -= $totalReturns;

        // Add rental revenue to total revenue - Only if rent module is enabled
        if ($account->isRentModuleEnabled()) {
            $totalRentalRevenue = \App\Models\Rental::where('account_id', $account->id)
                ->sum('rental_price') ?? 0;
            $totalRevenue += $totalRentalRevenue;
        }

        // Add service revenue to total revenue - Only if services module is enabled
        if ($account->isServicesModuleEnabled()) {
            $totalServiceRevenue = \App\Models\TailorService::where('account_id', $account->id)
                ->whereIn('status', ['completed'])
                ->sum('total_cost') ?? 0;
            $totalRevenue += $totalServiceRevenue;
        }

        $totalExpenses = Expense::where('account_id', $account->id)
            ->sum('amount') ?? 0;

        $totalSupplierPayments = SupplierPayment::where('account_id', $account->id)
            ->sum('amount') ?? 0;

        $totalExpenses += $totalSupplierPayments;

        // Calculate growth percentages
        $revenueGrowth = $prevMonthRevenue > 0 
            ? (($monthlyRevenue - $prevMonthRevenue) / $prevMonthRevenue) * 100 
            : 0;

        $expenseGrowth = $prevMonthExpenses > 0 
            ? (($monthlyExpenses - $prevMonthExpenses) / $prevMonthExpenses) * 100 
            : 0;

        $financialData = [
            'total_revenue' => $totalRevenue,
            'total_expenses' => $totalExpenses,
            'total_profit' => $totalRevenue - $totalExpenses,
            'pending_payments' => 0, // Could be implemented if needed
            'monthly_revenue' => $monthlyRevenue,
            'monthly_expenses' => $monthlyExpenses,
            'revenue_growth' => round($revenueGrowth, 1),
            'expense_growth' => round($expenseGrowth, 1),
        ];

        // Payment methods breakdown - real data from payments table
        $paymentMethodsData = DB::table('payments')
            ->join('sales', 'payments.sale_id', '=', 'sales.sale_id')
            ->where('sales.account_id', $account->id)
            ->whereYear('sales.sale_date', $currentMonth->year)
            ->whereMonth('sales.sale_date', $currentMonth->month)
            ->selectRaw('payments.method, SUM(payments.amount) as total')
            ->groupBy('payments.method')
            ->get()
            ->mapWithKeys(function ($item) {
                return [$item->method => (float) $item->total];
            })
            ->toArray();

        // Ensure all payment methods are present (even if zero)
        $paymentMethodsBreakdown = [
            'nağd' => $paymentMethodsData['nağd'] ?? 0,
            'kart' => $paymentMethodsData['kart'] ?? 0,
            'köçürmə' => $paymentMethodsData['köçürmə'] ?? 0,
        ];

        // Credit statistics - from customer_credits table only
        $totalOutstandingCredit = CustomerCredit::where('account_id', $account->id)
            ->where('remaining_amount', '>', 0)
            ->sum('remaining_amount') ?? 0;

        // Credits given this month
        $totalCreditsThisMonth = CustomerCredit::where('account_id', $account->id)
            ->whereYear('credit_date', $currentMonth->year)
            ->whereMonth('credit_date', $currentMonth->month)
            ->sum('amount') ?? 0;

        // Credits paid this month
        $totalCreditsPaidThisMonth = CustomerCredit::where('account_id', $account->id)
            ->whereYear('updated_at', $currentMonth->year)
            ->whereMonth('updated_at', $currentMonth->month)
            ->sum(DB::raw('amount - remaining_amount')) ?? 0;

        // Active credit customers count
        $activeCreditCustomersCount = CustomerCredit::where('account_id', $account->id)
            ->where('remaining_amount', '>', 0)
            ->distinct('customer_id')
            ->count('customer_id');

        $creditsData = [
            'total_outstanding' => $totalOutstandingCredit,
            'total_credits_this_month' => $totalCreditsThisMonth,
            'total_paid_this_month' => $totalCreditsPaidThisMonth,
            'active_credit_customers_count' => $activeCreditCustomersCount,
        ];

        // Rental statistics - Only calculate if rent module is enabled
        $rentalData = [
            'active_rentals_count' => 0,
            'monthly_rental_revenue' => 0,
            'pending_returns_count' => 0,
            'overdue_rentals_count' => 0,
            'total_rentals_this_month' => 0,
        ];

        if ($account->isRentModuleEnabled()) {
            $activeRentalsCount = \App\Models\Rental::where('account_id', $account->id)
                ->where('status', 'active')
                ->count();

            $monthlyRentalRevenue = \App\Models\Rental::where('account_id', $account->id)
                ->whereYear('rental_start_date', $currentMonth->year)
                ->whereMonth('rental_start_date', $currentMonth->month)
                ->sum('rental_price') ?? 0;

            $pendingReturnsCount = \App\Models\Rental::where('account_id', $account->id)
                ->whereIn('status', ['reserved', 'active'])
                ->whereBetween('rental_end_date', [today(), today()->addDays(3)])
                ->count();

            $overdueRentalsCount = \App\Models\Rental::where('account_id', $account->id)
                ->where('status', 'overdue')
                ->count();

            $totalRentalsThisMonth = \App\Models\Rental::where('account_id', $account->id)
                ->whereYear('rental_start_date', $currentMonth->year)
                ->whereMonth('rental_start_date', $currentMonth->month)
                ->count();

            $rentalData = [
                'active_rentals_count' => $activeRentalsCount,
                'monthly_rental_revenue' => $monthlyRentalRevenue,
                'pending_returns_count' => $pendingReturnsCount,
                'overdue_rentals_count' => $overdueRentalsCount,
                'total_rentals_this_month' => $totalRentalsThisMonth,
            ];
        }

        // MULTI-TENANT: Count pending online orders for notification banner - Only if shop is enabled
        $pendingOnlineOrders = 0;
        if ($account->isShopEnabled()) {
            $pendingOnlineOrders = Sale::where('account_id', $account->id)
                ->onlineOrders() // Scope for is_online_order = true
                ->where('payment_status', 'credit') // Unpaid orders
                ->count();
        }

        return Inertia::render('Dashboard', [
            'stats' => $stats,
            'sales_chart_data' => $salesChartData,
            'top_products' => $topProducts,
            'recent_sales' => $recentSales,
            'financial_data' => $financialData,
            'payment_methods_data' => $paymentMethodsBreakdown,
            'credits_data' => $creditsData,
            'rental_data' => $rentalData,
            'recent_customers' => $recentCustomers,
            'low_stock_products' => $lowStockProducts,
            'selectedWarehouse' => $selectedWarehouse,
            'warehouseContext' => $selectedWarehouseId ? 'specific' : 'all',
            'pending_online_orders' => $pendingOnlineOrders,
        ]);
    }
}