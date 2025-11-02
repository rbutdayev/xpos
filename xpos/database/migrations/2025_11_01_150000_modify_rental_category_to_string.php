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
        // Modify rental_agreement_templates table
        DB::statement('ALTER TABLE rental_agreement_templates MODIFY COLUMN rental_category VARCHAR(255)');

        // Modify rental_agreements table
        DB::statement('ALTER TABLE rental_agreements MODIFY COLUMN rental_category VARCHAR(255)');

        // Add indexes for better performance
        Schema::table('rental_agreement_templates', function (Blueprint $table) {
            $table->index('rental_category');
        });

        Schema::table('rental_agreements', function (Blueprint $table) {
            $table->index('rental_category');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Note: Reversing ENUM changes can be complex and might lose data
        // This is a simplified version - in production, you'd want to handle this more carefully
        DB::statement("ALTER TABLE rental_agreement_templates MODIFY COLUMN rental_category ENUM('clothing', 'electronics', 'home_appliances', 'cosmetics', 'event_equipment', 'furniture', 'jewelry', 'toys', 'sports', 'general')");

        DB::statement("ALTER TABLE rental_agreements MODIFY COLUMN rental_category ENUM('clothing', 'electronics', 'home_appliances', 'cosmetics', 'event_equipment', 'furniture', 'jewelry', 'toys', 'sports', 'general')");
    }
};
