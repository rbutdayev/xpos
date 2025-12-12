<?php

namespace App\Services\Platforms;

use App\Models\Account;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Bolt Food API Service
 * Handles communication with Bolt Food platform API for order status updates
 */
class BoltService
{
    protected Account $account;
    protected string $baseUrl;
    protected int $timeout = 10;
    protected int $maxRetries = 3;

    public function __construct(Account $account)
    {
        $this->account = $account;

        // TODO: Set actual Bolt Food API base URL when documentation is available
        $this->baseUrl = config('services.bolt.api_url', 'https://api.bolt.eu/food/v1');
    }

    /**
     * Update order status on Bolt Food platform
     *
     * @param string $platformOrderId Bolt order ID
     * @param string $status Local status (pending, completed, cancelled)
     * @return array Response with success status and message
     */
    public function updateOrderStatus(string $platformOrderId, string $status): array
    {
        // Map local status to Bolt platform status
        $boltStatus = $this->mapStatusToBolt($status);

        Log::info('Updating Bolt order status', [
            'account_id' => $this->account->id,
            'platform_order_id' => $platformOrderId,
            'local_status' => $status,
            'bolt_status' => $boltStatus,
        ]);

        try {
            $response = Http::timeout($this->timeout)
                ->withHeaders([
                    'X-Api-Key' => $this->account->bolt_api_key,
                    'Content-Type' => 'application/json',
                    'X-Store-Id' => $this->account->bolt_restaurant_id,
                ])
                ->retry($this->maxRetries, 1000, function ($exception) {
                    // Retry on connection errors, not on 4xx errors
                    return !($exception instanceof \Illuminate\Http\Client\RequestException &&
                        $exception->response->status() >= 400 &&
                        $exception->response->status() < 500);
                })
                ->patch("{$this->baseUrl}/stores/{$this->account->bolt_restaurant_id}/orders/{$platformOrderId}", [
                    'status' => $boltStatus,
                    'updated_at' => now()->toIso8601String(),
                ]);

            if ($response->successful()) {
                Log::info('Bolt order status updated successfully', [
                    'account_id' => $this->account->id,
                    'platform_order_id' => $platformOrderId,
                    'status' => $boltStatus,
                ]);

                return [
                    'success' => true,
                    'message' => 'Order status updated on Bolt',
                    'response' => $response->json(),
                ];
            }

            // Handle non-successful responses
            $errorMessage = $response->json('error.message')
                ?? $response->json('message')
                ?? $response->body();

            Log::error('Bolt API error', [
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
            Log::error('Bolt API exception', [
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
     * Map local order status to Bolt platform status
     * TODO: Adjust these mappings based on actual Bolt API documentation
     */
    private function mapStatusToBolt(string $status): string
    {
        return match($status) {
            'pending' => 'accepted',        // Order accepted by restaurant
            'completed' => 'ready',         // Order ready for pickup
            'cancelled' => 'rejected',      // Order rejected/cancelled
            default => 'accepted',
        };
    }

    /**
     * Accept an order
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
     * Reject/cancel an order
     */
    public function rejectOrder(string $platformOrderId, ?string $reason = null): array
    {
        Log::info('Rejecting Bolt order', [
            'account_id' => $this->account->id,
            'platform_order_id' => $platformOrderId,
            'reason' => $reason,
        ]);

        try {
            $response = Http::timeout($this->timeout)
                ->withHeaders([
                    'X-Api-Key' => $this->account->bolt_api_key,
                    'Content-Type' => 'application/json',
                    'X-Store-Id' => $this->account->bolt_restaurant_id,
                ])
                ->retry($this->maxRetries, 1000)
                ->post("{$this->baseUrl}/stores/{$this->account->bolt_restaurant_id}/orders/{$platformOrderId}/reject", [
                    'reason' => $reason ?? 'rejected_by_store',
                    'comment' => $reason,
                    'rejected_at' => now()->toIso8601String(),
                ]);

            if ($response->successful()) {
                Log::info('Bolt order rejected successfully', [
                    'account_id' => $this->account->id,
                    'platform_order_id' => $platformOrderId,
                ]);

                return [
                    'success' => true,
                    'message' => 'Order rejected on Bolt',
                    'response' => $response->json(),
                ];
            }

            $errorMessage = $response->json('error.message')
                ?? $response->json('message')
                ?? $response->body();

            Log::error('Bolt reject order error', [
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
            Log::error('Bolt reject order exception', [
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
     * Alias for rejectOrder to maintain consistency with other services
     */
    public function cancelOrder(string $platformOrderId, ?string $reason = null): array
    {
        return $this->rejectOrder($platformOrderId, $reason);
    }

    /**
     * Update order preparation time
     * Bolt allows stores to update estimated preparation time
     */
    public function updatePreparationTime(string $platformOrderId, int $minutes): array
    {
        Log::info('Updating Bolt order preparation time', [
            'account_id' => $this->account->id,
            'platform_order_id' => $platformOrderId,
            'preparation_time_minutes' => $minutes,
        ]);

        try {
            $response = Http::timeout($this->timeout)
                ->withHeaders([
                    'X-Api-Key' => $this->account->bolt_api_key,
                    'Content-Type' => 'application/json',
                    'X-Store-Id' => $this->account->bolt_restaurant_id,
                ])
                ->patch("{$this->baseUrl}/stores/{$this->account->bolt_restaurant_id}/orders/{$platformOrderId}/preparation-time", [
                    'estimated_time_minutes' => $minutes,
                ]);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'message' => 'Preparation time updated on Bolt',
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
     * Test connection to Bolt API
     */
    public function testConnection(): array
    {
        try {
            $response = Http::timeout($this->timeout)
                ->withHeaders([
                    'X-Api-Key' => $this->account->bolt_api_key,
                    'X-Store-Id' => $this->account->bolt_restaurant_id,
                ])
                ->get("{$this->baseUrl}/stores/{$this->account->bolt_restaurant_id}/info");

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
