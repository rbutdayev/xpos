<?php

namespace App\Http\Controllers;

use App\Models\ProductReturn;
use App\Models\ProductReturnItem;
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
        Gate::authorize('access-account-data');

        $returns = ProductReturn::with(['supplier', 'product', 'variant', 'warehouse', 'requestedBy', 'items.product'])
            ->byAccount(auth()->user()->account_id)
            ->latest()
            ->paginate(25);

        return Inertia::render('ProductReturns/Index', [
            'returns' => $returns,
        ]);
    }

    public function create()
    {
        Gate::authorize('manage-inventory');

        $suppliers = \App\Models\Supplier::byAccount(auth()->user()->account_id)->get();
        $warehouses = \App\Models\Warehouse::byAccount(auth()->user()->account_id)->get();

        return Inertia::render('ProductReturns/Create', [
            'suppliers' => $suppliers,
            'warehouses' => $warehouses,
        ]);
    }

    public function show(ProductReturn $productReturn)
    {
        Gate::authorize('access-account-data', $productReturn);

        $productReturn->load(['supplier', 'product', 'variant', 'warehouse', 'requestedBy', 'approvedBy', 'items.product']);

        return Inertia::render('ProductReturns/Show', [
            'productReturn' => $productReturn,
        ]);
    }

    public function destroy(ProductReturn $productReturn)
    {
        Gate::authorize('delete-account-data');
        Gate::authorize('access-account-data', $productReturn);

        // Only allow deletion if status is completed and we need to reverse the stock
        if ($productReturn->status === 'tamamlanib') {
            DB::transaction(function () use ($productReturn) {
                // Check if this is a multi-item return
                $productReturn->load('items');

                if ($productReturn->items && $productReturn->items->count() > 0) {
                    // Multi-item return - restore stock for each item
                    foreach ($productReturn->items as $item) {
                        $this->restoreStockForItem($item, $productReturn);
                    }

                    // Delete all items
                    $productReturn->items()->delete();
                } else {
                    // Legacy single-item return - restore stock for the single product
                    if ($productReturn->product_id) {
                        $this->restoreSingleProductStock($productReturn);
                    }
                }

                // Delete the return
                $productReturn->delete();
            });
        } else {
            // If not completed, just delete without reversing stock
            DB::transaction(function () use ($productReturn) {
                // Delete items first if they exist
                if ($productReturn->items) {
                    $productReturn->items()->delete();
                }
                $productReturn->delete();
            });
        }

        return redirect()->route('product-returns.index')
            ->with('success', 'Qaytarma silindi və stok bərpa edildi.');
    }

    /**
     * Restore stock for a specific return item
     */
    private function restoreStockForItem(ProductReturnItem $item, ProductReturn $return)
    {
        // Reverse the stock deduction - add the quantity back
        $productStock = ProductStock::where('product_id', $item->product_id)
            ->where('variant_id', $item->variant_id)
            ->where('warehouse_id', $return->warehouse_id)
            ->where('account_id', $return->account_id)
            ->first();

        if ($productStock) {
            $quantityBefore = $productStock->quantity;
            $productStock->increment('quantity', $item->quantity);

            // Create stock history record for reversal
            StockHistory::create([
                'product_id' => $item->product_id,
                'warehouse_id' => $return->warehouse_id,
                'quantity_before' => $quantityBefore,
                'quantity_change' => $item->quantity,
                'quantity_after' => $quantityBefore + floatval($item->quantity),
                'type' => 'duzelis_artim',
                'reference_type' => 'product_return_reversal',
                'reference_id' => $return->return_id,
                'user_id' => auth()->user()->id,
                'notes' => "Qaytarmanın ləğvi: {$return->reason}",
                'occurred_at' => now(),
            ]);
        }

        // Create reversal stock movement
        StockMovement::create([
            'account_id' => $return->account_id,
            'warehouse_id' => $return->warehouse_id,
            'product_id' => $item->product_id,
            'variant_id' => $item->variant_id,
            'movement_type' => 'duzelis_artim', // Adjustment increase - reversing the return
            'quantity' => $item->quantity,
            'unit_cost' => $item->unit_cost,
            'reference_type' => 'product_return_reversal',
            'reference_id' => $return->return_id,
            'employee_id' => auth()->user()->id,
            'notes' => "Qaytarmanın ləğvi: {$return->reason}",
        ]);
    }

    /**
     * Restore stock for legacy single-product return
     */
    private function restoreSingleProductStock(ProductReturn $productReturn)
    {
        // Reverse the stock deduction - add the quantity back
        $productStock = ProductStock::where('product_id', $productReturn->product_id)
            ->where('variant_id', $productReturn->variant_id)
            ->where('warehouse_id', $productReturn->warehouse_id)
            ->where('account_id', $productReturn->account_id)
            ->first();

        if ($productStock) {
            $quantityBefore = $productStock->quantity;
            $productStock->increment('quantity', $productReturn->quantity);

            // Create stock history record for reversal
            StockHistory::create([
                'product_id' => $productReturn->product_id,
                'warehouse_id' => $productReturn->warehouse_id,
                'quantity_before' => $quantityBefore,
                'quantity_change' => $productReturn->quantity,
                'quantity_after' => $quantityBefore + $productReturn->quantity,
                'type' => 'duzelis_artim',
                'reference_type' => 'product_return_reversal',
                'reference_id' => $productReturn->return_id,
                'user_id' => auth()->user()->id,
                'notes' => "Qaytarmanın ləğvi: {$productReturn->reason}",
                'occurred_at' => now(),
            ]);
        }

        // Create reversal stock movement
        StockMovement::create([
            'account_id' => $productReturn->account_id,
            'warehouse_id' => $productReturn->warehouse_id,
            'product_id' => $productReturn->product_id,
            'variant_id' => $productReturn->variant_id,
            'movement_type' => 'duzelis_artim', // Adjustment increase - reversing the return
            'quantity' => $productReturn->quantity,
            'unit_cost' => $productReturn->unit_cost,
            'reference_type' => 'product_return_reversal',
            'reference_id' => $productReturn->return_id,
            'employee_id' => auth()->user()->id,
            'notes' => "Qaytarmanın ləğvi: {$productReturn->reason}",
        ]);
    }

    public function getProductsBySupplier(Request $request)
    {
        $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'warehouse_id' => 'required|exists:warehouses,id',
        ]);

        // Get products that were bought from this supplier and have stock
        // We use goods_receipt_items to find products that have been received from this supplier
        $products = \App\Models\Product::byAccount(auth()->user()->account_id)
            ->products() // Only actual products, not services
            ->whereHas('goodsReceiptItems', function($query) use ($request) {
                $query->whereHas('goodsReceipt', function($q) use ($request) {
                    $q->where('supplier_id', $request->supplier_id)
                      ->where('account_id', auth()->user()->account_id);
                });
            })
            ->whereHas('productStocks', function($query) use ($request) {
                $query->where('warehouse_id', $request->warehouse_id)
                      ->where('account_id', auth()->user()->account_id)
                      ->where('quantity', '>', 0);
            })
            ->with([
                'productStocks' => function($query) use ($request) {
                    $query->where('warehouse_id', $request->warehouse_id)
                          ->where('account_id', auth()->user()->account_id)
                          ->where('quantity', '>', 0);
                },
                'variants' => function($query) use ($request) {
                    $query->whereHas('productStocks', function($q) use ($request) {
                        $q->where('warehouse_id', $request->warehouse_id)
                          ->where('account_id', auth()->user()->account_id)
                          ->where('quantity', '>', 0);
                    })
                    ->with(['productStocks' => function($q) use ($request) {
                        $q->where('warehouse_id', $request->warehouse_id)
                          ->where('account_id', auth()->user()->account_id);
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
                    'unit_price' => $product->purchase_price, // Use purchase price for returns
                    'packaging_price' => ($product->purchase_price && $product->packaging_quantity)
                        ? $product->purchase_price * $product->packaging_quantity
                        : null,
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
        Gate::authorize('manage-inventory');

        $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'warehouse_id' => 'required|exists:warehouses,id',
            'return_date' => 'required|date',
            'reason' => 'required|string|max:1000',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.variant_id' => 'nullable|exists:product_variants,id',
            'items.*.quantity' => 'required|numeric|min:0.001',
            'items.*.unit' => 'required|string',
            'items.*.unit_cost' => 'required|numeric|min:0',
        ]);

        // Calculate total cost from all items
        $totalCost = 0;
        $itemsData = [];

        foreach ($request->items as $index => $itemData) {
            // Get product for better error messages
            $product = \App\Models\Product::find($itemData['product_id']);
            $productName = $product ? $product->name : 'Məhsul';

            // Validate variant belongs to product and account if provided
            if (!empty($itemData['variant_id'])) {
                $variant = ProductVariant::where('id', $itemData['variant_id'])
                    ->where('account_id', auth()->user()->account_id)
                    ->where('product_id', $itemData['product_id'])
                    ->first();

                if (!$variant) {
                    return redirect()->back()
                        ->withErrors(['items' => "{$productName}: Seçilmiş variant məhsula aid deyil və ya mövcud deyil."])
                        ->withInput();
                }
            }

            // Check if sufficient stock exists
            $currentStock = ProductStock::where('product_id', $itemData['product_id'])
                ->where('variant_id', $itemData['variant_id'] ?? null)
                ->where('warehouse_id', $request->warehouse_id)
                ->where('account_id', auth()->user()->account_id)
                ->first();

            if (!$currentStock) {
                return redirect()->back()
                    ->withErrors(['items' => "{$productName}: Anbarda stok qeydi tapılmadı."])
                    ->withInput();
            }

            if ($currentStock->quantity < $itemData['quantity']) {
                return redirect()->back()
                    ->withErrors(['items' => "{$productName}: Anbarda kifayət qədər məhsul yoxdur. Mövcud: {$currentStock->quantity}, Tələb: {$itemData['quantity']}"])
                    ->withInput();
            }

            // Calculate item total
            $itemTotal = $itemData['quantity'] * $itemData['unit_cost'];
            $totalCost += $itemTotal;

            // Prepare item data for creation
            $itemsData[] = [
                'account_id' => auth()->user()->account_id,
                'product_id' => $itemData['product_id'],
                'variant_id' => $itemData['variant_id'] ?? null,
                'quantity' => $itemData['quantity'],
                'unit' => $itemData['unit'],
                'unit_cost' => $itemData['unit_cost'],
                'total_cost' => $itemTotal,
            ];
        }

        // Use transaction to ensure both return and stock deduction happen together
        try {
            DB::transaction(function () use ($request, $totalCost, $itemsData, &$productReturn) {
                // Create the product return parent record
                $productReturn = ProductReturn::create([
                    'account_id' => auth()->user()->account_id,
                    'supplier_id' => $request->supplier_id,
                    'product_id' => null, // Not used in multi-item returns
                    'variant_id' => null,
                    'warehouse_id' => $request->warehouse_id,
                    'quantity' => 0, // Not used in multi-item returns
                    'unit_cost' => 0,
                    'total_cost' => $totalCost,
                    'reason' => $request->reason,
                    'status' => 'tamamlanib', // Automatically completed
                    'return_date' => $request->return_date,
                    'requested_by' => auth()->user()->id,
                    'approved_by' => auth()->user()->id, // Auto-approved by creator
                ]);

                // Create return items and deduct stock for each
                foreach ($itemsData as $itemData) {
                    // Add return_id to item data
                    $itemData['return_id'] = $productReturn->return_id;

                    // Create the return item
                    $returnItem = ProductReturnItem::create($itemData);

                    // Deduct stock for this item
                    $this->deductStockForItem($returnItem, $productReturn);
                }
            });

            return redirect()->route('product-returns.index')
                ->with('success', __('app.return_processed'));
        } catch (\Exception $e) {
            \Log::error('Product return creation failed: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return redirect()->back()
                ->withErrors(['error' => 'Qaytarma yaradılarkən xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.'])
                ->withInput();
        }
    }

    public function approve(Request $request, ProductReturn $productReturn)
    {
        Gate::authorize('manage-inventory');
        Gate::authorize('access-account-data', $productReturn);

        $request->validate([
            'approved_by' => 'required|exists:users,employee_id',
        ]);

        $productReturn->update([
            'status' => 'tesdiq_edilib',
            'approved_by' => $request->approved_by,
        ]);

        return redirect()->back()->with('success', __('app.return_approved'));
    }

    public function send(ProductReturn $productReturn)
    {
        Gate::authorize('manage-inventory');
        Gate::authorize('access-account-data', $productReturn);

        if (!$productReturn->canBeSent()) {
            return redirect()->back()->with('error', 'Return cannot be sent');
        }

        DB::transaction(function () use ($productReturn) {
            // Deduct stock when sending to supplier
            $this->deductStock($productReturn);

            $productReturn->update([
                'status' => 'gonderildi',
            ]);
        });

        return redirect()->back()->with('success', __('app.return_sent_to_supplier'));
    }

    public function complete(Request $request, ProductReturn $productReturn)
    {
        Gate::authorize('manage-inventory');
        Gate::authorize('access-account-data', $productReturn);

        $request->validate([
            'refund_amount' => 'nullable|numeric|min:0',
            'supplier_response' => 'nullable|string|max:1000',
        ]);

        $productReturn->update([
            'status' => 'tamamlanib',
            'refund_amount' => $request->refund_amount,
            'refund_date' => $request->refund_amount ? now()->format('Y-m-d') : null,
            'supplier_response' => $request->supplier_response,
        ]);

        return redirect()->back()->with('success', __('app.return_completed'));
    }

    public function print(ProductReturn $productReturn)
    {
        Gate::authorize('access-account-data', $productReturn);

        $productReturn->load(['supplier', 'product', 'variant', 'warehouse', 'requestedBy', 'approvedBy', 'account', 'items.product', 'items.variant']);

        return view('product-returns.print', [
            'return' => $productReturn,
            'account' => $productReturn->account,
        ]);
    }

    /**
     * Deduct stock from warehouse when items are sent back to supplier
     * @deprecated Use deductStockForItem for multi-item returns
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
            'movement_type' => 'qaytarma',
            'quantity' => $return->quantity,
            'unit_cost' => $return->unit_cost,
            'reference_type' => 'product_return',
            'reference_id' => $return->return_id,
            'employee_id' => $return->requested_by,
            'notes' => "Təchizatçıya qaytarma: {$return->reason}",
        ]);
    }

    /**
     * Deduct stock for a specific return item
     */
    private function deductStockForItem(ProductReturnItem $item, ProductReturn $return)
    {
        // Update ProductStock
        $productStock = ProductStock::where('product_id', $item->product_id)
            ->where('variant_id', $item->variant_id)
            ->where('warehouse_id', $return->warehouse_id)
            ->where('account_id', $return->account_id)
            ->first();

        if ($productStock) {
            $quantityBefore = $productStock->quantity;
            $productStock->decrement('quantity', $item->quantity);

            // Create stock history record
            StockHistory::create([
                'product_id' => $item->product_id,
                'warehouse_id' => $return->warehouse_id,
                'quantity_before' => $quantityBefore,
                'quantity_change' => -$item->quantity,
                'quantity_after' => $quantityBefore - $item->quantity,
                'type' => 'qaytarma',
                'reference_type' => 'product_return_item',
                'reference_id' => $item->id,
                'user_id' => $return->requested_by,
                'notes' => "Təchizatçıya qaytarma: {$return->reason}",
                'occurred_at' => $return->return_date ?? now(),
            ]);
        }

        // Create StockMovement record
        StockMovement::create([
            'account_id' => $return->account_id,
            'warehouse_id' => $return->warehouse_id,
            'product_id' => $item->product_id,
            'variant_id' => $item->variant_id,
            'movement_type' => 'qaytarma',
            'quantity' => $item->quantity,
            'unit_cost' => $item->unit_cost,
            'reference_type' => 'product_return_item',
            'reference_id' => $item->id,
            'employee_id' => $return->requested_by,
            'notes' => "Təchizatçıya qaytarma: {$return->reason}",
        ]);
    }
}
