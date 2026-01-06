<?php

namespace App\Imports;

use App\Models\Product;
use App\Models\Warehouse;
use App\Models\ProductStock;
use App\Models\StockHistory;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Maatwebsite\Excel\Validators\Failure;

class StockImport implements ToCollection, WithHeadingRow, SkipsEmptyRows, SkipsOnFailure, WithChunkReading
{
    protected $accountId;
    protected $errors = [];
    protected $successCount = 0;
    protected $skipCount = 0;
    protected $startTime;
    protected $maxExecutionTime = 1800; // 30 minutes
    protected $productsCache = [];
    protected $warehousesCache = [];
    protected $cacheInitialized = false;
    protected $timeoutErrorAdded = false;
    protected $importJob = null;
    protected $processedRowsCount = 0;
    protected $userId = null;

    public function __construct($accountId, $importJob = null)
    {
        $this->accountId = $accountId;
        $this->importJob = $importJob;
        $this->userId = $importJob?->user_id; // Get user_id from import job
        $this->startTime = time();
    }

    /**
     * Cache existing products and warehouses to reduce database queries
     */
    protected function initializeCache()
    {
        if ($this->cacheInitialized) {
            return;
        }

        DB::statement('SET SESSION TRANSACTION ISOLATION LEVEL READ UNCOMMITTED');

        try {
            // Cache all products by SKU and barcode for quick lookup
            $products = Product::where('account_id', $this->accountId)
                ->select('id', 'sku', 'barcode', 'name', 'purchase_price')
                ->get();

            foreach ($products as $product) {
                if (!empty($product->sku)) {
                    $this->productsCache['sku'][$product->sku] = $product;
                }
                if (!empty($product->barcode)) {
                    $this->productsCache['barcode'][$product->barcode] = $product;
                }
            }

            // Cache all warehouses by name
            $warehouses = Warehouse::where('account_id', $this->accountId)
                ->where('is_active', true)
                ->select('id', 'name')
                ->get();

            foreach ($warehouses as $warehouse) {
                $this->warehousesCache[strtolower(trim($warehouse->name))] = $warehouse;
            }
        } finally {
            DB::statement('SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ');
        }

        $this->cacheInitialized = true;
    }

    /**
     * @param Collection $rows
     */
    public function collection(Collection $rows)
    {
        // Initialize cache once for all rows
        $cacheStart = microtime(true);
        $this->initializeCache();
        $cacheTime = microtime(true) - $cacheStart;
        \Log::info("Stock import cache initialization took: " . number_format($cacheTime, 2) . " seconds");

        $rowProcessingTimes = [];

        // Wrap the entire chunk in a transaction
        DB::transaction(function () use ($rows, &$rowProcessingTimes) {
            foreach ($rows as $index => $row) {
                $rowStart = microtime(true);

                // Check timeout
                if (time() - $this->startTime > $this->maxExecutionTime) {
                    if (!$this->timeoutErrorAdded) {
                        $this->errors[] = [
                            'row' => 'N/A',
                            'message' => 'Import zamanı limit keçildi. Fayl çox böyükdür, kiçik fayllara bölərək yenidən cəhd edin.',
                            'data' => []
                        ];
                        $this->timeoutErrorAdded = true;
                    }
                    break;
                }

                $rowNumber = $index + 2; // +2 because Excel starts at 1 and we have header row

                try {
                    $this->processRow($row, $rowNumber);
                } catch (\Illuminate\Database\QueryException $e) {
                    $message = $this->formatDatabaseError($e, $row);
                    $this->errors[] = [
                        'row' => $rowNumber,
                        'message' => $message,
                        'data' => $row->toArray()
                    ];
                    $this->skipCount++;
                } catch (\Exception $e) {
                    $this->errors[] = [
                        'row' => $rowNumber,
                        'message' => $e->getMessage(),
                        'data' => $row->toArray()
                    ];
                    $this->skipCount++;
                }

                $rowTime = microtime(true) - $rowStart;
                $rowProcessingTimes[] = $rowTime;
                $this->processedRowsCount++;
            }
        });

        // Log performance stats
        if (count($rowProcessingTimes) > 0) {
            $avgTime = array_sum($rowProcessingTimes) / count($rowProcessingTimes);
            $maxTime = max($rowProcessingTimes);
            \Log::info("Stock import row processing stats - Avg: " . number_format($avgTime, 3) . "s, Max: " . number_format($maxTime, 3) . "s, Total rows: " . count($rowProcessingTimes));
        }

        // Update progress in the import job after each chunk
        if ($this->importJob) {
            $this->importJob->updateProgress(
                $this->processedRowsCount,
                $this->successCount,
                count($this->errors),
                $this->errors
            );
        }

        // Small delay between chunks to prevent blocking
        usleep(100000); // 100ms delay
    }

