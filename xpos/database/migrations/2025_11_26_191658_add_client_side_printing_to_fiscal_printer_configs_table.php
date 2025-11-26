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
            $table->boolean('client_side_printing')->default(false)->after('auto_send')
                ->comment('If true, browser sends requests directly to printer (for production when server cannot reach local IP)');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('fiscal_printer_configs', function (Blueprint $table) {
            $table->dropColumn('client_side_printing');
        });
    }
};
