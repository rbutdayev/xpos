<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $user = Auth::user();

        // Prevent super admin from logging in via tenant login
        if ($user->isSuperAdmin()) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('admin.login')->withErrors([
                'email' => 'Super admin istifadəçilər üçün ayrıca giriş səhifəsi var. Zəhmət olmasa /admin/login ünvanından istifadə edin.',
            ]);
        }

        // Regenerate session to get new CSRF token
        $request->session()->regenerate();

        // Store user ID in session for cross-tab detection
        // This will be read by frontend SessionManager component
        $request->session()->put('user_id', $user->id);
        $request->session()->put('account_id', $user->account_id);

        $redirectRoute = route('dashboard', absolute: false);

        // Force a full page reload to refresh CSRF token in meta tag
        // This prevents "page expired" errors when switching between accounts
        $response = redirect()->intended($redirectRoute);

        // For Inertia requests, force a full page reload by setting X-Inertia-Location
        // This ensures the new CSRF token is properly loaded
        if ($request->header('X-Inertia')) {
            $response->header('X-Inertia-Location', $redirectRoute);
        }

        return $response;
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        // Get user ID before logging out (for cleaning localStorage)
        $userId = Auth::id();

        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        // Clear the intended URL to prevent redirect issues when logging in as different user
        $request->session()->forget('url.intended');

        // Store a flag to clear user data on client side
        // SessionManager will detect this and clear localStorage
        $request->session()->flash('user_logged_out', true);
        $request->session()->flash('logged_out_user_id', $userId);

        return redirect('/');
    }
}
