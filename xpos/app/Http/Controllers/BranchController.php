<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class BranchController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
        $this->middleware('account.access');
    }

    public function index(Request $request)
    {
        Gate::authorize('manage-branch-operations');
        
        $query = Auth::user()->account->branches()
            ->with(['warehouseAccess.warehouse']);
        
        // Search functionality
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ILIKE', "%{$search}%")
                  ->orWhere('address', 'ILIKE', "%{$search}%")
                  ->orWhere('description', 'ILIKE', "%{$search}%")
                  ->orWhere('phone', 'ILIKE', "%{$search}%")
                  ->orWhere('email', 'ILIKE', "%{$search}%");
            });
        }
        
        // Filter by status
        if ($request->filled('status')) {
            $query->where('is_active', $request->status === 'active');
        }
        
        // Sorting
        $sortField = $request->get('sort', 'name');
        $sortDirection = $request->get('direction', 'asc');
        $query->orderBy($sortField, $sortDirection);
        
        // For branches, we typically don't need pagination as there are usually few branches per account
        // But we'll provide it for SharedDataTable compatibility
        $perPage = $request->get('per_page', 25);
        $branches = $query->paginate($perPage)->withQueryString();
        
        return Inertia::render('Branch/Index', [
            'branches' => $branches,
            'filters' => [
                'search' => $request->search,
                'status' => $request->status,
                'sort' => $sortField,
                'direction' => $sortDirection
            ]
        ]);
    }

    public function create()
    {
        Gate::authorize('manage-branch-operations');
        
        return Inertia::render('Branch/Create');
    }

    public function store(Request $request)
    {
        Gate::authorize('manage-branch-operations');
        
        $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'is_main' => 'boolean',
            'working_hours' => 'nullable|array',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'description' => 'nullable|string',
        ]);

        // If this is set as main branch, unset other main branches
        if ($request->boolean('is_main')) {
            Auth::user()->account->branches()->update(['is_main' => false]);
        }

        $branch = Auth::user()->account->branches()->create([
            'name' => $request->name,
            'address' => $request->address,
            'phone' => $request->phone,
            'email' => $request->email,
            'is_main' => $request->boolean('is_main'),
            'working_hours' => $request->working_hours,
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
            'description' => $request->description,
            'is_active' => true,
        ]);

        return redirect()->route('branches.index')
                        ->with('success', __('app.branch') . ' ' . __('app.saved_successfully'));
    }

    public function show(Branch $branch)
    {
        Gate::authorize('access-account-data', $branch);
        Gate::authorize('manage-branch-operations');
        
        $branch->load(['warehouseAccess.warehouse']);
        
        return Inertia::render('Branch/Show', [
            'branch' => $branch
        ]);
    }

    public function edit(Branch $branch)
    {
        Gate::authorize('access-account-data', $branch);
        Gate::authorize('manage-branch-operations');
        
        $branch->load('warehouseAccess.warehouse');
        
        // Get all available warehouses for this account
        $warehouses = Auth::user()->account->warehouses()->get();
        
        return Inertia::render('Branch/Edit', [
            'branch' => $branch,
            'warehouses' => $warehouses,
            'currentWarehouseAccess' => $branch->warehouseAccess
        ]);
    }

    public function update(Request $request, Branch $branch)
    {
        Gate::authorize('access-account-data', $branch);
        Gate::authorize('manage-branch-operations');
        
        $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'is_main' => 'boolean',
            'working_hours' => 'nullable|array',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'warehouse_access' => 'nullable|array',
            'warehouse_access.*.warehouse_id' => 'required|exists:warehouses,id',
            'warehouse_access.*.can_transfer' => 'boolean',
            'warehouse_access.*.can_view_stock' => 'boolean',
            'warehouse_access.*.can_modify_stock' => 'boolean',
            'warehouse_access.*.can_receive_stock' => 'boolean',
            'warehouse_access.*.can_issue_stock' => 'boolean',
        ]);

        // If this is set as main branch, unset other main branches
        if ($request->boolean('is_main') && !$branch->is_main) {
            Auth::user()->account->branches()
                ->where('id', '!=', $branch->id)
                ->update(['is_main' => false]);
        }

        $branch->update($request->only([
            'name', 'address', 'phone', 'email', 'is_main', 'working_hours',
            'latitude', 'longitude', 'description', 'is_active'
        ]));

        // Update warehouse access
        if ($request->has('warehouse_access')) {
            // Delete existing warehouse access
            $branch->warehouseAccess()->delete();
            
            // Create new warehouse access records
            foreach ($request->warehouse_access as $access) {
                $branch->warehouseAccess()->create([
                    'warehouse_id' => $access['warehouse_id'],
                    'can_transfer' => $access['can_transfer'] ?? false,
                    'can_view_stock' => $access['can_view_stock'] ?? true,
                    'can_modify_stock' => $access['can_modify_stock'] ?? false,
                    'can_receive_stock' => $access['can_receive_stock'] ?? false,
                    'can_issue_stock' => $access['can_issue_stock'] ?? false,
                ]);
            }
        }

        return redirect()->route('branches.show', $branch)
                        ->with('success', __('app.updated_successfully'));
    }

    public function destroy(Branch $branch)
    {
        Gate::authorize('access-account-data', $branch);
        Gate::authorize('manage-branch-operations');
        
        // Prevent deletion of main branch if it's the only branch
        if ($branch->is_main && Auth::user()->account->branches()->count() === 1) {
            return redirect()->back()
                           ->withErrors(['branch' => 'Yeganə əsas filialı silə bilməzsiniz.']);
        }

        // If deleting main branch, set another branch as main
        if ($branch->is_main) {
            $newMainBranch = Auth::user()->account->branches()
                                ->where('id', '!=', $branch->id)
                                ->where('is_active', true)
                                ->first();
            
            if ($newMainBranch) {
                $newMainBranch->update(['is_main' => true]);
            }
        }

        $branch->delete();
        
        return redirect()->route('branches.index')
                        ->with('success', __('app.branch') . ' ' . __('app.deleted_successfully'));
    }
}
