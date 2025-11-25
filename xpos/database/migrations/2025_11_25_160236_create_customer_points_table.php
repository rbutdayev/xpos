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
        Schema::create('customer_points', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->onDelete('cascade');
            $table->foreignId('account_id')->constrained()->onDelete('cascade');
            $table->unsignedBigInteger('sale_id')->nullable()->comment('Related sale if earned from purchase');
            $table->foreign('sale_id')->references('sale_id')->on('sales')->onDelete('set null');
            $table->enum('transaction_type', ['earned', 'redeemed', 'expired', 'adjusted', 'reversed'])->comment('Type of point transaction');
            $table->integer('points')->comment('Points amount (+ for earned, - for redeemed/expired)');
            $table->integer('balance_after')->comment('Customer point balance after this transaction');
            $table->text('description')->nullable()->comment('Transaction description');
            $table->timestamp('expires_at')->nullable()->comment('When these points expire (for earned points)');
            $table->timestamps();

            $table->index(['customer_id', 'created_at']);
            $table->index(['account_id', 'created_at']);
            $table->index('expires_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customer_points');
    }
};
