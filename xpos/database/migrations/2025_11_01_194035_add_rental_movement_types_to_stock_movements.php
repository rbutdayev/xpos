<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add new rental-related movement types to the enum
        DB::statement("ALTER TABLE stock_movements MODIFY COLUMN movement_type ENUM(
            'daxil_olma',
            'xaric_olma',
            'transfer',
            'qaytarma',
            'itki_zerer',
            'duzelis_artim',
            'duzelis_azaltma',
            'rental_allocation',
            'rental_return_to_stock'
        ) NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove rental movement types from enum
        DB::statement("ALTER TABLE stock_movements MODIFY COLUMN movement_type ENUM(
            'daxil_olma',
            'xaric_olma',
            'transfer',
            'qaytarma',
            'itki_zerer',
            'duzelis_artim',
            'duzelis_azaltma'
        ) NOT NULL");
    }
};
