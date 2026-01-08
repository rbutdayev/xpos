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
        Schema::create('knowledge_articles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('knowledge_category_id')->constrained('knowledge_categories')->onDelete('cascade');
            $table->string('title', 255);
            $table->string('slug')->unique();
            $table->longText('content');
            $table->text('excerpt')->nullable();
            $table->enum('type', ['faq', 'documentation', 'guide', 'tutorial', 'troubleshooting'])->default('guide');
            $table->string('difficulty_level', 50)->nullable();
            $table->json('tags')->nullable();
            $table->text('search_keywords')->nullable();
            $table->boolean('is_published')->default(false);
            $table->boolean('is_featured')->default(false);
            $table->unsignedBigInteger('view_count')->default(0);
            $table->unsignedBigInteger('helpful_count')->default(0);
            $table->unsignedBigInteger('unhelpful_count')->default(0);
            $table->foreignId('author_id')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index('slug');
            $table->index('type');
            $table->index('is_published');
            $table->index('is_featured');
            $table->index('published_at');
            $table->index('created_at');
            $table->fullText(['title', 'excerpt'], 'kb_articles_search');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('knowledge_articles');
    }
};
