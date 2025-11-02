<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('rental_inventory', function (Blueprint $table) {
            // Track whether stock was deducted from ProductStock when creating this rental inventory item
            $table->boolean('stock_deducted')->default(false)->after('is_active');

            // Track which warehouse the stock was deducted from
            $table->unsignedBigInteger('stock_warehouse_id')->nullable()->after('stock_deducted');

            // Add foreign key
            $table->foreign('stock_warehouse_id')->references('id')->on('warehouses')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rental_inventory', function (Blueprint $table) {
            $table->dropForeign(['stock_warehouse_id']);
            $table->dropColumn(['stock_deducted', 'stock_warehouse_id']);
        });
    }
};
