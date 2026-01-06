<?php

namespace App\Http\Controllers;

use App\Models\Warehouse;
use App\Models\WarehouseBranchAccess;
use App\Models\ProductStock;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\QuickScanExport;

class WarehouseController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
        $this->middleware('account.access');
    }

    public function index()
    {
        Gate::authorize('manage-inventory');
        
        $warehouses = Auth::user()->account->warehouses()
            ->with(['branchAccess.branch'])
            ->get();
        
        return Inertia::render('Warehouse/Index', [
            'warehouses' => $warehouses
        ]);
    }

    public function create()
    {
        Gate::authorize('manage-inventory');
        
        $branches = Auth::user()->account->branches()->where('is_active', true)->get();
        
        return Inertia::render('Warehouse/Create', [
            'branches' => $branches
        ]);
    }

    public function store(Request $request)
    {
        Gate::authorize('manage-inventory');
        
        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:main,auxiliary,mobile',
            'location' => 'nullable|string',
            'description' => 'nullable|string',
            'branch_permissions' => 'array',
            'branch_permissions.*.branch_id' => 'required|exists:branches,id',
            'branch_permissions.*.can_transfer' => 'boolean',
            'branch_permissions.*.can_view_stock' => 'boolean',
            'branch_permissions.*.can_modify_stock' => 'boolean',
            'branch_permissions.*.can_receive_stock' => 'boolean',
            'branch_permissions.*.can_issue_stock' => 'boolean',
        ]);

        $warehouse = Auth::user()->account->warehouses()->create([
            'name' => $request->name,
            'type' => $request->type,
            'location' => $request->location,
            'description' => $request->description,
            'is_active' => true,
        ]);

        // Set branch permissions
        if ($request->has('branch_permissions')) {
            foreach ($request->branch_permissions as $permission) {
                $warehouse->grantBranchAccess($permission['branch_id'], [
                    'can_transfer' => $permission['can_transfer'] ?? false,
                    'can_view_stock' => $permission['can_view_stock'] ?? false,
                    'can_modify_stock' => $permission['can_modify_stock'] ?? false,
                    'can_receive_stock' => $permission['can_receive_stock'] ?? false,
                    'can_issue_stock' => $permission['can_issue_stock'] ?? false,
                ]);
            }
        }

        return redirect()->route('warehouses.index')
                        ->with('success', __('app.warehouse') . ' ' . __('app.saved_successfully'));
    }

    public function show(Warehouse $warehouse)
    {
        Gate::authorize('access-account-data', $warehouse);
        Gate::authorize('manage-inventory');
        
        $warehouse->load(['branchAccess.branch']);
        
        return Inertia::render('Warehouse/Show', [
            'warehouse' => $warehouse
        ]);
    }

    public function edit(Warehouse $warehouse)
    {
        Gate::authorize('access-account-data', $warehouse);
        Gate::authorize('manage-inventory');
        
        $warehouse->load(['branchAccess.branch']);
        $branches = Auth::user()->account->branches()->where('is_active', true)->get();
        
        return Inertia::render('Warehouse/Edit', [
            'warehouse' => $warehouse,
            'branches' => $branches
        ]);
    }

    public function update(Request $request, Warehouse $warehouse)
    {
        Gate::authorize('access-account-data', $warehouse);
        Gate::authorize('manage-inventory');
        
        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:main,auxiliary,mobile',
            'location' => 'nullable|string',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $warehouse->update($request->only([
            'name', 'type', 'location', 'description', 'is_active'
        ]));

        return redirect()->route('warehouses.show', $warehouse)
                        ->with('success', __('app.updated_successfully'));
    }

    public function updateBranchAccess(Request $request, Warehouse $warehouse)
    {
        Gate::authorize('access-account-data', $warehouse);
        Gate::authorize('manage-inventory');
        
        $request->validate([
            'branch_permissions' => 'required|array',
            'branch_permissions.*.branch_id' => 'required|exists:branches,id',
            'branch_permissions.*.can_transfer' => 'boolean',
            'branch_permissions.*.can_view_stock' => 'boolean',
            'branch_permissions.*.can_modify_stock' => 'boolean',
            'branch_permissions.*.can_receive_stock' => 'boolean',
            'branch_permissions.*.can_issue_stock' => 'boolean',
        ]);

        // Clear existing permissions
        $warehouse->branchAccess()->delete();

        // Set new permissions
        foreach ($request->branch_permissions as $permission) {
            $warehouse->grantBranchAccess($permission['branch_id'], [
                'can_transfer' => $permission['can_transfer'] ?? false,
                'can_view_stock' => $permission['can_view_stock'] ?? false,
                'can_modify_stock' => $permission['can_modify_stock'] ?? false,
                'can_receive_stock' => $permission['can_receive_stock'] ?? false,
                'can_issue_stock' => $permission['can_issue_stock'] ?? false,
            ]);
        }

        return redirect()->route('warehouses.show', $warehouse)
                        ->with('success', __('app.permissions') . ' ' . __('app.updated_successfully'));
    }

    public function destroy(Warehouse $warehouse)
    {
        Gate::authorize('access-account-data', $warehouse);
        Gate::authorize('manage-inventory');
        
        // Check if warehouse has stock or transactions before deletion
        // This would be implemented when we add product/stock modules
        
        $warehouse->delete();
        
        return redirect()->route('warehouses.index')
                        ->with('success', __('app.warehouse') . ' ' . __('app.deleted_successfully'));
    }

    public function inventory()
    {
        Gate::authorize('manage-inventory');
        
        $warehouses = Auth::user()->account->warehouses()
            ->where('is_active', true)
            ->get();
        
        return Inertia::render('Inventory/Index', [
            'warehouses' => $warehouses
        ]);
    }

    public function warehouseInventory(Request $request, Warehouse $warehouse)
    {
        Gate::authorize('access-account-data', $warehouse);
        Gate::authorize('manage-inventory');

        $query = ProductStock::with(['product.category', 'warehouse'])
            ->where('warehouse_id', $warehouse->id)
            ->where('account_id', Auth::user()->account_id);

        // Apply filters
        if ($request->has('search') && !empty($request->search)) {
            $request->validate(['search' => 'required|string|max:255']);
            $validated = $request->validated();
            $searchTerm = $validated['search'];
            $query->whereHas('product', function ($q) use ($searchTerm) {
                $q->where('name', 'like', '%' . $searchTerm . '%')
                  ->orWhere('sku', 'like', '%' . $searchTerm . '%')
                  ->orWhere('barcode', 'like', '%' . $searchTerm . '%');
            });
        }

        if ($request->has('category_id') && !empty($request->category_id)) {
            $query->whereHas('product', function ($q) use ($request) {
                $q->where('category_id', $request->category_id);
            });
        }

        if ($request->has('status') && !empty($request->status)) {
            switch ($request->status) {
                case 'low_stock':
                    $query->lowStock();
                    break;
                case 'out_of_stock':
                    $query->outOfStock();
                    break;
                case 'needs_reorder':
                    $query->needsReorder();
                    break;
            }
        }

        $productStock = $query->paginate(50);

        // Get categories for filter dropdown
        $categories = Auth::user()->account->categories()
            ->where('is_service', false)
            ->orderBy('name')
            ->get();

        return Inertia::render('Inventory/WarehouseInventory', [
            'warehouse' => $warehouse,
            'productStock' => $productStock,
            'categories' => $categories,
            'filters' => $request->only(['search', 'category_id', 'status'])
        ]);
    }

    public function bulkDelete(Request $request)
    {
        Gate::authorize('delete-account-data');
        Gate::authorize('manage-inventory');

        $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'required|integer|exists:warehouses,id',
        ]);

        $user = Auth::user();
        $deletedCount = 0;
        $failedWarehouses = [];

        DB::beginTransaction();
        try {
            $warehouses = Warehouse::whereIn('id', $request->ids)
                ->where('account_id', $user->account_id)
                ->get();

            foreach ($warehouses as $warehouse) {
                try {
                    // Check if warehouse has stock or transactions before deletion
                    $hasStock = ProductStock::where('warehouse_id', $warehouse->id)
                        ->where('quantity', '>', 0)
                        ->exists();

                    if ($hasStock) {
                        $failedWarehouses[] = $warehouse->name;
                        continue;
                    }

                    $warehouse->delete();
                    $deletedCount++;
                } catch (\Exception $e) {
                    $failedWarehouses[] = $warehouse->name;
                }
            }

            DB::commit();

            if ($deletedCount > 0 && count($failedWarehouses) === 0) {
                return redirect()->back()->with('success', "{$deletedCount} anbar uğurla silindi.");
            } elseif ($deletedCount > 0 && count($failedWarehouses) > 0) {
                return redirect()->back()->with('warning', "{$deletedCount} anbar silindi. " . count($failedWarehouses) . " anbar silinmədi (məhsul stoku var).");
            } else {
                return redirect()->back()->with('error', 'Heç bir anbar silinmədi. Anbarların məhsul stoku var.');
            }
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Anbarlar silinərkən xəta baş verdi: ' . $e->getMessage());
        }
    }

    /**
     * Quick Scan - Scan a barcode and count it in session
     */
    /**
     * Show Quick Scan page
     */
    public function showQuickScan(Warehouse $warehouse)
    {
        Gate::authorize('access-account-data', $warehouse);
        Gate::authorize('manage-inventory');

        return Inertia::render('Warehouse/QuickScan', [
            'warehouse' => $warehouse
        ]);
    }

    public function quickScan(Request $request, Warehouse $warehouse)
    {
        Gate::authorize('access-account-data', $warehouse);
        Gate::authorize('manage-inventory');

        $validated = $request->validate([
            'barcode' => 'required|string|max:255'
        ]);

        // Find product by barcode
        $product = Product::where('account_id', Auth::user()->account_id)
            ->where('barcode', $validated['barcode'])
            ->first();

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Məhsul tapılmadı'
            ], 404);
        }

        // Get database stock quantity for this warehouse
        $productStock = ProductStock::where('account_id', Auth::user()->account_id)
            ->where('product_id', $product->id)
            ->where('warehouse_id', $warehouse->id)
            ->first();

        $dbQuantity = $productStock ? (float)$productStock->quantity : 0;

        // Get or create session key for this warehouse
        $sessionKey = "quick_scan_{$warehouse->id}_" . Auth::id();
        $scans = session($sessionKey, []);

        // Check if product already scanned
        if (isset($scans[$validated['barcode']])) {
            $scans[$validated['barcode']]['count']++;
            $scans[$validated['barcode']]['db_quantity'] = $dbQuantity; // Update db_quantity every scan
            $scans[$validated['barcode']]['last_scanned_at'] = now()->toIso8601String();
            $scans[$validated['barcode']]['difference'] = $scans[$validated['barcode']]['count'] - $dbQuantity;
        } else {
            $scans[$validated['barcode']] = [
                'product_id' => $product->id,
                'product_name' => $product->name,
                'barcode' => $validated['barcode'],
                'sku' => $product->sku,
                'count' => 1,
                'db_quantity' => $dbQuantity,
                'difference' => 1 - $dbQuantity,
                'first_scanned_at' => now()->toIso8601String(),
                'last_scanned_at' => now()->toIso8601String()
            ];
        }

        // Save to session
        session([$sessionKey => $scans]);

        // Calculate stats
        $totalScans = array_sum(array_column($scans, 'count'));
        $uniqueProducts = count($scans);

        return response()->json([
            'success' => true,
            'product' => [
                'name' => $product->name,
                'barcode' => $product->barcode,
                'sku' => $product->sku,
            ],
            'current_count' => $scans[$validated['barcode']]['count'],
            'stats' => [
                'total_scans' => $totalScans,
                'unique_products' => $uniqueProducts
            ],
            'scans' => array_values($scans) // Return as array for frontend
        ]);
    }

    /**
     * Get current quick scan session data
     */
    public function getQuickScanSession(Request $request, Warehouse $warehouse)
    {
        Gate::authorize('access-account-data', $warehouse);
        Gate::authorize('manage-inventory');

        $sessionKey = "quick_scan_{$warehouse->id}_" . Auth::id();
        $scans = session($sessionKey, []);

        // Update database quantities and differences (in case stock changed)
        foreach ($scans as &$scan) {
            $productStock = ProductStock::where('account_id', Auth::user()->account_id)
                ->where('product_id', $scan['product_id'])
                ->where('warehouse_id', $warehouse->id)
                ->first();

            $dbQuantity = $productStock ? (float)$productStock->quantity : 0;
            $scan['db_quantity'] = $dbQuantity;
            $scan['difference'] = $scan['count'] - $dbQuantity;
        }

        $totalScans = array_sum(array_column($scans, 'count'));
        $uniqueProducts = count($scans);

        return response()->json([
            'scans' => array_values($scans),
            'stats' => [
                'total_scans' => $totalScans,
                'unique_products' => $uniqueProducts
            ]
        ]);
    }

    /**
     * Clear quick scan session
     */
    public function clearQuickScanSession(Request $request, Warehouse $warehouse)
    {
        Gate::authorize('access-account-data', $warehouse);
        Gate::authorize('manage-inventory');

        $sessionKey = "quick_scan_{$warehouse->id}_" . Auth::id();
        session()->forget($sessionKey);

        return response()->json([
            'success' => true,
            'message' => 'Sayım təmizləndi'
        ]);
    }

    /**
     * Export quick scan session to Excel
     */
    public function exportQuickScan(Request $request, Warehouse $warehouse)
    {
        Gate::authorize('access-account-data', $warehouse);
        Gate::authorize('manage-inventory');

        $sessionKey = "quick_scan_{$warehouse->id}_" . Auth::id();
        $scans = session($sessionKey, []);

        if (empty($scans)) {
            return redirect()->back()->with('error', 'Heç bir scan məlumatı yoxdur');
        }

        $export = new QuickScanExport($scans);
        $filename = "suretli_sayim_{$warehouse->name}_" . now()->format('Y-m-d_His') . '.xlsx';

        return Excel::download($export, $filename);
    }
}
