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
        Schema::create('fiscal_printer_providers', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique(); // nba, caspos, oneclick, omnitech, azsmart
            $table->string('name'); // NBA Smart, Caspos, OneClick, etc.
            $table->string('description')->nullable();
            $table->integer('default_port');
            $table->string('api_base_path')->default('/api'); // /api, /api/v2, etc.
            $table->string('print_endpoint')->default('print'); // print, receipt/create, etc.
            $table->string('status_endpoint')->default('status'); // status, health, etc.
            $table->json('required_fields')->nullable(); // ['username', 'password'], ['security_key'], etc.
            $table->json('endpoint_config')->nullable(); // Additional endpoint configurations
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fiscal_printer_providers');
    }
};
