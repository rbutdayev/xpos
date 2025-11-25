<?php

namespace App\Imports;

use App\Models\Product;
use App\Models\Category;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Validator;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Maatwebsite\Excel\Validators\Failure;

class ProductsImport implements ToCollection, WithHeadingRow, SkipsEmptyRows, SkipsOnFailure
{
    protected $accountId;
    protected $errors = [];
    protected $successCount = 0;
    protected $skipCount = 0;

    public function __construct($accountId)
    {
        $this->accountId = $accountId;
    }

    /**
     * @param Collection $rows
     */
    public function collection(Collection $rows)
    {
        foreach ($rows as $index => $row) {
            $rowNumber = $index + 2; // +2 because Excel starts at 1 and we have header row

            try {
                $this->processRow($row, $rowNumber);
            } catch (\Exception $e) {
                $this->errors[] = [
                    'row' => $rowNumber,
                    'message' => $e->getMessage(),
                    'data' => $row->toArray()
                ];
                $this->skipCount++;
            }
        }
    }

    protected function processRow($row, $rowNumber)
    {
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

        // Check if product with same barcode already exists (if barcode provided)
        if (!empty($row['barcode'])) {
            $exists = Product::where('account_id', $this->accountId)
                ->where('barcode', $row['barcode'])
                ->exists();

            if ($exists) {
                throw new \Exception("Product with barcode '{$row['barcode']}' already exists");
            }
        }

        // Check if product with same SKU already exists (if SKU provided)
        if (!empty($row['sku'])) {
            $exists = Product::where('account_id', $this->accountId)
                ->where('sku', $row['sku'])
                ->exists();

            if ($exists) {
                throw new \Exception("Product with SKU '{$row['sku']}' already exists");
            }
        }

        // Find or skip if category doesn't exist
        $categoryId = null;
        if (!empty($row['category_name'])) {
            $category = Category::where('account_id', $this->accountId)
                ->where('name', $row['category_name'])
                ->first();

            if ($category) {
                $categoryId = $category->id;
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
}
