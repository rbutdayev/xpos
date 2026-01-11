<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class RequestLogging
{
    /**
     * Handle an incoming request.
     * Adds correlation ID and logs request/response details for traceability across pods.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Generate or retrieve correlation ID (X-Request-ID header)
        $correlationId = $request->header('X-Request-ID') ?? Str::uuid()->toString();

        // Set correlation ID in request
        $request->headers->set('X-Request-ID', $correlationId);

        // Add correlation ID to Log context (will be included in all logs)
        Log::shareContext([
            'request_id' => $correlationId,
            'pod_name' => env('HOSTNAME', gethostname()),
            'user_id' => auth()->id(),
            'account_id' => auth()->check() ? auth()->user()->account_id : null,
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        // Log incoming request
        Log::info('Incoming request', [
            'method' => $request->method(),
            'url' => $request->fullUrl(),
            'route' => $request->route()?->getName(),
        ]);

        $startTime = microtime(true);

        // Handle request
        $response = $next($request);

        $duration = round((microtime(true) - $startTime) * 1000, 2);

        // Add correlation ID to response headers
        $response->headers->set('X-Request-ID', $correlationId);

        // Log response
        $logLevel = $response->getStatusCode() >= 500 ? 'error' :
                   ($response->getStatusCode() >= 400 ? 'warning' : 'info');

        Log::$logLevel('Request completed', [
            'status' => $response->getStatusCode(),
            'duration_ms' => $duration,
        ]);

        return $response;
    }

    /**
     * Handle task termination (for memory usage tracking).
     */
    public function terminate(Request $request, Response $response): void
    {
        // Log memory usage
        if (env('LOG_MEMORY_USAGE', false)) {
            Log::debug('Request memory usage', [
                'memory_mb' => round(memory_get_peak_usage(true) / 1024 / 1024, 2),
            ]);
        }
    }
}
