<?php

namespace App\Http\Middleware;

use App\Models\KioskDeviceToken;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class KioskAuthMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        if (!$token) {
            return response()->json([
                'success' => false,
                'error' => 'No bearer token provided'
            ], 401);
        }

        $kioskToken = KioskDeviceToken::where('token', $token)
            ->where('status', 'active')
            ->first();

        if (!$kioskToken) {
            return response()->json([
                'success' => false,
                'error' => 'Invalid or revoked token'
            ], 401);
        }

        // Set account context (similar to account.access middleware)
        $request->merge([
            'kiosk_account_id' => $kioskToken->account_id,
            'kiosk_branch_id' => $kioskToken->branch_id,
            'kiosk_device_id' => $kioskToken->id,
        ]);

        // Update heartbeat (throttled to avoid DB hits on every request)
        // Only update if last heartbeat was more than 30 seconds ago
        if (!$kioskToken->last_heartbeat ||
            $kioskToken->last_heartbeat->diffInSeconds(now()) > 30) {
            $kioskToken->updateHeartbeat();
        }

        return $next($request);
    }
}
