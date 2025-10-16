<?php

namespace App\Http\Controllers;

use App\Models\ProductStock;
use App\Models\Product;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class ProductStockController extends Controller
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
            'warehouse_id' => 'nullable|integer|exists:warehouses,id',
            'low_stock' => 'nullable|boolean',
            'per_page' => 'nullable|integer|min:10|max:100',
        ]);
        $search = $validated['search'] ?? null;
        $warehouseId = $validated['warehouse_id'] ?? null;
        $lowStock = $validated['low_stock'] ?? null;
        $perPage = $validated['per_page'] ?? 25;

        $stocks = ProductStock::with(['product', 'warehouse'])
            ->whereHas('product', function ($query) {
                $query->where('account_id', auth()->user()->account_id);
            })
            ->when($search, function ($query, $search) {
                $query->whereHas('product', function ($q) use ($search) {
                    $q->where('name', 'like', '%' . $search . '%')
                      ->orWhere('sku', 'like', '%' . $search . '%');
                });
            })
            ->when($warehouseId, function ($query, $warehouseId) {
                $query->where('warehouse_id', $warehouseId);
            })
            ->when($lowStock, function ($query) {
                $query->whereRaw('quantity <= min_level');
            })
            ->latest()
            ->paginate($perPage);

        $warehouses = Warehouse::where('account_id', auth()->user()->account_id)->get();

        return Inertia::render('ProductStock/Index', [
            'stocks' => $stocks,
            'warehouses' => $warehouses,
            'filters' => $request->only(['search', 'warehouse_id', 'low_stock']),
        ]);
    }

    public function edit(ProductStock $productStock)
    {
        Gate::authorize('access-account-data');

        // Verify the product stock belongs to the user's account
        if ($productStock->product->account_id !== auth()->user()->account_id) {
            abort(403);
        }

        return Inertia::render('ProductStock/Edit', [
            'productStock' => $productStock->load(['product', 'warehouse']),
        ]);
    }

    public function update(Request $request, ProductStock $productStock)
    {
        Gate::authorize('access-account-data');

        $request->validate([
            'min_level' => 'required|numeric|min:0',
            'max_level' => 'nullable|numeric|min:0',
            'reorder_point' => 'nullable|numeric|min:0',
            'reorder_quantity' => 'nullable|numeric|min:0',
            'location' => 'nullable|string|max:255',
        ]);

        $productStock->update($request->only([
            'min_level',
            'max_level', 
            'reorder_point',
            'reorder_quantity',
            'location'
        ]));

        return redirect()->route('product-stock.index')
            ->with('success', 'Stok məlumatları yeniləndi');
    }

    public function search(Request $request)
    {
        Gate::authorize('access-account-data');

        $validated = $request->validate([
            'q' => 'required|string|max:255',
        ]);

        $search = $validated['q'];
        
        $stocks = ProductStock::with(['product', 'warehouse'])
            ->whereHas('product', function ($query) use ($search) {
                $query->where('account_id', auth()->user()->account_id)
                      ->where(function ($q) use ($search) {
                          $q->where('name', 'like', '%' . $search . '%')
                            ->orWhere('sku', 'like', '%' . $search . '%');
                      });
            })
            ->limit(10)
            ->get();

        return response()->json($stocks);
    }
}
