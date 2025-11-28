<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add adjustment types to stock_history table to match stock_movements
        DB::statement("ALTER TABLE stock_history MODIFY COLUMN type ENUM(
            'daxil_olma',
            'xaric_olma',
            'transfer_in',
            'transfer_out',
            'adjustment',
            'inventory',
            'duzelis_artim',
            'duzelis_azaltma',
            'qaytarma',
            'itki_zerer',
            'rental_allocation',
            'rental_return_to_stock'
        ) NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to original enum values
        DB::statement("ALTER TABLE stock_history MODIFY COLUMN type ENUM(
            'daxil_olma',
            'xaric_olma',
            'transfer_in',
            'transfer_out',
            'adjustment',
            'inventory'
        ) NOT NULL");
    }
};
