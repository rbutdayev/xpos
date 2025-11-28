<?php

namespace App\Http\Controllers;

use App\Models\ProductReturn;
use App\Models\ProductVariant;
use App\Models\StockHistory;
use App\Models\StockMovement;
use App\Models\ProductStock;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ProductReturnController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
        $this->middleware('account.access');
    }

    public function index(Request $request)
    {
        Gate::authorize('viewAny', ProductReturn::class);

        $returns = ProductReturn::with(['supplier', 'product', 'variant', 'warehouse', 'requestedBy'])
            ->byAccount(auth()->user()->account_id)
            ->latest()
            ->paginate(25);

        return Inertia::render('ProductReturns/Index', [
            'returns' => $returns,
        ]);
    }

    public function create()
    {
        Gate::authorize('create', ProductReturn::class);

        $suppliers = \App\Models\Supplier::byAccount(auth()->user()->account_id)->get();
        $warehouses = \App\Models\Warehouse::byAccount(auth()->user()->account_id)->get();

        return Inertia::render('ProductReturns/Create', [
            'suppliers' => $suppliers,
            'warehouses' => $warehouses,
        ]);
    }

    public function getProductsBySupplier(Request $request)
    {
        $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'warehouse_id' => 'required|exists:warehouses,id',
        ]);

        // Get products that were bought from this supplier and have stock
        $products = \App\Models\Product::byAccount(auth()->user()->account_id)
            ->products() // Only actual products, not services
            ->whereHas('goodsReceipts', function($query) use ($request) {
                $query->where('supplier_id', $request->supplier_id);
            })
            ->whereHas('productStocks', function($query) use ($request) {
                $query->where('warehouse_id', $request->warehouse_id)
                      ->where('quantity', '>', 0);
            })
            ->with([
                'productStocks' => function($query) use ($request) {
                    $query->where('warehouse_id', $request->warehouse_id)
                          ->where('quantity', '>', 0);
                },
                'variants' => function($query) use ($request) {
                    $query->whereHas('productStocks', function($q) use ($request) {
                        $q->where('warehouse_id', $request->warehouse_id)
                          ->where('quantity', '>', 0);
                    })
                    ->with(['productStocks' => function($q) use ($request) {
                        $q->where('warehouse_id', $request->warehouse_id);
                    }]);
                }
            ])
            ->get()
            ->map(function($product) {
                $stock = $product->productStocks->first();

                // Map variants with their stock
                $variants = $product->variants->map(function($variant) {
                    $variantStock = $variant->productStocks->first();
                    return [
                        'id' => $variant->id,
                        'size' => $variant->size,
                        'color' => $variant->color,
                        'barcode' => $variant->barcode,
                        'sku' => $variant->sku,
                        'available_quantity' => $variantStock ? $variantStock->quantity : 0,
                    ];
                });

                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'barcode' => $product->barcode,
                    'unit_price' => $product->unit_price,
                    'packaging_price' => $product->getPackagingPrice(),
                    'packaging_size' => $product->packaging_size,
                    'base_unit' => $product->base_unit,
                    'packaging_quantity' => $product->packaging_quantity,
                    'available_quantity' => $stock ? $stock->quantity : 0,
                    'variants' => $variants,
                ];
            });

        return response()->json($products);
    }

    public function store(Request $request)
    {
        Gate::authorize('create', ProductReturn::class);

        $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'product_id' => 'required|exists:products,id',
            'variant_id' => 'nullable|exists:product_variants,id',
            'warehouse_id' => 'required|exists:warehouses,id',
            'quantity' => 'required|numeric|min:0.001',
            'unit_cost' => 'required|numeric|min:0',
            'return_date' => 'required|date',
            'reason' => 'required|string|max:1000',
        ]);

        // Validate variant belongs to product and account
        if (!empty($request->variant_id)) {
            $variant = ProductVariant::where('id', $request->variant_id)
                ->where('account_id', auth()->user()->account_id)
                ->where('product_id', $request->product_id)
                ->first();

            if (!$variant) {
                return redirect()->back()
                    ->withErrors(['variant_id' => 'Seçilmiş variant bu məhsula aid deyil və ya mövcud deyil.'])
                    ->withInput();
            }
        }

        // Check if sufficient stock exists
        $currentStock = ProductStock::where('product_id', $request->product_id)
            ->where('variant_id', $request->variant_id)
            ->where('warehouse_id', $request->warehouse_id)
            ->where('account_id', auth()->user()->account_id)
            ->first();

        if (!$currentStock || $currentStock->quantity < $request->quantity) {
            return redirect()->back()
                ->withErrors(['quantity' => 'Anbarda kifayət qədər məhsul yoxdur.'])
                ->withInput();
        }

        $productReturn = ProductReturn::create([
            'account_id' => auth()->user()->account_id,
            'supplier_id' => $request->supplier_id,
            'product_id' => $request->product_id,
            'variant_id' => $request->variant_id,
            'warehouse_id' => $request->warehouse_id,
            'quantity' => $request->quantity,
            'unit_cost' => $request->unit_cost,
            'total_cost' => $request->quantity * $request->unit_cost,
            'reason' => $request->reason,
            'status' => 'gozlemede',
            'return_date' => $request->return_date,
            'requested_by' => auth()->user()->id,
        ]);

        return redirect()->route('product-returns.index')
            ->with('success', __('app.return_processed'));
    }

    public function approve(Request $request, ProductReturn $return)
    {
        Gate::authorize('update', $return);

        // Verify return belongs to current account
        if ($return->account_id !== auth()->user()->account_id) {
            abort(403);
        }

        $request->validate([
            'approved_by' => 'required|exists:users,employee_id',
        ]);

        $return->update([
            'status' => 'tesdiq_edilib',
            'approved_by' => $request->approved_by,
        ]);

        return redirect()->back()->with('success', __('app.return_approved'));
    }

    public function send(ProductReturn $return)
    {
        Gate::authorize('update', $return);

        // Verify return belongs to current account
        if ($return->account_id !== auth()->user()->account_id) {
            abort(403);
        }

        if (!$return->canBeSent()) {
            return redirect()->back()->with('error', 'Return cannot be sent');
        }

        DB::transaction(function () use ($return) {
            // Deduct stock when sending to supplier
            $this->deductStock($return);
            
            $return->update([
                'status' => 'gonderildi',
            ]);
        });

        return redirect()->back()->with('success', __('app.return_sent_to_supplier'));
    }

    public function complete(Request $request, ProductReturn $return)
    {
        Gate::authorize('update', $return);

        // Verify return belongs to current account
        if ($return->account_id !== auth()->user()->account_id) {
            abort(403);
        }

        $request->validate([
            'refund_amount' => 'nullable|numeric|min:0',
            'supplier_response' => 'nullable|string|max:1000',
        ]);

        $return->update([
            'status' => 'tamamlanib',
            'refund_amount' => $request->refund_amount,
            'refund_date' => $request->refund_amount ? now()->format('Y-m-d') : null,
            'supplier_response' => $request->supplier_response,
        ]);

        return redirect()->back()->with('success', __('app.return_completed'));
    }

    /**
     * Deduct stock from warehouse when items are sent back to supplier
     */
    private function deductStock(ProductReturn $return)
    {
        // Update ProductStock
        $productStock = ProductStock::where('product_id', $return->product_id)
            ->where('variant_id', $return->variant_id)
            ->where('warehouse_id', $return->warehouse_id)
            ->where('account_id', $return->account_id)
            ->first();

        if ($productStock) {
            $quantityBefore = $productStock->quantity;
            $productStock->decrement('quantity', $return->quantity);

            // Create stock history record
            StockHistory::create([
                'product_id' => $return->product_id,
                'variant_id' => $return->variant_id,
                'warehouse_id' => $return->warehouse_id,
                'quantity_before' => $quantityBefore,
                'quantity_change' => -$return->quantity,
                'quantity_after' => $quantityBefore - $return->quantity,
                'type' => 'qaytarma',
                'reference_type' => 'product_return',
                'reference_id' => $return->return_id,
                'user_id' => $return->requested_by,
                'notes' => "Təchizatçıya qaytarma: {$return->reason}",
                'occurred_at' => $return->return_date ?? now(),
            ]);
        }

        // Create StockMovement record
        StockMovement::create([
            'account_id' => $return->account_id,
            'warehouse_id' => $return->warehouse_id,
            'product_id' => $return->product_id,
            'variant_id' => $return->variant_id,
            'movement_type' => 'çıxış',
            'quantity' => $return->quantity,
            'unit_cost' => $return->unit_cost,
            'reference_type' => 'product_return',
            'reference_id' => $return->return_id,
            'employee_id' => $return->requested_by,
            'notes' => "Təchizatçıya qaytarma: {$return->reason}",
        ]);
    }
}
