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
            // Add parent_product_id to link variant products to their parent
            // NULL = this is a parent/master product
            // NOT NULL = this is a child/variant product
            $table->foreignId('parent_product_id')
                ->nullable()
                ->after('id')
                ->constrained('products')
                ->cascadeOnDelete();

            // Add index for faster queries
            $table->index(['account_id', 'parent_product_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropForeign(['parent_product_id']);
            $table->dropIndex(['account_id', 'parent_product_id']);
            $table->dropColumn('parent_product_id');
        });
    }
};
