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
        Schema::create('knowledge_analytics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('knowledge_article_id')->constrained('knowledge_articles')->onDelete('cascade');
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->enum('event_type', ['viewed', 'searched', 'helpful', 'unhelpful']);
            $table->text('search_query')->nullable();
            $table->string('referrer_page', 500)->nullable();
            $table->string('session_id', 255)->nullable();
            $table->timestamps();

            // Indexes
            $table->index(['knowledge_article_id', 'event_type']);
            $table->index(['knowledge_article_id', 'created_at']);
            $table->index(['user_id', 'event_type']);
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('knowledge_analytics');
    }
};
