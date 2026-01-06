<?php

namespace App\Http\Controllers;

use App\Models\SmsCredential;
use App\Models\TelegramCredential;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

/**
 * Unified Settings Controller
 * Manages: Shop Settings, POS Settings, Notification Settings
 * Note: Company settings are managed separately via CompanyController
 */
class UnifiedSettingsController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
        $this->middleware('account.access');
    }

    /**
     * Display settings page (Company settings with system config and POS)
     * Shop settings moved to ShopSettingsController
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $account = $user->account;
        $company = $account->companies()->first();

        // POS Settings
        $posSettings = [
            'auto_print_receipt' => $account->auto_print_receipt,
        ];

        return Inertia::render('Settings/Index', [
            'company' => $company,
            'pos_settings' => $posSettings,
        ]);
    }


    /**
     * Update POS settings
     */
    public function updatePOS(Request $request)
    {
        $validated = $request->validate([
            'auto_print_receipt' => 'nullable|boolean',
        ]);

        $account = $request->user()->account;
        $account->update([
            'auto_print_receipt' => $validated['auto_print_receipt'] ?? false,
        ]);

        return redirect()->back()->with('success', 'POS parametrləri yeniləndi');
    }

    /**
     * Update notification settings
     */
    public function updateNotifications(Request $request)
    {
        $request->validate([
            'notification_settings' => 'nullable|array',
        ]);

        $account = $request->user()->account;
        $account->update([
            'notification_settings' => $request->notification_settings,
        ]);

        return redirect()->back()->with('success', 'Bildiriş parametrləri yeniləndi');
    }

    /**
     * Update SMS credentials
     */
    public function updateSms(Request $request)
    {
        $request->validate([
            'login' => 'required|string',
            'password' => 'nullable|string',
            'sender_name' => 'required|string|max:11',
            'gateway_url' => 'required|url',
            'is_active' => 'boolean',
        ]);

        $accountId = $request->user()->account_id;

        SmsCredential::where('account_id', $accountId)->update(['is_active' => false]);

        $data = [
            'sender_name' => $request->sender_name,
            'gateway_url' => $request->gateway_url,
            'is_active' => $request->is_active ?? true,
        ];

        // Only update password if provided
        if ($request->filled('password')) {
            $data['password'] = $request->password;
        }

        SmsCredential::updateOrCreate(
            ['account_id' => $accountId, 'login' => $request->login],
            $data
        );

        return redirect()->back()->with('success', 'SMS parametrləri yadda saxlanıldı');
    }

    /**
     * Update Telegram credentials
     */
    public function updateTelegram(Request $request)
    {
        $request->validate([
            'bot_token' => 'nullable|string',
            'bot_username' => 'nullable|string',
            'default_chat_id' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $accountId = $request->user()->account_id;

        // Get existing credential
        $existing = TelegramCredential::where('account_id', $accountId)
            ->where('is_active', true)
            ->first();

        // Prepare data for update
        $data = [
            'bot_username' => $request->bot_username,
            'default_chat_id' => $request->default_chat_id,
            'is_active' => $request->is_active ?? true,
        ];

        // Only update bot_token if provided
        if ($request->filled('bot_token')) {
            $data['bot_token'] = $request->bot_token;
        }

        if ($existing) {
            // Update existing credential
            $existing->update($data);
        } else {
            // Create new credential (bot_token is required for new)
            if (!$request->filled('bot_token')) {
                return redirect()->back()->withErrors(['bot_token' => 'Bot Token tələb olunur']);
            }

            // Deactivate any old credentials
            TelegramCredential::where('account_id', $accountId)->update(['is_active' => false]);

            TelegramCredential::create([
                'account_id' => $accountId,
                'bot_token' => $request->bot_token,
                'bot_username' => $request->bot_username,
                'default_chat_id' => $request->default_chat_id,
                'is_active' => $request->is_active ?? true,
            ]);
        }

        return redirect()->back()->with('success', 'Telegram parametrləri yadda saxlanıldı');
    }

    /**
     * Test Telegram connection
     */
    public function testTelegram(Request $request)
    {
        $telegramService = app(\App\Services\TelegramService::class);
        $result = $telegramService->testConnection($request->user()->account_id);

        if ($result['success']) {
            return redirect()->back()->with('success', $result['message']);
        }

        return redirect()->back()->with('error', $result['error']);
    }

    /**
     * Test notification
     */
    public function testNotification(Request $request)
    {
        $request->validate([
            'channel' => 'required|in:sms,telegram',
            'recipient' => 'required|string',
        ]);

        $accountId = $request->user()->account_id;
        $account = $request->user()->account;

        $testMessage = "🧪 Test mesajı\n{$account->company_name}\nTarix: " . now()->format('d.m.Y H:i');

        $result = match($request->channel) {
            'sms' => app(\App\Services\SmsService::class)->send($accountId, $request->recipient, $testMessage),
            'telegram' => app(\App\Services\TelegramService::class)->send($accountId, $request->recipient, $testMessage),
        };

        if ($result['success']) {
            return redirect()->back()->with('success', 'Test mesajı göndərildi');
        }

        return redirect()->back()->with('error', $result['error']);
    }

    /**
     * Display Telegram logs
     */
    public function telegramLogs(Request $request)
    {
        Gate::authorize('view-reports');

        $accountId = $request->user()->account_id;
        $limit = $request->input('limit', 50);

        $logs = \App\Models\TelegramLog::where('account_id', $accountId)
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();

        return Inertia::render('Telegram/Logs', [
            'logs' => $logs,
        ]);
    }

    /**
     * Display Notification Channels page
     */
    public function notificationChannels(Request $request, NotificationService $notificationService)
    {
        $user = Auth::user();
        $account = $user->account;
        $accountId = $user->account_id;

        // Check if shop module is enabled
        if (!$account->shop_enabled) {
            abort(403, 'Online mağaza modulu aktivləşdirilməyib.');
        }

        // Get SMS credential
        $smsCredential = SmsCredential::where('account_id', $accountId)
            ->where('is_active', true)
            ->first();

        // Get Telegram credential
        $telegramCredential = TelegramCredential::where('account_id', $accountId)
            ->where('is_active', true)
            ->first();

        // Get notification statistics
        $stats = $notificationService->getStatistics($accountId);

        return Inertia::render('NotificationChannels/Index', [
            'sms' => [
                'configured' => $smsCredential !== null,
                'credential' => $smsCredential ? [
                    'id' => $smsCredential->id,
                    'login' => $smsCredential->login,
                    'sender_name' => $smsCredential->sender_name,
                    'gateway_url' => $smsCredential->gateway_url,
                    'is_active' => $smsCredential->is_active,
                ] : null,
                'stats' => $stats['sms'],
            ],
            'telegram' => [
                'configured' => $telegramCredential !== null,
                'credential' => $telegramCredential ? [
                    'id' => $telegramCredential->id,
                    'bot_username' => $telegramCredential->bot_username,
                    'default_chat_id' => $telegramCredential->default_chat_id,
                    'is_active' => $telegramCredential->is_active,
                    'last_tested_at' => $telegramCredential->last_tested_at,
                    'last_test_status' => $telegramCredential->last_test_status,
                ] : null,
                'stats' => $stats['telegram'],
            ],
            'notification_settings' => $account->notification_settings ?? [],
            'account_phone' => $account->phone,
        ]);
    }

    /**
     * Toggle module (services, rent, etc.)
     */
    public function toggleModule(Request $request)
    {
        // Only account_owner and admin can toggle modules
        if (!Auth::user()->isAdmin()) {
            abort(403, 'Bu əməliyyatı yalnız administrator edə bilər.');
        }

        $request->validate([
            'module' => 'required|in:services,rent,loyalty,shop,discounts,gift_cards,expeditor,wolt,yango,bolt',
        ]);

        $account = $request->user()->account;
        $module = $request->module;

        // Map module names to database columns
        $moduleFields = [
            'services' => 'services_module_enabled',
            'rent' => 'rent_module_enabled',
            'loyalty' => 'loyalty_module_enabled',
            'shop' => 'shop_enabled',
            'discounts' => 'discounts_module_enabled',
            'gift_cards' => 'gift_cards_module_enabled',
            'expeditor' => 'expeditor_module_enabled',
            'wolt' => 'wolt_enabled',
            'yango' => 'yango_enabled',
            'bolt' => 'bolt_enabled',
        ];

        // Define module dependencies
        $moduleDependencies = [
            'services' => [],
            'rent' => [],
            'loyalty' => [],
            'shop' => ['sms'], // Shop requires SMS to be configured
            'discounts' => [],
            'gift_cards' => [],
            'expeditor' => [], // Expeditor has no dependencies
            'wolt' => [], // Delivery platforms don't require SMS
            'yango' => [],
            'bolt' => [],
        ];

        $fieldName = $moduleFields[$module];
        $isCurrentlyEnabled = $account->$fieldName;

        // If trying to enable the module, check dependencies
        if (!$isCurrentlyEnabled && !empty($moduleDependencies[$module])) {
            $dependencyCheck = $account->checkModuleDependencies($moduleDependencies[$module]);

            if (!$dependencyCheck['met']) {
                $missingList = implode(', ', $dependencyCheck['missing']);
                return redirect()->back()->withErrors([
                    'dependency' => "Bu modulu aktivləşdirmək üçün əvvəlcə bunları konfiqurasiya etməlisiniz: {$missingList}"
                ]);
            }
        }

        // Toggle the module
        $account->$fieldName = !$isCurrentlyEnabled;
        $account->save();

        // Human-readable module names
        $moduleNames = [
            'services' => 'Xidmətlər',
            'rent' => 'İcarə',
            'loyalty' => 'Loyallıq Proqramı',
            'shop' => 'Online Mağaza',
            'discounts' => 'Endirimlər',
            'gift_cards' => 'Hədiyyə Kartları',
            'expeditor' => 'Ekspeditor (Sahə Satışı)',
            'wolt' => 'Wolt',
            'yango' => 'Yango',
            'bolt' => 'Bolt Food',
        ];

        $moduleName = $moduleNames[$module] ?? $module;

        return redirect()->back()->with('success',
            $account->$fieldName
                ? "{$moduleName} modulu aktivləşdirildi."
                : "{$moduleName} modulu söndürüldü."
        );
    }
}
