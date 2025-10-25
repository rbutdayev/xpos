<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            // Flag to identify online orders
            $table->boolean('is_online_order')->default(false)
                ->after('sale_number')
                ->comment('TRUE if order came from online shop');

            // Customer info for quick orders (no customer record needed)
            $table->string('customer_name', 255)->nullable()
                ->after('customer_id')
                ->comment('Quick order customer name (no registration)');

            $table->string('customer_phone', 50)->nullable()
                ->after('customer_name')
                ->comment('Quick order customer phone');

            // Optional: Customer requested delivery/pickup info
            $table->text('delivery_notes')->nullable()
                ->after('notes')
                ->comment('Customer delivery preferences');
        });

        // Add index for filtering online orders
        Schema::table('sales', function (Blueprint $table) {
            $table->index(['account_id', 'is_online_order', 'created_at'], 'idx_online_orders');
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropIndex('idx_online_orders');
            $table->dropColumn(['is_online_order', 'customer_name', 'customer_phone', 'delivery_notes']);
        });
    }
};
