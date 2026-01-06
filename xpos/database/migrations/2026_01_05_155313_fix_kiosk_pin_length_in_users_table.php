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
        Schema::table('users', function (Blueprint $table) {
            // Change kiosk_pin from VARCHAR(6) to VARCHAR(255) to accommodate bcrypt hash
            $table->string('kiosk_pin', 255)->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Revert back to VARCHAR(6)
            $table->string('kiosk_pin', 6)->nullable()->change();
        });
    }
};
