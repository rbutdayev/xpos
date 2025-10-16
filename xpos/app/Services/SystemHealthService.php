<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Artisan;
use App\Models\User;
use App\Models\Account;
use Illuminate\Queue\Jobs\Job;
use Illuminate\Support\Facades\Queue;

class SystemHealthService
{
    /**
     * Get comprehensive system metrics
     */
    public function getSystemMetrics(): array
    {
        return [
            'cpu_usage' => $this->getCpuUsage(),
            'memory_usage' => $this->getMemoryUsage(),
            'disk_usage' => $this->getDiskUsage(),
            'database_connections' => $this->getDatabaseConnections(),
            'active_sessions' => $this->getActiveSessions(),
            'queue_status' => $this->getQueueStatus(),
            'error_rate' => $this->getRecentErrorRate(),
            'response_time' => $this->getAverageResponseTime(),
            'cache_status' => $this->getCacheStatus(),
            'storage_health' => $this->getStorageHealth(),
        ];
    }

    /**
     * Get account resource usage overview
     */
    public function getAccountResourceUsage(): array
    {
        return Account::select([
                'id',
                'company_name',
                'subscription_plan',
                'is_active',
                'created_at'
            ])
            ->withCount([
                'users',
                'users as active_users_count' => function ($query) {
                    $query->where('status', 'active');
                }
            ])
            ->with(['users' => function ($query) {
                $query->select('account_id', 'last_login_at')
                    ->latest('last_login_at')
                    ->limit(1);
            }])
            ->get()
            ->map(function ($account) {
                return [
                    'id' => $account->id,
                    'name' => $account->company_name,
                    'plan' => $account->subscription_plan,
                    'status' => $account->is_active ? 'active' : 'suspended',
                    'total_users' => $account->users_count,
                    'active_users' => $account->active_users_count,
                    'last_activity' => $account->users->first()?->last_login_at,
                    'created_at' => $account->created_at,
                ];
            })
            ->toArray();
    }

    /**
     * Get performance metrics for charts
     */
    public function getPerformanceMetrics(int $hours = 24): array
    {
        $metrics = [];
        $now = now();
        
        for ($i = 0; $i < $hours; $i++) {
            $timestamp = $now->copy()->subHours($i);
            $cacheKey = "performance_metrics_{$timestamp->format('Y_m_d_H')}";
            
            $hourlyMetrics = Cache::get($cacheKey, [
                'timestamp' => $timestamp->toISOString(),
                'response_time' => rand(100, 500), // Mock data - replace with actual metrics
                'error_rate' => rand(0, 5),
                'requests' => rand(50, 200),
                'cpu_usage' => rand(30, 80),
                'memory_usage' => rand(40, 85),
            ]);
            
            $metrics[] = $hourlyMetrics;
        }
        
        return array_reverse($metrics);
    }

    /**
     * Get CPU usage percentage
     */
    private function getCpuUsage(): float
    {
        if (PHP_OS_FAMILY === 'Windows') {
            return 0.0; // Windows monitoring not implemented
        }
        
        $load = sys_getloadavg();
        return $load ? round($load[0] * 100, 2) : 0.0;
    }

    /**
     * Get memory usage percentage
     */
    private function getMemoryUsage(): float
    {
        $memoryLimit = $this->convertToBytes(ini_get('memory_limit'));
        $memoryUsage = memory_get_usage(true);
        
        return $memoryLimit > 0 ? round(($memoryUsage / $memoryLimit) * 100, 2) : 0.0;
    }

    /**
     * Get disk usage percentage
     */
    private function getDiskUsage(): float
    {
        $path = storage_path();
        $totalBytes = disk_total_space($path);
        $freeBytes = disk_free_space($path);
        
        if ($totalBytes && $freeBytes) {
            $usedBytes = $totalBytes - $freeBytes;
            return round(($usedBytes / $totalBytes) * 100, 2);
        }
        
        return 0.0;
    }

    /**
     * Get database connection count
     */
    private function getDatabaseConnections(): int
    {
        try {
            $result = DB::select('SHOW STATUS LIKE "Threads_connected"');
            return (int) ($result[0]->Value ?? 0);
        } catch (\Exception $e) {
            return 0;
        }
    }

    /**
     * Get active user sessions count
     */
    private function getActiveSessions(): int
    {
        return User::where('last_login_at', '>', now()->subMinutes(30))
            ->where('status', 'active')
            ->count();
    }

