<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\SmsCredential;
use App\Models\TelegramCredential;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

/**
 * Unified Settings Controller
 * Combines: Company Settings, Shop Settings, Notification Settings
 */
class UnifiedSettingsController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
        $this->middleware('account.access');
    }

    /**
     * Display unified settings page with all tabs
     */
    public function index(Request $request, NotificationService $notificationService)
    {
        $user = Auth::user();
        $account = $user->account;
        $accountId = $user->account_id;

        // Get company for Şirkət tab
        $company = Company::where('account_id', $accountId)->first();

        // Company/System Settings
        $systemSettings = $this->getSystemSettings($company);

        // POS Settings
        $posSettings = [
            'auto_print_receipt' => $account->auto_print_receipt,
        ];

        // Shop Settings
        $shopSettings = [
            'shop_enabled' => $account->shop_enabled,
            'shop_slug' => $account->shop_slug,
            'shop_url' => $account->getShopUrl(),
            'shop_sms_merchant_notifications' => $account->shop_sms_merchant_notifications,
            'shop_notification_phone' => $account->shop_notification_phone,
            'shop_sms_customer_notifications' => $account->shop_sms_customer_notifications,
            'shop_customer_sms_template' => $account->shop_customer_sms_template,
        ];

        // Notification Settings - SMS
        $smsCredential = SmsCredential::where('account_id', $accountId)
            ->where('is_active', true)
            ->first();

        // Notification Settings - Telegram
        $telegramCredential = TelegramCredential::where('account_id', $accountId)
            ->where('is_active', true)
            ->first();

        // Get notification statistics
        $stats = $notificationService->getStatistics($accountId);

        return Inertia::render('Settings/Unified', [
            // Company/Şirkət Tab
            'company' => $company,
            'system_settings' => $systemSettings,

            // POS Tab
            'pos_settings' => $posSettings,

            // Mağaza Tab
            'shop_settings' => $shopSettings,

            // Bildirişlər Tab
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

            // Default active tab (can be passed via query param)
            'active_tab' => $request->query('tab', 'company'),
        ]);
    }

    /**
     * Get system settings from company
     */
    private function getSystemSettings(?Company $company): array
    {
        $defaults = [
            'company_name' => '',
            'company_address' => '',
            'company_phone' => '',
            'company_email' => '',
            'company_website' => '',
            'tax_number' => '',
            'default_language' => 'az',
            'receipt_header_text' => 'Xoş gəlmisiniz!',
            'receipt_footer_text' => 'Təşəkkür edirik!',
            'default_paper_size' => '80mm',
            'default_width_chars' => 32,
            'currency_code' => 'AZN',
            'currency_symbol' => '₼',
            'date_format' => 'd.m.Y',
            'time_format' => 'H:i',
            'timezone' => 'Asia/Baku',
            'business_hours_start' => '09:00',
            'business_hours_end' => '18:00',
            'business_days' => ['1', '2', '3', '4', '5'],
        ];

        if (!$company) {
            return $defaults;
        }

        return array_merge($defaults, [
            'company_name' => $company->name,
            'company_address' => $company->address,
            'company_phone' => $company->phone,
            'company_email' => $company->email,
            'company_website' => $company->website,
            'tax_number' => $company->tax_number,
            'default_language' => $company->default_language ?? 'az',
            'business_hours_start' => $company->business_hours['start'] ?? '09:00',
            'business_hours_end' => $company->business_hours['end'] ?? '18:00',
            'business_days' => $company->business_hours['days'] ?? ['1', '2', '3', '4', '5'],
        ]);
    }

    /**
     * Update company/system settings
     */
    public function updateCompany(Request $request)
    {
        $validated = $request->validate([
            'company_name' => 'required|string|max:255',
            'company_address' => 'nullable|string',
            'company_phone' => 'nullable|string|max:255',
            'company_email' => 'nullable|email|max:255',
            'company_website' => 'nullable|url|max:255',
            'tax_number' => 'nullable|string|max:255',
            'default_language' => 'required|string|in:az,en,tr',
            'business_hours_start' => 'nullable|date_format:H:i',
            'business_hours_end' => 'nullable|date_format:H:i',
            'business_days' => 'nullable|array',
        ]);

        $user = Auth::user();
        $company = Company::where('account_id', $user->account_id)->firstOrFail();

        $company->update([
            'name' => $validated['company_name'],
            'address' => $validated['company_address'],
            'phone' => $validated['company_phone'],
            'email' => $validated['company_email'],
            'website' => $validated['company_website'],
            'tax_number' => $validated['tax_number'],
            'default_language' => $validated['default_language'],
            'business_hours' => [
                'start' => $validated['business_hours_start'] ?? null,
                'end' => $validated['business_hours_end'] ?? null,
                'days' => $validated['business_days'] ?? [],
            ],
        ]);

        return redirect()->back()->with('success', 'Şirkət parametrləri yeniləndi');
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
     * Update shop settings
     */
    public function updateShop(Request $request)
    {
        $request->validate([
            'shop_enabled' => 'boolean',
            'shop_slug' => 'nullable|string|alpha_dash|min:3|unique:accounts,shop_slug,' . $request->user()->account_id,
        ]);

        $account = $request->user()->account;
        $account->update([
            'shop_enabled' => $request->shop_enabled,
            'shop_slug' => $request->shop_slug,
        ]);

        return redirect()->back()->with('success', 'Mağaza parametrləri yeniləndi');
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
            'password' => 'required|string',
            'sender_name' => 'required|string|max:11',
            'gateway_url' => 'required|url',
            'is_active' => 'boolean',
        ]);

        $accountId = $request->user()->account_id;

        SmsCredential::where('account_id', $accountId)->update(['is_active' => false]);

        SmsCredential::updateOrCreate(
            ['account_id' => $accountId, 'login' => $request->login],
            [
                'password' => $request->password,
                'sender_name' => $request->sender_name,
                'gateway_url' => $request->gateway_url,
                'is_active' => $request->is_active ?? true,
            ]
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
}
