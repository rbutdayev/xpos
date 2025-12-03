<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $selectedWarehouseId = $request->session()->get('selected_warehouse_id');
        
        // Validate selected warehouse for sales_staff users
        if ($user && $user->role === 'sales_staff' && $user->branch_id && $selectedWarehouseId) {
            $hasAccess = \App\Models\WarehouseBranchAccess::where('warehouse_id', $selectedWarehouseId)
                ->where('branch_id', $user->branch_id)
                ->where('can_view_stock', true)
                ->exists();
                
            if (!$hasAccess) {
                // Clear invalid warehouse selection
                $request->session()->forget('selected_warehouse_id');
                $selectedWarehouseId = null;
            }
        }
        
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? $user->load('branch') : null,
            ],
            'warehouses' => $user ?
                $this->getWarehousesForUser($user) : [],
            'selectedWarehouse' => $selectedWarehouseId,
            'shopEnabled' => $user && $user->account ? ($user->account->shop_enabled ?? false) : false,
            'loyaltyEnabled' => $user && $user->account ? ($user->account->loyalty_module_enabled ?? false) : false,
            'servicesEnabled' => $user && $user->account ? ($user->account->services_module_enabled ?? false) : false,
            'rentEnabled' => $user && $user->account ? ($user->account->rent_module_enabled ?? false) : false,
            'discountsEnabled' => $user && $user->account ? ($user->account->discounts_module_enabled ?? false) : false,
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
                'auto_print' => $request->session()->get('auto_print'),
                'print_sale_id' => $request->session()->get('print_sale_id'),
                'sale_completed' => $request->session()->get('sale_completed'),
                'sale_id' => $request->session()->get('sale_id'),
                'sale_number' => $request->session()->get('sale_number'),
            ],
        ];
    }

    /**
     * Get warehouses for user based on their role
     */
    private function getWarehousesForUser($user): array
    {
        // Super admins don't have warehouses (they're global)
        if ($user->isSuperAdmin() || !$user->account_id) {
            return [];
        }

        $query = \App\Models\Warehouse::where('account_id', $user->account_id)
            ->where('is_active', true);

        // If user is sales_staff, only show warehouses they have access to through their branch
        if ($user->role === 'sales_staff' && $user->branch_id) {
            $query->whereHas('branches', function($q) use ($user) {
                $q->where('branch_id', $user->branch_id);
            });
        }

        return $query->orderBy('name')
            ->get(['id', 'name', 'type'])
            ->toArray();
    }
}
