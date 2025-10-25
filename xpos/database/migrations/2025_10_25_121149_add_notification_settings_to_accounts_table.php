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
            // Centralized notification settings JSON column
            // Stores all notification channel configurations and preferences
            $table->json('notification_settings')->nullable()->after('shop_customer_sms_template')
                ->comment('Unified notification settings for all channels (SMS, Telegram, etc.)');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            $table->dropColumn('notification_settings');
        });
    }
};
