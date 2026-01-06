<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\Branch;
use App\Models\Supplier;
use App\Models\SupplierCredit;
use App\Models\GoodsReceipt;
use App\Services\DocumentUploadService;
use App\Services\DashboardService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ExpenseController extends Controller
{
    private DocumentUploadService $documentService;
    private DashboardService $dashboardService;

    public function __construct(DocumentUploadService $documentService, DashboardService $dashboardService)
    {
        $this->middleware('auth');
        $this->middleware('account.access');
        $this->documentService = $documentService;
        $this->dashboardService = $dashboardService;
    }

    public function index(Request $request)
    {
        Gate::authorize('access-account-data');

        $request->validate([
            'search' => 'nullable|string|max:255',
            'category_id' => 'nullable|integer|exists:expense_categories,category_id',
            'branch_id' => 'nullable|integer|exists:branches,id',
            'payment_method' => 'nullable|string|in:cash,card,bank_transfer',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
        ]);

        $accountId = Auth::user()->account_id;
        $perPage = 25;

        // Build unified query using UNION to merge all 3 sources efficiently
        // This allows the database to handle sorting and pagination
        $unifiedQuery = $this->buildUnifiedExpensesQuery($request, $accountId);

        // Paginate the unified query
        $paginatedResults = DB::table(DB::raw("({$unifiedQuery->toSql()}) as unified_expenses"))
            ->mergeBindings($unifiedQuery)
            ->orderByDesc('expense_date')
            ->orderByDesc('id')
            ->paginate($perPage, ['*'], 'page', $request->input('page', 1))
            ->withQueryString();

        // Now load the full models for the paginated results
        $expenseIds = [];
        $supplierCreditIds = [];
        $goodsReceiptIds = [];

        foreach ($paginatedResults->items() as $item) {
            if ($item->type === 'expense') {
                $expenseIds[] = $item->id;
            } elseif ($item->type === 'supplier_credit') {
                $supplierCreditIds[] = $item->id;
            } elseif ($item->type === 'goods_receipt') {
                $goodsReceiptIds[] = $item->id;
            }
        }

        // Load full models with relationships
        $expenses = collect();
        $supplierCredits = collect();
        $goodsReceipts = collect();

        if (!empty($expenseIds)) {
            $expenses = Expense::with(['category', 'branch', 'user', 'supplier'])
                ->whereIn('expense_id', $expenseIds)
                ->get()
                ->keyBy('expense_id');
        }

        if (!empty($supplierCreditIds)) {
            $supplierCredits = SupplierCredit::with(['supplier', 'goodsReceipt'])
                ->whereIn('id', $supplierCreditIds)
                ->get()
                ->keyBy('id');
        }

        if (!empty($goodsReceiptIds)) {
            $goodsReceipts = GoodsReceipt::with(['supplier', 'items.product', 'supplierCredit'])
                ->whereIn('id', $goodsReceiptIds)
                ->get()
                ->keyBy('id');
        }

        // Transform paginated results to include full model data
        $transformedItems = collect($paginatedResults->items())->map(function ($item) use ($expenses, $supplierCredits, $goodsReceipts) {
            if ($item->type === 'expense' && isset($expenses[$item->id])) {
                return $expenses[$item->id];
            } elseif ($item->type === 'supplier_credit' && isset($supplierCredits[$item->id])) {
                $credit = $supplierCredits[$item->id];
                return (object) [
                    'expense_id' => null,
                    'reference_number' => $credit->reference_number,
                    'description' => $credit->description,
                    'amount' => $credit->amount,
                    'remaining_amount' => $credit->remaining_amount,
                    'expense_date' => $credit->credit_date,
                    'due_date' => $credit->due_date,
                    'payment_method' => 'borc',
                    'status' => $credit->status,
                    'type' => 'supplier_credit',
                    'entry_type' => $credit->entry_type ?? 'automatic',
                    'old_system_reference' => $credit->old_system_reference,
                    'supplier' => $credit->supplier,
                    'supplier_id' => $credit->supplier_id,
                    'supplier_credit_id' => $credit->id,
                    'goods_receipt_id' => $credit->goodsReceipt ? $credit->goodsReceipt->id : null,
                    'created_at' => $credit->created_at,
                ];
            } elseif ($item->type === 'goods_receipt' && isset($goodsReceipts[$item->id])) {
                $receipt = $goodsReceipts[$item->id];
                $remainingAmount = $receipt->supplierCredit
                    ? $receipt->supplierCredit->remaining_amount
                    : $receipt->total_cost;

                $itemCount = $receipt->items->count();
                $description = 'Mal Qəbulu';
                if ($itemCount === 1 && $receipt->items->first()->product) {
                    $description .= ' - ' . $receipt->items->first()->product->name;
                } elseif ($itemCount > 1) {
                    $description .= ' - ' . $itemCount . ' məhsul';
                }

                return (object) [
                    'expense_id' => null,
                    'reference_number' => $receipt->receipt_number,
                    'description' => $description,
                    'amount' => $receipt->total_cost,
                    'remaining_amount' => $remainingAmount,
                    'expense_date' => $receipt->created_at,
                    'due_date' => $receipt->due_date,
                    'payment_method' => 'borc',
                    'payment_status' => $receipt->payment_status,
                    'status' => $receipt->payment_status === 'paid' ? 'paid' : 'pending',
                    'type' => 'goods_receipt',
                    'supplier' => $receipt->supplier,
                    'supplier_id' => $receipt->supplier_id,
                    'goods_receipt_id' => $receipt->id,
                    'goods_receipt_data' => $receipt,
                    'created_at' => $receipt->created_at,
                ];
            }
            return null;
        })->filter();

        // Create new paginator with transformed items
        $paginatedExpenses = new \Illuminate\Pagination\LengthAwarePaginator(
            $transformedItems->values(),
            $paginatedResults->total(),
            $perPage,
            $paginatedResults->currentPage(),
            ['path' => $request->url(), 'query' => $request->query()]
        );

        $categories = ExpenseCategory::byAccount($accountId)
            ->active()
            ->with('parent')
            ->get();

        $branches = Branch::byAccount($accountId)->get();

        $suppliers = Supplier::byAccount($accountId)
            ->active()
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        $unpaidGoodsReceipts = GoodsReceipt::where('account_id', $accountId)
            ->whereIn('payment_status', ['unpaid', 'partial'])
            ->with(['supplier:id,name', 'items.product:id,name', 'supplierCredit'])
            ->orderBy('due_date')
            ->orderBy('created_at')
            ->get()
            ->map(function ($receipt) {
                $receipt->total_cost = $receipt->total_cost ?? 0;
                if ($receipt->supplierCredit) {
                    $receipt->supplierCredit->remaining_amount = $receipt->supplierCredit->remaining_amount ?? 0;
                }
                return $receipt;
            });

        return Inertia::render('Expenses/Index', [
            'expenses' => $paginatedExpenses,
            'categories' => $categories,
            'branches' => $branches,
            'paymentMethods' => Expense::getPaymentMethods(),
            'suppliers' => $suppliers,
            'unpaidGoodsReceipts' => $unpaidGoodsReceipts,
            'filters' => $request->only(['search', 'category_id', 'branch_id', 'payment_method', 'date_from', 'date_to']),
        ]);
    }

    /**
     * Build unified query that merges expenses, supplier credits, and goods receipts
     * Uses UNION to let database handle sorting and pagination efficiently
     */
    private function buildUnifiedExpensesQuery(Request $request, int $accountId)
    {
        $searchTerm = $request->filled('search') ? '%' . $request->search . '%' : null;
        $dateFrom = $request->date_from;
        $dateTo = $request->date_to;
        $categoryId = $request->category_id;
        $branchId = $request->branch_id;
        $paymentMethod = $request->payment_method;

        // Query 1: Expenses
        $expensesQuery = DB::table('expenses')
            ->select(
                'expense_id as id',
                'expense_date',
                DB::raw("'expense' as type")
            )
            ->where('account_id', $accountId);

        if ($searchTerm) {
            $expensesQuery->where(function ($q) use ($searchTerm, $accountId) {
                $q->where('description', 'like', $searchTerm)
                  ->orWhere('reference_number', 'like', $searchTerm)
                  ->orWhereIn('category_id', function ($subQ) use ($searchTerm, $accountId) {
                      $subQ->select('category_id')
                          ->from('expense_categories')
                          ->where('account_id', $accountId)
                          ->where('name', 'like', $searchTerm);
                  });
            });
        }

        if ($categoryId) {
            $expensesQuery->where('category_id', $categoryId);
        }

        if ($branchId) {
            $expensesQuery->where('branch_id', $branchId);
        }

        if ($paymentMethod) {
            $expensesQuery->where('payment_method', $paymentMethod);
        }

        if ($dateFrom && $dateTo) {
            $expensesQuery->whereBetween('expense_date', [$dateFrom, $dateTo]);
        }

        // Query 2: Supplier Credits
        $supplierCreditsQuery = DB::table('supplier_credits')
            ->select(
                'id',
                'credit_date as expense_date',
                DB::raw("'supplier_credit' as type")
            )
            ->where('account_id', $accountId)
            ->where('status', '!=', 'paid');

        if ($searchTerm) {
            $supplierCreditsQuery->where(function ($q) use ($searchTerm, $accountId) {
                $q->where('description', 'like', $searchTerm)
                  ->orWhere('reference_number', 'like', $searchTerm)
                  ->orWhereIn('supplier_id', function ($subQ) use ($searchTerm, $accountId) {
                      $subQ->select('id')
                          ->from('suppliers')
                          ->where('account_id', $accountId)
                          ->where('name', 'like', $searchTerm);
                  });
            });
        }

        if ($dateFrom && $dateTo) {
            $supplierCreditsQuery->whereBetween('credit_date', [$dateFrom, $dateTo]);
        }

        // Query 3: Goods Receipts (unpaid/partial, without supplier credit)
        $goodsReceiptsQuery = DB::table('goods_receipts')
            ->select(
                'id',
                'created_at as expense_date',
                DB::raw("'goods_receipt' as type")
            )
            ->where('account_id', $accountId)
            ->whereIn('payment_status', ['unpaid', 'partial'])
            ->whereNull('supplier_credit_id');

        if ($searchTerm) {
            $goodsReceiptsQuery->where(function ($q) use ($searchTerm, $accountId) {
                $q->where('receipt_number', 'like', $searchTerm)
                  ->orWhere('invoice_number', 'like', $searchTerm)
                  ->orWhereIn('supplier_id', function ($subQ) use ($searchTerm, $accountId) {
                      $subQ->select('id')
                          ->from('suppliers')
                          ->where('account_id', $accountId)
                          ->where('name', 'like', $searchTerm);
                  });
            });
        }

        if ($dateFrom && $dateTo) {
            $goodsReceiptsQuery->whereBetween('created_at', [$dateFrom, $dateTo]);
        }

        // Combine all queries with UNION
        return $expensesQuery
            ->union($supplierCreditsQuery)
            ->union($goodsReceiptsQuery);
    }

    public function create(Request $request)
    {
        Gate::authorize('manage-expenses');

        $categories = ExpenseCategory::byAccount(auth()->user()->account_id)
            ->active()
            ->with('parent')
            ->orderBy('name')
            ->get();

        $branches = Branch::byAccount(auth()->user()->account_id)
            ->select('id', 'name', 'address')
            ->get();

        $suppliers = Supplier::where('account_id', auth()->user()->account_id)
            ->where('is_active', true)
            ->select('id', 'name', 'phone')
            ->get();

        // Get unpaid goods receipts with supplier information
        $unpaidGoodsReceipts = GoodsReceipt::where('account_id', auth()->user()->account_id)
            ->where('payment_status', 'unpaid')
            ->with(['supplier:id,name', 'items.product:id,name'])
            ->orderBy('due_date')
            ->orderBy('created_at')
            ->get();

        // Get supplier credit if passed via query param (from "Pay" button in expenses list)
        $supplierCredit = null;
        if ($request->has('supplier_credit_id')) {
            $supplierCredit = \App\Models\SupplierCredit::with(['supplier'])
                ->where('account_id', auth()->user()->account_id)
                ->find($request->supplier_credit_id);
        }

        return Inertia::render('Expenses/Create', [
            'categories' => $categories,
            'branches' => $branches,
            'paymentMethods' => Expense::getPaymentMethods(),
            'suppliers' => $suppliers,
            'unpaidGoodsReceipts' => $unpaidGoodsReceipts,
            'supplierCredit' => $supplierCredit,
        ]);
    }

    public function store(Request $request)
    {
        Gate::authorize('manage-expenses');

        $request->validate([
            'category_id' => 'required|exists:expense_categories,category_id',
            'branch_id' => 'required|exists:branches,id',
            'amount' => 'required|numeric|min:0.01',
            'description' => 'required|string|max:500',
            'expense_date' => 'required|date',
            'payment_method' => 'required|in:cash,card,bank_transfer',
            'notes' => 'nullable|string|max:1000',
            'receipt_file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'supplier_credit_id' => 'nullable|exists:supplier_credits,id',
            'credit_payment_amount' => 'nullable|numeric|min:0.01',
            'goods_receipt_id' => 'nullable|exists:goods_receipts,id',
        ]);

        $receiptPath = null;
        if ($request->hasFile('receipt_file')) {
            $receiptPath = $this->documentService->uploadFile(
                $request->file('receipt_file'),
                'expenses/receipts',
                'receipt_' . time()
            );
        }

        $expense = Expense::create([
            'category_id' => $request->category_id,
            'branch_id' => $request->branch_id,
            'amount' => $request->amount,
            'description' => $request->description,
            'expense_date' => $request->expense_date,
            'payment_method' => $request->payment_method,
            'user_id' => Auth::id(),
            'supplier_id' => $request->supplier_id,
            'supplier_credit_id' => $request->supplier_credit_id,
            'credit_payment_amount' => $request->credit_payment_amount,
            'receipt_file_path' => $receiptPath,
            'notes' => $request->notes,
        ]);

        // If paying supplier credit, update the credit record
        if ($request->supplier_credit_id && $request->credit_payment_amount) {
            $supplierCredit = SupplierCredit::find($request->supplier_credit_id);
            if ($supplierCredit) {
                $supplierCredit->addPayment($request->credit_payment_amount, "Xerc ödəməsi: {$expense->reference_number}");
            }
        }

        // If paying a goods receipt, mark it as paid
        if ($request->goods_receipt_id) {
            $goodsReceipt = GoodsReceipt::find($request->goods_receipt_id);
            if ($goodsReceipt && $goodsReceipt->isUnpaid()) {
                $goodsReceipt->markAsPaid();
            }
        }

        // Clear dashboard cache to reflect new expense
        $this->dashboardService->clearCache(Auth::user()->account);

        return redirect()->route('expenses.index')
                        ->with('success', 'Xerc uğurla yaradıldı');
    }

    public function show(Expense $expense)
    {
        Gate::authorize('access-account-data', $expense);

        $expense->load(['category.parent', 'branch', 'user']);

        return Inertia::render('Expenses/Show', [
            'expense' => $expense,
            'paymentMethods' => Expense::getPaymentMethods(),
        ]);
    }

    public function edit(Expense $expense)
    {
        Gate::authorize('manage-expenses');
        Gate::authorize('access-account-data', $expense);

        $categories = ExpenseCategory::byAccount(auth()->user()->account_id)
            ->active()
            ->with('parent')
            ->orderBy('name')
            ->get();

        $branches = Branch::byAccount(auth()->user()->account_id)
            ->select('id', 'name', 'address')
            ->get();

        return Inertia::render('Expenses/Edit', [
            'expense' => $expense,
            'categories' => $categories,
            'branches' => $branches,
            'paymentMethods' => Expense::getPaymentMethods(),
        ]);
    }

    public function update(Request $request, Expense $expense)
    {
        Gate::authorize('manage-expenses');
        Gate::authorize('access-account-data', $expense);

        // Prevent editing expenses created from instant payment goods receipts
        if ($expense->goods_receipt_id) {
            return back()->withErrors([
                'error' => 'Mal qəbulundan yaradılmış xərcləri redaktə etmək mümkün deyil. Mal qəbulunu redaktə edin.'
            ]);
        }

        $request->validate([
            'category_id' => 'required|exists:expense_categories,category_id',
            'branch_id' => 'required|exists:branches,id',
            'amount' => 'required|numeric|min:0.01',
            'description' => 'required|string|max:500',
            'expense_date' => 'required|date',
            'payment_method' => 'required|in:cash,card,bank_transfer',
            'notes' => 'nullable|string|max:1000',
            'receipt_file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);

        $receiptPath = $expense->receipt_file_path;
        
        if ($request->hasFile('receipt_file')) {
            // Delete old file if exists
            if ($receiptPath && Storage::disk('documents')->exists($receiptPath)) {
                Storage::disk('documents')->delete($receiptPath);
            }
            
            $receiptPath = $this->documentService->uploadFile(
                $request->file('receipt_file'),
                'expenses/receipts',
                'receipt_' . time()
            );
        }

        $expense->update([
            'category_id' => $request->category_id,
            'branch_id' => $request->branch_id,
            'amount' => $request->amount,
            'description' => $request->description,
            'expense_date' => $request->expense_date,
            'payment_method' => $request->payment_method,
            'receipt_file_path' => $receiptPath,
            'notes' => $request->notes,
        ]);

        // Clear dashboard cache to reflect updated expense
        $this->dashboardService->clearCache(Auth::user()->account);

        return redirect()->route('expenses.show', $expense)
                        ->with('success', __('app.updated_successfully'));
    }

    public function destroy(Expense $expense)
    {
        Gate::authorize('manage-expenses');
        Gate::authorize('access-account-data', $expense);

        // Check if this expense is linked to a goods receipt (instant payment)
        // Only admin or account_owner can delete these expenses
        if ($expense->goods_receipt_id) {
            // Check user permission - only admin and account_owner can delete
            if (!Auth::user()->isAdmin() && !Auth::user()->isOwner()) {
                return back()->withErrors([
                    'error' => 'Yalnız administrator və ya hesab sahibi mal qəbulu ödəməsi xərclərini silə bilər.'
                ]);
            }

            try {
                DB::beginTransaction();

                $goodsReceipt = GoodsReceipt::find($expense->goods_receipt_id);

                if (!$goodsReceipt) {
                    DB::rollBack();
                    return back()->withErrors(['error' => 'Mal qəbulu tapılmadı']);
                }

                \Log::info("Deleting instant payment expense", [
                    'expense_id' => $expense->expense_id,
                    'reference_number' => $expense->reference_number,
                    'goods_receipt_id' => $goodsReceipt->id,
                    'amount' => $expense->amount,
                    'user_id' => Auth::id(),
                ]);

                // STEP 1: Update goods receipt status to unpaid
                $goodsReceipt->update([
                    'payment_status' => 'unpaid',
                    'payment_method' => 'credit',
                ]);

                \Log::info("Updated goods receipt status to unpaid", [
                    'receipt_id' => $goodsReceipt->id,
                    'receipt_number' => $goodsReceipt->receipt_number,
                ]);

                // STEP 3: Create or update supplier credit for this goods receipt
                if ($goodsReceipt->supplier_credit_id) {
                    $supplierCredit = SupplierCredit::find($goodsReceipt->supplier_credit_id);
                    if ($supplierCredit) {
                        // Restore credit amount
                        $supplierCredit->remaining_amount = $supplierCredit->amount;
                        $supplierCredit->status = 'pending';
                        $supplierCredit->save();

                        \Log::info("Restored supplier credit", [
                            'credit_id' => $supplierCredit->id,
                            'remaining_amount' => $supplierCredit->remaining_amount,
                        ]);
                    }
                } else {
                    // Create new supplier credit
                    $supplierCredit = $goodsReceipt->createSupplierCredit();

                    \Log::info("Created new supplier credit", [
                        'credit_id' => $supplierCredit->id,
                        'amount' => $supplierCredit->amount,
                    ]);
                }

                // STEP 4: Delete associated receipt file
                if ($expense->receipt_file_path && Storage::disk('documents')->exists($expense->receipt_file_path)) {
                    Storage::disk('documents')->delete($expense->receipt_file_path);
                }

                // STEP 5: Delete the expense WITHOUT triggering deleting hooks (we already handled everything)
                $expense->withoutEvents(function () use ($expense) {
                    $expense->delete();
                });

                \Log::info("Deleted instant payment expense successfully", [
                    'expense_id' => $expense->expense_id,
                    'goods_receipt_id' => $goodsReceipt->id,
                ]);

                DB::commit();

                // Clear dashboard cache to reflect deleted expense
                $this->dashboardService->clearCache(Auth::user()->account);

                return redirect()->route('expenses.index')
                    ->with('success', 'Xerc silindi və mal qəbulu ödənilməmiş statusuna qaytarıldı');

            } catch (\Exception $e) {
                DB::rollBack();
                \Log::error('Error deleting instant payment expense: ' . $e->getMessage(), [
                    'trace' => $e->getTraceAsString(),
                    'expense_id' => $expense->expense_id,
                ]);
                return back()->withErrors([
                    'error' => 'Xerc silinərkən xəta baş verdi: ' . $e->getMessage()
                ]);
            }
        }

        // Check if this expense is a vendor/supplier payment (credit payment)
        // Only admin or account_owner can delete vendor payment expenses
        if ($expense->supplier_credit_id && $expense->credit_payment_amount > 0) {
            if (!Auth::user()->isAdmin() && !Auth::user()->isOwner()) {
                return redirect()->back()
                    ->with('error', 'Yalnız administrator və ya hesab sahibi təchizatçı ödəməsi xərclərini silə bilər.');
            }
        }

        // Delete associated receipt file
        if ($expense->receipt_file_path && Storage::disk('documents')->exists($expense->receipt_file_path)) {
            Storage::disk('documents')->delete($expense->receipt_file_path);
        }

        // Delete expense (deleting hook will handle supplier credit reversal)
        $expense->delete();

        // Clear dashboard cache to reflect deleted expense
        $this->dashboardService->clearCache(Auth::user()->account);

        return redirect()->route('expenses.index')
                        ->with('success', __('app.deleted_successfully'));
    }

    public function search(Request $request)
    {
        Gate::authorize('access-account-data');

        $request->validate([
            'search' => 'nullable|string|max:255',
            'category_id' => 'nullable|integer|exists:expense_categories,category_id',
            'branch_id' => 'nullable|integer|exists:branches,id',
        ]);

        $query = Expense::with(['category', 'branch'])
            ->where('account_id', Auth::user()->account_id);

        if ($request->filled('search')) {
            $searchTerm = $request->search;
            $query->where('description', 'like', '%' . $searchTerm . '%')
                  ->orWhere('reference_number', 'like', '%' . $searchTerm . '%')
                  ->orWhereHas('category', function ($q) use ($searchTerm) {
                      $q->where('name', 'like', '%' . $searchTerm . '%');
                  });
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        $expenses = $query->orderBy('expense_date', 'desc')
                         ->limit(50)
                         ->get();

        return response()->json($expenses);
    }

    public function downloadReceipt(Expense $expense)
    {
        Gate::authorize('access-account-data', $expense);

        if (!$expense->hasReceipt()) {
            abort(404, 'Qaimə tapılmadı');
        }

        $disk = 'documents';
        if (!Storage::disk($disk)->exists($expense->receipt_file_path)) {
            abort(404, 'Qaimə faylı tapılmadı');
        }

        $pathinfo = pathinfo($expense->receipt_file_path);
        $filename = 'receipt_' . $expense->expense_id . '.' . ($pathinfo['extension'] ?? 'file');

        return response()->download(
            Storage::disk($disk)->path($expense->receipt_file_path),
            $filename
        );
    }

    public function viewReceipt(Expense $expense)
    {
        Gate::authorize('access-account-data', $expense);

        if (!$expense->hasReceipt()) {
            abort(404, 'Qaimə tapılmadı');
        }

        $disk = 'documents';
        if (!Storage::disk($disk)->exists($expense->receipt_file_path)) {
            abort(404, 'Qaimə faylı tapılmadı');
        }

        $file = Storage::disk($disk)->get($expense->receipt_file_path);
        // Determine mime type from file extension since Azure storage might not support mimeType() directly
        $extension = pathinfo($expense->receipt_file_path, PATHINFO_EXTENSION);
        $mimeType = match(strtolower($extension)) {
            'pdf' => 'application/pdf',
            'jpg', 'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'gif' => 'image/gif',
            'webp' => 'image/webp',
            'doc' => 'application/msword',
            'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls' => 'application/vnd.ms-excel',
            'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'txt' => 'text/plain',
            'csv' => 'text/csv',
            default => 'application/octet-stream'
        };

        return response($file, 200)
            ->header('Content-Type', $mimeType)
            ->header('Content-Disposition', 'inline');
    }

    /**
     * Process payment for a goods receipt by creating an expense
     * Supports both full and partial payments
     */
    public function payGoodsReceipt(Request $request)
    {
        Gate::authorize('manage-expenses');

        // Check if this is a batch payment
        $isBatchPayment = $request->has('batch_item_ids') && is_array($request->batch_item_ids);

        if ($isBatchPayment) {
            $request->validate([
                'batch_item_ids' => 'required|array',
                'batch_item_ids.*' => 'exists:goods_receipts,id',
                'payment_amount' => 'required|numeric|min:0.01',
                'category_id' => 'required|exists:expense_categories,category_id',
                'branch_id' => 'required|exists:branches,id',
                'payment_method' => 'required|in:cash,card,bank_transfer',
                'notes' => 'nullable|string|max:1000',
            ]);

            // Get all goods receipts in the batch
            $goodsReceipts = GoodsReceipt::with(['supplier', 'items.product', 'supplierCredit'])
                ->where('account_id', auth()->user()->account_id)
                ->whereIn('id', $request->batch_item_ids)
                ->get();

            if ($goodsReceipts->isEmpty()) {
                return back()->withErrors(['message' => 'Mal qəbulları tapılmadı']);
            }

            // All items should have the same supplier
            $supplierIds = $goodsReceipts->pluck('supplier_id')->unique();
            if ($supplierIds->count() > 1) {
                return back()->withErrors(['message' => 'Bütün mal qəbulları eyni təchizatçıya aid olmalıdır']);
            }

            return $this->processBatchPayment($request, $goodsReceipts);
        } else {
            $request->validate([
                'goods_receipt_id' => 'required|exists:goods_receipts,id',
                'payment_amount' => 'required|numeric|min:0.01',
                'category_id' => 'required|exists:expense_categories,category_id',
                'branch_id' => 'required|exists:branches,id',
                'payment_method' => 'required|in:cash,card,bank_transfer',
                'notes' => 'nullable|string|max:1000',
            ]);
        }

        $goodsReceipt = GoodsReceipt::with(['supplier', 'items.product', 'supplierCredit'])
            ->where('account_id', auth()->user()->account_id)
            ->findOrFail($request->goods_receipt_id);

        // Check if goods receipt is already fully paid
        if ($goodsReceipt->payment_status === 'paid') {
            return back()->withErrors(['message' => 'Bu mal qəbulu artıq tam ödənilib']);
        }

        // Ensure supplier credit exists
        if (!$goodsReceipt->supplierCredit) {
            return back()->withErrors(['message' => 'Bu mal qəbulu üçün təchizatçı krediti tapılmadı']);
        }

        $paymentAmount = (float) $request->payment_amount;
        $remainingAmount = (float) $goodsReceipt->supplierCredit->remaining_amount;

        // Validate payment amount doesn't exceed remaining amount
        if ($paymentAmount > $remainingAmount) {
            return back()->withErrors([
                'payment_amount' => "Ödəniş məbləği qalıq borcdan çox ola bilməz. Qalıq: {$remainingAmount} AZN"
            ]);
        }

        try {
            DB::beginTransaction();

            // Create expense record for the payment
            $expense = Expense::create([
                'account_id' => auth()->user()->account_id,
                'category_id' => $request->category_id,
                'branch_id' => $request->branch_id,
                'amount' => $paymentAmount,
                'description' => "Mal qəbulu ödəməsi - {$goodsReceipt->receipt_number}",
                'expense_date' => now()->format('Y-m-d'),
                'payment_method' => $request->payment_method,
                'user_id' => Auth::id(),
                'supplier_id' => $goodsReceipt->supplier_id,
                'supplier_credit_id' => $goodsReceipt->supplier_credit_id,
                'credit_payment_amount' => $paymentAmount,
                'goods_receipt_id' => $goodsReceipt->id,
                'notes' => $request->notes,
            ]);

            // Update supplier credit with the payment
            $supplierCredit = $goodsReceipt->supplierCredit;
            $supplierCredit->addPayment(
                $paymentAmount,
                "Xerc ödəməsi: {$expense->reference_number}"
            );

            // Update goods receipt payment status
            if ($supplierCredit->remaining_amount == 0) {
                // Fully paid
                $goodsReceipt->update(['payment_status' => 'paid']);
            } else {
                // Partially paid
                $goodsReceipt->update(['payment_status' => 'partial']);
            }

            DB::commit();

            // Clear dashboard cache to reflect goods receipt payment
            $this->dashboardService->clearCache(auth()->user()->account);

            return back()->with('success',
                $supplierCredit->remaining_amount == 0
                    ? 'Mal qəbulu tam ödənilib'
                    : "Qismən ödəniş uğurla tamamlandı. Qalıq: {$supplierCredit->remaining_amount} AZN"
            );

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error processing goods receipt payment: ' . $e->getMessage());
            return back()->withErrors([
                'message' => 'Ödəniş zamanı xəta baş verdi: ' . $e->getMessage()
            ]);
        }
    }

    public function bulkDelete(Request $request)
    {
        Gate::authorize('delete-account-data');

        $validated = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'required|integer|exists:expenses,expense_id',
        ]);

        $user = Auth::user();
        $deletedCount = 0;
        $failedExpenses = [];

        DB::beginTransaction();

        try {
            $expenses = Expense::whereIn('expense_id', $validated['ids'])
                ->where('account_id', $user->account_id)
                ->get();

            foreach ($expenses as $expense) {
                try {
                    // Check if this expense is linked to a goods receipt (instant payment)
                    // Only admin or account_owner can delete these expenses
                    if ($expense->goods_receipt_id) {
                        if (!$user->isAdmin() && !$user->isOwner()) {
                            $failedExpenses[] = $expense->reference_number . ' (yalnız administrator və ya hesab sahibi mal qəbulu ödəməsi xərclərini silə bilər)';
                            continue;
                        }
                    }

                    // Check if this expense is a vendor/supplier payment (credit payment)
                    // Only admin or account_owner can delete vendor payment expenses
                    if ($expense->supplier_credit_id && $expense->credit_payment_amount > 0) {
                        if (!$user->isAdmin() && !$user->isOwner()) {
                            $failedExpenses[] = $expense->reference_number . ' (yalnız administrator və ya hesab sahibi təchizatçı ödəməsi xərclərini silə bilər)';
                            continue;
                        }
                    }

                    // For goods receipt instant payments, we need to handle the reversal
                    if ($expense->goods_receipt_id) {
                        $goodsReceipt = GoodsReceipt::find($expense->goods_receipt_id);

                        if (!$goodsReceipt) {
                            $failedExpenses[] = $expense->reference_number . ' (mal qəbulu tapılmadı)';
                            continue;
                        }

                        // Update goods receipt status to unpaid
                        $goodsReceipt->update([
                            'payment_status' => 'unpaid',
                            'payment_method' => 'credit',
                        ]);

                        // Create or update supplier credit for this goods receipt
                        if ($goodsReceipt->supplier_credit_id) {
                            $supplierCredit = SupplierCredit::find($goodsReceipt->supplier_credit_id);
                            if ($supplierCredit) {
                                // Restore credit amount
                                $supplierCredit->remaining_amount = $supplierCredit->amount;
                                $supplierCredit->status = 'pending';
                                $supplierCredit->save();
                            }
                        } else {
                            // Create new supplier credit
                            $goodsReceipt->createSupplierCredit();
                        }
                    }

                    // Delete associated receipt file
                    if ($expense->receipt_file_path && Storage::disk('documents')->exists($expense->receipt_file_path)) {
                        Storage::disk('documents')->delete($expense->receipt_file_path);
                    }

                    // Delete expense
                    $expense->delete();
                    $deletedCount++;

                } catch (\Exception $e) {
                    \Log::error('Error deleting expense in bulk: ' . $e->getMessage(), [
                        'expense_id' => $expense->expense_id,
                    ]);
                    $failedExpenses[] = $expense->reference_number . ' (xəta baş verdi)';
                }
            }

            DB::commit();

            // Clear dashboard cache to reflect deleted expenses
            $this->dashboardService->clearCache($user->account);

            // Build response message
            if ($deletedCount > 0 && count($failedExpenses) === 0) {
                return redirect()->back()->with('success', "{$deletedCount} xerc uğurla silindi");
            } elseif ($deletedCount > 0 && count($failedExpenses) > 0) {
                $failedList = implode(', ', $failedExpenses);
                return redirect()->back()->with('success', "{$deletedCount} xerc silindi. Silinməyənlər: {$failedList}");
            } else {
                $failedList = implode(', ', $failedExpenses);
                return redirect()->back()->with('error', "Heç bir xerc silinmədi. Səbəblər: {$failedList}");
            }

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Bulk expense deletion failed: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Xərcləri silmək zamanı xəta baş verdi: ' . $e->getMessage());
        }
    }

    /**
     * Process payment for multiple goods receipts in a batch
     */
    private function processBatchPayment(Request $request, $goodsReceipts)
    {
        $paymentAmount = (float) $request->payment_amount;
        $totalRemainingAmount = 0;
        $firstReceipt = $goodsReceipts->first();

        // Calculate total remaining amount for all items
        foreach ($goodsReceipts as $receipt) {
            if ($receipt->supplierCredit) {
                $totalRemainingAmount += (float) $receipt->supplierCredit->remaining_amount;
            }
        }

        // Validate payment amount doesn't exceed total remaining amount
        if ($paymentAmount > $totalRemainingAmount) {
            return back()->withErrors([
                'payment_amount' => "Ödəniş məbləği ümumi qalıq borcdan çox ola bilməz. Qalıq: {$totalRemainingAmount} AZN"
            ]);
        }

        try {
            DB::beginTransaction();

            // Create a single expense for the batch
            $receiptNumbers = $goodsReceipts->pluck('receipt_number')->join(', ');
            $itemCount = $goodsReceipts->count();

            $expense = Expense::create([
                'account_id' => auth()->user()->account_id,
                'category_id' => $request->category_id,
                'branch_id' => $request->branch_id,
                'amount' => $paymentAmount,
                'description' => "Qrup ödəməsi - {$itemCount} mal qəbulu ({$receiptNumbers})",
                'expense_date' => now()->format('Y-m-d'),
                'payment_method' => $request->payment_method,
                'user_id' => Auth::id(),
                'supplier_id' => $firstReceipt->supplier_id,
                'notes' => $request->notes ? $request->notes . " (Qəbul nömrələri: {$receiptNumbers})" : "Qəbul nömrələri: {$receiptNumbers}",
            ]);

            // Distribute payment across all receipts proportionally
            $remainingPayment = $paymentAmount;

            foreach ($goodsReceipts as $index => $receipt) {
                if (!$receipt->supplierCredit) {
                    continue;
                }

                $creditRemaining = (float) $receipt->supplierCredit->remaining_amount;

                // For the last item, use all remaining payment to avoid rounding issues
                if ($index === $goodsReceipts->count() - 1) {
                    $itemPayment = $remainingPayment;
                } else {
                    // Distribute proportionally
                    $itemPayment = min($creditRemaining, ($creditRemaining / $totalRemainingAmount) * $paymentAmount);
                    $itemPayment = round($itemPayment, 2);
                }

                if ($itemPayment > 0) {
                    // Update supplier credit with the payment
                    $receipt->supplierCredit->addPayment(
                        $itemPayment,
                        "Xerc ödəməsi (Partiya): {$expense->reference_number}"
                    );

                    // Update goods receipt payment status
                    if ($receipt->supplierCredit->remaining_amount == 0) {
                        $receipt->update(['payment_status' => 'paid']);
                    } else {
                        $receipt->update(['payment_status' => 'partial']);
                    }

                    $remainingPayment -= $itemPayment;
                }
            }

            DB::commit();

            // Clear dashboard cache to reflect batch payment
            $this->dashboardService->clearCache(auth()->user()->account);

            return back()->with('success', "Partiya ödənişi uğurla tamamlandı. Ödənildi: {$paymentAmount} AZN");

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error processing batch payment: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'batch_item_ids' => $request->batch_item_ids ?? null,
            ]);
            return back()->withErrors([
                'message' => 'Ödəniş zamanı xəta baş verdi: ' . $e->getMessage() . ' (Sətir: ' . $e->getLine() . ')'
            ]);
        }
    }
}