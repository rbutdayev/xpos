<?php

namespace App\Http\Controllers\Api;

use App\Models\KnowledgeArticle;
use App\Models\KnowledgeAnalytic;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class KnowledgeAnalyticsController
{
    public function recordView($id, Request $request)
    {
        Gate::authorize('view-knowledge-base');

        $article = KnowledgeArticle::published()->findOrFail($id);

        // Record the view
        $article->incrementViewCount();

        KnowledgeAnalytic::recordView(
            $id,
            auth()->id(),
            $request->header('referer'),
            $request->session()->getId()
        );

        return response()->json([
            'data' => [
                'views' => $article->view_count,
            ],
            'success' => true,
        ]);
    }

    public function markHelpful($id, Request $request)
    {
        Gate::authorize('view-knowledge-base');

        $article = KnowledgeArticle::published()->findOrFail($id);

        // Check if user already voted
        $existingVote = KnowledgeAnalytic::where('knowledge_article_id', $id)
            ->where('user_id', auth()->id())
            ->whereIn('event_type', ['helpful', 'unhelpful'])
            ->latest()
            ->first();

        if ($existingVote) {
            return response()->json([
                'success' => false,
                'message' => 'You have already voted on this article',
            ], 409);
        }

        // Record the vote
        $article->incrementHelpfulCount();

        KnowledgeAnalytic::recordHelpful(
            $id,
            auth()->id(),
            $request->session()->getId()
        );

        return response()->json([
            'data' => [
                'helpful_count' => $article->helpful_count,
                'unhelpful_count' => $article->unhelpful_count,
                'helpfulness_ratio' => round($article->getHelpfulnessRatio(), 2),
            ],
            'success' => true,
        ]);
    }

    public function markUnhelpful($id, Request $request)
    {
        Gate::authorize('view-knowledge-base');

        $article = KnowledgeArticle::published()->findOrFail($id);

        // Check if user already voted
        $existingVote = KnowledgeAnalytic::where('knowledge_article_id', $id)
            ->where('user_id', auth()->id())
            ->whereIn('event_type', ['helpful', 'unhelpful'])
            ->latest()
            ->first();

        if ($existingVote) {
            return response()->json([
                'success' => false,
                'message' => 'You have already voted on this article',
            ], 409);
        }

        // Record the vote
        $article->incrementUnhelpfulCount();

        KnowledgeAnalytic::recordUnhelpful(
            $id,
            auth()->id(),
            $request->session()->getId()
        );

        return response()->json([
            'data' => [
                'helpful_count' => $article->helpful_count,
                'unhelpful_count' => $article->unhelpful_count,
                'helpfulness_ratio' => round($article->getHelpfulnessRatio(), 2),
            ],
            'success' => true,
        ]);
    }
}
