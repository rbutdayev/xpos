<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\SaleReturn;
use App\Services\ReturnService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ReturnController extends Controller
{
    public function __construct(
        protected ReturnService $returnService
    ) {}

    /**
     * Display list of returns
     */
    public function index(Request $request)
    {
        Gate::authorize('access-account-data');

        $accountId = auth()->user()->account_id;

        $query = SaleReturn::with(['sale', 'customer', 'user', 'items.product'])
            ->where('account_id', $accountId)
            ->orderBy('return_date', 'desc');

        // Search filter
        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('return_number', 'like', "%{$search}%")
                  ->orWhereHas('sale', function ($q) use ($search) {
                      $q->where('sale_number', 'like', "%{$search}%");
                  })
                  ->orWhereHas('customer', function ($q) use ($search) {
                      $q->where('name', 'like', "%{$search}%");
                  });
            });
        }

        // Date filter
        if ($request->has('start_date')) {
            $query->whereDate('return_date', '>=', $request->get('start_date'));
        }

        if ($request->has('end_date')) {
            $query->whereDate('return_date', '<=', $request->get('end_date'));
        }

        // Status filter
        if ($request->has('status')) {
            $query->where('status', $request->get('status'));
        }

        $returns = $query->paginate(20);
        $statistics = $this->returnService->getStatistics($accountId);

        return Inertia::render('Returns/Index', [
            'returns' => $returns,
            'statistics' => $statistics,
            'filters' => $request->only(['search', 'start_date', 'end_date', 'status']),
        ]);
    }

    /**
     * Show the form for creating a new return
     */
    public function create(Request $request)
    {
        Gate::authorize('manage-products');

        $accountId = auth()->user()->account_id;
        $saleId = $request->get('sale_id');

        if (!$saleId) {
            return back()->withErrors(['error' => 'Satış ID lazımdır']);
        }

        // Load sale with items
        $sale = Sale::with(['items.product.variants', 'customer', 'payments'])
            ->where('account_id', $accountId)
            ->where('sale_id', $saleId)
            ->firstOrFail();

        return Inertia::render('Returns/Create', [
            'sale' => $sale,
        ]);
    }

    /**
     * Store a newly created return
     */
    public function store(Request $request)
    {
        Gate::authorize('manage-products');

        $validated = $request->validate([
            'sale_id' => 'required|exists:sales,sale_id',
            'items' => 'required|array|min:1',
            'items.*.sale_item_id' => 'required|exists:sale_items,item_id',
            'items.*.quantity' => 'required|numeric|min:0.001',
            'items.*.reason' => 'nullable|string|max:500',
            'reason' => 'nullable|string|max:1000',
            'notes' => 'nullable|string|max:1000',
            'use_fiscal_printer' => 'boolean',
        ]);

        $accountId = auth()->user()->account_id;

        $result = $this->returnService->processReturn(
            $accountId,
            $validated['sale_id'],
            $validated['items'],
            $validated['reason'] ?? null,
            $validated['notes'] ?? null,
            $validated['use_fiscal_printer'] ?? false
        );

        if ($result['success']) {
            return redirect()->route('returns.show', $result['return']->return_id)
                ->with('success', $result['message']);
        } else {
            return back()
                ->withInput()
                ->withErrors(['error' => $result['error']]);
        }
    }

    /**
     * Display the specified return
     */
    public function show(int $id)
    {
        Gate::authorize('access-account-data');

        $accountId = auth()->user()->account_id;

        $return = SaleReturn::with([
            'sale.items.product',
            'items.product',
            'items.saleItem',
            'refunds.payment',
            'customer',
            'user',
            'branch'
        ])
            ->where('account_id', $accountId)
            ->where('return_id', $id)
            ->firstOrFail();

        return Inertia::render('Returns/Show', [
            'return' => $return,
        ]);
    }

    /**
     * Cancel a return (admin only)
     */
    public function cancel(int $id)
    {
        Gate::authorize('delete-account-data');

        $accountId = auth()->user()->account_id;

        $return = SaleReturn::where('account_id', $accountId)
            ->where('return_id', $id)
            ->firstOrFail();

        if ($return->status === 'cancelled') {
            return back()->withErrors(['error' => 'Qaytarma artıq ləğv edilib']);
        }

        // Note: Cancelling a return is complex - it would need to:
        // 1. Reverse inventory adjustments
        // 2. Reverse refunds
        // 3. Update fiscal records
        // For now, we just mark it as cancelled
        $return->status = 'cancelled';
        $return->save();

        return back()->with('success', 'Qaytarma ləğv edildi');
    }

    /**
     * Get sale details for return creation (API endpoint)
     */
    public function getSaleForReturn(int $saleId)
    {
        Gate::authorize('access-account-data');

        $accountId = auth()->user()->account_id;

        $sale = Sale::with(['items.product', 'items.variant', 'customer', 'payments', 'returns.items'])
            ->where('account_id', $accountId)
            ->where('sale_id', $saleId)
            ->firstOrFail();

        // Calculate how much of each item has already been returned
        $returnedQuantities = [];
        foreach ($sale->returns as $return) {
            if ($return->status !== 'cancelled') {
                foreach ($return->items as $item) {
                    $saleItemId = $item->sale_item_id;
                    $returnedQuantities[$saleItemId] = ($returnedQuantities[$saleItemId] ?? 0) + $item->quantity;
                }
            }
        }

        // Add available quantity to each sale item
        foreach ($sale->items as $item) {
            $item->returned_quantity = $returnedQuantities[$item->item_id] ?? 0;
            $item->available_for_return = $item->quantity - $item->returned_quantity;
        }

        return response()->json([
            'success' => true,
            'sale' => $sale,
        ]);
    }

    /**
     * Bulk delete sale returns
     */
    public function bulkDelete(Request $request)
    {
        Gate::authorize('delete-account-data');

        $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'required|integer',
        ]);

        $user = auth()->user();
        $accountId = $user->account_id;
        $deletedCount = 0;
        $failedReturns = [];

        DB::beginTransaction();

        try {
            $returns = SaleReturn::whereIn('return_id', $request->ids)
                ->where('account_id', $accountId)
                ->get();

            foreach ($returns as $return) {
                try {
                    // Check if return can be deleted based on status
                    // Typically, we should not delete completed returns that have fiscal receipts
                    // But allow deletion of pending or cancelled returns
                    if ($return->status === 'completed' && $return->fiscal_number) {
                        $failedReturns[] = "#{$return->return_number} (Fiskal qəbz mövcuddur)";
                        continue;
                    }

                    // Delete related data
                    // Delete return items
                    if ($return->items) {
                        $return->items()->delete();
                    }

                    // Delete refunds if any
                    if ($return->refunds) {
                        $return->refunds()->delete();
                    }

                    // Delete the return
                    $return->delete();
                    $deletedCount++;
                } catch (\Exception $e) {
                    \Log::error('Failed to delete return during bulk deletion: ' . $e->getMessage(), [
                        'return_id' => $return->return_id,
                        'trace' => $e->getTraceAsString(),
                    ]);
                    $failedReturns[] = "#{$return->return_number}";
                }
            }

            DB::commit();

            if (count($failedReturns) > 0) {
                $failedList = implode(', ', $failedReturns);
                $message = $deletedCount > 0
                    ? "{$deletedCount} qaytarma silindi. Bu qaytarmalar silinə bilmədi: {$failedList}"
                    : "Heç bir qaytarma silinmədi. Bu qaytarmalar silinə bilməz: {$failedList}";

                return redirect()->route('returns.index')
                    ->with($deletedCount > 0 ? 'warning' : 'error', $message);
            }

            return redirect()->route('returns.index')
                ->with('success', "{$deletedCount} qaytarma uğurla silindi.");
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Bulk delete failed: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return redirect()->route('returns.index')
                ->with('error', 'Toplu silmə əməliyyatı uğursuz oldu.');
        }
    }
}
