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
        // Add gift_card_id column
        Schema::table('payments', function (Blueprint $table) {
            $table->foreignId('gift_card_id')->nullable()->after('rental_id')->constrained('gift_cards')->onDelete('set null');
        });

        // Modify method ENUM to include hədiyyə_kartı
        DB::statement("ALTER TABLE payments MODIFY COLUMN method ENUM('nağd', 'kart', 'köçürmə', 'bank_kredit', 'hədiyyə_kartı') NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove gift_card_id column
        Schema::table('payments', function (Blueprint $table) {
            $table->dropForeign(['gift_card_id']);
            $table->dropColumn('gift_card_id');
        });

        // Revert method ENUM to original values
        DB::statement("ALTER TABLE payments MODIFY COLUMN method ENUM('nağd', 'kart', 'köçürmə', 'bank_kredit') NOT NULL");
    }
};
