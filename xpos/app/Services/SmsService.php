<?php

namespace App\Services;

use App\Models\SmsCredential;
use App\Models\SmsLog;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SmsService
{
    /**
     * Send SMS to a single recipient
     */
    public function send(int $accountId, string $phoneNumber, string $message): array
    {
        $credentials = $this->getCredentials($accountId);

        if (!$credentials) {
            return [
                'success' => false,
                'error' => 'SMS credentials not configured for this account',
            ];
        }

        if (!$credentials->is_active) {
            return [
                'success' => false,
                'error' => 'SMS service is not active for this account',
            ];
        }

        // Create log entry
        $log = SmsLog::create([
            'account_id' => $accountId,
            'phone_number' => $phoneNumber,
            'message' => $message,
            'sender_name' => $credentials->sender_name,
            'status' => 'pending',
        ]);

        try {
            $response = $this->sendToGateway($credentials, $phoneNumber, $message);

            if ($response['success']) {
                $log->markAsSent($response['response']);
                return [
                    'success' => true,
                    'message' => 'SMS sent successfully',
                    'log_id' => $log->id,
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
            Log::error('SMS sending failed', [
                'account_id' => $accountId,
                'phone' => $phoneNumber,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => 'Failed to send SMS: ' . $e->getMessage(),
                'log_id' => $log->id,
            ];
        }
    }

    /**
     * Send SMS to multiple recipients
     */
    public function sendBulk(int $accountId, array $phoneNumbers, string $message): array
    {
        $results = [];

        foreach ($phoneNumbers as $phoneNumber) {
            $results[] = $this->send($accountId, $phoneNumber, $message);
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
     * Get SMS credentials for an account
     */
    protected function getCredentials(int $accountId): ?SmsCredential
    {
        return SmsCredential::where('account_id', $accountId)
            ->where('is_active', true)
            ->first();
    }

    /**
     * Generate MD5 hash
     */
    protected function generateMD5(string $text): string
    {
        return md5($text);
    }

    /**
     * Generate LSim API key
     * KEY = md5 of ( (md5 of password) + LOGIN + MSG_BODY + MSISDN + SENDER )
     */
    protected function generateLSimKey(string $login, string $password, string $message, string $msisdn, string $sender): string
    {
        $passwordMD5 = $this->generateMD5($password);
        $keyString = $passwordMD5 . $login . $message . $msisdn . $sender;
        return $this->generateMD5($keyString);
    }

    /**
     * Send SMS through the gateway
     */
    protected function sendToGateway(SmsCredential $credentials, string $phoneNumber, string $message): array
    {
        try {
            $formattedPhone = $this->formatPhoneNumber($phoneNumber);

            // QuickSMS API format - remove + prefix and just use digits
            $msisdn = ltrim($formattedPhone, '+');

            // Generate the required MD5 key
            $key = $this->generateLSimKey(
                $credentials->login,
                $credentials->password,
                $message,
                $msisdn,
                $credentials->sender_name
            );

            // LSim quicksms API implementation (POST with JSON)
            $smsData = [
                'login' => $credentials->login,
                'key' => $key,
                'msisdn' => $msisdn,
                'text' => $message,
                'sender' => $credentials->sender_name,
                'scheduled' => 'NOW',
                'unicode' => false,
            ];

            Log::info('Sending SMS', [
                'gateway' => $credentials->gateway_url,
                'login' => $credentials->login,
                'msisdn' => $msisdn,
                'sender' => $credentials->sender_name,
                'key' => $key,
            ]);

            $response = Http::timeout(30)
                ->withHeaders([
                    'Content-Type' => 'application/json',
                    'Accept' => 'application/json',
                ])
                ->post($credentials->gateway_url, $smsData);

            Log::info('SMS Gateway Response', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            if ($response->successful()) {
                $responseData = $response->json();

                // LSim API returns success when obj exists and no errorCode
                if (isset($responseData['obj']) && (!isset($responseData['errorCode']) || $responseData['errorCode'] === 0)) {
                    return [
                        'success' => true,
                        'response' => json_encode($responseData),
                    ];
                } else {
                    return [
                        'success' => false,
                        'error' => $responseData['errorMessage'] ?? 'SMS göndərilərkən xəta baş verdi',
                    ];
                }
            } else {
                $responseData = $response->json();
                return [
                    'success' => false,
                    'error' => 'HTTP ' . $response->status() . ': ' . ($responseData['errorMessage'] ?? 'SMS API xətası'),
                ];
            }
        } catch (\Exception $e) {
            Log::error('SMS Gateway Exception', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return [
                'success' => false,
                'error' => 'SMS xidməti əlçatan deyil: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Format phone number (remove spaces, dashes, etc.)
     */
    protected function formatPhoneNumber(string $phoneNumber): string
    {
        // Remove all non-digit characters except the leading +
        $formatted = preg_replace('/[^\d+]/', '', $phoneNumber);

        // Ensure it starts with + if not already
        if (!str_starts_with($formatted, '+')) {
            $formatted = '+' . $formatted;
        }

        return $formatted;
    }

    /**
     * Get SMS logs for an account
     */
    public function getLogs(int $accountId, int $limit = 50): \Illuminate\Database\Eloquent\Collection
    {
        return SmsLog::where('account_id', $accountId)
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get SMS statistics for an account
     */
    public function getStatistics(int $accountId): array
    {
        $total = SmsLog::where('account_id', $accountId)->count();
        $sent = SmsLog::where('account_id', $accountId)->where('status', 'sent')->count();
        $failed = SmsLog::where('account_id', $accountId)->where('status', 'failed')->count();
        $pending = SmsLog::where('account_id', $accountId)->where('status', 'pending')->count();

        return [
            'total' => $total,
            'sent' => $sent,
            'failed' => $failed,
            'pending' => $pending,
        ];
    }
}
