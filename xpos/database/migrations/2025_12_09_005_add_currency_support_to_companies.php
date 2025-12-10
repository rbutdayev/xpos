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
            // Check if default_language column exists, if not add it first
            if (!Schema::hasColumn('companies', 'default_language')) {
                $table->string('default_language', 5)->default('en')->after('tax_number');
            }

            $table->string('currency_code', 3)->default('USD')->after('default_language');
            $table->string('currency_symbol', 10)->default('$')->after('currency_code');
            $table->unsignedTinyInteger('currency_decimal_places')->default(2)->after('currency_symbol');
            $table->enum('currency_symbol_position', ['before', 'after'])->default('before')->after('currency_decimal_places');

            $table->index('currency_code');
        });

        // Update companies.default_language default from 'az' to 'en' if it exists
        if (Schema::hasColumn('companies', 'default_language')) {
            Schema::table('companies', function (Blueprint $table) {
                $table->string('default_language', 5)->default('en')->change();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->dropIndex(['currency_code']);
            $table->dropColumn([
                'currency_code',
                'currency_symbol',
                'currency_decimal_places',
                'currency_symbol_position',
            ]);

            // Revert default_language default back to 'az' if it exists
            if (Schema::hasColumn('companies', 'default_language')) {
                $table->string('default_language', 5)->default('az')->change();
            }
        });
    }
};
