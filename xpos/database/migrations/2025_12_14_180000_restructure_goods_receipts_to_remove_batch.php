<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * This migration restructures goods_receipts from a batch-based system to a receipt-based system.
     *
     * BEFORE: Each product is a separate goods_receipt row, grouped by batch_id
     * AFTER: One goods_receipt = one transaction, products stored in goods_receipt_items table
     */
    public function up(): void
    {
        // Step 1: Create the new goods_receipt_items table
        Schema::create('goods_receipt_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('goods_receipt_id')->constrained('goods_receipts')->cascadeOnDelete();
            $table->foreignId('account_id')->constrained('accounts')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('variant_id')->nullable()->constrained('product_variants')->cascadeOnDelete();
            $table->decimal('quantity', 10, 3);
            $table->string('unit', 50);
            $table->decimal('unit_cost', 10, 2)->default(0);
            $table->decimal('total_cost', 12, 2)->default(0);
            $table->decimal('discount_percent', 5, 2)->default(0);
            $table->json('additional_data')->nullable();
            $table->timestamps();

            $table->index(['goods_receipt_id', 'product_id']);
            $table->index(['account_id', 'product_id']);
        });

        // Step 2: Migrate existing data
        // Group existing goods_receipts by batch_id and create new structure
        $this->migrateExistingData();

        // Step 3: Remove batch_id index first
        Schema::table('goods_receipts', function (Blueprint $table) {
            if (Schema::hasColumn('goods_receipts', 'batch_id')) {
                $table->dropIndex(['account_id', 'batch_id']);
            }
        });

        // Step 4: Drop product-specific columns from goods_receipts table
        // We'll keep the first receipt from each batch as the main receipt and add items to it
        Schema::table('goods_receipts', function (Blueprint $table) {
            // Drop foreign keys first
            if (Schema::hasColumn('goods_receipts', 'product_id')) {
                $table->dropForeign(['product_id']);
            }
            if (Schema::hasColumn('goods_receipts', 'variant_id')) {
                $table->dropForeign(['variant_id']);
            }
        });

        // Step 5: Drop the columns
        Schema::table('goods_receipts', function (Blueprint $table) {
            $columnsToDrop = [];

            if (Schema::hasColumn('goods_receipts', 'product_id')) {
                $columnsToDrop[] = 'product_id';
            }
            if (Schema::hasColumn('goods_receipts', 'variant_id')) {
                $columnsToDrop[] = 'variant_id';
            }
            if (Schema::hasColumn('goods_receipts', 'quantity')) {
                $columnsToDrop[] = 'quantity';
            }
            if (Schema::hasColumn('goods_receipts', 'unit')) {
                $columnsToDrop[] = 'unit';
            }
            if (Schema::hasColumn('goods_receipts', 'unit_cost')) {
                $columnsToDrop[] = 'unit_cost';
            }
            if (Schema::hasColumn('goods_receipts', 'batch_id')) {
                $columnsToDrop[] = 'batch_id';
            }

            if (!empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }

            // Keep total_cost but it will now be the sum of all items
            // Keep additional_data for receipt-level metadata
            // Keep status enum unchanged
        });
    }

    /**
     * Migrate existing batch-based data to receipt-based structure
     */
    private function migrateExistingData(): void
    {
        // Get all existing goods receipts grouped by batch_id
        $batches = DB::table('goods_receipts')
            ->select('batch_id', 'account_id')
            ->whereNotNull('batch_id')
            ->groupBy('batch_id', 'account_id')
            ->get();

        foreach ($batches as $batch) {
            // Get all receipts in this batch
            $receipts = DB::table('goods_receipts')
                ->where('batch_id', $batch->batch_id)
                ->where('account_id', $batch->account_id)
                ->orderBy('id')
                ->get();

            if ($receipts->isEmpty()) {
                continue;
            }

            // Use the first receipt as the main goods_receipt
            $mainReceipt = $receipts->first();

            // Calculate total cost for all items in this batch
            $totalCost = $receipts->sum('total_cost');

            // Update the main receipt's total_cost to include all items
            DB::table('goods_receipts')
                ->where('id', $mainReceipt->id)
                ->update(['total_cost' => $totalCost]);

            // Create goods_receipt_items for all products (including the first one)
            foreach ($receipts as $receipt) {
                // Get discount from additional_data if exists
                $additionalData = json_decode($receipt->additional_data, true);
                $discountPercent = $additionalData['discount_percent'] ?? 0;

                DB::table('goods_receipt_items')->insert([
                    'goods_receipt_id' => $mainReceipt->id,
                    'account_id' => $receipt->account_id,
                    'product_id' => $receipt->product_id,
                    'variant_id' => $receipt->variant_id,
                    'quantity' => $receipt->quantity,
                    'unit' => $receipt->unit,
                    'unit_cost' => $receipt->unit_cost ?? 0,
                    'total_cost' => $receipt->total_cost ?? 0,
                    'discount_percent' => $discountPercent,
                    'additional_data' => $receipt->additional_data,
                    'created_at' => $receipt->created_at,
                    'updated_at' => $receipt->updated_at,
                ]);

                // Update references in related tables (expenses, stock_movements, stock_history)
                // Point them all to the main receipt instead of individual receipts
                if ($receipt->id != $mainReceipt->id) {
                    // Update expenses
                    DB::table('expenses')
                        ->where('goods_receipt_id', $receipt->id)
                        ->update(['goods_receipt_id' => $mainReceipt->id]);

                    // Update stock_movements
                    DB::table('stock_movements')
                        ->where('reference_type', 'goods_receipt')
                        ->where('reference_id', $receipt->id)
                        ->update(['reference_id' => $mainReceipt->id]);

                    DB::table('stock_movements')
                        ->where('reference_type', 'goods_receipt_update')
                        ->where('reference_id', $receipt->id)
                        ->update(['reference_id' => $mainReceipt->id]);

                    DB::table('stock_movements')
                        ->where('reference_type', 'goods_receipt_delete')
                        ->where('reference_id', $receipt->id)
                        ->update(['reference_id' => $mainReceipt->id]);

                    // Update stock_history
                    DB::table('stock_history')
                        ->where('reference_type', 'goods_receipt')
                        ->where('reference_id', $receipt->id)
                        ->update(['reference_id' => $mainReceipt->id]);

                    DB::table('stock_history')
                        ->where('reference_type', 'goods_receipt_update')
                        ->where('reference_id', $receipt->id)
                        ->update(['reference_id' => $mainReceipt->id]);

                    DB::table('stock_history')
                        ->where('reference_type', 'goods_receipt_delete')
                        ->where('reference_id', $receipt->id)
                        ->update(['reference_id' => $mainReceipt->id]);

                    // Soft delete the duplicate receipts (we keep them for audit trail)
                    DB::table('goods_receipts')
                        ->where('id', $receipt->id)
                        ->update(['deleted_at' => now()]);
                }
            }
        }

        // Handle goods_receipts without batch_id (if any exist)
        $receiptsWithoutBatch = DB::table('goods_receipts')
            ->whereNull('batch_id')
            ->whereNull('deleted_at')
            ->get();

        foreach ($receiptsWithoutBatch as $receipt) {
            // Create a single item for this receipt
            $additionalData = json_decode($receipt->additional_data, true);
            $discountPercent = $additionalData['discount_percent'] ?? 0;

            DB::table('goods_receipt_items')->insert([
                'goods_receipt_id' => $receipt->id,
                'account_id' => $receipt->account_id,
                'product_id' => $receipt->product_id,
                'variant_id' => $receipt->variant_id,
                'quantity' => $receipt->quantity,
                'unit' => $receipt->unit,
                'unit_cost' => $receipt->unit_cost ?? 0,
                'total_cost' => $receipt->total_cost ?? 0,
                'discount_percent' => $discountPercent,
                'additional_data' => $receipt->additional_data,
                'created_at' => $receipt->created_at,
                'updated_at' => $receipt->updated_at,
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Add back the columns
        Schema::table('goods_receipts', function (Blueprint $table) {
            $table->foreignId('product_id')->nullable()->after('warehouse_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('variant_id')->nullable()->after('product_id')->constrained('product_variants')->cascadeOnDelete();
            $table->decimal('quantity', 10, 3)->nullable()->after('receipt_number');
            $table->string('unit', 50)->nullable()->after('quantity');
            $table->decimal('unit_cost', 10, 2)->nullable()->after('unit');
            $table->string('batch_id')->nullable()->after('receipt_number')->index();
            $table->decimal('discount_percent', 5, 2)->default(0)->after('total_cost');

            $table->index(['account_id', 'batch_id']);
        });

        // Note: We cannot fully restore the old structure without data loss
        // This down() migration is for schema only
        Schema::dropIfExists('goods_receipt_items');
    }
};
