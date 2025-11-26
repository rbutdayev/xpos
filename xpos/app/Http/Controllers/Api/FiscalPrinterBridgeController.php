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
            'response' => 'nullable|array',
        ]);

        $job->markAsCompleted(
            $validated['fiscal_number'],
            $validated['response'] ?? null
        );

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
        ]);

        $errorMessage = $validated['error'];

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
}
