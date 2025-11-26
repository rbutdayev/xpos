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
        Schema::table('accounts', function (Blueprint $table) {
            // Add shop warehouse selection
            $table->foreignId('shop_warehouse_id')
                ->nullable()
                ->after('shop_enabled')
                ->constrained('warehouses')
                ->nullOnDelete()
                ->comment('Warehouse to use for online shop orders');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            $table->dropForeign(['shop_warehouse_id']);
            $table->dropColumn('shop_warehouse_id');
        });
    }
};
