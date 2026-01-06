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
        Schema::table('sales', function (Blueprint $table) {
            // Expeditor visit location tracking
            $table->decimal('visit_latitude', 10, 8)->nullable()->after('notes');
            $table->decimal('visit_longitude', 11, 8)->nullable()->after('visit_latitude');
            $table->text('visit_address')->nullable()->after('visit_longitude');
            $table->timestamp('visit_timestamp')->nullable()->after('visit_address');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn(['visit_latitude', 'visit_longitude', 'visit_address', 'visit_timestamp']);
        });
    }
};
