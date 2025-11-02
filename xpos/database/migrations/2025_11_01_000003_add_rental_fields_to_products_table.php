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
        Schema::table('products', function (Blueprint $table) {
            // Rental Category for products that can be rented
            $table->enum('rental_category', [
                'clothing',
                'electronics',
                'home_appliances',
                'cosmetics',
                'event_equipment',
                'furniture',
                'jewelry',
                'toys',
                'sports'
            ])->nullable()->after('service_type');

            // Rental pricing
            $table->decimal('rental_daily_rate', 10, 2)->nullable()->after('rental_category');
            $table->decimal('rental_weekly_rate', 10, 2)->nullable()->after('rental_daily_rate');
            $table->decimal('rental_monthly_rate', 10, 2)->nullable()->after('rental_weekly_rate');
            $table->decimal('rental_deposit', 10, 2)->nullable()->after('rental_monthly_rate');

            // Rental settings
            $table->boolean('is_rentable')->default(false)->after('rental_deposit');
            $table->integer('rental_min_days')->default(1)->after('is_rentable');
            $table->integer('rental_max_days')->nullable()->after('rental_min_days');

            // Add index for rental_category
            $table->index(['account_id', 'rental_category']);
            $table->index(['account_id', 'is_rentable']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['account_id', 'rental_category']);
            $table->dropIndex(['account_id', 'is_rentable']);

            $table->dropColumn([
                'rental_category',
                'rental_daily_rate',
                'rental_weekly_rate',
                'rental_monthly_rate',
                'rental_deposit',
                'is_rentable',
                'rental_min_days',
                'rental_max_days'
            ]);
        });
    }
};
