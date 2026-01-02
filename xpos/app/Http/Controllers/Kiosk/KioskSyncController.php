<?php

namespace App\Http\Controllers\Kiosk;

use App\Http\Controllers\Controller;
use App\Services\KioskSyncService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class KioskSyncController extends Controller
{
    protected KioskSyncService $syncService;

    public function __construct(KioskSyncService $syncService)
    {
        $this->syncService = $syncService;
    }

    /**
     * Sync products delta - returns products changed since timestamp
     * GET /api/kiosk/sync/products/delta?since=2024-01-01T00:00:00Z
     */
    public function syncProductsDelta(Request $request): JsonResponse
    {
        $accountId = $request->input('kiosk_account_id');

        if (!$accountId) {
            return response()->json([
                'success' => false,
                'error' => 'Account ID not found in request context',
            ], 400);
        }

        $since = $request->query('since');

        try {
            // Cache key includes account_id and since timestamp for proper segmentation
            $cacheKey = "kiosk_products_delta:{$accountId}:" . md5($since ?? 'all');

            // Cache for 5 minutes (300 seconds)
            $data = Cache::remember($cacheKey, 300, function () use ($accountId, $since) {
                return $this->syncService->getProductsDelta($accountId, $since);
            });

            return response()->json([
                'success' => true,
                'products' => $data['products'],
                'deleted_ids' => $data['deleted_ids'],
                'sync_timestamp' => $data['sync_timestamp'],
                'total_records' => $data['total_records'],
            ]);
        } catch (\Exception $e) {
            Log::error('Kiosk products delta sync failed', [
                'account_id' => $accountId,
                'since' => $since,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to sync products',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Sync customers delta - returns customers changed since timestamp
     * GET /api/kiosk/sync/customers/delta?since=2024-01-01T00:00:00Z
     */
    public function syncCustomersDelta(Request $request): JsonResponse
    {
        $accountId = $request->input('kiosk_account_id');

        if (!$accountId) {
            return response()->json([
                'success' => false,
                'error' => 'Account ID not found in request context',
            ], 400);
        }

        $since = $request->query('since');

        try {
            // Cache key includes account_id and since timestamp for proper segmentation
            $cacheKey = "kiosk_customers_delta:{$accountId}:" . md5($since ?? 'all');

            // Cache for 5 minutes (300 seconds)
            $data = Cache::remember($cacheKey, 300, function () use ($accountId, $since) {
                return $this->syncService->getCustomersDelta($accountId, $since);
            });

            return response()->json([
                'success' => true,
                'customers' => $data['customers'],
                'deleted_ids' => $data['deleted_ids'],
                'sync_timestamp' => $data['sync_timestamp'],
                'total_records' => $data['total_records'],
            ]);
        } catch (\Exception $e) {
            Log::error('Kiosk customers delta sync failed', [
                'account_id' => $accountId,
                'since' => $since,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to sync customers',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get sync configuration
     * GET /api/kiosk/sync/config
     */
    public function getConfig(Request $request): JsonResponse
    {
        try {
            $config = $this->syncService->getSyncConfig();

            return response()->json([
                'success' => true,
                'config' => $config,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get kiosk sync config', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to get sync configuration',
            ], 500);
        }
    }

    /**
     * Get fiscal printer configuration for kiosk
     * GET /api/kiosk/fiscal-config
     */
    public function getFiscalConfig(Request $request): JsonResponse
    {
        $accountId = $request->input('kiosk_account_id');

        if (!$accountId) {
            return response()->json([
                'success' => false,
                'error' => 'Account ID not found in request context',
            ], 400);
        }

        try {
            // Cache fiscal config for 5 minutes
            $cacheKey = "kiosk_fiscal_config:{$accountId}";

            $config = Cache::remember($cacheKey, 300, function () use ($accountId) {
                return $this->syncService->getFiscalConfig($accountId);
            });

            if (!$config) {
                return response()->json([
                    'success' => false,
                    'error' => 'Fiscal printer not configured for this account',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'config' => $config,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get fiscal config for kiosk', [
                'account_id' => $accountId,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to get fiscal configuration',
            ], 500);
        }
    }
}
