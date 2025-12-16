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

class SaleRestorationService
{
    /**
     * Restore a deleted sale and reverse the deletion operations
     * - Deduct stock again (reverse the stock restoration that happened on delete)
     * - Restore customer credit if it was cancelled
     * - Add amounts back to the system
     * - Clear dashboard cache to reflect changes
     */
    public function restoreSale(Sale $sale, int $userId): void
    {
        DB::transaction(function () use ($sale, $userId) {
            // 1. Deduct stock again (reverse the restoration)
            $this->deductStock($sale);

            // 2. Restore customer credit if it was cancelled
            if ($sale->customer_credit_id && $sale->customerCredit) {
                $this->restoreCustomerCredit($sale);
            }

            // 3. Restore the sale
            $sale->restore();

            // 4. Clear dashboard cache so the restored sale appears in revenue again
            $dashboardService = app(DashboardService::class);
            $dashboardService->clearCache($sale->account);

            Log::info('Sale restored successfully', [
                'sale_id' => $sale->sale_id,
                'sale_number' => $sale->sale_number,
                'restored_by' => $userId,
                'account_id' => $sale->account_id,
            ]);
        });
    }

    /**
     * Deduct stock again for all items in the sale
     * (Reverses the stock restoration that happened when sale was deleted)
     */
    private function deductStock(Sale $sale): void
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
            throw new \Exception('No warehouse found for stock deduction.');
        }

        // Deduct stock for each item
        foreach ($sale->items as $item) {
            // Find the product stock record
            $productStock = ProductStock::where([
                'product_id' => $item->product_id,
                'warehouse_id' => $warehouse->id,
                'account_id' => $sale->account_id,
            ])->first();

            if (!$productStock) {
                throw new \Exception("Product stock not found for product {$item->product_id}");
            }

            $quantityBefore = $productStock->quantity;

            // Deduct the quantity (remove it again)
            $productStock->decrement('quantity', $item->quantity);

            // Create stock history record
            StockHistory::create([
                'product_id' => $item->product_id,
                'warehouse_id' => $warehouse->id,
                'quantity_before' => $quantityBefore,
                'quantity_change' => -$item->quantity,
                'quantity_after' => $quantityBefore - $item->quantity,
                'type' => 'chixish',
                'reference_type' => 'sale_restoration',
                'reference_id' => $sale->sale_id,
                'user_id' => auth()->id(),
                'notes' => "Satış #{$sale->sale_number} bərpası üçün stok çıxışı",
                'occurred_at' => now(),
            ]);

            // Create stock movement record
            StockMovement::create([
                'account_id' => $sale->account_id,
                'warehouse_id' => $warehouse->id,
                'product_id' => $item->product_id,
                'movement_type' => 'chixish',
                'quantity' => $item->quantity,
                'reference_type' => 'sale_restoration',
                'reference_id' => $sale->sale_id,
                'employee_id' => null,
                'notes' => "Satış #{$sale->sale_number} bərpası üçün stok çıxışı",
            ]);

            Log::info('Stock deducted for restored sale', [
                'sale_id' => $sale->sale_id,
                'product_id' => $item->product_id,
                'quantity' => $item->quantity,
                'warehouse_id' => $warehouse->id,
            ]);
        }
    }

    /**
     * Restore customer credit if it was cancelled during deletion
     */
    private function restoreCustomerCredit(Sale $sale): void
    {
        $customerCredit = $sale->customerCredit()->withTrashed()->first();

        if ($customerCredit) {
            // If it was soft deleted, restore it
            if ($customerCredit->trashed()) {
                $customerCredit->restore();
            }

            // Restore the status to unpaid
            $customerCredit->update([
                'status' => 'unpaid',
            ]);

            Log::info('Customer credit restored for sale', [
                'sale_id' => $sale->sale_id,
                'credit_id' => $customerCredit->id,
                'credit_amount' => $customerCredit->amount,
            ]);
        }
    }
}
