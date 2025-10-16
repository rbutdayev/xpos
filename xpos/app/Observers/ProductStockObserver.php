<?php

namespace App\Observers;

use App\Models\MinMaxAlert;
use App\Models\ProductStock;

class ProductStockObserver
{
    /**
     * Handle the ProductStock "updated" event.
     */
    public function updated(ProductStock $productStock): void
    {
        // Only generate alerts if quantity changed
        if ($productStock->wasChanged('quantity')) {
            $this->generateAlertsForStock($productStock);
        }
    }

    /**
     * Handle the ProductStock "created" event.
     */
    public function created(ProductStock $productStock): void
    {
        $this->generateAlertsForStock($productStock);
    }

    private function generateAlertsForStock(ProductStock $stock): void
    {
        // Clear existing alerts for this specific product-warehouse combination
        MinMaxAlert::where('warehouse_id', $stock->warehouse_id)
                   ->where('product_id', $stock->product_id)
                   ->where('status', 'active')
                   ->delete();

        $currentStock = $stock->quantity;
        $product = $stock->product;
        $warehouse = $stock->warehouse;

        // Check for negative stock (highest priority)
        if ($currentStock < 0) {
            MinMaxAlert::create([
                'account_id' => $stock->account_id,
                'warehouse_id' => $stock->warehouse_id,
                'product_id' => $stock->product_id,
                'current_stock' => $currentStock,
                'min_level' => $stock->min_level,
                'max_level' => $stock->max_level,
                'alert_type' => 'min_level',
                'status' => 'active',
                'alert_date' => now(),
            ]);
        }
        // Check for minimum level alert
        elseif ($stock->min_level !== null && $currentStock <= $stock->min_level) {
            MinMaxAlert::create([
                'account_id' => $stock->account_id,
                'warehouse_id' => $stock->warehouse_id,
                'product_id' => $stock->product_id,
                'current_stock' => $currentStock,
                'min_level' => $stock->min_level,
                'max_level' => $stock->max_level,
                'alert_type' => 'min_level',
                'status' => 'active',
                'alert_date' => now(),
            ]);
        }

        // Check for maximum level alert (can coexist with min level alerts)
        if ($stock->max_level !== null && $currentStock > $stock->max_level) {
            MinMaxAlert::create([
                'account_id' => $stock->account_id,
                'warehouse_id' => $stock->warehouse_id,
                'product_id' => $stock->product_id,
                'current_stock' => $currentStock,
                'min_level' => $stock->min_level,
                'max_level' => $stock->max_level,
                'alert_type' => 'max_level',
                'status' => 'active',
                'alert_date' => now(),
            ]);
        }
    }
}