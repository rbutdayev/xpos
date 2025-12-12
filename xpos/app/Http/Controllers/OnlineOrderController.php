<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;
use App\Models\ProductStock;
use App\Models\StockMovement;
use App\Models\Branch;
use App\Models\Warehouse;
use App\Models\FiscalPrinterConfig;
use App\Models\FiscalPrinterJob;
use App\Services\WoltService;
use App\Services\YangoService;
use App\Services\BoltService;
use App\Services\FiscalPrinterService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class OnlineOrderController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
        $this->middleware('account.access');
    }

    /**
     * Display online orders
     */
    public function index(Request $request)
    {
        Gate::authorize('manage-online-orders');

        // Check if shop module OR any delivery platform is enabled
        $account = Auth::user()->account;
        $hasOnlineOrdering = $account->shop_enabled ||
                             $account->wolt_enabled ||
                             $account->yango_enabled ||
                             $account->bolt_enabled;

        if (!$hasOnlineOrdering) {
            abort(403, __('errors.online_orders_not_enabled'));
        }

        $request->validate([
            'search' => 'nullable|string|max:255',
            'status' => 'nullable|string|in:pending,completed,cancelled',
            'source' => 'nullable|string|in:shop,wolt,yango,bolt',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
        ]);

        $query = Sale::with(['customer', 'branch', 'user', 'items.product:id,name,sku,barcode', 'items.variant'])
            ->where('account_id', Auth::user()->account_id)
            ->where('is_online_order', true);

        // If user is branch_manager, only show their branch's orders
        if (Auth::user()->role === 'branch_manager' && Auth::user()->branch_id) {
            $query->where('branch_id', Auth::user()->branch_id);
        }

        // Search by order number, customer name, phone
        if ($request->filled('search')) {
            $searchTerm = $request->input('search');
            $query->where(function($q) use ($searchTerm) {
                $q->where('sale_number', 'like', '%' . $searchTerm . '%')
                  ->orWhere('customer_name', 'like', '%' . $searchTerm . '%')
                  ->orWhere('customer_phone', 'like', '%' . $searchTerm . '%')
                  ->orWhere('notes', 'like', '%' . $searchTerm . '%');
            });
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by source
        if ($request->filled('source')) {
            $query->where('source', $request->source);
        }

        // Filter by date range
        if ($request->filled('date_from')) {
            $query->whereDate('sale_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('sale_date', '<=', $request->date_to);
        }

        $orders = $query->latest('sale_date')
            ->paginate(25)
            ->withQueryString();

        // Get counts for each status
        $statusCounts = Sale::where('account_id', Auth::user()->account_id)
            ->where('is_online_order', true)
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        // Get fiscal printer config
        $fiscalConfig = \App\Models\FiscalPrinterConfig::where('account_id', Auth::user()->account_id)
            ->where('is_active', true)
            ->first();

        return Inertia::render('OnlineOrders/Index', [
            'orders' => $orders,
            'filters' => $request->only(['search', 'status', 'source', 'date_from', 'date_to']),
            'statusCounts' => $statusCounts,
            'fiscalPrinterEnabled' => Auth::user()->account->fiscal_printer_enabled ?? false,
            'fiscalConfig' => $fiscalConfig,
        ]);
    }

    /**
     * Update order status
     */
    public function updateStatus(Request $request, Sale $sale)
    {
        Gate::authorize('manage-online-orders');

        // Check if shop module OR any delivery platform is enabled
        $account = Auth::user()->account;
        $hasOnlineOrdering = $account->shop_enabled ||
                             $account->wolt_enabled ||
                             $account->yango_enabled ||
                             $account->bolt_enabled;

        if (!$hasOnlineOrdering) {
            abort(403, __('errors.online_orders_not_enabled'));
        }

        // Verify this is an online order and belongs to the user's account
        if (!$sale->is_online_order || $sale->account_id !== Auth::user()->account_id) {
            return back()->withErrors(['error' => __('errors.order_not_found')]);
        }

        // If user is branch_manager, verify order belongs to their branch
        if (Auth::user()->role === 'branch_manager' && Auth::user()->branch_id) {
            if ($sale->branch_id !== Auth::user()->branch_id) {
                return back()->withErrors(['error' => __('errors.order_not_found')]);
            }
        }

        $request->validate([
            'status' => 'required|string|in:pending,completed,cancelled',
            'notes' => 'nullable|string|max:1000',
            'use_fiscal_printer' => 'nullable|boolean',
        ]);

        $oldStatus = $sale->status;
        $newStatus = $request->status;

        DB::beginTransaction();
        try {
            // Update status
            $sale->status = $newStatus;

            // If changing to 'completed', update user_id to the person who marked it as completed
            if ($newStatus === 'completed' && $oldStatus !== 'completed') {
                $sale->user_id = Auth::id(); // Track who completed the sale

                // Mark as paid - online order is considered paid when completed
                $sale->payment_status = 'paid';
                $sale->paid_amount = $sale->total;
                $sale->credit_amount = 0;
            }

            // Add notes if provided
            if ($request->filled('notes')) {
                $existingNotes = $sale->notes ? $sale->notes . "\n\n" : '';
                $sale->notes = $existingNotes . "[" . now()->format('Y-m-d H:i') . "] " . $request->notes;
            }

            // If changing to 'completed', deduct stock from warehouse
            if ($newStatus === 'completed' && $oldStatus !== 'completed') {
                $this->deductStockForOrder($sale);
            }

            // If changing from 'completed' back to another status, restore stock and reset payment status
            if ($oldStatus === 'completed' && $newStatus !== 'completed') {
                $this->restoreStockForOrder($sale);

                // Reset payment status back to credit (unpaid)
                $sale->payment_status = 'credit';
                $sale->paid_amount = 0;
                $sale->credit_amount = $sale->total;
            }

            $sale->save();

            DB::commit();

            // Send to fiscal printer if enabled and requested
            if ($newStatus === 'completed' &&
                $oldStatus !== 'completed' &&
                Auth::user()->account->fiscal_printer_enabled &&
                ($request->use_fiscal_printer ?? true)) {

                $this->queueFiscalPrinting($sale);
            }

            Log::info('Online order status updated', [
                'sale_id' => $sale->sale_id,
                'old_status' => $oldStatus,
                'new_status' => $newStatus,
                'user_id' => Auth::id(),
            ]);

            // Sync status to platform (happens after DB commit, errors don't affect local update)
            $this->syncStatusToPlatform($sale, $newStatus);

            return back()->with('success', __('orders.status_updated'));

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to update online order status', [
                'sale_id' => $sale->sale_id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return back()->withErrors(['error' => __('errors.error') . ': ' . $e->getMessage()]);
        }
    }

    /**
     * Deduct stock when order is marked as 'sold'
     */
    private function deductStockForOrder(Sale $sale): void
    {
        // Get the main warehouse for this account
        $warehouse = Warehouse::where('account_id', $sale->account_id)
            ->where('type', 'main')
            ->first();

        if (!$warehouse) {
            throw new \Exception(__('errors.warehouse_not_found_stock_cannot_update'));
        }

        foreach ($sale->items as $item) {
            // Find or create product stock
            $productStock = ProductStock::firstOrCreate([
                'product_id' => $item->product_id,
                'variant_id' => $item->variant_id,
                'warehouse_id' => $warehouse->id,
                'account_id' => $sale->account_id,
            ], [
                'quantity' => 0,
                'min_level' => 3,
            ]);

            // Deduct stock
            $productStock->decrement('quantity', $item->quantity);

            // Create stock movement record
            StockMovement::create([
                'account_id' => $sale->account_id,
                'warehouse_id' => $warehouse->id,
                'product_id' => $item->product_id,
                'variant_id' => $item->variant_id,
                'movement_type' => 'xaric_olma',
                'quantity' => -$item->quantity,
                'reference_type' => 'sale',
                'reference_id' => $sale->sale_id,
                'notes' => __('orders.online_order_sold', ['sale_number' => $sale->sale_number]),
            ]);

            Log::info('Stock deducted for online order', [
                'sale_id' => $sale->sale_id,
                'product_id' => $item->product_id,
                'variant_id' => $item->variant_id,
                'quantity' => $item->quantity,
            ]);
        }
    }

    /**
     * Restore stock when order status changes from 'sold' back
     */
    private function restoreStockForOrder(Sale $sale): void
    {
        // Get the main warehouse
        $warehouse = Warehouse::where('account_id', $sale->account_id)
            ->where('type', 'main')
            ->first();

        if (!$warehouse) {
            throw new \Exception(__('errors.warehouse_not_found_stock_cannot_restore'));
        }

        foreach ($sale->items as $item) {
            // Find product stock
            $productStock = ProductStock::where([
                'product_id' => $item->product_id,
                'variant_id' => $item->variant_id,
                'warehouse_id' => $warehouse->id,
                'account_id' => $sale->account_id,
            ])->first();

            if ($productStock) {
                // Add stock back
                $productStock->increment('quantity', $item->quantity);

                // Create reverse stock movement
                StockMovement::create([
                    'account_id' => $sale->account_id,
                    'warehouse_id' => $warehouse->id,
                    'product_id' => $item->product_id,
                    'variant_id' => $item->variant_id,
                    'movement_type' => 'daxil_olma',
                    'quantity' => $item->quantity,
                    'reference_type' => 'sale',
                    'reference_id' => $sale->sale_id,
                    'notes' => __('orders.online_order_cancelled_returned', ['sale_number' => $sale->sale_number]),
                ]);

                Log::info('Stock restored for cancelled/reverted online order', [
                    'sale_id' => $sale->sale_id,
                    'product_id' => $item->product_id,
                    'variant_id' => $item->variant_id,
                    'quantity' => $item->quantity,
                ]);
            }
        }
    }

    /**
     * Cancel an order
     */
    public function cancel(Request $request, Sale $sale)
    {
        Gate::authorize('manage-online-orders');

        // Check if shop module OR any delivery platform is enabled
        $account = Auth::user()->account;
        $hasOnlineOrdering = $account->shop_enabled ||
                             $account->wolt_enabled ||
                             $account->yango_enabled ||
                             $account->bolt_enabled;

        if (!$hasOnlineOrdering) {
            abort(403, __('errors.online_orders_not_enabled'));
        }

        // Verify this is an online order and belongs to the user's account
        if (!$sale->is_online_order || $sale->account_id !== Auth::user()->account_id) {
            return back()->withErrors(['error' => __('errors.order_not_found')]);
        }

        // If user is branch_manager, verify order belongs to their branch
        if (Auth::user()->role === 'branch_manager' && Auth::user()->branch_id) {
            if ($sale->branch_id !== Auth::user()->branch_id) {
                return back()->withErrors(['error' => __('errors.order_not_found')]);
            }
        }

        $request->validate([
            'reason' => 'nullable|string|max:500',
        ]);

        DB::beginTransaction();
        try {
            $oldStatus = $sale->status;

            // If order was 'completed', restore stock and reset payment status
            if ($oldStatus === 'completed') {
                $this->restoreStockForOrder($sale);

                // Reset payment status back to credit (unpaid)
                $sale->payment_status = 'credit';
                $sale->paid_amount = 0;
                $sale->credit_amount = $sale->total;
            }

            // Update to cancelled
            $sale->status = 'cancelled';

            // Add cancellation reason
            if ($request->filled('reason')) {
                $existingNotes = $sale->notes ? $sale->notes . "\n\n" : '';
                $sale->notes = $existingNotes . "[" . now()->format('Y-m-d H:i') . "] " . __('orders.cancelled_reason', ['reason' => $request->reason]);
            }

            $sale->save();

            DB::commit();

            Log::info('Online order cancelled', [
                'sale_id' => $sale->sale_id,
                'old_status' => $oldStatus,
                'user_id' => Auth::id(),
                'reason' => $request->reason,
            ]);

            // Sync cancelled status to platform (happens after DB commit, errors don't affect local update)
            $this->syncStatusToPlatform($sale, 'cancelled');

            return back()->with('success', __('orders.order_cancelled'));

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to cancel online order', [
                'sale_id' => $sale->sale_id,
                'error' => $e->getMessage(),
            ]);

            return back()->withErrors(['error' => __('errors.error') . ': ' . $e->getMessage()]);
        }
    }

    /**
     * Sync order status to the delivery platform
     *
     * @param Sale $sale
     * @param string $newStatus
     * @return bool
     */
    private function syncStatusToPlatform(Sale $sale, string $newStatus): bool
    {
        // Only sync if this is a platform order
        if (!$sale->isPlatformOrder()) {
            return false;
        }

        // Only sync if we have a platform order ID
        if (empty($sale->platform_order_id)) {
            Log::warning('Cannot sync status to platform: missing platform_order_id', [
                'sale_id' => $sale->sale_id,
                'source' => $sale->source,
            ]);
            return false;
        }

        try {
            $account = $sale->account;
            $platformOrderId = $sale->platform_order_id;
            $success = false;

            // Determine which platform service to use
            switch ($sale->source) {
                case 'wolt':
                    $woltService = new WoltService();
                    $success = $woltService->updateOrderStatus($account, $platformOrderId, $newStatus);
                    break;

                case 'yango':
                    $yangoService = new YangoService();
                    $success = $yangoService->updateOrderStatus($account, $platformOrderId, $newStatus);
                    break;

                case 'bolt':
                    $boltService = new BoltService();
                    $success = $boltService->updateOrderStatus($account, $platformOrderId, $newStatus);
                    break;

                default:
                    Log::warning('Unknown platform source', [
                        'sale_id' => $sale->sale_id,
                        'source' => $sale->source,
                    ]);
                    return false;
            }

            if ($success) {
                Log::info('Platform status sync successful', [
                    'sale_id' => $sale->sale_id,
                    'source' => $sale->source,
                    'platform_order_id' => $platformOrderId,
                    'status' => $newStatus,
                ]);
            } else {
                Log::warning('Platform status sync failed', [
                    'sale_id' => $sale->sale_id,
                    'source' => $sale->source,
                    'platform_order_id' => $platformOrderId,
                    'status' => $newStatus,
                ]);
            }

            return $success;

        } catch (\Exception $e) {
            // Log the error but don't fail the local status update
            Log::error('Exception during platform status sync', [
                'sale_id' => $sale->sale_id,
                'source' => $sale->source,
                'platform_order_id' => $sale->platform_order_id,
                'status' => $newStatus,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return false;
        }
    }

    /**
     * Queue fiscal printing job for the sale
     *
     * @param Sale $sale
     * @return void
     */
    private function queueFiscalPrinting(Sale $sale): void
    {
        try {
            $config = FiscalPrinterConfig::where('account_id', $sale->account_id)
                ->where('is_active', true)
                ->first();

            if (!$config) {
                Log::warning('Fiscal printer config not found', [
                    'account_id' => $sale->account_id,
                    'sale_id' => $sale->sale_id,
                ]);
                return;
            }

            // Validate shift status before creating fiscal job
            if (!$config->isShiftValid()) {
                $errorMsg = 'Fiskal növbə bağlıdır və ya vaxtı bitib.';

                if (!$config->isShiftOpen()) {
                    $errorMsg = 'Fiskal növbə bağlıdır. Zəhmət olmasa növbəni açın.';
                } elseif ($config->isShiftExpired()) {
                    $errorMsg = 'Fiskal növbə vaxtı bitib (24 saat). Növbəni bağlayıb yeni növbə açın.';
                }

                Log::warning('Fiscal shift validation failed for online order', [
                    'account_id' => $sale->account_id,
                    'sale_id' => $sale->sale_id,
                    'shift_open' => $config->shift_open,
                    'error' => $errorMsg
                ]);

                // Don't create fiscal job, but allow sale completion to continue
                return;
            }

            // Queue job for bridge to pick up
            $fiscalService = app(FiscalPrinterService::class);
            $requestData = $fiscalService->getFormattedRequestData($config, $sale);

            FiscalPrinterJob::create([
                'account_id' => $sale->account_id,
                'sale_id' => $sale->sale_id,
                'status' => FiscalPrinterJob::STATUS_PENDING,
                'request_data' => $requestData,
                'provider' => $config->provider,
            ]);

            Log::info('Fiscal print job queued for online order', [
                'sale_id' => $sale->sale_id,
                'account_id' => $sale->account_id,
            ]);

        } catch (\Exception $e) {
            // Log the error but don't fail the sale completion
            Log::error('Failed to queue fiscal printing for online order', [
                'sale_id' => $sale->sale_id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }
}
