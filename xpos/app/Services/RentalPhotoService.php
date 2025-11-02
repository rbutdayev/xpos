<?php

namespace App\Services;

use App\Models\RentalAgreement;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class RentalPhotoService
{
    private string $disk;

    private const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per photo

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
     * Upload condition photos from base64 strings
     */
    public function uploadConditionPhotos(RentalAgreement $agreement, array $base64Photos): array
    {
        $uploadedPaths = [];

        foreach ($base64Photos as $index => $base64Data) {
            try {
                $path = $this->uploadBase64Photo(
                    $agreement,
                    $base64Data,
                    "condition_{$index}"
                );
                if ($path) {
                    $uploadedPaths[] = $path;
                }
            } catch (\Exception $e) {
                \Log::error('Condition photo upload failed', [
                    'agreement_id' => $agreement->id,
                    'index' => $index,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $uploadedPaths;
    }

    /**
     * Upload signature from base64 string
     */
    public function uploadSignature(RentalAgreement $agreement, string $base64Data, string $type = 'customer'): ?string
    {
        try {
            return $this->uploadBase64Photo(
                $agreement,
                $base64Data,
                "signature_{$type}"
            );
        } catch (\Exception $e) {
            \Log::error('Signature upload failed', [
                'agreement_id' => $agreement->id,
                'type' => $type,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Upload collateral photo from base64 string
     */
    public function uploadCollateralPhoto(int $accountId, int $rentalId, string $base64Data): ?string
    {
        try {
            // Extract base64 data
            if (preg_match('/^data:image\/(\w+);base64,/', $base64Data, $matches)) {
                $extension = $matches[1];
                $base64Data = substr($base64Data, strpos($base64Data, ',') + 1);
            } else {
                throw new \InvalidArgumentException('Invalid base64 image format');
            }

            // Decode base64
            $imageData = base64_decode($base64Data);

            if ($imageData === false) {
                throw new \InvalidArgumentException('Failed to decode base64 image');
            }

            // Validate file size
            if (strlen($imageData) > self::MAX_FILE_SIZE) {
                throw new \InvalidArgumentException('Image size exceeds limit');
            }

            // Generate filename
            $filename = $this->generateFileName($extension, 'collateral');

            // Get storage path
            $basePath = $this->getCollateralPhotoPath($accountId, $rentalId);
            $fullPath = $basePath . '/' . $filename;

            // Upload to Azure
            Storage::disk($this->disk)->put($fullPath, $imageData);

            return $fullPath;
        } catch (\Exception $e) {
            \Log::error('Collateral photo upload failed', [
                'account_id' => $accountId,
                'rental_id' => $rentalId,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Upload a base64 encoded image
     */
    private function uploadBase64Photo(RentalAgreement $agreement, string $base64Data, string $prefix): ?string
    {
        try {
            // Extract base64 data
            if (preg_match('/^data:image\/(\w+);base64,/', $base64Data, $matches)) {
                $extension = $matches[1];
                $base64Data = substr($base64Data, strpos($base64Data, ',') + 1);
            } else {
                throw new \InvalidArgumentException('Invalid base64 image format');
            }

            // Decode base64
            $imageData = base64_decode($base64Data);

            if ($imageData === false) {
                throw new \InvalidArgumentException('Failed to decode base64 image');
            }

            // Validate file size
            if (strlen($imageData) > self::MAX_FILE_SIZE) {
                throw new \InvalidArgumentException('Image size exceeds limit');
            }

            // Generate filename
            $filename = $this->generateFileName($extension, $prefix);

            // Get storage path
            $basePath = $this->getAgreementPhotoPath($agreement);
            $fullPath = $basePath . '/' . $filename;

            // Upload to Azure
            Storage::disk($this->disk)->put($fullPath, $imageData);

            return $fullPath;
        } catch (\Exception $e) {
            \Log::error('Base64 photo upload failed', [
                'agreement_id' => $agreement->id ?? null,
                'prefix' => $prefix,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    /**
     * Get photo URL (with signed URL for Azure)
     */
    public function getPhotoUrl(?string $path): ?string
    {
        if (!$path || empty($path) || trim($path) === '') {
            return null;
        }

        // Clean path
        $path = trim($path);
        $path = preg_replace('#/+#', '/', $path);

        try {
            // Check if file exists in Azure before generating URL
            if (!Storage::disk($this->disk)->exists($path)) {
                \Log::warning('Photo file does not exist in storage', [
                    'path' => $path,
                    'disk' => $this->disk,
                ]);
                return null;
            }

            $driver = config("filesystems.disks.{$this->disk}.driver");

            // For local storage
            if ($driver === 'local') {
                return Storage::disk($this->disk)->url($path);
            }

            // For Azure and S3, use temporaryUrl
            try {
                return Storage::disk($this->disk)->temporaryUrl(
                    $path,
                    now()->addHours(24) // Longer expiry for agreements
                );
            } catch (\Exception $tempUrlException) {
                \Log::info('temporaryUrl failed for rental photo, using fallback', [
                    'path' => $path,
                    'error' => $tempUrlException->getMessage(),
                ]);

                // Use fallback route
                return route('photos.serve', ['path' => base64_encode($path)]);
            }
        } catch (\Exception $e) {
            \Log::error('Failed to generate URL for rental photo', [
                'path' => $path,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Get all photo URLs for an agreement
     */
    public function getAgreementPhotoUrls(RentalAgreement $agreement): array
    {
        $photos = $agreement->condition_photos ?? [];

        return array_map(function ($path) {
            return $this->getPhotoUrl($path);
        }, $photos);
    }

    /**
     * Delete a photo
     */
    public function deletePhoto(string $path): bool
    {
        try {
            if (Storage::disk($this->disk)->exists($path)) {
                Storage::disk($this->disk)->delete($path);
            }
            return true;
        } catch (\Exception $e) {
            \Log::error('Photo deletion failed', [
                'path' => $path,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Delete all photos for an agreement
     */
    public function deleteAgreementPhotos(RentalAgreement $agreement): bool
    {
        try {
            // Delete condition photos
            $photos = $agreement->condition_photos ?? [];
            foreach ($photos as $path) {
                $this->deletePhoto($path);
            }

            // Delete signatures
            if ($agreement->customer_signature) {
                $this->deletePhoto($agreement->customer_signature);
            }
            if ($agreement->staff_signature) {
                $this->deletePhoto($agreement->staff_signature);
            }

            return true;
        } catch (\Exception $e) {
            \Log::error('Failed to delete agreement photos', [
                'agreement_id' => $agreement->id,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Generate filename for photo
     */
    private function generateFileName(string $extension, string $prefix = 'photo'): string
    {
        $hash = Str::random(16);
        $timestamp = now()->format('YmdHis');

        return "{$prefix}_{$timestamp}_{$hash}.{$extension}";
    }

    /**
     * Get storage path for agreement photos
     */
    private function getAgreementPhotoPath(RentalAgreement $agreement): string
    {
        return "rentals/{$agreement->account_id}/{$agreement->rental_id}/agreement";
    }

    /**
     * Get storage path for collateral photos
     */
    private function getCollateralPhotoPath(int $accountId, int $rentalId): string
    {
        return "rentals/{$accountId}/{$rentalId}/collateral";
    }

    /**
     * Get max file size limit
     */
    public static function getMaxFileSize(): int
    {
        return self::MAX_FILE_SIZE;
    }
}
