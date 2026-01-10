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
        Schema::create('module_usage_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained('accounts')->onDelete('cascade');
            $table->string('module_name', 50);
            $table->enum('action', ['enabled', 'disabled']);
            $table->decimal('price_at_time', 10, 2);
            $table->date('effective_date');
            $table->integer('days_in_month');
            $table->integer('days_used');
            $table->decimal('prorated_amount', 10, 2);
            $table->decimal('previous_monthly_total', 10, 2)->nullable();
            $table->decimal('new_monthly_total', 10, 2)->nullable();
            $table->foreignId('changed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['account_id', 'module_name', 'effective_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('module_usage_history');
    }
};
