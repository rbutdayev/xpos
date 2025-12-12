<?php

namespace App\Services\Platforms;

use App\Models\Account;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Wolt API Service
 * Handles communication with Wolt platform API for order status updates
 */
class WoltService
{
    protected Account $account;
    protected string $baseUrl;
    protected int $timeout = 10;
    protected int $maxRetries = 3;

    public function __construct(Account $account)
    {
        $this->account = $account;

        // TODO: Set actual Wolt API base URL when documentation is available
        $this->baseUrl = config('services.wolt.api_url', 'https://restaurant-api.wolt.com/v1');
    }

    /**
     * Update order status on Wolt platform
     *
     * @param string $platformOrderId Wolt order ID
     * @param string $status Local status (pending, completed, cancelled)
     * @return array Response with success status and message
     */
    public function updateOrderStatus(string $platformOrderId, string $status): array
    {
        // Map local status to Wolt platform status
        $woltStatus = $this->mapStatusToWolt($status);

        Log::info('Updating Wolt order status', [
            'account_id' => $this->account->id,
            'platform_order_id' => $platformOrderId,
            'local_status' => $status,
            'wolt_status' => $woltStatus,
        ]);

        try {
            $response = Http::timeout($this->timeout)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $this->account->wolt_api_key,
                    'Content-Type' => 'application/json',
                    'X-Wolt-Restaurant-Id' => $this->account->wolt_restaurant_id,
                ])
                ->retry($this->maxRetries, 1000, function ($exception) {
                    // Retry on connection errors, not on 4xx errors
                    return !($exception instanceof \Illuminate\Http\Client\RequestException &&
                        $exception->response->status() >= 400 &&
                        $exception->response->status() < 500);
                })
                ->post("{$this->baseUrl}/orders/{$platformOrderId}/status", [
                    'status' => $woltStatus,
                    'updated_at' => now()->toIso8601String(),
                ]);

            if ($response->successful()) {
                Log::info('Wolt order status updated successfully', [
                    'account_id' => $this->account->id,
                    'platform_order_id' => $platformOrderId,
                    'status' => $woltStatus,
                ]);

                return [
                    'success' => true,
                    'message' => 'Order status updated on Wolt',
                    'response' => $response->json(),
                ];
            }

            // Handle non-successful responses
            $errorMessage = $response->json('error.message') ?? $response->body();

            Log::error('Wolt API error', [
                'account_id' => $this->account->id,
                'platform_order_id' => $platformOrderId,
                'status_code' => $response->status(),
                'error' => $errorMessage,
            ]);

            return [
                'success' => false,
                'error' => $errorMessage,
                'status_code' => $response->status(),
            ];

        } catch (\Exception $e) {
            Log::error('Wolt API exception', [
                'account_id' => $this->account->id,
                'platform_order_id' => $platformOrderId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Map local order status to Wolt platform status
     * TODO: Adjust these mappings based on actual Wolt API documentation
     */
    private function mapStatusToWolt(string $status): string
    {
        return match($status) {
            'pending' => 'received',        // Order received by restaurant
            'completed' => 'ready',         // Order ready for pickup
            'cancelled' => 'cancelled',     // Order cancelled
            default => 'received',
        };
    }

    /**
     * Accept an order (alternative to updateOrderStatus for 'pending')
     */
    public function acceptOrder(string $platformOrderId): array
    {
        return $this->updateOrderStatus($platformOrderId, 'pending');
    }

    /**
     * Mark order as ready for pickup
     */
    public function markOrderReady(string $platformOrderId): array
    {
        return $this->updateOrderStatus($platformOrderId, 'completed');
    }

    /**
     * Cancel an order
     */
    public function cancelOrder(string $platformOrderId, ?string $reason = null): array
    {
        Log::info('Cancelling Wolt order', [
            'account_id' => $this->account->id,
            'platform_order_id' => $platformOrderId,
            'reason' => $reason,
        ]);

        try {
            $response = Http::timeout($this->timeout)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $this->account->wolt_api_key,
                    'Content-Type' => 'application/json',
                    'X-Wolt-Restaurant-Id' => $this->account->wolt_restaurant_id,
                ])
                ->retry($this->maxRetries, 1000)
                ->post("{$this->baseUrl}/orders/{$platformOrderId}/cancel", [
                    'reason' => $reason ?? 'Restaurant cancelled order',
                    'cancelled_at' => now()->toIso8601String(),
                ]);

            if ($response->successful()) {
                Log::info('Wolt order cancelled successfully', [
                    'account_id' => $this->account->id,
                    'platform_order_id' => $platformOrderId,
                ]);

                return [
                    'success' => true,
                    'message' => 'Order cancelled on Wolt',
                    'response' => $response->json(),
                ];
            }

            $errorMessage = $response->json('error.message') ?? $response->body();

            Log::error('Wolt cancel order error', [
                'account_id' => $this->account->id,
                'platform_order_id' => $platformOrderId,
                'status_code' => $response->status(),
                'error' => $errorMessage,
            ]);

            return [
                'success' => false,
                'error' => $errorMessage,
                'status_code' => $response->status(),
            ];

        } catch (\Exception $e) {
            Log::error('Wolt cancel order exception', [
                'account_id' => $this->account->id,
                'platform_order_id' => $platformOrderId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Test connection to Wolt API
     */
    public function testConnection(): array
    {
        try {
            $response = Http::timeout($this->timeout)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $this->account->wolt_api_key,
                    'X-Wolt-Restaurant-Id' => $this->account->wolt_restaurant_id,
                ])
                ->get("{$this->baseUrl}/restaurant/status");

            return [
                'success' => $response->successful(),
                'status_code' => $response->status(),
                'message' => $response->successful() ? 'Connection successful' : 'Connection failed',
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }
}
