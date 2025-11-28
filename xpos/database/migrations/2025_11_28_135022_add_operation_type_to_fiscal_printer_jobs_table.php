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
        Schema::table('fiscal_printer_jobs', function (Blueprint $table) {
            $table->string('operation_type')->default('sale')->after('provider');
            // operation_type can be: 'sale', 'return', 'shift_open', 'shift_close', 'shift_status', 'shift_x_report'

            // Make sale_id and return_id nullable since shift operations don't need them
            $table->unsignedBigInteger('sale_id')->nullable()->change();
            $table->unsignedBigInteger('return_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('fiscal_printer_jobs', function (Blueprint $table) {
            $table->dropColumn('operation_type');
        });
    }
};
