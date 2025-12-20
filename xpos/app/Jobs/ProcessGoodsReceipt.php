<?php

namespace App\Jobs;

use App\Models\AsyncJob;
use App\Models\GoodsReceipt;
use App\Models\GoodsReceiptItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\ProductStock;
use App\Models\StockMovement;
use App\Models\StockHistory;
use App\Services\DocumentUploadService;
use App\Services\DashboardService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class ProcessGoodsReceipt implements ShouldQueue
{
    use Queueable, InteractsWithQueue, SerializesModels;

    public $timeout = 300; // 5 minutes
    public $tries = 1; // Don't retry - track status manually

    private AsyncJob $asyncJob;
    private ?string $documentTempPath;

    /**
     * Create a new job instance.
     */
    public function __construct(
        AsyncJob $asyncJob,
        ?string $documentTempPath = null
    ) {
        $this->asyncJob = $asyncJob;
        $this->documentTempPath = $documentTempPath;
    }

    /**
     * Execute the job.
     */
    public function handle(DocumentUploadService $documentService, DashboardService $dashboardService): void
    {
        $this->asyncJob->markAsStarted('Mal qəbulu emal edilir...');

        $data = $this->asyncJob->input_data;
        $accountId = $this->asyncJob->account_id;
        $userId = $this->asyncJob->user_id;

        try {
            DB::beginTransaction();

            // Determine if this is a draft or completed receipt
            $status = $data['status'] ?? 'completed';
            $isDraft = $status === 'draft';

            $invoiceNumber = $data['invoice_number'] ?? null;
            $totalCost = 0;
            $items = [];

            // Validate and prepare all items first
            foreach ($data['products'] as $productData) {
                // Validate variant belongs to product and account if provided
                if (!empty($productData['variant_id'])) {
                    $variant = ProductVariant::where('id', $productData['variant_id'])
                        ->where('account_id', $accountId)
                        ->where('product_id', $productData['product_id'])
                        ->first();

                    if (!$variant) {
                        throw new \Exception('Seçilmiş variant bu məhsula aid deyil və ya mövcud deyil');
                    }
                }

                // Determine the quantity to use for inventory tracking
                $inventoryQuantity = $productData['base_quantity'] ?: $productData['quantity'];

                // Get the product to access its prices
                $product = Product::find($productData['product_id']);

                // Calculate costs with per-product discount
                $unitCost = !empty($productData['unit_cost']) ? $productData['unit_cost'] : ($product->purchase_price ?? 0);
                $discountPercent = floatval($productData['discount_percent'] ?? 0);
                $itemSubtotal = $unitCost * $inventoryQuantity;
                $itemDiscountAmount = ($itemSubtotal * $discountPercent) / 100;
                $itemFinalTotal = $itemSubtotal - $itemDiscountAmount;

                $totalCost += $itemFinalTotal;

                $items[] = [
                    'product_id' => $productData['product_id'],
                    'variant_id' => $productData['variant_id'] ?? null,
                    'quantity' => $inventoryQuantity,
                    'unit' => $productData['receiving_unit'] ?: $productData['unit'],
                    'unit_cost' => $unitCost,
                    'total_cost' => $itemFinalTotal,
                    'discount_percent' => $discountPercent,
                    'sale_price' => $productData['sale_price'] ?? null,
                    'additional_data' => [
                        'received_quantity' => $productData['quantity'],
                        'received_unit' => $productData['receiving_unit'],
                        'base_quantity' => $inventoryQuantity,
                        'base_unit' => $productData['unit'],
                        'subtotal_before_discount' => $itemSubtotal,
                        'discount_percent' => $discountPercent,
                        'discount_amount' => $itemDiscountAmount,
                    ],
                    'product' => $product,
                ];
            }

            // Create ONE goods receipt for the entire transaction
            $goodsReceipt = new GoodsReceipt();
            $goodsReceipt->account_id = $accountId;
            $goodsReceipt->warehouse_id = $data['warehouse_id'];
            $goodsReceipt->supplier_id = $data['supplier_id'] ?? null;
            $goodsReceipt->employee_id = $userId;
            $goodsReceipt->invoice_number = $invoiceNumber;
            $goodsReceipt->total_cost = sprintf('%.2f', $totalCost);
            $goodsReceipt->status = $status;
            $goodsReceipt->notes = $data['notes'] ?? null;

            // Handle document upload from temp path
            if ($this->documentTempPath && Storage::disk('local')->exists($this->documentTempPath)) {
                $tempFile = Storage::disk('local')->path($this->documentTempPath);
                $uploadedFile = new \Illuminate\Http\UploadedFile(
                    $tempFile,
                    basename($this->documentTempPath),
                    Storage::disk('local')->mimeType($this->documentTempPath),
                    null,
                    true
                );
                $documentPath = $documentService->uploadGoodsReceiptDocument($uploadedFile, 'qaimə');
                $goodsReceipt->document_path = $documentPath;
            }

            $goodsReceipt->save();

            // Create goods receipt items
            foreach ($items as $itemData) {
                GoodsReceiptItem::create([
                    'goods_receipt_id' => $goodsReceipt->id,
                    'account_id' => $accountId,
                    'product_id' => $itemData['product_id'],
                    'variant_id' => $itemData['variant_id'],
                    'quantity' => $itemData['quantity'],
                    'unit' => $itemData['unit'],
                    'unit_cost' => $itemData['unit_cost'],
                    'total_cost' => $itemData['total_cost'],
                    'discount_percent' => $itemData['discount_percent'],
                    'additional_data' => $itemData['additional_data'],
                ]);

                // Skip stock and price updates for drafts
                if ($isDraft) {
                    continue;
                }

                // Update product prices
                if (!empty($itemData['unit_cost'])) {
                    $itemData['product']->purchase_price = $itemData['unit_cost'];
                    $itemData['product']->save();
                }

                if (!empty($itemData['sale_price'])) {
                    $itemData['product']->sale_price = $itemData['sale_price'];
                    $itemData['product']->save();
                }

                // Create stock movement
                $stockMovement = new StockMovement();
                $stockMovement->account_id = $accountId;
                $stockMovement->warehouse_id = $data['warehouse_id'];
                $stockMovement->product_id = $itemData['product_id'];
                $stockMovement->variant_id = $itemData['variant_id'];
                $stockMovement->movement_type = 'daxil_olma';
                $stockMovement->quantity = $itemData['quantity'];
                $stockMovement->unit_cost = $itemData['unit_cost'];
                $stockMovement->reference_type = 'goods_receipt';
                $stockMovement->reference_id = $goodsReceipt->id;
                $stockMovement->employee_id = $userId;
                $stockMovement->notes = "Mal qəbulu: {$goodsReceipt->receipt_number}";
                $stockMovement->save();

                // Update product stock
                $productStock = ProductStock::firstOrCreate(
                    [
                        'product_id' => $itemData['product_id'],
                        'variant_id' => $itemData['variant_id'],
                        'warehouse_id' => $data['warehouse_id'],
                        'account_id' => $accountId,
                    ],
                    [
                        'quantity' => 0,
                        'reserved_quantity' => 0,
                        'min_level' => 3,
                    ]
                );

                $quantityBefore = $productStock->quantity;
                $productStock->increment('quantity', $itemData['quantity']);

                // Create stock history record
                StockHistory::create([
                    'product_id' => $itemData['product_id'],
                    'variant_id' => $itemData['variant_id'],
                    'warehouse_id' => $data['warehouse_id'],
                    'quantity_before' => $quantityBefore,
                    'quantity_change' => $itemData['quantity'],
                    'quantity_after' => $quantityBefore + $itemData['quantity'],
                    'type' => 'daxil_olma',
                    'reference_type' => 'goods_receipt',
                    'reference_id' => $goodsReceipt->id,
                    'user_id' => $userId,
                    'notes' => "Mal qəbulu: {$goodsReceipt->receipt_number}",
                    'occurred_at' => $goodsReceipt->created_at ?? now(),
                ]);
            }

            // Process payment after successful goods receipt creation (skip for drafts)
            if (!$isDraft) {
                $this->processGoodsReceiptPayment($goodsReceipt, $data);
            }

            DB::commit();

            // Clean up temp document
            if ($this->documentTempPath && Storage::disk('local')->exists($this->documentTempPath)) {
                Storage::disk('local')->delete($this->documentTempPath);
            }

            // Clear dashboard cache (only for completed, not drafts)
            if (!$isDraft) {
                $account = \App\Models\Account::find($accountId);
                if ($account) {
                    $dashboardService->clearCache($account);
                }
            }

            $successMessage = $isDraft
                ? 'Mal qəbulu qaralama olaraq saxlanıldı'
                : 'Mal qəbulu uğurla yaradıldı';

            $this->asyncJob->markAsCompleted($successMessage, [
                'receipt_id' => $goodsReceipt->id,
                'receipt_number' => $goodsReceipt->receipt_number,
                'status' => $goodsReceipt->status,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Goods receipt job failed: ' . $e->getMessage(), [
                'async_job_id' => $this->asyncJob->id,
                'exception' => $e->getTraceAsString()
            ]);

            // Clean up temp document on failure
            if ($this->documentTempPath && Storage::disk('local')->exists($this->documentTempPath)) {
                Storage::disk('local')->delete($this->documentTempPath);
            }

            $this->asyncJob->markAsFailed('Mal qəbulu yaradılarkən xəta baş verdi: ' . $e->getMessage());
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('Goods receipt job failed critically: ' . $exception->getMessage(), [
            'async_job_id' => $this->asyncJob->id,
            'exception' => $exception->getTraceAsString()
        ]);

        $this->asyncJob->markAsFailed('Sistem xətası: ' . $exception->getMessage());
    }

    /**
     * Process payment for goods receipt based on payment method
     */
    private function processGoodsReceiptPayment(GoodsReceipt $goodsReceipt, array $data): void
    {
        $accountId = $this->asyncJob->account_id;
        $userId = $this->asyncJob->user_id;

        if (($data['payment_method'] ?? 'credit') === 'credit' && $goodsReceipt->supplier_id) {
            // Calculate due date
            $dueDate = $this->calculateDueDate($goodsReceipt, $data);

            // Create supplier credit
            $supplierCredit = $goodsReceipt->createSupplierCredit();

            $goodsReceipt->update([
                'payment_status' => 'unpaid',
                'payment_method' => 'credit',
                'due_date' => $dueDate,
                'supplier_credit_id' => $supplierCredit->id
            ]);
        } else {
            // For instant payments, create expense record
            if ($goodsReceipt->supplier_id && $goodsReceipt->total_cost > 0) {
                $expenseCategory = \App\Models\ExpenseCategory::where('account_id', $accountId)
                    ->where(function($q) {
                        $q->where('name', 'Mal alışı')
                          ->orWhere('name', 'Təchizatçı ödəməsi');
                    })
                    ->first();

                if (!$expenseCategory) {
                    $expenseCategory = \App\Models\ExpenseCategory::create([
                        'account_id' => $accountId,
                        'name' => 'Mal alışı',
                        'is_active' => true,
                    ]);
                }

                $warehouse = \App\Models\Warehouse::with('branches')->find($goodsReceipt->warehouse_id);
                $branchId = $warehouse->branches->first()?->id
                    ?? \App\Models\Branch::where('account_id', $accountId)->first()?->id;

                if ($branchId) {
                    \App\Models\Expense::create([
                        'account_id' => $accountId,
                        'category_id' => $expenseCategory->category_id,
                        'branch_id' => $branchId,
                        'amount' => $goodsReceipt->total_cost,
                        'description' => "Dərhal ödəniş - Mal qəbulu: {$goodsReceipt->receipt_number}",
                        'expense_date' => now()->format('Y-m-d'),
                        'payment_method' => 'cash',
                        'invoice_number' => $goodsReceipt->receipt_number,
                        'user_id' => $userId,
                        'supplier_id' => $goodsReceipt->supplier_id,
                        'goods_receipt_id' => $goodsReceipt->id,
                        'notes' => "Avtomatik yaradıldı - Dərhal ödəniş",
                    ]);
                }
            }

            $goodsReceipt->update([
                'payment_status' => 'paid',
                'payment_method' => 'instant'
            ]);
        }
    }

    /**
     * Calculate due date for credit payment
     */
    private function calculateDueDate(GoodsReceipt $goodsReceipt, array $data): ?\Carbon\Carbon
    {
        if (!empty($data['use_custom_terms']) && isset($data['custom_payment_terms'])) {
            return now()->addDays($data['custom_payment_terms']);
        }

        return $goodsReceipt->calculateDueDate();
    }
}
