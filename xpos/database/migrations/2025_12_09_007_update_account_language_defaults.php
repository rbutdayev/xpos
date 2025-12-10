<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update accounts.language default from 'az' to 'en'
        Schema::table('accounts', function (Blueprint $table) {
            $table->string('language', 5)->default('en')->change();
        });

        // Update existing accounts with 'az' language to 'en' (optional, remove if you want to keep existing data)
        // DB::statement("UPDATE accounts SET language = 'en' WHERE language = 'az'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert accounts.language default back to 'az'
        Schema::table('accounts', function (Blueprint $table) {
            $table->string('language', 5)->default('az')->change();
        });
    }
};
