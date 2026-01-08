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
        Schema::create('knowledge_article_translations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('knowledge_article_id')->constrained('knowledge_articles')->onDelete('cascade');
            $table->string('language', 5);
            $table->string('title', 255);
            $table->longText('content');
            $table->text('excerpt')->nullable();
            $table->text('search_keywords')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamps();

            // Constraints
            $table->unique(['knowledge_article_id', 'language'], 'kb_trans_article_lang_unique');

            // Indexes
            $table->index('language');
            $table->fullText(['title', 'excerpt'], 'kb_trans_search');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('knowledge_article_translations');
    }
};
