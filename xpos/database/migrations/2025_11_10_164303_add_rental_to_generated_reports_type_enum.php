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
        // Add 'rental' to the type enum in generated_reports table
        DB::statement("ALTER TABLE generated_reports MODIFY COLUMN type ENUM('end_of_day','sales','inventory','financial','customer','service','rental') NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove 'rental' from the type enum in generated_reports table
        DB::statement("ALTER TABLE generated_reports MODIFY COLUMN type ENUM('end_of_day','sales','inventory','financial','customer','service') NOT NULL");
    }
};