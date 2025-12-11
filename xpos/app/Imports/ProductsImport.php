<?php

namespace App\Imports;

use App\Models\Product;
use App\Models\Category;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Maatwebsite\Excel\Validators\Failure;

class ProductsImport implements ToCollection, WithHeadingRow, SkipsEmptyRows, SkipsOnFailure, WithChunkReading
{
    protected $accountId;
    protected $errors = [];
    protected $successCount = 0;
    protected $skipCount = 0;
    protected $startTime;
    protected $maxExecutionTime = 1800; // 30 minutes for large imports on production
    protected $existingBarcodes = [];
    protected $existingSkus = [];
    protected $categories = [];
    protected $cacheInitialized = false;
    protected $timeoutErrorAdded = false; // Prevent duplicate timeout errors
    protected $importJob = null; // Optional import job for progress tracking
    protected $processedRowsCount = 0; // Track processed rows for progress

    public function __construct($accountId, $importJob = null)
    {
        $this->accountId = $accountId;
        $this->importJob = $importJob;
        $this->startTime = time();
    }

    /**
     * Cache existing products and categories to reduce database queries
     * Uses READ UNCOMMITTED to avoid locking during import
     */
    protected function initializeCache()
    {
        if ($this->cacheInitialized) {
            return;
        }

        // Use READ UNCOMMITTED isolation level to avoid locks during cache initialization
        // This is safe because we only need to check for duplicates, not exact consistency
        DB::statement('SET SESSION TRANSACTION ISOLATION LEVEL READ UNCOMMITTED');

        try {
            // Cache all existing barcodes for this account (optimized with select)
            $this->existingBarcodes = Product::where('account_id', $this->accountId)
                ->whereNotNull('barcode')
                ->select('barcode')
                ->pluck('barcode')
                ->flip()
                ->toArray();

            // Cache all existing SKUs for this account (optimized with select)
            $this->existingSkus = Product::where('account_id', $this->accountId)
                ->whereNotNull('sku')
                ->select('sku')
                ->pluck('sku')
                ->flip()
                ->toArray();

            // Cache all categories for this account
            $this->categories = Category::where('account_id', $this->accountId)
                ->select('id', 'name')
                ->pluck('id', 'name')
                ->toArray();
        } finally {
            // Restore default isolation level
            DB::statement('SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ');
        }

        $this->cacheInitialized = true;
    }

