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
        Schema::create('fiscal_printer_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained('accounts')->cascadeOnDelete();
            $table->foreignId('sale_id')->nullable()->constrained('sales', 'sale_id')->cascadeOnDelete();
            $table->string('status');
            $table->text('request_data')->nullable();
            $table->text('response_data')->nullable();
            $table->string('fiscal_number')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamps();

            $table->index(['account_id', 'status']);
            $table->index('sale_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fiscal_printer_logs');
    }
};
