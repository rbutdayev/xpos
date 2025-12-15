<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AddCsrfTokenToResponse
{
    /**
     * Handle an incoming request and add CSRF token to response headers.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Add fresh CSRF token to ALL responses (especially 419 errors)
        // This allows JavaScript to capture the fresh token even when requests fail
        if ($request->hasSession()) {
            $token = $request->session()->token();
            $response->headers->set('X-CSRF-TOKEN', $token);
            $response->headers->set('Access-Control-Expose-Headers', 'X-CSRF-TOKEN');
        }

        return $response;
    }
}
