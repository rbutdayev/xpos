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

        // CRITICAL: Always force a full page reload after login
        // This ensures the fresh CSRF token from the new session is loaded
        // We MUST use absolute URL for X-Inertia-Location to trigger full reload
        $response = redirect()->intended($redirectRoute);

        // Force full page reload by setting X-Inertia-Location header
        // This is required for ALL login requests, not just Inertia
        $response->header('X-Inertia-Location', url($redirectRoute));

        // CRITICAL FIX: Send the fresh CSRF token in response header
        // This allows frontend to update token immediately without waiting for DOM parsing
        // Fixes 419 error on first POST after login when switching between users
        $response->header('X-CSRF-TOKEN', $request->session()->token());

        // CRITICAL: Expose the header so JavaScript can read it
        // Without this, browsers hide custom headers from JavaScript (CORS policy)
        $response->header('Access-Control-Expose-Headers', 'X-CSRF-TOKEN');

        // Prevent caching to ensure fresh CSRF token is loaded
        $response->header('Cache-Control', 'no-cache, no-store, must-revalidate');
        $response->header('Pragma', 'no-cache');
        $response->header('Expires', '0');

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

        // Force full page reload to get fresh CSRF token
        // This prevents 419 errors when user tries to login again
        $response = redirect('/');
        $response->header('X-Inertia-Location', url('/'));

        // CRITICAL FIX: Send the fresh CSRF token after logout
        // This ensures the next login has the correct token immediately
        $response->header('X-CSRF-TOKEN', $request->session()->token());

        // CRITICAL: Expose the header so JavaScript can read it
        $response->header('Access-Control-Expose-Headers', 'X-CSRF-TOKEN');

        return $response;
    }
}
