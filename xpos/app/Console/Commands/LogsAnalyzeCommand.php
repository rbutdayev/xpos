<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class LogsAnalyzeCommand extends Command
{
    protected $signature = 'logs:analyze
                            {--request-id= : Filter by request ID}
                            {--status= : Filter by HTTP status code}
                            {--user= : Filter by user ID}
                            {--account= : Filter by account ID}
                            {--level= : Filter by log level (error, warning, info)}
                            {--tail=100 : Number of lines to analyze}
                            {--pod= : Filter by pod name}';

    protected $description = 'Analyze application logs with filtering options';

    public function handle(): int
    {
        $logFile = storage_path('logs/laravel.log');

        if (!File::exists($logFile)) {
            $this->error('Log file not found: ' . $logFile);
            return 1;
        }

        $this->info('Analyzing logs from: ' . $logFile);
        $this->info('Pod: ' . env('HOSTNAME', gethostname()));
        $this->newLine();

        $lines = $this->getLogLines($logFile);
        $filteredLines = $this->filterLines($lines);

        if (empty($filteredLines)) {
            $this->warn('No matching log entries found.');
            return 0;
        }

        $this->displayResults($filteredLines);

        return 0;
    }

    private function getLogLines(string $logFile): array
    {
        $tail = (int) $this->option('tail');

        // Use tail command for efficiency on large files
        $output = shell_exec("tail -n {$tail} " . escapeshellarg($logFile));

        return array_filter(explode("\n", $output));
    }

    private function filterLines(array $lines): array
    {
        $filtered = [];

        foreach ($lines as $line) {
            if ($this->matchesFilters($line)) {
                $filtered[] = $line;
            }
        }

        return $filtered;
    }

    private function matchesFilters(string $line): bool
    {
        if ($requestId = $this->option('request-id')) {
            if (!str_contains($line, $requestId)) {
                return false;
            }
        }

        if ($status = $this->option('status')) {
            if (!str_contains($line, '"status":' . $status) &&
                !str_contains($line, 'status=' . $status)) {
                return false;
            }
        }

        if ($userId = $this->option('user')) {
            if (!str_contains($line, '"user_id":' . $userId) &&
                !str_contains($line, 'user_id=' . $userId)) {
                return false;
            }
        }

        if ($accountId = $this->option('account')) {
            if (!str_contains($line, '"account_id":' . $accountId) &&
                !str_contains($line, 'account_id=' . $accountId)) {
                return false;
            }
        }

        if ($level = $this->option('level')) {
            if (!str_contains(strtolower($line), strtolower($level))) {
                return false;
            }
        }

        if ($pod = $this->option('pod')) {
            if (!str_contains($line, '"pod_name":"' . $pod . '"')) {
                return false;
            }
        }

        return true;
    }

    private function displayResults(array $lines): void
    {
        $this->info('Found ' . count($lines) . ' matching entries:');
        $this->newLine();

        foreach ($lines as $line) {
            // Try to parse as JSON for better formatting
            if (str_starts_with(ltrim($line), '{')) {
                $json = json_decode($line, true);
                if ($json) {
                    $this->displayJsonLog($json);
                    continue;
                }
            }

            // Display as plain text
            $this->line($line);
        }
    }

    private function displayJsonLog(array $log): void
    {
        $level = strtoupper($log['level'] ?? 'INFO');
        $message = $log['message'] ?? 'N/A';
        $requestId = $log['context']['request_id'] ?? 'N/A';
        $podName = $log['context']['pod_name'] ?? 'N/A';
        $status = $log['context']['status'] ?? '';
        $duration = $log['context']['duration_ms'] ?? '';

        $color = match($level) {
            'ERROR' => 'red',
            'WARNING' => 'yellow',
            default => 'green',
        };

        $this->line("<fg={$color}>[{$level}]</> {$message}");
        $this->line("  Request ID: {$requestId}");
        $this->line("  Pod: {$podName}");

        if ($status) {
            $this->line("  Status: {$status}");
        }
        if ($duration) {
            $this->line("  Duration: {$duration}ms");
        }

        $this->newLine();
    }
}
