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
        Schema::create('return_items', function (Blueprint $table) {
            $table->id('return_item_id');
            $table->unsignedBigInteger('return_id');
            $table->unsignedBigInteger('sale_item_id')->comment('Original sale item being returned');
            $table->unsignedBigInteger('product_id');
            $table->unsignedBigInteger('variant_id')->nullable();
            $table->decimal('quantity', 10, 3)->comment('Quantity being returned');
            $table->decimal('unit_price', 10, 2);
            $table->decimal('total', 10, 2);
            $table->text('reason')->nullable()->comment('Reason for returning this item');
            $table->timestamps();

            // Foreign keys
            $table->foreign('return_id')->references('return_id')->on('returns')->onDelete('cascade');
            $table->foreign('sale_item_id')->references('item_id')->on('sale_items')->onDelete('cascade');
            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
            $table->foreign('variant_id')->references('id')->on('product_variants')->onDelete('set null');

            // Indexes
            $table->index('return_id');
            $table->index('sale_item_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('return_items');
    }
};
