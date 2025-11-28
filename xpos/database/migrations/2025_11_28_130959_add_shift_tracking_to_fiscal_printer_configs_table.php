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
        Schema::table('fiscal_printer_configs', function (Blueprint $table) {
            // Shift tracking fields
            $table->boolean('shift_open')->default(false)->after('is_active');
            $table->timestamp('shift_opened_at')->nullable()->after('shift_open');
            $table->timestamp('last_z_report_at')->nullable()->after('shift_opened_at');
            $table->integer('current_shift_duration_hours')->nullable()->after('last_z_report_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('fiscal_printer_configs', function (Blueprint $table) {
            $table->dropColumn([
                'shift_open',
                'shift_opened_at',
                'last_z_report_at',
                'current_shift_duration_hours',
            ]);
        });
    }
};
