<?php

namespace App\Http\Controllers;

use App\Models\FiscalPrinterConfig;
use App\Models\LoyaltyProgram;
use App\Models\SmsCredential;
use App\Models\SmsLog;
use App\Models\TelegramCredential;
use App\Models\ModulePricingSetting;
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

        // Check SMS configuration and status
        $smsCredential = SmsCredential::where('account_id', $accountId)->first();
        $smsConfigured = $smsCredential !== null;
        $smsEnabled = (bool) ($account->sms_module_enabled ?? false);

        // Check Telegram configuration and status
        $telegramCredential = TelegramCredential::where('account_id', $accountId)->first();
        $telegramConfigured = $telegramCredential !== null;
        $telegramEnabled = (bool) ($account->telegram_module_enabled ?? false);

        // Check Fiscal Printer configuration
        $fiscalPrinterConfig = FiscalPrinterConfig::where('account_id', $accountId)->first();
        $fiscalPrinterConfigured = $fiscalPrinterConfig !== null;
        $fiscalPrinterEnabled = (bool) ($account->fiscal_printer_enabled ?? false);

        // Check Loyalty Program configuration and status
        $loyaltyProgram = LoyaltyProgram::where('account_id', $accountId)->first();
        $loyaltyModuleEnabled = (bool) ($account->loyalty_module_enabled ?? false);
        $loyaltyProgramConfigured = $loyaltyProgram !== null;  // Configured if program exists

        // Check Shop configuration
        $shopEnabled = (bool) ($account->shop_enabled ?? false);
        $shopConfigured = !empty($account->shop_slug);
        $shopUrl = $account->getShopUrl();

        // Check Services module
        $servicesModuleEnabled = (bool) ($account->services_module_enabled ?? false);

        // Check Rent module
        $rentModuleEnabled = (bool) ($account->rent_module_enabled ?? false);

        // Check Discounts module
        $discountsModuleEnabled = (bool) ($account->discounts_module_enabled ?? false);

        // Check Gift Cards module
        $giftCardsModuleEnabled = (bool) ($account->gift_cards_module_enabled ?? false);

        // Check Expeditor module
        $expeditorModuleEnabled = (bool) ($account->expeditor_module_enabled ?? false);

        // Check Attendance module
        $attendanceModuleEnabled = (bool) ($account->attendance_module_enabled ?? false);

        // Check Delivery Platforms
        $woltEnabled = (bool) ($account->wolt_enabled ?? false);
        $yangoEnabled = (bool) ($account->yango_enabled ?? false);
        $boltEnabled = (bool) ($account->bolt_enabled ?? false);

        // Check module dependencies
        $moduleDependencies = [
            'shop' => ['sms'],
            // Delivery platforms don't have dependencies
        ];

        $dependencyStatus = [];
        foreach ($moduleDependencies as $module => $dependencies) {
            $dependencyStatus[$module] = $account->checkModuleDependencies($dependencies);
        }

        // Debug logging
        \Log::info('Integrations Index Debug', [
            'account_id' => $accountId,
            'smsConfigured' => $smsConfigured,
            'smsEnabled' => $smsEnabled,
            'smsCredential' => $smsCredential?->toArray(),
        ]);

        return Inertia::render('Integrations/Index', [
            'smsConfigured' => $smsConfigured,
            'smsEnabled' => $smsEnabled,
            'telegramConfigured' => $telegramConfigured,
            'telegramEnabled' => $telegramEnabled,
            'fiscalPrinterConfigured' => $fiscalPrinterConfigured,
            'fiscalPrinterEnabled' => $fiscalPrinterEnabled,
            'loyaltyProgramConfigured' => $loyaltyProgramConfigured,
            'loyaltyModuleEnabled' => $loyaltyModuleEnabled,
            'shopEnabled' => $shopEnabled,
            'shopConfigured' => $shopConfigured,
            'shopUrl' => $shopUrl,
            'servicesModuleEnabled' => $servicesModuleEnabled,
            'rentModuleEnabled' => $rentModuleEnabled,
            'discountsModuleEnabled' => $discountsModuleEnabled,
            'giftCardsModuleEnabled' => $giftCardsModuleEnabled,
            'expeditorModuleEnabled' => $expeditorModuleEnabled,
            'attendanceModuleEnabled' => $attendanceModuleEnabled,
            'woltEnabled' => $woltEnabled,
            'yangoEnabled' => $yangoEnabled,
            'boltEnabled' => $boltEnabled,
            'dependencyStatus' => $dependencyStatus,
            'modulePrices' => ModulePricingSetting::getAllActivePrices(),
            'confirmationRequired' => session('confirmationRequired'),
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
            $toggleableModules = ['services', 'rent', 'discounts', 'gift_cards', 'expeditor', 'attendance', 'shop', 'wolt', 'yango', 'bolt', 'fiscal-printer', 'sms', 'telegram'];

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
                        'attendance' => 'attendance_module_enabled',
                        'shop' => 'shop_enabled',
                        'wolt' => 'wolt_enabled',
                        'yango' => 'yango_enabled',
                        'bolt' => 'bolt_enabled',
                        'fiscal-printer' => 'fiscal_printer_enabled',
                        'sms' => 'sms_module_enabled',
                        'telegram' => 'telegram_module_enabled',
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
            $toggleableModules = ['services', 'rent', 'discounts', 'gift_cards', 'expeditor', 'attendance', 'shop', 'wolt', 'yango', 'bolt', 'fiscal-printer', 'sms', 'telegram'];

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
                        'attendance' => 'attendance_module_enabled',
                        'shop' => 'shop_enabled',
                        'wolt' => 'wolt_enabled',
                        'yango' => 'yango_enabled',
                        'bolt' => 'bolt_enabled',
                        'fiscal-printer' => 'fiscal_printer_enabled',
                        'sms' => 'sms_module_enabled',
                        'telegram' => 'telegram_module_enabled',
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
