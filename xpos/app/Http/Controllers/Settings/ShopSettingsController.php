<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\User;
use App\Models\SmsCredential;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ShopSettingsController extends Controller
{
    public function index()
    {
        $account = Auth::user()->account;

        return Inertia::render('Settings/ShopSettings', [
            'settings' => [
                'shop_enabled' => $account->shop_enabled,
                'shop_slug' => $account->shop_slug,
                'shop_url' => $account->getShopUrl(),
                'shop_sms_merchant_notifications' => $account->shop_sms_merchant_notifications,
                'shop_notification_phone' => $account->shop_notification_phone,
                'shop_sms_customer_notifications' => $account->shop_sms_customer_notifications,
                'shop_customer_sms_template' => $account->shop_customer_sms_template,
                'has_sms_configured' => $account->hasSmsConfigured(),
                'sms_balance' => $this->getSmsBalance($account),
            ],
        ]);
    }

    public function update(Request $request)
    {
        $account = Auth::user()->account;

        $validated = $request->validate([
            'shop_enabled' => 'boolean',
            'shop_slug' => [
                'required_if:shop_enabled,true',
                'nullable',
                'regex:/^[a-z0-9-]+$/',
                'min:3',
                'max:100',
                // IMPORTANT: Ensure slug is unique ACROSS ALL ACCOUNTS
                Rule::unique('accounts', 'shop_slug')->ignore($account->id),
            ],
            'shop_sms_merchant_notifications' => 'boolean',
            'shop_notification_phone' => 'nullable|string|max:50',
            'shop_sms_customer_notifications' => 'boolean',
            'shop_customer_sms_template' => 'nullable|string|max:500',
        ], [
            'shop_slug.required_if' => 'Biznes adı mütləqdir',
            'shop_slug.regex' => 'Yalnız kiçik hərflər, rəqəmlər və tire istifadə edin',
            'shop_slug.unique' => 'Bu biznes adı artıq istifadə olunur',
            'shop_slug.min' => 'Minimum 3 simvol',
        ]);

        // Check dependencies before enabling shop
        if (isset($validated['shop_enabled']) && $validated['shop_enabled'] && !$account->shop_enabled) {
            $dependencyCheck = $account->checkModuleDependencies(['sms']);

            if (!$dependencyCheck['met']) {
                $missingList = implode(', ', $dependencyCheck['missing']);
                return back()->withErrors([
                    'shop_enabled' => "Online mağazanı aktivləşdirmək üçün əvvəlcə bunları konfiqurasiya etməlisiniz: {$missingList}"
                ]);
            }
        }

        // If disabling shop, clear the slug
        if (isset($validated['shop_enabled']) && !$validated['shop_enabled']) {
            $validated['shop_slug'] = null;
        }

        // If SMS not configured, disable SMS notifications
        if (!$account->hasSmsConfigured()) {
            $validated['shop_sms_merchant_notifications'] = false;
            $validated['shop_sms_customer_notifications'] = false;
        }

        // MULTI-TENANT CHECK: Ensure we're only updating current user's account
        $account->update($validated);

        // If shop is being enabled for the first time, create an "Online Shop" system user
        if (isset($validated['shop_enabled']) && $validated['shop_enabled']) {
            $this->ensureOnlineShopUser($account);
        }

        return back()->with('success', 'Mağaza parametrləri yeniləndi');
    }

    /**
     * Create or ensure "Online Shop" system user exists
     * MULTI-TENANT: Uses company-specific email (shop_slug) to ensure uniqueness across accounts
     */
    private function ensureOnlineShopUser(Account $account): void
    {
        // MULTI-TENANT: Use shop_slug to make email unique across accounts
        $systemEmail = "online-shop@system-{$account->shop_slug}.local";

        // Check if online shop user already exists
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

    private function getSmsBalance(Account $account): ?int
    {
        try {
            $smsCredential = SmsCredential::where('account_id', $account->id)
                ->where('is_active', true)
                ->first();

            if (!$smsCredential) {
                return null;
            }

            // Get balance from SMS service
            $smsService = app(\App\Services\SmsService::class);
            return $smsService->getBalance($account->id);
        } catch (\Exception $e) {
            \Log::warning('Failed to get SMS balance', [
                'account_id' => $account->id,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }
}
