<?php

namespace App\Services;

use App\Models\Account;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WoltService
{
    /**
     * Update order status on Wolt platform
     *
     * @param Account $account
     * @param string $platformOrderId
     * @param string $status (pending, completed, cancelled)
     * @return bool
     */
    public function updateOrderStatus(Account $account, string $platformOrderId, string $status): bool
    {
        try {
            // Check if Wolt is enabled for this account
            if (!$account->wolt_enabled) {
                Log::warning('Wolt is not enabled for account', [
                    'account_id' => $account->id,
                    'platform_order_id' => $platformOrderId,
                ]);
                return false;
            }

            // Check credentials
            if (empty($account->wolt_api_key) || empty($account->wolt_restaurant_id)) {
                Log::error('Wolt credentials missing', [
                    'account_id' => $account->id,
                    'platform_order_id' => $platformOrderId,
                ]);
                return false;
            }

            // Map internal status to Wolt status
            $woltStatus = $this->mapStatusToWolt($status);

            if (!$woltStatus) {
                Log::error('Invalid status for Wolt', [
                    'account_id' => $account->id,
                    'platform_order_id' => $platformOrderId,
                    'status' => $status,
                ]);
                return false;
            }

            // Make API request to Wolt
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $account->wolt_api_key,
                'Content-Type' => 'application/json',
            ])->post("https://api.wolt.com/v1/restaurants/{$account->wolt_restaurant_id}/orders/{$platformOrderId}/status", [
                'status' => $woltStatus,
            ]);

            if ($response->successful()) {
                Log::info('Wolt order status updated successfully', [
                    'account_id' => $account->id,
                    'platform_order_id' => $platformOrderId,
                    'status' => $woltStatus,
                ]);
                return true;
            }

            Log::error('Failed to update Wolt order status', [
                'account_id' => $account->id,
                'platform_order_id' => $platformOrderId,
                'status' => $woltStatus,
                'response_status' => $response->status(),
                'response_body' => $response->body(),
            ]);

            return false;

        } catch (\Exception $e) {
            Log::error('Exception updating Wolt order status', [
                'account_id' => $account->id,
                'platform_order_id' => $platformOrderId,
                'status' => $status,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return false;
        }
    }

    /**
     * Map internal status to Wolt status
     *
     * @param string $internalStatus
     * @return string|null
     */
    private function mapStatusToWolt(string $internalStatus): ?string
    {
        return match($internalStatus) {
            'pending' => 'confirmed',
            'completed' => 'ready_for_pickup',
            'cancelled' => 'cancelled',
            default => null,
        };
    }
}
