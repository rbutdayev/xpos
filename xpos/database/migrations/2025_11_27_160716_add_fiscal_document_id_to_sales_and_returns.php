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
        // Add fiscal_document_id to sales table
        Schema::table('sales', function (Blueprint $table) {
            $table->string('fiscal_document_id', 64)->nullable()->after('fiscal_number')
                ->comment('Caspos document_id (long hash) used for moneyBack operations');
        });

        // Add fiscal_document_id to returns table
        Schema::table('returns', function (Blueprint $table) {
            $table->string('fiscal_document_id', 64)->nullable()->after('fiscal_number')
                ->comment('Caspos document_id (long hash) from moneyBack response');
        });

        // Add fiscal_document_id to fiscal_printer_jobs table
        Schema::table('fiscal_printer_jobs', function (Blueprint $table) {
            $table->string('fiscal_document_id', 64)->nullable()->after('fiscal_number')
                ->comment('Caspos document_id (long hash) from response');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn('fiscal_document_id');
        });

        Schema::table('returns', function (Blueprint $table) {
            $table->dropColumn('fiscal_document_id');
        });

        Schema::table('fiscal_printer_jobs', function (Blueprint $table) {
            $table->dropColumn('fiscal_document_id');
        });
    }
};
