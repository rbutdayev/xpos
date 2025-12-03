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
        // Add 'bank_kredit' to the method enum in payments table
        // CASPOS fiscal printer supports bank credit cards (BirKart, Tamkart)
        DB::statement("ALTER TABLE payments MODIFY COLUMN method ENUM('nağd','kart','köçürmə','bank_kredit') NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove 'bank_kredit' from the method enum
        DB::statement("ALTER TABLE payments MODIFY COLUMN method ENUM('nağd','kart','köçürmə') NOT NULL");
    }
};
