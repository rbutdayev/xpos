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
        Schema::table('accounts', function (Blueprint $table) {
            // Change module defaults from true to false
            $table->boolean('services_module_enabled')->default(false)->change();
            $table->boolean('rent_module_enabled')->default(false)->change();
            $table->boolean('discounts_module_enabled')->default(false)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            // Revert back to default true
            $table->boolean('services_module_enabled')->default(true)->change();
            $table->boolean('rent_module_enabled')->default(true)->change();
            $table->boolean('discounts_module_enabled')->default(true)->change();
        });
    }
};
