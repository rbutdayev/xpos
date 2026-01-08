<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class KnowledgeArticle extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'knowledge_category_id',
        'title',
        'slug',
        'content',
        'excerpt',
        'type',
        'difficulty_level',
        'tags',
        'search_keywords',
        'is_published',
        'is_featured',
        'author_id',
        'published_at',
    ];

    protected $casts = [
        'is_published' => 'boolean',
        'is_featured' => 'boolean',
        'tags' => 'json',
        'published_at' => 'datetime',
    ];

    /**
     * Get the category this article belongs to
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(KnowledgeCategory::class, 'knowledge_category_id');
    }

    /**
     * Get the author of this article
     */
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    /**
     * Get translations for this article
     */
    public function translations(): HasMany
    {
        return $this->hasMany(KnowledgeArticleTranslation::class, 'knowledge_article_id');
    }

    /**
     * Get analytics for this article
     */
    public function analytics(): HasMany
    {
        return $this->hasMany(KnowledgeAnalytic::class, 'knowledge_article_id');
    }

    /**
     * Get context help mappings
     */
    public function contextHelps(): HasMany
    {
        return $this->hasMany(KnowledgeContextHelp::class, 'knowledge_article_id');
    }

    /**
     * Scope: Published articles
     */
    public function scopePublished($query)
    {
        return $query->where('is_published', true)->whereNotNull('published_at');
    }

    /**
     * Scope: Featured articles
     */
    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    /**
     * Scope: Unpublished articles
     */
    public function scopeUnpublished($query)
    {
        return $query->where('is_published', false);
    }

    /**
     * Scope: Filter by type
     */
    public function scopeOfType($query, $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope: Filter by difficulty
     */
    public function scopeByDifficulty($query, $difficulty)
    {
        return $query->where('difficulty_level', $difficulty);
    }

    /**
     * Scope: Filter by category
     */
    public function scopeInCategory($query, $categoryId)
    {
        return $query->where('knowledge_category_id', $categoryId);
    }

    /**
     * Scope: Most viewed
     */
    public function scopeMostViewed($query, $limit = 10)
    {
        return $query->orderBy('view_count', 'desc')->limit($limit);
    }

    /**
     * Scope: Most helpful
     */
    public function scopeMostHelpful($query, $limit = 10)
    {
        return $query->orderBy('helpful_count', 'desc')->limit($limit);
    }

    /**
     * Scope: Recently published
     */
    public function scopeRecentlyPublished($query, $days = 30)
    {
        return $query->where('published_at', '>=', now()->subDays($days))->orderBy('published_at', 'desc');
    }

    /**
     * Scope: Full-text search (using LIKE for MySQL compatibility)
     */
    public function scopeSearch($query, $keyword)
    {
        return $query->where(function($q) use ($keyword) {
            $q->where('title', 'LIKE', "%{$keyword}%")
              ->orWhere('content', 'LIKE', "%{$keyword}%")
              ->orWhere('excerpt', 'LIKE', "%{$keyword}%");
        });
    }

    /**
     * Increment view count
     */
    public function incrementViewCount(): void
    {
        $this->increment('view_count');
    }

    /**
     * Increment helpful count
     */
    public function incrementHelpfulCount(): void
    {
        $this->increment('helpful_count');
    }

    /**
     * Increment unhelpful count
     */
    public function incrementUnhelpfulCount(): void
    {
        $this->increment('unhelpful_count');
    }

    /**
     * Get helpfulness ratio
     */
    public function getHelpfulnessRatio(): float
    {
        $total = $this->helpful_count + $this->unhelpful_count;
        if ($total === 0) {
            return 0;
        }
        return ($this->helpful_count / $total) * 100;
    }

    /**
     * Get tags as array
     */
    public function getTagsArray(): array
    {
        return $this->tags ?? [];
    }

    /**
     * Check if article has a tag
     */
    public function hasTag(string $tag): bool
    {
        return in_array($tag, $this->getTagsArray());
    }

    /**
     * Check if article is published
     */
    public function isPublished(): bool
    {
        return $this->is_published && !is_null($this->published_at);
    }

    /**
     * Publish the article
     */
    public function publish(): void
    {
        $this->update([
            'is_published' => true,
            'published_at' => now(),
        ]);
    }

    /**
     * Unpublish the article
     */
    public function unpublish(): void
    {
        $this->update([
            'is_published' => false,
        ]);
    }

    /**
     * Get translation for a specific language
     */
    public function getTranslation($language)
    {
        return $this->translations()->where('language', $language)->first();
    }
}
