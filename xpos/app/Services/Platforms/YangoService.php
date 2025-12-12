<?php

namespace App\Services\Platforms;

use App\Models\Account;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Yango (Yandex.Eats) API Service
 * Handles communication with Yango platform API for order status updates
 */
class YangoService
{
    protected Account $account;
    protected string $baseUrl;
    protected int $timeout = 10;
    protected int $maxRetries = 3;

    public function __construct(Account $account)
    {
        $this->account = $account;

        // TODO: Set actual Yango API base URL when documentation is available
        $this->baseUrl = config('services.yango.api_url', 'https://eda-integration.yandex.ru/api/v1');
    }

    /**
     * Update order status on Yango platform
     *
     * @param string $platformOrderId Yango order ID
     * @param string $status Local status (pending, completed, cancelled)
     * @return array Response with success status and message
     */
    public function updateOrderStatus(string $platformOrderId, string $status): array
    {
        // Map local status to Yango platform status
        $yangoStatus = $this->mapStatusToYango($status);

        Log::info('Updating Yango order status', [
            'account_id' => $this->account->id,
            'platform_order_id' => $platformOrderId,
            'local_status' => $status,
            'yango_status' => $yangoStatus,
        ]);

        try {
            // Yango typically uses OAuth2, so we use Bearer token
            $response = Http::timeout($this->timeout)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $this->account->yango_api_key,
                    'Content-Type' => 'application/json',
                    'X-Restaurant-Id' => $this->account->yango_restaurant_id,
                ])
                ->retry($this->maxRetries, 1000, function ($exception) {
                    // Retry on connection errors, not on 4xx errors
                    return !($exception instanceof \Illuminate\Http\Client\RequestException &&
                        $exception->response->status() >= 400 &&
                        $exception->response->status() < 500);
                })
                ->post("{$this->baseUrl}/orders/{$platformOrderId}/status", [
                    'status' => $yangoStatus,
                    'status_updated_at' => now()->toIso8601String(),
                ]);

            if ($response->successful()) {
                Log::info('Yango order status updated successfully', [
                    'account_id' => $this->account->id,
                    'platform_order_id' => $platformOrderId,
                    'status' => $yangoStatus,
                ]);

                return [
                    'success' => true,
                    'message' => 'Order status updated on Yango',
                    'response' => $response->json(),
                ];
            }

            // Handle non-successful responses
            $errorMessage = $response->json('message') ?? $response->json('error') ?? $response->body();

            Log::error('Yango API error', [
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
            Log::error('Yango API exception', [
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
     * Map local order status to Yango platform status
     * TODO: Adjust these mappings based on actual Yango API documentation
     */
    private function mapStatusToYango(string $status): string
    {
        return match($status) {
            'pending' => 'confirmed',       // Order confirmed by restaurant
            'completed' => 'ready',         // Order ready for courier pickup
            'cancelled' => 'cancelled',     // Order cancelled
            default => 'confirmed',
        };
    }

    /**
     * Confirm/accept an order
     */
    public function confirmOrder(string $platformOrderId): array
    {
        return $this->updateOrderStatus($platformOrderId, 'pending');
    }

    /**
     * Mark order as ready for courier pickup
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
        Log::info('Cancelling Yango order', [
            'account_id' => $this->account->id,
            'platform_order_id' => $platformOrderId,
            'reason' => $reason,
        ]);

        try {
            $response = Http::timeout($this->timeout)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $this->account->yango_api_key,
                    'Content-Type' => 'application/json',
                    'X-Restaurant-Id' => $this->account->yango_restaurant_id,
                ])
                ->retry($this->maxRetries, 1000)
                ->post("{$this->baseUrl}/orders/{$platformOrderId}/cancel", [
                    'cancellation_reason' => $reason ?? 'cancelled_by_restaurant',
                    'cancellation_comment' => $reason,
                    'cancelled_at' => now()->toIso8601String(),
                ]);

            if ($response->successful()) {
                Log::info('Yango order cancelled successfully', [
                    'account_id' => $this->account->id,
                    'platform_order_id' => $platformOrderId,
                ]);

                return [
                    'success' => true,
                    'message' => 'Order cancelled on Yango',
                    'response' => $response->json(),
                ];
            }

            $errorMessage = $response->json('message') ?? $response->json('error') ?? $response->body();

            Log::error('Yango cancel order error', [
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
            Log::error('Yango cancel order exception', [
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
     * Update order cooking time estimate
     * Yango allows restaurants to update estimated cooking time
     */
    public function updateCookingTime(string $platformOrderId, int $minutes): array
    {
        Log::info('Updating Yango order cooking time', [
            'account_id' => $this->account->id,
            'platform_order_id' => $platformOrderId,
            'cooking_time_minutes' => $minutes,
        ]);

        try {
            $response = Http::timeout($this->timeout)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $this->account->yango_api_key,
                    'Content-Type' => 'application/json',
                    'X-Restaurant-Id' => $this->account->yango_restaurant_id,
                ])
                ->post("{$this->baseUrl}/orders/{$platformOrderId}/cooking-time", [
                    'cooking_duration' => $minutes,
                ]);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'message' => 'Cooking time updated on Yango',
                ];
            }

            return [
                'success' => false,
                'error' => $response->json('message') ?? $response->body(),
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Test connection to Yango API
     */
    public function testConnection(): array
    {
        try {
            $response = Http::timeout($this->timeout)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $this->account->yango_api_key,
                    'X-Restaurant-Id' => $this->account->yango_restaurant_id,
                ])
                ->get("{$this->baseUrl}/restaurants/{$this->account->yango_restaurant_id}/info");

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