    /**
     * Get queue status
     */
    private function getQueueStatus(): array
    {
        try {
            $queues = ['default', 'high', 'low']; // Define your queue names
            $status = [];
            
            foreach ($queues as $queue) {
                $pending = DB::table('jobs')
                    ->where('queue', $queue)
                    ->count();
                    
                $failed = DB::table('failed_jobs')
                    ->where('queue', $queue)
                    ->count();
                
                $status[] = [
                    'name' => ucfirst($queue),
                    'pending' => $pending,
                    'failed' => $failed,
                    'status' => $failed > 0 ? 'warning' : 'healthy'
                ];
            }
            
            return $status;
        } catch (\Exception $e) {
            return [
                [
                    'name' => 'Default',
                    'pending' => 0,
                    'failed' => 0,
                    'status' => 'unknown'
                ]
            ];
        }
    }

    /**
     * Get recent error rate
     */
    private function getRecentErrorRate(): float
    {
        try {
            // This would typically query your error logging table
            // For now, return a mock value
            return (float) Cache::get('error_rate_last_hour', 0.0);
        } catch (\Exception $e) {
            return 0.0;
        }
    }

    /**
     * Get average response time
     */
    private function getAverageResponseTime(): float
    {
        try {
            // This would typically query your performance logs
            // For now, return a mock value
            return (float) Cache::get('avg_response_time_last_hour', 0.0);
        } catch (\Exception $e) {
            return 0.0;
        }
    }

    /**
     * Get cache status
     */
    private function getCacheStatus(): array
    {
        try {
            $cacheInfo = Cache::get('cache_health_check', [
                'status' => 'healthy',
                'hit_rate' => 85.5,
                'memory_usage' => 45.2
            ]);
            
            return $cacheInfo;
        } catch (\Exception $e) {
            return [
                'status' => 'error',
                'hit_rate' => 0,
                'memory_usage' => 0,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Get storage health status
     */
    private function getStorageHealth(): array
    {
        try {
            $status = [
                'local' => [
                    'status' => 'healthy',
                    'free_space' => disk_free_space(storage_path()),
                    'total_space' => disk_total_space(storage_path())
                ]
            ];
            
            // Check Azure storage if configured
            if (config('filesystems.disks.azure')) {
                $status['azure'] = [
                    'status' => 'healthy', // Would check actual connection
                    'configured' => true
                ];
            }
            
            return $status;
        } catch (\Exception $e) {
            return [
                'local' => [
                    'status' => 'error',
                    'error' => $e->getMessage()
                ]
            ];
        }
    }

    /**
     * Convert memory limit to bytes
     */
    private function convertToBytes(string $value): int
    {
        $value = trim($value);
        $last = strtolower($value[strlen($value) - 1]);
        $value = (int) $value;
        
        switch ($last) {
            case 'g':
                $value *= 1024;
            case 'm':
                $value *= 1024;
            case 'k':
                $value *= 1024;
        }
        
        return $value;
    }

    /**
     * Check if system is healthy overall
     */
    public function getOverallHealthStatus(): array
    {
        $metrics = $this->getSystemMetrics();
        $issues = [];
        $status = 'healthy';
        
        // Check critical thresholds
        if ($metrics['cpu_usage'] > 90) {
            $issues[] = 'High CPU usage detected';
            $status = 'critical';
        } elseif ($metrics['cpu_usage'] > 80) {
            $issues[] = 'Elevated CPU usage';
            $status = $status === 'healthy' ? 'warning' : $status;
        }
        
        if ($metrics['memory_usage'] > 95) {
            $issues[] = 'Critical memory usage';
            $status = 'critical';
        } elseif ($metrics['memory_usage'] > 85) {
            $issues[] = 'High memory usage';
            $status = $status === 'healthy' ? 'warning' : $status;
        }
        
        if ($metrics['disk_usage'] > 95) {
            $issues[] = 'Disk space critical';
            $status = 'critical';
        } elseif ($metrics['disk_usage'] > 90) {
            $issues[] = 'Low disk space';
            $status = $status === 'healthy' ? 'warning' : $status;
        }
        
        // Check queue status
        foreach ($metrics['queue_status'] as $queue) {
            if ($queue['failed'] > 10) {
                $issues[] = "High failed job count in {$queue['name']} queue";
                $status = $status === 'healthy' ? 'warning' : $status;
            }
        }
        
        return [
            'status' => $status,
            'issues' => $issues,
            'last_check' => now()->toISOString(),
        ];
    }
}