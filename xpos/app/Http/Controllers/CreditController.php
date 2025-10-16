<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\CustomerCredit;
use App\Models\Supplier;
use App\Models\SupplierCredit;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CreditController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
        $this->middleware('account.access');
    }

    public function customerCredits(): Response
    {
        $credits = CustomerCredit::with(['customer', 'branch', 'user'])
            ->where('account_id', auth()->user()->account_id)
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return Inertia::render('Credits/CustomerCredits', [
            'credits' => $credits,
        ]);
    }

    public function supplierCredits(): Response
    {
        $credits = SupplierCredit::with(['supplier', 'branch', 'user'])
            ->where('account_id', auth()->user()->account_id)
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return Inertia::render('Credits/SupplierCredits', [
            'credits' => $credits,
        ]);
    }

    public function createCustomerCredit()
    {
        $customers = Customer::where('account_id', auth()->user()->account_id)
            ->where('is_active', true)
            ->get(['id', 'name', 'phone']);

        return Inertia::render('Credits/CreateCustomerCredit', [
            'customers' => $customers,
        ]);
    }

    public function storeCustomerCredit(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'amount' => 'required|numeric|min:0.01',
            'description' => 'nullable|string',
            'credit_date' => 'required|date',
            'due_date' => 'nullable|date|after:credit_date',
            'notes' => 'nullable|string',
        ]);

        $credit = CustomerCredit::create([
            'account_id' => auth()->user()->account_id,
            'customer_id' => $validated['customer_id'],
            'branch_id' => session('selected_warehouse_id'),
            'type' => 'credit',
            'amount' => $validated['amount'],
            'description' => $validated['description'],
            'credit_date' => $validated['credit_date'],
            'due_date' => $validated['due_date'],
            'user_id' => auth()->id(),
            'notes' => $validated['notes'],
        ]);

        return redirect()->route('credits.customer')
            ->with('success', 'Müştəri borcu əlavə edildi');
    }

    public function createSupplierCredit()
    {
        $suppliers = Supplier::where('account_id', auth()->user()->account_id)
            ->where('is_active', true)
            ->get(['id', 'name', 'phone']);

        return Inertia::render('Credits/CreateSupplierCredit', [
            'suppliers' => $suppliers,
        ]);
    }

    public function storeSupplierCredit(Request $request)
    {
        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'amount' => 'required|numeric|min:0.01',
            'description' => 'nullable|string',
            'credit_date' => 'required|date',
            'due_date' => 'nullable|date|after:credit_date',
            'notes' => 'nullable|string',
        ]);

        $credit = SupplierCredit::create([
            'account_id' => auth()->user()->account_id,
            'supplier_id' => $validated['supplier_id'],
            'branch_id' => session('selected_warehouse_id'),
            'type' => 'credit',
            'amount' => $validated['amount'],
            'description' => $validated['description'],
            'credit_date' => $validated['credit_date'],
            'due_date' => $validated['due_date'],
            'user_id' => auth()->id(),
            'notes' => $validated['notes'],
        ]);

        return redirect()->route('credits.supplier')
            ->with('success', 'Təchizatçı borcu əlavə edildi');
    }

    public function payCustomerCredit(Request $request, CustomerCredit $credit)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01|max:' . $credit->remaining_amount,
            'description' => 'nullable|string',
        ]);

        if ($credit->addPayment($validated['amount'], $validated['description'])) {
            return redirect()->back()->with('success', 'Ödəmə uğurla edildi');
        }

        return redirect()->back()->with('error', 'Ödəmə zamanı xəta baş verdi');
    }

    public function paySupplierCredit(Request $request, SupplierCredit $credit)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01|max:' . $credit->remaining_amount,
            'description' => 'nullable|string',
        ]);

        if ($credit->addPayment($validated['amount'], $validated['description'])) {
            return redirect()->back()->with('success', 'Ödəmə uğurla edildi');
        }

        return redirect()->back()->with('error', 'Ödəmə zamanı xəta baş verdi');
    }

    public function getCustomerCreditsForDropdown(Request $request)
    {
        $customerId = $request->get('customer_id');
        if (!$customerId) {
            return response()->json([]);
        }

        $credits = CustomerCredit::where('account_id', auth()->user()->account_id)
            ->where('customer_id', $customerId)
            ->where('type', 'credit')
            ->whereIn('status', ['pending', 'partial'])
            ->select(['id', 'amount', 'remaining_amount', 'description', 'due_date'])
            ->get();

        return response()->json($credits);
    }

    public function getSupplierCreditsForDropdown(Request $request)
    {
        $supplierId = $request->get('supplier_id');
        if (!$supplierId) {
            return response()->json([]);
        }

        $credits = SupplierCredit::where('account_id', auth()->user()->account_id)
            ->where('supplier_id', $supplierId)
            ->where('type', 'credit')
            ->whereIn('status', ['pending', 'partial'])
            ->select(['id', 'amount', 'remaining_amount', 'description', 'due_date'])
            ->get();

        return response()->json($credits);
    }
}
