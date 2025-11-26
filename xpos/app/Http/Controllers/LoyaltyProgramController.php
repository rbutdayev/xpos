<?php

namespace App\Http\Controllers;

use App\Models\LoyaltyProgram;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LoyaltyProgramController extends Controller
{
    /**
     * Display loyalty program settings
     * Note: We allow access even when module is disabled so users can enable it from the Danger Zone
     */
    public function index(): Response
    {
        $accountId = auth()->user()->account_id;
        $program = LoyaltyProgram::where('account_id', $accountId)->first();

        return Inertia::render('Settings/LoyaltyProgram/Index', [
            'program' => $program,
        ]);
    }

    /**
     * Store or update loyalty program configuration
     */
    public function store(Request $request)
    {
        $account = auth()->user()->account;

        // Check if loyalty module is enabled
        if (!$account->loyalty_module_enabled) {
            abort(403, 'Loyallıq proqramı modulu aktivləşdirilməyib.');
        }

        $validated = $request->validate([
            'points_per_currency_unit' => 'required|numeric|min:0|max:1000',
            'redemption_rate' => 'required|numeric|min:1|max:10000',
            'min_redemption_points' => 'required|integer|min:0',
            'points_expiry_days' => 'nullable|integer|min:1|max:3650',
            'max_points_per_transaction' => 'nullable|integer|min:1',
            'earn_on_discounted_items' => 'required|boolean',
            'is_active' => 'required|boolean',
        ]);

        $accountId = auth()->user()->account_id;

        $program = LoyaltyProgram::updateOrCreate(
            ['account_id' => $accountId],
            array_merge($validated, ['account_id' => $accountId])
        );

        return redirect()->back()->with('success', 'Loyalty program settings updated successfully.');
    }

    /**
     * Toggle loyalty program active status
     */
    public function toggleActive()
    {
        $account = auth()->user()->account;

        // Check if loyalty module is enabled
        if (!$account->loyalty_module_enabled) {
            abort(403, 'Loyallıq proqramı modulu aktivləşdirilməyib.');
        }

        $accountId = auth()->user()->account_id;
        $program = LoyaltyProgram::where('account_id', $accountId)->firstOrFail();

        $program->is_active = !$program->is_active;
        $program->save();

        return redirect()->back()->with('success',
            $program->is_active
                ? 'Loyalty program activated.'
                : 'Loyalty program deactivated.'
        );
    }

    /**
     * Get loyalty program for API/AJAX requests
     */
    public function show()
    {
        $account = auth()->user()->account;

        // Check if loyalty module is enabled
        if (!$account->loyalty_module_enabled) {
            return response()->json(['program' => null, 'module_disabled' => true], 403);
        }

        $accountId = auth()->user()->account_id;
        $program = LoyaltyProgram::where('account_id', $accountId)->first();

        return response()->json(['program' => $program]);
    }

    /**
     * Toggle loyalty module enabled/disabled for the entire account
     */
    public function toggleModule()
    {
        $account = auth()->user()->account;

        $account->loyalty_module_enabled = !$account->loyalty_module_enabled;
        $account->save();

        return redirect()->back()->with('success',
            $account->loyalty_module_enabled
                ? 'Loyallıq proqramı modulu aktivləşdirildi.'
                : 'Loyallıq proqramı modulu söndürüldü.'
        );
    }
}
