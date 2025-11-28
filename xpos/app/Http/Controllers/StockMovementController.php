<?php

namespace App\Http\Controllers;

use App\Models\StockMovement;
use App\Models\Product;
use App\Models\ProductStock;
use App\Models\StockHistory;
use App\Models\ProductVariant;
use App\Models\Warehouse;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class StockMovementController extends Controller
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
            'movement_type' => 'nullable|string|in:daxil_olma,xaric_olma',
            'warehouse_id' => 'nullable|integer|exists:warehouses,id',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
            'per_page' => 'nullable|integer|min:10|max:100',
        ]);
        $search = $validated['search'] ?? null;
        $movementType = $validated['movement_type'] ?? null;
        $warehouseId = $validated['warehouse_id'] ?? null;
        $dateFrom = $validated['date_from'] ?? null;
        $dateTo = $validated['date_to'] ?? null;
        $perPage = $validated['per_page'] ?? 25;

        $movements = StockMovement::with(['product', 'variant', 'warehouse', 'employee'])
            ->where('account_id', auth()->user()->account_id)
            ->when($search, function ($query, $search) {
                $query->whereHas('product', function ($q) use ($search) {
                    $q->where('name', 'like', '%' . $search . '%')
                      ->orWhere('sku', 'like', '%' . $search . '%');
                });
            })
            ->when($movementType, function ($query, $type) {
                $query->where('movement_type', $type);
            })
            ->when($warehouseId, function ($query, $warehouseId) {
                $query->where('warehouse_id', $warehouseId);
            })
            ->when($dateFrom && $dateTo, function ($query) use ($dateFrom, $dateTo) {
                $query->whereBetween('created_at', [$dateFrom, $dateTo]);
            })
            ->latest()
            ->paginate($perPage);

        $warehouses = Warehouse::where('account_id', auth()->user()->account_id)->get();

        $movementTypes = [
            'daxil_olma' => 'Daxil olma',
            'xaric_olma' => 'Xaric olma',
            'transfer' => 'Transfer',
            'qaytarma' => 'Qaytarma',
            'itki_zerer' => 'İtki/Zərər',
        ];

        return Inertia::render('StockMovements/Index', [
            'movements' => $movements,
            'warehouses' => $warehouses,
            'movementTypes' => $movementTypes,
            'filters' => $request->only(['search', 'movement_type', 'warehouse_id', 'date_from', 'date_to']),
        ]);
    }

    public function create()
    {
        Gate::authorize('access-account-data');

        // Don't load products initially - they will be loaded when warehouse is selected
        $products = [];

        $warehouses = Warehouse::where('account_id', auth()->user()->account_id)->get();

        $movementTypes = [
            'daxil_olma' => 'Daxil olma',
            'xaric_olma' => 'Xaric olma',
            'transfer' => 'Transfer',
            'qaytarma' => 'Qaytarma',
            'itki_zerer' => 'İtki/Zərər',
        ];

        return Inertia::render('StockMovements/Create', [
            'products' => $products,
            'warehouses' => $warehouses,
            'movementTypes' => $movementTypes,
        ]);
    }

    public function store(Request $request)
    {
        Gate::authorize('access-account-data');

        $validated = $request->validate([
            'warehouse_id' => 'required|exists:warehouses,id',
            'product_id' => 'required|exists:products,id',
            'variant_id' => 'nullable|exists:product_variants,id',
            'movement_type' => 'required|in:daxil_olma,xaric_olma,transfer,qaytarma,itki_zerer',
            'quantity' => 'required|numeric|min:0.001',
            'unit_cost' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
        ]);

        // Verify warehouse belongs to current account
        $warehouse = Warehouse::where('id', $validated['warehouse_id'])
            ->where('account_id', auth()->user()->account_id)->first();
        if (!$warehouse) {
            abort(403, 'Warehouse not found or access denied');
        }

        // Verify product belongs to current account
        $product = Product::where('id', $validated['product_id'])
            ->where('account_id', auth()->user()->account_id)->first();
        if (!$product) {
            abort(403, 'Product not found or access denied');
        }

        // Verify variant belongs to product and account (if provided)
        if (!empty($validated['variant_id'])) {
            $variant = ProductVariant::where('id', $validated['variant_id'])
                ->where('account_id', auth()->user()->account_id)
                ->where('product_id', $validated['product_id'])
                ->first();

            if (!$variant) {
                abort(403, 'Seçilmiş variant bu məhsula aid deyil və ya mövcud deyil');
            }
        }

        DB::transaction(function () use ($validated) {
            $stockMovement = StockMovement::create([
                'account_id' => auth()->user()->account_id,
                'warehouse_id' => $validated['warehouse_id'],
                'product_id' => $validated['product_id'],
                'variant_id' => $validated['variant_id'] ?? null,
                'movement_type' => $validated['movement_type'],
                'quantity' => $validated['quantity'],
                'unit_cost' => $validated['unit_cost'],
                'employee_id' => auth()->user()->id, // Always use current user
                'notes' => $validated['notes'],
            ]);

            $this->updateProductStock($stockMovement);
        });

        return redirect()->route('stock-movements.index')
            ->with('success', __('app.stock_movement_created'));
    }

    public function show(StockMovement $stockMovement)
    {
        Gate::authorize('access-account-data');

        $stockMovement->load(['product', 'variant', 'warehouse', 'employee']);

        return Inertia::render('StockMovements/Show', [
            'movement' => $stockMovement,
        ]);
    }

    public function edit(StockMovement $stockMovement)
    {
        Gate::authorize('access-account-data');

        // Edit page doesn't need products list - warehouse and product can't be changed
        $products = [];

        $warehouses = Warehouse::where('account_id', auth()->user()->account_id)->get();

        $movementTypes = [
            'daxil_olma' => 'Daxil olma',
            'xaric_olma' => 'Xaric olma',
            'transfer' => 'Transfer',
            'qaytarma' => 'Qaytarma',
            'itki_zerer' => 'İtki/Zərər',
        ];

        return Inertia::render('StockMovements/Edit', [
            'movement' => $stockMovement,
            'products' => $products,
            'warehouses' => $warehouses,
            'movementTypes' => $movementTypes,
        ]);
    }

    public function update(Request $request, StockMovement $stockMovement)
    {
        Gate::authorize('access-account-data');

        // Verify stock movement belongs to current account
        if ($stockMovement->account_id !== auth()->user()->account_id) {
            abort(403);
        }

        $request->validate([
            'unit_cost' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
        ]);

        $stockMovement->update($request->only(['unit_cost', 'notes']));

        return redirect()->route('stock-movements.index')
            ->with('success', __('app.stock_movement_updated'));
    }

    public function destroy(StockMovement $stockMovement)
    {
        Gate::authorize('access-account-data');

        // Verify stock movement belongs to current account
        if ($stockMovement->account_id !== auth()->user()->account_id) {
            abort(403);
        }

        DB::transaction(function () use ($stockMovement) {
            $this->reverseStockMovement($stockMovement);
            $stockMovement->delete();
        });

        return redirect()->route('stock-movements.index')
            ->with('success', __('app.stock_movement_deleted'));
    }

    private function updateProductStock(StockMovement $movement): void
    {
        $stock = ProductStock::firstOrCreate([
            'product_id' => $movement->product_id,
            'variant_id' => $movement->variant_id,
            'warehouse_id' => $movement->warehouse_id,
            'account_id' => $movement->account_id,
        ], [
            'quantity' => 0,
            'reserved_quantity' => 0,
            'min_level' => 3,
        ]);

        $quantityBefore = $stock->quantity;

        $quantityChange = match ($movement->movement_type) {
            'daxil_olma', 'qaytarma' => $movement->quantity,
            'xaric_olma', 'transfer', 'itki_zerer' => -$movement->quantity,
        };

        $stock->increment('quantity', $quantityChange);

        // Create stock history record
        StockHistory::create([
            'product_id' => $movement->product_id,
            'variant_id' => $movement->variant_id,
            'warehouse_id' => $movement->warehouse_id,
            'quantity_before' => $quantityBefore,
            'quantity_change' => $quantityChange,
            'quantity_after' => $quantityBefore + $quantityChange,
            'type' => $movement->movement_type,
            'reference_type' => 'stock_movement',
            'reference_id' => $movement->movement_id,
            'user_id' => $movement->employee_id,
            'notes' => $movement->notes,
            'occurred_at' => $movement->created_at ?? now(),
        ]);
    }

    private function reverseStockMovement(StockMovement $movement): void
    {
        $stock = ProductStock::where([
            'product_id' => $movement->product_id,
            'variant_id' => $movement->variant_id,
            'warehouse_id' => $movement->warehouse_id,
            'account_id' => $movement->account_id,
        ])->first();

        if ($stock) {
            $quantityChange = match ($movement->movement_type) {
                'daxil_olma', 'qaytarma' => -$movement->quantity,
                'xaric_olma', 'transfer', 'itki_zerer' => $movement->quantity,
            };

            $stock->increment('quantity', $quantityChange);
        }

        // Delete the corresponding stock history record
        StockHistory::where('reference_type', 'stock_movement')
            ->where('reference_id', $movement->movement_id)
            ->delete();
    }

    public function search(Request $request)
    {
        Gate::authorize('access-account-data');

        $validated = $request->validate([
            'q' => 'required|string|max:255',
        ]);

        $searchTerm = $validated['q'];

        $movements = StockMovement::with(['product', 'variant', 'warehouse', 'employee'])
            ->where('account_id', auth()->user()->account_id)
            ->whereHas('product', function ($query) use ($searchTerm) {
                $query->where('name', 'like', '%' . $searchTerm . '%')
                      ->orWhere('sku', 'like', '%' . $searchTerm . '%');
            })
            ->limit(10)
            ->get();

        return response()->json($movements);
    }
}
