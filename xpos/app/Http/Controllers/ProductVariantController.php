<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ProductVariantController extends Controller
{
    /**
     * Get account ID from authenticated user
     * CRITICAL: Use in every method for multi-tenant safety
     */
    protected function getAccountId(): int
    {
        return auth()->user()->account_id;
    }

    /**
     * Display variants for a specific product
     *
     * @param Product $product
     * @return Response
     */
    public function index(Product $product): Response
    {
        $accountId = $this->getAccountId();

        // CRITICAL: Verify product belongs to account
        if ($product->account_id !== $accountId) {
            abort(403, 'Unauthorized access to product');
        }

        // Get variants with stock information
        $variants = ProductVariant::where('account_id', $accountId)
            ->where('product_id', $product->id)
            ->with(['stock' => function($query) use ($accountId) {
                $query->where('account_id', $accountId);
            }])
            ->orderBy('size')
            ->orderBy('color')
            ->get()
            ->map(function($variant) {
                return [
                    'id' => $variant->id,
                    'sku' => $variant->sku,
                    'barcode' => $variant->barcode,
                    'size' => $variant->size,
                    'color' => $variant->color,
                    'color_code' => $variant->color_code,
                    'pattern' => $variant->pattern,
                    'fit' => $variant->fit,
                    'material' => $variant->material,
                    'price_adjustment' => $variant->price_adjustment,
                    'final_price' => $variant->final_price,
                    'display_name' => $variant->display_name,
                    'is_active' => $variant->is_active,
                    'total_stock' => $variant->getTotalStock(),
                ];
            });

        return Inertia::render('Products/Variants/Index', [
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'sale_price' => $product->sale_price,
            ],
            'variants' => $variants,
        ]);
    }

    /**
     * Store new variant(s) for a product
     * Supports single variant or bulk creation
     *
     * @param Request $request
     * @param Product $product
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request, Product $product)
    {
        $accountId = $this->getAccountId();

        // CRITICAL: Verify product belongs to account
        if ($product->account_id !== $accountId) {
            abort(403, 'Unauthorized access to product');
        }

        // Validate request
        $validated = $request->validate([
            'variants' => 'required|array|min:1',
            'variants.*.size' => 'nullable|string|max:50',
            'variants.*.color' => 'nullable|string|max:50',
            'variants.*.color_code' => 'nullable|string|max:7|regex:/^#[0-9A-Fa-f]{6}$/',
            'variants.*.pattern' => 'nullable|string|max:50',
            'variants.*.fit' => 'nullable|string|max:50',
            'variants.*.material' => 'nullable|string|max:100',
            'variants.*.sku' => [
                'nullable',
                'string',
                'max:100',
                Rule::unique('product_variants', 'sku')
                    ->where('account_id', $accountId)
            ],
            'variants.*.barcode' => [
                'nullable',
                'string',
                'max:100',
                Rule::unique('product_variants', 'barcode')
                    ->where('account_id', $accountId)
            ],
            'variants.*.price_adjustment' => 'nullable|numeric',
        ]);

        DB::beginTransaction();
        try {
            $createdVariants = [];

            foreach ($validated['variants'] as $variantData) {
                // Check if variant already exists (by size + color)
                $existing = ProductVariant::where('account_id', $accountId)
                    ->where('product_id', $product->id)
                    ->where('size', $variantData['size'] ?? null)
                    ->where('color', $variantData['color'] ?? null)
                    ->first();

                if ($existing) {
                    continue; // Skip duplicates
                }

                $variant = ProductVariant::create([
                    'account_id' => $accountId,
                    'product_id' => $product->id,
                    'size' => $variantData['size'] ?? null,
                    'color' => $variantData['color'] ?? null,
                    'color_code' => $variantData['color_code'] ?? null,
                    'pattern' => $variantData['pattern'] ?? null,
                    'fit' => $variantData['fit'] ?? null,
                    'material' => $variantData['material'] ?? null,
                    'sku' => $variantData['sku'] ?? null,
                    'barcode' => $variantData['barcode'] ?? null,
                    'price_adjustment' => $variantData['price_adjustment'] ?? 0,
                    'is_active' => true,
                ]);

                $createdVariants[] = $variant;
            }

            DB::commit();

            return response()->json([
                'message' => count($createdVariants) . ' variant(s) created successfully',
                'variants' => $createdVariants,
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to create variants',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update a specific variant
     *
     * @param Request $request
     * @param int $variantId
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, int $variantId)
    {
        $accountId = $this->getAccountId();

        // CRITICAL: Get variant scoped by account
        $variant = ProductVariant::where('account_id', $accountId)
            ->where('id', $variantId)
            ->firstOrFail();

        // Validate request
        $validated = $request->validate([
            'size' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:50',
            'color_code' => 'nullable|string|max:7|regex:/^#[0-9A-Fa-f]{6}$/',
            'pattern' => 'nullable|string|max:50',
            'fit' => 'nullable|string|max:50',
            'material' => 'nullable|string|max:100',
            'sku' => [
                'nullable',
                'string',
                'max:100',
                Rule::unique('product_variants', 'sku')
                    ->where('account_id', $accountId)
                    ->ignore($variant->id)
            ],
            'barcode' => [
                'nullable',
                'string',
                'max:100',
                Rule::unique('product_variants', 'barcode')
                    ->where('account_id', $accountId)
                    ->ignore($variant->id)
            ],
            'price_adjustment' => 'nullable|numeric',
            'is_active' => 'nullable|boolean',
        ]);

        $variant->update($validated);

        return response()->json([
            'message' => 'Variant updated successfully',
            'variant' => $variant->fresh(),
        ]);
    }

    /**
     * Delete a variant (soft delete)
     *
     * @param int $variantId
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(int $variantId)
    {
        $accountId = $this->getAccountId();

        // CRITICAL: Get variant scoped by account
        $variant = ProductVariant::where('account_id', $accountId)
            ->where('id', $variantId)
            ->firstOrFail();

        // Check if variant has stock
        $totalStock = $variant->getTotalStock();
        if ($totalStock > 0) {
            return response()->json([
                'message' => 'Cannot delete variant with existing stock',
                'stock' => $totalStock,
            ], 422);
        }

        $variant->delete(); // Soft delete

        return response()->json([
            'message' => 'Variant deleted successfully',
        ]);
    }

    /**
     * Generate barcodes for variants that don't have one
     *
     * @param Product $product
     * @return \Illuminate\Http\JsonResponse
     */
    public function generateBarcodes(Product $product)
    {
        $accountId = $this->getAccountId();

        // CRITICAL: Verify product belongs to account
        if ($product->account_id !== $accountId) {
            abort(403, 'Unauthorized access to product');
        }

        // Get variants without barcodes
        $variants = ProductVariant::where('account_id', $accountId)
            ->where('product_id', $product->id)
            ->whereNull('barcode')
            ->get();

        if ($variants->isEmpty()) {
            return response()->json([
                'message' => 'All variants already have barcodes',
                'count' => 0,
            ]);
        }

        DB::beginTransaction();
        try {
            $updated = 0;

            foreach ($variants as $variant) {
                // Generate unique barcode (EAN-13 format or custom)
                $barcode = $this->generateUniqueBarcode($accountId);

                $variant->update(['barcode' => $barcode]);
                $updated++;
            }

            DB::commit();

            return response()->json([
                'message' => "Barcodes generated for {$updated} variant(s)",
                'count' => $updated,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to generate barcodes',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Generate a unique barcode for the account
     * Format: Account-scoped EAN-13 compatible
     *
     * @param int $accountId
     * @return string
     */
    protected function generateUniqueBarcode(int $accountId): string
    {
        do {
            // Generate 12-digit number (EAN-13 without check digit)
            $barcode = str_pad($accountId, 3, '0', STR_PAD_LEFT)
                     . str_pad(mt_rand(0, 999999999), 9, '0', STR_PAD_LEFT);

            // Check if barcode exists in this account
            $exists = ProductVariant::where('account_id', $accountId)
                ->where('barcode', $barcode)
                ->exists();

        } while ($exists);

        return $barcode;
    }

    /**
     * Toggle variant active status
     *
     * @param int $variantId
     * @return \Illuminate\Http\JsonResponse
     */
    public function toggleStatus(int $variantId)
    {
        $accountId = $this->getAccountId();

        // CRITICAL: Get variant scoped by account
        $variant = ProductVariant::where('account_id', $accountId)
            ->where('id', $variantId)
            ->firstOrFail();

        $variant->update([
            'is_active' => !$variant->is_active,
        ]);

        return response()->json([
            'message' => 'Variant status updated',
            'variant' => $variant->fresh(),
        ]);
    }
}
