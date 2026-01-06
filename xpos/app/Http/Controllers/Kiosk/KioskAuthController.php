<?php

namespace App\Http\Controllers\Kiosk;

use App\Http\Controllers\Controller;
use App\Models\KioskDeviceToken;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
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

    /**
     * Login user to kiosk with PIN
     */
    public function loginWithPin(Request $request): JsonResponse
    {
        $accountId = $request->input('kiosk_account_id');
        $branchId = $request->input('kiosk_branch_id');

        // Validate request
        $validated = $request->validate([
            'user_id' => 'required|integer',
            'pin' => 'required|string|min:4|max:6',
        ]);

        // Find user by ID and account_id
        $user = User::where('id', $validated['user_id'])
            ->where('account_id', $accountId)
            ->first();

        if (!$user) {
            Log::warning('Kiosk login failed: User not found', [
                'user_id' => $validated['user_id'],
                'account_id' => $accountId,
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Invalid user ID or PIN'
            ], 401);
        }

        // Check if kiosk is enabled for this user
        if (!$user->kiosk_enabled) {
            Log::warning('Kiosk login failed: Kiosk not enabled', [
                'user_id' => $user->id,
                'account_id' => $accountId,
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Kiosk access not enabled for this user'
            ], 403);
        }

        // Verify PIN
        if (!Hash::check($validated['pin'], $user->kiosk_pin)) {
            Log::warning('Kiosk login failed: Invalid PIN', [
                'user_id' => $user->id,
                'account_id' => $accountId,
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Invalid user ID or PIN'
            ], 401);
        }

        // Check if user is assigned to this branch
        if ($user->branch_id !== $branchId) {
            Log::warning('Kiosk login failed: User not assigned to branch', [
                'user_id' => $user->id,
                'user_branch_id' => $user->branch_id,
                'kiosk_branch_id' => $branchId,
            ]);

            return response()->json([
                'success' => false,
                'error' => 'You are not assigned to this branch. Please contact your manager.'
            ], 403);
        }

        Log::info('Kiosk user logged in', [
            'user_id' => $user->id,
            'account_id' => $accountId,
            'branch_id' => $branchId,
        ]);

        return response()->json([
            'success' => true,
            'user_id' => $user->id,
            'user_name' => $user->name,
            'branch_id' => $user->branch_id,
        ]);
    }

    /**
     * Get all kiosk-enabled users for offline sync
     */
    public function getKioskUsers(Request $request): JsonResponse
    {
        $accountId = $request->input('kiosk_account_id');

        // Get all kiosk-enabled users for this account
        $users = User::where('account_id', $accountId)
            ->where('kiosk_enabled', true)
            ->whereNotNull('kiosk_pin')
            ->select([
                'id',
                'account_id',
                'name',
                'kiosk_enabled',
                'kiosk_pin', // Hashed PIN for offline verification
                'branch_id',
                'updated_at'
            ])
            ->get();

        Log::info('Kiosk users fetched for sync', [
            'account_id' => $accountId,
            'user_count' => $users->count(),
        ]);

        return response()->json([
            'success' => true,
            'users' => $users,
        ]);
    }
}
