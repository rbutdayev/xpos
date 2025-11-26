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
            $table->timestamp('next_retry_at')->nullable()->after('picked_up_at')
                ->comment('When this job can be retried (exponential backoff)');
            $table->boolean('is_retriable')->default(true)->after('error_message')
                ->comment('False for errors like duplicate sale that should not retry');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('fiscal_printer_jobs', function (Blueprint $table) {
            $table->dropColumn(['next_retry_at', 'is_retriable']);
        });
    }
};
