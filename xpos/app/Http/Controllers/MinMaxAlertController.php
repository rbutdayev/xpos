<?php

namespace App\Http\Controllers;

use App\Models\MinMaxAlert;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class MinMaxAlertController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
        $this->middleware('account.access');
    }

    public function index(Request $request)
    {
        Gate::authorize('viewAny', MinMaxAlert::class);

        $validated = $request->validate([
            'search' => 'nullable|string|max:255',
            'status' => 'nullable|string|max:50',
            'alert_type' => 'nullable|string|max:50',
        ]);
        $query = MinMaxAlert::with(['warehouse', 'product', 'resolvedBy'])
            ->byAccount(auth()->user()->account_id);

        // Apply filters
        if (!empty($validated['status'])) {
            $query->where('status', $validated['status']);
        }

        if (!empty($validated['alert_type'])) {
            $query->where('alert_type', $validated['alert_type']);
        }

        if (!empty($validated['search'])) {
            $search = $validated['search'];
            $query->where(function ($q) use ($search) {
                $q->whereHas('product', function ($productQuery) use ($search) {
                    $productQuery->where('name', 'like', '%' . $search . '%')
                                ->orWhere('sku', 'like', '%' . $search . '%');
                })
                ->orWhereHas('warehouse', function ($warehouseQuery) use ($search) {
                    $warehouseQuery->where('name', 'like', '%' . $search . '%');
                })
                ->orWhere('alert_type', 'like', '%' . $search . '%');
            });
        }

        $alerts = $query->latest('alert_date')->paginate(25);

        return Inertia::render('Alerts/Index', [
            'alerts' => $alerts,
            'filters' => $request->only(['search', 'status', 'alert_type'])
        ]);
    }

    public function search(Request $request)
    {
        return $this->index($request);
    }

    public function show(MinMaxAlert $alert)
    {
        Gate::authorize('view', $alert);

        $alert->load(['warehouse', 'product', 'resolvedBy']);

        return Inertia::render('Alerts/Show', [
            'alert' => $alert,
        ]);
    }

    public function markAsViewed(MinMaxAlert $alert)
    {
        Gate::authorize('update', $alert);

        $alert->markAsViewed();

        return redirect()->back()->with('success', __('app.mark_as_viewed'));
    }

    public function markAsResolved(Request $request, MinMaxAlert $alert)
    {
        Gate::authorize('update', $alert);

        $request->validate([
            'resolution_notes' => 'nullable|string|max:1000',
        ]);

        $alert->markAsResolved(
            auth()->user()->employee_id ?? null,
            $request->resolution_notes
        );

        return redirect()->back()->with('success', __('app.alert_resolved'));
    }

    public function destroy(MinMaxAlert $alert)
    {
        Gate::authorize('delete', $alert);

        $alert->delete();

        return redirect()->route('alerts.index')
            ->with('success', __('app.alert_deleted'));
    }
}
