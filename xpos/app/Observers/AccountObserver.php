<?php

namespace App\Observers;

use App\Models\Account;
use App\Models\ProductPhoto;
use App\Models\ProductDocument;
use App\Models\Expense;
use App\Services\ThermalPrintingService;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class AccountObserver
{
    /**
     * Handle the Account "created" event.
     * Create default receipt templates for the new account.
     */
    public function created(Account $account): void
    {
        try {
            Log::info("Creating default receipt templates for new account", [
                'account_id' => $account->id,
                'account_name' => $account->company_name,
            ]);

            $printingService = new ThermalPrintingService();
            $templateTypes = ['sale', 'service', 'customer_item', 'return', 'payment'];

            foreach ($templateTypes as $type) {
                try {
                    $printingService->createDefaultTemplate($account->id, $type);
                    Log::info("Created {$type} receipt template", [
                        'account_id' => $account->id,
                        'template_type' => $type,
                    ]);
                } catch (\Exception $e) {
                    Log::error("Failed to create {$type} receipt template", [
                        'account_id' => $account->id,
                        'template_type' => $type,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            Log::info("Completed creating default receipt templates", [
                'account_id' => $account->id,
            ]);

        } catch (\Exception $e) {
            Log::error("Error creating default receipt templates for account", [
                'account_id' => $account->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }
    /**
     * Handle the Account "deleting" event.
     * Clean up all files associated with this account from blob storage.
     */
    public function deleting(Account $account): void
    {
        Log::info("Starting file cleanup for account deletion", [
            'account_id' => $account->id,
            'company_name' => $account->company_name,
        ]);

        $stats = [
            'product_photos' => 0,
            'product_documents' => 0,
            'expense_receipts' => 0,
            'total_files_deleted' => 0,
            'failed_deletions' => 0,
        ];

        try {
            // Get storage disk configuration
            $disk = config('filesystems.default');

            // 1. Clean up product photos (original, medium, thumbnail)
            $stats['product_photos'] = $this->cleanupProductPhotos($account->id, $disk);

            // 2. Clean up product documents
            $stats['product_documents'] = $this->cleanupProductDocuments($account->id, $disk);

            // 3. Clean up expense receipts
            $stats['expense_receipts'] = $this->cleanupExpenseReceipts($account->id, $disk);

            // 4. Clean up entire account directory (catch-all for any orphaned files)
            $this->cleanupAccountDirectory($account->id, $disk, $stats);

            $stats['total_files_deleted'] =
                $stats['product_photos'] +
                $stats['product_documents'] +
                $stats['expense_receipts'];

            Log::info("File cleanup completed for account deletion", array_merge([
                'account_id' => $account->id,
            ], $stats));

        } catch (\Exception $e) {
            Log::error("Error during account file cleanup", [
                'account_id' => $account->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            // Don't halt the deletion, but log the failure
            $stats['failed_deletions']++;
        }
    }

    /**
     * Clean up all product photos for the account
     */
    private function cleanupProductPhotos(int $accountId, string $disk): int
    {
        $deletedCount = 0;

        try {
            // Get all product photos for this account
            $photos = ProductPhoto::where('account_id', $accountId)->get();

            foreach ($photos as $photo) {
                // Collect all versions of the photo
                $paths = array_filter([
                    $photo->original_path,
                    $photo->medium_path,
                    $photo->thumbnail_path,
                ]);

                foreach ($paths as $path) {
                    if (Storage::disk($disk)->exists($path)) {
                        try {
                            Storage::disk($disk)->delete($path);
                            $deletedCount++;
                        } catch (\Exception $e) {
                            Log::warning("Failed to delete product photo", [
                                'path' => $path,
                                'photo_id' => $photo->id,
                                'error' => $e->getMessage(),
                            ]);
                        }
                    }
                }
            }

        } catch (\Exception $e) {
            Log::error("Error cleaning up product photos", [
                'account_id' => $accountId,
                'error' => $e->getMessage(),
            ]);
        }

        return $deletedCount;
    }

    /**
     * Clean up all product documents for the account
     */
    private function cleanupProductDocuments(int $accountId, string $disk): int
    {
        $deletedCount = 0;

        try {
            // Get all products for this account, then their documents
            $documents = ProductDocument::whereHas('product', function ($query) use ($accountId) {
                $query->where('account_id', $accountId);
            })->get();

            foreach ($documents as $document) {
                // Delete main file
                if ($document->file_path && Storage::disk($disk)->exists($document->file_path)) {
                    try {
                        Storage::disk($disk)->delete($document->file_path);
                        $deletedCount++;
                    } catch (\Exception $e) {
                        Log::warning("Failed to delete product document", [
                            'path' => $document->file_path,
                            'document_id' => $document->id,
                            'error' => $e->getMessage(),
                        ]);
                    }
                }

                // Delete thumbnail if exists
                if ($document->thumbnail_path && Storage::disk($disk)->exists($document->thumbnail_path)) {
                    try {
                        Storage::disk($disk)->delete($document->thumbnail_path);
                        $deletedCount++;
                    } catch (\Exception $e) {
                        Log::warning("Failed to delete document thumbnail", [
                            'path' => $document->thumbnail_path,
                            'document_id' => $document->id,
                            'error' => $e->getMessage(),
                        ]);
                    }
                }
            }

        } catch (\Exception $e) {
            Log::error("Error cleaning up product documents", [
                'account_id' => $accountId,
                'error' => $e->getMessage(),
            ]);
        }

        return $deletedCount;
    }

    /**
     * Clean up all expense receipts for the account
     */
    private function cleanupExpenseReceipts(int $accountId, string $disk): int
    {
        $deletedCount = 0;

        try {
            // Get all expenses with receipt files for this account
            $expenses = Expense::where('account_id', $accountId)
                ->whereNotNull('receipt_file_path')
                ->get();

            foreach ($expenses as $expense) {
                if (Storage::disk($disk)->exists($expense->receipt_file_path)) {
                    try {
                        Storage::disk($disk)->delete($expense->receipt_file_path);
                        $deletedCount++;
                    } catch (\Exception $e) {
                        Log::warning("Failed to delete expense receipt", [
                            'path' => $expense->receipt_file_path,
                            'expense_id' => $expense->id,
                            'error' => $e->getMessage(),
                        ]);
                    }
                }
            }

        } catch (\Exception $e) {
            Log::error("Error cleaning up expense receipts", [
                'account_id' => $accountId,
                'error' => $e->getMessage(),
            ]);
        }

        return $deletedCount;
    }

    /**
     * Clean up entire account directory as a catch-all
     * This removes any orphaned files that weren't tracked in the database
     */
    private function cleanupAccountDirectory(int $accountId, string $disk, array &$stats): void
    {
        try {
            // Define all possible account-scoped directories
            $accountDirectories = [
                "products/{$accountId}",
                "expenses/{$accountId}",
                "goods_receipts/{$accountId}",
            ];

            foreach ($accountDirectories as $directory) {
                if (Storage::disk($disk)->exists($directory)) {
                    try {
                        // Get all files in this directory (recursively)
                        $files = Storage::disk($disk)->allFiles($directory);
                        $orphanedCount = count($files) - $stats['total_files_deleted'];

                        // Delete the entire directory
                        Storage::disk($disk)->deleteDirectory($directory);

                        if ($orphanedCount > 0) {
                            Log::info("Cleaned up orphaned files", [
                                'account_id' => $accountId,
                                'directory' => $directory,
                                'orphaned_files' => $orphanedCount,
                            ]);
                        }
                    } catch (\Exception $e) {
                        Log::warning("Failed to delete account directory", [
                            'directory' => $directory,
                            'error' => $e->getMessage(),
                        ]);
                    }
                }
            }

        } catch (\Exception $e) {
            Log::error("Error cleaning up account directories", [
                'account_id' => $accountId,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
