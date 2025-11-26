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
        Schema::table('companies', function (Blueprint $table) {
            // Add unique constraint on company name to prevent duplicates
            $table->unique('name', 'companies_name_unique');

            // Add unique constraint on tax_number (VOEN) when not null
            // Use a partial unique index to allow multiple null values
            $table->unique('tax_number', 'companies_tax_number_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->dropUnique('companies_name_unique');
            $table->dropUnique('companies_tax_number_unique');
        });
    }
};
