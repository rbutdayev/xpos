<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\SystemHealthService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class SystemHealthController extends Controller
{
    protected SystemHealthService $healthService;

    public function __construct(SystemHealthService $healthService)
    {
        $this->middleware('auth');
        $this->middleware('superadmin');
        $this->healthService = $healthService;
    }

    /**
     * Show the system health dashboard
     */
    public function index(): Response
    {
        try {
            $metrics = $this->healthService->getSystemMetrics();
            $accountUsage = $this->healthService->getAccountResourceUsage();
            $performanceData = $this->healthService->getPerformanceMetrics(24);
            $overallHealth = $this->healthService->getOverallHealthStatus();

            return Inertia::render('SuperAdmin/SystemHealth', [
                'initialMetrics' => [
                    'system' => $metrics,
                    'accounts' => $accountUsage,
                    'performance' => $performanceData,
                    'overall' => $overallHealth,
                ],
                'refreshInterval' => 30000, // 30 seconds
            ]);
        } catch (\Exception $e) {
            \Log::error('System Health Dashboard Error: ' . $e->getMessage());
            
            return Inertia::render('SuperAdmin/SystemHealth', [
                'initialMetrics' => null,
                'error' => 'Sistem səhiyyə məlumatları yüklənərkən xəta baş verdi: ' . $e->getMessage(),
                'refreshInterval' => 30000,
            ]);
        }
    }

    /**
     * Get real-time system metrics (API endpoint)
     */
    public function metrics(): JsonResponse
    {
        try {
            $metrics = $this->healthService->getSystemMetrics();
            $overallHealth = $this->healthService->getOverallHealthStatus();

            return response()->json([
                'success' => true,
                'data' => [
                    'system' => $metrics,
                    'overall' => $overallHealth,
                    'timestamp' => now()->toISOString(),
                ],
            ]);
        } catch (\Exception $e) {
            \Log::error('System Metrics API Error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'error' => 'Sistem metriklərini əldə edərkən xəta baş verdi',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get account resource usage data
     */
    public function accountUsage(): JsonResponse
    {
        try {
            $accountUsage = $this->healthService->getAccountResourceUsage();

            return response()->json([
                'success' => true,
                'data' => $accountUsage,
                'timestamp' => now()->toISOString(),
            ]);
        } catch (\Exception $e) {
            \Log::error('Account Usage API Error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'error' => 'Hesab istifadə məlumatlarını əldə edərkən xəta baş verdi',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get performance metrics for charts
     */
    public function performance(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'hours' => 'nullable|integer|min:1|max:168', // Max 1 week
            ]);

            $hours = $validated['hours'] ?? 24;
            $performanceData = $this->healthService->getPerformanceMetrics($hours);

            return response()->json([
                'success' => true,
                'data' => $performanceData,
                'timestamp' => now()->toISOString(),
            ]);
        } catch (\Exception $e) {
            \Log::error('Performance Metrics API Error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'error' => 'Performans məlumatlarını əldə edərkən xəta baş verdi',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get queue status
     */
    public function queueStatus(): JsonResponse
    {
        try {
            $metrics = $this->healthService->getSystemMetrics();
            $queueStatus = $metrics['queue_status'] ?? [];

            return response()->json([
                'success' => true,
                'data' => $queueStatus,
                'timestamp' => now()->toISOString(),
            ]);
        } catch (\Exception $e) {
            \Log::error('Queue Status API Error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'error' => 'Növbə statusunu əldə edərkən xəta baş verdi',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get overall system health status
     */
    public function healthCheck(): JsonResponse
    {
        try {
            $overallHealth = $this->healthService->getOverallHealthStatus();

            return response()->json([
                'success' => true,
                'data' => $overallHealth,
                'timestamp' => now()->toISOString(),
            ]);
        } catch (\Exception $e) {
            \Log::error('Health Check API Error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'error' => 'Səhiyyə yoxlanışında xəta baş verdi',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Force refresh all cached metrics
     */
    public function refreshMetrics(): JsonResponse
    {
        try {
            // Clear relevant caches
            \Cache::forget('error_rate_last_hour');
            \Cache::forget('avg_response_time_last_hour');
            \Cache::forget('cache_health_check');
            
            // Get fresh metrics
            $metrics = $this->healthService->getSystemMetrics();
            $overallHealth = $this->healthService->getOverallHealthStatus();

            return response()->json([
                'success' => true,
                'message' => 'Məlumatlar yeniləndi',
                'data' => [
                    'system' => $metrics,
                    'overall' => $overallHealth,
                    'timestamp' => now()->toISOString(),
                ],
            ]);
        } catch (\Exception $e) {
            \Log::error('Refresh Metrics Error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'error' => 'Məlumatları yeniləyərkən xəta baş verdi',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Export system health report
     */
    public function exportReport(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'format' => 'required|in:json,csv',
                'hours' => 'nullable|integer|min:1|max:720', // Max 30 days
            ]);

            $hours = $validated['hours'] ?? 24;
            $format = $validated['format'];

            $data = [
                'report_generated' => now()->toISOString(),
                'time_period' => "{$hours} hours",
                'system_metrics' => $this->healthService->getSystemMetrics(),
                'account_usage' => $this->healthService->getAccountResourceUsage(),
                'performance_data' => $this->healthService->getPerformanceMetrics($hours),
                'overall_health' => $this->healthService->getOverallHealthStatus(),
            ];

            if ($format === 'json') {
                return response()->json([
                    'success' => true,
                    'data' => $data,
                    'filename' => 'system_health_report_' . now()->format('Y_m_d_H_i_s') . '.json',
                ]);
            }

            // For CSV format, flatten the data
            // This would need more complex implementation for proper CSV export
            return response()->json([
                'success' => true,
                'message' => 'CSV formatı hazırda dəstəklənmir',
                'data' => null,
            ], 501);

        } catch (\Exception $e) {
            \Log::error('Export Report Error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'error' => 'Hesabat ixrac edilərkən xəta baş verdi',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}