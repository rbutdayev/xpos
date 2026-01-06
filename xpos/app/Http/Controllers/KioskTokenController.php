<?php

namespace App\Http\Controllers;

use App\Models\KioskDeviceToken;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class KioskTokenController extends Controller
{
    /**
     * Display a listing of kiosk tokens
     */
    public function index()
    {
        Gate::authorize('access-account-data');

        $tokens = KioskDeviceToken::where('account_id', Auth::user()->account_id)
            ->with(['creator:id,name', 'branch:id,name'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($token) {
                return [
                    'id' => $token->id,
                    'device_name' => $token->device_name,
                    'branch_id' => $token->branch_id,
                    'branch_name' => $token->branch?->name,
                    'token_preview' => substr($token->token, 0, 15) . '...' . substr($token->token, -10),
                    'status' => $token->status,
                    'is_online' => $token->isOnline(),
                    'last_heartbeat' => $token->last_heartbeat?->toIso8601String(),
                    'last_heartbeat_human' => $token->last_heartbeat?->diffForHumans(),
                    'device_info' => $token->device_info,
                    'created_by' => $token->creator?->name,
                    'created_at' => $token->created_at->toIso8601String(),
                ];
            });

        // Get available branches for the dropdown
        $branches = Branch::where('account_id', Auth::user()->account_id)
            ->where('is_active', true)
            ->orderBy('is_main', 'desc')
            ->orderBy('name')
            ->get()
            ->map(function ($branch) {
                return [
                    'id' => $branch->id,
                    'name' => $branch->name,
                    'is_main' => $branch->is_main,
                ];
            });

        return Inertia::render('Settings/KioskTokens/Index', [
            'tokens' => $tokens,
            'branches' => $branches,
            'downloads' => config('downloads.kiosk_app'),
        ]);
    }

    /**
     * Store a newly created token
     */
    public function store(Request $request)
    {
        Gate::authorize('manage-products'); // Reusing existing permission

        $validated = $request->validate([
            'device_name' => 'required|string|max:255',
            'branch_id' => 'required|integer|exists:branches,id',
        ]);

        // Verify branch belongs to user's account
        $branch = Branch::where('id', $validated['branch_id'])
            ->where('account_id', Auth::user()->account_id)
            ->first();

        if (!$branch) {
            return response()->json([
                'success' => false,
                'message' => 'Filial tapılmadı və ya sizə aid deyil.',
            ], 403);
        }

        $token = KioskDeviceToken::create([
            'account_id' => Auth::user()->account_id,
            'branch_id' => $validated['branch_id'],
            'token' => KioskDeviceToken::generateToken(),
            'device_name' => $validated['device_name'],
            'status' => 'active',
            'created_by' => Auth::id(),
        ]);

        \Log::info('Kiosk token created', [
            'token_id' => $token->id,
            'device_name' => $token->device_name,
            'branch_id' => $token->branch_id,
            'created_by' => Auth::user()->name,
        ]);

        // Return the full token only once
        return response()->json([
            'success' => true,
            'token' => $token->token, // Full token shown only on creation
            'token_id' => $token->id,
            'device_name' => $token->device_name,
            'message' => 'Token uğurla yaradıldı. Tokeni indi kopyalayın - bir daha göstərilməyəcək.',
        ]);
    }

    /**
     * Revoke a token
     */
    public function revoke(KioskDeviceToken $kioskDeviceToken)
    {
        Gate::authorize('access-account-data', $kioskDeviceToken);

        if ($kioskDeviceToken->account_id !== Auth::user()->account_id) {
            abort(403);
        }

        $kioskDeviceToken->update(['status' => 'revoked']);

        \Log::info('Kiosk token revoked', [
            'token_id' => $kioskDeviceToken->id,
            'device_name' => $kioskDeviceToken->device_name,
            'revoked_by' => Auth::user()->name,
        ]);

        return redirect()->back()->with('success', 'Token ləğv edildi');
    }

    /**
     * Delete a token
     */
    public function destroy(KioskDeviceToken $kioskDeviceToken)
    {
        Gate::authorize('delete-account-data', $kioskDeviceToken);

        if ($kioskDeviceToken->account_id !== Auth::user()->account_id) {
            abort(403);
        }

        $deviceName = $kioskDeviceToken->device_name;
        $kioskDeviceToken->delete();

        \Log::info('Kiosk token deleted', [
            'device_name' => $deviceName,
            'deleted_by' => Auth::user()->name,
        ]);

        return redirect()->back()->with('success', 'Token silindi');
    }

    /**
     * Copy token (only for active tokens)
     */
    public function show(KioskDeviceToken $kioskDeviceToken)
    {
        Gate::authorize('access-account-data', $kioskDeviceToken);

        if ($kioskDeviceToken->account_id !== Auth::user()->account_id) {
            abort(403);
        }

        // Return full token (admin can retrieve it if needed)
        return response()->json([
            'token' => $kioskDeviceToken->token,
        ]);
    }
}
