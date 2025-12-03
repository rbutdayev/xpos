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
        Schema::table('supplier_credits', function (Blueprint $table) {
            // Drop the incorrect unique constraint (reference_number only)
            $table->dropUnique('supplier_credits_reference_number_unique');

            // Add the correct unique constraint (account_id + reference_number)
            $table->unique(['account_id', 'reference_number'], 'supplier_credits_account_reference_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('supplier_credits', function (Blueprint $table) {
            // Drop the composite unique constraint
            $table->dropUnique('supplier_credits_account_reference_unique');

            // Restore the old unique constraint
            $table->unique('reference_number', 'supplier_credits_reference_number_unique');
        });
    }
};
