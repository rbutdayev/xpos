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
        // Modify rental_inventory table
        DB::statement('ALTER TABLE rental_inventory MODIFY COLUMN rental_category VARCHAR(255)');

        // Add index for better performance
        Schema::table('rental_inventory', function (Blueprint $table) {
            $table->index('rental_category');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Note: Reversing ENUM changes can be complex and might lose data
        DB::statement("ALTER TABLE rental_inventory MODIFY COLUMN rental_category ENUM('clothing', 'electronics', 'home_appliances', 'cosmetics', 'event_equipment', 'furniture', 'jewelry', 'toys', 'sports')");
    }
};
