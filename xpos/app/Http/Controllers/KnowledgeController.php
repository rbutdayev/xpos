<?php

namespace App\Http\Controllers;

use App\Models\KnowledgeArticle;
use App\Models\KnowledgeCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class KnowledgeController extends Controller
{
    public function index()
    {
        Gate::authorize('view-knowledge-base');

        $categories = KnowledgeCategory::where('parent_id', null)
            ->active()
            ->with('articles:id,title,knowledge_category_id')
            ->ordered()
            ->get()
            ->map(fn($cat) => [
                'id' => $cat->id,
                'name' => $cat->name,
                'slug' => $cat->slug,
                'icon' => $cat->icon,
                'description' => $cat->description,
                'article_count' => $cat->articles->count(),
            ]);

        $featured_articles = KnowledgeArticle::published()
            ->featured()
            ->with('category:id,name,slug')
            ->get()
            ->map(fn($article) => [
                'id' => $article->id,
                'title' => $article->title,
                'slug' => $article->slug,
                'excerpt' => $article->excerpt,
                'type' => $article->type,
                'difficulty_level' => $article->difficulty_level,
                'view_count' => $article->view_count,
                'helpful_count' => $article->helpful_count,
                'unhelpful_count' => $article->unhelpful_count,
                'category' => $article->category,
            ]);

        return Inertia::render('Knowledge/Index', [
            'categories' => $categories,
            'featured_articles' => $featured_articles,
        ]);
    }

    public function category($slug, Request $request)
    {
        Gate::authorize('view-knowledge-base');

        $category = KnowledgeCategory::where('slug', $slug)
            ->active()
            ->firstOrFail();

        $query = $category->articles()->published();

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('difficulty')) {
            $query->where('difficulty_level', $request->difficulty);
        }

        $articles = $query->with('category:id,name,slug')
            ->orderBy('created_at', 'desc')
            ->paginate(12);

        return Inertia::render('Knowledge/Category', [
            'category' => $category,
            'articles' => $articles,
            'filters' => [
                'type' => $request->type,
                'difficulty' => $request->difficulty,
            ],
        ]);
    }

    public function article($slug)
    {
        Gate::authorize('view-knowledge-base');

        $article = KnowledgeArticle::where('slug', $slug)
            ->published()
            ->with('category:id,name,slug', 'translations')
            ->firstOrFail();

        // Get related articles
        $related_articles = KnowledgeArticle::where('knowledge_category_id', $article->knowledge_category_id)
            ->where('id', '!=', $article->id)
            ->published()
            ->limit(3)
            ->get(['id', 'title', 'slug', 'excerpt', 'type']);

        return Inertia::render('Knowledge/Article', [
            'article' => [
                'id' => $article->id,
                'title' => $article->title,
                'slug' => $article->slug,
                'content' => $article->content,
                'excerpt' => $article->excerpt,
                'type' => $article->type,
                'difficulty_level' => $article->difficulty_level,
                'tags' => $article->tags ? json_decode($article->tags) : [],
                'view_count' => $article->view_count,
                'helpful_count' => $article->helpful_count,
                'unhelpful_count' => $article->unhelpful_count,
                'created_at' => $article->created_at,
                'updated_at' => $article->updated_at,
                'category' => $article->category,
                'translations' => $article->translations,
            ],
            'related_articles' => $related_articles,
        ]);
    }

    public function search(Request $request)
    {
        Gate::authorize('view-knowledge-base');

        $query = $request->get('q', '');

        $articles = KnowledgeArticle::published()
            ->when($query, function ($q) use ($query) {
                return $q->where('title', 'like', "%{$query}%")
                    ->orWhere('excerpt', 'like', "%{$query}%")
                    ->orWhere('content', 'like', "%{$query}%");
            })
            ->with('category:id,name,slug')
            ->orderBy('created_at', 'desc')
            ->paginate(12);

        return Inertia::render('Knowledge/SearchResults', [
            'query' => $query,
            'articles' => $articles,
        ]);
    }
}
