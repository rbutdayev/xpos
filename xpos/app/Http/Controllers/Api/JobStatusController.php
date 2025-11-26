<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FiscalPrinterJob;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;

class JobStatusController extends Controller
{
    /**
     * Get fiscal printer job status for a sale
     */
    public function getSaleJobStatus(int $saleId): JsonResponse
    {
        Gate::authorize('access-account-data');

        $job = FiscalPrinterJob::where('sale_id', $saleId)
            ->where('account_id', Auth::user()->account_id)
            ->latest()
            ->first();

        if (!$job) {
            return response()->json([
                'status' => 'not_found'
            ]);
        }

        return response()->json([
            'status' => $job->status,
            'fiscal_number' => $job->fiscal_number,
            'error' => $job->error_message,
            'updated_at' => $job->updated_at->toISOString(),
        ]);
    }
}
