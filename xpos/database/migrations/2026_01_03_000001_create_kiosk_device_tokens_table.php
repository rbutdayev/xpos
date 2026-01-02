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
        Schema::create('kiosk_device_tokens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained('accounts')->onDelete('cascade');
            $table->foreignId('branch_id')->nullable()->constrained('branches')->onDelete('set null');
            $table->string('device_name', 100);
            $table->string('token', 255)->unique();
            $table->enum('status', ['active', 'revoked', 'suspended'])->default('active');
            $table->timestamp('last_heartbeat')->nullable();
            $table->json('device_info')->nullable();
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();

            $table->index(['account_id', 'status'], 'idx_account_status');
            $table->index('token', 'idx_token');
            $table->index('last_heartbeat', 'idx_heartbeat');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kiosk_device_tokens');
    }
};
