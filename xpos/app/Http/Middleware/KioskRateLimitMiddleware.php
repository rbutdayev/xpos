<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redis;
use Symfony\Component\HttpFoundation\Response;

class KioskRateLimitMiddleware
{
    /**
     * Rate limit configuration per endpoint type
     *
     * Format: [max_requests, window_in_seconds]
     */
    private const RATE_LIMITS = [
        'sync' => [10, 60],        // Sync endpoints: 10 req/min
        'sales' => [50, 60],       // Sales upload: 50 req/min
        'search' => [100, 60],     // Search endpoints: 100 req/min
        'default' => [30, 60],     // Default: 30 req/min
    ];

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  $limitType  Type of rate limit to apply (sync, sales, search, default)
     */
    public function handle(Request $request, Closure $next, string $limitType = 'default'): Response
    {
        // Get device ID from request (set by KioskAuthMiddleware)
        $deviceId = $request->input('kiosk_device_id');

        if (!$deviceId) {
            // If no device ID, middleware is misconfigured or not running after KioskAuthMiddleware
            return response()->json([
                'success' => false,
                'error' => 'Authentication required'
            ], 401);
        }

        // Get rate limit configuration
        $config = self::RATE_LIMITS[$limitType] ?? self::RATE_LIMITS['default'];
        [$maxRequests, $windowSeconds] = $config;

        // Create Redis key for this device and limit type
        $key = "kiosk_rate_limit:{$deviceId}:{$limitType}";

        try {
            // Get current count
            $current = Redis::get($key);

            if ($current === null) {
                // First request in this window
                Redis::setex($key, $windowSeconds, 1);
                $remaining = $maxRequests - 1;
            } else {
                $current = (int) $current;

                if ($current >= $maxRequests) {
                    // Rate limit exceeded
                    $retryAfter = Redis::ttl($key);

                    return response()->json([
                        'success' => false,
                        'error' => 'Rate limit exceeded',
                        'retry_after' => $retryAfter > 0 ? $retryAfter : $windowSeconds
                    ], 429)
                    ->header('Retry-After', $retryAfter > 0 ? $retryAfter : $windowSeconds)
                    ->header('X-RateLimit-Limit', $maxRequests)
                    ->header('X-RateLimit-Remaining', 0)
                    ->header('X-RateLimit-Reset', now()->addSeconds($retryAfter > 0 ? $retryAfter : $windowSeconds)->timestamp);
                }

                // Increment counter
                Redis::incr($key);
                $remaining = $maxRequests - ($current + 1);
            }

            // Add rate limit headers to response
            $response = $next($request);

            return $response
                ->header('X-RateLimit-Limit', $maxRequests)
                ->header('X-RateLimit-Remaining', max(0, $remaining))
                ->header('X-RateLimit-Reset', now()->addSeconds($windowSeconds)->timestamp);

        } catch (\Exception $e) {
            // If Redis fails, log error but allow request to proceed
            // This prevents Redis issues from breaking the kiosk
            \Log::error('Kiosk rate limit Redis error', [
                'device_id' => $deviceId,
                'error' => $e->getMessage()
            ]);

            return $next($request);
        }
    }
}
