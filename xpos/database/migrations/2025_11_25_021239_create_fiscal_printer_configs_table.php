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
        Schema::create('fiscal_printer_configs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained('accounts')->cascadeOnDelete();
            $table->enum('provider', ['nba', 'caspos', 'oneclick', 'omnitech', 'azsmart']);
            $table->string('name');
            $table->string('ip_address');
            $table->integer('port');
            $table->string('username')->nullable();
            $table->string('password')->nullable();
            $table->string('merchant_id')->nullable();
            $table->string('security_key')->nullable();
            $table->string('device_serial')->nullable();
            $table->string('bank_port')->nullable();
            $table->string('default_tax_name')->default('ƏDV');
            $table->decimal('default_tax_rate', 5, 2)->default(18.00);
            $table->boolean('auto_send')->default(true);
            $table->boolean('show_in_terminal')->default(true);
            $table->json('settings')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique('account_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fiscal_printer_configs');
    }
};
