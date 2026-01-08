<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KnowledgeArticleTranslation extends Model
{
    protected $fillable = [
        'knowledge_article_id',
        'language',
        'title',
        'content',
        'excerpt',
        'search_keywords',
        'published_at',
    ];

    protected $casts = [
        'published_at' => 'datetime',
    ];

    /**
     * Get the article this translation belongs to
     */
    public function article(): BelongsTo
    {
        return $this->belongsTo(KnowledgeArticle::class, 'knowledge_article_id');
    }

    /**
     * Scope: Filter by language
     */
    public function scopeByLanguage($query, $language)
    {
        return $query->where('language', $language);
    }

    /**
     * Scope: Published translations
     */
    public function scopePublished($query)
    {
        return $query->whereNotNull('published_at');
    }

    /**
     * Scope: Full-text search (uses LIKE for compatibility with indexed columns)
     */
    public function scopeSearch($query, $keyword)
    {
        return $query->where(function ($q) use ($keyword) {
            $q->where('title', 'LIKE', "%{$keyword}%")
              ->orWhere('content', 'LIKE', "%{$keyword}%")
              ->orWhere('excerpt', 'LIKE', "%{$keyword}%")
              ->orWhere('search_keywords', 'LIKE', "%{$keyword}%");
        });
    }

    /**
     * Publish the translation
     */
    public function publish(): void
    {
        $this->update(['published_at' => now()]);
    }

    /**
     * Unpublish the translation
     */
    public function unpublish(): void
    {
        $this->update(['published_at' => null]);
    }

    /**
     * Check if translation is published
     */
    public function isPublished(): bool
    {
        return !is_null($this->published_at);
    }
}