    protected function processRow($row, $rowNumber)
    {
        // Convert barcode to string if it's a number
        if (isset($row['barcode']) && is_numeric($row['barcode'])) {
            $row['barcode'] = (string) $row['barcode'];
        }

        // Validate required fields
        $validator = Validator::make($row->toArray(), [
            'sku' => 'required_without:barcode|nullable|string|max:100',
            'barcode' => 'required_without:sku|nullable|string|max:100',
            'product_name' => 'nullable|string|max:255', // Optional - for user reference only
            'warehouse_name' => 'required|string|max:255',
            'quantity' => 'required|numeric|min:0',
            'unit_cost' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            throw new \Exception("Validasiya uğursuz: " . implode(', ', $validator->errors()->all()));
        }

        // Find product by barcode (PRIMARY) or SKU (fallback)
        $product = null;

        // Priority 1: Search by barcode (PRIMARY identifier)
        if (!empty($row['barcode'])) {
            $product = $this->productsCache['barcode'][$row['barcode']] ?? null;
            if (!$product) {
                throw new \Exception("XƏTA: Barkod '{$row['barcode']}' olan məhsul sistemdə tapılmadı. Məhsulun barkodu düzgün olduğuna əmin olun.");
            }
        }
        // Priority 2: If no barcode, try SKU (only if product has no barcode)
        elseif (!empty($row['sku'])) {
            $product = $this->productsCache['sku'][$row['sku']] ?? null;
            if (!$product) {
                throw new \Exception("XƏTA: SKU '{$row['sku']}' olan məhsul tapılmadı. Barkod istifadə etmək tövsiyə olunur.");
            }
        }
        // Neither barcode nor SKU provided
        else {
            throw new \Exception("XƏTA: Barkod və ya SKU daxil edilməlidir. QEYD: Barkod istifadə etmək ƏSASdır!");
        }

        // Find warehouse by name (case-insensitive)
        $warehouseName = strtolower(trim($row['warehouse_name']));
        $warehouse = $this->warehousesCache[$warehouseName] ?? null;
        if (!$warehouse) {
            throw new \Exception("Anbar '{$row['warehouse_name']}' tapılmadı");
        }

        $quantity = (float) $row['quantity'];
        $unitCost = isset($row['unit_cost']) ? (float) $row['unit_cost'] : $product->purchase_price;
        $notes = $row['notes'] ?? 'Başlanğıc qalıq - import';

        // Get or create ProductStock entry
        $productStock = ProductStock::firstOrCreate(
            [
                'account_id' => $this->accountId,
                'product_id' => $product->id,
                'variant_id' => null, // Initial stock import doesn't handle variants yet
                'warehouse_id' => $warehouse->id,
            ],
            [
                'quantity' => 0,
                'reserved_quantity' => 0,
                'min_level' => 3,
                'max_level' => null,
                'reorder_point' => null,
                'reorder_quantity' => null,
                'location' => null,
            ]
        );

        // Store old quantity for history
        $quantityBefore = $productStock->quantity;
        $quantityAfter = $quantityBefore + $quantity;

        // Update stock quantity
        $productStock->quantity = $quantityAfter;
        $productStock->save();

        // Create StockHistory entry for audit trail
        StockHistory::create([
            'account_id' => $this->accountId,
            'product_id' => $product->id,
            'variant_id' => null,
            'warehouse_id' => $warehouse->id,
            'quantity_before' => $quantityBefore,
            'quantity_change' => $quantity,
            'quantity_after' => $quantityAfter,
            'type' => 'duzelis_artim', // Adjustment increase - used for initial stock import
            'reference_type' => 'import',
            'reference_id' => $this->importJob?->id,
            'user_id' => $this->userId, // Use stored user_id from import job
            'notes' => 'BAŞLANĞIC QALIQ: ' . $notes, // Prefix to identify initial stock
            'occurred_at' => now(),
        ]);

        $this->successCount++;
    }

    public function onFailure(Failure ...$failures)
    {
        foreach ($failures as $failure) {
            $this->errors[] = [
                'row' => $failure->row(),
                'attribute' => $failure->attribute(),
                'errors' => $failure->errors(),
                'values' => $failure->values()
            ];
        }
    }

    public function getErrors()
    {
        return $this->errors;
    }

    public function getSuccessCount()
    {
        return $this->successCount;
    }

    public function getSkipCount()
    {
        return $this->skipCount;
    }

    public function getSummary()
    {
        return [
            'success' => $this->successCount,
            'skipped' => $this->skipCount,
            'errors' => count($this->errors),
            'error_details' => $this->errors
        ];
    }

    /**
     * Format database errors into user-friendly messages
     */
    protected function formatDatabaseError(\Illuminate\Database\QueryException $e, $row): string
    {
        $errorCode = $e->errorInfo[1] ?? null;
        $errorMessage = $e->getMessage();

        // Handle duplicate entry errors
        if ($errorCode === 1062 || str_contains($errorMessage, 'Duplicate entry')) {
            return "Dublikat məlumat: Bu qalıq artıq mövcuddur";
        }

        // Handle foreign key constraint errors
        if ($errorCode === 1452 || str_contains($errorMessage, 'foreign key constraint')) {
            if (str_contains($errorMessage, 'product')) {
                return "Məhsul tapılmadı";
            }
            if (str_contains($errorMessage, 'warehouse')) {
                return "Anbar tapılmadı";
            }
            return "Əlaqəli məlumat tapılmadı";
        }

        // Handle other common database errors
        if ($errorCode === 1406 || str_contains($errorMessage, 'Data too long')) {
            return "Məlumat çox uzundur. Xahiş edirik qısa mətn daxil edin";
        }

        // Log and return generic message
        \Log::error('Stock import database error: ' . $errorMessage, [
            'row' => $row->toArray(),
            'error_code' => $errorCode
        ]);

        return "Qalıq əlavə edilərkən xəta baş verdi. Məlumatları yoxlayın";
    }

    /**
     * Process file in chunks of 50 rows
     */
    public function chunkSize(): int
    {
        return 50;
    }
}
