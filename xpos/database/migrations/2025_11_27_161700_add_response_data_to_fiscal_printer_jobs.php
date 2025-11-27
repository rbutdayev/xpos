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
            $table->json('response_data')->nullable()->after('request_data')
                ->comment('Response from fiscal printer (for debugging)');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('fiscal_printer_jobs', function (Blueprint $table) {
            $table->dropColumn('response_data');
        });
    }
};
