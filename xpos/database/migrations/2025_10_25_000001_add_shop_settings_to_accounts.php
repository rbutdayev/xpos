<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            // Shop URL slug (unique across all merchants)
            $table->string('shop_slug', 100)->unique()->nullable()
                ->after('email')
                ->comment('Business name for shop URL: xpos.az/{shop_slug}');

            // Enable/disable shop per merchant
            $table->boolean('shop_enabled')->default(false)
                ->after('shop_slug')
                ->comment('Whether online shop is active for this account');

            // Optional: Shop-specific settings (JSON)
            $table->json('shop_settings')->nullable()
                ->after('shop_enabled')
                ->comment('Shop customization: colors, banner text, etc.');
        });

        // Add index for shop lookups
        Schema::table('accounts', function (Blueprint $table) {
            $table->index(['shop_slug', 'shop_enabled'], 'idx_shop_lookup');
        });
    }

    public function down(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            $table->dropIndex('idx_shop_lookup');
            $table->dropColumn(['shop_slug', 'shop_enabled', 'shop_settings']);
        });
    }
};
