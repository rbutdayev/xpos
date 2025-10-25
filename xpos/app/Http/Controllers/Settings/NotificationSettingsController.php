<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\SmsCredential;
use App\Models\TelegramCredential;
use App\Services\NotificationService;
use App\Services\SmsService;
use App\Services\TelegramService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class NotificationSettingsController extends Controller
{
    /**
     * Display notification settings page
     */
    public function index(Request $request, NotificationService $notificationService)
    {
        $accountId = $request->user()->account_id;

        // Get SMS credentials
        $smsCredential = SmsCredential::where('account_id', $accountId)
            ->where('is_active', true)
            ->first();

        // Get Telegram credentials
        $telegramCredential = TelegramCredential::where('account_id', $accountId)
            ->where('is_active', true)
            ->first();

        // Get account notification settings
        $account = $request->user()->account;
        $notificationSettings = $account->notification_settings ?? [];

        // Get statistics
        $stats = $notificationService->getStatistics($accountId);

        return Inertia::render('Settings/NotificationSettings', [
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
            'notification_settings' => $notificationSettings,
            'account_phone' => $account->phone,
        ]);
    }

    /**
     * Update notification settings
     */
    public function update(Request $request)
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
     * Save/Update SMS credentials
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

        // Deactivate all existing credentials
        SmsCredential::where('account_id', $accountId)->update(['is_active' => false]);

        // Create or update credential
        SmsCredential::updateOrCreate(
            [
                'account_id' => $accountId,
                'login' => $request->login,
            ],
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
     * Save/Update Telegram credentials
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
    public function testTelegram(Request $request, TelegramService $telegramService)
    {
        $accountId = $request->user()->account_id;

        $result = $telegramService->testConnection($accountId);

        if ($result['success']) {
            return redirect()->back()->with('success', $result['message']);
        }

        return redirect()->back()->with('error', $result['error']);
    }

    /**
     * Test notification by sending a test message
     */
    public function testNotification(Request $request, NotificationService $notificationService)
    {
        $request->validate([
            'channel' => 'required|in:sms,telegram',
            'recipient' => 'required|string',
        ]);

        $accountId = $request->user()->account_id;
        $account = $request->user()->account;

        $testMessage = "🧪 Test mesajı\n{$account->company_name}\nTarix: " . now()->format('d.m.Y H:i');

        $result = match($request->channel) {
            'sms' => app(SmsService::class)->send($accountId, $request->recipient, $testMessage),
            'telegram' => app(TelegramService::class)->send($accountId, $request->recipient, $testMessage),
        };

        if ($result['success']) {
            return redirect()->back()->with('success', 'Test mesajı göndərildi');
        }

        return redirect()->back()->with('error', $result['error']);
    }
}
