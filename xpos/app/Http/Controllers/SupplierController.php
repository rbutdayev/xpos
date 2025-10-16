<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
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

        return Inertia::render('Suppliers/Index', [
            'suppliers' => $suppliers,
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

        // Get recent activity/orders (would be implemented when order module is ready)
        $recentActivity = [];

        return Inertia::render('Suppliers/Show', [
            'supplier' => $supplier,
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

        $products = \App\Models\Product::whereIn('id', function($query) use ($supplier) {
            $query->select('product_id')
                ->from('goods_receipts')
                ->where('supplier_id', $supplier->id)
                ->where('account_id', $supplier->account_id)
                ->distinct();
        })
        ->get()
        ->map(function($product) use ($supplier) {
            // Get purchase data for this product from this supplier
            $receipts = \App\Models\GoodsReceipt::where('supplier_id', $supplier->id)
                ->where('product_id', $product->id)
                ->where('account_id', $supplier->account_id);

            $latestReceipt = $receipts->latest()->first();
            $avgPrice = $receipts->avg('unit_cost');
            $totalQuantity = $receipts->sum('quantity');
            $receiptCount = $receipts->count();

            // Add purchase data as "pivot" for frontend compatibility
            $product->pivot = (object) [
                'supplier_price' => round($avgPrice, 2) ?? 0,
                'latest_price' => $latestReceipt->unit_cost ?? 0,
                'total_purchased' => $totalQuantity,
                'purchase_count' => $receiptCount,
                'last_purchased' => $latestReceipt->created_at ?? null,
                'is_active' => true,
                'notes' => "Son alış: " . ($latestReceipt->created_at ? $latestReceipt->created_at->format('d.m.Y') : 'N/A')
            ];

            return $product;
        });

        return response()->json($products);
    }

}
