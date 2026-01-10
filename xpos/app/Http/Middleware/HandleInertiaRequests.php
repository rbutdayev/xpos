<?php

namespace App\Http\Middleware;

use App\Services\CurrencyService;
use App\Services\TranslationService;
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
            'giftCardsEnabled' => $user && $user->account ? ($user->account->gift_cards_module_enabled ?? false) : false,
            'expeditorEnabled' => $user && $user->account ? ($user->account->expeditor_module_enabled ?? false) : false,
            'attendanceEnabled' => $user && $user->account ? ($user->account->attendance_module_enabled ?? false) : false,
            'woltEnabled' => $user && $user->account ? ($user->account->wolt_enabled ?? false) : false,
            'yangoEnabled' => $user && $user->account ? ($user->account->yango_enabled ?? false) : false,
            'boltEnabled' => $user && $user->account ? ($user->account->bolt_enabled ?? false) : false,
            'smsConfigured' => $user && $user->account ? $user->account->hasSmsConfigured() : false,
            'smsEnabled' => $user && $user->account ? (bool) ($user->account->sms_module_enabled ?? false) : false,
            'telegramEnabled' => $user && $user->account ? (bool) ($user->account->telegram_module_enabled ?? false) : false,
            'currency' => $user ? app(CurrencyService::class)->getCompanyCurrency() : null,
            'locale' => app()->getLocale(),
            'translations' => [
                'payment_methods' => TranslationService::enumOptions('payment_methods'),
                'expense_types' => TranslationService::enumOptions('expense_types'),
                'subscription_plans' => TranslationService::enumOptions('subscription_plans'),
                'user_roles' => TranslationService::enumOptions('user_roles'),
                'sale_statuses' => TranslationService::enumOptions('sale_statuses'),
            ],
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
                'warning' => $request->session()->get('warning'),
                'auto_print' => $request->session()->get('auto_print'),
                'print_sale_id' => $request->session()->get('print_sale_id'),
                'sale_completed' => $request->session()->get('sale_completed'),
                'sale_id' => $request->session()->get('sale_id'),
                'sale_number' => $request->session()->get('sale_number'),
            ],
            'import_errors' => $request->session()->get('import_errors'),
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
