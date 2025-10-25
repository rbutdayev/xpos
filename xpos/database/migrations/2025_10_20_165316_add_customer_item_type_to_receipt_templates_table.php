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
        // For MySQL, we need to alter the ENUM type
        DB::statement("ALTER TABLE receipt_templates MODIFY COLUMN type ENUM('sale', 'service', 'customer_item', 'return', 'payment') DEFAULT 'sale'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove customer_item from enum
        DB::statement("ALTER TABLE receipt_templates MODIFY COLUMN type ENUM('sale', 'service', 'return', 'payment') DEFAULT 'sale'");
    }
};
