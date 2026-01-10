<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class RedirectAttendanceUser
{
    /**
     * Routes that attendance users are allowed to access.
     */
    protected array $allowedRoutes = [
        'attendance.scan',
        'attendance.check-in',
        'attendance.check-out',
        'attendance.history',
        'attendance.status',
        'logout',
        'profile.edit',
        'profile.update',
    ];

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();

        // If user is not authenticated, let the auth middleware handle it
        if (!$user) {
            return $next($request);
        }

        // Only apply restrictions to attendance_user role
        if ($user->role !== 'attendance_user') {
            return $next($request);
        }

        // Get the current route name
        $routeName = $request->route()?->getName();

        // Allow access to permitted routes
        if (in_array($routeName, $this->allowedRoutes)) {
            return $next($request);
        }

        // Redirect to attendance scan page with error message
        return redirect()
            ->route('attendance.scan')
            ->with('error', 'Bu səhifəyə giriş icazəniz yoxdur. Yalnız davamiyyət sistemindən istifadə edə bilərsiniz.');
    }
}
