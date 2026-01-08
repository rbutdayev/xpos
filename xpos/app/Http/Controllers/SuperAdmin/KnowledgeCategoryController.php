<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Models\KnowledgeCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Illuminate\Support\Str;

class KnowledgeCategoryController
{
    public function index(Request $request)
    {
        Gate::authorize('manage-knowledge-base');

        $paginated = KnowledgeCategory::ordered()
            ->withCount('articles')
            ->paginate($request->get('per_page', 20));

        return Inertia::render('SuperAdmin/Knowledge/Categories/Index', [
            'categories' => [
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

        return Inertia::render('SuperAdmin/Knowledge/Categories/Create', [
            'parentCategories' => KnowledgeCategory::where('parent_id', null)->get(),
        ]);
    }

    public function store(Request $request)
    {
        Gate::authorize('manage-knowledge-base');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:100',
            'parent_id' => 'nullable|exists:knowledge_categories,id',
            'is_active' => 'boolean',
        ]);

        $validated['slug'] = Str::slug($validated['name']);
        $validated['sort_order'] = KnowledgeCategory::max('sort_order') + 1;

        KnowledgeCategory::create($validated);

        return redirect()->route('superadmin.knowledge.categories.index')
            ->with('success', 'Category created successfully');
    }

    public function edit(KnowledgeCategory $category)
    {
        Gate::authorize('manage-knowledge-base');

        return Inertia::render('SuperAdmin/Knowledge/Categories/Edit', [
            'category' => $category,
            'parentCategories' => KnowledgeCategory::where('parent_id', null)->where('id', '!=', $category->id)->get(),
        ]);
    }

    public function update(Request $request, KnowledgeCategory $category)
    {
        Gate::authorize('manage-knowledge-base');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:100',
            'parent_id' => 'nullable|exists:knowledge_categories,id',
            'is_active' => 'boolean',
        ]);

        $validated['slug'] = Str::slug($validated['name']);

        $category->update($validated);

        return redirect()->route('superadmin.knowledge.categories.index')
            ->with('success', 'Category updated successfully');
    }

    public function destroy(KnowledgeCategory $category)
    {
        Gate::authorize('manage-knowledge-base');

        if ($category->articles()->exists()) {
            return back()->with('error', 'Cannot delete category with existing articles');
        }

        $category->delete();

        return redirect()->route('superadmin.knowledge.categories.index')
            ->with('success', 'Category deleted successfully');
    }

    public function reorder(Request $request)
    {
        Gate::authorize('manage-knowledge-base');

        $items = $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'required|integer',
            'items.*.sort_order' => 'required|integer',
        ])['items'];

        foreach ($items as $item) {
            KnowledgeCategory::where('id', $item['id'])->update(['sort_order' => $item['sort_order']]);
        }

        return response()->json(['success' => true]);
    }
}
