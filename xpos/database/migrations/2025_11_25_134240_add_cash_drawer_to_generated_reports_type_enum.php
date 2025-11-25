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
        // Add 'cash_drawer' to the type enum in generated_reports table
        DB::statement("ALTER TABLE generated_reports MODIFY COLUMN type ENUM('end_of_day','sales','inventory','financial','customer','service','rental','cash_drawer') NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove 'cash_drawer' from the type enum in generated_reports table
        DB::statement("ALTER TABLE generated_reports MODIFY COLUMN type ENUM('end_of_day','sales','inventory','financial','customer','service','rental') NOT NULL");
    }
};
