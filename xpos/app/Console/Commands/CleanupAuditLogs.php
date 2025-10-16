<?php

namespace App\Console\Commands;

use App\Models\AuditLog;
use Carbon\Carbon;
use Illuminate\Console\Command;

class CleanupAuditLogs extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'audit:cleanup {--days=30 : Number of days to keep audit logs}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clean up old audit logs (default: older than 30 days)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $days = (int) $this->option('days');
        
        if ($days < 1) {
            $this->error('Days must be a positive number.');
            return self::FAILURE;
        }

        $cutoffDate = Carbon::now()->subDays($days);
        
        $this->info("Cleaning up audit logs older than {$days} days (before {$cutoffDate->format('Y-m-d H:i:s')})...");
        
        // Count logs to be deleted
        $count = AuditLog::where('created_at', '<', $cutoffDate)->count();
        
        if ($count === 0) {
            $this->info('No old audit logs found to cleanup.');
            return self::SUCCESS;
        }
        
        $this->info("Found {$count} audit logs to delete.");
        
        if ($this->confirm("Are you sure you want to delete {$count} audit logs?", true)) {
            // Delete in chunks to avoid memory issues
            $deleted = 0;
            $chunkSize = 1000;
            
            do {
                $deletedChunk = AuditLog::where('created_at', '<', $cutoffDate)
                    ->limit($chunkSize)
                    ->delete();
                    
                $deleted += $deletedChunk;
                
                if ($deletedChunk > 0) {
                    $this->info("Deleted {$deleted}/{$count} audit logs...");
                }
                
            } while ($deletedChunk > 0);
            
            $this->info("✅ Successfully deleted {$deleted} audit logs older than {$days} days.");
            
            // Log the cleanup action
            AuditLog::log(
                'cleanup',
                'AuditLog',
                null,
                [
                    'description' => "Audit log təmizliyi: {$deleted} qeyd silindi (>{$days} gün köhnə)",
                    'old_values' => [
                        'deleted_count' => $deleted,
                        'cutoff_date' => $cutoffDate->toDateTimeString(),
                        'retention_days' => $days
                    ]
                ]
            );
            
        } else {
            $this->info('Cleanup cancelled.');
        }
        
        return self::SUCCESS;
    }
}
