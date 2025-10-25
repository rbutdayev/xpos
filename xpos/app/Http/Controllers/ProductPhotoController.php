<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductPhoto;
use App\Services\ProductPhotoService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ProductPhotoController extends Controller
{
    public function __construct(
        private ProductPhotoService $photoService
    ) {}

    /**
     * Upload photos for a product
     */
    public function store(Request $request, Product $product)
    {
        Gate::authorize('update', $product);

        $request->validate([
            'photos' => 'required|array|max:' . ProductPhotoService::getMaxPhotos(),
            'photos.*' => 'required|image|mimes:jpeg,png,gif,webp|max:' . (ProductPhotoService::getMaxFileSize() / 1024),
            'primary_index' => 'nullable|integer|min:0',
            'alt_texts' => 'nullable|array',
            'alt_texts.*' => 'nullable|string|max:255',
        ]);

        try {
            $photos = [];
            $primaryIndex = $request->input('primary_index');

            foreach ($request->file('photos') as $index => $file) {
                $altText = $request->input("alt_texts.{$index}");
                $isPrimary = ($primaryIndex !== null && $index == $primaryIndex);

                $photo = $this->photoService->uploadPhoto(
                    $product,
                    $file,
                    $isPrimary,
                    $altText
                );

                $photos[] = $photo;
            }

            return back()->with('success', __('Photos uploaded successfully'));
        } catch (\Exception $e) {
            \Log::error('Photo upload error in controller', [
                'product_id' => $product->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return back()->with('error', 'Fayl yükləmə zamanı xəta baş verdi: ' . $e->getMessage());
        }
    }

    /**
     * Delete a photo
     */
    public function destroy(Product $product, ProductPhoto $photo)
    {
        Gate::authorize('update', $product);

        if ($photo->product_id !== $product->id) {
            abort(404);
        }

        try {
            $this->photoService->deletePhoto($photo);
            return back()->with('success', __('Photo deleted successfully'));
        } catch (\Exception $e) {
            return back()->with('error', __('Failed to delete photo'));
        }
    }

    /**
     * Set a photo as primary
     */
    public function setPrimary(Product $product, ProductPhoto $photo)
    {
        Gate::authorize('update', $product);

        if ($photo->product_id !== $product->id) {
            abort(404);
        }

        try {
            $this->photoService->setPrimaryPhoto($product, $photo);
            return back()->with('success', __('Primary photo updated'));
        } catch (\Exception $e) {
            return back()->with('error', __('Failed to set primary photo'));
        }
    }

    /**
     * Update photo sort order
     */
    public function updateOrder(Request $request, Product $product)
    {
        Gate::authorize('update', $product);

        $request->validate([
            'photo_ids' => 'required|array',
            'photo_ids.*' => 'required|integer|exists:product_photos,id',
        ]);

        try {
            $this->photoService->updateSortOrder($product, $request->input('photo_ids'));
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Get photo URLs for a product (API endpoint)
     */
    public function index(Product $product)
    {
        Gate::authorize('view', $product);

        $photos = $this->photoService->getProductPhotoUrls($product, 'medium');

        return response()->json([
            'photos' => $photos,
            'primary_url' => $this->photoService->getPrimaryPhotoUrl($product, 'medium'),
        ]);
    }
}
