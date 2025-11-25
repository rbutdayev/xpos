<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Models\Sale;
use App\Models\ServiceRecord;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Customer;
use App\Models\Expense;
use App\Models\ProductStock;
use App\Models\Warehouse;
use App\Models\GeneratedReport;
use App\Models\SupplierPayment;
use App\Models\Payment;
use Carbon\Carbon;

class ReportController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
        $this->middleware('account.access');
    }

    public function index(Request $request)
    {
        $user = Auth::user();
        $account = $user->account;
        
        // Get all available report types
        $reportTypes = [
            [
                'id' => 'end_of_day',
                'name' => 'Günlük Qapanış Hesabatı',
                'description' => 'Günlük satış, ödəniş və kassa məlumatları',
                'icon' => 'CalendarIcon',
                'color' => 'red'
            ],
            [
                'id' => 'sales',
                'name' => 'Satış Hesabatı',
                'description' => 'Satış məlumatları və gəlir hesabatı',
                'icon' => 'CurrencyDollarIcon',
                'color' => 'blue'
            ],
            [
                'id' => 'inventory',
                'name' => 'Anbar Hesabatı',
                'description' => 'Anbar məlumatları və stok vəziyyəti',
                'icon' => 'CubeIcon',
                'color' => 'green'
            ],
            [
                'id' => 'financial',
                'name' => 'Maliyyə Hesabatı',
                'description' => 'Maliyyə hesabatı və xərclər',
                'icon' => 'ChartBarIcon',
                'color' => 'purple'
            ],
            [
                'id' => 'customer',
                'name' => 'Müştəri Hesabatı',
                'description' => 'Müştəri məlumatları və aktivlik',
                'icon' => 'UserIcon',
                'color' => 'indigo'
            ],
            [
                'id' => 'service',
                'name' => 'Servis Hesabatı',
                'description' => 'Servis qeydləri və performans',
                'icon' => 'WrenchScrewdriverIcon',
                'color' => 'yellow'
            ],
            [
                'id' => 'rental',
                'name' => 'Kirayə Hesabatı',
                'description' => 'Kirayə məlumatları və performans',
                'icon' => 'HomeIcon',
                'color' => 'teal'
            ],
            [
                'id' => 'cash_drawer',
                'name' => 'Kassa Hesabatı',
                'description' => 'Kassa nağd ödəniş və balans hesabatı',
                'icon' => 'BanknotesIcon',
                'color' => 'emerald'
            ]
        ];

        // Get recent report data for preview
        $recentReports = $this->getRecentReports($account);

        return Inertia::render('Reports/Index', [
            'reportTypes' => $reportTypes,
            'recentReports' => $recentReports,
            'stats' => $this->getReportStats($account)
        ]);
    }

    public function generate(Request $request)
    {
        $request->validate([
            'type' => 'required|in:sales,inventory,financial,customer,service,end_of_day,rental,cash_drawer',
            'date_from' => 'required|date',
            'date_to' => 'required|date|after_or_equal:date_from',
            'format' => 'nullable|in:table,excel,pdf'
        ]);

        $user = Auth::user();
        $account = $user->account;
        $type = $request->type;
        $dateFrom = Carbon::parse($request->date_from)->startOfDay();
        $dateTo = Carbon::parse($request->date_to)->endOfDay();
        $format = $request->format ?? 'table';

        switch ($type) {
            case 'end_of_day':
                $data = $this->generateEndOfDayReport($account, $dateFrom, $dateTo);
                break;
            case 'sales':
                $data = $this->generateSalesReport($account, $dateFrom, $dateTo);
                break;
            case 'inventory':
                $data = $this->generateInventoryReport($account, $dateFrom, $dateTo);
                break;
            case 'financial':
                $data = $this->generateFinancialReport($account, $dateFrom, $dateTo);
                break;
            case 'customer':
                $data = $this->generateCustomerReport($account, $dateFrom, $dateTo);
                break;
            case 'service':
                $data = $this->generateServiceReport($account, $dateFrom, $dateTo);
                break;
            case 'rental':
                $data = $this->generateRentalReport($account, $dateFrom, $dateTo);
                break;
            case 'cash_drawer':
                $data = $this->generateCashDrawerReport($account, $dateFrom, $dateTo);
                break;
            default:
                abort(404);
        }

        // Save generated report to database
        $generatedReport = GeneratedReport::create([
            'account_id' => $account->id,
            'user_id' => $user->id,
            'type' => $type,
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
            'data' => $data
        ]);

        if ($format === 'table') {
            // Redirect to view saved report
            return redirect()->route('reports.show', $generatedReport->id);
        }

        // For future implementation: Excel/PDF export
        return response()->json(['message' => 'Excel/PDF export coming soon']);
    }

    public function show($id)
    {
        $user = Auth::user();
        $account = $user->account;

        $report = GeneratedReport::where('account_id', $account->id)
            ->findOrFail($id);

        return Inertia::render('Reports/View', [
            'reportId' => $report->id,
            'reportType' => $report->type,
            'data' => $report->data,
            'dateRange' => [
                'from' => $report->date_from->format('Y-m-d'),
                'to' => $report->date_to->format('Y-m-d')
            ]
        ]);
    }

    public function download($id)
    {
        $user = Auth::user();
        $account = $user->account;

        $report = GeneratedReport::where('account_id', $account->id)
            ->findOrFail($id);

        $type = $report->type;
        $data = $report->data;
        $dateFrom = $report->date_from->format('Y-m-d');
        $dateTo = $report->date_to->format('Y-m-d');

        // For now return CSV format
        $filename = "{$type}_report_{$dateFrom}_{$dateTo}.csv";
        
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"$filename\"",
        ];

        $callback = function() use ($data, $type) {
            $file = fopen('php://output', 'w');
            
            // Add UTF-8 BOM for proper Excel display
            fwrite($file, "\xEF\xBB\xBF");
            
            switch ($type) {
                case 'end_of_day':
                    // Header
                    fputcsv($file, ['GÜNLÜK QAPANIŞ HESABATI']);
                    fputcsv($file, []);

                    // Summary section
                    fputcsv($file, ['ÜMUMI MƏLUMAT']);
                    fputcsv($file, ['Satış Sayı', $data['summary']['total_sales']]);
                    fputcsv($file, ['Ümumi Gəlir', number_format($data['summary']['total_revenue'], 2)]);
                    fputcsv($file, ['Endirim', number_format($data['summary']['total_discount'], 2)]);
                    fputcsv($file, ['Vergi', number_format($data['summary']['total_tax'], 2)]);
                    fputcsv($file, ['Orta Çek', number_format($data['summary']['average_transaction'], 2)]);
                    fputcsv($file, ['Satılan Məhsul', $data['summary']['total_items_sold']]);
                    fputcsv($file, []);

                    // Payment methods section
                    fputcsv($file, ['ÖDƏMƏ ÜSULLARI']);
                    fputcsv($file, ['Üsul', 'Məbləğ']);
                    foreach ($data['summary']['payment_methods'] as $method => $amount) {
                        $methodName = match($method) {
                            'nağd' => 'Nağd',
                            'kart' => 'Kart',
                            'köçürmə' => 'Köçürmə',
                            default => $method
                        };
                        fputcsv($file, [$methodName, number_format($amount, 2)]);
                    }
                    fputcsv($file, []);

                    // Hourly breakdown section
                    if (!empty($data['hourly_breakdown'])) {
                        fputcsv($file, ['SAATLIQ SATIŞLAR']);
                        fputcsv($file, ['Saat', 'Satış Sayı', 'Gəlir']);
                        foreach ($data['hourly_breakdown'] as $hour) {
                            fputcsv($file, [
                                $hour['hour'],
                                $hour['transactions'],
                                number_format($hour['revenue'], 2)
                            ]);
                        }
                        fputcsv($file, []);
                    }

                    // Employee sales section
                    if (!empty($data['employee_sales'])) {
                        fputcsv($file, ['İŞÇİ SATIŞ MƏLUMATLARı']);
                        fputcsv($file, ['İşçi Adı', 'Satış Sayı', 'Gəlir', 'Satılan Məhsul']);
                        foreach ($data['employee_sales'] as $employee) {
                            fputcsv($file, [
                                $employee['name'],
                                $employee['transactions'],
                                number_format($employee['revenue'], 2),
                                $employee['items_sold']
                            ]);
                        }
                        fputcsv($file, []);
                    }

                    // Top products section
                    if (!empty($data['top_products'])) {
                        fputcsv($file, ['ÇOX SATILAN MƏHSULLAR']);
                        fputcsv($file, ['Məhsul Adı', 'SKU', 'Miqdar', 'Gəlir']);
                        foreach ($data['top_products'] as $product) {
                            fputcsv($file, [
                                $product['name'],
                                $product['sku'],
                                $product['quantity'],
                                number_format($product['revenue'], 2)
                            ]);
                        }
                    }
                    break;
                case 'inventory':
                    fputcsv($file, [
                        'Məhsul Adı',
                        'SKU',
                        'Variant',
                        'Ölçü',
                        'Rəng',
                        'Barkod',
                        'Kateqoriya',
                        'Mövcud Stok',
                        'Minimum Səviyyə',
                        'Alış Qiyməti',
                        'Satış Qiyməti',
                        'Stok Dəyəri',
                        'Status'
                    ]);
                    foreach ($data['inventory'] as $item) {
                        fputcsv($file, [
                            $item['name'],
                            $item['sku'],
                            $item['variant_display'] ?? '-',
                            $item['size'] ?? '-',
                            $item['color'] ?? '-',
                            $item['barcode'] ?? '-',
                            $item['category'],
                            $item['current_stock'],
                            $item['min_level'],
                            $item['purchase_price'],
                            $item['sale_price'],
                            $item['stock_value'],
                            $this->translateStatus($item['status'])
                        ]);
                    }
                    break;
                case 'sales':
                    fputcsv($file, [
                        'Satış Nömrəsi',
                        'Müştəri',
                        'Satış Tarixi',
                        'Məhsul Adı',
                        'SKU',
                        'Variant',
                        'Ölçü',
                        'Rəng',
                        'Miqdar',
                        'Vahid Qiyməti',
                        'Məhsul Cəmi',
                        'Satış Cəmi',
                        'Status'
                    ]);
                    foreach ($data['sales'] as $item) {
                        if (!empty($item['products'])) {
                            foreach ($item['products'] as $product) {
                                fputcsv($file, [
                                    $item['sale_number'],
                                    $item['customer_name'],
                                    $item['sale_date'],
                                    $product['name'],
                                    $product['sku'],
                                    $product['variant_display'] ?? '-',
                                    $product['size'] ?? '-',
                                    $product['color'] ?? '-',
                                    $product['quantity'],
                                    $product['unit_price'],
                                    $product['total'],
                                    $item['total'],
                                    $this->translateStatus($item['status'])
                                ]);
                            }
                        } else {
                            fputcsv($file, [
                                $item['sale_number'],
                                $item['customer_name'],
                                $item['sale_date'],
                                'Məhsul məlumatı yoxdur',
                                '',
                                '',
                                '',
                                '',
                                '',
                                '',
                                '',
                                $item['total'],
                                $this->translateStatus($item['status'])
                            ]);
                        }
                    }
                    break;
                case 'financial':
                    fputcsv($file, ['Tarix', 'Gəlir', 'Xərclər', 'Mənfəət']);
                    foreach ($data['daily_data'] as $item) {
                        fputcsv($file, [
                            $item['date'],
                            $item['revenue'],
                            $item['expenses'],
                            $item['profit']
                        ]);
                    }
                    break;
                case 'customer':
                    fputcsv($file, ['Müştəri Adı', 'Email', 'Telefon', 'Alış Sayı', 'Xərclənən Məbləğ', 'Son Alış', 'Müştəri Növü']);
                    foreach ($data['customers'] as $item) {
                        fputcsv($file, [
                            $item['name'],
                            $item['email'],
                            $item['phone'],
                            $item['total_purchases'],
                            $item['total_spent'],
                            $item['last_purchase'],
                            $item['customer_type']
                        ]);
                    }
                    break;
                case 'service':
                    fputcsv($file, ['Servis Nömrəsi', 'Müştəri', 'Avtomobil', 'Servis Tarixi', 'Təsvir', 'Dəyər', 'Status']);
                    foreach ($data['services'] as $item) {
                        fputcsv($file, [
                            $item['service_number'],
                            $item['customer_name'],
                            $item['vehicle_info'],
                            $item['service_date'],
                            $item['description'],
                            $item['total_cost'],
                            $this->translateStatus($item['status'])
                        ]);
                    }
                    break;
                case 'rental':
                    fputcsv($file, ['Kirayə Nömrəsi', 'Müştəri', 'Filial', 'Başlanğıc Tarixi', 'Bitmə Tarixi', 'Məhsul/İnventar', 'Miqdar', 'Vahid Qiyməti', 'Cəmi Məbləğ', 'Ödənilən', 'Kredit', 'Status', 'Ödəniş Statusu']);
                    foreach ($data['rentals'] as $item) {
                        if (!empty($item['items'])) {
                            foreach ($item['items'] as $rentalItem) {
                                fputcsv($file, [
                                    $item['rental_number'],
                                    $item['customer_name'],
                                    $item['branch_name'],
                                    $item['start_date'],
                                    $item['end_date'],
                                    $rentalItem['product_name'],
                                    $rentalItem['quantity'],
                                    $rentalItem['unit_price'],
                                    $item['total_cost'],
                                    $item['paid_amount'],
                                    $item['credit_amount'],
                                    $this->translateStatus($item['status']),
                                    $this->translateStatus($item['payment_status'])
                                ]);
                            }
                        } else {
                            fputcsv($file, [
                                $item['rental_number'],
                                $item['customer_name'],
                                $item['branch_name'],
                                $item['start_date'],
                                $item['end_date'],
                                'Məhsul məlumatı yoxdur',
                                '',
                                '',
                                $item['total_cost'],
                                $item['paid_amount'],
                                $item['credit_amount'],
                                $this->translateStatus($item['status']),
                                $this->translateStatus($item['payment_status'])
                            ]);
                        }
                    }
                    break;
            }
            
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    private function getRecentReports($account)
    {
        return GeneratedReport::where('account_id', $account->id)
            ->with('user:id,name')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($report) {
                return [
                    'id' => $report->id,
                    'type' => $report->type,
                    'name' => $report->formatted_type,
                    'generated_at' => $report->created_at->toISOString(),
                    'period' => $report->period,
                    'format' => 'Cədvəl',
                    'generated_by' => $report->user->name
                ];
            });
    }

    private function getReportStats($account)
    {
        $totalReports = GeneratedReport::where('account_id', $account->id)->count();

        $thisMonthReports = GeneratedReport::where('account_id', $account->id)
            ->whereMonth('created_at', Carbon::now()->month)
            ->whereYear('created_at', Carbon::now()->year)
            ->count();

        $mostUsedReport = GeneratedReport::where('account_id', $account->id)
            ->select('type', DB::raw('count(*) as count'))
            ->groupBy('type')
            ->orderByDesc('count')
            ->first();

        $lastGenerated = GeneratedReport::where('account_id', $account->id)
            ->orderBy('created_at', 'desc')
            ->first();

        $types = [
            'end_of_day' => 'Günlük Qapanış Hesabatı',
            'sales' => 'Satış Hesabatı',
            'inventory' => 'Anbar Hesabatı',
            'financial' => 'Maliyyə Hesabatı',
            'customer' => 'Müştəri Hesabatı',
            'service' => 'Servis Hesabatı',
            'rental' => 'Kirayə Hesabatı'
        ];

        return [
            'total_reports_generated' => $totalReports,
            'this_month_reports' => $thisMonthReports,
            'most_used_report' => $mostUsedReport ? ($types[$mostUsedReport->type] ?? $mostUsedReport->type) : 'N/A',
            'last_generated' => $lastGenerated ? $lastGenerated->created_at->format('d.m.Y H:i') : 'N/A'
        ];
    }

    private function generateRentalReport($account, $dateFrom, $dateTo)
    {
        // Use Rental model instead of ServiceRecord
        $rentals = \App\Models\Rental::where('account_id', $account->id)
            ->whereBetween('rental_start_date', [$dateFrom, $dateTo])
            ->with(['customer', 'branch', 'items.product', 'items.rentalInventory'])
            ->get();

        $summary = [
            'total_rentals' => $rentals->count(),
            'active_rentals' => $rentals->where('status', 'active')->count(),
            'completed_rentals' => $rentals->where('status', 'returned')->count(),
            'overdue_rentals' => $rentals->where('status', 'overdue')->count(),
            'cancelled_rentals' => $rentals->where('status', 'cancelled')->count(),
            'total_rental_revenue' => $rentals->sum('total_cost'),
            'total_paid_amount' => $rentals->sum('paid_amount'),
            'total_outstanding' => $rentals->sum('credit_amount'),
            'average_rental_value' => $rentals->avg('total_cost'),
        ];

        $rentalData = $rentals->map(function ($rental) {
            return [
                'rental_number' => $rental->rental_number,
                'customer_name' => $rental->customer->name ?? 'Naməlum',
                'branch_name' => $rental->branch->name ?? 'Naməlum',
                'start_date' => $rental->rental_start_date->format('Y-m-d'),
                'end_date' => $rental->rental_end_date->format('Y-m-d'),
                'total_cost' => $rental->total_cost,
                'paid_amount' => $rental->paid_amount,
                'credit_amount' => $rental->credit_amount,
                'status' => $rental->status,
                'payment_status' => $rental->payment_status,
                'items' => $rental->items->map(function ($item) {
                    $productName = $item->product->name ?? 'Naməlum Məhsul';
                    
                    // If it's an inventory item, add inventory number
                    if ($item->rentalInventory) {
                        $productName .= " (İnv: {$item->rentalInventory->inventory_number})";
                    }

                    return [
                        'product_name' => $productName,
                        'quantity' => $item->quantity,
                        'daily_rate' => $item->unit_price,
                        'total_cost' => $item->total_price,
                    ];
                })->toArray()
            ];
        });

        return [
            'summary' => $summary,
            'rentals' => $rentalData,
            'type' => 'rental'
        ];
    }

    private function generateSalesReport($account, $dateFrom, $dateTo)
    {
        // Get summary data with single query
        $summaryData = Sale::where('account_id', $account->id)
            ->countable() // Only include POS sales + completed online orders
            ->whereBetween('sale_date', [$dateFrom, $dateTo])
            ->selectRaw('
                COUNT(*) as total_sales,
                SUM(total) as total_revenue,
                AVG(total) as average_sale
            ')
            ->first();

        // Get top customer with efficient query
        $topCustomer = Sale::where('account_id', $account->id)
            ->countable() // Only include POS sales + completed online orders
            ->whereBetween('sale_date', [$dateFrom, $dateTo])
            ->select('customer_id', DB::raw('SUM(total) as total_spent'))
            ->groupBy('customer_id')
            ->orderByDesc('total_spent')
            ->with('customer:id,name')
            ->first();

        // Get payment method breakdown
        $paymentBreakdown = Payment::whereHas('sale', function($q) use ($account, $dateFrom, $dateTo) {
                $q->where('account_id', $account->id)
                  ->countable()
                  ->whereBetween('sale_date', [$dateFrom, $dateTo]);
            })
            ->selectRaw('method, SUM(amount) as total, COUNT(*) as count')
            ->groupBy('method')
            ->get()
            ->mapWithKeys(function($item) {
                return [$item->method => [
                    'total' => $item->total,
                    'count' => $item->count
                ]];
            });

        $summary = [
            'total_sales' => $summaryData->total_sales ?? 0,
            'total_revenue' => $summaryData->total_revenue ?? 0,
            'average_sale' => $summaryData->average_sale ?? 0,
            'top_customer' => $topCustomer && $topCustomer->customer ? [
                'name' => $topCustomer->customer->name,
                'total' => $topCustomer->total_spent
            ] : null,
            'payment_methods' => [
                'nağd' => $paymentBreakdown['nağd'] ?? ['total' => 0, 'count' => 0],
                'kart' => $paymentBreakdown['kart'] ?? ['total' => 0, 'count' => 0],
                'köçürmə' => $paymentBreakdown['köçürmə'] ?? ['total' => 0, 'count' => 0],
            ]
        ];

        // Get sales data separately for display
        $sales = Sale::where('account_id', $account->id)
            ->countable() // Only include POS sales + completed online orders
            ->whereBetween('sale_date', [$dateFrom, $dateTo])
            ->with(['customer', 'items.product', 'items.variant'])
            ->get();

        $salesData = $sales->map(function ($sale) {
            return [
                'sale_number' => $sale->sale_number,
                'customer_name' => $sale->customer->name ?? 'Naməlum',
                'sale_date' => $sale->sale_date,
                'total' => $sale->total,
                'items_count' => $sale->items->count(),
                'status' => $sale->status ?? 'completed',
                'products' => $sale->items->map(function ($item) {
                    $productName = $item->product->name ?? 'Naməlum Məhsul';

                    // Add variant info to product name if exists
                    if ($item->variant) {
                        $productName .= " ({$item->variant->short_display})";
                    }

                    return [
                        'name' => $productName,
                        'sku' => $item->product->sku ?? '',
                        'variant_id' => $item->variant_id,
                        'variant_display' => $item->variant?->short_display,
                        'size' => $item->variant?->size,
                        'color' => $item->variant?->color,
                        'quantity' => $item->quantity,
                        'unit_price' => $item->unit_price,
                        'total' => $item->total
                    ];
                })->toArray()
            ];
        });

        return [
            'summary' => $summary,
            'sales' => $salesData,
            'type' => 'sales'
        ];
    }

    private function generateInventoryReport($account, $dateFrom, $dateTo)
    {
        // Get products with variants and stock
        $products = Product::where('account_id', $account->id)
            ->with(['category', 'variants.stock'])
            ->get();

        $inventoryData = [];

        foreach ($products as $product) {
            if ($product->variants->isNotEmpty()) {
                // Product has variants - show each variant separately
                foreach ($product->variants as $variant) {
                    $variantStock = $variant->stock->sum('quantity');
                    $finalPrice = $variant->final_price ?? $product->purchase_price;

                    $inventoryData[] = [
                        'name' => $product->name,
                        'sku' => $product->sku,
                        'variant_id' => $variant->id,
                        'variant_display' => $variant->short_display, // e.g., "M / Red"
                        'size' => $variant->size,
                        'color' => $variant->color,
                        'barcode' => $variant->barcode,
                        'category' => $product->category->name ?? 'Kateqoriyasız',
                        'current_stock' => $variantStock,
                        'min_level' => $product->min_stock_level,
                        'purchase_price' => $finalPrice,
                        'sale_price' => $variant->final_price ?? $product->sale_price,
                        'stock_value' => $variantStock * $finalPrice,
                        'status' => $this->getStockStatus($variantStock, $product->min_stock_level),
                        'has_variant' => true,
                    ];
                }
            } else {
                // Product has no variants - show as before
                $totalStock = $product->productStocks->sum('quantity');

                $inventoryData[] = [
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'variant_id' => null,
                    'variant_display' => null,
                    'size' => null,
                    'color' => null,
                    'barcode' => null,
                    'category' => $product->category->name ?? 'Kateqoriyasız',
                    'current_stock' => $totalStock,
                    'min_level' => $product->min_stock_level,
                    'purchase_price' => $product->purchase_price,
                    'sale_price' => $product->sale_price,
                    'stock_value' => $totalStock * $product->purchase_price,
                    'status' => $this->getStockStatus($totalStock, $product->min_stock_level),
                    'has_variant' => false,
                ];
            }
        }

        $inventoryCollection = collect($inventoryData);

        // Calculate summary with variant support
        $summary = [
            'total_products' => $products->count(),
            'total_variants' => $inventoryCollection->where('has_variant', true)->count(),
            'total_stock_value' => $inventoryCollection->sum('stock_value'),
            'low_stock_items' => $inventoryCollection->filter(function ($item) {
                return $item['status'] === 'low_stock';
            })->count(),
            'out_of_stock_items' => $inventoryCollection->filter(function ($item) {
                return $item['status'] === 'out_of_stock';
            })->count(),
        ];

        return [
            'summary' => $summary,
            'inventory' => $inventoryData,
            'type' => 'inventory'
        ];
    }

    private function generateFinancialReport($account, $dateFrom, $dateTo)
    {
        $sales = Sale::where('account_id', $account->id)
            ->countable() // Only include POS sales + completed online orders
            ->whereBetween('sale_date', [$dateFrom, $dateTo])
            ->sum('total');

        $expenses = Expense::where('account_id', $account->id)
            ->whereBetween('expense_date', [$dateFrom, $dateTo])
            ->sum('amount');

        $supplierPayments = SupplierPayment::where('account_id', $account->id)
            ->whereBetween('payment_date', [$dateFrom, $dateTo])
            ->sum('amount');

        $totalExpenses = $expenses + $supplierPayments;

        // Get payment method breakdown for revenue
        $paymentBreakdown = Payment::whereHas('sale', function($q) use ($account, $dateFrom, $dateTo) {
                $q->where('account_id', $account->id)
                  ->countable()
                  ->whereBetween('sale_date', [$dateFrom, $dateTo]);
            })
            ->selectRaw('method, SUM(amount) as total')
            ->groupBy('method')
            ->pluck('total', 'method');

        $summary = [
            'total_revenue' => $sales,
            'total_expenses' => $totalExpenses,
            'net_profit' => $sales - $totalExpenses,
            'profit_margin' => $sales > 0 ? (($sales - $totalExpenses) / $sales) * 100 : 0,
            'revenue_by_payment_method' => [
                'nağd' => $paymentBreakdown['nağd'] ?? 0,
                'kart' => $paymentBreakdown['kart'] ?? 0,
                'köçürmə' => $paymentBreakdown['köçürmə'] ?? 0,
            ]
        ];

        // Get all sales grouped by date (1 query instead of 365+)
        $salesByDate = Sale::where('account_id', $account->id)
            ->countable() // Only include POS sales + completed online orders
            ->whereBetween('sale_date', [$dateFrom, $dateTo])
            ->selectRaw('DATE(sale_date) as date, SUM(total) as total_revenue')
            ->groupBy('date')
            ->pluck('total_revenue', 'date');

        // Get all expenses grouped by date (1 query instead of 365+)
        $expensesByDate = Expense::where('account_id', $account->id)
            ->whereBetween('expense_date', [$dateFrom, $dateTo])
            ->selectRaw('DATE(expense_date) as date, SUM(amount) as total_expenses')
            ->groupBy('date')
            ->pluck('total_expenses', 'date');

        // Get all supplier payments grouped by date
        $supplierPaymentsByDate = SupplierPayment::where('account_id', $account->id)
            ->whereBetween('payment_date', [$dateFrom, $dateTo])
            ->selectRaw('DATE(payment_date) as date, SUM(amount) as total_payments')
            ->groupBy('date')
            ->pluck('total_payments', 'date');

        // Build daily data array
        $dailyData = [];
        $currentDate = $dateFrom->copy();

        while ($currentDate <= $dateTo) {
            $dateKey = $currentDate->format('Y-m-d');
            $revenue = $salesByDate[$dateKey] ?? 0;
            $expenses = ($expensesByDate[$dateKey] ?? 0) + ($supplierPaymentsByDate[$dateKey] ?? 0);

            $dailyData[] = [
                'date' => $dateKey,
                'revenue' => $revenue,
                'expenses' => $expenses,
                'profit' => $revenue - $expenses
            ];

            $currentDate->addDay();
        }

        return [
            'summary' => $summary,
            'daily_data' => $dailyData,
            'type' => 'financial'
        ];
    }

    private function generateCustomerReport($account, $dateFrom, $dateTo)
    {
        // Get customers with aggregated sales data
        $customers = Customer::where('account_id', $account->id)
            ->withCount(['sales' => function ($query) use ($dateFrom, $dateTo) {
                $query->whereBetween('sale_date', [$dateFrom, $dateTo]);
            }])
            ->withSum(['sales' => function ($query) use ($dateFrom, $dateTo) {
                $query->whereBetween('sale_date', [$dateFrom, $dateTo]);
            }], 'total')
            ->with(['sales' => function ($query) use ($dateFrom, $dateTo) {
                $query->whereBetween('sale_date', [$dateFrom, $dateTo])
                      ->orderBy('sale_date', 'desc')
                      ->limit(1);
            }])
            ->get();

        // Calculate summary
        $activeCustomers = $customers->where('sales_count', '>', 0);
        $topCustomer = $activeCustomers->sortByDesc('sales_sum_total')->first();

        $summary = [
            'total_customers' => $customers->count(),
            'active_customers' => $activeCustomers->count(),
            'top_customer' => $topCustomer,
            'average_customer_value' => $activeCustomers->avg('sales_sum_total') ?? 0
        ];

        $customerData = $customers->map(function ($customer) {
            return [
                'name' => $customer->name,
                'email' => $customer->email,
                'phone' => $customer->phone,
                'total_purchases' => $customer->sales_count,
                'total_spent' => $customer->sales_sum_total ?? 0,
                'last_purchase' => $customer->sales->first()->sale_date ?? null,
                'customer_type' => $customer->customer_type_text
            ];
        });

        return [
            'summary' => $summary,
            'customers' => $customerData,
            'type' => 'customer'
        ];
    }

    private function generateServiceReport($account, $dateFrom, $dateTo)
    {
        $services = ServiceRecord::whereHas('customer', function ($query) use ($account) {
                $query->where('account_id', $account->id);
            })
            ->whereBetween('service_date', [$dateFrom, $dateTo])
            ->with(['customer', 'vehicle'])
            ->get();

        $summary = [
            'total_services' => $services->count(),
            'completed_services' => $services->where('status', 'completed')->count(),
            'pending_services' => $services->where('status', 'pending')->count(),
            'total_service_revenue' => $services->sum('total_cost'),
            'average_service_cost' => $services->avg('total_cost')
        ];

        $serviceData = $services->map(function ($service) {
            return [
                'service_number' => $service->service_number,
                'customer_name' => $service->customer->name,
                'vehicle_info' => $service->vehicle ? "{$service->vehicle->make} {$service->vehicle->model}" : 'N/A',
                'service_date' => $service->service_date,
                'description' => $service->description,
                'total_cost' => $service->total_cost,
                'status' => $service->status
            ];
        });

        return [
            'summary' => $summary,
            'services' => $serviceData,
            'type' => 'service'
        ];
    }

    private function generateEndOfDayReport($account, $dateFrom, $dateTo)
    {
        // Get all sales for the period
        $sales = Sale::where('account_id', $account->id)
            ->countable()
            ->whereBetween('sale_date', [$dateFrom, $dateTo])
            ->with(['payments', 'user', 'items'])
            ->get();

        // Calculate payment method breakdown
        $paymentMethods = [
            'nağd' => 0,
            'kart' => 0,
            'köçürmə' => 0,
        ];

        foreach ($sales as $sale) {
            foreach ($sale->payments as $payment) {
                if (isset($paymentMethods[$payment->method])) {
                    $paymentMethods[$payment->method] += $payment->amount;
                } else {
                    $paymentMethods[$payment->method] = $payment->amount;
                }
            }
        }

        // Calculate hourly breakdown
        $hourlyBreakdown = [];
        for ($hour = 0; $hour < 24; $hour++) {
            $hourlyBreakdown[$hour] = [
                'hour' => str_pad($hour, 2, '0', STR_PAD_LEFT) . ':00',
                'transactions' => 0,
                'revenue' => 0
            ];
        }

        foreach ($sales as $sale) {
            $hour = (int) $sale->sale_date->format('H');
            $hourlyBreakdown[$hour]['transactions']++;
            $hourlyBreakdown[$hour]['revenue'] += $sale->total;
        }

        // Filter out hours with no activity
        $hourlyBreakdown = array_values(array_filter($hourlyBreakdown, function($item) {
            return $item['transactions'] > 0;
        }));

        // Calculate employee breakdown
        $employeeSales = [];
        foreach ($sales as $sale) {
            $userId = $sale->user_id ?? 'unknown';
            $userName = $sale->user->name ?? 'Bilinmir';

            if (!isset($employeeSales[$userId])) {
                $employeeSales[$userId] = [
                    'name' => $userName,
                    'transactions' => 0,
                    'revenue' => 0,
                    'items_sold' => 0
                ];
            }

            $employeeSales[$userId]['transactions']++;
            $employeeSales[$userId]['revenue'] += $sale->total;
            $employeeSales[$userId]['items_sold'] += $sale->items->sum('quantity');
        }

        // Get top selling products for the period
        $topProducts = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.sale_id')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->where('sales.account_id', $account->id)
            ->whereBetween('sales.sale_date', [$dateFrom, $dateTo])
            ->select(
                'products.name',
                'products.sku',
                DB::raw('SUM(sale_items.quantity) as total_quantity'),
                DB::raw('SUM(sale_items.total) as total_revenue')
            )
            ->groupBy('products.id', 'products.name', 'products.sku')
            ->orderByDesc('total_quantity')
            ->limit(10)
            ->get()
            ->map(function($item) {
                return [
                    'name' => $item->name,
                    'sku' => $item->sku,
                    'quantity' => $item->total_quantity,
                    'revenue' => $item->total_revenue
                ];
            });

        // Summary calculations
        $summary = [
            'total_sales' => $sales->count(),
            'total_revenue' => $sales->sum('total'),
            'total_discount' => $sales->sum('discount_amount'),
            'total_tax' => $sales->sum('tax_amount'),
            'average_transaction' => $sales->count() > 0 ? $sales->sum('total') / $sales->count() : 0,
            'total_items_sold' => $sales->sum(function($sale) {
                return $sale->items->sum('quantity');
            }),
            'payment_methods' => $paymentMethods,
            'cash_expected' => $paymentMethods['nağd'] ?? 0,
        ];

        return [
            'summary' => $summary,
            'hourly_breakdown' => $hourlyBreakdown,
            'employee_sales' => array_values($employeeSales),
            'top_products' => $topProducts->toArray(),
            'type' => 'end_of_day'
        ];
    }

    private function getStockStatus($currentStock, $minLevel)
    {
        if ($currentStock <= 0) {
            return 'out_of_stock';
        } elseif ($currentStock <= $minLevel) {
            return 'low_stock';
        } else {
            return 'in_stock';
        }
    }

    /**
     * Translate stock status codes to Azerbaijani
     */
    private function translateStatus($status)
    {
        return match($status) {
            'out_of_stock' => 'Stokda yoxdur',
            'low_stock' => 'Az qalıb',
            'in_stock' => 'Stokda var',
            'completed' => 'Tamamlandı',
            'pending' => 'Gözləmədə',
            'cancelled' => 'Ləğv edildi',
            // Rental statuses
            'reserved' => 'Rezerv edildi',
            'active' => 'Aktiv',
            'overdue' => 'Gecikmiş',
            'returned' => 'Qaytarıldı',
            // Payment statuses
            'unpaid' => 'Ödənilməyib',
            'partial' => 'Qismən ödənildi',
            'paid' => 'Ödənildi',
            default => $status
        };
    }

    private function generateCashDrawerReport($account, $dateFrom, $dateTo)
    {
        // Get only cash payments for the period
        $cashPayments = Payment::whereHas('sale', function($q) use ($account, $dateFrom, $dateTo) {
                $q->where('account_id', $account->id)
                  ->whereBetween('sale_date', [$dateFrom, $dateTo]);
            })
            ->where('method', 'nağd')
            ->with(['sale.customer', 'sale.branch', 'sale.user'])
            ->get();

        // Get cash expenses for the period
        $cashExpenses = Expense::where('account_id', $account->id)
            ->whereBetween('expense_date', [$dateFrom, $dateTo])
            ->where('payment_method', 'nağd')
            ->get();

        // Calculate totals
        $totalCashSales = $cashPayments->sum('amount');
        $totalCashExpenses = $cashExpenses->sum('amount');
        $netCashFlow = $totalCashSales - $totalCashExpenses;

        // Group by date for daily breakdown
        $dailyBreakdown = collect();
        $currentDate = $dateFrom->copy();
        while ($currentDate->lte($dateTo)) {
            $dateStr = $currentDate->format('Y-m-d');

            $dayCashSales = $cashPayments->filter(function($payment) use ($dateStr) {
                return $payment->sale && $payment->sale->sale_date->format('Y-m-d') === $dateStr;
            })->sum('amount');

            $dayCashExpenses = $cashExpenses->filter(function($expense) use ($dateStr) {
                return $expense->expense_date->format('Y-m-d') === $dateStr;
            })->sum('amount');

            $dailyBreakdown->push([
                'date' => $dateStr,
                'cash_sales' => $dayCashSales,
                'cash_expenses' => $dayCashExpenses,
                'net_cash' => $dayCashSales - $dayCashExpenses,
                'transaction_count' => $cashPayments->filter(function($payment) use ($dateStr) {
                    return $payment->sale && $payment->sale->sale_date->format('Y-m-d') === $dateStr;
                })->count()
            ]);

            $currentDate->addDay();
        }

        // Payment details
        $paymentDetails = $cashPayments->map(function($payment) {
            return [
                'payment_id' => $payment->payment_id,
                'sale_number' => $payment->sale->sale_number ?? 'N/A',
                'customer_name' => $payment->sale->customer->name ?? 'Naməlum',
                'branch_name' => $payment->sale->branch->name ?? 'N/A',
                'cashier' => $payment->sale->user->name ?? 'N/A',
                'amount' => $payment->amount,
                'date' => $payment->sale->sale_date->format('Y-m-d H:i'),
                'notes' => $payment->notes
            ];
        });

        // Expense details
        $expenseDetails = $cashExpenses->map(function($expense) {
            return [
                'expense_id' => $expense->expense_id,
                'category' => $expense->category,
                'description' => $expense->description,
                'amount' => $expense->amount,
                'date' => $expense->expense_date->format('Y-m-d'),
                'notes' => $expense->notes
            ];
        });

        return [
            'summary' => [
                'total_cash_sales' => $totalCashSales,
                'total_cash_expenses' => $totalCashExpenses,
                'net_cash_flow' => $netCashFlow,
                'total_transactions' => $cashPayments->count(),
                'total_expenses_count' => $cashExpenses->count(),
                'average_cash_sale' => $cashPayments->count() > 0 ? $totalCashSales / $cashPayments->count() : 0,
            ],
            'daily_breakdown' => $dailyBreakdown,
            'payment_details' => $paymentDetails,
            'expense_details' => $expenseDetails,
            'type' => 'cash_drawer'
        ];
    }
}