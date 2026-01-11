<?php

namespace App\Services;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Customer;
use App\Models\ProductStock;
use App\Models\StockHistory;
use App\Models\StockMovement;
use App\Models\Warehouse;
use App\Models\Branch;
use App\Models\FiscalPrinterJob;
use App\Models\FiscalPrinterConfig;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

/**
 * Kiosk Sale Processor Service
 *
 * Handles sale creation for kiosk app with support for:
 * - Single sale processing (real-time)
 * - Batch sales upload (offline queue sync)
 * - Stock updates
 * - Fiscal printer job creation
 * - Dashboard cache invalidation
 * - Idempotency (prevent duplicates)
 */
class KioskSaleProcessor
{
    protected LoyaltyService $loyaltyService;
    protected FiscalPrinterService $fiscalService;

    public function __construct(
        LoyaltyService $loyaltyService,
        FiscalPrinterService $fiscalService
    ) {
        $this->loyaltyService = $loyaltyService;
        $this->fiscalService = $fiscalService;
    }

    /**
     * Process a single sale (real-time)
     *
     * @param array $saleData
     * @param int $accountId
     * @return Sale
     * @throws \Exception
     */
    public function processSingleSale(array $saleData, int $accountId): Sale
    {
        Log::info('Kiosk: Processing single sale', [
            'account_id' => $accountId,
            'local_id' => $saleData['local_id'] ?? null
        ]);

        try {
            $sale = DB::transaction(function () use ($saleData, $accountId) {
                return $this->createSale($saleData, $accountId);
            });

            Log::info('Kiosk: Single sale processed successfully', [
                'sale_id' => $sale->sale_id,
                'sale_number' => $sale->sale_number
            ]);

            return $sale;
        } catch (\Exception $e) {
            Log::error('Kiosk: Single sale processing failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    /**
     * Process batch sales upload (offline queue)
     *
     * @param array $salesData Array of sales
     * @param int $accountId
     * @return array ['results' => [...], 'failed' => [...]]
     */
    public function processBatchSales(array $salesData, int $accountId): array
    {
        Log::info('Kiosk: Processing batch sales upload', [
            'account_id' => $accountId,
            'count' => count($salesData)
        ]);

        $results = [];
        $failed = [];

        foreach ($salesData as $saleData) {
            try {
                // Check for duplicate by local_id (idempotency)
                if (isset($saleData['local_id'])) {
                    $existing = Sale::where('account_id', $accountId)
                        ->where('notes', 'LIKE', '%Kiosk Local ID: ' . $saleData['local_id'] . '%')
                        ->first();

                    if ($existing) {
                        Log::info('Kiosk: Duplicate sale detected, skipping', [
                            'local_id' => $saleData['local_id'],
                            'server_sale_id' => $existing->sale_id
                        ]);

                        $results[] = [
                            'local_id' => $saleData['local_id'],
                            'server_sale_id' => $existing->sale_id,
                            'sale_number' => $existing->sale_number,
                            'status' => 'duplicate',
                        ];
                        continue;
                    }
                }

                $sale = DB::transaction(function () use ($saleData, $accountId) {
                    return $this->createSale($saleData, $accountId);
                });

                $results[] = [
                    'local_id' => $saleData['local_id'] ?? null,
                    'server_sale_id' => $sale->sale_id,
                    'sale_number' => $sale->sale_number,
                    'status' => 'created',
                ];

                Log::info('Kiosk: Batch sale processed', [
                    'local_id' => $saleData['local_id'] ?? null,
                    'sale_id' => $sale->sale_id
                ]);
            } catch (\Exception $e) {
                Log::error('Kiosk: Batch sale failed', [
                    'local_id' => $saleData['local_id'] ?? null,
                    'error' => $e->getMessage()
                ]);

                $failed[] = [
                    'local_id' => $saleData['local_id'] ?? null,
                    'error' => $e->getMessage(),
                ];
            }
        }

        Log::info('Kiosk: Batch sales processing completed', [
            'account_id' => $accountId,
            'successful' => count($results),
            'failed' => count($failed)
        ]);

        return [
            'results' => $results,
            'failed' => $failed,
        ];
    }

    /**
     * Create a sale record with all related data
     *
     * @param array $data
     * @param int $accountId
     * @return Sale
     * @throws \Exception
     */
    protected function createSale(array $data, int $accountId): Sale
    {
        // Calculate totals
        $subtotal = 0;
        foreach ($data['items'] as $item) {
            $itemTotal = ($item['quantity'] * $item['unit_price']) - ($item['discount_amount'] ?? 0);
            $subtotal += $itemTotal;
        }

        $taxAmount = $data['tax_amount'] ?? 0;
        $discountAmount = $data['discount_amount'] ?? 0;
        $total = $subtotal + $taxAmount - $discountAmount;

        // Prepare sale notes
        $notes = $data['notes'] ?? '';
        if (isset($data['local_id'])) {
            $notes .= ($notes ? ' | ' : '') . 'Kiosk Local ID: ' . $data['local_id'];
        }

        // Parse created_at from kiosk (ISO string) or use now()
        $saleDate = isset($data['created_at'])
            ? \Carbon\Carbon::parse($data['created_at'])
            : now();

        // Create sale record
        $sale = Sale::create([
            'account_id' => $accountId,
            'branch_id' => $data['branch_id'],
            'customer_id' => $data['customer_id'] ?? null,
            'subtotal' => $subtotal,
            'tax_amount' => $taxAmount,
            'discount_amount' => $discountAmount,
            'total' => $total,
            'status' => 'completed',
            'user_id' => $data['user_id'] ?? null, // Kiosk user who made the sale
            'notes' => $notes,
            'sale_date' => $saleDate,
            'payment_status' => $data['payment_status'] ?? 'paid',
            'paid_amount' => $total,
            'fiscal_number' => $data['fiscal_number'] ?? null, // Fiscal number from kiosk
            'fiscal_document_id' => $data['fiscal_document_id'] ?? null,
            'use_fiscal_printer' => false, // Already printed by kiosk
        ]);

        Log::info('Kiosk: Sale created', [
            'sale_id' => $sale->sale_id,
            'sale_number' => $sale->sale_number,
            'total' => $total
        ]);

        // Create sale items
        foreach ($data['items'] as $item) {
            $product = Product::find($item['product_id']);

            SaleItem::create([
                'sale_id' => $sale->sale_id,
                'product_id' => $item['product_id'],
                'variant_id' => $item['variant_id'] ?? null,
                'quantity' => $item['quantity'],
                'unit_price' => $item['unit_price'],
                'purchase_price' => $product->purchase_price ?? null,
                'discount_amount' => $item['discount_amount'] ?? 0,
                'total' => ($item['quantity'] * $item['unit_price']) - ($item['discount_amount'] ?? 0),
            ]);

            // Update stock
            if (isset($item['product_id'])) {
                $this->updateProductStock(
                    $item['product_id'],
                    $item['quantity'],
                    $sale,
                    $item['variant_id'] ?? null
                );
            }
        }

        // Create payment records
        if (!empty($data['payments']) && is_array($data['payments'])) {
            foreach ($data['payments'] as $payment) {
                Payment::create([
                    'sale_id' => $sale->sale_id,
                    'method' => $payment['method'] ?? 'cash',
                    'amount' => $payment['amount'] ?? $total,
                    'notes' => 'Kiosk sale payment',
                ]);
            }
        } else {
            // Default single payment
            Payment::create([
                'sale_id' => $sale->sale_id,
                'method' => 'cash',
                'amount' => $total,
                'notes' => 'Kiosk sale payment',
            ]);
        }

        // Handle loyalty points if customer is provided
        if ($sale->customer_id && $sale->payment_status === 'paid') {
            $this->awardLoyaltyPoints($sale);
        }

        // Create fiscal printer job if fiscal data NOT already provided
        // (Kiosk already printed, so we only create job if kiosk didn't print)
        if (empty($data['fiscal_number'])) {
            $this->createFiscalPrinterJob($sale, $accountId);
        }

        return $sale;
    }

    /**
     * Update product stock after sale
     *
     * @param int $productId
     * @param float $quantity
     * @param Sale $sale
     * @param int|null $variantId
     * @return void
     */
    protected function updateProductStock(int $productId, float $quantity, Sale $sale, ?int $variantId = null): void
    {
        // Get the branch and its accessible warehouses
        $branch = Branch::find($sale->branch_id);

        if (!$branch) {
            Log::warning('Kiosk: No branch found for stock update', [
                'branch_id' => $sale->branch_id,
                'sale_id' => $sale->sale_id
            ]);
            return;
        }

        // Get the first warehouse that the branch can modify stock for
        $warehouse = $branch->warehouses()
            ->wherePivot('can_modify_stock', true)
            ->first();

        // If no accessible warehouse with modify permissions, fall back to main warehouse
        if (!$warehouse) {
            $warehouse = Warehouse::where('account_id', $sale->account_id)
                ->where('type', 'main')
                ->first();
        }

        if ($warehouse) {
            $productStock = ProductStock::firstOrCreate([
                'product_id' => $productId,
                'variant_id' => $variantId,
                'warehouse_id' => $warehouse->id,
                'account_id' => $sale->account_id,
            ], [
                'quantity' => 0,
                'min_level' => 3,
            ]);

            $quantityBefore = $productStock->quantity;
            $productStock->decrement('quantity', $quantity);

            // Create stock history record
            StockHistory::create([
                'product_id' => $productId,
                'variant_id' => $variantId,
                'warehouse_id' => $warehouse->id,
                'quantity_before' => $quantityBefore,
                'quantity_change' => -$quantity,
                'quantity_after' => $quantityBefore - $quantity,
                'type' => 'xaric_olma',
                'reference_type' => 'sale',
                'reference_id' => $sale->sale_id,
                'user_id' => $sale->user_id, // Kiosk user who made the sale
                'notes' => "Kiosk Satış #{$sale->sale_number}",
                'occurred_at' => $sale->created_at ?? now(),
            ]);

            StockMovement::create([
                'account_id' => $sale->account_id,
                'warehouse_id' => $warehouse->id,
                'product_id' => $productId,
                'variant_id' => $variantId,
                'movement_type' => 'xaric_olma',
                'quantity' => -$quantity,
                'reference_type' => 'sale',
                'reference_id' => $sale->sale_id,
                'notes' => "Kiosk Satış #{$sale->sale_number}",
            ]);

            Log::info('Kiosk: Stock updated', [
                'product_id' => $productId,
                'variant_id' => $variantId,
                'quantity_before' => $quantityBefore,
                'quantity_after' => $quantityBefore - $quantity,
                'sale_id' => $sale->sale_id
            ]);
        } else {
            Log::warning('Kiosk: No warehouse found for stock update', [
                'branch_id' => $sale->branch_id,
                'sale_id' => $sale->sale_id
            ]);
        }
    }

    /**
     * Create fiscal printer job (only if needed)
     *
     * @param Sale $sale
     * @param int $accountId
     * @return void
     */
    protected function createFiscalPrinterJob(Sale $sale, int $accountId): void
    {
        $account = \App\Models\Account::find($accountId);

        if (!$account || !$account->fiscal_printer_enabled) {
            return;
        }

        $config = FiscalPrinterConfig::where('account_id', $accountId)
            ->where('is_active', true)
            ->first();

        if (!$config) {
            Log::info('Kiosk: No fiscal config found, skipping job creation', [
                'account_id' => $accountId,
                'sale_id' => $sale->sale_id
            ]);
            return;
        }

        // Validate shift status
        if (!$config->isShiftValid()) {
            Log::warning('Kiosk: Fiscal shift validation failed, skipping job', [
                'account_id' => $accountId,
                'sale_id' => $sale->sale_id,
                'shift_open' => $config->shift_open
            ]);
            return;
        }

        // Create fiscal printer job
        $requestData = $this->fiscalService->getFormattedRequestData($config, $sale);

        FiscalPrinterJob::create([
            'account_id' => $accountId,
            'sale_id' => $sale->sale_id,
            'status' => FiscalPrinterJob::STATUS_PENDING,
            'request_data' => $requestData,
            'provider' => $config->provider,
        ]);

        Log::info('Kiosk: Fiscal print job created', [
            'sale_id' => $sale->sale_id,
            'account_id' => $accountId
        ]);
    }

    /**
     * Award loyalty points for sale
     *
     * @param Sale $sale
     * @return void
     */
    protected function awardLoyaltyPoints(Sale $sale): void
    {
        try {
            $customer = Customer::find($sale->customer_id);
            $program = $this->loyaltyService->getProgramForAccount($sale->account_id);

            if (!$customer || !$program || !$program->is_active) {
                return;
            }

            // Calculate amount eligible for points
            $amountForPoints = $sale->total;

            if (!$program->earn_on_discounted_items && $sale->discount_amount > 0) {
                $amountForPoints = $sale->subtotal - $sale->discount_amount;
            }

            $pointsEarned = $this->loyaltyService->earnPoints(
                $customer,
                $sale,
                max(0, $amountForPoints)
            );

            if ($pointsEarned) {
                Log::info('Kiosk: Loyalty points awarded', [
                    'sale_id' => $sale->sale_id,
                    'customer_id' => $customer->id,
                    'points' => $pointsEarned->points
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Kiosk: Failed to award loyalty points', [
                'sale_id' => $sale->sale_id,
                'error' => $e->getMessage()
            ]);
            // Don't fail the sale if points award fails
        }
    }

    /**
     * Get sale status by local ID (for kiosk sync tracking)
     *
     * @param string $localId
     * @param int $accountId
     * @return array|null
     */
    public function getSaleStatusByLocalId(string $localId, int $accountId): ?array
    {
        $sale = Sale::where('account_id', $accountId)
            ->where('notes', 'LIKE', '%Kiosk Local ID: ' . $localId . '%')
            ->first();

        if (!$sale) {
            return null;
        }

        return [
            'server_sale_id' => $sale->sale_id,
            'sale_number' => $sale->sale_number,
            'total' => $sale->total,
            'status' => $sale->status,
            'payment_status' => $sale->payment_status,
            'fiscal_number' => $sale->fiscal_number,
            'fiscal_document_id' => $sale->fiscal_document_id,
            'created_at' => $sale->created_at->toIso8601String(),
        ];
    }
}
