<?php

namespace App\Http\Controllers\Api;

use App\Models\Account;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Yango Webhook Controller
 * Handles incoming orders from Yango platform (Yandex.Eats)
 */
class YangoWebhookController extends WebhookController
{
    /**
     * Handle incoming Yango order webhook
     */
    public function handleOrder(Request $request): JsonResponse
    {
        Log::info('Yango webhook received', [
            'headers' => $request->headers->all(),
            'body' => $request->all(),
        ]);

        try {
            // Verify account and authentication
            $account = $this->verifyAccount($request);

            if (!$account) {
                return $this->errorResponse(__('errors.authentication_failed'), 401);
            }

            // Check if Yango integration is enabled
            if (!$account->isYangoEnabled()) {
                return $this->errorResponse(__('errors.platform_integration_not_enabled', ['platform' => 'Yango']), 403);
            }

            // Parse order data
            $orderData = $this->parseOrderData($request);

            // Create sale from order
            $sale = $this->createSaleFromPlatformOrder($account, $orderData);

            return $this->successResponse($sale, __('orders.platform_order_received', ['platform' => 'Yango']));

        } catch (\Exception $e) {
            Log::error('Yango webhook error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Verify Yango webhook authentication and return account
     * TODO: Implement OAuth2 token verification when Yango API docs are available
     */
    protected function verifyAccount(Request $request): ?Account
    {
        // For now, use restaurant_id from request to find account
        // In production, Yango typically uses OAuth2 bearer tokens
        $restaurantId = $request->header('X-Yango-Restaurant-Id')
            ?? $request->input('place_id')
            ?? $request->input('restaurant_id');

        // Check for Bearer token (OAuth2)
        $bearerToken = $request->bearerToken();

        if (!$restaurantId && !$bearerToken) {
            Log::error('Yango webhook missing authentication');
            return null;
        }

        // Try to find account by restaurant_id first
        if ($restaurantId) {
            $account = Account::where('yango_restaurant_id', $restaurantId)
                ->where('yango_enabled', true)
                ->first();

            if ($account) {
                return $account;
            }
        }

        // TODO: Verify OAuth2 bearer token
        // if ($bearerToken) {
        //     // Verify token with Yango API or decode JWT
        //     $tokenData = $this->verifyYangoToken($bearerToken);
        //     if ($tokenData) {
        //         $account = Account::where('yango_restaurant_id', $tokenData['restaurant_id'])
        //             ->where('yango_enabled', true)
        //             ->first();
        //         return $account;
        //     }
        // }

        Log::error('Yango account not found', [
            'restaurant_id' => $restaurantId,
        ]);

        return null;
    }

    /**
     * Get platform name
     */
    protected function getPlatformName(): string
    {
        return 'yango';
    }

    /**
     * Parse Yango order data into standardized format
     * TODO: Adjust format based on actual Yango/Yandex.Eats API documentation
     */
    protected function parseOrderData(Request $request): array
    {
        $data = $request->all();

        // Expected Yango/Yandex.Eats format (adjust based on actual API):
        // {
        //   "order_nr": "YANGO-12345",
        //   "client": {"name": "John Doe", "phone": "+1234567890"},
        //   "comment": "Ring the doorbell",
        //   "cart": [{"item_id": "PROD-001", "count": 2, "price": 10.50}],
        //   "delivery_cost": 2.50,
        //   "service_fee": 1.25
        // }

        return [
            'platform_order_id' => $data['order_nr']
                ?? $data['order_id']
                ?? $data['id']
                ?? null,
            'customer_name' => $data['client']['name']
                ?? $data['customer']['name']
                ?? $data['customer_name']
                ?? 'Yango Customer',
            'customer_phone' => $data['client']['phone']
                ?? $data['customer']['phone']
                ?? $data['customer_phone']
                ?? null,
            'delivery_notes' => $data['comment']
                ?? $data['delivery_notes']
                ?? $data['notes']
                ?? null,
            'items' => $this->parseYangoItems($data['cart'] ?? $data['items'] ?? $data['products'] ?? []),
            'delivery_fee' => $data['delivery_cost']
                ?? $data['delivery_fee']
                ?? 0,
            'platform_commission' => $data['service_fee']
                ?? $data['commission']
                ?? 0,
            'raw_data' => $data, // Store full webhook payload for debugging
        ];
    }

    /**
     * Parse Yango items into standardized format
     */
    private function parseYangoItems(array $items): array
    {
        $parsed = [];

        foreach ($items as $item) {
            $parsed[] = [
                'barcode' => $item['barcode']
                    ?? $item['ean']
                    ?? $item['ean13']
                    ?? null,
                'sku' => $item['item_id']
                    ?? $item['sku']
                    ?? $item['merchant_id']
                    ?? null,
                'name' => $item['name']
                    ?? $item['title']
                    ?? $item['product_name']
                    ?? 'Unknown Product',
                'quantity' => $item['count']
                    ?? $item['quantity']
                    ?? $item['amount']
                    ?? 1,
                'price' => $item['price']
                    ?? $item['unit_price']
                    ?? 0,
            ];
        }

        return $parsed;
    }
}
