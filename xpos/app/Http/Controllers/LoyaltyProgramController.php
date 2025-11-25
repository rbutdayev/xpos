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
        $accountId = auth()->user()->account_id;
        $program = LoyaltyProgram::where('account_id', $accountId)->first();

        return response()->json(['program' => $program]);
    }
}
