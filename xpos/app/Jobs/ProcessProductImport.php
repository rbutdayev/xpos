<?php

namespace App\Jobs;

use App\Models\ImportJob;
use App\Imports\ProductsImport;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Facades\Excel;

class ProcessProductImport implements ShouldQueue
{
    use Queueable, InteractsWithQueue, SerializesModels;

    public $timeout = 3600; // 1 hour timeout
    public $tries = 1; // Don't retry on failure

    /**
     * Create a new job instance.
     */
    public function __construct(
        public ImportJob $importJob
    ) {
        //
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            // Mark as started
            $this->importJob->markAsStarted();

            // Create the import instance with progress tracking
            $import = new ProductsImport(
                $this->importJob->account_id,
                $this->importJob
            );

            // Process the file
            Excel::import($import, $this->importJob->file_path, 'local');

            // Get final summary
            $summary = $import->getSummary();

            // Update final stats
            $this->importJob->updateProgress(
                $this->importJob->total_rows,
                $summary['success'],
                $summary['errors'],
                $summary['error_details']
            );

            // Mark as completed
            $this->importJob->markAsCompleted();

            // Clean up the uploaded file
            if (Storage::disk('local')->exists($this->importJob->file_path)) {
                Storage::disk('local')->delete($this->importJob->file_path);
            }

        } catch (\Exception $e) {
            \Log::error('Product import job failed: ' . $e->getMessage(), [
                'import_job_id' => $this->importJob->id,
                'exception' => $e->getTraceAsString()
            ]);

            $this->importJob->markAsFailed($e->getMessage());

            // Clean up the uploaded file even on failure
            if (Storage::disk('local')->exists($this->importJob->file_path)) {
                Storage::disk('local')->delete($this->importJob->file_path);
            }
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        \Log::error('Product import job failed critically: ' . $exception->getMessage(), [
            'import_job_id' => $this->importJob->id,
            'exception' => $exception->getTraceAsString()
        ]);

        $this->importJob->markAsFailed('Job failed: ' . $exception->getMessage());
    }
}
