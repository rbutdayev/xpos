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
            $table->boolean('sms_module_enabled')->default(false)->after('fiscal_printer_enabled');
            $table->boolean('telegram_module_enabled')->default(false)->after('sms_module_enabled');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            $table->dropColumn(['sms_module_enabled', 'telegram_module_enabled']);
        });
    }
};
