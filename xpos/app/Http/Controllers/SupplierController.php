<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use App\Models\SupplierCredit;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class SupplierController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
        $this->middleware('account.access');
    }

    /**
     * Display a listing of suppliers
     */
    public function index(Request $request)
    {
        Gate::authorize('access-account-data');

        $query = Supplier::with(['products' => function($q) {
            $q->where('products.is_active', true);
        }])->where('account_id', Auth::user()->account_id);

        // Search
        if ($request->filled('search')) {
            $query->search($request->search);
        }

        // Filter by status
        if ($request->filled('status')) {
            if ($request->status === 'active') {
                $query->active();
            } elseif ($request->status === 'inactive') {
                $query->where('is_active', false);
            }
        }

        $suppliers = $query->latest()
            ->paginate(15)
            ->withQueryString()
            ->through(function ($supplier) {
                return $supplier->append(['active_products_count', 'formatted_phone']);
            });

        // Get branches for manual credit modal
        $branches = Branch::where('account_id', Auth::user()->account_id)
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Suppliers/Index', [
            'suppliers' => $suppliers,
            'branches' => $branches,
            'filters' => $request->only(['search', 'status'])
        ]);
    }

    /**
     * Show the form for creating a new supplier
     */
    public function create()
    {
        Gate::authorize('manage-suppliers');

        return Inertia::render('Suppliers/Create');
    }

    /**
     * Store a newly created supplier
     */
    public function store(Request $request)
    {
        Gate::authorize('manage-suppliers');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string|max:500',
            'tax_number' => 'nullable|string|max:50',
            'bank_account' => 'nullable|string|max:50',
            'bank_name' => 'nullable|string|max:255',
            'payment_terms_days' => 'integer|min:0|max:365',
            'notes' => 'nullable|string|max:1000',
            'is_active' => 'boolean'
        ]);

        $validated['account_id'] = Auth::user()->account_id;

        $supplier = Supplier::create($validated);

        return redirect()->route('suppliers.show', $supplier)
            ->with('success', __('app.supplier_created_successfully'));
    }

    /**
     * Display the specified supplier
     */
    public function show(Supplier $supplier)
    {
        Gate::authorize('access-account-data', $supplier);

        $supplier->load([
            'products' => function($q) {
                $q->where('products.is_active', true)
                  ->withPivot(['supplier_price', 'supplier_sku', 'lead_time_days', 'minimum_order_quantity', 'is_preferred'])
                  ->orderBy('name');
            }
        ]);

        // Get supplier credits
        $credits = SupplierCredit::where('supplier_id', $supplier->id)
            ->where('account_id', Auth::user()->account_id)
            ->latest('credit_date')
            ->get();

        // Get branches for manual credit modal
        $branches = Branch::where('account_id', Auth::user()->account_id)
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        // Get recent activity/orders (would be implemented when order module is ready)
        $recentActivity = [];

        return Inertia::render('Suppliers/Show', [
            'supplier' => $supplier,
            'credits' => $credits,
            'branches' => $branches,
            'recentActivity' => $recentActivity
        ]);
    }

    /**
     * Show the form for editing the specified supplier
     */
    public function edit(Supplier $supplier)
    {
        Gate::authorize('manage-suppliers');
        Gate::authorize('access-account-data', $supplier);

        return Inertia::render('Suppliers/Edit', [
            'supplier' => $supplier
        ]);
    }

    /**
     * Update the specified supplier
     */
    public function update(Request $request, Supplier $supplier)
    {
        Gate::authorize('manage-suppliers');
        Gate::authorize('access-account-data', $supplier);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string|max:500',
            'tax_number' => 'nullable|string|max:50',
            'bank_account' => 'nullable|string|max:50',
            'bank_name' => 'nullable|string|max:255',
            'payment_terms_days' => 'integer|min:0|max:365',
            'notes' => 'nullable|string|max:1000',
            'is_active' => 'boolean'
        ]);

        $supplier->update($validated);

        return redirect()->route('suppliers.show', $supplier)
            ->with('success', __('app.supplier_updated_successfully'));
    }

    /**
     * Remove the specified supplier
     */
    public function destroy(Supplier $supplier)
    {
        Gate::authorize('manage-suppliers');
        Gate::authorize('access-account-data', $supplier);

        // Check if supplier has products
        if ($supplier->products()->count() > 0) {
            return back()->with('error', __('app.cannot_delete_supplier_with_products'));
        }

        $supplier->delete();

        return redirect()->route('suppliers.index')
            ->with('success', __('app.supplier_deleted_successfully'));
    }

    /**
     * Search suppliers for product linking
     */
    public function search(Request $request)
    {
        Gate::authorize('access-account-data');

        $query = Supplier::where('account_id', Auth::user()->account_id)->active();

        if ($request->filled('q')) {
            $query->search($request->q);
        }

        $suppliers = $query->limit(10)->get(['id', 'name', 'contact_person']);

        return response()->json($suppliers);
    }

    /**
     * Get supplier products from actual purchases (goods receipts)
     */
    public function products(Supplier $supplier)
    {
        Gate::authorize('access-account-data', $supplier);

        $products = \App\Models\Product::where('account_id', $supplier->account_id)
        ->whereIn('id', function($query) use ($supplier) {
            $query->select('gri.product_id')
                ->from('goods_receipt_items as gri')
                ->join('goods_receipts as gr', 'gri.goods_receipt_id', '=', 'gr.id')
                ->where('gr.supplier_id', $supplier->id)
                ->where('gr.account_id', $supplier->account_id)
                ->distinct();
        })
        ->get()
        ->map(function($product) use ($supplier) {
            // Get purchase data for this product from this supplier
            $receiptItems = \App\Models\GoodsReceiptItem::where('account_id', $supplier->account_id)
            ->whereHas('goodsReceipt', function($q) use ($supplier) {
                $q->where('supplier_id', $supplier->id)
                  ->where('account_id', $supplier->account_id);
            })
            ->where('product_id', $product->id);

            $latestItem = $receiptItems->latest()->first();
            $avgPrice = $receiptItems->avg('unit_cost') ?? 0;
            $totalQuantity = $receiptItems->sum('quantity') ?? 0;
            $purchaseCount = $receiptItems->count();

            // Add purchase data as "pivot" for frontend compatibility
            $product->pivot = (object) [
                'supplier_price' => $avgPrice > 0 ? round($avgPrice, 2) : 0,
                'latest_price' => $latestItem->unit_cost ?? 0,
                'total_purchased' => $totalQuantity,
                'purchase_count' => $purchaseCount,
                'last_purchased' => $latestItem?->created_at ?? null,
                'is_active' => true,
                'notes' => "Son alış: " . ($latestItem?->created_at?->format('d.m.Y') ?? 'N/A')
            ];

            return $product;
        });

        return response()->json($products);
    }

    /**
     * Bulk delete suppliers
     */
    public function bulkDelete(Request $request)
    {
        Gate::authorize('manage-suppliers');

        $validated = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'required|integer|exists:suppliers,id',
        ]);

        $user = Auth::user();
        $deletedCount = 0;
        $failedSuppliers = [];

        DB::beginTransaction();

        try {
            $suppliers = Supplier::whereIn('id', $validated['ids'])
                ->where('account_id', $user->account_id)
                ->get();

            foreach ($suppliers as $supplier) {
                // Check if supplier has products
                if ($supplier->products()->count() > 0) {
                    $failedSuppliers[] = $supplier->name;
                    continue;
                }

                $supplier->delete();
                $deletedCount++;
            }

            DB::commit();

            // Prepare response message
            $message = '';
            if ($deletedCount > 0) {
                $message = __('app.suppliers_deleted_successfully', ['count' => $deletedCount]);
            }

            if (!empty($failedSuppliers)) {
                $failedList = implode(', ', $failedSuppliers);
                $failedMessage = __('app.cannot_delete_suppliers_with_products', ['suppliers' => $failedList]);
                $message = $message ? $message . ' ' . $failedMessage : $failedMessage;
            }

            if ($deletedCount > 0) {
                return redirect()->back()->with('success', $message);
            } else {
                return redirect()->back()->with('error', $message);
            }

        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', __('app.bulk_delete_failed'));
        }
    }

    /**
     * Create a manual supplier credit (for migration or manual entries)
     */
    public function createManualCredit(Request $request)
    {
        Gate::authorize('manage-suppliers');

        $validated = $request->validate([
            'supplier_id' => [
                'required',
                'integer',
                Rule::exists('suppliers', 'id')->where(function ($query) {
                    $query->where('account_id', Auth::user()->account_id);
                })
            ],
            'branch_id' => [
                'required',
                'integer',
                Rule::exists('branches', 'id')->where(function ($query) {
                    $query->where('account_id', Auth::user()->account_id);
                })
            ],
            'amount' => 'required|numeric|min:0.01',
            'description' => 'required|string|max:500',
            'entry_type' => 'required|in:manual,migration',
            'old_system_reference' => 'nullable|string|max:100',
            'credit_date' => 'required|date',
            'due_date' => 'nullable|date|after_or_equal:credit_date',
            'notes' => 'nullable|string|max:1000',
        ]);

        DB::beginTransaction();

        try {
            // Create the manual supplier credit
            $credit = SupplierCredit::create([
                'account_id' => Auth::user()->account_id,
                'supplier_id' => $validated['supplier_id'],
                'branch_id' => $validated['branch_id'],
                'type' => 'credit',
                'entry_type' => $validated['entry_type'],
                'amount' => $validated['amount'],
                'remaining_amount' => $validated['amount'],
                'description' => $validated['description'],
                'old_system_reference' => $validated['old_system_reference'] ?? null,
                'credit_date' => $validated['credit_date'],
                'due_date' => $validated['due_date'] ?? null,
                'status' => 'pending',
                'user_id' => Auth::id(),
                'notes' => $validated['notes'] ?? null,
            ]);

            DB::commit();

            return redirect()->back()->with('success', 'Əl ilə borc uğurla yaradıldı');

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Failed to create manual supplier credit: ' . $e->getMessage());
            return redirect()->back()
                ->withErrors(['error' => 'Əl ilə borc yaradılması uğursuz oldu: ' . $e->getMessage()])
                ->with('error', 'Əl ilə borc yaradılması uğursuz oldu');
        }
    }

}
