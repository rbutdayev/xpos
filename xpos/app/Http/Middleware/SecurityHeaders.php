<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    /**
     * Handle an incoming request.
     * Add security headers to all responses
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Prevent MIME type sniffing
        $response->headers->set('X-Content-Type-Options', 'nosniff');

        // Prevent clickjacking attacks
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');

        // Enable XSS protection (legacy but still useful for older browsers)
        $response->headers->set('X-XSS-Protection', '1; mode=block');

        // Control referrer information
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        // Permissions Policy (restrict browser features)
        $response->headers->set('Permissions-Policy', 'geolocation=(), microphone=(), camera=(self)');

        // Content Security Policy
        // Note: Adjust these based on your actual requirements
        $isDev = config('app.env') === 'development';

        $csp = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'" . ($isDev ? " http://dev.xpos.az https://dev.xpos.az https://app.xpos.az" : ""),
            "style-src 'self' 'unsafe-inline' https://fonts.bunny.net" . ($isDev ? " http://dev.xpos.az https://dev.xpos.az https://app.xpos.az" : ""),
            "img-src 'self' data: https: blob:",                // Allow images from various sources
            "font-src 'self' data: https://fonts.bunny.net" . ($isDev ? " http://dev.xpos.az https://dev.xpos.az https://app.xpos.az" : ""),
            "connect-src 'self'" . ($isDev ? " http://dev.xpos.az https://dev.xpos.az https://app.xpos.az ws: wss:" : ""),
            "frame-ancestors 'self'",                          // Prevent embedding in iframes
            "base-uri 'self'",                                 // Prevent base tag injection
            "form-action 'self'",                              // Restrict form submissions
        ];

        $response->headers->set('Content-Security-Policy', implode('; ', $csp));

        // Strict-Transport-Security (HSTS) - Only enable if using HTTPS
        if ($request->secure()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }

        return $response;
    }
}
