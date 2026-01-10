<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class AttendanceSettingsController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
        $this->middleware('account.access');
    }

    /**
     * Show attendance settings page
     */
    public function index()
    {
        Gate::authorize('manage-attendance');

        $user = Auth::user();
        $account = $user->account;

        // Get all branches for this account
        $branches = Branch::where('account_id', $user->account_id)
            ->orderBy('name')
            ->get()
            ->map(function ($branch) {
                return [
                    'id' => $branch->id,
                    'name' => $branch->name,
                    'address' => $branch->address,
                    'latitude' => $branch->latitude,
                    'longitude' => $branch->longitude,
                    'is_active' => $branch->is_active,
                ];
            });

        return Inertia::render('Attendance/Settings', [
            'branches' => $branches,
            'allowedRadius' => $account->attendance_allowed_radius ?? 100, // Default 100 meters
        ]);
    }

    /**
     * Update allowed check-in radius
     */
    public function updateRadius(Request $request)
    {
        Gate::authorize('manage-attendance');

        $validated = $request->validate([
            'radius' => ['required', 'integer', 'min:10', 'max:1000'],
        ]);

        $user = Auth::user();
        $account = $user->account;

        $account->update([
            'attendance_allowed_radius' => $validated['radius'],
        ]);

        return redirect()->back()->with('success', 'İcazə verilən radius yeniləndi.');
    }

    /**
     * Update branch GPS coordinates
     */
    public function updateBranchLocation(Request $request, Branch $branch)
    {
        Gate::authorize('manage-attendance');
        Gate::authorize('access-account-data', $branch);

        $validated = $request->validate([
            'latitude' => ['required', 'numeric', 'min:-90', 'max:90'],
            'longitude' => ['required', 'numeric', 'min:-180', 'max:180'],
        ]);

        $branch->update([
            'latitude' => $validated['latitude'],
            'longitude' => $validated['longitude'],
        ]);

        return redirect()->back()->with('success', 'Filial GPS koordinatları yeniləndi.');
    }
}
