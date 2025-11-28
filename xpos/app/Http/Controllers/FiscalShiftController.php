<?php

namespace App\Http\Controllers;

use App\Services\FiscalPrinterService;
use App\Models\FiscalPrinterConfig;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class FiscalShiftController extends Controller
{
    public function __construct(
        private FiscalPrinterService $fiscalService
    ) {}

    /**
     * Display the shift management page
     */
    public function index(Request $request)
    {
        Gate::authorize('access-account-data');

        $accountId = auth()->user()->account_id;

        $fiscalConfig = FiscalPrinterConfig::where('account_id', $accountId)
            ->where('is_active', true)
            ->first();

        return Inertia::render('ShiftManagement/Index', [
            'fiscalConfig' => $fiscalConfig,
        ]);
    }

    /**
     * Get current shift status
     */
    public function status(Request $request)
    {
        Gate::authorize('access-account-data');

        $accountId = auth()->user()->account_id;
        $result = $this->fiscalService->getShiftStatus($accountId);

        return response()->json($result);
    }

    /**
     * Open a new shift
     */
    public function open(Request $request)
    {
        Gate::authorize('edit-account-data');

        $accountId = auth()->user()->account_id;
        $result = $this->fiscalService->openShift($accountId);

        if ($result['success']) {
            return response()->json([
                'success' => true,
                'message' => $result['message'],
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => $result['error'],
        ], 400);
    }

    /**
     * Close shift and print Z-Report
     */
    public function close(Request $request)
    {
        Gate::authorize('edit-account-data');

        $accountId = auth()->user()->account_id;
        $result = $this->fiscalService->closeShift($accountId);

        if ($result['success']) {
            return response()->json([
                'success' => true,
                'message' => $result['message'],
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => $result['error'],
        ], 400);
    }

    /**
     * Print X-Report (intermediate report)
     */
    public function xReport(Request $request)
    {
        Gate::authorize('access-account-data');

        $accountId = auth()->user()->account_id;
        $result = $this->fiscalService->printXReport($accountId);

        if ($result['success']) {
            return response()->json([
                'success' => true,
                'message' => $result['message'],
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => $result['error'],
        ], 400);
    }
}
