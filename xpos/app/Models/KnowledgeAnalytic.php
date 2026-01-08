<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KnowledgeAnalytic extends Model
{
    protected $table = 'knowledge_analytics';

    protected $fillable = [
        'knowledge_article_id',
        'user_id',
        'event_type',
        'search_query',
        'referrer_page',
        'session_id',
    ];

    /**
     * Get the article this analytic is for
     */
    public function article(): BelongsTo
    {
        return $this->belongsTo(KnowledgeArticle::class, 'knowledge_article_id');
    }

    /**
     * Get the user who triggered this event
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Scope: Filter by event type
     */
    public function scopeByEventType($query, $type)
    {
        return $query->where('event_type', $type);
    }

    /**
     * Scope: View events
     */
    public function scopeViews($query)
    {
        return $query->where('event_type', 'viewed');
    }

    /**
     * Scope: Search events
     */
    public function scopeSearches($query)
    {
        return $query->where('event_type', 'searched');
    }

    /**
     * Scope: Helpful votes
     */
    public function scopeHelpful($query)
    {
        return $query->where('event_type', 'helpful');
    }

    /**
     * Scope: Unhelpful votes
     */
    public function scopeUnhelpful($query)
    {
        return $query->where('event_type', 'unhelpful');
    }

    /**
     * Scope: Filter by article
     */
    public function scopeForArticle($query, $articleId)
    {
        return $query->where('knowledge_article_id', $articleId);
    }

    /**
     * Scope: Filter by user
     */
    public function scopeByUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope: Filter by session
     */
    public function scopeBySession($query, $sessionId)
    {
        return $query->where('session_id', $sessionId);
    }

    /**
     * Scope: Date range filter
     */
    public function scopeBetweenDates($query, $start, $end)
    {
        return $query->whereBetween('created_at', [$start, $end]);
    }

    /**
     * Scope: Recent events
     */
    public function scopeRecent($query, $days = 30)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    /**
     * Record a view event
     */
    public static function recordView($articleId, $userId = null, $referrerPage = null, $sessionId = null)
    {
        return static::create([
            'knowledge_article_id' => $articleId,
            'user_id' => $userId,
            'event_type' => 'viewed',
            'referrer_page' => $referrerPage,
            'session_id' => $sessionId,
        ]);
    }

    /**
     * Record a search event
     */
    public static function recordSearch($articleId, $searchQuery, $userId = null, $sessionId = null)
    {
        return static::create([
            'knowledge_article_id' => $articleId,
            'user_id' => $userId,
            'event_type' => 'searched',
            'search_query' => $searchQuery,
            'session_id' => $sessionId,
        ]);
    }

    /**
     * Record a helpful vote
     */
    public static function recordHelpful($articleId, $userId = null, $sessionId = null)
    {
        return static::create([
            'knowledge_article_id' => $articleId,
            'user_id' => $userId,
            'event_type' => 'helpful',
            'session_id' => $sessionId,
        ]);
    }

    /**
     * Record an unhelpful vote
     */
    public static function recordUnhelpful($articleId, $userId = null, $sessionId = null)
    {
        return static::create([
            'knowledge_article_id' => $articleId,
            'user_id' => $userId,
            'event_type' => 'unhelpful',
            'session_id' => $sessionId,
        ]);
    }

    /**
     * Get view count for an article
     */
    public static function getArticleViewCount($articleId): int
    {
        return static::views()->forArticle($articleId)->count();
    }

    /**
     * Get search count for an article
     */
    public static function getArticleSearchCount($articleId): int
    {
        return static::searches()->forArticle($articleId)->count();
    }

    /**
     * Get helpful count for an article
     */
    public static function getArticleHelpfulCount($articleId): int
    {
        return static::helpful()->forArticle($articleId)->count();
    }

    /**
     * Get unhelpful count for an article
     */
    public static function getArticleUnhelpfulCount($articleId): int
    {
        return static::unhelpful()->forArticle($articleId)->count();
    }
}
