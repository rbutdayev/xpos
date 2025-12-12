<?php

namespace App\Http\Controllers\Api;

use App\Models\Account;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Bolt Food Webhook Controller
 * Handles incoming orders from Bolt Food platform
 */
class BoltWebhookController extends WebhookController
{
    /**
     * Handle incoming Bolt Food order webhook
     */
    public function handleOrder(Request $request): JsonResponse
    {
        Log::info('Bolt webhook received', [
            'headers' => $request->headers->all(),
            'body' => $request->all(),
        ]);

        try {
            // Verify account and authentication
            $account = $this->verifyAccount($request);

            if (!$account) {
                return $this->errorResponse(__('errors.authentication_failed'), 401);
            }

            // Check if Bolt integration is enabled
            if (!$account->isBoltEnabled()) {
                return $this->errorResponse(__('errors.platform_integration_not_enabled', ['platform' => 'Bolt Food']), 403);
            }

            // Parse order data
            $orderData = $this->parseOrderData($request);

            // Create sale from order
            $sale = $this->createSaleFromPlatformOrder($account, $orderData);

            return $this->successResponse($sale, __('orders.platform_order_received', ['platform' => 'Bolt Food']));

        } catch (\Exception $e) {
            Log::error('Bolt webhook error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Verify Bolt webhook API key and return account
     * TODO: Implement real API key verification when Bolt API docs are available
     */
    protected function verifyAccount(Request $request): ?Account
    {
        // For now, use restaurant_id from request to find account
        // In production, Bolt typically uses API key authentication
        $restaurantId = $request->header('X-Bolt-Restaurant-Id')
            ?? $request->input('restaurant_id')
            ?? $request->input('store_id');

        $apiKey = $request->header('X-Bolt-Api-Key')
            ?? $request->bearerToken();

        if (!$restaurantId) {
            Log::error('Bolt webhook missing restaurant ID');
            return null;
        }

        $account = Account::where('bolt_restaurant_id', $restaurantId)
            ->where('bolt_enabled', true)
            ->first();

        if (!$account) {
            Log::error('Bolt account not found', [
                'restaurant_id' => $restaurantId,
            ]);
            return null;
        }

        // TODO: Verify API key matches account's bolt_api_key
        // if ($apiKey && !hash_equals($account->bolt_api_key, $apiKey)) {
        //     Log::error('Bolt webhook API key verification failed');
        //     return null;
        // }

        return $account;
    }

    /**
     * Get platform name
     */
    protected function getPlatformName(): string
    {
        return 'bolt';
    }

    /**
     * Parse Bolt Food order data into standardized format
     * TODO: Adjust format based on actual Bolt API documentation
     */
    protected function parseOrderData(Request $request): array
    {
        $data = $request->all();

        // Expected Bolt Food format (adjust based on actual API):
        // {
        //   "order": {
        //     "id": "BOLT-12345",
        //     "customer": {"name": "John Doe", "phone": "+1234567890"},
        //     "delivery": {"instructions": "Ring the doorbell"},
        //     "items": [{"sku": "PROD-001", "quantity": 2, "price": 10.50}],
        //     "delivery_fee": 2.50,
        //     "commission": 1.25
        //   }
        // }

        // Bolt might nest data under "order" or "event"
        $order = $data['order'] ?? ($data['event']['order'] ?? null) ?? $data;

        return [
            'platform_order_id' => $order['id']
                ?? $order['order_id']
                ?? $data['order_id']
                ?? null,
            'customer_name' => $order['customer']['name']
                ?? $order['client']['name']
                ?? $order['customer_name']
                ?? 'Bolt Customer',
            'customer_phone' => $order['customer']['phone']
                ?? $order['client']['phone']
                ?? $order['customer_phone']
                ?? null,
            'delivery_notes' => $order['delivery']['instructions']
                ?? $order['delivery_notes']
                ?? $order['notes']
                ?? $order['comment']
                ?? null,
            'items' => $this->parseBoltItems($order['items'] ?? $order['products'] ?? []),
            'delivery_fee' => $order['delivery_fee']
                ?? $order['delivery_cost']
                ?? 0,
            'platform_commission' => $order['commission']
                ?? $order['service_fee']
                ?? 0,
            'raw_data' => $data, // Store full webhook payload for debugging
        ];
    }

    /**
     * Parse Bolt items into standardized format
     */
    private function parseBoltItems(array $items): array
    {
        $parsed = [];

        foreach ($items as $item) {
            $parsed[] = [
                'barcode' => $item['barcode']
                    ?? $item['ean']
                    ?? $item['gtin']
                    ?? null,
                'sku' => $item['sku']
                    ?? $item['product_id']
                    ?? $item['external_id']
                    ?? null,
                'name' => $item['name']
                    ?? $item['title']
                    ?? $item['product_name']
                    ?? 'Unknown Product',
                'quantity' => $item['quantity']
                    ?? $item['count']
                    ?? $item['qty']
                    ?? 1,
                'price' => $item['price']
                    ?? $item['unit_price']
                    ?? 0,
            ];
        }

        return $parsed;
    }
}
