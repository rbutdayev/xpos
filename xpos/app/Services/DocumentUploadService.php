<?php

namespace App\Services;

use App\Models\ProductDocument;
use App\Models\Product;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class DocumentUploadService
{
    private string $disk;
    private array $allowedMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'text/csv',
    ];

    private array $maxFileSizes = [
        'image' => 5 * 1024 * 1024, // 5MB for images
        'document' => 10 * 1024 * 1024, // 10MB for documents
        'default' => 5 * 1024 * 1024, // 5MB default
    ];

    public function __construct()
    {
        $this->disk = 'documents';
    }

    /**
     * Upload document for product
     */
    public function uploadProductDocument(
        Product $product,
        UploadedFile $file,
        string $documentType = 'qaimə',
        ?string $description = null
    ): ProductDocument {
        $this->validateFile($file);

        $path = $this->storeFile($file, $this->getProductPath($product));
        
        $document = $product->documents()->create([
            'file_path' => $path,
            'original_name' => $file->getClientOriginalName(),
            'file_type' => $this->getFileType($file),
            'file_size' => $file->getSize(),
            'mime_type' => $file->getMimeType(),
            'document_type' => $documentType,
            'description' => $description,
            'uploaded_by' => Auth::id(),
        ]);

        // Generate thumbnail for images
        if ($this->isImage($file)) {
            $this->generateThumbnail($path, $document);
        }

        return $document;
    }

    /**
     * Upload multiple documents
     */
    public function uploadMultipleDocuments(
        Product $product,
        array $files,
        string $documentType = 'qaimə'
    ): array {
        $documents = [];
        
        foreach ($files as $file) {
            if ($file instanceof UploadedFile && $file->isValid()) {
                $documents[] = $this->uploadProductDocument($product, $file, $documentType);
            }
        }

        return $documents;
    }

    /**
     * Delete document
     */
    public function deleteDocument(ProductDocument $document): bool
    {
        try {
            // Delete main file
            if (Storage::disk($this->disk)->exists($document->file_path)) {
                Storage::disk($this->disk)->delete($document->file_path);
            }

            // Delete thumbnail if exists
            if ($document->thumbnail_path && Storage::disk($this->disk)->exists($document->thumbnail_path)) {
                Storage::disk($this->disk)->delete($document->thumbnail_path);
            }

            // Delete database record
            $document->delete();

            return true;
        } catch (\Exception $e) {
            \Log::error('Document deletion failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Get document URL for viewing/downloading
     */
    public function getDocumentUrl(ProductDocument $document, bool $download = false): string
    {
        try {
            // Generate signed URL for Azure storage
            return Storage::disk($this->disk)->temporaryUrl(
                $document->file_path,
                now()->addHour(),
                [
                    'ResponseContentDisposition' => $download 
                        ? 'attachment; filename="' . $document->original_name . '"'
                        : 'inline'
                ]
            );
        } catch (\Exception $e) {
            // Fallback to regular download route if temporaryUrl fails
            \Log::warning('Failed to generate temporary URL for document ' . $document->id . ': ' . $e->getMessage());
            try {
                return route('documents.serve', $document);
            } catch (\Exception $routeException) {
                // Final fallback - return a placeholder or empty string
                \Log::error('Failed to generate fallback route for document ' . $document->id . ': ' . $routeException->getMessage());
                return '#'; // Or return a placeholder URL
            }
        }
    }

    /**
     * Get thumbnail URL for images
     */
    public function getThumbnailUrl(ProductDocument $document): ?string
    {
        if (!$document->thumbnail_path) {
            return null;
        }

        try {
            return Storage::disk($this->disk)->temporaryUrl(
                $document->thumbnail_path,
                now()->addHour()
            );
        } catch (\Exception $e) {
            // Fallback to regular thumbnail route if temporaryUrl fails
            \Log::warning('Failed to generate temporary URL for thumbnail ' . $document->id . ': ' . $e->getMessage());
            try {
                return route('documents.thumbnail', $document);
            } catch (\Exception $routeException) {
                // Final fallback - return null
                \Log::error('Failed to generate fallback route for thumbnail ' . $document->id . ': ' . $routeException->getMessage());
                return null;
            }
        }
    }

    /**
     * Get supported document types
     */
    public function getSupportedTypes(): array
    {
        return [
            'qaimə' => __('app.qaimə'),
            'warranty' => __('app.warranty'),
            'certificate' => __('app.certificate'),
            'manual' => __('app.manual'),
            'photo' => __('app.photo'),
            'invoice' => __('app.invoice'),
            'receipt' => __('app.receipt'),
            'other' => __('app.other'),
        ];
    }

    /**
     * Upload document for goods receipt
     */
    public function uploadGoodsReceiptDocument(
        UploadedFile $file,
        string $documentType = 'qaimə'
    ): string {
        $this->validateFile($file);
        
        $accountId = Auth::user()->account_id;
        $path = "goods_receipts/{$accountId}/documents";
        
        return $this->storeFile($file, $path);
    }

    /**
     * Generic file upload method for expenses and other general uploads
     */
    public function uploadFile(
        UploadedFile $file,
        string $directory,
        ?string $prefix = null
    ): string {
        $this->validateFile($file);
        
        $accountId = Auth::user()->account_id;
        $path = "{$directory}/{$accountId}";
        
        if ($prefix) {
            $filename = $prefix . '_' . $this->generateFileName($file);
        } else {
            $filename = $this->generateFileName($file);
        }
        
        return $file->storeAs($path, $filename, $this->disk);
    }

    /**
     * Delete file by path
     */
    public function deleteFile(string $filePath): bool
    {
        try {
            if (Storage::disk($this->disk)->exists($filePath)) {
                Storage::disk($this->disk)->delete($filePath);
                return true;
            }
            return false;
        } catch (\Exception $e) {
            \Log::error('File deletion failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Get file statistics for account
     */
    public function getAccountStatistics(int $accountId): array
    {
        $query = ProductDocument::whereHas('product', function ($q) use ($accountId) {
            $q->where('account_id', $accountId);
        });

        return [
            'total_documents' => $query->count(),
            'total_size' => $query->sum('file_size'),
            'by_type' => $query->groupBy('document_type')
                ->selectRaw('document_type, count(*) as count, sum(file_size) as size')
                ->pluck('count', 'document_type')
                ->toArray(),
            'recent_uploads' => $query->latest()->limit(5)->get(),
        ];
    }

    private function validateFile(UploadedFile $file): void
    {
        if (!$file->isValid()) {
            throw new \InvalidArgumentException(__('Invalid file upload'));
        }

        if (!in_array($file->getMimeType(), $this->allowedMimeTypes)) {
            throw new \InvalidArgumentException(__('File type not supported'));
        }

        $fileType = $this->getFileType($file);
        $maxSize = $this->maxFileSizes[$fileType] ?? $this->maxFileSizes['default'];

        if ($file->getSize() > $maxSize) {
            $maxSizeMB = round($maxSize / (1024 * 1024), 1);
            throw new \InvalidArgumentException(__("File size exceeds :size MB limit", ['size' => $maxSizeMB]));
        }
    }

    private function storeFile(UploadedFile $file, string $path): string
    {
        $filename = $this->generateFileName($file);
        return $file->storeAs($path, $filename, $this->disk);
    }

    private function generateFileName(UploadedFile $file): string
    {
        $extension = $file->getClientOriginalExtension();
        $hash = Str::random(32);
        $timestamp = now()->format('YmdHis');
        
        return $timestamp . '_' . $hash . '.' . $extension;
    }

    private function getProductPath(Product $product): string
    {
        return "products/{$product->account_id}/{$product->id}/documents";
    }

    private function getFileType(UploadedFile $file): string
    {
        $mimeType = $file->getMimeType();
        
        if (str_starts_with($mimeType, 'image/')) {
            return 'image';
        }
        
        return 'document';
    }

    private function isImage(UploadedFile $file): bool
    {
        return $this->getFileType($file) === 'image';
    }

    private function generateThumbnail(string $filePath, ProductDocument $document): void
    {
        try {
            $manager = new ImageManager(new Driver());
            
            // For Azure storage, add a small delay to ensure file is available
            if ($this->disk === 'documents') {
                sleep(1);
                
                // Check if file exists before trying to read
                if (!Storage::disk($this->disk)->exists($filePath)) {
                    \Log::warning('File not found for thumbnail generation: ' . $filePath);
                    return;
                }
            }
            
            // Read the original image from storage
            $imageContent = Storage::disk($this->disk)->get($filePath);
            $image = $manager->read($imageContent);
            
            // Resize to thumbnail
            $image->scaleDown(width: 300, height: 300);
            
            // Generate thumbnail path
            $pathInfo = pathinfo($filePath);
            $thumbnailPath = $pathInfo['dirname'] . '/thumbs/' . $pathInfo['filename'] . '_thumb.' . $pathInfo['extension'];
            
            // Save thumbnail
            $thumbnailContent = $image->encode();
            Storage::disk($this->disk)->put($thumbnailPath, $thumbnailContent);
            
            // Update document record
            $document->update(['thumbnail_path' => $thumbnailPath]);
            
        } catch (\Exception $e) {
            \Log::warning('Thumbnail generation failed for ' . $filePath . ': ' . $e->getMessage());
            \Log::warning('Error class: ' . get_class($e));
        }
    }

    /**
     * Check if file exists
     */
    public function fileExists(string $filePath): bool
    {
        try {
            return Storage::disk($this->disk)->exists($filePath);
        } catch (\Exception $e) {
            \Log::error('Error checking file existence: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Get file URL by path (for general file access like company logos)
     */
    public function getFileUrl(string $filePath): string
    {
        try {
            // Generate signed URL for Azure storage
            return Storage::disk($this->disk)->temporaryUrl(
                $filePath,
                now()->addHour()
            );
        } catch (\Exception $e) {
            // Fallback to local storage route if temporaryUrl fails
            \Log::warning('Failed to generate temporary URL for file ' . $filePath . ': ' . $e->getMessage());
            try {
                return route('files.serve', ['path' => base64_encode($filePath)]);
            } catch (\Exception $routeException) {
                // Final fallback - return storage URL for local storage
                \Log::error('Failed to generate fallback route for file ' . $filePath . ': ' . $routeException->getMessage());
                return '/storage/' . $filePath;
            }
        }
    }

    /**
     * Get file contents
     */
    public function getFileContents(string $filePath): string
    {
        return Storage::disk($this->disk)->get($filePath);
    }

    /**
     * Download file with proper headers
     */
    public function downloadFile(string $filePath, string $filename)
    {
        return Storage::disk($this->disk)->download($filePath, $filename);
    }
}