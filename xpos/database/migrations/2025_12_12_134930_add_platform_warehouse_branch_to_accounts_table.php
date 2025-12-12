<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds platform-specific warehouse and branch selection for delivery platforms.
     * Each platform (Wolt, Yango, Bolt) can have its own warehouse and branch
     * for order fulfillment, similar to how shop_warehouse_id works for e-commerce.
     */
    public function up(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            // Wolt platform warehouse and branch
            $table->foreignId('wolt_warehouse_id')
                ->nullable()
                ->after('wolt_restaurant_id')
                ->constrained('warehouses')
                ->onDelete('set null')
                ->comment('Warehouse used for Wolt orders');

            $table->foreignId('wolt_branch_id')
                ->nullable()
                ->after('wolt_warehouse_id')
                ->constrained('branches')
                ->onDelete('set null')
                ->comment('Branch used for Wolt orders');

            // Yango platform warehouse and branch
            $table->foreignId('yango_warehouse_id')
                ->nullable()
                ->after('yango_restaurant_id')
                ->constrained('warehouses')
                ->onDelete('set null')
                ->comment('Warehouse used for Yango orders');

            $table->foreignId('yango_branch_id')
                ->nullable()
                ->after('yango_warehouse_id')
                ->constrained('branches')
                ->onDelete('set null')
                ->comment('Branch used for Yango orders');

            // Bolt platform warehouse and branch
            $table->foreignId('bolt_warehouse_id')
                ->nullable()
                ->after('bolt_restaurant_id')
                ->constrained('warehouses')
                ->onDelete('set null')
                ->comment('Warehouse used for Bolt orders');

            $table->foreignId('bolt_branch_id')
                ->nullable()
                ->after('bolt_warehouse_id')
                ->constrained('branches')
                ->onDelete('set null')
                ->comment('Branch used for Bolt orders');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            $table->dropForeign(['wolt_warehouse_id']);
            $table->dropForeign(['wolt_branch_id']);
            $table->dropForeign(['yango_warehouse_id']);
            $table->dropForeign(['yango_branch_id']);
            $table->dropForeign(['bolt_warehouse_id']);
            $table->dropForeign(['bolt_branch_id']);

            $table->dropColumn([
                'wolt_warehouse_id',
                'wolt_branch_id',
                'yango_warehouse_id',
                'yango_branch_id',
                'bolt_warehouse_id',
                'bolt_branch_id',
            ]);
        });
    }
};
