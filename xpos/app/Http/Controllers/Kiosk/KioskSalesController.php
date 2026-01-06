<?php

namespace App\Http\Controllers\Kiosk;

use App\Http\Controllers\Controller;
use App\Services\KioskSaleProcessor;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

/**
 * Kiosk Sales Controller
 *
 * Handles kiosk sales operations:
 * - Single sale creation (real-time)
 * - Batch sales upload (offline queue)
 * - Sale status checking (by local_id)
 */
class KioskSalesController extends Controller
{
    protected KioskSaleProcessor $saleProcessor;

    public function __construct(KioskSaleProcessor $saleProcessor)
    {
        $this->saleProcessor = $saleProcessor;
    }

    /**
     * Create a single sale (real-time)
     *
     * POST /api/kiosk/sale
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function createSale(Request $request): JsonResponse
    {
        try {
            $validated = $this->validateSaleData($request);

            $accountId = $request->input('kiosk_account_id');

            $sale = $this->saleProcessor->processSingleSale($validated, $accountId);

            return response()->json([
                'success' => true,
                'sale' => [
                    'server_sale_id' => $sale->sale_id,
                    'sale_number' => $sale->sale_number,
                    'total' => $sale->total,
                    'status' => $sale->status,
                    'payment_status' => $sale->payment_status,
                    'fiscal_number' => $sale->fiscal_number,
                    'fiscal_document_id' => $sale->fiscal_document_id,
                    'created_at' => $sale->created_at->toIso8601String(),
                ],
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'error' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Kiosk: Create sale failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Upload multiple sales (batch, offline queue)
     *
     * POST /api/kiosk/sales/upload
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function uploadSales(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'sales' => 'required|array|min:1|max:100', // Max 100 sales per batch
                'sales.*.local_id' => 'required|integer',
                'sales.*.user_id' => 'required|exists:users,id', // Kiosk user who made the sale
                'sales.*.branch_id' => 'required|exists:branches,id',
                'sales.*.customer_id' => 'nullable|exists:customers,id',
                'sales.*.items' => 'required|array|min:1',
                'sales.*.items.*.product_id' => 'required|exists:products,id',
                'sales.*.items.*.variant_id' => 'nullable|exists:product_variants,id',
                'sales.*.items.*.quantity' => 'required|numeric|min:0.001',
                'sales.*.items.*.unit_price' => 'required|numeric|min:0',
                'sales.*.items.*.discount_amount' => 'nullable|numeric|min:0',
                'sales.*.payments' => 'nullable|array',
                'sales.*.payments.*.method' => 'required|in:cash,card,bank_transfer,bank_credit',
                'sales.*.payments.*.amount' => 'required|numeric|min:0',
                'sales.*.subtotal' => 'required|numeric|min:0',
                'sales.*.tax_amount' => 'nullable|numeric|min:0',
                'sales.*.discount_amount' => 'nullable|numeric|min:0',
                'sales.*.total' => 'required|numeric|min:0',
                'sales.*.payment_status' => 'required|in:paid,credit,partial',
                'sales.*.notes' => 'nullable|string|max:1000',
                'sales.*.fiscal_number' => 'nullable|string|max:100',
                'sales.*.fiscal_document_id' => 'nullable|string|max:255',
                'sales.*.created_at' => 'required|date',
            ]);

            $accountId = $request->input('kiosk_account_id');

            $result = $this->saleProcessor->processBatchSales($validated['sales'], $accountId);

            return response()->json([
                'success' => true,
                'results' => $result['results'],
                'failed' => $result['failed'],
                'summary' => [
                    'total' => count($validated['sales']),
                    'successful' => count($result['results']),
                    'failed' => count($result['failed']),
                ],
            ], 200);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'error' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Kiosk: Batch upload failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get sale status by local ID (check if synced)
     *
     * GET /api/kiosk/sales/status/{localId}
     *
     * @param Request $request
     * @param string $localId
     * @return JsonResponse
     */
    public function getSaleStatus(Request $request, string $localId): JsonResponse
    {
        try {
            $accountId = $request->input('kiosk_account_id');

            $status = $this->saleProcessor->getSaleStatusByLocalId($localId, $accountId);

            if (!$status) {
                return response()->json([
                    'success' => false,
                    'error' => 'Sale not found',
                    'synced' => false,
                ], 404);
            }

            return response()->json([
                'success' => true,
                'synced' => true,
                'sale' => $status,
            ], 200);
        } catch (\Exception $e) {
            Log::error('Kiosk: Get sale status failed', [
                'local_id' => $localId,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Validate sale data (reused validation logic from POSController)
     *
     * @param Request $request
     * @return array
     * @throws ValidationException
     */
    protected function validateSaleData(Request $request): array
    {
        $rules = [
            'local_id' => 'nullable|integer', // For idempotency tracking
            'user_id' => 'required|exists:users,id', // Kiosk user who made the sale
            'customer_id' => 'nullable|exists:customers,id',
            'branch_id' => 'required|exists:branches,id',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.variant_id' => 'nullable|exists:product_variants,id',
            'items.*.quantity' => 'required|numeric|min:0.001',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.discount_amount' => 'nullable|numeric|min:0',
            'payments' => 'nullable|array',
            'payments.*.method' => 'required|in:cash,card,bank_transfer,bank_credit',
            'payments.*.amount' => 'required|numeric|min:0',
            'tax_amount' => 'nullable|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
            'payment_status' => 'required|in:paid,credit,partial',
            'fiscal_number' => 'nullable|string|max:100', // From kiosk's direct fiscal print
            'fiscal_document_id' => 'nullable|string|max:255',
            'created_at' => 'nullable|date', // When sale was created on kiosk
        ];

        // For credit or partial payment, customer is required
        if (in_array($request->payment_status, ['credit', 'partial'])) {
            $rules['customer_id'] = 'required|exists:customers,id';
        }

        return $request->validate($rules);
    }
}
