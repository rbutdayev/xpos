<?php

namespace App\Console\Commands;

use App\Models\GoodsReceipt;
use App\Models\GoodsReceiptItem;
use App\Models\Supplier;
use App\Models\Product;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class SyncSupplierProducts extends Command
{
    protected $signature = 'suppliers:sync-products {--account-id= : Specific account ID to sync}';
    protected $description = 'Sync supplier-product relationships from existing goods receipts';

    public function handle()
    {
        $this->info('Starting supplier-product synchronization...');

        $accountId = $this->option('account-id');

        // Get unique supplier-product combinations from goods receipt items
        $query = DB::table('goods_receipt_items as gri')
            ->join('goods_receipts as gr', 'gri.goods_receipt_id', '=', 'gr.id')
            ->select('gr.supplier_id', 'gri.product_id', 'gr.account_id')
            ->selectRaw('AVG(gri.unit_cost) as avg_price, MAX(gri.created_at) as latest_receipt')
            ->whereNotNull('gr.supplier_id')
            ->whereNotNull('gri.product_id')
            ->groupBy('gr.supplier_id', 'gri.product_id', 'gr.account_id');

        if ($accountId) {
            $query->where('gr.account_id', $accountId);
        }

        $supplierProducts = $query->get();

        $this->info("Found {$supplierProducts->count()} unique supplier-product combinations");

        $synced = 0;
        $skipped = 0;

        foreach ($supplierProducts as $sp) {
            try {
                // Check if relationship already exists
                $supplier = Supplier::where('account_id', $sp->account_id)
                    ->where('id', $sp->supplier_id)
                    ->first();

                $product = Product::where('account_id', $sp->account_id)
                    ->where('id', $sp->product_id)
                    ->first();

                if (!$supplier || !$product) {
                    $this->warn("Skipping: Supplier ID {$sp->supplier_id} or Product ID {$sp->product_id} not found for account {$sp->account_id}");
                    $skipped++;
                    continue;
                }

                // Check if relationship already exists
                if ($supplier->products()->where('product_id', $sp->product_id)->exists()) {
                    $this->line("Relationship already exists: {$supplier->name} -> {$product->name}");
                    $skipped++;
                    continue;
                }

                // Create the relationship
                $supplier->products()->attach($sp->product_id, [
                    'supplier_price' => $sp->avg_price,
                    'supplier_sku' => null,
                    'lead_time_days' => 0,
                    'minimum_order_quantity' => 1,
                    'discount_percentage' => 0,
                    'notes' => 'Avtomatik əlavə edildi mal qəbulundan',
                    'is_preferred' => false,
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);

                $this->info("✓ Linked: {$supplier->name} -> {$product->name} (Price: {$sp->avg_price} AZN)");
                $synced++;

            } catch (\Exception $e) {
                $this->error("Error processing supplier {$sp->supplier_id} - product {$sp->product_id}: " . $e->getMessage());
                $skipped++;
            }
        }

        $this->info("\n=== Synchronization Complete ===");
        $this->info("✓ Synced: {$synced} relationships");
        $this->info("⚠ Skipped: {$skipped} relationships");
        
        return Command::SUCCESS;
    }
}