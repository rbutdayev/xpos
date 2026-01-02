<?php

namespace App\Http\Controllers\Kiosk;

use App\Http\Controllers\Controller;
use App\Models\KioskDeviceToken;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class KioskAuthController extends Controller
{
    /**
     * Register kiosk device (initial connection)
     */
    public function register(Request $request): JsonResponse
    {
        // Authentication is done by KioskAuthMiddleware
        $accountId = $request->input('kiosk_account_id');
        $branchId = $request->input('kiosk_branch_id');
        $deviceId = $request->input('kiosk_device_id');

        // Get the kiosk token that was authenticated
        $kioskToken = KioskDeviceToken::find($deviceId);

        if (!$kioskToken) {
            return response()->json([
                'success' => false,
                'error' => 'Token not found'
            ], 404);
        }

        // Validate request
        $validated = $request->validate([
            'device_name' => 'nullable|string|max:100',
            'version' => 'nullable|string|max:50',
            'platform' => 'nullable|string|max:50',
        ]);

        // Update device info if provided
        $deviceInfo = [];
        if (isset($validated['version'])) {
            $deviceInfo['version'] = $validated['version'];
        }
        if (isset($validated['platform'])) {
            $deviceInfo['platform'] = $validated['platform'];
        }

        if (!empty($deviceInfo)) {
            $kioskToken->update([
                'device_info' => array_merge($kioskToken->device_info ?? [], $deviceInfo)
            ]);
        }

        // Update device name if provided and different
        if (isset($validated['device_name']) && $validated['device_name'] !== $kioskToken->device_name) {
            $kioskToken->update(['device_name' => $validated['device_name']]);
        }

        Log::info('Kiosk device registered', [
            'account_id' => $accountId,
            'device_id' => $deviceId,
            'device_name' => $kioskToken->device_name,
            'version' => $validated['version'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'account_id' => $accountId,
            'branch_id' => $branchId,
            'device_name' => $kioskToken->device_name,
            'sync_config' => [
                'sync_interval_seconds' => 300,      // 5 minutes
                'heartbeat_interval_seconds' => 30,  // 30 seconds
                'max_retry_attempts' => 3,
            ]
        ]);
    }

    /**
     * Heartbeat - keep device connection alive
     */
    public function heartbeat(Request $request): JsonResponse
    {
        $deviceId = $request->input('kiosk_device_id');

        $kioskToken = KioskDeviceToken::find($deviceId);

        if (!$kioskToken) {
            return response()->json([
                'success' => false,
                'error' => 'Token not found'
            ], 404);
        }

        // Update heartbeat (already done in middleware, but we can update device info here)
        $validated = $request->validate([
            'version' => 'nullable|string|max:50',
            'info' => 'nullable|array',
        ]);

        if (!empty($validated)) {
            $deviceInfo = $kioskToken->device_info ?? [];

            if (isset($validated['version'])) {
                $deviceInfo['version'] = $validated['version'];
            }

            if (isset($validated['info'])) {
                $deviceInfo = array_merge($deviceInfo, $validated['info']);
            }

            $kioskToken->update(['device_info' => $deviceInfo]);
        }

        return response()->json([
            'success' => true,
            'timestamp' => now()->toIso8601String(),
            'online' => true,
        ]);
    }

    /**
     * Disconnect - graceful device disconnect
     */
    public function disconnect(Request $request): JsonResponse
    {
        $deviceId = $request->input('kiosk_device_id');
        $accountId = $request->input('kiosk_account_id');

        $kioskToken = KioskDeviceToken::find($deviceId);

        if (!$kioskToken) {
            return response()->json([
                'success' => false,
                'error' => 'Token not found'
            ], 404);
        }

        Log::info('Kiosk device disconnected', [
            'account_id' => $accountId,
            'device_id' => $deviceId,
            'device_name' => $kioskToken->device_name,
        ]);

        // We don't revoke the token, just log the disconnect
        // The heartbeat timestamp will show when it was last seen

        return response()->json([
            'success' => true,
            'message' => 'Device disconnected successfully'
        ]);
    }
}
