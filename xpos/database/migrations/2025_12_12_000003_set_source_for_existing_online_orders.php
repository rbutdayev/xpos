<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Sets the 'source' field to 'shop' for all existing online orders.
     * This ensures backwards compatibility with the existing e-commerce shop data.
     */
    public function up(): void
    {
        // Update all existing records where is_online_order = true to have source = 'shop'
        // This represents orders from the e-commerce shop (not delivery platforms)
        DB::table('sales')
            ->where('is_online_order', true)
            ->update(['source' => 'shop']);
    }

    /**
     * Reverse the migrations.
     *
     * Note: We don't reverse this migration as it would lose information
     * about which orders were originally from the shop vs platforms.
     */
    public function down(): void
    {
        // No need to reverse - setting source to 'shop' is the correct historical data
        // The default value of 'shop' will be used for any new records
    }
};
