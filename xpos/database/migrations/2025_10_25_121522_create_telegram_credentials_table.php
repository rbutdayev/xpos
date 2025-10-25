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
        Schema::create('telegram_credentials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained()->onDelete('cascade')
                ->comment('Tenant/Account ID - multi-tenant isolation');

            // Bot configuration
            $table->string('bot_token')->comment('Telegram Bot API token');
            $table->string('bot_username')->nullable()->comment('Bot username for reference');

            // Default notification chat
            $table->string('default_chat_id')->nullable()
                ->comment('Default chat ID for merchant notifications');

            // Status
            $table->boolean('is_active')->default(true)
                ->comment('Enable/disable Telegram notifications');

            // Connection test
            $table->timestamp('last_tested_at')->nullable()
                ->comment('Last time connection was tested');
            $table->string('last_test_status')->nullable()
                ->comment('Result of last connection test');

            $table->timestamps();

            // Ensure one active credential per tenant
            $table->unique(['account_id', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('telegram_credentials');
    }
};
