<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Customer;
use App\Models\Branch;
use App\Models\ProductStock;
use App\Models\NegativeStockAlert;
use App\Models\StockMovement;
use App\Models\ReceiptTemplate;
use App\Services\ThermalPrintService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class SaleController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
        $this->middleware('account.access');
    }

    public function search(Request $request)
    {
        Gate::authorize('access-account-data');

        $request->validate([
            'q' => 'required|string|max:255',
        ]);

        $searchTerm = $request->input('q');
        
        $query = Sale::with(['customer', 'branch'])
            ->where('account_id', Auth::user()->account_id)
            ->countable() // Only include POS sales + completed online orders
            ->where(function($q) use ($searchTerm) {
                $q->where('sale_number', 'like', '%' . $searchTerm . '%')
                  ->orWhereHas('customer', function($q) use ($searchTerm) {
                      $q->where('name', 'like', '%' . $searchTerm . '%');
                  });
            });

        // Filter by sales_staff's branch if user is sales_staff
        if (Auth::user()->role === 'sales_staff') {
            $query->where('branch_id', Auth::user()->branch_id);
        }
        
        $sales = $query->limit(10)
            ->get(['sale_id', 'sale_number', 'total', 'status']);

        return response()->json($sales);
    }

    public function index(Request $request)
    {
        Gate::authorize('access-account-data');

        $request->validate([
            'search' => 'nullable|string|max:255',
            'status' => 'nullable|string|in:pending,completed,cancelled',
            'branch_id' => 'nullable|integer|exists:branches,id',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
            'has_negative_stock' => 'nullable|boolean',
            'payment_status' => 'nullable|string|in:paid,credit,partial',
            'online' => 'nullable|boolean',
        ]);

        $query = Sale::with(['customer', 'branch', 'user', 'items.product', 'customerCredit'])
            ->where('account_id', Auth::user()->account_id)
            ->countable(); // Only include POS sales + completed online orders

        // Filter by sales_staff's branch if user is sales_staff
        if (Auth::user()->role === 'sales_staff') {
            $query->where('branch_id', Auth::user()->branch_id);
        }

        // Search by sale number, customer name, customer phone
        if ($request->filled('search')) {
            $searchTerm = $request->input('search');
            $query->where(function($q) use ($searchTerm) {
                $q->where('sale_number', 'like', '%' . $searchTerm . '%')
                  ->orWhere('notes', 'like', '%' . $searchTerm . '%')
                  ->orWhereHas('customer', function($q) use ($searchTerm) {
                      $q->where('name', 'like', '%' . $searchTerm . '%')
                        ->orWhere('phone', 'like', '%' . $searchTerm . '%')
                        ->orWhere('email', 'like', '%' . $searchTerm . '%');
                  });
            });
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by branch
        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        // Filter by date range
        if ($request->filled('date_from')) {
            $query->whereDate('sale_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('sale_date', '<=', $request->date_to);
        }

        // Filter by negative stock
        if ($request->filled('has_negative_stock')) {
            $query->where('has_negative_stock', $request->boolean('has_negative_stock'));
        }

        // Filter by payment status
        if ($request->filled('payment_status')) {
            $query->where('payment_status', $request->payment_status);
        }

        // Filter by online orders
        if ($request->filled('online')) {
            $query->where('is_online_order', $request->boolean('online'));
        }

        $sales = $query->latest('sale_date')
            ->paginate(25)
            ->withQueryString();

        $branches = Branch::select('id', 'name')->get();

        // Get summary statistics for the selected date (default to today)
        $summaryDate = $request->input('summary_date', now()->format('Y-m-d'));
        $dailySummary = $this->getDailySummary($summaryDate);

        return Inertia::render('Sales/Index', [
            'sales' => $sales,
            'filters' => $request->only(['search', 'status', 'branch_id', 'date_from', 'date_to', 'has_negative_stock', 'payment_status']),
            'branches' => $branches,
            'dailySummary' => $dailySummary,
            'summaryDate' => $summaryDate,
        ]);
    }

    public function create()
    {
        Gate::authorize('create-account-data');

        $customers = Customer::active()->select('id', 'name', 'phone')->get();
        
        // Branch filtering based on user role
        if (Auth::user()->role === 'sales_staff') {
            // Salesmen only see their assigned branch
            $branches = Branch::where('id', Auth::user()->branch_id)
                ->select('id', 'name')->get();
        } else {
            // Other roles see all branches
            $branches = Branch::select('id', 'name')->get();
        }
        
        // Don't preload products - use AJAX search instead for better performance

        return Inertia::render('Sales/Create', [
            'customers' => $customers,
            'branches' => $branches,
        ]);
    }

    public function store(Request $request)
    {
        Gate::authorize('create-account-data');

        // Base validation rules
        $rules = [
            'customer_id' => 'nullable|exists:customers,id',
            'branch_id' => 'required|exists:branches,id',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:0.001',
            'items.*.base_quantity' => 'nullable|numeric|min:0.001', // For inventory deduction
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.discount_amount' => 'nullable|numeric|min:0',
            'tax_amount' => 'nullable|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
            // is_credit_sale removed - now determined by presence of credit_amount
            'credit_amount' => 'nullable|numeric|min:0',
            'credit_due_date' => 'nullable|date|after:today',
            'credit_description' => 'nullable|string|max:500',
        ];

        // Add payment validation only if not a full credit sale
        if (!$request->input('credit_amount') || $request->input('credit_amount', 0) < $request->input('total', 0)) {
            $rules['payments'] = 'required|array|min:1';
            $rules['payments.*.method'] = 'required|in:nağd,kart,köçürmə';
            $rules['payments.*.amount'] = 'required|numeric|min:0';
            $rules['payments.*.transaction_id'] = 'nullable|string|max:255';
            $rules['payments.*.card_type'] = 'nullable|string|max:50';
            $rules['payments.*.reference_number'] = 'nullable|string|max:255';
            $rules['payments.*.notes'] = 'nullable|string|max:1000';
        } else {
            // For full credit sales, payments are optional
            $rules['payments'] = 'nullable|array';
            $rules['payments.*.method'] = 'nullable|in:nağd,kart,köçürmə';
            $rules['payments.*.amount'] = 'nullable|numeric|min:0';
            $rules['payments.*.transaction_id'] = 'nullable|string|max:255';
            $rules['payments.*.card_type'] = 'nullable|string|max:50';
            $rules['payments.*.reference_number'] = 'nullable|string|max:255';
            $rules['payments.*.notes'] = 'nullable|string|max:1000';
        }

        $validated = $request->validate($rules);

        $sale = DB::transaction(function() use ($validated) {
            $accountId = Auth::user()->account_id;
            $userId = Auth::id();

            // Calculate totals
            $subtotal = 0;
            $hasNegativeStock = false;

            foreach ($validated['items'] as $item) {
                $itemTotal = ($item['quantity'] * $item['unit_price']) - ($item['discount_amount'] ?? 0);
                $subtotal += $itemTotal;

                // Check stock levels - use base_quantity for inventory deduction
                $product = Product::find($item['product_id']);
                $totalStock = ProductStock::where('product_id', $item['product_id'])->sum('quantity');
                $deductionQuantity = $item['base_quantity'] ?? $item['quantity'];
                
                if ($totalStock < $deductionQuantity && !$product->allow_negative_stock) {
                    throw new \Exception("Məhsul '{$product->name}' üçün kifayət qədər stok yoxdur. Mövcud: {$totalStock}, tələb olunan: {$deductionQuantity}");
                }

                if ($totalStock < $deductionQuantity) {
                    $hasNegativeStock = true;
                }
            }

            $taxAmount = $validated['tax_amount'] ?? 0;
            $discountAmount = $validated['discount_amount'] ?? 0;
            $total = $subtotal + $taxAmount - $discountAmount;

            // Create sale
            $sale = Sale::create([
                'account_id' => $accountId,
                'branch_id' => $validated['branch_id'],
                'customer_id' => $validated['customer_id'],
                'subtotal' => $subtotal,
                'tax_amount' => $taxAmount,
                'discount_amount' => $discountAmount,
                'total' => $total,
                'status' => 'completed',
                'has_negative_stock' => $hasNegativeStock,
                'user_id' => $userId,
                'notes' => $validated['notes'],
                'sale_date' => now(),
                // is_credit_sale field removed - now determined by customer_credit_id
                'credit_due_date' => $validated['credit_due_date'] ?? null,
            ]);

            // Create sale items and update stock
            foreach ($validated['items'] as $item) {
                $product = Product::find($item['product_id']);
                $currentStock = ProductStock::where('product_id', $item['product_id'])->sum('quantity');
                $deductionQuantity = $item['base_quantity'] ?? $item['quantity'];

                SaleItem::create([
                    'sale_id' => $sale->sale_id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'], // Selling quantity (what customer buys)
                    'unit_price' => $item['unit_price'],
                    'discount_amount' => $item['discount_amount'] ?? 0,
                    'total' => ($item['quantity'] * $item['unit_price']) - ($item['discount_amount'] ?? 0),
                    'stock_level_at_sale' => $currentStock,
                ]);

                // Update stock levels using base_quantity for proper inventory deduction
                $this->updateProductStock($item['product_id'], $deductionQuantity, $sale);

                // Create negative stock alert if needed
                if ($currentStock < $item['quantity']) {
                    NegativeStockAlert::create([
                        'sale_id' => $sale->sale_id,
                        'product_id' => $item['product_id'],
                        'quantity_sold' => $item['quantity'],
                        'stock_level' => $currentStock - $item['quantity'],
                        'status' => 'active',
                    ]);
                }
            }

            // Create payments if any
            if (!empty($validated['payments'])) {
                foreach ($validated['payments'] as $payment) {
                    Payment::create([
                        'sale_id' => $sale->sale_id,
                        'method' => $payment['method'],
                        'amount' => $payment['amount'],
                        'transaction_id' => $payment['transaction_id'] ?? null,
                        'card_type' => $payment['card_type'] ?? null,
                        'reference_number' => $payment['reference_number'] ?? null,
                        'notes' => $payment['notes'] ?? null,
                    ]);
                }
            }

            // Handle credit sale if specified
            if ($validated['credit_amount'] && $validated['credit_amount'] > 0) {
                $creditAmount = $validated['credit_amount'];
                $totalPaid = !empty($validated['payments']) ? array_sum(array_column($validated['payments'], 'amount')) : 0;
                
                // Validate that payments + credit = total
                if (($totalPaid + $creditAmount) != $sale->total) {
                    throw new \Exception('Ödəmə məbləği və borc məbləği cəmi ümumi məbləğə bərabər olmalıdır.');
                }
                
                $sale->setAsCredit(
                    $creditAmount, 
                    $validated['credit_due_date'], 
                    $validated['credit_description']
                );
            }

            return $sale;
        });

        return redirect()->route('sales.show', $sale)
            ->with('success', 'Satış uğurla tamamlandı.');
    }

    public function show(Sale $sale)
    {
        Gate::authorize('access-account-data');

        // Verify sale belongs to current account
        if ($sale->account_id !== Auth::user()->account_id) {
            abort(403);
        }

        $sale->load(['customer', 'branch', 'user', 'items.product', 'payments', 'negativeStockAlerts.product', 'customerCredit']);

        return Inertia::render('Sales/Show', [
            'sale' => $sale,
        ]);
    }

    public function edit(Sale $sale)
    {
        Gate::authorize('edit-account-data');

        // Verify sale belongs to current account
        if ($sale->account_id !== Auth::user()->account_id) {
            abort(403);
        }

        // Allow editing for payment-related changes, restrict only for refunded sales
        if ($sale->status === 'refunded') {
            return redirect()->route('sales.show', $sale)
                ->with('error', 'Geri qaytarılmış satış dəyişdirilə bilməz.');
        }

        // Reload fresh data from database
        $sale = Sale::with(['customer', 'payments', 'customerCredit'])
            ->findOrFail($sale->sale_id);
        $customers = Customer::active()->select('id', 'name', 'phone')->get();

        return Inertia::render('Sales/Edit', [
            'sale' => $sale,
            'customers' => $customers,
        ]);
    }

    public function update(Request $request, Sale $sale)
    {
        Gate::authorize('edit-account-data');

        // Allow limited editing for completed sales (mainly for customer assignment and notes)
        if ($sale->status === 'refunded') {
            return redirect()->route('sales.show', $sale)
                ->with('error', 'Geri qaytarılmış satış dəyişdirilə bilməz.');
        }

        $validated = $request->validate([
            'customer_id' => 'nullable|exists:customers,id',
            'notes' => 'nullable|string|max:1000',
            'status' => 'required|in:pending,completed,cancelled',
            'credit_due_date' => 'nullable|date',
        ]);

        // For completed sales, only allow customer assignment and notes changes
        if ($sale->status === 'completed') {
            $sale->update([
                'customer_id' => $validated['customer_id'],
                'notes' => $validated['notes'],
            ]);
        } else {
            // For pending/cancelled sales, allow all changes
            $sale->update([
                'customer_id' => $validated['customer_id'],
                'notes' => $validated['notes'],
                'status' => $validated['status'],
            ]);
        }

        // Update credit information if it's a credit sale
        if ($sale->customer_credit_id && $sale->customerCredit) {
            $sale->customerCredit->update([
                'due_date' => $validated['credit_due_date'],
            ]);
            
            // Update credit amount in sale model to match customer credit remaining amount
            $sale->update([
                'credit_amount' => $sale->customerCredit->remaining_amount,
            ]);
        }

        return redirect()->route('sales.show', $sale)
            ->with('success', 'Satış məlumatları yeniləndi.');
    }

    public function destroy(Sale $sale)
    {
        Gate::authorize('delete-account-data');

        if ($sale->status === 'completed') {
            return redirect()->route('sales.index')
                ->with('error', 'Tamamlanmış satış silinə bilməz.');
        }

        $sale->delete();

        return redirect()->route('sales.index')
            ->with('success', 'Satış silindi.');
    }

    private function updateProductStock(int $productId, float $quantity, Sale $sale): void
    {
        // Get the branch and its accessible warehouses
        $branch = Branch::find($sale->branch_id);

        if (!$branch) {
            return; // No branch found, skip stock update
        }

        // Get the first warehouse that the branch can modify stock for
        $warehouse = $branch->warehouses()
            ->wherePivot('can_modify_stock', true)
            ->first();

        // If no accessible warehouse with modify permissions, fall back to main warehouse
        if (!$warehouse) {
            $warehouse = \App\Models\Warehouse::where('account_id', $sale->account_id)
                ->where('type', 'main')
                ->first();
        }

        if ($warehouse) {
            // Update product stock
            $productStock = ProductStock::firstOrCreate([
                'product_id' => $productId,
                'warehouse_id' => $warehouse->id,
                'account_id' => auth()->user()->account_id,
            ], [
                'quantity' => 0,
                'min_level' => 3,
            ]);

            $productStock->decrement('quantity', $quantity);

            // Create stock movement record
            StockMovement::create([
                'account_id' => $sale->account_id,
                'warehouse_id' => $warehouse->id,
                'product_id' => $productId,
                'movement_type' => 'xaric_olma',
                'quantity' => -$quantity,
                'reference_type' => 'sale',
                'reference_id' => $sale->sale_id,
                'employee_id' => null, // User is not necessarily an employee
                'notes' => "Satış #{$sale->sale_number} üçün xaric olma",
            ]);
        }
    }

    /**
     * Print sale receipt
     */
    public function print(Request $request, Sale $sale)
    {
        Gate::authorize('access-account-data');

        $validated = $request->validate([
            'template_id' => 'nullable|exists:receipt_templates,template_id',
        ]);

        try {
            $printService = new ThermalPrintService();
            $result = $printService->generateSaleReceipt(
                $sale,
                $validated['template_id'] ?? null
            );

            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Send print to thermal printer
     */
    public function sendToPrinter(Request $request, Sale $sale)
    {
        Gate::authorize('access-account-data');

        $validated = $request->validate([
            'template_id' => 'nullable|exists:receipt_templates,template_id',
        ]);

        try {
            $printService = new ThermalPrintService();
            $result = $printService->generateSaleReceipt(
                $sale,
                $validated['template_id'] ?? null
            );

            if ($result['success']) {
                $printResult = $printService->printContent(
                    $result['content'],
                    $result['printer_config']
                );

                return response()->json($printResult);
            }

            return response()->json($result, 400);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Get available templates and printers for print modal
     */
    public function getPrintOptions(Sale $sale)
    {
        Gate::authorize('access-account-data');

        $templates = ReceiptTemplate::where('account_id', Auth::user()->account_id)
            ->where('type', 'sale')
            ->where('is_active', true)
            ->orderBy('is_default', 'desc')
            ->orderBy('name')
            ->get(['template_id', 'name', 'is_default']);

        return response()->json([
            'templates' => $templates,
            // Note: Printer configs disabled - using standard PC printing
        ]);
    }

    public function makeCredit(Request $request, Sale $sale)
    {
        Gate::authorize('edit-account-data', $sale);

        $validated = $request->validate([
            'credit_amount' => 'required|numeric|min:0.01|max:' . $sale->total,
            'credit_due_date' => 'nullable|date|after:today',
            'credit_description' => 'nullable|string|max:500',
        ]);

        try {
            $sale->setAsCredit(
                $validated['credit_amount'], 
                $validated['credit_due_date'], 
                $validated['credit_description']
            );

            return redirect()->back()->with('success', 'Satış borc statusu uğurla dəyişdirildi.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function paySaleCredit(Request $request, Sale $sale)
    {
        Gate::authorize('edit-account-data', $sale);

        if (!$sale->hasUnpaidCredit() || !$sale->customer_credit_id) {
            return back()->withErrors(['error' => 'Bu satış üçün ödənilməmiş borc yoxdur.']);
        }

        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01|max:' . ($sale->customerCredit?->remaining_amount ?? $sale->credit_amount),
            'description' => 'nullable|string|max:500',
            'method' => 'nullable|string|in:nağd,kart,köçürmə|default:nağd',
        ]);

        try {
            $customerCredit = $sale->customerCredit;
            if ($customerCredit && $customerCredit->addPayment($validated['amount'], $validated['description'])) {
                // Create a Payment record for this credit payment
                Payment::create([
                    'sale_id' => $sale->sale_id,
                    'method' => $validated['method'] ?? 'nağd',
                    'amount' => $validated['amount'],
                    'notes' => 'Kredit ödəməsi: ' . ($validated['description'] ?: ''),
                    'transaction_id' => null,
                    'card_type' => null,
                    'reference_number' => $customerCredit->reference_number,
                ]);

                // Synchronize sale credit amount with customer credit remaining amount
                $sale->credit_amount = $customerCredit->remaining_amount;
                $sale->save();

                return redirect()->route('sales.edit', $sale)->with('success', 'Satış borcu ödəməsi uğurla edildi.');
            }

            return back()->withErrors(['error' => 'Ödəmə zamanı xəta baş verdi.']);
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Get daily summary statistics for the sales page
     */
    private function getDailySummary($date = null)
    {
        $accountId = Auth::user()->account_id;

        // Use provided date or default to today
        $selectedDate = $date ? \Carbon\Carbon::parse($date)->startOfDay() : now()->startOfDay();
        $previousDate = \Carbon\Carbon::parse($selectedDate)->subDay()->startOfDay();

        // Base query for selected date's sales
        $selectedDateQuery = Sale::where('account_id', $accountId)
            ->whereDate('sale_date', $selectedDate)
            ->where('status', 'completed');

        // Filter by sales_staff's branch if user is sales_staff
        if (Auth::user()->role === 'sales_staff') {
            $selectedDateQuery->where('branch_id', Auth::user()->branch_id);
        }

        // Selected date totals
        $selectedTotal = $selectedDateQuery->sum('total');
        $selectedCount = $selectedDateQuery->count();

        // Payment breakdown - get payments for selected date's sales
        $selectedPayments = Payment::whereHas('sale', function($q) use ($accountId, $selectedDate) {
                $query = $q->where('account_id', $accountId)
                    ->whereDate('sale_date', $selectedDate)
                    ->where('status', 'completed');

                if (Auth::user()->role === 'sales_staff') {
                    $query->where('branch_id', Auth::user()->branch_id);
                }
            })
            ->selectRaw('method, SUM(amount) as total')
            ->groupBy('method')
            ->get();

        $cashTotal = $selectedPayments->where('method', 'nağd')->first()->total ?? 0;
        $cardTotal = $selectedPayments->where('method', 'kart')->first()->total ?? 0;
        $transferTotal = $selectedPayments->where('method', 'köçürmə')->first()->total ?? 0;

        // Selected date's credit (unpaid amount) - clone query to avoid mutation
        $selectedCreditQuery = clone $selectedDateQuery;
        $selectedCredit = $selectedCreditQuery->whereIn('payment_status', ['credit', 'partial'])->sum('credit_amount');

        // Previous date's total for comparison
        $previousDateQuery = Sale::where('account_id', $accountId)
            ->whereDate('sale_date', $previousDate)
            ->where('status', 'completed');

        if (Auth::user()->role === 'sales_staff') {
            $previousDateQuery->where('branch_id', Auth::user()->branch_id);
        }

        $previousTotal = $previousDateQuery->sum('total');

        // Calculate percentage change
        $percentageChange = 0;
        if ($previousTotal > 0) {
            $percentageChange = (($selectedTotal - $previousTotal) / $previousTotal) * 100;
        } elseif ($selectedTotal > 0 && $previousTotal == 0) {
            $percentageChange = 100;
        }

        return [
            'today_total' => round($selectedTotal, 2),
            'today_count' => $selectedCount,
            'cash_total' => round($cashTotal, 2),
            'card_total' => round($cardTotal, 2),
            'transfer_total' => round($transferTotal, 2),
            'today_credit' => round($selectedCredit, 2),
            'yesterday_total' => round($previousTotal, 2),
            'percentage_change' => round($percentageChange, 1),
            'selected_date' => $selectedDate->format('Y-m-d'),
            'previous_date' => $previousDate->format('Y-m-d'),
        ];
    }
}
