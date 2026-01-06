<?php

namespace App\Http\Controllers;

use App\Models\MinMaxAlert;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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

    public function bulkDelete(Request $request)
    {
        Gate::authorize('delete-account-data');

        $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'required|integer',
        ]);

        $user = auth()->user();
        $deletedCount = 0;
        $failedAlerts = [];

        DB::transaction(function () use ($request, $user, &$deletedCount, &$failedAlerts) {
            $alerts = MinMaxAlert::whereIn('alert_id', $request->ids)
                ->where('account_id', $user->account_id)
                ->get();

            foreach ($alerts as $alert) {
                try {
                    $alert->delete();
                    $deletedCount++;
                } catch (\Exception $e) {
                    $failedAlerts[] = "Xəbərdarlıq #{$alert->alert_id}";
                }
            }
        });

        if (count($failedAlerts) > 0) {
            $failedList = implode(', ', $failedAlerts);
            $message = $deletedCount > 0
                ? "{$deletedCount} xəbərdarlıq silindi. Bu xəbərdarlıqlar silinə bilmədi: {$failedList}"
                : "Heç bir xəbərdarlıq silinmədi. {$failedList}";

            return redirect()->route('alerts.index')
                ->with($deletedCount > 0 ? 'warning' : 'error', $message);
        }

        return redirect()->route('alerts.index')
            ->with('success', "{$deletedCount} xəbərdarlıq uğurla silindi");
    }

    public function bulkResolve(Request $request)
    {
        Gate::authorize('delete-account-data');

        $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'required|integer',
            'resolution_notes' => 'nullable|string|max:1000',
        ]);

        $user = auth()->user();
        $resolvedCount = 0;
        $failedAlerts = [];

        DB::transaction(function () use ($request, $user, &$resolvedCount, &$failedAlerts) {
            $alerts = MinMaxAlert::whereIn('alert_id', $request->ids)
                ->where('account_id', $user->account_id)
                ->where('status', '!=', 'resolved')
                ->get();

            foreach ($alerts as $alert) {
                try {
                    $alert->markAsResolved(
                        $user->employee_id ?? null,
                        $request->resolution_notes
                    );
                    $resolvedCount++;
                } catch (\Exception $e) {
                    $failedAlerts[] = "Xəbərdarlıq #{$alert->alert_id}";
                }
            }
        });

        if (count($failedAlerts) > 0) {
            $failedList = implode(', ', $failedAlerts);
            $message = $resolvedCount > 0
                ? "{$resolvedCount} xəbərdarlıq həll edildi. Bu xəbərdarlıqlar həll edilə bilmədi: {$failedList}"
                : "Heç bir xəbərdarlıq həll edilmədi. {$failedList}";

            return redirect()->route('alerts.index')
                ->with($resolvedCount > 0 ? 'warning' : 'error', $message);
        }

        return redirect()->route('alerts.index')
            ->with('success', "{$resolvedCount} xəbərdarlıq uğurla həll edildi");
    }
}
