<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\Branch;
use App\Models\Supplier;
use App\Models\SupplierCredit;
use App\Models\GoodsReceipt;
use App\Services\DocumentUploadService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ExpenseController extends Controller
{
    private DocumentUploadService $documentService;

    public function __construct(DocumentUploadService $documentService)
    {
        $this->middleware('auth');
        $this->middleware('account.access');
        $this->documentService = $documentService;
    }

    public function index(Request $request)
    {
        Gate::authorize('access-account-data');

        $request->validate([
            'search' => 'nullable|string|max:255',
            'category_id' => 'nullable|integer|exists:expense_categories,category_id',
            'branch_id' => 'nullable|integer|exists:branches,id',
            'payment_method' => 'nullable|string|in:nağd,kart,köçürmə',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
        ]);

        $query = Expense::with(['category', 'branch', 'user', 'supplier'])
            ->where('account_id', Auth::user()->account_id);

        if ($request->filled('search')) {
            $validated = $request->validated();
            $searchTerm = $validated['search'];
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
        $supplierCreditsQuery = \App\Models\SupplierCredit::with(['supplier'])
            ->where('account_id', Auth::user()->account_id)
            ->where('status', '!=', 'paid'); // Show pending and partial

        // Apply same filters to supplier credits
        if ($request->filled('search')) {
            $validated = $request->validated();
            $searchTerm = $validated['search'];
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
                'created_at' => $credit->created_at,
            ];
        });

        // Merge expenses and supplier credits
        $allExpenses = $expenses->concat($supplierCreditsAsExpenses)
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

        return Inertia::render('Expenses/Index', [
            'expenses' => $paginatedExpenses,
            'categories' => $categories,
            'branches' => $branches,
            'paymentMethods' => Expense::getPaymentMethods(),
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
            ->with(['supplier:id,name', 'product:id,name'])
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
            'payment_method' => 'required|in:nağd,kart,köçürmə',
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
            'payment_method' => 'required|in:nağd,kart,köçürmə',
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

        return redirect()->route('expenses.show', $expense)
                        ->with('success', __('app.updated_successfully'));
    }

    public function destroy(Expense $expense)
    {
        Gate::authorize('manage-expenses');
        Gate::authorize('access-account-data', $expense);

        // Prevent deletion of expenses created from instant payment goods receipts
        if ($expense->goods_receipt_id) {
            return back()->withErrors([
                'error' => 'Mal qəbulundan yaradılmış xərcləri silmək mümkün deyil. Mal qəbulunu silin.'
            ]);
        }

        // Check if this expense is a vendor/supplier payment
        // Only admin or account_owner can delete vendor payment expenses
        if ($expense->supplier_credit_id && $expense->credit_payment_amount > 0) {
            if (!Auth::user()->isAdmin()) {
                return redirect()->back()
                    ->with('error', 'Yalnız administrator və ya hesab sahibi təchizatçı ödəməsi xərclərini silə bilər.');
            }
        }

        // Delete associated receipt file
        if ($expense->receipt_file_path && Storage::disk('documents')->exists($expense->receipt_file_path)) {
            Storage::disk('documents')->delete($expense->receipt_file_path);
        }

        $expense->delete();

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
            $validated = $request->validated();
            $searchTerm = $validated['search'];
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

        $request->validate([
            'goods_receipt_id' => 'required|exists:goods_receipts,id',
            'payment_amount' => 'required|numeric|min:0.01',
            'category_id' => 'required|exists:expense_categories,category_id',
            'branch_id' => 'required|exists:branches,id',
            'payment_method' => 'required|in:nağd,kart,köçürmə',
            'notes' => 'nullable|string|max:1000',
        ]);

        $goodsReceipt = GoodsReceipt::with(['supplier', 'product', 'supplierCredit'])
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

            // Create supplier payment record for better tracking
            $supplierPayment = \App\Models\SupplierPayment::create([
                'account_id' => auth()->user()->account_id,
                'supplier_id' => $goodsReceipt->supplier_id,
                'amount' => $paymentAmount,
                'description' => "Mal qəbulu ödəməsi - {$goodsReceipt->receipt_number}",
                'payment_date' => now()->format('Y-m-d'),
                'payment_method' => $request->payment_method,
                'invoice_number' => $goodsReceipt->receipt_number,
                'user_id' => Auth::id(),
                'notes' => "Xerc: {$expense->reference_number}",
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
}