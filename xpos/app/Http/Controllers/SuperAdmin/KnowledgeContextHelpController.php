<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Models\KnowledgeContextHelp;
use App\Models\KnowledgeArticle;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class KnowledgeContextHelpController
{
    public function index(Request $request)
    {
        Gate::authorize('manage-knowledge-base');

        $paginated = KnowledgeContextHelp::with('article:id,title')
            ->when($request->has('search'), function ($query) use ($request) {
                $query->where('key', 'like', '%' . $request->search . '%');
            })
            ->orderBy('key')
            ->paginate($request->get('per_page', 20));

        return Inertia::render('SuperAdmin/Knowledge/ContextHelp/Index', [
            'contextHelps' => [
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
        ]);
    }

    public function create()
    {
        Gate::authorize('manage-knowledge-base');

        return Inertia::render('SuperAdmin/Knowledge/ContextHelp/Create', [
            'articles' => KnowledgeArticle::published()
                ->select('id', 'title')
                ->get(),
        ]);
    }

    public function store(Request $request)
    {
        Gate::authorize('manage-knowledge-base');

        $validated = $request->validate([
            'key' => 'required|string|unique:knowledge_context_help',
            'knowledge_article_id' => 'nullable|exists:knowledge_articles,id',
            'is_active' => 'boolean',
        ]);

        KnowledgeContextHelp::create($validated);

        return redirect()->route('superadmin.knowledge.context-help.index')
            ->with('success', 'Context help created successfully');
    }

    public function edit(KnowledgeContextHelp $contextHelp)
    {
        Gate::authorize('manage-knowledge-base');

        return Inertia::render('SuperAdmin/Knowledge/ContextHelp/Edit', [
            'contextHelp' => $contextHelp,
            'articles' => KnowledgeArticle::published()
                ->select('id', 'title')
                ->get(),
        ]);
    }

    public function update(Request $request, KnowledgeContextHelp $contextHelp)
    {
        Gate::authorize('manage-knowledge-base');

        $validated = $request->validate([
            'knowledge_article_id' => 'nullable|exists:knowledge_articles,id',
            'is_active' => 'boolean',
        ]);

        $contextHelp->update($validated);

        return redirect()->route('superadmin.knowledge.context-help.index')
            ->with('success', 'Context help updated successfully');
    }

    public function destroy(KnowledgeContextHelp $contextHelp)
    {
        Gate::authorize('manage-knowledge-base');

        $contextHelp->delete();

        return redirect()->route('superadmin.knowledge.context-help.index')
            ->with('success', 'Context help deleted successfully');
    }
}
