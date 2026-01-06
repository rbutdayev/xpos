<?php

namespace App\Http\Controllers;

use App\Models\WarehouseTransfer;
use App\Models\Warehouse;
use App\Models\Product;
use App\Models\ProductStock;
use App\Models\ProductVariant;
use App\Models\StockHistory;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class WarehouseTransferController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
        $this->middleware('account.access');
    }

    public function index(Request $request)
    {
        Gate::authorize('viewAny', WarehouseTransfer::class);

        $transfers = WarehouseTransfer::with(['fromWarehouse', 'toWarehouse', 'product', 'variant', 'requestedBy'])
            ->byAccount(auth()->user()->account_id)
            ->latest()
            ->paginate(25);

        return Inertia::render('WarehouseTransfers/Index', [
            'transfers' => $transfers,
        ]);
    }

    public function create()
    {
        Gate::authorize('create', WarehouseTransfer::class);

        $warehouses = Warehouse::byAccount(auth()->user()->account_id)->get(['id', 'name']);
        $employees = User::where('account_id', auth()->user()->account_id)
            ->whereIn('role', ['warehouse_manager', 'sales_staff', 'tailor'])
            ->get(['id', 'name', 'position']);

        return Inertia::render('WarehouseTransfers/Create', [
            'warehouses' => $warehouses,
            'employees' => $employees,
        ]);
    }

    public function store(Request $request)
    {
        Gate::authorize('create', WarehouseTransfer::class);

        $request->validate([
            'from_warehouse_id' => 'required|exists:warehouses,id',
            'to_warehouse_id' => 'required|exists:warehouses,id|different:from_warehouse_id',
            'product_id' => 'required|exists:products,id',
            'variant_id' => 'nullable|exists:product_variants,id',
            'quantity' => 'required|numeric|min:0.01',
            'requested_by' => 'required|exists:users,id',
            'notes' => 'nullable|string|max:1000',
        ]);

        // Validate variant belongs to product and account
        if (!empty($request->variant_id)) {
            $variant = ProductVariant::where('id', $request->variant_id)
                ->where('account_id', auth()->user()->account_id)
                ->where('product_id', $request->product_id)
                ->first();

            if (!$variant) {
                return back()->withErrors([
                    'variant_id' => 'Seçilmiş variant bu məhsula aid deyil və ya mövcud deyil'
                ]);
            }
        }

        // Check if product exists in source warehouse with sufficient stock
        $productStock = ProductStock::where([
            'product_id' => $request->product_id,
            'variant_id' => $request->variant_id ?? null,
            'warehouse_id' => $request->from_warehouse_id,
            'account_id' => auth()->user()->account_id,
        ])->first();

        if (!$productStock || $productStock->quantity < $request->quantity) {
            return back()->withErrors([
                'quantity' => 'Mənbə anbarda kifayət qədər stok yoxdur. Mövcud: ' . ($productStock->quantity ?? 0)
            ]);
        }

        $transfer = WarehouseTransfer::create([
            'account_id' => auth()->user()->account_id,
            'from_warehouse_id' => $request->from_warehouse_id,
            'to_warehouse_id' => $request->to_warehouse_id,
            'product_id' => $request->product_id,
            'variant_id' => $request->variant_id ?? null,
            'quantity' => $request->quantity,
            'status' => 'tamamlanib',
            'requested_by' => $request->requested_by,
            'requested_at' => now(),
            'completed_at' => now(),
            'notes' => $request->notes,
        ]);

        // Immediately process the transfer
        DB::transaction(function () use ($transfer) {
            // 1. Deduct stock from source warehouse
            $this->updateWarehouseStock(
                $transfer->product_id,
                $transfer->variant_id,
                $transfer->from_warehouse_id,
                -$transfer->quantity,
                $transfer,
                'source'
            );

            // 2. Add stock to destination warehouse
            $this->updateWarehouseStock(
                $transfer->product_id,
                $transfer->variant_id,
                $transfer->to_warehouse_id,
                $transfer->quantity,
                $transfer,
                'destination'
            );

            // 3. Create stock movement records
            $this->createStockMovements($transfer);
        });

        return redirect()->route('warehouse-transfers.index')
            ->with('success', __('app.transfer_requested'));
    }

    public function getWarehouseProducts(Request $request)
    {
        $request->validate([
            'warehouse_id' => 'required|exists:warehouses,id',
        ]);

        $products = Product::byAccount(auth()->user()->account_id)
            ->products() // Only actual products, not services
            ->whereHas('stock', function ($query) use ($request) {
                $query->where('warehouse_id', $request->warehouse_id)
                      ->where('quantity', '>', 0);
            })
            ->with([
                'stock' => function ($query) use ($request) {
                    $query->where('warehouse_id', $request->warehouse_id);
                },
                'variants' => function ($query) {
                    $query->where('account_id', auth()->user()->account_id);
                }
            ])
            ->get(['id', 'name', 'sku', 'barcode'])
            ->map(function ($product) use ($request) {
                // Get stock grouped by variant
                $stockByVariant = $product->stock
                    ->where('warehouse_id', $request->warehouse_id)
                    ->groupBy('variant_id')
                    ->map(function ($stocks) {
                        return $stocks->sum('quantity');
                    });

                // Build variants array with stock info
                $variants = $product->variants->map(function ($variant) use ($stockByVariant) {
                    return [
                        'id' => $variant->id,
                        'size' => $variant->size,
                        'color' => $variant->color,
                        'sku' => $variant->sku,
                        'barcode' => $variant->barcode,
                        'available_stock' => $stockByVariant->get($variant->id, 0),
                    ];
                })->filter(function ($variant) {
                    return $variant['available_stock'] > 0;
                })->values();

                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'barcode' => $product->barcode,
                    'available_stock' => $stockByVariant->get(null, 0), // Stock without variant
                    'has_variants' => $product->variants->isNotEmpty(),
                    'variants' => $variants,
                ];
            });

        return response()->json($products);
    }

    public function show(WarehouseTransfer $warehouseTransfer)
    {
        Gate::authorize('view', $warehouseTransfer);

        // Verify transfer belongs to current account
        if ($warehouseTransfer->account_id !== auth()->user()->account_id) {
            abort(403);
        }

        $warehouseTransfer->load(['fromWarehouse', 'toWarehouse', 'product', 'variant', 'requestedBy', 'approvedBy']);

        return Inertia::render('WarehouseTransfers/Show', [
            'transfer' => $warehouseTransfer,
        ]);
    }

    public function edit(WarehouseTransfer $warehouseTransfer)
    {
        Gate::authorize('update', $warehouseTransfer);

        // Verify transfer belongs to current account
        if ($warehouseTransfer->account_id !== auth()->user()->account_id) {
            abort(403);
        }

        return redirect()->route('warehouse-transfers.index')
            ->with('error', 'Tamamlanmış transferlər redaktə edilə bilməz');
    }

    public function update(Request $request, WarehouseTransfer $warehouseTransfer)
    {
        Gate::authorize('update', $warehouseTransfer);

        // Verify transfer belongs to current account
        if ($warehouseTransfer->account_id !== auth()->user()->account_id) {
            abort(403);
        }

        // Only allow updating transfers that are completed
        if ($warehouseTransfer->status !== 'tamamlanib') {
            return redirect()->route('warehouse-transfers.index')
                ->with('error', 'Bu transfer artıq redaktə edilə bilməz');
        }

        return redirect()->route('warehouse-transfers.index')
            ->with('error', 'Tamamlanmış transferlər redaktə edilə bilməz');

        return redirect()->route('warehouse-transfers.index')
            ->with('success', __('app.transfer_updated'));
    }

    public function destroy(WarehouseTransfer $warehouseTransfer)
    {
        Gate::authorize('delete', $warehouseTransfer);

        // Verify transfer belongs to current account
        if ($warehouseTransfer->account_id !== auth()->user()->account_id) {
            abort(403);
        }

        return redirect()->route('warehouse-transfers.index')
            ->with('error', 'Tamamlanmış transferlər silinə bilməz');
    }

    /**
     * Bulk delete warehouse transfers
     */
    public function bulkDelete(Request $request)
    {
        Gate::authorize('viewAny', WarehouseTransfer::class);

        $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'required|integer|exists:warehouse_transfers,transfer_id',
        ]);

        $user = auth()->user();
        $deletedCount = 0;
        $failedTransfers = [];

        DB::beginTransaction();
        try {
            $transfers = WarehouseTransfer::whereIn('transfer_id', $request->ids)
                ->where('account_id', $user->account_id)
                ->get();

            foreach ($transfers as $transfer) {
                try {
                    // For now, we don't allow deletion of completed transfers
                    // You can implement reversal logic here if needed
                    $failedTransfers[] = "Transfer #{$transfer->transfer_id}";
                } catch (\Exception $e) {
                    \Log::error('Bulk transfer deletion failed', [
                        'transfer_id' => $transfer->transfer_id,
                        'error' => $e->getMessage(),
                    ]);
                    $failedTransfers[] = "Transfer #{$transfer->transfer_id}";
                }
            }

            DB::commit();

            if (count($failedTransfers) > 0) {
                $failedList = implode(', ', $failedTransfers);
                $message = $deletedCount > 0
                    ? "{$deletedCount} transfer silindi. Bu transferlər silinə bilmədi: {$failedList}"
                    : "Tamamlanmış transferlər silinə bilməz";

                return redirect()->route('warehouse-transfers.index')
                    ->with('warning', $message);
            }

            return redirect()->route('warehouse-transfers.index')
                ->with('success', "{$deletedCount} transfer uğurla silindi.");
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Bulk transfer deletion failed', [
                'error' => $e->getMessage(),
            ]);

            return redirect()->route('warehouse-transfers.index')
                ->with('error', 'Transferləri silərkən xəta baş verdi.');
        }
    }



    private function updateWarehouseStock(int $productId, ?int $variantId, int $warehouseId, float $quantityChange, WarehouseTransfer $transfer, string $direction): void
    {
        $stock = ProductStock::firstOrCreate([
            'product_id' => $productId,
            'variant_id' => $variantId,
            'warehouse_id' => $warehouseId,
            'account_id' => auth()->user()->account_id,
        ], [
            'quantity' => 0,
            'reserved_quantity' => 0,
            'min_level' => 3,
        ]);

        $quantityBefore = $stock->quantity;
        $stock->increment('quantity', $quantityChange);

        // Determine the type and notes based on the change
        $type = $quantityChange > 0 ? 'daxil_olma' : 'xaric_olma';

        if ($direction === 'source') {
            $notes = "Transfer {$transfer->toWarehouse->name} anbarına";
        } else {
            $notes = "Transfer {$transfer->fromWarehouse->name} anbarından";
        }

        // Create stock history record
        StockHistory::create([
            'product_id' => $productId,
            'variant_id' => $variantId,
            'warehouse_id' => $warehouseId,
            'quantity_before' => $quantityBefore,
            'quantity_change' => $quantityChange,
            'quantity_after' => $quantityBefore + $quantityChange,
            'type' => $type,
            'reference_type' => 'warehouse_transfer',
            'reference_id' => $transfer->transfer_id,
            'user_id' => $transfer->requested_by,
            'notes' => $notes,
            'occurred_at' => $transfer->completed_at ?? now(),
        ]);
    }

    private function createStockMovements(WarehouseTransfer $transfer): void
    {
        // Stock movement for outbound (source warehouse)
        StockMovement::create([
            'account_id' => $transfer->account_id,
            'product_id' => $transfer->product_id,
            'variant_id' => $transfer->variant_id,
            'warehouse_id' => $transfer->from_warehouse_id,
            'movement_type' => 'transfer',
            'quantity' => $transfer->quantity,
            'employee_id' => $transfer->requested_by,
            'reference_type' => 'warehouse_transfer',
            'reference_id' => $transfer->transfer_id,
            'notes' => "Transfer {$transfer->toWarehouse->name} anbarına",
        ]);

        // Stock movement for inbound (destination warehouse)
        StockMovement::create([
            'account_id' => $transfer->account_id,
            'product_id' => $transfer->product_id,
            'variant_id' => $transfer->variant_id,
            'warehouse_id' => $transfer->to_warehouse_id,
            'movement_type' => 'daxil_olma',
            'quantity' => $transfer->quantity,
            'employee_id' => $transfer->requested_by,
            'reference_type' => 'warehouse_transfer',
            'reference_id' => $transfer->transfer_id,
            'notes' => "Transfer {$transfer->fromWarehouse->name} anbarından",
        ]);
    }

}
