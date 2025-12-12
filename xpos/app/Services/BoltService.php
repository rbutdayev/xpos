<?php

namespace App\Services;

use App\Models\Account;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class BoltService
{
    /**
     * Update order status on Bolt platform
     *
     * @param Account $account
     * @param string $platformOrderId
     * @param string $status (pending, completed, cancelled)
     * @return bool
     */
    public function updateOrderStatus(Account $account, string $platformOrderId, string $status): bool
    {
        try {
            // Check if Bolt is enabled for this account
            if (!$account->bolt_enabled) {
                Log::warning('Bolt is not enabled for account', [
                    'account_id' => $account->id,
                    'platform_order_id' => $platformOrderId,
                ]);
                return false;
            }

            // Check credentials
            if (empty($account->bolt_api_key) || empty($account->bolt_restaurant_id)) {
                Log::error('Bolt credentials missing', [
                    'account_id' => $account->id,
                    'platform_order_id' => $platformOrderId,
                ]);
                return false;
            }

            // Map internal status to Bolt status
            $boltStatus = $this->mapStatusToBolt($status);

            if (!$boltStatus) {
                Log::error('Invalid status for Bolt', [
                    'account_id' => $account->id,
                    'platform_order_id' => $platformOrderId,
                    'status' => $status,
                ]);
                return false;
            }

            // Make API request to Bolt
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $account->bolt_api_key,
                'Content-Type' => 'application/json',
            ])->post("https://api.bolt.eu/v1/restaurants/{$account->bolt_restaurant_id}/orders/{$platformOrderId}/status", [
                'status' => $boltStatus,
            ]);

            if ($response->successful()) {
                Log::info('Bolt order status updated successfully', [
                    'account_id' => $account->id,
                    'platform_order_id' => $platformOrderId,
                    'status' => $boltStatus,
                ]);
                return true;
            }

            Log::error('Failed to update Bolt order status', [
                'account_id' => $account->id,
                'platform_order_id' => $platformOrderId,
                'status' => $boltStatus,
                'response_status' => $response->status(),
                'response_body' => $response->body(),
            ]);

            return false;

        } catch (\Exception $e) {
            Log::error('Exception updating Bolt order status', [
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
     * Map internal status to Bolt status
     *
     * @param string $internalStatus
     * @return string|null
     */
    private function mapStatusToBolt(string $internalStatus): ?string
    {
        return match($internalStatus) {
            'pending' => 'confirmed',
            'completed' => 'ready_for_pickup',
            'cancelled' => 'cancelled',
            default => null,
        };
    }
}
