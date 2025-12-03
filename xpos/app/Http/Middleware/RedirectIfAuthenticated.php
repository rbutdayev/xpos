<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class RedirectIfAuthenticated
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, string ...$guards): Response
    {
        $guards = empty($guards) ? [null] : $guards;

        foreach ($guards as $guard) {
            if (Auth::guard($guard)->check()) {
                $user = Auth::guard($guard)->user();

                // If accessing /admin/login but user is not a super admin, force logout
                if ($request->is('admin/login') && !$user->isSuperAdmin()) {
                    Auth::guard($guard)->logout();
                    $request->session()->invalidate();
                    $request->session()->regenerateToken();
                    return $next($request);
                }

                // If accessing /login but user is a super admin, force logout
                if ($request->is('login') && $user->isSuperAdmin()) {
                    Auth::guard($guard)->logout();
                    $request->session()->invalidate();
                    $request->session()->regenerateToken();
                    return $next($request);
                }

                // User is authenticated and accessing the correct login page
                // Redirect them to their appropriate dashboard
                $redirectRoute = $user->isSuperAdmin()
                    ? route('superadmin.dashboard', absolute: false)
                    : route('dashboard', absolute: false);

                return redirect($redirectRoute);
            }
        }

        return $next($request);
    }
}
