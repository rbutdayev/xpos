<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KnowledgeContextHelp extends Model
{
    protected $table = 'knowledge_context_help';

    protected $fillable = [
        'key',
        'knowledge_article_id',
        'context_data',
        'is_active',
    ];

    protected $casts = [
        'context_data' => 'json',
        'is_active' => 'boolean',
    ];

    /**
     * Get the article this help is mapped to
     */
    public function article(): BelongsTo
    {
        return $this->belongsTo(KnowledgeArticle::class, 'knowledge_article_id');
    }

    /**
     * Scope: Active context help
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope: Filter by key
     */
    public function scopeByKey($query, $key)
    {
        return $query->where('key', $key);
    }

    /**
     * Scope: Filter by multiple keys
     */
    public function scopeByKeys($query, $keys)
    {
        return $query->whereIn('key', $keys);
    }

    /**
     * Find context help by key
     */
    public static function findByKey($key)
    {
        return static::where('key', $key)->first();
    }

    /**
     * Get context data
     */
    public function getContextData(): array
    {
        return $this->context_data ?? [];
    }

    /**
     * Check if mapped to an article
     */
    public function hasArticle(): bool
    {
        return !is_null($this->knowledge_article_id);
    }

    /**
     * Activate this context help
     */
    public function activate(): void
    {
        $this->update(['is_active' => true]);
    }

    /**
     * Deactivate this context help
     */
    public function deactivate(): void
    {
        $this->update(['is_active' => false]);
    }
}
