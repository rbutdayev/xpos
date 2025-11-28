<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FiscalPrinterBridgeToken;
use App\Models\FiscalPrinterJob;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class FiscalPrinterBridgeController extends Controller
{
    /**
     * Authenticate bridge from token in request
     */
    private function authenticateBridge(Request $request): ?FiscalPrinterBridgeToken
    {
        $token = $request->bearerToken();

        if (!$token) {
            return null;
        }

        $bridgeToken = FiscalPrinterBridgeToken::where('token', $token)
            ->where('status', 'active')
            ->first();

        return $bridgeToken;
    }

    /**
     * Register bridge (first-time setup or re-connection)
     */
    public function register(Request $request): JsonResponse
    {
        $bridge = $this->authenticateBridge($request);

        if (!$bridge) {
            return response()->json([
                'success' => false,
                'error' => 'Invalid or revoked token',
            ], 401);
        }

        // Update bridge info
        $bridge->updateHeartbeat(
            $request->input('version'),
            $request->input('info')
        );

        Log::info('Fiscal printer bridge registered', [
            'account_id' => $bridge->account_id,
            'bridge_name' => $bridge->name,
            'version' => $request->input('version'),
        ]);

        return response()->json([
            'success' => true,
            'account_id' => $bridge->account_id,
            'bridge_name' => $bridge->name,
            'poll_interval' => 2000, // milliseconds
        ]);
    }

    /**
     * Poll for pending print jobs
     */
    public function poll(Request $request): JsonResponse
    {
        $bridge = $this->authenticateBridge($request);

        if (!$bridge) {
            return response()->json([
                'success' => false,
                'error' => 'Invalid or revoked token',
            ], 401);
        }

        // Update heartbeat
        $bridge->updateHeartbeat();

        // Reset jobs stuck in processing state for more than 5 minutes
        FiscalPrinterJob::where('account_id', $bridge->account_id)
            ->where('status', FiscalPrinterJob::STATUS_PROCESSING)
            ->where('picked_up_at', '<', now()->subMinutes(5))
            ->update([
                'status' => FiscalPrinterJob::STATUS_PENDING,
                'picked_up_at' => null,
                'next_retry_at' => now()->addSeconds(30), // Retry after 30 seconds
            ]);

        // Get pending jobs for this account
        $jobs = FiscalPrinterJob::where('account_id', $bridge->account_id)
            ->where('status', FiscalPrinterJob::STATUS_PENDING)
            ->where(function ($query) {
                // Either no retry time set, or retry time has passed
                $query->whereNull('next_retry_at')
                    ->orWhere('next_retry_at', '<=', now());
            })
            ->orderBy('created_at', 'asc')
            ->limit(5) // Process up to 5 jobs at once
            ->get();

        if ($jobs->isEmpty()) {
            return response()->json([
                'success' => true,
                'jobs' => [],
            ]);
        }

        // Mark jobs as processing
        foreach ($jobs as $job) {
            $job->markAsProcessing();
        }

        return response()->json([
            'success' => true,
            'jobs' => $jobs->map(function ($job) {
                return [
                    'id' => $job->id,
                    'sale_id' => $job->sale_id,
                    'return_id' => $job->return_id,
                    'operation_type' => $job->operation_type ?? 'sale',
                    'provider' => $job->provider,
                    'request_data' => $job->request_data,
                    'retry_count' => $job->retry_count,
                ];
            }),
        ]);
    }

    /**
     * Heartbeat - keep bridge connection alive
     */
    public function heartbeat(Request $request): JsonResponse
    {
        $bridge = $this->authenticateBridge($request);

        if (!$bridge) {
            return response()->json([
                'success' => false,
                'error' => 'Invalid or revoked token',
            ], 401);
        }

        $bridge->updateHeartbeat(
            $request->input('version'),
            $request->input('info')
        );

        return response()->json([
            'success' => true,
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Mark job as completed
     */
    public function completeJob(Request $request, int $jobId): JsonResponse
    {
        $bridge = $this->authenticateBridge($request);

        if (!$bridge) {
            return response()->json([
                'success' => false,
                'error' => 'Invalid or revoked token',
            ], 401);
        }

        $job = FiscalPrinterJob::where('id', $jobId)
            ->where('account_id', $bridge->account_id)
            ->first();

        if (!$job) {
            return response()->json([
                'success' => false,
                'error' => 'Job not found',
            ], 404);
        }

        $validated = $request->validate([
            'fiscal_number' => 'required|string',
            'fiscal_document_id' => 'nullable|string',
            'response' => 'nullable|array',
            'response_data' => 'nullable|array',
        ]);

        $job->markAsCompleted(
            $validated['fiscal_number'],
            $validated['fiscal_document_id'] ?? null,
            $validated['response'] ?? null
        );

        // Store response_data if provided
        if (isset($validated['response_data'])) {
            $job->update(['response_data' => $validated['response_data']]);
        }

        Log::info('Fiscal printer job completed', [
            'job_id' => $job->id,
            'sale_id' => $job->sale_id,
            'fiscal_number' => $validated['fiscal_number'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Job marked as completed',
        ]);
    }

    /**
     * Mark shift operation job as completed
     */
    public function completeShiftJob(Request $request, int $jobId): JsonResponse
    {
        $bridge = $this->authenticateBridge($request);

        if (!$bridge) {
            return response()->json([
                'success' => false,
                'error' => 'Invalid or revoked token',
            ], 401);
        }

        $job = FiscalPrinterJob::where('id', $jobId)
            ->where('account_id', $bridge->account_id)
            ->first();

        if (!$job) {
            return response()->json([
                'success' => false,
                'error' => 'Job not found',
            ], 404);
        }

        $validated = $request->validate([
            'response' => 'nullable|array',
            'response_data' => 'nullable|array',
        ]);

        // Use the shift-specific completion method
        $job->markShiftOperationCompleted($validated['response_data'] ?? $validated['response'] ?? null);

        Log::info('Shift operation completed', [
            'job_id' => $job->id,
            'operation_type' => $job->operation_type,
            'account_id' => $job->account_id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Shift operation completed',
        ]);
    }

    /**
     * Mark job as failed
     */
    public function failJob(Request $request, int $jobId): JsonResponse
    {
        $bridge = $this->authenticateBridge($request);

        if (!$bridge) {
            return response()->json([
                'success' => false,
                'error' => 'Invalid or revoked token',
            ], 401);
        }

        $job = FiscalPrinterJob::where('id', $jobId)
            ->where('account_id', $bridge->account_id)
            ->first();

        if (!$job) {
            return response()->json([
                'success' => false,
                'error' => 'Job not found',
            ], 404);
        }

        $validated = $request->validate([
            'error' => 'required|string',
            'response_data' => 'nullable|array',
        ]);

        $errorMessage = $validated['error'];

        // Store response_data if provided (helpful for debugging)
        if (isset($validated['response_data'])) {
            $job->update(['response_data' => $validated['response_data']]);
        }

        // Check if this is a non-retriable error (like duplicate sale)
        $isRetriable = !FiscalPrinterJob::isNonRetriableError($errorMessage);

        $job->markAsFailed($errorMessage, $isRetriable);

        Log::error('Fiscal printer job failed', [
            'job_id' => $job->id,
            'sale_id' => $job->sale_id,
            'error' => $errorMessage,
            'retry_count' => $job->retry_count,
            'is_retriable' => $isRetriable,
        ]);

        // Auto-retry if possible
        if ($job->canRetry()) {
            $job->retry();
            Log::info('Fiscal printer job queued for retry', [
                'job_id' => $job->id,
                'retry_count' => $job->retry_count,
                'next_retry_at' => $job->next_retry_at,
            ]);
        } else {
            $reason = !$isRetriable ? 'non-retriable error' : 'max retries reached';
            Log::warning('Fiscal printer job will not be retried', [
                'job_id' => $job->id,
                'reason' => $reason,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Job marked as failed',
            'can_retry' => $job->canRetry(),
            'is_retriable' => $isRetriable,
        ]);
    }

    /**
     * Get shift status request configuration for agent
     */
    public function getShiftStatusRequest(Request $request): JsonResponse
    {
        $bridge = $this->authenticateBridge($request);

        if (!$bridge) {
            return response()->json([
                'success' => false,
                'error' => 'Invalid or revoked token',
            ], 401);
        }

        // Get active fiscal printer config
        $config = \App\Models\FiscalPrinterConfig::where('account_id', $bridge->account_id)
            ->where('is_active', true)
            ->first();

        if (!$config || !$config->isConfigured()) {
            return response()->json([
                'success' => false,
                'error' => 'Fiscal printer not configured',
            ], 404);
        }

        // Use FiscalPrinterService to format the request
        $service = app(\App\Services\FiscalPrinterService::class);

        try {
            $requestData = $service->formatShiftOperationRequest($config, 'shift_status');

            return response()->json([
                'success' => true,
                'request_data' => $requestData,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to generate shift status request', [
                'account_id' => $bridge->account_id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to generate shift status request',
            ], 500);
        }
    }

    /**
     * Receive shift status update from agent
     */
    public function pushStatus(Request $request): JsonResponse
    {
        $bridge = $this->authenticateBridge($request);

        if (!$bridge) {
            return response()->json([
                'success' => false,
                'error' => 'Invalid or revoked token',
            ], 401);
        }

        $validated = $request->validate([
            'shift_open' => 'required|boolean',
            'shift_opened_at' => 'nullable|string',
            'provider' => 'required|string',
        ]);

        // Store in Redis with 2-minute TTL (for fast frontend access)
        $cacheKey = "shift_status:{$bridge->account_id}";
        $statusData = [
            'shift_open' => $validated['shift_open'],
            'shift_opened_at' => $validated['shift_opened_at'],
            'provider' => $validated['provider'],
            'last_updated' => now()->toIso8601String(),
        ];

        \Illuminate\Support\Facades\Cache::put($cacheKey, $statusData, 120); // 2 minutes

        // Also update the database so shift management page shows correct status
        $config = \App\Models\FiscalPrinterConfig::where('account_id', $bridge->account_id)
            ->where('is_active', true)
            ->first();

        if ($config) {
            $updateData = ['shift_open' => $validated['shift_open']];

            // Parse shift_opened_at if provided
            if ($validated['shift_open'] && $validated['shift_opened_at']) {
                try {
                    // Parse different date formats
                    // Printer returns time in Azerbaijan local time (UTC+4)
                    if (str_contains($validated['shift_opened_at'], '.')) {
                        // Format: "d.m.Y H:i:s" (e.g., "27.11.2025 17:39:26")
                        // Parse as Azerbaijan time, then Laravel will handle storage
                        $updateData['shift_opened_at'] = \Carbon\Carbon::createFromFormat(
                            'd.m.Y H:i:s',
                            $validated['shift_opened_at'],
                            'Asia/Baku'
                        )->setTimezone('UTC'); // Convert to UTC for storage
                    } else {
                        // ISO format or other
                        $updateData['shift_opened_at'] = \Carbon\Carbon::parse(
                            $validated['shift_opened_at'],
                            'Asia/Baku'
                        )->setTimezone('UTC');
                    }
                } catch (\Exception $e) {
                    Log::warning('Failed to parse shift open time from agent', [
                        'time' => $validated['shift_opened_at'],
                        'error' => $e->getMessage()
                    ]);
                }
            } elseif (!$validated['shift_open']) {
                // If shift is closed, clear the opened_at timestamp
                $updateData['shift_opened_at'] = null;
            }

            $config->update($updateData);

            Log::debug('Shift status updated in database and cache', [
                'account_id' => $bridge->account_id,
                'shift_open' => $validated['shift_open'],
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Status updated',
        ]);
    }
}
