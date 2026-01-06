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
            // Add entry_type field to distinguish automatic vs manual entries
            $table->enum('entry_type', ['automatic', 'manual', 'migration'])
                ->default('automatic')
                ->after('type')
                ->comment('Type of credit entry: automatic (from goods receipt), manual (user-created), migration (imported from old system)');

            // Add old_system_reference for migration tracking
            $table->string('old_system_reference', 100)
                ->nullable()
                ->after('reference_number')
                ->comment('Reference number from previous/old system for migration tracking');

            // Add index for faster filtering by entry_type
            $table->index('entry_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('supplier_credits', function (Blueprint $table) {
            $table->dropIndex(['entry_type']);
            $table->dropColumn(['entry_type', 'old_system_reference']);
        });
    }
};
