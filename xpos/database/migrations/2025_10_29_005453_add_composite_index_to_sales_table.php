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
        Schema::table('sales', function (Blueprint $table) {
            // Add composite index for optimized FOR UPDATE queries in generateSaleNumber
            // This ensures tenant-isolated locking and faster lookups
            $table->index(['account_id', 'sale_number'], 'idx_sales_account_sale_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropIndex('idx_sales_account_sale_number');
        });
    }
};
