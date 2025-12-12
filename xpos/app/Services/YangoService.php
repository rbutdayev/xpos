<?php

namespace App\Services;

use App\Models\Account;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class YangoService
{
    /**
     * Update order status on Yango platform
     *
     * @param Account $account
     * @param string $platformOrderId
     * @param string $status (pending, completed, cancelled)
     * @return bool
     */
    public function updateOrderStatus(Account $account, string $platformOrderId, string $status): bool
    {
        try {
            // Check if Yango is enabled for this account
            if (!$account->yango_enabled) {
                Log::warning('Yango is not enabled for account', [
                    'account_id' => $account->id,
                    'platform_order_id' => $platformOrderId,
                ]);
                return false;
            }

            // Check credentials
            if (empty($account->yango_api_key) || empty($account->yango_restaurant_id)) {
                Log::error('Yango credentials missing', [
                    'account_id' => $account->id,
                    'platform_order_id' => $platformOrderId,
                ]);
                return false;
            }

            // Map internal status to Yango status
            $yangoStatus = $this->mapStatusToYango($status);

            if (!$yangoStatus) {
                Log::error('Invalid status for Yango', [
                    'account_id' => $account->id,
                    'platform_order_id' => $platformOrderId,
                    'status' => $status,
                ]);
                return false;
            }

            // Make API request to Yango
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $account->yango_api_key,
                'Content-Type' => 'application/json',
            ])->post("https://api.yango.com/v1/restaurants/{$account->yango_restaurant_id}/orders/{$platformOrderId}/status", [
                'status' => $yangoStatus,
            ]);

            if ($response->successful()) {
                Log::info('Yango order status updated successfully', [
                    'account_id' => $account->id,
                    'platform_order_id' => $platformOrderId,
                    'status' => $yangoStatus,
                ]);
                return true;
            }

            Log::error('Failed to update Yango order status', [
                'account_id' => $account->id,
                'platform_order_id' => $platformOrderId,
                'status' => $yangoStatus,
                'response_status' => $response->status(),
                'response_body' => $response->body(),
            ]);

            return false;

        } catch (\Exception $e) {
            Log::error('Exception updating Yango order status', [
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
     * Map internal status to Yango status
     *
     * @param string $internalStatus
     * @return string|null
     */
    private function mapStatusToYango(string $internalStatus): ?string
    {
        return match($internalStatus) {
            'pending' => 'confirmed',
            'completed' => 'ready_for_pickup',
            'cancelled' => 'cancelled',
            default => null,
        };
    }
}
