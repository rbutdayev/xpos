<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Services\BarcodeService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;

class BarcodeController extends Controller
{
    private BarcodeService $barcodeService;

    public function __construct(BarcodeService $barcodeService)
    {
        $this->middleware('auth');
        $this->middleware('account.access');
        $this->barcodeService = $barcodeService;
    }

    /**
     * Generate barcode image for a product
     */
    public function show(Product $product, Request $request)
    {
        Gate::authorize('access-account-data', $product);

        $format = $request->get('format', 'png');
        $width = (int) $request->get('width', 2);
        $height = (int) $request->get('height', 30);

        // Validate parameters
        if ($width < 1 || $width > 10) {
            return response()->json(['error' => 'Width must be between 1 and 10'], 400);
        }

        if ($height < 10 || $height > 200) {
            return response()->json(['error' => 'Height must be between 10 and 200'], 400);
        }

        if (!in_array($format, ['png', 'svg'])) {
            return response()->json(['error' => 'Format must be either png or svg'], 400);
        }

        try {
            // Generate barcode if missing
            if (!$product->barcode) {
                $this->barcodeService->generateForProduct($product);
                $product->refresh();

                if (!$product->barcode) {
                    return response()->json(['error' => 'Failed to generate barcode for product'], 500);
                }
            }

            if ($format === 'svg') {
                $barcode = $this->barcodeService->generateSVG(
                    $product->barcode,
                    $product->barcode_type,
                    $width,
                    $height
                );

                return response($barcode)
                    ->header('Content-Type', 'image/svg+xml')
                    ->header('Cache-Control', 'public, max-age=3600');
            } else {
                $barcode = $this->barcodeService->generatePNG(
                    $product->barcode,
                    $product->barcode_type,
                    $width,
                    $height
                );

                return response(base64_decode($barcode))
                    ->header('Content-Type', 'image/png')
                    ->header('Cache-Control', 'public, max-age=3600');
            }
        } catch (\InvalidArgumentException $e) {
            return response()->json(['error' => 'Invalid barcode data: ' . $e->getMessage()], 400);
        } catch (\Exception $e) {
            \Log::error('Barcode generation failed', [
                'product_id' => $product->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['error' => 'Failed to generate barcode image'], 500);
        }
    }

    /**
     * Show printable barcode page
     */
    public function print(Product $product)
    {
        Gate::authorize('access-account-data', $product);

        try {
            // Generate barcode if missing
            if (!$product->barcode) {
                $this->barcodeService->generateForProduct($product);
                $product->refresh();

                if (!$product->barcode) {
                    return back()->with('error', __('Failed to generate barcode. Please try again.'));
                }
            }

            $printData = [
                'product' => $product,
                'barcode_url' => route('barcodes.show', ['product' => $product->id, 'format' => 'png', 'width' => 3, 'height' => 60]),
                'generated_at' => now()->format('d.m.Y H:i'),
            ];

            return view('barcode.print', $printData);
        } catch (\Exception $e) {
            \Log::error('Barcode print page generation failed', [
                'product_id' => $product->id,
                'error' => $e->getMessage(),
            ]);
            return back()->with('error', __('Failed to generate barcode print page. Please try again.'));
        }
    }

    /**
     * Generate barcode for product if missing
     */
    public function generate(Product $product)
    {
        Gate::authorize('access-account-data', $product);

        try {
            // Check if product already has a non-custom barcode
            if ($product->barcode && !$product->has_custom_barcode) {
                return response()->json([
                    'barcode' => $product->barcode,
                    'message' => __('Product already has a barcode'),
                ], 200);
            }

            $barcode = $this->barcodeService->generateForProduct($product);

            if (!$barcode) {
                return response()->json([
                    'error' => __('Failed to generate barcode'),
                ], 500);
            }

            // Refresh product to get updated barcode
            $product->refresh();

            return response()->json([
                'barcode' => $barcode,
                'barcode_type' => $product->barcode_type,
                'message' => __('Barcode generated successfully'),
            ], 201);
        } catch (\Exception $e) {
            \Log::error('Barcode generation failed', [
                'product_id' => $product->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'error' => __('Failed to generate barcode. Please try again.'),
            ], 500);
        }
    }

    /**
     * Validate custom barcode
     */
    public function validateBarcode(Request $request)
    {
        try {
            $validated = $request->validate([
                'barcode' => 'required|string|max:50',
                'type' => 'required|string|in:EAN13,EAN8,UPCA,UPCE,CODE128,CODE39,CODABAR,ITF14',
            ]);

            // Check if barcode is already used by another product in THIS account
            $existingProduct = Product::where('barcode', $validated['barcode'])
                ->where('account_id', auth()->user()->account_id)
                ->first();

            if ($existingProduct) {
                return response()->json([
                    'valid' => false,
                    'exists' => true,
                    'message' => __('This barcode is already in use by another product'),
                    'product' => [
                        'id' => $existingProduct->id,
                        'name' => $existingProduct->name,
                    ]
                ], 200);
            }

            // Validate barcode format
            $isValid = $this->barcodeService->validateBarcode(
                $validated['barcode'],
                $validated['type']
            );

            return response()->json([
                'valid' => $isValid,
                'exists' => false,
                'message' => $isValid ? __('Barcode is valid') : __('Invalid barcode format for selected type'),
            ], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'valid' => false,
                'message' => __('Invalid input data'),
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Barcode validation failed', [
                'barcode' => $request->barcode ?? 'N/A',
                'type' => $request->type ?? 'N/A',
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'valid' => false,
                'message' => __('Failed to validate barcode. Please try again.'),
            ], 500);
        }
    }

    /**
     * Get supported barcode types
     */
    public function types()
    {
        try {
            $types = $this->barcodeService->getSupportedTypes();

            return response()->json([
                'success' => true,
                'types' => $types,
            ], 200);
        } catch (\Exception $e) {
            \Log::error('Failed to retrieve barcode types', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'error' => __('Failed to retrieve barcode types'),
            ], 500);
        }
    }
}