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
        Schema::table('customer_items', function (Blueprint $table) {
            // Add service_type column to support all service sectors
            // Values: tailor, phone_repair, electronics, retail, general
            $table->string('service_type', 50)->default('tailor')->after('customer_id');
            $table->index('service_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customer_items', function (Blueprint $table) {
            $table->dropIndex(['service_type']);
            $table->dropColumn('service_type');
        });
    }
};
