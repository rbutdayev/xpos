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
        Schema::table('payments', function (Blueprint $table) {
            // Make sale_id nullable since payment can be for rental or sale
            $table->unsignedBigInteger('sale_id')->nullable()->change();

            // Add rental_id column
            $table->unsignedBigInteger('rental_id')->nullable()->after('sale_id');
            $table->foreign('rental_id')->references('id')->on('rentals')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            // Drop rental_id foreign key and column
            $table->dropForeign(['rental_id']);
            $table->dropColumn('rental_id');

            // Make sale_id not nullable again
            $table->unsignedBigInteger('sale_id')->nullable(false)->change();
        });
    }
};
