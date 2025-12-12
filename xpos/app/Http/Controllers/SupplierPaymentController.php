<?php

namespace App\Http\Controllers;

use App\Models\SupplierPayment;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class SupplierPaymentController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
        $this->middleware('account.access');
    }

    public function index(Request $request)
    {
        Gate::authorize('access-account-data');

        $validated = $request->validate([
            'search' => 'nullable|string|max:255',
            'supplier_id' => 'nullable|integer|exists:suppliers,id',
            'payment_method' => 'nullable|string|in:cash,card,bank_transfer',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $query = SupplierPayment::with(['supplier', 'user']);

        if ($request->filled('search')) {
            $searchTerm = $validated['search'];
            $query->where(function ($q) use ($searchTerm) {
                $q->where('description', 'like', '%' . $searchTerm . '%')
                  ->orWhere('reference_number', 'like', '%' . $searchTerm . '%')
                  ->orWhere('invoice_number', 'like', '%' . $searchTerm . '%')
                  ->orWhereHas('supplier', function ($subQ) use ($searchTerm) {
                      $subQ->where('name', 'like', '%' . $searchTerm . '%');
                  });
            });
        }

        if ($request->filled('supplier_id')) {
            $query->where('supplier_id', $request->supplier_id);
        }

        if ($request->filled('payment_method')) {
            $query->where('payment_method', $request->payment_method);
        }

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('payment_date', [$request->start_date, $request->end_date]);
        }

        $payments = $query->orderBy('payment_date', 'desc')->paginate(15);

        $suppliers = Supplier::select('id', 'name')->orderBy('name')->get();

        return Inertia::render('SupplierPayments/Index', [
            'payments' => $payments,
            'suppliers' => $suppliers,
            'filters' => $request->only(['search', 'supplier_id', 'payment_method', 'start_date', 'end_date']),
            'paymentMethods' => SupplierPayment::getPaymentMethods(),
        ]);
    }

    public function create()
    {
        Gate::authorize('access-account-data');

        $suppliers = Supplier::byAccount(auth()->user()->account_id)
            ->active()
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        // Get unpaid and partially paid goods receipts
        $unpaidGoodsReceipts = \App\Models\GoodsReceipt::where('account_id', auth()->user()->account_id)
            ->whereIn('payment_status', ['unpaid', 'partial'])
            ->with(['supplier:id,name', 'product:id,name', 'supplierCredit'])
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

        // Get expense categories and branches for expense creation
        $categories = \App\Models\ExpenseCategory::byAccount(auth()->user()->account_id)
            ->active()
            ->select('category_id', 'name')
            ->orderBy('name')
            ->get();

        $branches = \App\Models\Branch::byAccount(auth()->user()->account_id)
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        return Inertia::render('SupplierPayments/Create', [
            'suppliers' => $suppliers,
            'paymentMethods' => SupplierPayment::getPaymentMethods(),
            'unpaidGoodsReceipts' => $unpaidGoodsReceipts,
            'categories' => $categories,
            'branches' => $branches,
        ]);
    }

    public function store(Request $request)
    {
        Gate::authorize('access-account-data');

        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'amount' => 'required|numeric|min:0.01',
            'description' => 'required|string|max:500',
            'payment_date' => 'required|date',
            'payment_method' => 'required|in:cash,card,bank_transfer',
            'invoice_number' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:1000',
            'goods_receipt_id' => 'nullable|exists:goods_receipts,id',
            'payment_amount' => 'nullable|numeric|min:0.01',
            'category_id' => 'nullable|exists:expense_categories,category_id',
            'branch_id' => 'nullable|exists:branches,id',
        ]);

        try {
            \DB::beginTransaction();

            // Create supplier payment
            $payment = SupplierPayment::create([
                'account_id' => Auth::user()->account_id,
                'user_id' => Auth::id(),
                'supplier_id' => $validated['supplier_id'],
                'amount' => $validated['amount'],
                'description' => $validated['description'],
                'payment_date' => $validated['payment_date'],
                'payment_method' => $validated['payment_method'],
                'invoice_number' => $validated['invoice_number'] ?? null,
                'notes' => $validated['notes'] ?? null,
            ]);

            // Create expense record for this supplier payment
            $expenseCategory = null;
            if (!empty($validated['category_id'])) {
                $expenseCategory = \App\Models\ExpenseCategory::find($validated['category_id']);
            }

            // If no category provided, find or create default supplier payment category
            if (!$expenseCategory) {
                $expenseCategory = \App\Models\ExpenseCategory::byAccount(auth()->user()->account_id)
                    ->where(function($q) {
                        $q->where('name', 'Təchizatçı ödəməsi')
                          ->orWhere('name', 'Mal alışı');
                    })
                    ->first();

                if (!$expenseCategory) {
                    $expenseCategory = \App\Models\ExpenseCategory::create([
                        'account_id' => auth()->user()->account_id,
                        'name' => 'Təchizatçı ödəməsi',
                        'is_active' => true,
                    ]);
                }
            }

            // Get branch from validated data or use first available branch
            $branchId = $validated['branch_id'] ?? \App\Models\Branch::byAccount(auth()->user()->account_id)->first()->id;

            // Prepare expense data
            $expenseData = [
                'account_id' => auth()->user()->account_id,
                'category_id' => $expenseCategory->category_id,
                'branch_id' => $branchId,
                'amount' => $validated['amount'],
                'description' => $validated['description'],
                'expense_date' => $validated['payment_date'],
                'payment_method' => $validated['payment_method'],
                'user_id' => Auth::id(),
                'supplier_id' => $validated['supplier_id'],
                'supplier_payment_id' => $payment->payment_id,
                'notes' => "Təchizatçı ödəməsi: {$payment->reference_number}" .
                          (!empty($validated['notes']) ? "\n" . $validated['notes'] : ''),
            ];

            // If paying a goods receipt, update supplier credit and goods receipt status
            if (!empty($validated['goods_receipt_id'])) {
                $goodsReceipt = \App\Models\GoodsReceipt::with('supplierCredit')
                    ->where('account_id', auth()->user()->account_id)
                    ->findOrFail($validated['goods_receipt_id']);

                if ($goodsReceipt->supplierCredit) {
                    $paymentAmount = $validated['payment_amount'] ?? $validated['amount'];

                    // Validate payment amount doesn't exceed remaining amount
                    if ($paymentAmount > $goodsReceipt->supplierCredit->remaining_amount) {
                        \DB::rollBack();
                        return back()
                            ->withErrors(['payment_amount' => 'Ödəniş məbləği qalıq borcdan çox ola bilməz.'])
                            ->withInput();
                    }

                    // Update supplier credit
                    $paymentSuccess = $goodsReceipt->supplierCredit->addPayment(
                        $paymentAmount,
                        "Təchizatçı ödəməsi: {$payment->reference_number}"
                    );

                    if (!$paymentSuccess) {
                        \DB::rollBack();
                        return back()
                            ->withErrors(['error' => 'Ödəniş əlavə edilərkən xəta baş verdi.'])
                            ->withInput();
                    }

                    // Update goods receipt payment status based on remaining amount
                    // Use a small epsilon for floating point comparison
                    if ($goodsReceipt->supplierCredit->remaining_amount < 0.01) {
                        $goodsReceipt->update(['payment_status' => 'paid']);
                    } else {
                        $goodsReceipt->update(['payment_status' => 'partial']);
                    }

                    // Add goods receipt and supplier credit info to expense data
                    $expenseData['goods_receipt_id'] = $goodsReceipt->id;
                    $expenseData['supplier_credit_id'] = $goodsReceipt->supplierCredit->id;
                    $expenseData['credit_payment_amount'] = $paymentAmount;
                }
            }

            // Create the expense record
            $expense = \App\Models\Expense::create($expenseData);

            \DB::commit();

            return redirect()->route('supplier-payments.index')
                ->with('success', 'Təchizatçı ödəməsi uğurla yaradıldı');

        } catch (\Exception $e) {
            \DB::rollBack();
            \Log::error('Error creating supplier payment: ' . $e->getMessage());
            return back()
                ->withErrors(['error' => 'Ödəniş yaradılarkən xəta baş verdi: ' . $e->getMessage()])
                ->withInput();
        }
    }

    public function show(SupplierPayment $supplierPayment)
    {
        Gate::authorize('access-account-data');

        $supplierPayment->load(['supplier', 'user']);

        return Inertia::render('SupplierPayments/Show', [
            'payment' => $supplierPayment,
        ]);
    }

    public function edit(SupplierPayment $supplierPayment)
    {
        Gate::authorize('access-account-data');

        $supplierPayment->load(['supplier']);
        $suppliers = Supplier::select('id', 'name')->orderBy('name')->get();

        return Inertia::render('SupplierPayments/Edit', [
            'payment' => $supplierPayment,
            'suppliers' => $suppliers,
            'paymentMethods' => SupplierPayment::getPaymentMethods(),
        ]);
    }

    public function update(Request $request, SupplierPayment $supplierPayment)
    {
        Gate::authorize('access-account-data');

        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'amount' => 'required|numeric|min:0.01',
            'description' => 'required|string|max:500',
            'payment_date' => 'required|date',
            'payment_method' => 'required|in:cash,card,bank_transfer',
            'invoice_number' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:1000',
        ]);

        $supplierPayment->update($validated);

        return redirect()->route('supplier-payments.index')
            ->with('success', __('app.supplier_payment_updated'));
    }

    public function destroy(SupplierPayment $supplierPayment)
    {
        Gate::authorize('access-account-data');

        $supplierPayment->delete();

        return redirect()->route('supplier-payments.index')
            ->with('success', __('app.supplier_payment_deleted'));
    }

    public function search(Request $request)
    {
        Gate::authorize('access-account-data');

        $validated = $request->validate([
            'q' => 'required|string|max:255',
        ]);

        $searchTerm = $validated['q'];
        
        $query = SupplierPayment::with(['supplier'])
            ->where(function ($q) use ($searchTerm) {
                $q->where('description', 'like', '%' . $searchTerm . '%')
                  ->orWhere('reference_number', 'like', '%' . $searchTerm . '%')
                  ->orWhere('invoice_number', 'like', '%' . $searchTerm . '%')
                  ->orWhereHas('supplier', function ($subQ) use ($searchTerm) {
                      $subQ->where('name', 'like', '%' . $searchTerm . '%');
                  });
            });

        $payments = $query->orderBy('payment_date', 'desc')->limit(10)->get();

        return response()->json($payments);
    }
}