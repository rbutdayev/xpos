<?php

namespace App\Services;

use App\Models\Sale;
use App\Models\SaleReturn;
use App\Models\ReturnItem;
use App\Models\Refund;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\ProductStock;
use App\Models\StockMovement;
use App\Models\Branch;
use App\Models\Warehouse;
use App\Models\InventoryLog;
use App\Models\FiscalPrinterJob;
use App\Models\FiscalPrinterConfig;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ReturnService
{
    public function __construct(
        protected FiscalPrinterService $fiscalPrinterService
    ) {}

    /**
     * Process a return for a sale
     *
     * @param int $accountId
     * @param int $saleId
     * @param array $items Array of items to return: [['sale_item_id' => 1, 'quantity' => 2, 'reason' => 'defective'], ...]
     * @param string|null $reason Overall reason for return
     * @param string|null $notes Additional notes
     * @param bool $useFiscalPrinter Whether to print fiscal receipt
     * @return array
     */
    public function processReturn(
        int $accountId,
        int $saleId,
        array $items,
        ?string $reason = null,
        ?string $notes = null,
        bool $useFiscalPrinter = false
    ): array {
        try {
            return DB::transaction(function () use ($accountId, $saleId, $items, $reason, $notes, $useFiscalPrinter) {
                // Load sale with items and payments
                $sale = Sale::with(['items.product', 'items.variant', 'payments', 'customer', 'branch'])
                    ->where('account_id', $accountId)
                    ->where('sale_id', $saleId)
                    ->firstOrFail();

                // Validate that sale belongs to this account
                if ($sale->account_id !== $accountId) {
                    throw new \Exception('Unauthorized access to sale');
                }

                // Create return record
                $return = SaleReturn::create([
                    'account_id' => $accountId,
                    'sale_id' => $sale->sale_id,
                    'branch_id' => $sale->branch_id,
                    'customer_id' => $sale->customer_id,
                    'user_id' => auth()->id(),
                    'use_fiscal_printer' => $useFiscalPrinter,
                    'subtotal' => 0, // Will be calculated
                    'tax_amount' => 0, // Will be calculated
                    'total' => 0, // Will be calculated
                    'status' => 'completed',
                    'reason' => $reason,
                    'notes' => $notes,
                    'return_date' => now(),
                ]);

                $totalAmount = 0;

                // Process each return item
                foreach ($items as $itemData) {
                    $saleItem = $sale->items->firstWhere('item_id', $itemData['sale_item_id']);

                    if (!$saleItem) {
                        throw new \Exception("Sale item {$itemData['sale_item_id']} not found");
                    }

                    $returnQuantity = (float) $itemData['quantity'];

                    // Validate quantity
                    if ($returnQuantity <= 0) {
                        throw new \Exception('Return quantity must be greater than 0');
                    }

                    if ($returnQuantity > $saleItem->quantity) {
                        throw new \Exception("Cannot return more than purchased quantity for item: {$saleItem->product->name}");
                    }

                    // Calculate refund amount for this item
                    $itemTotal = $returnQuantity * $saleItem->unit_price;

                    // Create return item
                    ReturnItem::create([
                        'return_id' => $return->return_id,
                        'sale_item_id' => $saleItem->item_id,
                        'product_id' => $saleItem->product_id,
                        'variant_id' => $saleItem->variant_id,
                        'quantity' => $returnQuantity,
                        'unit_price' => $saleItem->unit_price,
                        'total' => $itemTotal,
                        'reason' => $itemData['reason'] ?? null,
                    ]);

                    // Adjust inventory - add back to stock
                    $this->adjustInventory(
                        $accountId,
                        $sale->branch_id,
                        $saleItem->product_id,
                        $saleItem->variant_id,
                        $returnQuantity,
                        $return->return_id
                    );

                    $totalAmount += $itemTotal;
                }

                // Update return totals
                $taxRate = $sale->tax_amount > 0 ? ($sale->tax_amount / $sale->subtotal) : 0;
                $return->subtotal = $totalAmount;
                $return->tax_amount = $totalAmount * $taxRate;
                $return->total = $totalAmount + $return->tax_amount;
                $return->save();

                // Create refunds matching original payment methods
                $this->createRefunds($return, $sale);

                // Queue fiscal print job if requested (using bridge system like sales)
                if ($useFiscalPrinter) {
                    $config = FiscalPrinterConfig::where('account_id', $accountId)
                        ->where('is_active', true)
                        ->first();

                    if ($config) {
                        // Validate that original sale has fiscal_document_id (required for Caspos returns)
                        if ($config->provider === 'caspos' && !$sale->fiscal_document_id) {
                            Log::warning('Cannot create fiscal return: original sale has no fiscal_document_id', [
                                'return_id' => $return->return_id,
                                'sale_id' => $sale->sale_id,
                                'sale_fiscal_number' => $sale->fiscal_number,
                            ]);
                            // Don't fail the return, just skip fiscal printing
                        } else {
                            try {
                                // Get formatted request data for bridge
                                $requestData = $this->fiscalPrinterService->getFormattedReturnRequestData($config, $return);

                            // Create job for bridge to pick up
                            FiscalPrinterJob::create([
                                'account_id' => $accountId,
                                'sale_id' => $return->sale_id,
                                'return_id' => $return->return_id,
                                'status' => FiscalPrinterJob::STATUS_PENDING,
                                'request_data' => $requestData,
                                'provider' => $config->provider,
                            ]);

                            Log::info('Fiscal print job queued for return', [
                                'return_id' => $return->return_id,
                                'sale_id' => $return->sale_id,
                                'account_id' => $accountId,
                            ]);
                            } catch (\Exception $e) {
                                Log::warning('Failed to queue fiscal print job for return', [
                                    'return_id' => $return->return_id,
                                    'error' => $e->getMessage(),
                                ]);
                                // Don't fail the entire return if fiscal printer job fails
                            }
                        }
                    } else {
                        Log::warning('Fiscal printer config not found for return', [
                            'return_id' => $return->return_id,
                            'account_id' => $accountId,
                        ]);
                    }
                }

                return [
                    'success' => true,
                    'return' => $return->load(['items.product', 'refunds', 'sale']),
                    'message' => 'Qaytarma uğurla tamamlandı',
                ];
            });
        } catch (\Exception $e) {
            Log::error('Return processing failed', [
                'account_id' => $accountId,
                'sale_id' => $saleId,
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
     * Adjust inventory for returned items - ADD STOCK BACK to warehouse
     */
    protected function adjustInventory(
        int $accountId,
        int $branchId,
        int $productId,
        ?int $variantId,
        float $quantity,
        int $returnId
    ): void {
        // Get the branch and its accessible warehouses (same logic as POS sale)
        $branch = Branch::find($branchId);

        if (!$branch) {
            Log::warning('Branch not found for return stock adjustment', [
                'branch_id' => $branchId,
                'return_id' => $returnId,
            ]);
            return;
        }

        // Get the first warehouse that the branch can modify stock for
        $warehouse = $branch->warehouses()
            ->wherePivot('can_modify_stock', true)
            ->first();

        // If no accessible warehouse with modify permissions, fall back to main warehouse
        if (!$warehouse) {
            $warehouse = Warehouse::where('account_id', $accountId)
                ->where('type', 'main')
                ->first();
        }

        if ($warehouse) {
            // Get or create product stock record
            $productStock = ProductStock::firstOrCreate([
                'product_id' => $productId,
                'variant_id' => $variantId,
                'warehouse_id' => $warehouse->id,
                'account_id' => $accountId,
            ], [
                'quantity' => 0,
                'min_level' => 3,
            ]);

            // INCREMENT stock (opposite of sale which decrements)
            $productStock->increment('quantity', $quantity);

            // Create stock movement record for audit trail
            StockMovement::create([
                'account_id' => $accountId,
                'warehouse_id' => $warehouse->id,
                'product_id' => $productId,
                'variant_id' => $variantId,
                'movement_type' => 'daxil_olma', // incoming (opposite of 'xaric_olma')
                'quantity' => $quantity, // positive quantity for incoming
                'reference_type' => 'return',
                'reference_id' => $returnId,
                'notes' => "Mal qaytarma RET{$returnId} - anbara qaytarılma",
            ]);

            Log::info('Stock adjusted for return', [
                'return_id' => $returnId,
                'product_id' => $productId,
                'variant_id' => $variantId,
                'warehouse_id' => $warehouse->id,
                'quantity_added' => $quantity,
            ]);
        } else {
            Log::warning('No warehouse found for return stock adjustment', [
                'account_id' => $accountId,
                'branch_id' => $branchId,
                'return_id' => $returnId,
            ]);
        }
    }

    /**
     * Create refunds matching original payment methods
     */
    protected function createRefunds(SaleReturn $return, Sale $sale): void
    {
        $refundAmount = $return->total;
        $remainingRefund = $refundAmount;

        // Get original payments
        $payments = $sale->payments()->get();

        if ($payments->isEmpty()) {
            // No payments recorded, refund as cash
            Refund::create([
                'return_id' => $return->return_id,
                'payment_id' => null,
                'method' => 'nağd',
                'amount' => $refundAmount,
                'notes' => 'Nağd geri ödəniş',
            ]);
            return;
        }

        // Calculate proportional refunds based on original payment methods
        $totalPaid = $payments->sum('amount');

        foreach ($payments as $payment) {
            if ($remainingRefund <= 0) break;

            // Calculate proportional refund for this payment method
            $proportion = $payment->amount / $totalPaid;
            $refundForThisPayment = min($refundAmount * $proportion, $remainingRefund);

            Refund::create([
                'return_id' => $return->return_id,
                'payment_id' => $payment->payment_id,
                'method' => $payment->method,
                'amount' => round($refundForThisPayment, 2),
                'transaction_id' => $payment->transaction_id,
                'reference_number' => $payment->reference_number,
                'notes' => "Orijinal ödənişə geri qaytarma #{$payment->payment_id}",
            ]);

            $remainingRefund -= $refundForThisPayment;
        }

        // Handle any remaining amount due to rounding
        if ($remainingRefund > 0.01) {
            $firstPayment = $payments->first();
            Refund::create([
                'return_id' => $return->return_id,
                'payment_id' => $firstPayment->payment_id,
                'method' => $firstPayment->method,
                'amount' => round($remainingRefund, 2),
                'notes' => 'Yuvarlaqlaşdırma fərqi',
            ]);
        }
    }

    /**
     * Get return statistics for an account
     */
    public function getStatistics(int $accountId, ?string $startDate = null, ?string $endDate = null): array
    {
        $query = SaleReturn::where('account_id', $accountId);

        if ($startDate) {
            $query->where('return_date', '>=', $startDate);
        }

        if ($endDate) {
            $query->where('return_date', '<=', $endDate);
        }

        $totalReturns = $query->count();
        $totalAmount = $query->sum('total');
        $todayReturns = SaleReturn::where('account_id', $accountId)
            ->whereDate('return_date', today())
            ->count();
        $todayAmount = SaleReturn::where('account_id', $accountId)
            ->whereDate('return_date', today())
            ->sum('total');

        return [
            'total_returns' => $totalReturns,
            'total_amount' => $totalAmount,
            'today_returns' => $todayReturns,
            'today_amount' => $todayAmount,
        ];
    }
}
