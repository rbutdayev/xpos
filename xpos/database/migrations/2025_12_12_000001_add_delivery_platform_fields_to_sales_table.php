<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds support for tracking orders from delivery platforms (Wolt, Yango, Bolt)
     * alongside existing e-commerce shop orders.
     */
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            // Track order source: shop (default), wolt, yango, bolt
            $table->enum('source', ['shop', 'wolt', 'yango', 'bolt'])
                ->default('shop')
                ->after('is_online_order')
                ->comment('Order source: shop (e-commerce), wolt, yango, or bolt');

            // External order ID from the delivery platform
            $table->string('platform_order_id', 255)->nullable()
                ->after('source')
                ->comment('External order ID from delivery platform');

            // Store raw platform order data for reference/debugging
            $table->json('platform_order_data')->nullable()
                ->after('platform_order_id')
                ->comment('Raw order metadata from delivery platform (JSON)');

            // Delivery fee charged by the platform
            $table->decimal('delivery_fee', 10, 2)->nullable()
                ->after('platform_order_data')
                ->comment('Delivery fee charged by platform');

            // Commission taken by the platform
            $table->decimal('platform_commission', 10, 2)->nullable()
                ->after('delivery_fee')
                ->comment('Commission amount taken by delivery platform');
        });

        // Add composite index for filtering orders by source and date per account
        Schema::table('sales', function (Blueprint $table) {
            $table->index(['account_id', 'source', 'created_at'], 'idx_sales_by_platform');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropIndex('idx_sales_by_platform');
            $table->dropColumn([
                'source',
                'platform_order_id',
                'platform_order_data',
                'delivery_fee',
                'platform_commission'
            ]);
        });
    }
};
