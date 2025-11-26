<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;
use App\Models\ProductStock;
use App\Models\StockMovement;
use App\Models\Branch;
use App\Models\Warehouse;
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
        Gate::authorize('access-account-data');

        // Check if shop module is enabled
        if (!Auth::user()->account->shop_enabled) {
            abort(403, 'Online mağaza modulu aktivləşdirilməyib.');
        }

        $request->validate([
            'search' => 'nullable|string|max:255',
            'status' => 'nullable|string|in:pending,completed,cancelled',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
        ]);

        $query = Sale::with(['customer', 'branch', 'user', 'items.product:id,name,sku,barcode', 'items.variant'])
            ->where('account_id', Auth::user()->account_id)
            ->where('is_online_order', true);

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

        return Inertia::render('OnlineOrders/Index', [
            'orders' => $orders,
            'filters' => $request->only(['search', 'status', 'date_from', 'date_to']),
            'statusCounts' => $statusCounts,
        ]);
    }

    /**
     * Update order status
     */
    public function updateStatus(Request $request, Sale $sale)
    {
        Gate::authorize('access-account-data');

        // Check if shop module is enabled
        if (!Auth::user()->account->shop_enabled) {
            abort(403, 'Online mağaza modulu aktivləşdirilməyib.');
        }

        // Verify this is an online order and belongs to the user's account
        if (!$sale->is_online_order || $sale->account_id !== Auth::user()->account_id) {
            return back()->withErrors(['error' => 'Bu sifariş tapılmadı.']);
        }

        $request->validate([
            'status' => 'required|string|in:pending,completed,cancelled',
            'notes' => 'nullable|string|max:1000',
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

            Log::info('Online order status updated', [
                'sale_id' => $sale->sale_id,
                'old_status' => $oldStatus,
                'new_status' => $newStatus,
                'user_id' => Auth::id(),
            ]);

            return back()->with('success', 'Sifariş statusu yeniləndi.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to update online order status', [
                'sale_id' => $sale->sale_id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return back()->withErrors(['error' => 'Xəta: ' . $e->getMessage()]);
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
            throw new \Exception('Anbar tapılmadı. Stok yenilənə bilməz.');
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
                'notes' => "Online sifariş #{$sale->sale_number} satıldı",
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
            throw new \Exception('Anbar tapılmadı. Stok geri qaytarıla bilməz.');
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
                    'notes' => "Online sifariş #{$sale->sale_number} ləğv edildi/geri qaytarıldı",
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
        Gate::authorize('access-account-data');

        // Check if shop module is enabled
        if (!Auth::user()->account->shop_enabled) {
            abort(403, 'Online mağaza modulu aktivləşdirilməyib.');
        }

        // Verify this is an online order and belongs to the user's account
        if (!$sale->is_online_order || $sale->account_id !== Auth::user()->account_id) {
            return back()->withErrors(['error' => 'Bu sifariş tapılmadı.']);
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
                $sale->notes = $existingNotes . "[" . now()->format('Y-m-d H:i') . "] Ləğv edildi: " . $request->reason;
            }

            $sale->save();

            DB::commit();

            Log::info('Online order cancelled', [
                'sale_id' => $sale->sale_id,
                'old_status' => $oldStatus,
                'user_id' => Auth::id(),
                'reason' => $request->reason,
            ]);

            return back()->with('success', 'Sifariş ləğv edildi.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to cancel online order', [
                'sale_id' => $sale->sale_id,
                'error' => $e->getMessage(),
            ]);

            return back()->withErrors(['error' => 'Xəta: ' . $e->getMessage()]);
        }
    }
}
