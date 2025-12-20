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
            // Add status column
            $table->enum('status', ['draft', 'completed'])->default('draft')->after('receipt_number');

            // Make receipt_number and batch_id nullable (will be generated on completion)
            $table->string('receipt_number')->nullable()->change();
            $table->string('batch_id')->nullable()->change();

            // Add index for filtering by status
            $table->index(['account_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('goods_receipts', function (Blueprint $table) {
            // Remove index
            $table->dropIndex(['account_id', 'status']);

            // Make receipt_number and batch_id non-nullable again
            $table->string('receipt_number')->nullable(false)->change();
            $table->string('batch_id')->nullable(false)->change();

            // Remove status column
            $table->dropColumn('status');
        });
    }
};
