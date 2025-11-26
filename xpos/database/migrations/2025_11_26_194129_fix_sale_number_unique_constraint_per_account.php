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
            // Drop the global unique constraint on sale_number
            $table->dropUnique(['sale_number']);

            // Add composite unique constraint for account_id + sale_number
            // This allows each account to have their own sequence (e.g., both account 1 and account 2 can have SAT0001)
            $table->unique(['account_id', 'sale_number'], 'sales_account_sale_number_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            // Drop the composite unique constraint
            $table->dropUnique('sales_account_sale_number_unique');

            // Restore the global unique constraint
            $table->unique('sale_number');
        });
    }
};
