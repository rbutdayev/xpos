<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CurrencyResource;
use App\Services\CurrencyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Validator;

class CurrencyController extends Controller
{
    protected CurrencyService $currencyService;

    public function __construct(CurrencyService $currencyService)
    {
        $this->currencyService = $currencyService;
    }

    /**
     * Get all active currencies
     */
    public function index(): JsonResponse
    {
        $currencies = $this->currencyService->getAllCurrencies();

        return response()->json([
            'currencies' => CurrencyResource::collection($currencies),
        ]);
    }

    /**
     * Get current company currency
     */
    public function show(): JsonResponse
    {
        Gate::authorize('access-account-data');

        $currency = $this->currencyService->getCompanyCurrency();

        return response()->json([
            'currency' => $currency,
        ]);
    }

    /**
     * Update company currency
     */
    public function update(Request $request): JsonResponse
    {
        Gate::authorize('manage-company-settings');

        $validator = Validator::make($request->all(), [
            'currency_code' => 'required|string|size:3|exists:currencies,code',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors(),
            ], 422);
        }

        $success = $this->currencyService->updateCompanyCurrency($request->currency_code);

        if (!$success) {
            return response()->json([
                'message' => 'Failed to update currency',
            ], 500);
        }

        return response()->json([
            'message' => 'Currency updated successfully',
            'currency' => $this->currencyService->getCompanyCurrency(),
        ]);
    }
}
