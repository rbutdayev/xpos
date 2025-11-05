<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Services\BarcodeService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Cache;

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
     * Generate cache key for barcode image
     */
    private function getBarcodeImageCacheKey(string $barcode, string $format, int $width, int $height): string
    {
        return "barcode_image:{$barcode}:{$format}:{$width}:{$height}";
    }

    /**
     * Generate barcode image for a product with caching
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

            // Generate cache key
            $cacheKey = $this->getBarcodeImageCacheKey(
                $product->barcode,
                $format,
                $width,
                $height
            );

            // Cache for 30 days (barcodes rarely change)
            $cacheDuration = 60 * 24 * 30; // 30 days in minutes

            // Try to get from cache, or generate and cache
            $barcodeData = Cache::remember($cacheKey, $cacheDuration, function () use ($product, $format, $width, $height) {
                if ($format === 'svg') {
                    return [
                        'content' => $this->barcodeService->generateSVG(
                            $product->barcode,
                            $product->barcode_type,
                            $width,
                            $height
                        ),
                        'type' => 'image/svg+xml',
                        'encoded' => false
                    ];
                } else {
                    return [
                        'content' => $this->barcodeService->generatePNG(
                            $product->barcode,
                            $product->barcode_type,
                            $width,
                            $height
                        ),
                        'type' => 'image/png',
                        'encoded' => true // Base64 encoded
                    ];
                }
            });

            // Decode if necessary
            $content = $barcodeData['encoded'] ? base64_decode($barcodeData['content']) : $barcodeData['content'];

            // Generate ETag for HTTP caching
            $etag = md5($content);

            // Check if client has cached version
            $clientEtag = $request->header('If-None-Match');
            if ($clientEtag === '"' . $etag . '"') {
                return response('', 304)
                    ->header('ETag', '"' . $etag . '"')
                    ->header('Cache-Control', 'public, max-age=2592000'); // 30 days
            }

            // Return image with caching headers
            return response($content)
                ->header('Content-Type', $barcodeData['type'])
                ->header('Cache-Control', 'public, max-age=2592000, immutable') // 30 days, immutable
                ->header('ETag', '"' . $etag . '"')
                ->header('X-Cache-Status', Cache::has($cacheKey) ? 'HIT' : 'MISS');

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

    /**
     * Clear cache for a specific product's barcode
     * Useful for manual cache invalidation
     */
    public function clearCache(Product $product)
    {
        Gate::authorize('access-account-data', $product);

        if (!$product->barcode) {
            return response()->json([
                'success' => false,
                'message' => __('Product does not have a barcode'),
            ], 400);
        }

        try {
            // Clear all common barcode image sizes
            $cleared = 0;
            $formats = ['png', 'svg'];
            $commonSizes = [
                [2, 30],   // Default size
                [3, 60],   // Print size
                [3, 80],   // Large size
            ];

            foreach ($formats as $format) {
                foreach ($commonSizes as [$width, $height]) {
                    $cacheKey = $this->getBarcodeImageCacheKey(
                        $product->barcode,
                        $format,
                        $width,
                        $height
                    );

                    if (Cache::has($cacheKey)) {
                        Cache::forget($cacheKey);
                        $cleared++;
                    }
                }
            }

            return response()->json([
                'success' => true,
                'message' => __('Cache cleared successfully'),
                'cleared_entries' => $cleared,
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Failed to clear barcode cache', [
                'product_id' => $product->id,
                'barcode' => $product->barcode,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'error' => __('Failed to clear cache'),
            ], 500);
        }
    }
}