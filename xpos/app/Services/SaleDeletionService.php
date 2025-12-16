<?php

namespace App\Services;

use App\Models\Sale;
use App\Models\ProductStock;
use App\Models\StockHistory;
use App\Models\StockMovement;
use App\Models\Branch;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Services\DashboardService;

class SaleDeletionService
{
    /**
     * Delete a sale and restore all related data
     * - Restore product stock
     * - Remove payments from the system
     * - Handle customer credit if exists
     * - Soft delete the sale
     * - Clear dashboard cache to reflect changes
     */
    public function deleteSale(Sale $sale, int $userId): void
    {
        DB::transaction(function () use ($sale, $userId) {
            // 1. Restore stock for all sale items
            $this->restoreStock($sale);

            // 2. Handle customer credit if exists
            if ($sale->customer_credit_id && $sale->customerCredit) {
                $this->handleCustomerCredit($sale);
            }

            // 3. Note: Payments, items, and alerts will be maintained for audit trail
            // They are related to the sale via foreign key, and the sale is soft deleted
            // so they will still be accessible through the deleted sale for audit purposes

            // 4. Record who deleted the sale
            $sale->deleted_by = $userId;
            $sale->save();

            // 5. Soft delete the sale
            $sale->delete();

            // 6. Clear dashboard cache so the deleted sale doesn't appear in revenue
            $dashboardService = app(DashboardService::class);
            $dashboardService->clearCache($sale->account);

            Log::info('Sale deleted successfully', [
                'sale_id' => $sale->sale_id,
                'sale_number' => $sale->sale_number,
                'deleted_by' => $userId,
                'account_id' => $sale->account_id,
            ]);
        });
    }

    /**
     * Restore stock for all items in the sale
     */
    private function restoreStock(Sale $sale): void
    {
        // Get the branch and its accessible warehouses
        $branch = Branch::find($sale->branch_id);

        if (!$branch) {
            throw new \Exception('Branch not found for this sale.');
        }

        // Get the first warehouse that the branch can modify stock for
        $warehouse = $branch->warehouses()
            ->wherePivot('can_modify_stock', true)
            ->first();

        // If no accessible warehouse with modify permissions, fall back to main warehouse
        if (!$warehouse) {
            $warehouse = \App\Models\Warehouse::where('account_id', $sale->account_id)
                ->where('type', 'main')
                ->first();
        }

        if (!$warehouse) {
            throw new \Exception('No warehouse found for stock restoration.');
        }

        // Restore stock for each item
        foreach ($sale->items as $item) {
            // Find the product stock record
            $productStock = ProductStock::firstOrCreate([
                'product_id' => $item->product_id,
                'warehouse_id' => $warehouse->id,
                'account_id' => $sale->account_id,
            ], [
                'quantity' => 0,
                'min_level' => 3,
            ]);

            $quantityBefore = $productStock->quantity;

            // Restore the quantity (add it back)
            $productStock->increment('quantity', $item->quantity);

            // Create stock history record
            StockHistory::create([
                'product_id' => $item->product_id,
                'warehouse_id' => $warehouse->id,
                'quantity_before' => $quantityBefore,
                'quantity_change' => $item->quantity,
                'quantity_after' => $quantityBefore + $item->quantity,
                'type' => 'daxil_olma',
                'reference_type' => 'sale_deletion',
                'reference_id' => $sale->sale_id,
                'user_id' => auth()->id(),
                'notes' => "Satış #{$sale->sale_number} silinməsi üçün stok bərpası",
                'occurred_at' => now(),
            ]);

            // Create stock movement record
            StockMovement::create([
                'account_id' => $sale->account_id,
                'warehouse_id' => $warehouse->id,
                'product_id' => $item->product_id,
                'movement_type' => 'daxil_olma',
                'quantity' => $item->quantity,
                'reference_type' => 'sale_deletion',
                'reference_id' => $sale->sale_id,
                'employee_id' => null,
                'notes' => "Satış #{$sale->sale_number} silinməsi üçün stok bərpası",
            ]);

            Log::info('Stock restored for sale item', [
                'sale_id' => $sale->sale_id,
                'product_id' => $item->product_id,
                'quantity' => $item->quantity,
                'warehouse_id' => $warehouse->id,
            ]);
        }
    }

    /**
     * Handle customer credit - mark it as cancelled/deleted
     */
    private function handleCustomerCredit(Sale $sale): void
    {
        $customerCredit = $sale->customerCredit;

        if ($customerCredit) {
            // Mark the customer credit as cancelled
            $customerCredit->update([
                'status' => 'cancelled',
            ]);

            // If the CustomerCredit model has soft deletes, delete it
            if (method_exists($customerCredit, 'delete')) {
                $customerCredit->delete();
            }

            Log::info('Customer credit handled for deleted sale', [
                'sale_id' => $sale->sale_id,
                'credit_id' => $customerCredit->id,
                'credit_amount' => $customerCredit->amount,
            ]);
        }
    }
}
