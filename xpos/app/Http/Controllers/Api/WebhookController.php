<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Warehouse;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Base webhook controller for delivery platform integrations
 * Contains common logic for processing platform orders
 */
abstract class WebhookController extends Controller
{
    protected NotificationService $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Verify that the account exists and has the platform enabled
     * Child classes must implement this to handle platform-specific authentication
     */
    abstract protected function verifyAccount(Request $request): ?Account;

    /**
     * Get the platform name (e.g., 'wolt', 'yango', 'bolt')
     */
    abstract protected function getPlatformName(): string;

    /**
     * Parse platform-specific order data into standardized format
     * Returns array with keys: platform_order_id, customer_name, customer_phone,
     * delivery_notes, items (array of ['sku'/'barcode', 'quantity', 'price']),
     * delivery_fee, platform_commission
     */
    abstract protected function parseOrderData(Request $request): array;

    /**
     * Create a Sale from platform order data
     * This is the main method that child controllers will call
     */
    protected function createSaleFromPlatformOrder(Account $account, array $orderData): Sale
    {
        // Check if order already exists (prevent duplicates)
        $existingSale = Sale::where('account_id', $account->id)
            ->where('platform_order_id', $orderData['platform_order_id'])
            ->where('source', $this->getPlatformName())
            ->first();

        if ($existingSale) {
            Log::warning('Duplicate platform order received', [
                'platform' => $this->getPlatformName(),
                'platform_order_id' => $orderData['platform_order_id'],
                'existing_sale_id' => $existingSale->sale_id,
            ]);
            throw new \Exception(__('errors.order_already_exists'));
        }

        DB::beginTransaction();
        try {
            // Get platform-specific warehouse or fallback to main warehouse
            $warehouse = $this->getPlatformWarehouse($account);

            if (!$warehouse) {
                throw new \Exception(__('errors.warehouse_not_found'));
            }

            // Get platform-specific branch or fallback to first branch
            $branch = $this->getPlatformBranch($account);
            if (!$branch) {
                throw new \Exception(__('errors.branch_not_found'));
            }

            // Determine if fiscal printer should be used for this order
            $useFiscalPrinter = $account->fiscal_printer_enabled ?? false;

            // Match products and calculate totals
            $matchedItems = $this->matchProducts($account->id, $orderData['items']);
            $subtotal = collect($matchedItems)->sum(fn($item) => $item['price'] * $item['quantity']);
            $deliveryFee = $orderData['delivery_fee'] ?? 0;
            $platformCommission = $orderData['platform_commission'] ?? 0;
            $total = $subtotal + $deliveryFee;

            // Create Sale record
            $sale = Sale::create([
                'account_id' => $account->id,
                'branch_id' => $branch->id,
                'sale_number' => Sale::generateSaleNumber($account->id),
                'sale_date' => now(),
                'is_online_order' => true,
                'source' => $this->getPlatformName(),
                'platform_order_id' => $orderData['platform_order_id'],
                'platform_order_data' => $orderData['raw_data'] ?? [],
                'customer_name' => $orderData['customer_name'] ?? 'Platform Customer',
                'customer_phone' => $orderData['customer_phone'] ?? null,
                'delivery_notes' => $orderData['delivery_notes'] ?? null,
                'status' => 'pending',
                'payment_status' => 'credit', // Will be marked as paid when completed
                'use_fiscal_printer' => $useFiscalPrinter, // Use fiscal printer if enabled for account
                'subtotal' => $subtotal,
                'tax_amount' => 0,
                'discount_amount' => 0,
                'delivery_fee' => $deliveryFee,
                'platform_commission' => $platformCommission,
                'total' => $total,
                'paid_amount' => 0,
                'credit_amount' => $total,
            ]);

            // Create SaleItems
            foreach ($matchedItems as $itemData) {
                SaleItem::create([
                    'sale_id' => $sale->sale_id,
                    'product_id' => $itemData['product_id'],
                    'variant_id' => $itemData['variant_id'] ?? null,
                    'quantity' => $itemData['quantity'],
                    'unit_price' => $itemData['price'],
                    'subtotal' => $itemData['price'] * $itemData['quantity'],
                    'tax_amount' => 0,
                    'discount_amount' => 0,
                    'total' => $itemData['price'] * $itemData['quantity'],
                ]);
            }

            // Check stock availability (but don't deduct yet - only when status becomes 'completed')
            $stockIssues = $this->checkStockAvailability($account->id, $matchedItems, $warehouse->id);

            if (!empty($stockIssues)) {
                $sale->has_negative_stock = true;
                $sale->save();

                Log::warning('Platform order created with stock issues', [
                    'platform' => $this->getPlatformName(),
                    'sale_id' => $sale->sale_id,
                    'stock_issues' => $stockIssues,
                ]);
            }

            DB::commit();

            // Send notification to merchant
            $this->sendNewOrderNotification($account, $sale);

            Log::info('Platform order created successfully', [
                'platform' => $this->getPlatformName(),
                'sale_id' => $sale->sale_id,
                'platform_order_id' => $orderData['platform_order_id'],
                'total' => $total,
            ]);

            return $sale;

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to create sale from platform order', [
                'platform' => $this->getPlatformName(),
                'platform_order_id' => $orderData['platform_order_id'] ?? 'unknown',
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    /**
     * Match products from platform order to local products
     * Priority: 1) Barcode, 2) SKU
     */
    protected function matchProducts(int $accountId, array $items): array
    {
        $matchedItems = [];

        foreach ($items as $item) {
            $product = null;
            $variant = null;

            // Try to match by barcode first
            if (!empty($item['barcode'])) {
                $product = Product::where('account_id', $accountId)
                    ->where('barcode', $item['barcode'])
                    ->where('is_active', true)
                    ->first();

                // If not found in products, check variants
                if (!$product) {
                    $variant = ProductVariant::whereHas('product', function($query) use ($accountId) {
                        $query->where('account_id', $accountId)
                            ->where('is_active', true);
                    })
                    ->where('barcode', $item['barcode'])
                    ->where('is_active', true)
                    ->first();

                    if ($variant) {
                        $product = $variant->product;
                    }
                }
            }

            // Try to match by SKU if barcode didn't work
            if (!$product && !empty($item['sku'])) {
                $product = Product::where('account_id', $accountId)
                    ->where('sku', $item['sku'])
                    ->where('is_active', true)
                    ->first();

                // If not found in products, check variants
                if (!$product) {
                    $variant = ProductVariant::whereHas('product', function($query) use ($accountId) {
                        $query->where('account_id', $accountId)
                            ->where('is_active', true);
                    })
                    ->where('sku', $item['sku'])
                    ->where('is_active', true)
                    ->first();

                    if ($variant) {
                        $product = $variant->product;
                    }
                }
            }

            // Product not found - log error and skip this item
            if (!$product) {
                Log::error('Product not found in platform order', [
                    'platform' => $this->getPlatformName(),
                    'barcode' => $item['barcode'] ?? null,
                    'sku' => $item['sku'] ?? null,
                    'platform_product_name' => $item['name'] ?? null,
                ]);
                throw new \Exception(__('errors.product_not_found_identifier', [
                    'identifier' => $item['barcode'] ?? $item['sku'] ?? $item['name'] ?? __('errors.unknown')
                ]));
            }

            $matchedItems[] = [
                'product_id' => $product->id,
                'variant_id' => $variant?->id,
                'quantity' => $item['quantity'],
                'price' => $item['price'],
                'product_name' => $product->name,
            ];
        }

        return $matchedItems;
    }

    /**
     * Check stock availability for order items
     */
    protected function checkStockAvailability(int $accountId, array $items, int $warehouseId): array
    {
        $issues = [];

        foreach ($items as $item) {
            $stock = \App\Models\ProductStock::where('account_id', $accountId)
                ->where('warehouse_id', $warehouseId)
                ->where('product_id', $item['product_id'])
                ->where('variant_id', $item['variant_id'])
                ->first();

            $availableQty = $stock?->quantity ?? 0;

            if ($availableQty < $item['quantity']) {
                $issues[] = [
                    'product_id' => $item['product_id'],
                    'product_name' => $item['product_name'],
                    'required' => $item['quantity'],
                    'available' => $availableQty,
                    'shortage' => $item['quantity'] - $availableQty,
                ];
            }
        }

        return $issues;
    }

    /**
     * Send new order notification to merchant
     */
    protected function sendNewOrderNotification(Account $account, Sale $sale): void
    {
        try {
            $orderData = [
                'order_number' => $sale->sale_number,
                'customer_name' => $sale->customer_name,
                'customer_phone' => $sale->customer_phone,
                'total' => number_format($sale->total, 2),
                'items_count' => $sale->items->count(),
                'delivery_address' => $sale->delivery_notes,
                'notes' => $sale->delivery_notes,
                'payment_method' => $sale->getSourceLabel(),
            ];

            $this->notificationService->sendNewOrderNotification($account->id, $orderData);
        } catch (\Exception $e) {
            // Log error but don't fail the order creation
            Log::error('Failed to send new order notification', [
                'platform' => $this->getPlatformName(),
                'sale_id' => $sale->sale_id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Standard success response for webhook
     */
    protected function successResponse(Sale $sale, ?string $message = null): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message ?? __('orders.order_received_successfully'),
            'data' => [
                'sale_id' => $sale->sale_id,
                'sale_number' => $sale->sale_number,
                'platform_order_id' => $sale->platform_order_id,
                'status' => $sale->status,
            ],
        ], 200);
    }

    /**
     * Standard error response for webhook
     */
    protected function errorResponse(string $message, int $statusCode = 400): JsonResponse
    {
        return response()->json([
            'success' => false,
            'error' => $message,
        ], $statusCode);
    }

    /**
     * Get platform-specific warehouse for the account
     * Falls back to main warehouse if platform-specific warehouse is not configured
     */
    protected function getPlatformWarehouse(Account $account): ?Warehouse
    {
        $platformName = $this->getPlatformName();

        // Try to get platform-specific warehouse
        $warehouseIdField = "{$platformName}_warehouse_id";
        if (isset($account->$warehouseIdField) && $account->$warehouseIdField) {
            $warehouse = Warehouse::where('id', $account->$warehouseIdField)
                ->where('account_id', $account->id)
                ->first();

            if ($warehouse) {
                Log::info('Using platform-specific warehouse', [
                    'platform' => $platformName,
                    'warehouse_id' => $warehouse->id,
                    'warehouse_name' => $warehouse->name,
                ]);
                return $warehouse;
            }
        }

        // Fallback to main warehouse
        $warehouse = Warehouse::where('account_id', $account->id)
            ->where('type', 'main')
            ->first();

        if ($warehouse) {
            Log::info('Using fallback main warehouse', [
                'platform' => $platformName,
                'warehouse_id' => $warehouse->id,
                'warehouse_name' => $warehouse->name,
            ]);
        }

        return $warehouse;
    }

    /**
     * Get platform-specific branch for the account
     * Falls back to first branch if platform-specific branch is not configured
     */
    protected function getPlatformBranch(Account $account): ?Branch
    {
        $platformName = $this->getPlatformName();

        // Try to get platform-specific branch
        $branchIdField = "{$platformName}_branch_id";
        if (isset($account->$branchIdField) && $account->$branchIdField) {
            $branch = Branch::where('id', $account->$branchIdField)
                ->where('account_id', $account->id)
                ->first();

            if ($branch) {
                Log::info('Using platform-specific branch', [
                    'platform' => $platformName,
                    'branch_id' => $branch->id,
                    'branch_name' => $branch->name,
                ]);
                return $branch;
            }
        }

        // Fallback to first available branch
        $branch = $account->branches()->first();

        if ($branch) {
            Log::info('Using fallback first branch', [
                'platform' => $platformName,
                'branch_id' => $branch->id,
                'branch_name' => $branch->name,
            ]);
        }

        return $branch;
    }
}
