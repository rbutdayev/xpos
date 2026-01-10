<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Hash;
use App\Models\SmsCredential;
use App\Models\User;
use Inertia\Inertia;

class ShopSettingsController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
        $this->middleware('account.access');
    }

    /**
     * Display shop settings page
     */
    public function index(Request $request)
    {
        Gate::authorize('access-account-data');

        $user = Auth::user();
        $account = $user->account;
        $accountId = $user->account_id;

        // Check if SMS is configured
        $smsConfigured = SmsCredential::where('account_id', $accountId)
            ->where('is_active', true)
            ->exists();

        // Get shop settings
        $shopSettings = [
            'shop_enabled' => $account->shop_enabled ?? false,
            'shop_slug' => $account->shop_slug ?? '',
            'shop_warehouse_id' => $account->shop_warehouse_id,
            'shop_url' => $account->getShopUrl(),
            'shop_sms_merchant_notifications' => $account->shop_sms_merchant_notifications ?? false,
            'shop_notification_phone' => $account->shop_notification_phone,
            'shop_sms_customer_notifications' => $account->shop_sms_customer_notifications ?? false,
            'shop_customer_sms_template' => $account->shop_customer_sms_template,
        ];

        // Get warehouses for selection
        $warehouses = \App\Models\Warehouse::where('account_id', $accountId)
            ->orderBy('name')
            ->get(['id', 'name']);

        // Get platform statuses
        $platformStatuses = [
            'wolt_enabled' => $account->wolt_enabled ?? false,
            'yango_enabled' => $account->yango_enabled ?? false,
            'bolt_enabled' => $account->bolt_enabled ?? false,
        ];

        return Inertia::render('Shop/Settings', [
            'shop_settings' => $shopSettings,
            'warehouses' => $warehouses,
            'sms_configured' => $smsConfigured,
            'platform_statuses' => $platformStatuses,
        ]);
    }

    /**
     * Update shop settings
     */
    public function update(Request $request)
    {
        Gate::authorize('manage-products');

        $request->validate([
            'shop_slug' => [
                'nullable',
                'string',
                'alpha_dash',
                'min:3',
                'max:50',
                'unique:accounts,shop_slug,' . $request->user()->account_id,
            ],
            'shop_warehouse_id' => [
                'nullable',
                'exists:warehouses,id',
                // MULTI-TENANT: Ensure warehouse belongs to this account
                function ($attribute, $value, $fail) use ($request) {
                    if ($value && !\App\Models\Warehouse::where('id', $value)->where('account_id', $request->user()->account_id)->exists()) {
                        $fail('Seçilmiş anbar tapılmadı');
                    }
                },
            ],
            'shop_sms_merchant_notifications' => 'nullable|boolean',
            'shop_notification_phone' => 'nullable|string|max:20',
            'shop_sms_customer_notifications' => 'nullable|boolean',
            'shop_customer_sms_template' => 'nullable|string|max:500',
        ]);

        $account = $request->user()->account;

        // Update account (shop_enabled is managed via Integrations page)
        $account->update([
            'shop_slug' => $request->shop_slug,
            'shop_warehouse_id' => $request->shop_warehouse_id,
            'shop_sms_merchant_notifications' => $request->shop_sms_merchant_notifications ?? false,
            'shop_notification_phone' => $request->shop_notification_phone,
            'shop_sms_customer_notifications' => $request->shop_sms_customer_notifications ?? false,
            'shop_customer_sms_template' => $request->shop_customer_sms_template,
        ]);

        return back()->with('success', 'Mağaza parametrləri yeniləndi');
    }

    /**
     * Create or ensure "Online Shop" system user exists
     * MULTI-TENANT: Uses company-specific email (shop_slug) to ensure uniqueness across accounts
     */
    private function ensureOnlineShopUser($account): void
    {
        // MULTI-TENANT: Use shop_slug to make email unique across accounts
        $systemEmail = "online-shop@system-{$account->shop_slug}.local";

        // Check if online shop user already exists for THIS account
        $onlineUser = User::where('account_id', $account->id)
            ->where('email', $systemEmail)
            ->first();

        if (!$onlineUser) {
            // Create the online shop system user
            User::create([
                'account_id' => $account->id,
                'name' => 'Online Mağaza',
                'email' => $systemEmail,
                'password' => Hash::make(bin2hex(random_bytes(32))), // Random unguessable password
                'role' => 'sales_staff', // Limited role - can only create sales
                'status' => 'active',
            ]);

            \Log::info('Created online shop system user', [
                'account_id' => $account->id,
                'email' => $systemEmail,
            ]);
        }
    }
}
