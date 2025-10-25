<?php

namespace App\Console\Commands;

use App\Models\Account;
use App\Models\TelegramCredential;
use App\Models\SmsCredential;
use Illuminate\Console\Command;

class DiagnoseNotifications extends Command
{
    protected $signature = 'notifications:diagnose {account_id?}';
    protected $description = 'Diagnose notification settings for an account';

    public function handle()
    {
        $accountId = $this->argument('account_id');

        if (!$accountId) {
            $accountId = $this->ask('Enter Account ID');
        }

        $account = Account::find($accountId);

        if (!$account) {
            $this->error("Account not found: {$accountId}");
            return 1;
        }

        $this->info("=== Notification Diagnostics for Account #{$accountId} ===");
        $this->info("Company: {$account->company_name}");
        $this->newLine();

        // Check notification settings
        $this->info("--- Notification Settings ---");
        $this->line(json_encode($account->notification_settings, JSON_PRETTY_PRINT));
        $this->newLine();

        // Check merchant new order settings
        $event = 'merchant.new_order';
        $this->info("--- Merchant New Order Notification ---");
        $this->line("Event: {$event}");
        $this->line("Enabled: " . ($account->isNotificationEnabled($event) ? 'YES' : 'NO'));
        $this->line("Channels: " . json_encode($account->getEnabledChannels($event)));

        foreach (['sms', 'telegram'] as $channel) {
            $recipient = $account->getNotificationRecipient($event, $channel);
            $this->line("  - {$channel} recipient: " . ($recipient ?: 'NOT SET'));
        }
        $this->newLine();

        // Check customer order confirmation settings
        $event = 'customer.order_confirmation';
        $this->info("--- Customer Order Confirmation ---");
        $this->line("Event: {$event}");
        $this->line("Enabled: " . ($account->isNotificationEnabled($event) ? 'YES' : 'NO'));
        $this->line("Channels: " . json_encode($account->getEnabledChannels($event)));
        $this->newLine();

        // Check SMS Configuration
        $this->info("--- SMS Configuration ---");
        $smsCredential = SmsCredential::where('account_id', $accountId)
            ->where('is_active', true)
            ->first();

        if ($smsCredential) {
            $this->line("✓ SMS Configured");
            $this->line("  Login: {$smsCredential->login}");
            $this->line("  Sender: {$smsCredential->sender_name}");
            $this->line("  Gateway: {$smsCredential->gateway_url}");
            $this->line("  Active: " . ($smsCredential->is_active ? 'YES' : 'NO'));
        } else {
            $this->warn("✗ SMS NOT configured");
        }
        $this->newLine();

        // Check Telegram Configuration
        $this->info("--- Telegram Configuration ---");
        $telegramCredential = TelegramCredential::where('account_id', $accountId)
            ->where('is_active', true)
            ->first();

        if ($telegramCredential) {
            $this->line("✓ Telegram Configured");
            $this->line("  Bot Username: @{$telegramCredential->bot_username}");
            $this->line("  Default Chat ID: {$telegramCredential->default_chat_id}");
            $this->line("  Active: " . ($telegramCredential->is_active ? 'YES' : 'NO'));
            $this->line("  Last Test: " . ($telegramCredential->last_tested_at ?: 'Never'));
            $this->line("  Last Test Status: " . ($telegramCredential->last_test_status ?: 'N/A'));
        } else {
            $this->warn("✗ Telegram NOT configured");
        }
        $this->newLine();

        // Summary
        $this->info("--- Summary ---");
        $merchantEnabled = $account->isNotificationEnabled('merchant.new_order');
        $merchantChannels = $account->getEnabledChannels('merchant.new_order');

        if ($merchantEnabled && !empty($merchantChannels)) {
            $this->info("✓ Merchant notifications are ENABLED");
            $this->line("  Active channels: " . implode(', ', $merchantChannels));
        } else {
            $this->warn("✗ Merchant notifications are DISABLED or have no channels");
            if (!$merchantEnabled) {
                $this->line("  Reason: Not enabled in settings");
            } else {
                $this->line("  Reason: No channels configured/available");
            }
        }

        return 0;
    }
}
