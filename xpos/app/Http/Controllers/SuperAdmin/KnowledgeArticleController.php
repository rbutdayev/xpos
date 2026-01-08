<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Models\KnowledgeArticle;
use App\Models\KnowledgeCategory;
use App\Models\KnowledgeArticleTranslation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Illuminate\Support\Str;

class KnowledgeArticleController
{
    public function index(Request $request)
    {
        Gate::authorize('manage-knowledge-base');

        $paginated = KnowledgeArticle::with('category')
            ->when($request->has('search'), function ($query) use ($request) {
                $query->where('title', 'like', '%' . $request->search . '%');
            })
            ->when($request->has('category_id'), function ($query) use ($request) {
                $query->where('knowledge_category_id', $request->category_id);
            })
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 20));

        return Inertia::render('SuperAdmin/Knowledge/Articles/Index', [
            'articles' => [
                'data' => $paginated->items(),
                'links' => [
                    'first' => $paginated->url(1),
                    'last' => $paginated->url($paginated->lastPage()),
                    'prev' => $paginated->previousPageUrl(),
                    'next' => $paginated->nextPageUrl(),
                ],
                'meta' => [
                    'current_page' => $paginated->currentPage(),
                    'from' => $paginated->firstItem() ?? 0,
                    'last_page' => $paginated->lastPage(),
                    'path' => $paginated->path(),
                    'per_page' => $paginated->perPage(),
                    'to' => $paginated->lastItem() ?? 0,
                    'total' => $paginated->total(),
                ],
            ],
            'categories' => KnowledgeCategory::active()->get(),
        ]);
    }

    public function create()
    {
        Gate::authorize('manage-knowledge-base');

        return Inertia::render('SuperAdmin/Knowledge/Articles/Create', [
            'categories' => KnowledgeCategory::active()->get(),
            'languages' => ['en' => 'English', 'az' => 'Azerbaijani'],
        ]);
    }

    public function store(Request $request)
    {
        Gate::authorize('manage-knowledge-base');

        $validated = $request->validate([
            'knowledge_category_id' => 'required|exists:knowledge_categories,id',
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'excerpt' => 'nullable|string',
            'type' => 'required|in:faq,documentation,guide,tutorial,troubleshooting',
            'difficulty_level' => 'nullable|in:beginner,intermediate,advanced',
            'tags' => 'nullable|array',
            'is_published' => 'boolean',
            'is_featured' => 'boolean',
            'translations' => 'required|array',
            'translations.*.language' => 'required|in:en,az',
            'translations.*.title' => 'required|string|max:255',
            'translations.*.content' => 'required|string',
            'translations.*.excerpt' => 'nullable|string',
        ]);

        $article = KnowledgeArticle::create([
            'knowledge_category_id' => $validated['knowledge_category_id'],
            'title' => $validated['title'],
            'slug' => Str::slug($validated['title']) . '-' . time(),
            'content' => $validated['content'],
            'excerpt' => $validated['excerpt'],
            'type' => $validated['type'],
            'difficulty_level' => $validated['difficulty_level'],
            'tags' => json_encode($validated['tags'] ?? []),
            'is_published' => $validated['is_published'] ?? false,
            'is_featured' => $validated['is_featured'] ?? false,
            'author_id' => auth()->id(),
            'published_at' => ($validated['is_published'] ?? false) ? now() : null,
        ]);

        // Store translations
        foreach ($validated['translations'] as $translation) {
            KnowledgeArticleTranslation::create([
                'knowledge_article_id' => $article->id,
                'language' => $translation['language'],
                'title' => $translation['title'],
                'content' => $translation['content'],
                'excerpt' => $translation['excerpt'],
                'published_at' => ($validated['is_published'] ?? false) ? now() : null,
            ]);
        }

        return redirect()->route('superadmin.knowledge.articles.index')
            ->with('success', 'Article created successfully');
    }

    public function edit(KnowledgeArticle $article)
    {
        Gate::authorize('manage-knowledge-base');

        return Inertia::render('SuperAdmin/Knowledge/Articles/Edit', [
            'article' => $article->load('translations'),
            'categories' => KnowledgeCategory::active()->get(),
            'languages' => ['en' => 'English', 'az' => 'Azerbaijani'],
        ]);
    }

    public function update(Request $request, KnowledgeArticle $article)
    {
        Gate::authorize('manage-knowledge-base');

        $validated = $request->validate([
            'knowledge_category_id' => 'required|exists:knowledge_categories,id',
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'excerpt' => 'nullable|string',
            'type' => 'required|in:faq,documentation,guide,tutorial,troubleshooting',
            'difficulty_level' => 'nullable|in:beginner,intermediate,advanced',
            'tags' => 'nullable|array',
            'is_published' => 'boolean',
            'is_featured' => 'boolean',
            'translations' => 'required|array',
            'translations.*.language' => 'required|in:en,az',
            'translations.*.title' => 'required|string|max:255',
            'translations.*.content' => 'required|string',
            'translations.*.excerpt' => 'nullable|string',
        ]);

        $article->update([
            'knowledge_category_id' => $validated['knowledge_category_id'],
            'title' => $validated['title'],
            'content' => $validated['content'],
            'excerpt' => $validated['excerpt'],
            'type' => $validated['type'],
            'difficulty_level' => $validated['difficulty_level'],
            'tags' => json_encode($validated['tags'] ?? []),
            'is_published' => $validated['is_published'] ?? false,
            'is_featured' => $validated['is_featured'] ?? false,
            'published_at' => ($validated['is_published'] ?? false) ? now() : $article->published_at,
        ]);

        // Update translations
        $article->translations()->delete();
        foreach ($validated['translations'] as $translation) {
            KnowledgeArticleTranslation::create([
                'knowledge_article_id' => $article->id,
                'language' => $translation['language'],
                'title' => $translation['title'],
                'content' => $translation['content'],
                'excerpt' => $translation['excerpt'],
                'published_at' => ($validated['is_published'] ?? false) ? now() : null,
            ]);
        }

        return redirect()->route('superadmin.knowledge.articles.index')
            ->with('success', 'Article updated successfully');
    }

    public function destroy(KnowledgeArticle $article)
    {
        Gate::authorize('manage-knowledge-base');

        $article->delete();

        return redirect()->route('superadmin.knowledge.articles.index')
            ->with('success', 'Article deleted successfully');
    }

    public function publish(KnowledgeArticle $article)
    {
        Gate::authorize('manage-knowledge-base');

        $article->update([
            'is_published' => !$article->is_published,
            'published_at' => $article->is_published ? null : now(),
        ]);

        return back()->with('success', 'Article updated successfully');
    }

    public function feature(KnowledgeArticle $article)
    {
        Gate::authorize('manage-knowledge-base');

        $article->update([
            'is_featured' => !$article->is_featured,
        ]);

        return back()->with('success', 'Article updated successfully');
    }
}
