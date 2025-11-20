<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Phase 1: Add new fields without breaking existing functionality
     */
    public function up(): void
    {
        // Step 1: Add new product data fields (all nullable initially)
        Schema::table('rental_inventory', function (Blueprint $table) {
            // Product snapshot data (copied at creation time)
            $table->string('product_name')->nullable()->after('product_id');
            $table->string('product_sku', 100)->nullable()->after('product_name');
            $table->text('product_description')->nullable()->after('product_sku');
            $table->string('product_category', 100)->nullable()->after('product_description');
            $table->string('product_brand', 100)->nullable()->after('product_category');
            $table->string('product_model', 100)->nullable()->after('product_brand');
            $table->json('product_attributes')->nullable()->after('product_model');
            
            // Original product tracking (for backwards compatibility)
            $table->unsignedBigInteger('original_product_id')->nullable()->after('product_attributes');
            $table->timestamp('original_product_deleted_at')->nullable()->after('original_product_id');
            
            // Return handling
            $table->boolean('can_return_to_stock')->default(true)->after('original_product_deleted_at');
            $table->unsignedBigInteger('return_warehouse_id')->nullable()->after('can_return_to_stock');
            
            // Indexes for performance
            $table->index(['account_id', 'original_product_id'], 'idx_rental_inventory_original_product');
            $table->index(['account_id', 'product_name'], 'idx_rental_inventory_product_name');
        });
        
        // Step 2: Copy existing product data to new fields
        $this->copyExistingProductData();
        
        // Step 3: Make product_name required after data is copied
        Schema::table('rental_inventory', function (Blueprint $table) {
            $table->string('product_name')->nullable(false)->change();
        });
    }

    /**
     * Copy existing product data to new fields
     */
    private function copyExistingProductData(): void
    {
        // Process in chunks to avoid memory issues
        DB::table('rental_inventory')
            ->whereNotNull('product_id')
            ->whereNull('product_name') // Only update records that haven't been processed
            ->chunkById(100, function ($rentalItems) {
                foreach ($rentalItems as $item) {
                    // Get product data
                    $product = DB::table('products')
                        ->leftJoin('categories', 'products.category_id', '=', 'categories.id')
                        ->select(
                            'products.name',
                            'products.sku', 
                            'products.description',
                            'products.brand',
                            'products.model',
                            'products.attributes',
                            'categories.name as category_name'
                        )
                        ->where('products.id', $item->product_id)
                        ->first();
                    
                    if ($product) {
                        // Update rental inventory with product data
                        DB::table('rental_inventory')
                            ->where('id', $item->id)
                            ->update([
                                'product_name' => $product->name,
                                'product_sku' => $product->sku,
                                'product_description' => $product->description,
                                'product_category' => $product->category_name,
                                'product_brand' => $product->brand,
                                'product_model' => $product->model,
                                'product_attributes' => $product->attributes,
                                'original_product_id' => $item->product_id,
                                'can_return_to_stock' => true,
                                'updated_at' => now(),
                            ]);
                    } else {
                        // Product was already deleted - mark accordingly
                        DB::table('rental_inventory')
                            ->where('id', $item->id)
                            ->update([
                                'product_name' => 'Silinmiş məhsul',
                                'original_product_id' => $item->product_id,
                                'original_product_deleted_at' => now(),
                                'can_return_to_stock' => false,
                                'updated_at' => now(),
                            ]);
                    }
                }
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rental_inventory', function (Blueprint $table) {
            // Drop indexes first
            $table->dropIndex('idx_rental_inventory_original_product');
            $table->dropIndex('idx_rental_inventory_product_name');
            
            // Drop new columns
            $table->dropColumn([
                'product_name',
                'product_sku',
                'product_description', 
                'product_category',
                'product_brand',
                'product_model',
                'product_attributes',
                'original_product_id',
                'original_product_deleted_at',
                'can_return_to_stock',
                'return_warehouse_id',
            ]);
        });
    }
};