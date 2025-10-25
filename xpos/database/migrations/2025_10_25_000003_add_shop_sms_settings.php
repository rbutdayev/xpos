<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            // === MERCHANT NOTIFICATIONS ===
            // Enable SMS notifications when new order arrives
            $table->boolean('shop_sms_merchant_notifications')->default(false)
                ->after('shop_settings')
                ->comment('Send SMS to merchant when new online order arrives');

            // Phone number to receive order notifications (can differ from account phone)
            $table->string('shop_notification_phone', 50)->nullable()
                ->after('shop_sms_merchant_notifications')
                ->comment('Phone number to receive merchant order notifications');

            // === CUSTOMER NOTIFICATIONS ===
            // Enable sending confirmation SMS to customers
            $table->boolean('shop_sms_customer_notifications')->default(false)
                ->after('shop_notification_phone')
                ->comment('Send confirmation SMS to customers after order');

            // Custom SMS template for customers (optional)
            $table->text('shop_customer_sms_template')->nullable()
                ->after('shop_sms_customer_notifications')
                ->comment('Custom SMS template for customer notifications. Variables: {customer_name}, {order_number}, {total}, {shop_name}, {shop_phone}');
        });
    }

    public function down(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            $table->dropColumn([
                'shop_sms_merchant_notifications',
                'shop_notification_phone',
                'shop_sms_customer_notifications',
                'shop_customer_sms_template',
            ]);
        });
    }
};
