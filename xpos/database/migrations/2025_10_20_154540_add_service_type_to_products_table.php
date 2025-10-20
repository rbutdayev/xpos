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
            // Add service_type column to filter products by service sector
            // Values: tailor, phone_repair, electronics, general, or NULL for all
            $table->string('service_type', 50)->nullable()->after('category_id');
            $table->index('service_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['service_type']);
            $table->dropColumn('service_type');
        });
    }
};