    /**
     * @param Collection $rows
     */
    public function collection(Collection $rows)
    {
        // Initialize cache once for all rows to reduce DB queries
        $cacheStart = microtime(true);
        $this->initializeCache();
        $cacheTime = microtime(true) - $cacheStart;
        \Log::info("Cache initialization took: " . number_format($cacheTime, 2) . " seconds");

        $rowProcessingTimes = [];

        // Wrap the entire chunk in a transaction to reduce lock contention
        DB::transaction(function () use ($rows, &$rowProcessingTimes) {
            foreach ($rows as $index => $row) {
                $rowStart = microtime(true);
                // Check if we're approaching timeout (only add error once)
                if (time() - $this->startTime > $this->maxExecutionTime) {
                    if (!$this->timeoutErrorAdded) {
                        $this->errors[] = [
                            'row' => 'N/A',
                            'message' => 'Import zamanı limit keçildi. Fayl çox böyükdür, kiçik fayllara bölərək yenidən cəhd edin.',
                            'data' => []
                        ];
                        $this->timeoutErrorAdded = true;
                    }
                    break; // Stop processing
                }

                $rowNumber = $index + 2; // +2 because Excel starts at 1 and we have header row

                try {
                    $this->processRow($row, $rowNumber);
                } catch (\Illuminate\Database\QueryException $e) {
                    // Handle database constraint violations with friendly messages
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
            \Log::info("Row processing stats - Avg: " . number_format($avgTime, 3) . "s, Max: " . number_format($maxTime, 3) . "s, Total rows: " . count($rowProcessingTimes));
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

        // Small delay between chunks to allow other database operations to proceed
        // This prevents the import from completely blocking the application
        usleep(100000); // 100ms delay between chunks
    }

    protected function processRow($row, $rowNumber)
    {
        // Convert barcode to string if it's a number (Excel stores barcodes as numbers)
        if (isset($row['barcode']) && is_numeric($row['barcode'])) {
            $row['barcode'] = (string) $row['barcode'];
        }

        // Validate required fields
        $validator = Validator::make($row->toArray(), [
            'name' => 'required|string|max:255',
            'sku' => 'nullable|string|max:100',
            'barcode' => 'nullable|string|max:100',
            'barcode_type' => 'nullable|in:EAN-13,UPC-A,Code-128,QR-Code',
            'category_name' => 'nullable|string|max:255',
            'purchase_price' => 'required|numeric|min:0',
            'sale_price' => 'required|numeric|min:0',
            'unit' => 'nullable|string|max:50',
            'weight' => 'nullable|numeric|min:0',
            'dimensions' => 'nullable|string|max:100',
            'brand' => 'nullable|string|max:255',
            'model' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'packaging_size' => 'nullable|string|max:50',
            'base_unit' => 'nullable|string|max:20',
            'packaging_quantity' => 'nullable|numeric|min:0.01',
        ]);

        if ($validator->fails()) {
            throw new \Exception("Validation failed: " . implode(', ', $validator->errors()->all()));
        }

        // Check if product with same barcode already exists (using cache)
        if (!empty($row['barcode'])) {
            if (isset($this->existingBarcodes[$row['barcode']])) {
                throw new \Exception("Product with barcode '{$row['barcode']}' already exists");
            }
        }

        // Check if product with same SKU already exists (using cache)
        if (!empty($row['sku'])) {
            if (isset($this->existingSkus[$row['sku']])) {
                throw new \Exception("Product with SKU '{$row['sku']}' already exists");
            }
        }

        // Find or create category
        $categoryId = null;
        if (!empty($row['category_name'])) {
            // Check cache first
            if (isset($this->categories[$row['category_name']])) {
                $categoryId = $this->categories[$row['category_name']];
            } else {
                // Category doesn't exist - create it
                $newCategory = Category::create([
                    'account_id' => $this->accountId,
                    'name' => $row['category_name'],
                    'is_active' => true,
                ]);

                // Add to cache for future rows
                $categoryId = $newCategory->id;
                $this->categories[$row['category_name']] = $categoryId;
            }
        }

        // Prepare product data
        $productData = [
            'account_id' => $this->accountId,
            'name' => $row['name'],
            'type' => 'product',
            'sku' => $row['sku'] ?? null,
            'barcode' => $row['barcode'] ?? null,
            'category_id' => $categoryId,
            'description' => $row['description'] ?? null,
            'purchase_price' => $row['purchase_price'],
            'sale_price' => $row['sale_price'],
            'unit' => $row['unit'] ?? 'pcs',
            'base_unit' => $row['base_unit'] ?? $row['unit'] ?? 'pcs',
            'packaging_quantity' => $row['packaging_quantity'] ?? 1,
            'weight' => $row['weight'] ?? null,
            'dimensions' => $row['dimensions'] ?? null,
            'brand' => $row['brand'] ?? null,
            'model' => $row['model'] ?? null,
            'is_active' => isset($row['is_active']) ? filter_var($row['is_active'], FILTER_VALIDATE_BOOLEAN) : true,
            'allow_negative_stock' => isset($row['allow_negative_stock']) ? filter_var($row['allow_negative_stock'], FILTER_VALIDATE_BOOLEAN) : false,
        ];

        // Handle barcode type if barcode is provided
        if (!empty($row['barcode'])) {
            $productData['barcode_type'] = $row['barcode_type'] ?? 'Code-128';
            $productData['has_custom_barcode'] = true;
        } else {
            $productData['has_custom_barcode'] = false;
        }

        // Handle packaging fields
        if (!empty($row['packaging_size'])) {
            $productData['packaging_size'] = $row['packaging_size'];
        }

        // Create the product
        Product::create($productData);

        // Update cache with newly created product to prevent duplicates in same import
        if (!empty($row['barcode'])) {
            $this->existingBarcodes[$row['barcode']] = true;
        }
        if (!empty($row['sku'])) {
            $this->existingSkus[$row['sku']] = true;
        }

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
            // Extract the duplicate value from the error message
            if (preg_match("/Duplicate entry '.*?-(.+?)'/", $errorMessage, $matches)) {
                $duplicateValue = $matches[1];

                // Determine what field is duplicate
                if (str_contains($errorMessage, 'barcode')) {
                    return "Barkod '{$duplicateValue}' artıq mövcuddur";
                } elseif (str_contains($errorMessage, 'sku')) {
                    return "SKU '{$duplicateValue}' artıq mövcuddur";
                }
            }
            return "Dublikat məlumat: Bu məhsul artıq mövcuddur";
        }

        // Handle foreign key constraint errors
        if ($errorCode === 1452 || str_contains($errorMessage, 'foreign key constraint')) {
            if (str_contains($errorMessage, 'category')) {
                return "Kateqoriya mövcud deyil";
            }
            return "Əlaqəli məlumat tapılmadı";
        }

        // Handle other common database errors
        if ($errorCode === 1406 || str_contains($errorMessage, 'Data too long')) {
            return "Məlumat çox uzundur. Xahiş edirik qısa mətn daxil edin";
        }

        // Default: return a generic friendly message (hide SQL details)
        \Log::error('Import database error: ' . $errorMessage, [
            'row' => $row->toArray(),
            'error_code' => $errorCode
        ]);

        return "Məhsul əlavə edilərkən xəta baş verdi. Məlumatları yoxlayın";
    }

    /**
     * Process file in chunks of 50 rows to reduce memory usage and lock duration
     * Smaller chunks mean shorter transactions and less lock contention
     */
    public function chunkSize(): int
    {
        return 50;
    }
}
