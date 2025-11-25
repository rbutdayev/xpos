<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductPhoto;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class ProductPhotoService
{
    private string $disk;

    // E-shop optimized photo settings
    private const MAX_PHOTOS_PER_PRODUCT = 5;
    private const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB per photo
    private const MEDIUM_SIZE = 800; // 800x800px for product detail page
    private const THUMBNAIL_SIZE = 300; // 300x300px for product listings

    // Compression settings
    private const ORIGINAL_QUALITY = 85; // Good balance between quality and size for originals
    private const RESIZED_QUALITY = 82; // Slightly more compression for resized versions
    private const CONVERT_TO_WEBP = true; // Convert to WebP for better compression

    private array $allowedMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
    ];

    public function __construct()
    {
        $this->disk = 'documents';
    }

    /**
     * Upload a single photo for a product
     */
    public function uploadPhoto(
        Product $product,
        UploadedFile $file,
        bool $isPrimary = false,
        ?string $altText = null
    ): ProductPhoto {
        $this->validatePhoto($file);
        $this->validatePhotoCount($product);

        $basePath = $this->getProductPhotoPath($product);

        // Generate unique filename
        $filename = $this->generateFileName($file);

        // Compress and store original
        $originalPath = $this->compressAndStore($file, $basePath . '/original', $filename, self::ORIGINAL_QUALITY);

        // Create photo record
        $photo = $product->photos()->create([
            'account_id' => $product->account_id,
            'original_path' => $originalPath,
            'original_name' => $file->getClientOriginalName(),
            'file_size' => $file->getSize(),
            'mime_type' => $file->getMimeType(),
            'is_primary' => $isPrimary,
            'sort_order' => $this->getNextSortOrder($product),
            'alt_text' => $altText,
            'uploaded_by' => Auth::id(),
        ]);

        // Generate resized versions asynchronously
        $this->generateResizedVersions($originalPath, $basePath, $filename, $photo);

        // If set as primary, unset other primary photos
        if ($isPrimary) {
            $this->setPrimaryPhoto($product, $photo);
        }

        return $photo->fresh();
    }

    /**
     * Upload multiple photos for a product
     */
    public function uploadMultiplePhotos(
        Product $product,
        array $files,
        ?int $primaryIndex = null
    ): array {
        $photos = [];

        foreach ($files as $index => $file) {
            if ($file instanceof UploadedFile && $file->isValid()) {
                try {
                    $isPrimary = ($primaryIndex !== null && $index === $primaryIndex);
                    $photos[] = $this->uploadPhoto($product, $file, $isPrimary);
                } catch (\Exception $e) {
                    \Log::error('Photo upload failed: ' . $e->getMessage());
                    // Continue with other photos
                }
            }
        }

        return $photos;
    }

    /**
     * Delete a photo and its resized versions
     */
    public function deletePhoto(ProductPhoto $photo): bool
    {
        try {
            $paths = array_filter([
                $photo->original_path,
                $photo->medium_path,
                $photo->thumbnail_path,
            ]);

            foreach ($paths as $path) {
                if (Storage::disk($this->disk)->exists($path)) {
                    Storage::disk($this->disk)->delete($path);
                }
            }

            $photo->delete();

            return true;
        } catch (\Exception $e) {
            \Log::error('Photo deletion failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Delete all photos for a product
     */
    public function deleteAllProductPhotos(Product $product): bool
    {
        try {
            foreach ($product->photos as $photo) {
                $this->deletePhoto($photo);
            }

            return true;
        } catch (\Exception $e) {
            \Log::error('Failed to delete all product photos: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Set a photo as primary
     */
    public function setPrimaryPhoto(Product $product, ProductPhoto $photo): void
    {
        // Unset all other primary photos for this product
        $product->photos()
            ->where('id', '!=', $photo->id)
            ->update(['is_primary' => false]);

        // Set this photo as primary
        $photo->update(['is_primary' => true]);
    }

    /**
     * Update photo sort order
     */
    public function updateSortOrder(Product $product, array $photoIds): void
    {
        foreach ($photoIds as $index => $photoId) {
            $product->photos()
                ->where('id', $photoId)
                ->update(['sort_order' => $index]);
        }
    }

    /**
     * Get photo URL (with signed URL for Azure)
     */
    public function getPhotoUrl(?string $path, string $size = 'original'): ?string
    {
        if (!$path || empty($path) || trim($path) === '') {
            return null;
        }

        // Clean path - ensure no double slashes or extra spaces
        $path = trim($path);
        $path = preg_replace('#/+#', '/', $path);

        try {
            $driver = config("filesystems.disks.{$this->disk}.driver");

            // For local storage, use url() instead of temporaryUrl()
            if ($driver === 'local') {
                return Storage::disk($this->disk)->url($path);
            }

            // For Azure and S3, try temporaryUrl()
            try {
                return Storage::disk($this->disk)->temporaryUrl(
                    $path,
                    now()->addHour()
                );
            } catch (\Exception $tempUrlException) {
                // If temporaryUrl fails, use fallback route to serve through server
                \Log::info('temporaryUrl failed for photo, using fallback route', [
                    'path' => $path,
                    'error' => $tempUrlException->getMessage(),
                ]);

                // Use fallback route that serves the file through the server
                return route('photos.serve', ['path' => base64_encode($path)]);
            }
        } catch (\Exception $e) {
            // Log full error details
            \Log::error('Failed to generate URL for photo', [
                'path' => $path,
                'error' => $e->getMessage(),
                'disk' => $this->disk,
                'driver' => config("filesystems.disks.{$this->disk}.driver"),
            ]);

            // Final fallback: use serve route
            try {
                return route('photos.serve', ['path' => base64_encode($path)]);
            } catch (\Exception $routeException) {
                \Log::error('All URL generation methods failed', [
                    'path' => $path,
                    'error' => $routeException->getMessage(),
                ]);
                return null;
            }
        }
    }

    /**
     * Get all photo URLs for a product
     */
    public function getProductPhotoUrls(Product $product, string $size = 'medium'): array
    {
        return $product->orderedPhotos->map(function ($photo) use ($size) {
            $path = match ($size) {
                'thumbnail' => $photo->thumbnail_path ?? $photo->medium_path ?? $photo->original_path,
                'medium' => $photo->medium_path ?? $photo->original_path,
                default => $photo->original_path,
            };

            return [
                'id' => $photo->id,
                'url' => $this->getPhotoUrl($path, $size),
                'is_primary' => $photo->is_primary,
                'alt_text' => $photo->alt_text ?? $product->name,
            ];
        })->toArray();
    }

    /**
     * Get primary photo URL
     */
    public function getPrimaryPhotoUrl(Product $product, string $size = 'medium'): ?string
    {
        $primaryPhoto = $product->photos()->where('is_primary', true)->first();

        if (!$primaryPhoto) {
            $primaryPhoto = $product->photos()->orderBy('sort_order')->first();
        }

        if (!$primaryPhoto) {
            return null;
        }

        // Get the appropriate path based on size, ensuring we have a valid path
        $path = null;
        if ($size === 'thumbnail') {
            $path = $primaryPhoto->thumbnail_path ?: ($primaryPhoto->medium_path ?: $primaryPhoto->original_path);
        } elseif ($size === 'medium') {
            $path = $primaryPhoto->medium_path ?: $primaryPhoto->original_path;
        } else {
            $path = $primaryPhoto->original_path;
        }

        if (!$path) {
            return null;
        }

        return $this->getPhotoUrl($path, $size);
    }

    /**
     * Validate photo file
     */
    private function validatePhoto(UploadedFile $file): void
    {
        if (!$file->isValid()) {
            throw new \InvalidArgumentException(__('Invalid file upload'));
        }

        if (!in_array($file->getMimeType(), $this->allowedMimeTypes)) {
            throw new \InvalidArgumentException(__('Only image files (JPEG, PNG, GIF, WebP) are allowed'));
        }

        if ($file->getSize() > self::MAX_FILE_SIZE) {
            $maxSizeMB = round(self::MAX_FILE_SIZE / (1024 * 1024), 1);
            throw new \InvalidArgumentException(__("Image size exceeds :size MB limit", ['size' => $maxSizeMB]));
        }
    }

    /**
     * Validate photo count for product
     */
    private function validatePhotoCount(Product $product): void
    {
        $currentCount = $product->photos()->count();

        if ($currentCount >= self::MAX_PHOTOS_PER_PRODUCT) {
            throw new \InvalidArgumentException(
                __("Maximum :count photos allowed per product", ['count' => self::MAX_PHOTOS_PER_PRODUCT])
            );
        }
    }

    /**
     * Generate resized versions of the photo
     */
    private function generateResizedVersions(
        string $originalPath,
        string $basePath,
        string $filename,
        ProductPhoto $photo
    ): void {
        try {
            $manager = new ImageManager(new Driver());

            // Small delay for Azure storage
            if ($this->disk === 'documents') {
                sleep(2); // Increased to 2 seconds for Azure propagation
            }

            // Check if original exists
            if (!Storage::disk($this->disk)->exists($originalPath)) {
                \Log::warning('Original photo not found for resizing: ' . $originalPath);
                return;
            }

            // Read original image
            $imageContent = Storage::disk($this->disk)->get($originalPath);
            $image = $manager->read($imageContent);

            // Generate medium version (800x800) with compression
            $mediumImage = clone $image;
            $mediumImage->scaleDown(width: self::MEDIUM_SIZE, height: self::MEDIUM_SIZE);
            $mediumPath = $basePath . '/medium/' . $this->getCompressedFilename($filename);
            Storage::disk($this->disk)->put($mediumPath, $this->encodeWithCompression($mediumImage, self::RESIZED_QUALITY));

            // Generate thumbnail (300x300) with compression
            $thumbnailImage = clone $image;
            $thumbnailImage->scaleDown(width: self::THUMBNAIL_SIZE, height: self::THUMBNAIL_SIZE);
            $thumbnailPath = $basePath . '/thumbs/' . $this->getCompressedFilename($filename);
            Storage::disk($this->disk)->put($thumbnailPath, $this->encodeWithCompression($thumbnailImage, self::RESIZED_QUALITY));

            // Update photo record with paths
            $photo->update([
                'medium_path' => $mediumPath,
                'thumbnail_path' => $thumbnailPath,
            ]);

        } catch (\Exception $e) {
            \Log::error('Photo resizing failed', [
                'original_path' => $originalPath,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            // Don't throw - photo upload should succeed even if resizing fails
        }
    }

    /**
     * Get next sort order for product photos
     */
    private function getNextSortOrder(Product $product): int
    {
        $maxOrder = $product->photos()->max('sort_order');
        return ($maxOrder ?? -1) + 1;
    }

    /**
     * Generate filename for photo
     */
    private function generateFileName(UploadedFile $file): string
    {
        $extension = $file->getClientOriginalExtension();
        $hash = Str::random(32);
        $timestamp = now()->format('YmdHis');

        return $timestamp . '_' . $hash . '.' . $extension;
    }

    /**
     * Get storage path for product photos
     */
    private function getProductPhotoPath(Product $product): string
    {
        return "products/{$product->account_id}/{$product->id}/photos";
    }

    /**
     * Get max photos per product limit
     */
    public static function getMaxPhotos(): int
    {
        return self::MAX_PHOTOS_PER_PRODUCT;
    }

    /**
     * Get max file size limit
     */
    public static function getMaxFileSize(): int
    {
        return self::MAX_FILE_SIZE;
    }

    /**
     * Compress and store an image file
     */
    private function compressAndStore(UploadedFile $file, string $path, string $filename, int $quality): string
    {
        try {
            $manager = new ImageManager(new Driver());
            $image = $manager->read($file->getPathname());

            // Encode with compression
            $encoded = $this->encodeWithCompression($image, $quality);

            // Update filename if converting to WebP
            $filename = $this->getCompressedFilename($filename);

            // Store the compressed image
            $fullPath = $path . '/' . $filename;
            Storage::disk($this->disk)->put($fullPath, $encoded);

            return $fullPath;
        } catch (\Exception $e) {
            \Log::error('Image compression failed, storing original', [
                'error' => $e->getMessage(),
            ]);

            // Fallback: store original without compression
            return $file->storeAs($path, $filename, $this->disk);
        }
    }

    /**
     * Encode image with compression
     */
    private function encodeWithCompression($image, int $quality)
    {
        if (self::CONVERT_TO_WEBP) {
            // Convert to WebP for better compression
            return $image->toWebp($quality);
        } else {
            // Keep original format but compress
            return $image->encodeByMediaType(quality: $quality);
        }
    }

    /**
     * Get filename with appropriate extension for compression
     */
    private function getCompressedFilename(string $filename): string
    {
        if (self::CONVERT_TO_WEBP) {
            // Replace extension with .webp
            return preg_replace('/\.(jpg|jpeg|png|gif)$/i', '.webp', $filename);
        }

        return $filename;
    }
}
