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
        Schema::table('rental_inventory', function (Blueprint $table) {
            $table->string('barcode', 255)->nullable()->unique()->after('inventory_number');
            $table->index(['account_id', 'barcode']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rental_inventory', function (Blueprint $table) {
            $table->dropIndex(['account_id', 'barcode']);
            $table->dropColumn('barcode');
        });
    }
};
