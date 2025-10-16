<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class DatabaseHealthCheck
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Skip health check for error pages and static assets
        if ($request->is('errors/*') || $request->is('css/*') || $request->is('js/*') || $request->is('images/*')) {
            return $next($request);
        }

        // Check database connection with cache to avoid constant checks
        $cacheKey = 'database_health_check';
        $isHealthy = Cache::remember($cacheKey, 60, function () {
            try {
                DB::connection()->getPdo();
                
                // Check if essential tables exist
                $tables = ['users', 'sessions', 'accounts'];
                foreach ($tables as $table) {
                    if (!DB::getSchemaBuilder()->hasTable($table)) {
                        return false;
                    }
                }
                
                return true;
            } catch (\Exception $e) {
                return false;
            }
        });

        if (!$isHealthy) {
            // Clear the cache so next request will re-check
            Cache::forget($cacheKey);
            
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Sistem yenilənir. Zəhmət olmasa bir az gözləyin.',
                    'error' => 'database_not_ready'
                ], 503);
            }

            return response()->view('errors.database-setup', [
                'message' => 'Sistem hazırlanır',
                'description' => 'Məlumat bazası yenilənir. Zəhmət olmasa bir neçə dəqiqə gözləyin.'
            ], 503);
        }

        return $next($request);
    }
}
