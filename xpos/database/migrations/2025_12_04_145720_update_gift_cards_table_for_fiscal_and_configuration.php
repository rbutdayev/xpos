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
        Schema::table('gift_cards', function (Blueprint $table) {
            // Add denomination field (set when tenant configures the card)
            $table->decimal('denomination', 10, 2)->nullable()->after('card_number');

            // Make initial_balance and current_balance nullable
            $table->decimal('initial_balance', 10, 2)->nullable()->change();
            $table->decimal('current_balance', 10, 2)->nullable()->change();

            // Add fiscal fields
            $table->string('fiscal_document_id')->nullable()->after('activated_at');
            $table->string('fiscal_number', 50)->nullable()->after('fiscal_document_id');

            // Add index on fiscal fields
            $table->index('fiscal_document_id');
            $table->index('fiscal_number');
        });

        // Update status ENUM to include new statuses
        DB::statement("ALTER TABLE gift_cards MODIFY COLUMN status ENUM('free', 'configured', 'active', 'depleted', 'expired', 'inactive') NOT NULL DEFAULT 'free'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('gift_cards', function (Blueprint $table) {
            $table->dropColumn(['denomination', 'fiscal_document_id', 'fiscal_number']);
            $table->dropIndex(['fiscal_document_id']);
            $table->dropIndex(['fiscal_number']);
        });

        // Revert status ENUM
        DB::statement("ALTER TABLE gift_cards MODIFY COLUMN status ENUM('active', 'used', 'expired', 'inactive') NOT NULL DEFAULT 'active'");
    }
};
