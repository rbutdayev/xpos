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
        // Bridge tokens for authentication
        Schema::create('fiscal_printer_bridge_tokens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained('accounts')->onDelete('cascade');
            $table->string('token', 64)->unique()->comment('API token for bridge authentication');
            $table->string('name')->comment('Friendly name (e.g., "Main Store Terminal")');
            $table->string('status')->default('active')->comment('active, revoked');
            $table->timestamp('last_seen_at')->nullable()->comment('Last heartbeat from bridge');
            $table->string('bridge_version')->nullable();
            $table->json('bridge_info')->nullable()->comment('OS, hostname, etc.');
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            $table->index('token');
            $table->index(['account_id', 'status']);
        });

        // Print jobs queue
        Schema::create('fiscal_printer_jobs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained('accounts')->onDelete('cascade');
            $table->foreignId('sale_id')->constrained('sales', 'sale_id')->onDelete('cascade');
            $table->string('status')->default('pending')->comment('pending, processing, completed, failed');
            $table->json('request_data')->comment('URL, headers, body for printer');
            $table->string('provider')->comment('caspos, etc');
            $table->text('fiscal_number')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('picked_up_at')->nullable()->comment('When bridge started processing');
            $table->timestamp('completed_at')->nullable();
            $table->integer('retry_count')->default(0);
            $table->timestamps();

            $table->index(['account_id', 'status']);
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fiscal_printer_jobs');
        Schema::dropIfExists('fiscal_printer_bridge_tokens');
    }
};
