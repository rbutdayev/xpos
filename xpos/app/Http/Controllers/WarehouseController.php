<?php

namespace App\Http\Controllers;

use App\Models\Warehouse;
use App\Models\WarehouseBranchAccess;
use App\Models\ProductStock;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

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
}
