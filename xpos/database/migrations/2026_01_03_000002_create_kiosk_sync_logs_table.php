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
        Schema::create('kiosk_sync_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained('accounts')->onDelete('cascade');
            $table->foreignId('kiosk_device_token_id')->constrained('kiosk_device_tokens')->onDelete('cascade');
            $table->enum('sync_type', ['products', 'customers', 'sales_upload', 'config']);
            $table->enum('direction', ['upload', 'download']);
            $table->unsignedInteger('records_count')->default(0);
            $table->enum('status', ['success', 'failed', 'partial']);
            $table->text('error_message')->nullable();
            $table->timestamp('started_at');
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['account_id', 'kiosk_device_token_id'], 'idx_account_device');
            $table->index(['sync_type', 'status'], 'idx_sync_type_status');
            $table->index('created_at', 'idx_created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kiosk_sync_logs');
    }
};
