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
        Schema::create('knowledge_context_help', function (Blueprint $table) {
            $table->id();
            $table->string('key', 255)->unique();
            $table->foreignId('knowledge_article_id')->nullable()->constrained('knowledge_articles')->onDelete('set null');
            $table->json('context_data')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            // Indexes
            $table->index('key');
            $table->index(['key', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('knowledge_context_help');
    }
};
