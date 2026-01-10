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
            // Allowed radius in meters for attendance check-in/check-out (default: 100m)
            $table->integer('attendance_allowed_radius')->default(100)->after('attendance_module_enabled');
        });
    }

    /**
     * Down the migrations.
     */
    public function down(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            $table->dropColumn('attendance_allowed_radius');
        });
    }
};
