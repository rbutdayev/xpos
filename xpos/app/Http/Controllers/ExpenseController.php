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

        $query = Expense::with(['category', 'branch', 'user', 'supplier'])
            ->where('account_id', Auth::user()->account_id);

        if ($request->filled('search')) {
            $searchTerm = $request->search;
            $query->where(function ($q) use ($searchTerm) {
                $q->where('description', 'like', '%' . $searchTerm . '%')
                  ->orWhere('reference_number', 'like', '%' . $searchTerm . '%')
                  ->orWhereHas('category', function ($subQ) use ($searchTerm) {
                      $subQ->where('name', 'like', '%' . $searchTerm . '%');
                  });
            });
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->filled('payment_method')) {
            $query->where('payment_method', $request->payment_method);
        }

        if ($request->filled('date_from') && $request->filled('date_to')) {
            $query->whereBetween('expense_date', [$request->date_from, $request->date_to]);
        }

        $expenses = $query->latest('expense_date')->get();

        // Get supplier credits (unpaid goods receipts) to show in expenses list
        $supplierCreditsQuery = \App\Models\SupplierCredit::with(['supplier', 'goodsReceipt'])
            ->where('account_id', Auth::user()->account_id)
            ->where('status', '!=', 'paid'); // Show pending and partial

        // Apply same filters to supplier credits
        if ($request->filled('search')) {
            $searchTerm = $request->search;
            $supplierCreditsQuery->where(function ($q) use ($searchTerm) {
                $q->where('description', 'like', '%' . $searchTerm . '%')
                  ->orWhere('reference_number', 'like', '%' . $searchTerm . '%')
                  ->orWhereHas('supplier', function ($subQ) use ($searchTerm) {
                      $subQ->where('name', 'like', '%' . $searchTerm . '%');
                  });
            });
        }

        if ($request->filled('date_from') && $request->filled('date_to')) {
            $supplierCreditsQuery->whereBetween('credit_date', [$request->date_from, $request->date_to]);
        }

        $supplierCredits = $supplierCreditsQuery->latest('credit_date')->get();

        // Transform supplier credits to match expense structure for display
        $supplierCreditsAsExpenses = $supplierCredits->map(function ($credit) {
            return (object) [
                'expense_id' => null, // No expense_id for supplier credits
                'reference_number' => $credit->reference_number,
                'description' => $credit->description,
                'amount' => $credit->amount,
                'remaining_amount' => $credit->remaining_amount,
                'expense_date' => $credit->credit_date,
                'due_date' => $credit->due_date,
                'payment_method' => 'borc', // Credit
                'status' => $credit->status, // pending/partial/paid
                'type' => 'supplier_credit', // Mark as supplier credit
                'supplier' => $credit->supplier,
                'supplier_id' => $credit->supplier_id,
                'supplier_credit_id' => $credit->id,
                'goods_receipt_id' => $credit->goodsReceipt ? $credit->goodsReceipt->id : null, // Link to goods receipt for view button
                'created_at' => $credit->created_at,
            ];
        });

        // Get unpaid goods receipts to show in expenses list
        // Only show goods receipts that DON'T have a supplier credit (to avoid duplication)
        $unpaidGoodsReceiptsQuery = GoodsReceipt::with(['supplier', 'items.product', 'supplierCredit'])
            ->where('account_id', auth()->user()->account_id)
            ->whereIn('payment_status', ['unpaid', 'partial'])
            ->whereNull('supplier_credit_id'); // Don't show receipts that already have a supplier credit

        // Apply same filters to goods receipts
        if ($request->filled('search')) {
            $searchTerm = $request->search;
            $unpaidGoodsReceiptsQuery->where(function ($q) use ($searchTerm) {
                $q->where('receipt_number', 'like', '%' . $searchTerm . '%')
                  ->orWhere('invoice_number', 'like', '%' . $searchTerm . '%')
                  ->orWhereHas('supplier', function ($subQ) use ($searchTerm) {
                      $subQ->where('name', 'like', '%' . $searchTerm . '%');
                  })
                  ->orWhereHas('items.product', function ($subQ) use ($searchTerm) {
                      $subQ->where('name', 'like', '%' . $searchTerm . '%');
                  });
            });
        }

        if ($request->filled('date_from') && $request->filled('date_to')) {
            $unpaidGoodsReceiptsQuery->whereBetween('created_at', [$request->date_from, $request->date_to]);
        }

        $unpaidGoodsReceiptsForList = $unpaidGoodsReceiptsQuery->latest('created_at')->get();

        // Transform goods receipts to match expense structure for display
        $goodsReceiptsAsExpenses = $unpaidGoodsReceiptsForList->map(function ($receipt) {
            $remainingAmount = $receipt->supplierCredit
                ? $receipt->supplierCredit->remaining_amount
                : $receipt->total_cost;

            // Build description from items
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
                'payment_method' => 'borc', // Unpaid
                'payment_status' => $receipt->payment_status,
                'status' => $receipt->payment_status === 'paid' ? 'paid' : 'pending',
                'type' => 'goods_receipt', // Mark as goods receipt
                'supplier' => $receipt->supplier,
                'supplier_id' => $receipt->supplier_id,
                'goods_receipt_id' => $receipt->id,
                'goods_receipt_data' => $receipt, // Keep full data for payment modal
                'created_at' => $receipt->created_at,
            ];
        });

        // Merge expenses, supplier credits, and goods receipts
        $allExpenses = $expenses
            ->concat($supplierCreditsAsExpenses)
            ->concat($goodsReceiptsAsExpenses)
            ->sortByDesc('expense_date')
            ->values();

        // Paginate manually
        $perPage = 25;
        $currentPage = $request->input('page', 1);
        $offset = ($currentPage - 1) * $perPage;

        $paginatedExpenses = new \Illuminate\Pagination\LengthAwarePaginator(
            $allExpenses->slice($offset, $perPage)->values(),
            $allExpenses->count(),
            $perPage,
            $currentPage,
            ['path' => $request->url(), 'query' => $request->query()]
        );

        $categories = ExpenseCategory::byAccount(auth()->user()->account_id)
            ->active()
            ->with('parent')
            ->get();

        $branches = Branch::byAccount(auth()->user()->account_id)->get();

        // Get suppliers for the supplier payment modal
        $suppliers = Supplier::byAccount(auth()->user()->account_id)
            ->active()
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        // Get unpaid and partially paid goods receipts for the supplier payment modal
        $unpaidGoodsReceipts = GoodsReceipt::where('account_id', auth()->user()->account_id)
            ->whereIn('payment_status', ['unpaid', 'partial'])
            ->with(['supplier:id,name', 'items.product:id,name', 'supplierCredit'])
            ->orderBy('due_date')
            ->orderBy('created_at')
            ->get()
            ->map(function ($receipt) {
                // Ensure numeric values are properly set
                $receipt->total_cost = $receipt->total_cost ?? 0;

                // Ensure supplier_credit has remaining_amount
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