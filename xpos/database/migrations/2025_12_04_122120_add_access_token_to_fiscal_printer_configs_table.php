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
            $table->text('access_token')->nullable()->after('password');
            $table->timestamp('access_token_expires_at')->nullable()->after('access_token');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('fiscal_printer_configs', function (Blueprint $table) {
            $table->dropColumn(['access_token', 'access_token_expires_at']);
        });
    }
};
