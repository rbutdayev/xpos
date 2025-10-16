<?php

namespace App\Console\Commands;

use App\Models\MinMaxAlert;
use App\Models\ProductStock;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class GenerateStockAlerts extends Command
{
    protected $signature = 'alerts:generate';
    protected $description = 'Generate stock alerts based on current stock levels and thresholds';

    public function handle(): int
    {
        $this->info('Generating stock alerts...');

        DB::transaction(function () {
            // Clear existing active alerts to regenerate fresh ones
            MinMaxAlert::where('status', 'active')->delete();

            $alertsGenerated = 0;

            // Get all product stocks with their thresholds
            $stocks = ProductStock::with(['product', 'warehouse'])
                ->where(function ($query) {
                    $query->whereNotNull('min_level')
                          ->orWhereNotNull('max_level');
                })
                ->get();

            foreach ($stocks as $stock) {
                $alerts = $this->checkStockForAlerts($stock);
                $alertsGenerated += count($alerts);
            }

            $this->info("Generated {$alertsGenerated} alerts");
        });

        return 0;
    }

    private function checkStockForAlerts(ProductStock $stock): array
    {
        $alerts = [];
        $currentStock = $stock->quantity;

        // Check for negative stock
        if ($currentStock < 0) {
            $alerts[] = $this->createAlert($stock, 'min_level', 
                "Mənfi stok: {$stock->product->name} anbarında {$stock->warehouse->name} mənfi stokdadır ({$currentStock})"
            );
        }
        // Check for minimum level alert
        elseif ($stock->min_level !== null && $currentStock <= $stock->min_level) {
            $alerts[] = $this->createAlert($stock, 'min_level', 
                "Az stok: {$stock->product->name} anbarında {$stock->warehouse->name} minimum səviyyədən aşağıdır ({$currentStock} / min: {$stock->min_level})"
            );
        }

        // Check for maximum level alert
        if ($stock->max_level !== null && $currentStock > $stock->max_level) {
            $alerts[] = $this->createAlert($stock, 'max_level', 
                "Çox stok: {$stock->product->name} anbarında {$stock->warehouse->name} maksimum səviyyədən yuxarıdır ({$currentStock} / max: {$stock->max_level})"
            );
        }

        return $alerts;
    }

    private function createAlert(ProductStock $stock, string $alertType, string $message): MinMaxAlert
    {
        return MinMaxAlert::create([
            'account_id' => $stock->account_id,
            'warehouse_id' => $stock->warehouse_id,
            'product_id' => $stock->product_id,
            'current_stock' => $stock->quantity,
            'min_level' => $stock->min_level,
            'max_level' => $stock->max_level,
            'alert_type' => $alertType,
            'status' => 'active',
            'alert_date' => now(),
        ]);
    }
}