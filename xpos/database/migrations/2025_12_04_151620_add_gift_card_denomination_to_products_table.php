<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // Add gift_card_denomination to identify products as gift cards
            // When set, this product represents a gift card with this denomination
            $table->decimal('gift_card_denomination', 10, 2)->nullable()->after('barcode');

            // Add index for filtering gift card products
            $table->index('gift_card_denomination');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['gift_card_denomination']);
            $table->dropColumn('gift_card_denomination');
        });
    }
};
