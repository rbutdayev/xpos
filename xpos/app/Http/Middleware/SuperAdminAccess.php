<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class SuperAdminAccess
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();

        if (!$user) {
            return redirect()->route('login');
        }

        // Only super admin can access
        if ($user->role !== 'super_admin') {
            abort(403, 'Bu səhifəyə yalnız super admin giriş edə bilər.');
        }

        return $next($request);
    }
}