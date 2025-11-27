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
        Schema::table('fiscal_printer_jobs', function (Blueprint $table) {
            $table->unsignedBigInteger('return_id')->nullable()->after('sale_id');

            // Add foreign key constraint if returns table exists
            if (Schema::hasTable('returns')) {
                $table->foreign('return_id')
                    ->references('return_id')
                    ->on('returns')
                    ->onDelete('cascade');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('fiscal_printer_jobs', function (Blueprint $table) {
            // Drop foreign key if it exists
            if (Schema::hasColumn('fiscal_printer_jobs', 'return_id')) {
                $table->dropForeign(['return_id']);
            }

            $table->dropColumn('return_id');
        });
    }
};
