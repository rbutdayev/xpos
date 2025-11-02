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
        Schema::table('rental_items', function (Blueprint $table) {
            $table->enum('rate_type', ['daily', 'weekly', 'monthly'])->default('daily')->after('quantity');
            $table->integer('duration')->default(1)->after('rate_type')->comment('Duration in rate_type units (e.g., 2 weeks, 3 months)');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rental_items', function (Blueprint $table) {
            $table->dropColumn(['rate_type', 'duration']);
        });
    }
};
