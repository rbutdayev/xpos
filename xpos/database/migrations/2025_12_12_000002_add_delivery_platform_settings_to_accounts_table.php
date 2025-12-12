<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds settings for delivery platform integrations (Wolt, Yango, Bolt)
     * Each platform has an enabled flag and API credentials.
     */
    public function up(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            // Wolt integration settings
            $table->boolean('wolt_enabled')->default(false)
                ->after('shop_enabled')
                ->comment('Enable Wolt delivery platform integration');

            $table->text('wolt_api_key')->nullable()
                ->after('wolt_enabled')
                ->comment('Wolt API key (encrypted)');

            $table->string('wolt_restaurant_id', 255)->nullable()
                ->after('wolt_api_key')
                ->comment('Wolt restaurant/venue identifier');

            // Yango integration settings
            $table->boolean('yango_enabled')->default(false)
                ->after('wolt_restaurant_id')
                ->comment('Enable Yango delivery platform integration');

            $table->text('yango_api_key')->nullable()
                ->after('yango_enabled')
                ->comment('Yango API key (encrypted)');

            $table->string('yango_restaurant_id', 255)->nullable()
                ->after('yango_api_key')
                ->comment('Yango restaurant/venue identifier');

            // Bolt Food integration settings
            $table->boolean('bolt_enabled')->default(false)
                ->after('yango_restaurant_id')
                ->comment('Enable Bolt Food delivery platform integration');

            $table->text('bolt_api_key')->nullable()
                ->after('bolt_enabled')
                ->comment('Bolt Food API key (encrypted)');

            $table->string('bolt_restaurant_id', 255)->nullable()
                ->after('bolt_api_key')
                ->comment('Bolt Food restaurant/venue identifier');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            $table->dropColumn([
                'wolt_enabled',
                'wolt_api_key',
                'wolt_restaurant_id',
                'yango_enabled',
                'yango_api_key',
                'yango_restaurant_id',
                'bolt_enabled',
                'bolt_api_key',
                'bolt_restaurant_id'
            ]);
        });
    }
};
