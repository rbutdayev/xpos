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
        Schema::table('product_returns', function (Blueprint $table) {
            // Make these fields nullable for multi-item returns
            $table->unsignedBigInteger('product_id')->nullable()->change();
            $table->unsignedBigInteger('variant_id')->nullable()->change();
            $table->decimal('quantity', 10, 3)->nullable()->change();
            $table->decimal('unit_cost', 10, 2)->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('product_returns', function (Blueprint $table) {
            $table->unsignedBigInteger('product_id')->nullable(false)->change();
            $table->unsignedBigInteger('variant_id')->nullable(false)->change();
            $table->decimal('quantity', 10, 3)->nullable(false)->change();
            $table->decimal('unit_cost', 10, 2)->nullable(false)->change();
        });
    }
};
