<?php

namespace App\Services;

use App\Models\Account;
use Illuminate\Support\Facades\Log;

/**
 * Unified notification service for multi-channel delivery
 * Supports SMS, Telegram, and future channels
 * Multi-tenant aware
 */
class NotificationService
{
    protected SmsService $smsService;
    protected TelegramService $telegramService;

    public function __construct(SmsService $smsService, TelegramService $telegramService)
    {
        $this->smsService = $smsService;
        $this->telegramService = $telegramService;
    }

    /**
     * Send notification through configured channels for a specific event
     *
     * @param int $accountId Tenant ID
     * @param string $event Event name (e.g., 'merchant.new_order', 'customer.order_confirmation')
     * @param array $variables Template variables
     * @param array $overrides Optional overrides for recipients, channels, etc.
     * @return array Results from all channels
     */
    public function send(int $accountId, string $event, array $variables, array $overrides = []): array
    {
        $account = Account::find($accountId);

        if (!$account) {
            return [
                'success' => false,
                'error' => 'Account not found',
            ];
        }

        // Debug: Log notification settings
        Log::info('NotificationService - Checking notification', [
            'account_id' => $accountId,
            'event' => $event,
            'notification_settings' => $account->notification_settings,
            'is_enabled' => $account->isNotificationEnabled($event),
        ]);

        // Check if notification is enabled for this event
        if (!$account->isNotificationEnabled($event) && empty($overrides['channels'])) {
            Log::warning('NotificationService - Notification disabled', [
                'account_id' => $accountId,
                'event' => $event,
                'notification_settings' => $account->notification_settings,
            ]);
            return [
                'success' => false,
                'error' => 'Notification disabled for this event',
                'event' => $event,
            ];
        }

        // Get enabled channels (with override support)
        $channels = $overrides['channels'] ?? $account->getEnabledChannels($event);

        Log::info('NotificationService - Enabled channels', [
            'account_id' => $accountId,
            'event' => $event,
            'channels' => $channels,
        ]);

        if (empty($channels)) {
            return [
                'success' => false,
                'error' => 'No enabled channels found',
                'event' => $event,
            ];
        }

        $results = [];
        $overallSuccess = true;

        // Send through each enabled channel
        foreach ($channels as $channel) {
            try {
                $result = $this->sendThroughChannel(
                    $account,
                    $event,
                    $channel,
                    $variables,
                    $overrides
                );

                $results[$channel] = $result;

                if (!$result['success']) {
                    $overallSuccess = false;
                }
            } catch (\Exception $e) {
                Log::error("Notification channel error: {$channel}", [
                    'account_id' => $accountId,
                    'event' => $event,
                    'error' => $e->getMessage(),
                ]);

                $results[$channel] = [
                    'success' => false,
                    'error' => $e->getMessage(),
                ];
                $overallSuccess = false;
            }
        }

        return [
            'success' => $overallSuccess,
            'event' => $event,
            'channels' => $channels,
            'results' => $results,
        ];
    }

    /**
     * Send notification through a specific channel
     */
    protected function sendThroughChannel(
        Account $account,
        string $event,
        string $channel,
        array $variables,
        array $overrides = []
    ): array {
        // Get recipient (with override support)
        $recipient = $overrides['recipients'][$channel]
            ?? $account->getNotificationRecipient($event, $channel);

        if (!$recipient) {
            return [
                'success' => false,
                'error' => "No recipient configured for {$channel}",
            ];
        }

        // Get template (with override support)
        $template = $overrides['templates'][$channel]
            ?? $account->getNotificationTemplate($event, $channel)
            ?? $this->getDefaultTemplate($event, $channel);

        if (!$template) {
            return [
                'success' => false,
                'error' => "No template found for {$channel}",
            ];
        }

        // Format message with variables
        $message = $this->formatMessage($template, $variables);

        // Send through appropriate service
        return match($channel) {
            'sms' => $this->smsService->send($account->id, $recipient, $message),
            'telegram' => $this->telegramService->send($account->id, $recipient, $message),
            default => [
                'success' => false,
                'error' => "Unsupported channel: {$channel}",
            ],
        };
    }

