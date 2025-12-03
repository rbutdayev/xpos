<?php

namespace App\Http\Controllers;

use App\Models\FiscalPrinterJob;
use App\Models\Sale;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class FiscalPrinterJobController extends Controller
{
    /**
     * Display fiscal printer job queue
     */
    public function index(Request $request)
    {
        Gate::authorize('view-reports');

        $accountId = auth()->user()->account_id;

        $query = FiscalPrinterJob::with('sale')
            ->where('account_id', $accountId);

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Search by sale number
        if ($request->has('search') && $request->search) {
            $query->whereHas('sale', function ($q) use ($request) {
                $q->where('sale_number', 'like', '%' . $request->search . '%');
            });
        }

        $jobs = $query->orderBy('created_at', 'desc')
            ->paginate(20)
            ->withQueryString();

        // Get status counts
        $statusCounts = [
            'all' => FiscalPrinterJob::where('account_id', $accountId)->count(),
            'pending' => FiscalPrinterJob::where('account_id', $accountId)
                ->where('status', FiscalPrinterJob::STATUS_PENDING)->count(),
            'processing' => FiscalPrinterJob::where('account_id', $accountId)
                ->where('status', FiscalPrinterJob::STATUS_PROCESSING)->count(),
            'completed' => FiscalPrinterJob::where('account_id', $accountId)
                ->where('status', FiscalPrinterJob::STATUS_COMPLETED)->count(),
            'failed' => FiscalPrinterJob::where('account_id', $accountId)
                ->where('status', FiscalPrinterJob::STATUS_FAILED)->count(),
        ];

        return Inertia::render('FiscalPrinter/JobQueue', [
            'jobs' => $jobs,
            'statusCounts' => $statusCounts,
            'filters' => $request->only(['status', 'search']),
        ]);
    }

    /**
     * Retry a failed job
     */
    public function retry(FiscalPrinterJob $job)
    {
        Gate::authorize('view-reports');
        Gate::authorize('access-account-data', $job);

        if (!$job->canRetry()) {
            return back()->with('error', 'Bu iş təkrar edilə bilməz');
        }

        $job->retry();

        return back()->with('success', 'İş təkrar növbəyə əlavə edildi');
    }

    /**
     * Cancel/delete a job
     */
    public function destroy(FiscalPrinterJob $job)
    {
        Gate::authorize('view-reports');
        Gate::authorize('delete-account-data');

        // Don't allow deleting completed jobs
        if ($job->status === FiscalPrinterJob::STATUS_COMPLETED) {
            return back()->with('error', 'Tamamlanmış işlər silinə bilməz');
        }

        $job->delete();

        return back()->with('success', 'İş silindi');
    }

    /**
     * Bulk delete jobs
     */
    public function bulkDelete(Request $request)
    {
        Gate::authorize('view-reports');
        Gate::authorize('delete-account-data');

        $validated = $request->validate([
            'job_ids' => 'required|array',
            'job_ids.*' => 'exists:fiscal_printer_jobs,id',
        ]);

        $accountId = auth()->user()->account_id;

        $count = FiscalPrinterJob::where('account_id', $accountId)
            ->whereIn('id', $validated['job_ids'])
            ->where('status', '!=', FiscalPrinterJob::STATUS_COMPLETED)
            ->delete();

        return back()->with('success', "$count iş silindi");
    }
}
