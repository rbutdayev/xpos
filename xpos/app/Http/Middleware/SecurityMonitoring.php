<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Services\SecurityMonitoringService;
use App\Models\AuditLog;
use Symfony\Component\HttpFoundation\Response;

class SecurityMonitoring
{
    public function __construct(
        private SecurityMonitoringService $securityService
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        // Check if IP is blocked before processing request
        $ipAddress = $request->ip();
        if ($this->securityService->isIPBlocked($ipAddress)) {
            abort(403, 'Access denied. Your IP address has been blocked due to suspicious activity.');
        }

        $response = $next($request);

        // Log the request if user is authenticated
        if ($request->user()) {
            $this->logUserActivity($request);
            
            // Check for suspicious activity patterns
            $this->securityService->detectSuspiciousActivity(
                $request->user()->id,
                $request->user()->account_id
            );
        }

        return $response;
    }

    private function logUserActivity(Request $request): void
    {
        try {
            $user = $request->user();
            $route = $request->route();
            $routeName = $route ? $route->getName() : $request->path();

            // Skip logging for certain routes to avoid noise
            $skipRoutes = [
                'api.',
                'heartbeat',
                'health-check',
                '_debugbar',
                'telescope',
            ];

            foreach ($skipRoutes as $skipRoute) {
                if (str_contains($routeName ?: '', $skipRoute)) {
                    return;
                }
            }

            $ipAddress = $request->ip();
            $userAgent = $request->userAgent();

            AuditLog::create([
                'account_id' => $user->account_id,
                'user_id' => $user->id,
                'action' => $routeName ?: 'unknown',
                'model_type' => 'Request',
                'model_id' => null,
                'description' => $request->method() . ' ' . $request->path(),
                'old_values' => null,
                'new_values' => $this->getRequestData($request),
                'ip_address' => $ipAddress,
                'user_agent' => $userAgent,
                'geolocation' => $ipAddress ? $this->securityService->getGeolocation($ipAddress) : null,
                'device_type' => $userAgent ? $this->securityService->getDeviceType($userAgent) : null,
                'session_id' => $request->session()->getId(),
            ]);
        } catch (\Exception $e) {
            // Log error but don't break the request
            \Log::warning('Failed to log user activity: ' . $e->getMessage());
        }
    }

    private function getRequestData(Request $request): ?array
    {
        // Only log relevant request data, exclude sensitive information
        $data = [];
        
        if ($request->isMethod('POST') || $request->isMethod('PUT') || $request->isMethod('PATCH')) {
            $input = $request->except(['password', 'password_confirmation', '_token', '_method']);
            
            // Limit the amount of data we store
            if (json_encode($input) && strlen(json_encode($input)) < 1000) {
                $data['input'] = $input;
            }
        }

        return empty($data) ? null : $data;
    }
}