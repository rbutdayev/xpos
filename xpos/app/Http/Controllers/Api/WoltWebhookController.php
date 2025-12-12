<?php

namespace App\Http\Controllers\Api;

use App\Models\Account;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Wolt Webhook Controller
 * Handles incoming orders from Wolt platform
 */
class WoltWebhookController extends WebhookController
{
    /**
     * Handle incoming Wolt order webhook
     */
    public function handleOrder(Request $request): JsonResponse
    {
        Log::info('Wolt webhook received', [
            'headers' => $request->headers->all(),
            'body' => $request->all(),
        ]);

        try {
            // Verify account and authentication
            $account = $this->verifyAccount($request);

            if (!$account) {
                return $this->errorResponse(__('errors.authentication_failed'), 401);
            }

            // Check if Wolt integration is enabled
            if (!$account->isWoltEnabled()) {
                return $this->errorResponse(__('errors.platform_integration_not_enabled', ['platform' => 'Wolt']), 403);
            }

            // Parse order data
            $orderData = $this->parseOrderData($request);

            // Create sale from order
            $sale = $this->createSaleFromPlatformOrder($account, $orderData);

            return $this->successResponse($sale, __('orders.platform_order_received', ['platform' => 'Wolt']));

        } catch (\Exception $e) {
            Log::error('Wolt webhook error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Verify Wolt webhook signature and return account
     * TODO: Implement real signature verification when Wolt API docs are available
     */
    protected function verifyAccount(Request $request): ?Account
    {
        // For now, use restaurant_id from request to find account
        // In production, this should verify the webhook signature
        $restaurantId = $request->header('X-Wolt-Restaurant-Id')
            ?? $request->input('venue.id')
            ?? $request->input('restaurant_id');

        if (!$restaurantId) {
            Log::error('Wolt webhook missing restaurant ID');
            return null;
        }

        $account = Account::where('wolt_restaurant_id', $restaurantId)
            ->where('wolt_enabled', true)
            ->first();

        if (!$account) {
            Log::error('Wolt account not found', [
                'restaurant_id' => $restaurantId,
            ]);
            return null;
        }

        // TODO: Verify webhook signature using account's wolt_api_key
        // Example:
        // $signature = $request->header('X-Wolt-Signature');
        // $expectedSignature = hash_hmac('sha256', $request->getContent(), $account->wolt_api_key);
        // if (!hash_equals($expectedSignature, $signature)) {
        //     Log::error('Wolt webhook signature verification failed');
        //     return null;
        // }

        return $account;
    }

    /**
     * Get platform name
     */
    protected function getPlatformName(): string
    {
        return 'wolt';
    }

    /**
     * Parse Wolt order data into standardized format
     * TODO: Adjust format based on actual Wolt API documentation
     */
    protected function parseOrderData(Request $request): array
    {
        $data = $request->all();

        // Expected Wolt format (adjust based on actual API):
        // {
        //   "order_id": "wolt_12345",
        //   "customer": {"name": "John Doe", "phone": "+1234567890"},
        //   "delivery_info": {"notes": "Ring the doorbell"},
        //   "items": [{"sku": "PROD-001", "quantity": 2, "price": 10.50}],
        //   "totals": {"delivery_fee": 2.50, "commission": 1.25}
        // }

        return [
            'platform_order_id' => $data['order_id'] ?? $data['id'] ?? null,
            'customer_name' => $data['customer']['name'] ?? $data['customer_name'] ?? 'Wolt Customer',
            'customer_phone' => $data['customer']['phone'] ?? $data['customer_phone'] ?? null,
            'delivery_notes' => $data['delivery_info']['notes']
                ?? $data['delivery_notes']
                ?? $data['notes']
                ?? null,
            'items' => $this->parseWoltItems($data['items'] ?? $data['products'] ?? []),
            'delivery_fee' => $data['totals']['delivery_fee']
                ?? $data['delivery_fee']
                ?? 0,
            'platform_commission' => $data['totals']['commission']
                ?? $data['commission']
                ?? 0,
            'raw_data' => $data, // Store full webhook payload for debugging
        ];
    }

    /**
     * Parse Wolt items into standardized format
     */
    private function parseWoltItems(array $items): array
    {
        $parsed = [];

        foreach ($items as $item) {
            $parsed[] = [
                'barcode' => $item['barcode'] ?? $item['ean'] ?? null,
                'sku' => $item['sku'] ?? $item['merchant_product_id'] ?? null,
                'name' => $item['name'] ?? $item['product_name'] ?? 'Unknown Product',
                'quantity' => $item['quantity'] ?? $item['count'] ?? 1,
                'price' => $item['price'] ?? $item['unit_price'] ?? 0,
            ];
        }

        return $parsed;
    }
}
