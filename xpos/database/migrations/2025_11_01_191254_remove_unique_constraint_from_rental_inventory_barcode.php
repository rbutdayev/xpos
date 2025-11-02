<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Remove unique constraint from barcode column in rental_inventory table.
     * Multiple inventory items can share the same product barcode.
     * Each inventory item is uniquely identified by inventory_number.
     */
    public function up(): void
    {
        Schema::table('rental_inventory', function (Blueprint $table) {
            // Drop the unique constraint on barcode
            $table->dropUnique(['barcode']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rental_inventory', function (Blueprint $table) {
            // Re-add unique constraint (if rolling back)
            $table->unique('barcode');
        });
    }
};
