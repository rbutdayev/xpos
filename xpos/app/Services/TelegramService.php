<?php

namespace App\Services;

use App\Models\TelegramCredential;
use App\Models\TelegramLog;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TelegramService
{
    /**
     * Send message to a Telegram chat
     * Multi-tenant: Uses account_id for isolation
     */
    public function send(int $accountId, string $chatId, string $message, ?array $options = []): array
    {
        $credentials = $this->getCredentials($accountId);

        if (!$credentials) {
            return [
                'success' => false,
                'error' => 'Telegram parametrləri konfiqurasiya edilməyib',
            ];
        }

        if (!$credentials->is_active) {
            return [
                'success' => false,
                'error' => 'Telegram xidməti aktiv deyil',
            ];
        }

        // Create log entry
        $log = TelegramLog::create([
            'account_id' => $accountId,
            'chat_id' => $chatId,
            'message' => $message,
            'status' => 'pending',
        ]);

        try {
            $response = $this->sendToTelegramAPI($credentials, $chatId, $message, $options);

            if ($response['success']) {
                $log->markAsSent(
                    $response['message_id'],
                    $response['response']
                );
                return [
                    'success' => true,
                    'message' => 'Telegram mesajı göndərildi',
                    'log_id' => $log->id,
                    'message_id' => $response['message_id'],
                ];
            } else {
                $log->markAsFailed($response['error']);
                return [
                    'success' => false,
                    'error' => $response['error'],
                    'log_id' => $log->id,
                ];
            }
        } catch (\Exception $e) {
            $log->markAsFailed($e->getMessage());
            Log::error('Telegram sending failed', [
                'account_id' => $accountId,
                'chat_id' => $chatId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => 'Telegram mesajı göndərilərkən xəta: ' . $e->getMessage(),
                'log_id' => $log->id,
            ];
        }
    }

    /**
     * Send message to multiple chats
     */
    public function sendBulk(int $accountId, array $chatIds, string $message, ?array $options = []): array
    {
        $results = [];

        foreach ($chatIds as $chatId) {
            $results[] = $this->send($accountId, $chatId, $message, $options);
        }

        $successCount = count(array_filter($results, fn($r) => $r['success']));
        $failedCount = count($results) - $successCount;

        return [
            'total' => count($results),
            'success' => $successCount,
            'failed' => $failedCount,
            'results' => $results,
        ];
    }

    /**
     * Test the Telegram bot connection
     */
    public function testConnection(int $accountId): array
    {
        $credentials = $this->getCredentials($accountId);

        if (!$credentials) {
            return [
                'success' => false,
                'error' => 'Telegram parametrləri konfiqurasiya edilməyib',
            ];
        }

        try {
            $response = Http::timeout(10)
                ->get("https://api.telegram.org/bot{$credentials->bot_token}/getMe");

            if ($response->successful()) {
                $data = $response->json();
                if ($data['ok'] ?? false) {
                    $credentials->markTestSuccessful();
                    return [
                        'success' => true,
                        'bot_info' => $data['result'],
                        'message' => 'Telegram botu uğurla əlaqələndirildi',
                    ];
                }
            }

            $error = $response->json()['description'] ?? 'Bilinməyən xəta';
            $credentials->markTestFailed($error);

            return [
                'success' => false,
                'error' => $error,
            ];
        } catch (\Exception $e) {
            $credentials->markTestFailed($e->getMessage());
            return [
                'success' => false,
                'error' => 'Bağlantı xətası: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Get the bot information
     */
    public function getBotInfo(int $accountId): ?array
    {
        $credentials = $this->getCredentials($accountId);

        if (!$credentials) {
            return null;
        }

        try {
            $response = Http::timeout(10)
                ->get("https://api.telegram.org/bot{$credentials->bot_token}/getMe");

            if ($response->successful() && ($response->json()['ok'] ?? false)) {
                return $response->json()['result'];
            }

            return null;
        } catch (\Exception $e) {
            Log::error('Failed to get Telegram bot info', [
                'account_id' => $accountId,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Get Telegram credentials for an account (multi-tenant isolation)
     */
    protected function getCredentials(int $accountId): ?TelegramCredential
    {
        return TelegramCredential::where('account_id', $accountId)
            ->where('is_active', true)
            ->first();
    }

    /**
     * Send message through Telegram Bot API
     */
    protected function sendToTelegramAPI(
        TelegramCredential $credentials,
        string $chatId,
        string $message,
        array $options = []
    ): array {
        try {
            $payload = array_merge([
                'chat_id' => $chatId,
                'text' => $message,
                'parse_mode' => $options['parse_mode'] ?? 'HTML',
            ], $options);

            Log::info('Sending Telegram message', [
                'account_id' => $credentials->account_id,
                'chat_id' => $chatId,
            ]);

            $response = Http::timeout(30)
                ->post("https://api.telegram.org/bot{$credentials->bot_token}/sendMessage", $payload);

            Log::info('Telegram API Response', [
                'status' => $response->status(),
                'body' => $response->json(),
            ]);

            if ($response->successful()) {
                $data = $response->json();

                if ($data['ok'] ?? false) {
                    return [
                        'success' => true,
                        'message_id' => $data['result']['message_id'],
                        'response' => $data,
                    ];
                } else {
                    return [
                        'success' => false,
                        'error' => $data['description'] ?? 'Telegram API xətası',
                    ];
                }
            } else {
                $data = $response->json();
                return [
                    'success' => false,
                    'error' => 'HTTP ' . $response->status() . ': ' . ($data['description'] ?? 'Telegram API xətası'),
                ];
            }
        } catch (\Exception $e) {
            Log::error('Telegram API Exception', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return [
                'success' => false,
                'error' => 'Telegram xidməti əlçatan deyil: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Get Telegram logs for an account
     */
    public function getLogs(int $accountId, int $limit = 50): \Illuminate\Database\Eloquent\Collection
    {
        return TelegramLog::where('account_id', $accountId)
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get Telegram statistics for an account
     */
    public function getStatistics(int $accountId): array
    {
        $total = TelegramLog::where('account_id', $accountId)->count();
        $sent = TelegramLog::where('account_id', $accountId)->where('status', 'sent')->count();
        $failed = TelegramLog::where('account_id', $accountId)->where('status', 'failed')->count();
        $pending = TelegramLog::where('account_id', $accountId)->where('status', 'pending')->count();

        return [
            'total' => $total,
            'sent' => $sent,
            'failed' => $failed,
            'pending' => $pending,
        ];
    }

    /**
     * Format message with HTML support for Telegram
     */
    public function formatMessage(string $template, array $variables): string
    {
        $message = $template;

        foreach ($variables as $key => $value) {
            $message = str_replace('{' . $key . '}', $value, $message);
        }

        return $message;
    }
}