    /**
     * Send new order notification to merchant
     */
    public function sendNewOrderNotification(int $accountId, array $orderData): array
    {
        $variables = [
            'order_number' => $orderData['order_number'] ?? '',
            'customer_name' => $orderData['customer_name'] ?? '',
            'total' => $orderData['total'] ?? '',
            'items_count' => $orderData['items_count'] ?? '',
            'customer_phone' => $orderData['customer_phone'] ?? '',
            'delivery_address' => $orderData['delivery_address'] ?? '',
            'notes' => $orderData['notes'] ?? '',
            'payment_method' => $orderData['payment_method'] ?? '',
        ];

        return $this->send($accountId, 'merchant.new_order', $variables);
    }

    /**
     * Send order confirmation to customer
     */
    public function sendOrderConfirmation(int $accountId, array $orderData, string $customerPhone): array
    {
        $account = Account::find($accountId);

        $variables = [
            'customer_name' => $orderData['customer_name'] ?? '',
            'order_number' => $orderData['order_number'] ?? '',
            'total' => $orderData['total'] ?? '',
            'shop_name' => $account->company_name ?? '',
            'shop_phone' => $account->phone ?? '',
        ];

        // Override recipient with customer's phone/chat_id
        $overrides = [
            'recipients' => [
                'sms' => $customerPhone,
                // For customer notifications, we typically use SMS
                // Telegram would require customer's chat_id which needs separate collection
            ],
        ];

        return $this->send($accountId, 'customer.order_confirmation', $variables, $overrides);
    }

    /**
     * Format message by replacing variables
     */
    protected function formatMessage(string $template, array $variables): string
    {
        $message = $template;

        foreach ($variables as $key => $value) {
            $message = str_replace('{' . $key . '}', $value, $message);
        }

        return $message;
    }

    /**
     * Get default template for an event and channel
     */
    protected function getDefaultTemplate(string $event, string $channel): ?string
    {
        $templates = [
            'merchant.new_order' => [
                'sms' => "🔔 Yeni sifariş!\nSifariş №: {order_number}\nMüştəri: {customer_name}\nMəbləğ: {total} ₼\nTelefon: {customer_phone}",
                'telegram' => "🔔 <b>Yeni sifariş!</b>\n\n📋 Sifariş №: <b>{order_number}</b>\n👤 Müştəri: {customer_name}\n💰 Məbləğ: <b>{total} ₼</b>\n📦 Məhsul sayı: {items_count}\n📞 Telefon: {customer_phone}\n🏙 Çatdırılma: {delivery_address}\n📝 Qeyd: {notes}\n💳 Ödəniş: {payment_method}",
            ],
            'customer.order_confirmation' => [
                'sms' => "Hörmətli {customer_name}, sifarişiniz qəbul edildi!\nSifariş №: {order_number}\nMəbləğ: {total} ₼\nƏlaqə: {shop_phone}\n{shop_name}",
                'telegram' => "✅ <b>Sifarişiniz qəbul edildi!</b>\n\n👤 {customer_name}\n📋 Sifariş №: <b>{order_number}</b>\n💰 Məbləğ: <b>{total} ₼</b>\n\n📞 Əlaqə: {shop_phone}\n🏪 {shop_name}",
            ],
        ];

        return $templates[$event][$channel] ?? null;
    }

    /**
     * Get notification statistics for an account
     */
    public function getStatistics(int $accountId): array
    {
        $smsStats = $this->smsService->getStatistics($accountId);
        $telegramStats = $this->telegramService->getStatistics($accountId);

        return [
            'sms' => $smsStats,
            'telegram' => $telegramStats,
            'total' => [
                'total' => $smsStats['total'] + $telegramStats['total'],
                'sent' => $smsStats['sent'] + $telegramStats['sent'],
                'failed' => $smsStats['failed'] + $telegramStats['failed'],
                'pending' => $smsStats['pending'] + $telegramStats['pending'],
            ],
        ];
    }
}
