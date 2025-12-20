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
        Schema::table('goods_receipts', function (Blueprint $table) {
            // Batch ID to group products received in one transaction
            $table->string('batch_id')->nullable()->after('receipt_number')->index();

            // Supplier's invoice number (optional, entered by user)
            $table->string('invoice_number')->nullable()->after('batch_id')->index();

            // Add composite index for batch queries
            $table->index(['account_id', 'batch_id']);
            $table->index(['account_id', 'invoice_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('goods_receipts', function (Blueprint $table) {
            $table->dropIndex(['account_id', 'invoice_number']);
            $table->dropIndex(['account_id', 'batch_id']);
            $table->dropColumn(['batch_id', 'invoice_number']);
        });
    }
};
