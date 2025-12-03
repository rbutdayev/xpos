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
            // Add credit contract number for bank credit sales (BirKart, Tamkart)
            // Required by CASPOS, Omnitec and other providers for creditPayment transactions
            $table->string('credit_contract_number')->nullable()->after('device_serial');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('fiscal_printer_configs', function (Blueprint $table) {
            $table->dropColumn('credit_contract_number');
        });
    }
};
