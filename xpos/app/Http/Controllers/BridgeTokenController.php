<?php

namespace App\Http\Controllers;

use App\Models\FiscalPrinterBridgeToken;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class BridgeTokenController extends Controller
{
    /**
     * Display a listing of bridge tokens
     */
    public function index()
    {
        Gate::authorize('access-account-data');

        $tokens = FiscalPrinterBridgeToken::where('account_id', Auth::user()->account_id)
            ->with('createdBy:id,name')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($token) {
                return [
                    'id' => $token->id,
                    'name' => $token->name,
                    'token_preview' => substr($token->token, 0, 15) . '...' . substr($token->token, -10),
                    'status' => $token->status,
                    'is_online' => $token->isOnline(),
                    'last_seen_at' => $token->last_seen_at?->toIso8601String(),
                    'last_seen_human' => $token->last_seen_at?->diffForHumans(),
                    'bridge_version' => $token->bridge_version,
                    'bridge_info' => $token->bridge_info,
                    'created_by' => $token->createdBy?->name,
                    'created_at' => $token->created_at->toIso8601String(),
                ];
            });

        return Inertia::render('Settings/BridgeTokens/Index', [
            'tokens' => $tokens,
            'downloads' => config('downloads.fiscal_bridge'),
        ]);
    }

    /**
     * Store a newly created token
     */
    public function store(Request $request)
    {
        Gate::authorize('manage-products'); // Reusing existing permission

        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $token = FiscalPrinterBridgeToken::create([
            'account_id' => Auth::user()->account_id,
            'token' => FiscalPrinterBridgeToken::generateToken(),
            'name' => $validated['name'],
            'status' => 'active',
            'created_by' => Auth::id(),
        ]);

        \Log::info('Bridge token created', [
            'token_id' => $token->id,
            'name' => $token->name,
            'created_by' => Auth::user()->name,
        ]);

        // Return the full token only once
        return response()->json([
            'success' => true,
            'token' => $token->token, // Full token shown only on creation
            'token_id' => $token->id,
            'name' => $token->name,
            'message' => 'Token uğurla yaradıldı. Tokeni indi kopyalayın - bir daha göstərilməyəcək.',
        ]);
    }

    /**
     * Revoke a token
     */
    public function revoke(FiscalPrinterBridgeToken $bridgeToken)
    {
        Gate::authorize('access-account-data', $bridgeToken);

        if ($bridgeToken->account_id !== Auth::user()->account_id) {
            abort(403);
        }

        $bridgeToken->update(['status' => 'revoked']);

        \Log::info('Bridge token revoked', [
            'token_id' => $bridgeToken->id,
            'name' => $bridgeToken->name,
            'revoked_by' => Auth::user()->name,
        ]);

        return redirect()->back()->with('success', 'Token ləğv edildi');
    }

    /**
     * Delete a token
     */
    public function destroy(FiscalPrinterBridgeToken $bridgeToken)
    {
        Gate::authorize('delete-account-data', $bridgeToken);

        if ($bridgeToken->account_id !== Auth::user()->account_id) {
            abort(403);
        }

        $name = $bridgeToken->name;
        $bridgeToken->delete();

        \Log::info('Bridge token deleted', [
            'name' => $name,
            'deleted_by' => Auth::user()->name,
        ]);

        return redirect()->back()->with('success', 'Token silindi');
    }

    /**
     * Copy token (only for active tokens)
     */
    public function show(FiscalPrinterBridgeToken $bridgeToken)
    {
        Gate::authorize('access-account-data', $bridgeToken);

        if ($bridgeToken->account_id !== Auth::user()->account_id) {
            abort(403);
        }

        // Return full token (admin can retrieve it if needed)
        return response()->json([
            'token' => $bridgeToken->token,
        ]);
    }
}
