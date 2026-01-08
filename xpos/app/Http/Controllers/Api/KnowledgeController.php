<?php

namespace App\Http\Controllers\Api;

use App\Models\KnowledgeCategory;
use App\Models\KnowledgeArticle;
use App\Models\KnowledgeContextHelp;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class KnowledgeController
{
    public function getCategories()
    {
        Gate::authorize('view-knowledge-base');

        $categories = KnowledgeCategory::active()
            ->ordered()
            ->with(['publishedArticles' => function ($query) {
                $query->select('id', 'knowledge_category_id', 'title', 'slug', 'excerpt', 'is_featured');
            }])
            ->get()
            ->map(function ($category) {
                return [
                    'id' => $category->id,
                    'name' => $category->name,
                    'slug' => $category->slug,
                    'description' => $category->description,
                    'icon' => $category->icon,
                    'article_count' => $category->publishedArticles->count(),
                ];
            });

        return response()->json([
            'data' => $categories,
            'success' => true,
        ]);
    }

    public function listArticles(Request $request)
    {
        Gate::authorize('view-knowledge-base');

        $query = KnowledgeArticle::published();

        // Filter by category
        if ($request->has('category_id')) {
            $query->where('knowledge_category_id', $request->category_id);
        }

        // Filter by type
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        // Filter by difficulty
        if ($request->has('difficulty')) {
            $query->where('difficulty_level', $request->difficulty);
        }

        // Filter by featured
        if ($request->boolean('featured')) {
            $query->featured();
        }

        // Sort
        $sort = $request->get('sort', 'newest');
        if ($sort === 'popular') {
            $query->orderBy('view_count', 'desc');
        } elseif ($sort === 'helpful') {
            $query->orderBy('helpful_count', 'desc');
        } else {
            $query->orderBy('published_at', 'desc');
        }

        $articles = $query
            ->select('id', 'knowledge_category_id', 'title', 'slug', 'excerpt', 'type', 'difficulty_level', 'view_count', 'helpful_count', 'unhelpful_count', 'is_featured')
            ->with('category:id,name,slug')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'data' => $articles->items(),
            'meta' => [
                'current_page' => $articles->currentPage(),
                'total' => $articles->total(),
                'per_page' => $articles->perPage(),
                'last_page' => $articles->lastPage(),
            ],
            'success' => true,
        ]);
    }

    public function showArticle($slug)
    {
        Gate::authorize('view-knowledge-base');

        $article = KnowledgeArticle::where('slug', $slug)
            ->published()
            ->with('category:id,name,slug', 'translations')
            ->firstOrFail();

        // Increment view count
        $article->incrementViewCount();

        // Get translation for user's language
        $language = auth()->user()->language ?? 'en';
        $translation = $article->getTranslation($language);

        $content = $translation ? $translation->content : $article->content;
        $title = $translation ? $translation->title : $article->title;

        // Get related articles
        $relatedArticles = KnowledgeArticle::where('knowledge_category_id', $article->knowledge_category_id)
            ->where('id', '!=', $article->id)
            ->published()
            ->select('id', 'knowledge_category_id', 'title', 'slug', 'excerpt', 'difficulty_level', 'view_count', 'helpful_count', 'unhelpful_count', 'is_featured')
            ->with('category:id,name,slug')
            ->limit(3)
            ->get();

        return response()->json([
            'data' => [
                'id' => $article->id,
                'title' => $title,
                'slug' => $article->slug,
                'content' => $content,
                'excerpt' => $article->excerpt,
                'category' => [
                    'id' => $article->category->id,
                    'name' => $article->category->name,
                    'slug' => $article->category->slug,
                ],
                'type' => $article->type,
                'difficulty' => $article->difficulty_level,
                'views' => $article->view_count,
                'helpful_count' => $article->helpful_count,
                'unhelpful_count' => $article->unhelpful_count,
                'is_featured' => $article->is_featured,
                'published' => $article->is_published,
                'related' => $relatedArticles,
            ],
            'success' => true,
        ]);
    }

    public function getFeatured()
    {
        Gate::authorize('view-knowledge-base');

        $articles = KnowledgeArticle::featured()
            ->published()
            ->orderBy('published_at', 'desc')
            ->select('id', 'knowledge_category_id', 'title', 'slug', 'excerpt', 'type', 'difficulty_level', 'view_count', 'helpful_count', 'unhelpful_count', 'is_featured')
            ->with('category:id,name,slug')
            ->limit(6)
            ->get();

        return response()->json([
            'data' => $articles,
            'success' => true,
        ]);
    }

    public function search(Request $request)
    {
        Gate::authorize('view-knowledge-base');

        $query = $request->get('q', '');

        if (empty($query)) {
            return response()->json([
                'data' => [],
                'meta' => [
                    'current_page' => 1,
                    'total' => 0,
                    'per_page' => 15,
                    'last_page' => 1,
                ],
                'success' => true,
            ]);
        }

        $articles = KnowledgeArticle::published()
            ->search($query)
            ->select('id', 'knowledge_category_id', 'title', 'slug', 'excerpt', 'type', 'difficulty_level', 'view_count', 'helpful_count', 'unhelpful_count')
            ->with('category:id,name,slug')
            ->orderBy('published_at', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'data' => $articles->items(),
            'meta' => [
                'current_page' => $articles->currentPage(),
                'total' => $articles->total(),
                'per_page' => $articles->perPage(),
                'last_page' => $articles->lastPage(),
            ],
            'success' => true,
        ]);
    }

    public function getContextHelp($key)
    {
        Gate::authorize('view-knowledge-base');

        $contextHelp = KnowledgeContextHelp::where('key', $key)
            ->active()
            ->with('article:id,title,content,slug')
            ->first();

        if (!$contextHelp || !$contextHelp->article) {
            return response()->json([
                'data' => null,
                'success' => false,
                'message' => 'Help not found',
            ], 404);
        }

        // Get translation if available
        $language = auth()->user()->language ?? 'en';
        $translation = $contextHelp->article->getTranslation($language);

        return response()->json([
            'data' => [
                'id' => $contextHelp->article->id,
                'key' => $contextHelp->key,
                'title' => $translation ? $translation->title : $contextHelp->article->title,
                'content' => $translation ? $translation->content : $contextHelp->article->content,
                'slug' => $contextHelp->article->slug,
            ],
            'success' => true,
        ]);
    }
}
