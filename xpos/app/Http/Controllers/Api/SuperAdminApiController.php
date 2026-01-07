<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class SuperAdminApiController extends Controller
{
    /**
     * API Login - Get Bearer Token for SuperAdmin
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        // Check if user exists
        if (!$user) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Check if user is super admin
        if ($user->role !== 'super_admin') {
            throw ValidationException::withMessages([
                'email' => ['Only super admins can access the API.'],
            ]);
        }

        // Check password
        if (!Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Check if user is active
        if ($user->status !== 'active') {
            throw ValidationException::withMessages([
                'email' => ['Your account is not active.'],
            ]);
        }

        // Revoke all existing tokens for this user (optional - for security)
        // $user->tokens()->delete();

        // Create new token
        $token = $user->createToken('superadmin-api-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
        ]);
    }

    /**
     * API Logout - Revoke Bearer Token
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function logout(Request $request)
    {
        // Revoke current token
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully',
        ]);
    }

    /**
     * Get online users (active in last 5 minutes)
     * Returns users with their company name and username
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function onlineUsers(Request $request)
    {
        // Verify user is super admin
        if ($request->user()->role !== 'super_admin') {
            return response()->json([
                'success' => false,
                'message' => 'Only super admins can access this endpoint.',
            ], 403);
        }

        try {
            $sessionDriver = config('session.driver');

            // If using database sessions, query the sessions table
            if ($sessionDriver === 'database') {
                return $this->getOnlineUsersFromDatabase();
            }

            // For other session drivers (Redis, etc.), use last_login_at as fallback
            $threshold = now()->subMinutes(5);

            $onlineUsers = User::query()
                ->join('accounts', 'users.account_id', '=', 'accounts.id')
                ->where('users.last_login_at', '>', $threshold)
                ->whereNotNull('users.last_login_at')
                ->select(
                    'users.id',
                    'users.name as username',
                    'accounts.company_name',
                    'users.last_login_at as last_activity',
                    'users.role'
                )
                ->orderBy('users.last_login_at', 'desc')
                ->get()
                ->map(function ($user) {
                    // Convert string to Carbon instance before calling diffForHumans()
                    $user->last_activity_human = \Carbon\Carbon::parse($user->last_activity)->diffForHumans();
                    return $user;
                });

            return response()->json([
                'success' => true,
                'count' => $onlineUsers->count(),
                'time_window' => '5 minutes',
                'session_driver' => $sessionDriver,
                'note' => $sessionDriver !== 'database'
                    ? 'Using last_login_at as fallback (session driver: ' . $sessionDriver . ')'
                    : null,
                'users' => $onlineUsers,
            ]);

        } catch (\Exception $e) {
            \Log::error('Online users API query failed: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Online istifadəçilər sorğulanarkən xəta baş verdi: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get online users from database sessions table
     *
     * @return \Illuminate\Http\JsonResponse
     */
    private function getOnlineUsersFromDatabase()
    {
        // Calculate threshold: 5 minutes ago in Unix timestamp
        $threshold = now()->subMinutes(5)->timestamp;

        // Query sessions table to find active users
        $onlineUsers = DB::table('sessions')
            ->join('users', 'sessions.user_id', '=', 'users.id')
            ->join('accounts', 'users.account_id', '=', 'accounts.id')
            ->where('sessions.last_activity', '>', $threshold)
            ->whereNotNull('sessions.user_id')
            ->select(
                'users.id',
                'users.name as username',
                'accounts.company_name',
                'sessions.last_activity',
                'sessions.ip_address',
                'users.role'
            )
            ->distinct()
            ->orderBy('sessions.last_activity', 'desc')
            ->get()
            ->map(function ($user) {
                // Convert Unix timestamp to human-readable format
                $user->last_activity_human = \Carbon\Carbon::createFromTimestamp($user->last_activity)->diffForHumans();
                return $user;
            });

        return response()->json([
            'success' => true,
            'count' => $onlineUsers->count(),
            'time_window' => '5 minutes',
            'session_driver' => 'database',
            'users' => $onlineUsers,
        ]);
    }
}
