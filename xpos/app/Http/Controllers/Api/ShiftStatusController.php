<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Gate;

class ShiftStatusController extends Controller
{
    /**
     * Get current shift status for authenticated user's account
     */
    public function getStatus(Request $request): JsonResponse
    {
        Gate::authorize('access-account-data');

        $accountId = auth()->user()->account_id;

        // Get status from Redis cache
        $cacheKey = "shift_status:{$accountId}";
        $statusData = Cache::get($cacheKey);

        if (!$statusData) {
            // No status in cache - agent is offline or hasn't checked yet
            return response()->json([
                'online' => false,
                'shift_open' => null,
                'shift_opened_at' => null,
                'last_updated' => null,
                'provider' => null,
            ]);
        }

        // Return cached status
        return response()->json([
            'online' => true,
            'shift_open' => $statusData['shift_open'] ?? false,
            'shift_opened_at' => $statusData['shift_opened_at'] ?? null,
            'last_updated' => $statusData['last_updated'] ?? null,
            'provider' => $statusData['provider'] ?? null,
        ]);
    }
}
