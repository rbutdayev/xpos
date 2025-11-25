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
        Schema::table('customers', function (Blueprint $table) {
            $table->integer('current_points')->default(0)->after('notes')->comment('Current available loyalty points balance');
            $table->integer('lifetime_points')->default(0)->after('current_points')->comment('Total points earned all-time');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn(['current_points', 'lifetime_points']);
        });
    }
};
