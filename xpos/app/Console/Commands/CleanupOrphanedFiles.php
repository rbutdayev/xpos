<?php

namespace App\Console\Commands;

use App\Models\Account;
use App\Models\ProductPhoto;
use App\Models\ProductDocument;
use App\Models\Expense;
use App\Models\Product;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class CleanupOrphanedFiles extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'storage:cleanup-orphaned
                            {--account= : Specific account ID to cleanup}
                            {--dry-run : Show what would be deleted without actually deleting}
                            {--disk= : Storage disk to cleanup (default: documents)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clean up orphaned files from storage (deleted accounts or untracked files)';

    private string $disk;
    private bool $dryRun;
    private array $stats = [
        'accounts_checked' => 0,
        'deleted_account_files' => 0,
        'orphaned_product_photos' => 0,
        'orphaned_product_documents' => 0,
        'orphaned_expense_receipts' => 0,
        'total_files_deleted' => 0,
        'total_size_freed' => 0,
    ];

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->disk = $this->option('disk') ?: config('filesystems.default');
        $this->dryRun = $this->option('dry-run');

        if ($this->dryRun) {
            $this->warn('🔍 DRY RUN MODE - No files will be deleted');
            $this->newLine();
        }

        $this->info("Starting orphaned file cleanup on disk: {$this->disk}");
        $this->newLine();

        // Specific account cleanup
        if ($accountId = $this->option('account')) {
            return $this->cleanupSpecificAccount((int) $accountId);
        }

        // Full system cleanup
        return $this->cleanupAllOrphanedFiles();
    }

    /**
     * Clean up files for a specific account
     */
    private function cleanupSpecificAccount(int $accountId): int
    {
        $account = Account::find($accountId);

        if (!$account) {
            $this->error("Account #{$accountId} not found in database. Use full cleanup to remove orphaned account files.");
            return self::FAILURE;
        }

        $this->info("Cleaning up orphaned files for Account #{$accountId} ({$account->company_name})");
        $this->newLine();

        // Clean up orphaned product photos
        $this->cleanupOrphanedProductPhotos($accountId);

        // Clean up orphaned product documents
        $this->cleanupOrphanedProductDocuments($accountId);

        // Clean up orphaned expense receipts
        $this->cleanupOrphanedExpenseReceipts($accountId);

        $this->displayResults();

        return self::SUCCESS;
    }

    /**
     * Clean up all orphaned files in the system
     */
    private function cleanupAllOrphanedFiles(): int
    {
        $this->info('Scanning storage for orphaned files...');
        $this->newLine();

        // Step 1: Find and cleanup deleted account directories
        $this->cleanupDeletedAccountDirectories();

        // Step 2: Clean up orphaned files for existing accounts
        $activeAccounts = Account::pluck('id');
        $this->stats['accounts_checked'] = $activeAccounts->count();

        foreach ($activeAccounts as $accountId) {
            $this->cleanupOrphanedProductPhotos($accountId);
            $this->cleanupOrphanedProductDocuments($accountId);
            $this->cleanupOrphanedExpenseReceipts($accountId);
        }

        $this->displayResults();

        return self::SUCCESS;
    }

    /**
     * Find and cleanup directories for deleted accounts
     */
    private function cleanupDeletedAccountDirectories(): void
    {
        $this->info('🔍 Checking for deleted account directories...');

        $activeAccountIds = Account::pluck('id')->toArray();
        $prefixes = ['products', 'expenses', 'goods_receipts'];
        $deletedAccountFiles = 0;

        foreach ($prefixes as $prefix) {
            try {
                // Get all directories under this prefix
                $directories = Storage::disk($this->disk)->directories($prefix);

                foreach ($directories as $directory) {
                    // Extract account ID from path (e.g., "products/123" -> "123")
                    $parts = explode('/', $directory);
                    if (count($parts) >= 2 && is_numeric($parts[1])) {
                        $accountId = (int) $parts[1];

                        // Check if account still exists
                        if (!in_array($accountId, $activeAccountIds)) {
                            $files = Storage::disk($this->disk)->allFiles($directory);
                            $fileCount = count($files);

                            if ($fileCount > 0) {
                                $size = $this->getDirectorySize($directory);

                                $this->warn("  Found deleted account directory: {$directory} ({$fileCount} files, " . $this->formatBytes($size) . ")");

                                if (!$this->dryRun) {
                                    Storage::disk($this->disk)->deleteDirectory($directory);
                                    $this->info("  ✅ Deleted directory: {$directory}");
                                }

                                $deletedAccountFiles += $fileCount;
                                $this->stats['total_size_freed'] += $size;
                            }
                        }
                    }
                }
            } catch (\Exception $e) {
                $this->error("  Error checking {$prefix}: " . $e->getMessage());
                Log::error("Error cleaning up deleted account directories", [
                    'prefix' => $prefix,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        if ($deletedAccountFiles > 0) {
            $this->stats['deleted_account_files'] = $deletedAccountFiles;
            $this->info("  Found {$deletedAccountFiles} files from deleted accounts");
        } else {
            $this->info("  ✓ No deleted account directories found");
        }

        $this->newLine();
    }

    /**
     * Clean up orphaned product photos (files without database records)
     */
    private function cleanupOrphanedProductPhotos(int $accountId): void
    {
        $directory = "products/{$accountId}";

        if (!Storage::disk($this->disk)->exists($directory)) {
            return;
        }

        // Get all photo files from storage
        $storageFiles = Storage::disk($this->disk)->allFiles($directory);
        $photoFiles = array_filter($storageFiles, function($path) {
            return str_contains($path, '/photos/');
        });

        if (empty($photoFiles)) {
            return;
        }

        // Get all tracked photo paths from database
        $trackedPaths = ProductPhoto::where('account_id', $accountId)
            ->get()
            ->flatMap(function($photo) {
                return array_filter([
                    $photo->original_path,
                    $photo->medium_path,
                    $photo->thumbnail_path,
                ]);
            })
            ->toArray();

        // Find orphaned files
        $orphanedFiles = array_diff($photoFiles, $trackedPaths);

        foreach ($orphanedFiles as $file) {
            $size = Storage::disk($this->disk)->size($file);
            $this->warn("  Orphaned photo: {$file} (" . $this->formatBytes($size) . ")");

            if (!$this->dryRun) {
                Storage::disk($this->disk)->delete($file);
            }

            $this->stats['orphaned_product_photos']++;
            $this->stats['total_size_freed'] += $size;
        }
    }

    /**
     * Clean up orphaned product documents
     */
    private function cleanupOrphanedProductDocuments(int $accountId): void
    {
        $directory = "products/{$accountId}";

        if (!Storage::disk($this->disk)->exists($directory)) {
            return;
        }

        // Get all document files from storage
        $storageFiles = Storage::disk($this->disk)->allFiles($directory);
        $documentFiles = array_filter($storageFiles, function($path) {
            return str_contains($path, '/documents/');
        });

        if (empty($documentFiles)) {
            return;
        }

        // Get all tracked document paths from database
        $trackedPaths = ProductDocument::whereHas('product', function($query) use ($accountId) {
                $query->where('account_id', $accountId);
            })
            ->get()
            ->flatMap(function($doc) {
                return array_filter([
                    $doc->file_path,
                    $doc->thumbnail_path,
                ]);
            })
            ->toArray();

        // Find orphaned files
        $orphanedFiles = array_diff($documentFiles, $trackedPaths);

        foreach ($orphanedFiles as $file) {
            $size = Storage::disk($this->disk)->size($file);
            $this->warn("  Orphaned document: {$file} (" . $this->formatBytes($size) . ")");

            if (!$this->dryRun) {
                Storage::disk($this->disk)->delete($file);
            }

            $this->stats['orphaned_product_documents']++;
            $this->stats['total_size_freed'] += $size;
        }
    }

    /**
     * Clean up orphaned expense receipts
     */
    private function cleanupOrphanedExpenseReceipts(int $accountId): void
    {
        $directory = "expenses/{$accountId}";

        if (!Storage::disk($this->disk)->exists($directory)) {
            return;
        }

        // Get all receipt files from storage
        $storageFiles = Storage::disk($this->disk)->allFiles($directory);

        if (empty($storageFiles)) {
            return;
        }

        // Get all tracked receipt paths from database
        $trackedPaths = Expense::where('account_id', $accountId)
            ->whereNotNull('receipt_file_path')
            ->pluck('receipt_file_path')
            ->toArray();

        // Find orphaned files
        $orphanedFiles = array_diff($storageFiles, $trackedPaths);

        foreach ($orphanedFiles as $file) {
            $size = Storage::disk($this->disk)->size($file);
            $this->warn("  Orphaned expense receipt: {$file} (" . $this->formatBytes($size) . ")");

            if (!$this->dryRun) {
                Storage::disk($this->disk)->delete($file);
            }

            $this->stats['orphaned_expense_receipts']++;
            $this->stats['total_size_freed'] += $size;
        }
    }

    /**
     * Get total size of a directory
     */
    private function getDirectorySize(string $directory): int
    {
        $totalSize = 0;
        $files = Storage::disk($this->disk)->allFiles($directory);

        foreach ($files as $file) {
            try {
                $totalSize += Storage::disk($this->disk)->size($file);
            } catch (\Exception $e) {
                // Skip files that can't be read
            }
        }

        return $totalSize;
    }

    /**
     * Format bytes to human-readable format
     */
    private function formatBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $unitIndex = 0;

        while ($bytes >= 1024 && $unitIndex < count($units) - 1) {
            $bytes /= 1024;
            $unitIndex++;
        }

        return round($bytes, 2) . ' ' . $units[$unitIndex];
    }

    /**
     * Display cleanup results
     */
    private function displayResults(): void
    {
        $this->newLine();
        $this->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->info('Cleanup Results:');
        $this->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        if ($this->stats['accounts_checked'] > 0) {
            $this->line("  Accounts checked: {$this->stats['accounts_checked']}");
        }

        $this->line("  Deleted account files: {$this->stats['deleted_account_files']}");
        $this->line("  Orphaned product photos: {$this->stats['orphaned_product_photos']}");
        $this->line("  Orphaned product documents: {$this->stats['orphaned_product_documents']}");
        $this->line("  Orphaned expense receipts: {$this->stats['orphaned_expense_receipts']}");

        $totalFiles = $this->stats['deleted_account_files'] +
                     $this->stats['orphaned_product_photos'] +
                     $this->stats['orphaned_product_documents'] +
                     $this->stats['orphaned_expense_receipts'];

        $this->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->info("  Total files: {$totalFiles}");
        $this->info("  Total space freed: " . $this->formatBytes($this->stats['total_size_freed']));
        $this->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        if ($this->dryRun) {
            $this->newLine();
            $this->warn('⚠️  DRY RUN - No files were actually deleted');
            $this->info('Run without --dry-run to perform actual cleanup');
        } else if ($totalFiles > 0) {
            $this->newLine();
            $this->info('✅ Cleanup completed successfully!');

            // Log the cleanup
            Log::info('Orphaned file cleanup completed', $this->stats);
        } else {
            $this->newLine();
            $this->info('✓ No orphaned files found');
        }
    }
}
