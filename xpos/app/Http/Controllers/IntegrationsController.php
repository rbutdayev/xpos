<?php

namespace App\Http\Controllers;

use App\Models\FiscalPrinterConfig;
use App\Models\LoyaltyProgram;
use App\Models\SmsCredential;
use App\Models\SmsLog;
use App\Models\TelegramCredential;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class IntegrationsController extends Controller
{
    /**
     * Display integrations marketplace
     */
    public function index()
    {
        Gate::authorize('access-account-data');

        $accountId = Auth::user()->account_id;
        $account = Auth::user()->account;

        // Check SMS configuration
        $smsConfigured = SmsCredential::where('account_id', $accountId)
            ->where('is_active', true)
            ->exists();

        // Check Telegram configuration
        $telegramConfigured = TelegramCredential::where('account_id', $accountId)
            ->where('is_active', true)
            ->exists();

        // Check Fiscal Printer configuration
        $fiscalPrinterConfig = FiscalPrinterConfig::where('account_id', $accountId)->first();
        $fiscalPrinterConfigured = $fiscalPrinterConfig !== null;
        $fiscalPrinterEnabled = $account->fiscal_printer_enabled ?? false;

        // Check Loyalty Program configuration
        $loyaltyProgram = LoyaltyProgram::where('account_id', $accountId)->first();
        $loyaltyModuleEnabled = $account->loyalty_module_enabled ?? false;
        $loyaltyProgramConfigured = $loyaltyProgram !== null && $loyaltyModuleEnabled;
        $loyaltyProgramActive = $loyaltyProgram?->is_active ?? false;

        // Check Shop configuration
        $shopEnabled = $account->shop_enabled ?? false;
        $shopConfigured = !empty($account->shop_slug);
        $shopUrl = $account->getShopUrl();

        // Check Services module
        $servicesModuleEnabled = $account->services_module_enabled ?? false;

        // Check Rent module
        $rentModuleEnabled = $account->rent_module_enabled ?? false;

        // Check Discounts module
        $discountsModuleEnabled = $account->discounts_module_enabled ?? false;

        // Check Gift Cards module
        $giftCardsModuleEnabled = $account->gift_cards_module_enabled ?? false;

        // Check Expeditor module
        $expeditorModuleEnabled = $account->expeditor_module_enabled ?? false;

        // Check Delivery Platforms
        $woltEnabled = $account->wolt_enabled ?? false;
        $yangoEnabled = $account->yango_enabled ?? false;
        $boltEnabled = $account->bolt_enabled ?? false;

        // Check module dependencies
        $moduleDependencies = [
            'shop' => ['sms'],
            // Delivery platforms don't have dependencies
        ];

        $dependencyStatus = [];
        foreach ($moduleDependencies as $module => $dependencies) {
            $dependencyStatus[$module] = $account->checkModuleDependencies($dependencies);
        }

        return Inertia::render('Integrations/Index', [
            'smsConfigured' => $smsConfigured,
            'telegramConfigured' => $telegramConfigured,
            'fiscalPrinterConfigured' => $fiscalPrinterConfigured,
            'fiscalPrinterEnabled' => $fiscalPrinterEnabled,
            'loyaltyProgramConfigured' => $loyaltyProgramConfigured,
            'loyaltyProgramActive' => $loyaltyProgramActive && $loyaltyModuleEnabled,
            'shopEnabled' => $shopEnabled,
            'shopConfigured' => $shopConfigured,
            'shopUrl' => $shopUrl,
            'servicesModuleEnabled' => $servicesModuleEnabled,
            'rentModuleEnabled' => $rentModuleEnabled,
            'discountsModuleEnabled' => $discountsModuleEnabled,
            'giftCardsModuleEnabled' => $giftCardsModuleEnabled,
            'expeditorModuleEnabled' => $expeditorModuleEnabled,
            'woltEnabled' => $woltEnabled,
            'yangoEnabled' => $yangoEnabled,
            'boltEnabled' => $boltEnabled,
            'dependencyStatus' => $dependencyStatus,
        ]);
    }

    /**
     * Display SMS integration settings
     */
    public function sms()
    {
        Gate::authorize('access-account-data');

        $accountId = Auth::user()->account_id;
        $credentials = SmsCredential::where('account_id', $accountId)->first();

        // Get statistics
        $total = SmsLog::where('account_id', $accountId)->count();
        $sent = SmsLog::where('account_id', $accountId)->where('status', 'sent')->count();
        $failed = SmsLog::where('account_id', $accountId)->where('status', 'failed')->count();
        $pending = SmsLog::where('account_id', $accountId)->where('status', 'pending')->count();

        return Inertia::render('Integrations/SMS/Settings', [
            'credentials' => $credentials,
            'statistics' => [
                'total' => $total,
                'sent' => $sent,
                'failed' => $failed,
                'pending' => $pending,
            ],
        ]);
    }

    /**
     * Display Telegram integration settings
     */
    public function telegram()
    {
        Gate::authorize('access-account-data');

        $accountId = Auth::user()->account_id;
        $credentials = TelegramCredential::where('account_id', $accountId)->first();

        return Inertia::render('Integrations/Telegram/Settings', [
            'credentials' => $credentials,
        ]);
    }

    /**
     * Bulk disable integrations
     */
    public function bulkDisable(Request $request)
    {
        Gate::authorize('manage-products');

        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'required|string',
        ]);

        $accountId = Auth::user()->account_id;
        $account = Auth::user()->account;

        try {
            \DB::beginTransaction();

            $disabledCount = 0;
            $toggleableModules = ['services', 'rent', 'discounts', 'gift_cards', 'expeditor', 'shop', 'wolt', 'yango', 'bolt'];

            foreach ($request->ids as $integrationId) {
                // Only disable if it's a toggleable module
                if (in_array($integrationId, $toggleableModules)) {
                    // Map integration ID to account field
                    $fieldMap = [
                        'services' => 'services_module_enabled',
                        'rent' => 'rent_module_enabled',
                        'discounts' => 'discounts_module_enabled',
                        'gift_cards' => 'gift_cards_module_enabled',
                        'expeditor' => 'expeditor_module_enabled',
                        'shop' => 'shop_enabled',
                        'wolt' => 'wolt_enabled',
                        'yango' => 'yango_enabled',
                        'bolt' => 'bolt_enabled',
                    ];

                    if (isset($fieldMap[$integrationId])) {
                        $field = $fieldMap[$integrationId];

                        // Update only if account_id matches (security check)
                        \DB::table('accounts')
                            ->where('id', $accountId)
                            ->update([$field => false]);

                        $disabledCount++;
                    }
                }
            }

            \DB::commit();

            return redirect()->back()->with('success', "$disabledCount inteqrasiya deaktiv edildi");
        } catch (\Exception $e) {
            \DB::rollBack();
            return redirect()->back()->with('error', 'Xəta baş verdi: ' . $e->getMessage());
        }
    }

    /**
     * Bulk activate integrations
     */
    public function bulkActivate(Request $request)
    {
        Gate::authorize('manage-products');

        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'required|string',
        ]);

        $accountId = Auth::user()->account_id;
        $account = Auth::user()->account;

        try {
            \DB::beginTransaction();

            $activatedCount = 0;
            $toggleableModules = ['services', 'rent', 'discounts', 'gift_cards', 'expeditor', 'shop', 'wolt', 'yango', 'bolt'];

            foreach ($request->ids as $integrationId) {
                // Only activate if it's a toggleable module
                if (in_array($integrationId, $toggleableModules)) {
                    // Map integration ID to account field
                    $fieldMap = [
                        'services' => 'services_module_enabled',
                        'rent' => 'rent_module_enabled',
                        'discounts' => 'discounts_module_enabled',
                        'gift_cards' => 'gift_cards_module_enabled',
                        'expeditor' => 'expeditor_module_enabled',
                        'shop' => 'shop_enabled',
                        'wolt' => 'wolt_enabled',
                        'yango' => 'yango_enabled',
                        'bolt' => 'bolt_enabled',
                    ];

                    if (isset($fieldMap[$integrationId])) {
                        $field = $fieldMap[$integrationId];

                        // Update only if account_id matches (security check)
                        \DB::table('accounts')
                            ->where('id', $accountId)
                            ->update([$field => true]);

                        $activatedCount++;
                    }
                }
            }

            \DB::commit();

            return redirect()->back()->with('success', "$activatedCount inteqrasiya aktiv edildi");
        } catch (\Exception $e) {
            \DB::rollBack();
            return redirect()->back()->with('error', 'Xəta baş verdi: ' . $e->getMessage());
        }
    }
}
