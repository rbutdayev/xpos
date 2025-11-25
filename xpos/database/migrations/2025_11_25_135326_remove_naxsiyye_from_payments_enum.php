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
        // Remove 'naxşiyyə' from the method enum in payments table
        // This meaningless word has zero records and should be removed
        DB::statement("ALTER TABLE payments MODIFY COLUMN method ENUM('nağd','kart','köçürmə') NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Add 'naxşiyyə' back for rollback
        DB::statement("ALTER TABLE payments MODIFY COLUMN method ENUM('nağd','kart','köçürmə','naxşiyyə') NOT NULL");
    }
};
