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

class SuperAdminAuthController extends Controller
{
    /**
     * Display the super admin login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/AdminLogin', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming super admin authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $user = Auth::user();

        // Verify the user is actually a super admin
        if (!$user->isSuperAdmin()) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return back()->withErrors([
                'email' => 'Bu giriş yalnız super admin istifadəçilər üçündür. Zəhmət olmasa adi giriş səhifəsindən istifadə edin.',
            ]);
        }

        // Regenerate session to get new CSRF token
        $request->session()->regenerate();

        // Store user ID in session
        $request->session()->put('user_id', $user->id);
        $request->session()->put('account_id', $user->account_id);

        $redirectRoute = route('superadmin.dashboard', absolute: false);

        // Force a full page reload to refresh CSRF token in meta tag
        $response = redirect()->intended($redirectRoute);

        if ($request->header('X-Inertia')) {
            $response->header('X-Inertia-Location', $redirectRoute);
        }

        return $response;
    }

    /**
     * Destroy a super admin authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $userId = Auth::id();

        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        // Store a flag to clear user data on client side
        $request->session()->flash('user_logged_out', true);
        $request->session()->flash('logged_out_user_id', $userId);

        return redirect('/admin/login');
    }
}
