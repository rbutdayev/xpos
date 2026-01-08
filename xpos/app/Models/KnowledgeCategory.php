<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class KnowledgeCategory extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'icon',
        'sort_order',
        'is_active',
        'parent_id',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    /**
     * Get the parent category (for nested categories)
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(KnowledgeCategory::class, 'parent_id');
    }

    /**
     * Get child categories
     */
    public function children(): HasMany
    {
        return $this->hasMany(KnowledgeCategory::class, 'parent_id');
    }

    /**
     * Get articles in this category
     */
    public function articles(): HasMany
    {
        return $this->hasMany(KnowledgeArticle::class, 'knowledge_category_id');
    }

    /**
     * Get published articles
     */
    public function publishedArticles(): HasMany
    {
        return $this->articles()->where('is_published', true);
    }

    /**
     * Get featured articles
     */
    public function featuredArticles(): HasMany
    {
        return $this->articles()->where('is_featured', true)->where('is_published', true);
    }

    /**
     * Scope: Active categories only
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope: Main categories (no parent)
     */
    public function scopeMainCategories($query)
    {
        return $query->whereNull('parent_id');
    }

    /**
     * Scope: Subcategories (has parent)
     */
    public function scopeSubcategories($query)
    {
        return $query->whereNotNull('parent_id');
    }

    /**
     * Scope: Ordered
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('name');
    }

    /**
     * Get article count in this category
     */
    public function getArticleCountAttribute(): int
    {
        return $this->articles()->count();
    }

    /**
     * Get published article count
     */
    public function getPublishedArticleCountAttribute(): int
    {
        return $this->publishedArticles()->count();
    }

    /**
     * Check if category has children
     */
    public function hasChildren(): bool
    {
        return $this->children()->exists();
    }

    /**
     * Check if this is a main category
     */
    public function isMainCategory(): bool
    {
        return is_null($this->parent_id);
    }

    /**
     * Get full hierarchical name
     */
    public function getFullNameAttribute(): string
    {
        if ($this->parent) {
            return $this->parent->full_name . ' > ' . $this->name;
        }
        return $this->name;
    }
}
