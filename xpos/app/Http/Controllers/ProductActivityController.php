<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductStock;
use App\Models\StockHistory;
use App\Models\Warehouse;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ProductActivityController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
        $this->middleware('account.access');
    }

    /**
     * Display the product activity timeline
     */
    public function timeline(Request $request)
    {
        Gate::authorize('access-account-data');

        $validated = $request->validate([
            'product_id' => 'nullable|integer|exists:products,id',
            'warehouse_id' => 'nullable|integer|exists:warehouses,id',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'per_page' => 'nullable|integer|min:10|max:100',
        ]);

        // Products will be loaded via ProductSelect component API
        $products = [];

        $warehouses = Warehouse::where('account_id', auth()->user()->account_id)
            ->select('id', 'name')
            ->get();

        $activities = [];
        $productInfo = null;

        if (isset($validated['product_id'])) {
            $product = Product::where('id', $validated['product_id'])
                ->where('account_id', auth()->user()->account_id)
                ->first();

            if (!$product) {
                abort(403);
            }

            $productInfo = [
                'id' => $product->id,
                'name' => $product->name,
                'sku' => $product->sku,
                'barcode' => $product->barcode,
            ];

            // Get current stock levels
            $currentStocks = ProductStock::where('product_id', $product->id)
                ->where('account_id', auth()->user()->account_id)
                ->with('warehouse:id,name')
                ->when(isset($validated['warehouse_id']), function ($query) use ($validated) {
                    $query->where('warehouse_id', $validated['warehouse_id']);
                })
                ->get()
                ->map(function ($stock) {
                    return [
                        'warehouse_id' => $stock->warehouse_id,
                        'warehouse_name' => $stock->warehouse->name,
                        'quantity' => $stock->quantity,
                        'min_level' => $stock->min_level,
                        'max_level' => $stock->max_level,
                    ];
                });

            $productInfo['current_stocks'] = $currentStocks;

            // Get stock history
            $query = StockHistory::where('product_id', $product->id)
                ->with(['warehouse:id,name', 'user:id,name'])
                ->when(isset($validated['warehouse_id']), function ($query) use ($validated) {
                    $query->where('warehouse_id', $validated['warehouse_id']);
                })
                ->when(isset($validated['start_date']), function ($query) use ($validated) {
                    $query->where('occurred_at', '>=', $validated['start_date']);
                })
                ->when(isset($validated['end_date']), function ($query) use ($validated) {
                    $query->where('occurred_at', '<=', $validated['end_date'] . ' 23:59:59');
                })
                ->orderBy('occurred_at', 'desc');

            $perPage = $validated['per_page'] ?? 50;
            $histories = $query->paginate($perPage);

            // Also get related stock movements for additional context (qaime numbers, etc.)
            $movementMap = [];
            if ($histories->isNotEmpty()) {
                $movements = StockMovement::where('product_id', $product->id)
                    ->where('account_id', auth()->user()->account_id)
                    ->when(isset($validated['warehouse_id']), function ($query) use ($validated) {
                        $query->where('warehouse_id', $validated['warehouse_id']);
                    })
                    ->when(isset($validated['start_date']), function ($query) use ($validated) {
                        $query->whereDate('created_at', '>=', $validated['start_date']);
                    })
                    ->when(isset($validated['end_date']), function ($query) use ($validated) {
                        $query->whereDate('created_at', '<=', $validated['end_date']);
                    })
                    ->get();

                foreach ($movements as $movement) {
                    $key = $movement->warehouse_id . '_' . $movement->movement_type . '_' . $movement->created_at->format('Y-m-d H:i');
                    $movementMap[$key] = [
                        'notes' => $movement->notes,
                    ];
                }
            }

            // Format activities for timeline
            $activities = $histories->through(function ($history) use ($movementMap) {
                // Get user display name - handle cases where name is actually an email
                $userName = 'System';
                if ($history->user) {
                    $name = $history->user->name;
                    // If name looks like an email, extract the username part
                    if (str_contains($name, '@')) {
                        $userName = ucfirst(explode('@', $name)[0]);
                    } else {
                        $userName = $name;
                    }
                }

                $activity = [
                    'id' => $history->id,
                    'type' => $history->type,
                    'type_label' => $this->getTypeLabel($history->type),
                    'quantity_before' => $history->quantity_before,
                    'quantity_change' => $history->quantity_change,
                    'quantity_after' => $history->quantity_after,
                    'warehouse_id' => $history->warehouse_id,
                    'warehouse_name' => $history->warehouse->name ?? 'N/A',
                    'user_name' => $userName,
                    'occurred_at' => $history->occurred_at,
                    'occurred_at_formatted' => $history->occurred_at->format('d M Y, H:i'),
                    'notes' => $history->notes,
                    'reference_type' => $history->reference_type,
                    'reference_id' => $history->reference_id,
                    'color' => $this->getActivityColor($history->type, $history->quantity_change),
                    'icon' => $this->getActivityIcon($history->type),
                ];

                // Try to find matching movement for additional info
                $key = $history->warehouse_id . '_' . $this->mapHistoryTypeToMovementType($history->type) . '_' . $history->occurred_at->format('Y-m-d H:i');
                if (isset($movementMap[$key])) {
                    if (!$activity['notes'] && $movementMap[$key]['notes']) {
                        $activity['notes'] = $movementMap[$key]['notes'];
                    }
                }

                return $activity;
            });
        }

        return Inertia::render('ProductActivity/Timeline', [
            'products' => $products,
            'warehouses' => $warehouses,
            'activities' => $activities,
            'productInfo' => $productInfo,
            'filters' => $request->only(['product_id', 'warehouse_id', 'start_date', 'end_date']),
        ]);
    }

    /**
     * Display the stock discrepancy investigation form
     */
    public function discrepancy(Request $request)
    {
        Gate::authorize('access-account-data');

        // Products will be loaded via ProductSelect component API
        $products = [];

        $warehouses = Warehouse::where('account_id', auth()->user()->account_id)
            ->select('id', 'name')
            ->get();

        return Inertia::render('ProductActivity/Discrepancy', [
            'products' => $products,
            'warehouses' => $warehouses,
        ]);
    }

    /**
     * Investigate a stock discrepancy
     */
    public function investigate(Request $request)
    {
        Gate::authorize('access-account-data');

        $validated = $request->validate([
            'product_id' => 'required|integer|exists:products,id',
            'warehouse_id' => 'required|integer|exists:warehouses,id',
            'expected_quantity' => 'required|numeric',
            'actual_quantity' => 'required|numeric',
            'date_noticed' => 'required|date',
        ]);

        // Verify product belongs to account
        $product = Product::where('id', $validated['product_id'])
            ->where('account_id', auth()->user()->account_id)
            ->first();

        if (!$product) {
            abort(403);
        }

        // Verify warehouse belongs to account
        $warehouse = Warehouse::where('id', $validated['warehouse_id'])
            ->where('account_id', auth()->user()->account_id)
            ->first();

        if (!$warehouse) {
            abort(403);
        }

        // Get current stock
        $currentStock = ProductStock::where('product_id', $product->id)
            ->where('warehouse_id', $warehouse->id)
            ->where('account_id', auth()->user()->account_id)
            ->first();

        $systemQuantity = $currentStock ? $currentStock->quantity : 0;

        // Get all movements up to the date noticed
        $movements = StockHistory::where('product_id', $product->id)
            ->where('warehouse_id', $warehouse->id)
            ->where('occurred_at', '<=', $validated['date_noticed'] . ' 23:59:59')
            ->with(['user:id,name'])
            ->orderBy('occurred_at', 'asc')
            ->get();

        // Calculate expected quantity based on movements
        $calculatedQuantity = 0;
        $movementSummary = [
            'total_in' => 0,
            'total_out' => 0,
            'transfers_in' => 0,
            'transfers_out' => 0,
            'adjustments' => 0,
            'count' => $movements->count(),
        ];

        $recentMovements = [];
        foreach ($movements as $movement) {
            $calculatedQuantity = $movement->quantity_after;

            // Summary statistics
            if ($movement->quantity_change > 0) {
                $movementSummary['total_in'] += $movement->quantity_change;
                if ($movement->type === 'transfer_in') {
                    $movementSummary['transfers_in'] += $movement->quantity_change;
                }
            } else {
                $movementSummary['total_out'] += abs($movement->quantity_change);
                if ($movement->type === 'transfer_out') {
                    $movementSummary['transfers_out'] += abs($movement->quantity_change);
                }
            }

            if ($movement->type === 'adjustment') {
                $movementSummary['adjustments'] += abs($movement->quantity_change);
            }

            // Keep last 10 movements for display
            if (count($recentMovements) < 10) {
                // Get user display name - handle cases where name is actually an email
                $userName = 'System';
                if ($movement->user) {
                    $name = $movement->user->name;
                    // If name looks like an email, extract the username part
                    if (str_contains($name, '@')) {
                        $userName = ucfirst(explode('@', $name)[0]);
                    } else {
                        $userName = $name;
                    }
                }

                $recentMovements[] = [
                    'type' => $this->getTypeLabel($movement->type),
                    'quantity_change' => $movement->quantity_change,
                    'quantity_after' => $movement->quantity_after,
                    'user_name' => $userName,
                    'occurred_at' => $movement->occurred_at->format('d M Y, H:i'),
                    'notes' => $movement->notes,
                ];
            }
        }

        $recentMovements = array_reverse($recentMovements);

        // Calculate discrepancy
        $discrepancy = $validated['actual_quantity'] - $systemQuantity;

        // Determine possible causes
        $possibleCauses = [];
        if (abs($discrepancy) > 0.01) {
            if ($discrepancy < 0) {
                $possibleCauses[] = 'Qeydə alınmamış satış və ya çıxış';
                $possibleCauses[] = 'Sistemdə qeydə alınmamış transfer';
                $possibleCauses[] = 'Sənədləşdirilməmiş zərər və ya itki';
            } else {
                $possibleCauses[] = 'Qeydə alınmamış qəbul və ya alış';
                $possibleCauses[] = 'Qeydə alınmamış giriş transferi';
                $possibleCauses[] = 'İkiqat daxiletmə xətası';
            }

            if ($movementSummary['transfers_out'] > 0 && $discrepancy < 0) {
                $possibleCauses[] = 'Son transferləri yoxlayın - natamam ola bilər';
            }
        }

        return response()->json([
            'investigation' => [
                'product' => [
                    'id' => $product->id,
                    'name' => $product->name,
                    'sku' => $product->sku,
                ],
                'warehouse' => [
                    'id' => $warehouse->id,
                    'name' => $warehouse->name,
                ],
                'quantities' => [
                    'system' => $systemQuantity,
                    'expected' => $validated['expected_quantity'],
                    'actual' => $validated['actual_quantity'],
                    'calculated' => $calculatedQuantity,
                    'discrepancy' => $discrepancy,
                ],
                'movement_summary' => $movementSummary,
                'recent_movements' => $recentMovements,
                'possible_causes' => $possibleCauses,
                'date_noticed' => $validated['date_noticed'],
            ],
        ]);
    }

    /**
     * Create a stock adjustment to fix discrepancy
     */
    public function createAdjustment(Request $request)
    {
        Gate::authorize('manage-services'); // Using existing gate for write operations

        $validated = $request->validate([
            'product_id' => 'required|integer|exists:products,id',
            'warehouse_id' => 'required|integer|exists:warehouses,id',
            'adjustment_quantity' => 'required|numeric',
            'reason' => 'required|string|max:500',
        ]);

        // Verify ownership
        $product = Product::where('id', $validated['product_id'])
            ->where('account_id', auth()->user()->account_id)
            ->firstOrFail();

        $warehouse = Warehouse::where('id', $validated['warehouse_id'])
            ->where('account_id', auth()->user()->account_id)
            ->firstOrFail();

        DB::beginTransaction();
        try {
            // Get or create product stock
            $productStock = ProductStock::firstOrCreate(
                [
                    'account_id' => auth()->user()->account_id,
                    'product_id' => $product->id,
                    'warehouse_id' => $warehouse->id,
                ],
                [
                    'quantity' => 0,
                    'min_level' => 0,
                    'max_level' => 0,
                ]
            );

            $quantityBefore = $productStock->quantity;
            $quantityAfter = $quantityBefore + $validated['adjustment_quantity'];

            // Update stock
            $productStock->quantity = $quantityAfter;
            $productStock->save();

            // Create stock history
            StockHistory::create([
                'product_id' => $product->id,
                'warehouse_id' => $warehouse->id,
                'quantity_before' => $quantityBefore,
                'quantity_change' => $validated['adjustment_quantity'],
                'quantity_after' => $quantityAfter,
                'type' => 'adjustment',
                'reference_type' => 'manual_adjustment',
                'reference_id' => null,
                'user_id' => auth()->id(),
                'notes' => 'Fərq düzəlişi: ' . $validated['reason'],
                'occurred_at' => now(),
            ]);

            // Create stock movement
            StockMovement::create([
                'account_id' => auth()->user()->account_id,
                'warehouse_id' => $warehouse->id,
                'product_id' => $product->id,
                'movement_type' => $validated['adjustment_quantity'] > 0 ? 'daxil_olma' : 'xaric_olma',
                'quantity' => abs($validated['adjustment_quantity']),
                'unit_cost' => 0,
                'reference_type' => 'manual_adjustment',
                'reference_id' => null,
                'employee_id' => auth()->id(),
                'notes' => 'Fərq düzəlişi: ' . $validated['reason'],
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Stok uğurla düzəldildi',
                'new_quantity' => $quantityAfter,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Stok düzəldilməsi uğursuz oldu: ' . $e->getMessage(),
            ], 500);
        }
    }

    private function getTypeLabel(string $type): string
    {
        $labels = [
            'daxil_olma' => 'Daxil Olma',
            'xaric_olma' => 'Xaric Olma',
            'transfer_in' => 'Transfer (Daxil)',
            'transfer_out' => 'Transfer (Xaric)',
            'adjustment' => 'Düzəliş',
            'inventory' => 'İnventar Sayımı',
        ];

        return $labels[$type] ?? ucfirst($type);
    }

    private function getActivityColor(string $type, float $quantityChange): string
    {
        if (in_array($type, ['daxil_olma', 'transfer_in']) || $quantityChange > 0) {
            return 'green';
        } elseif (in_array($type, ['xaric_olma', 'transfer_out']) || $quantityChange < 0) {
            return 'blue';
        } elseif ($type === 'adjustment') {
            return 'orange';
        }
        return 'gray';
    }

    private function getActivityIcon(string $type): string
    {
        $icons = [
            'daxil_olma' => 'arrow-down-circle',
            'xaric_olma' => 'arrow-up-circle',
            'transfer_in' => 'arrow-right-circle',
            'transfer_out' => 'arrow-left-circle',
            'adjustment' => 'adjustments',
            'inventory' => 'clipboard',
        ];

        return $icons[$type] ?? 'circle';
    }

    private function mapHistoryTypeToMovementType(string $historyType): string
    {
        $map = [
            'daxil_olma' => 'daxil_olma',
            'xaric_olma' => 'xaric_olma',
            'transfer_in' => 'transfer',
            'transfer_out' => 'transfer',
            'adjustment' => 'daxil_olma', // Could be either
        ];

        return $map[$historyType] ?? $historyType;
    }
}
