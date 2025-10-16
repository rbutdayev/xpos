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

        if (!$product->barcode) {
            $this->barcodeService->generateForProduct($product);
            $product->refresh();
        }

        try {
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
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * Show printable barcode page
     */
    public function print(Product $product)
    {
        Gate::authorize('access-account-data', $product);

        if (!$product->barcode) {
            $this->barcodeService->generateForProduct($product);
            $product->refresh();
        }

        $printData = [
            'product' => $product,
            'barcode_url' => route('barcodes.show', ['product' => $product->id, 'format' => 'png', 'width' => 3, 'height' => 60]),
            'generated_at' => now()->format('d.m.Y H:i'),
        ];

        return view('barcode.print', $printData);
    }

    /**
     * Generate barcode for product if missing
     */
    public function generate(Product $product)
    {
        Gate::authorize('access-account-data', $product);

        $barcode = $this->barcodeService->generateForProduct($product);
        
        return response()->json([
            'barcode' => $barcode,
            'message' => __('Barcode generated successfully'),
        ]);
    }

    /**
     * Validate custom barcode
     */
    public function validateBarcode(Request $request)
    {
        $request->validate([
            'barcode' => 'required|string',
            'type' => 'required|string|in:EAN13,EAN8,UPCA,UPCE,CODE128,CODE39,CODABAR,ITF14',
        ]);

        $isValid = $this->barcodeService->validateBarcode(
            $request->barcode, 
            $request->type
        );

        return response()->json([
            'valid' => $isValid,
            'message' => $isValid ? __('Barcode is valid') : __('Invalid barcode format'),
        ]);
    }

    /**
     * Get supported barcode types
     */
    public function types()
    {
        return response()->json([
            'types' => $this->barcodeService->getSupportedTypes(),
        ]);
    }
}