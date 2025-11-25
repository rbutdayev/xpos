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
        Schema::create('loyalty_programs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained()->onDelete('cascade');
            $table->decimal('points_per_currency_unit', 10, 2)->default(1.00)->comment('Points earned per currency unit spent');
            $table->decimal('redemption_rate', 10, 2)->default(100.00)->comment('Points needed for 1 currency unit discount');
            $table->integer('min_redemption_points')->default(100)->comment('Minimum points required to redeem');
            $table->integer('points_expiry_days')->nullable()->comment('Days until points expire (null = never expire)');
            $table->integer('max_points_per_transaction')->nullable()->comment('Maximum points earnable per transaction');
            $table->boolean('earn_on_discounted_items')->default(true)->comment('Allow earning points on discounted products');
            $table->boolean('is_active')->default(false)->comment('Is loyalty program active for this account');
            $table->timestamps();

            $table->unique('account_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('loyalty_programs');
    }
};
