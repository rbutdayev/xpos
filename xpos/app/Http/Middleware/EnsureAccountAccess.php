<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureAccountAccess
{
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

        // Superadmin bypasses all account checks
        if ($user->isSuperAdmin()) {
            return $next($request);
        }

        // Check if user's account is active
        if (!$user->account || !$user->account->isActive()) {
            Auth::logout();
            return redirect()->route('login')->withErrors([
                'account' => 'Hesabınız aktiv deyil. Zəhmət olmasa dəstək ilə əlaqə saxlayın.'
            ]);
        }

        // Check if user is active
        if (!$user->isActive()) {
            Auth::logout();
            return redirect()->route('login')->withErrors([
                'user' => 'İstifadəçi hesabınız aktiv deyil.'
            ]);
        }

        // Check if subscription is active (skip check for now during development)
        $subscription = $user->account->getCurrentSubscription();
        if ($subscription && !$subscription->isActive()) {
            Auth::logout();
            return redirect()->route('login')->withErrors([
                'subscription' => 'Abunəlik müddətiniz bitib. Zəhmət olmasa yeniləyin.'
            ]);
        }

        // Update last login time
        $user->update(['last_login_at' => now()]);

        return $next($request);
    }
}
