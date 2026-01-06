<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class CategoryController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
        $this->middleware('account.access');
    }

    public function index(Request $request)
    {
        Gate::authorize('access-account-data');

        $query = Category::with(['parent', 'children', 'products'])
            ->where('account_id', Auth::user()->account_id);

        // Search filter
        if ($request->filled('search')) {
            $searchTerm = $request->input('search');
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', '%' . $searchTerm . '%')
                  ->orWhere('description', 'like', '%' . $searchTerm . '%');
            });
        }

        $categories = $query->orderBy('sort_order')->paginate(20);

        return Inertia::render('Products/Categories/Index', [
            'categories' => $categories,
            'filters' => $request->only(['search'])
        ]);
    }

    public function create()
    {
        Gate::authorize('manage-products');
        
        $parentCategories = Category::where('account_id', Auth::user()->account_id)
            ->whereNull('parent_id')
            ->orderBy('sort_order')
            ->get();
            
        return Inertia::render('Products/Categories/Create', [
            'parentCategories' => $parentCategories
        ]);
    }

    public function store(Request $request)
    {
        Gate::authorize('manage-products');
        
        $request->validate([
            'name' => 'required|string|max:255',
            'parent_id' => 'nullable|exists:categories,id',
            'description' => 'nullable|string',
            'is_service' => 'boolean',
            'sort_order' => 'nullable|integer|min:0',
        ]);

        $category = Category::create([
            'account_id' => Auth::user()->account_id,
            'name' => $request->name,
            'parent_id' => $request->parent_id,
            'description' => $request->description,
            'is_service' => $request->boolean('is_service'),
            'sort_order' => $request->sort_order ?? 0,
            'is_active' => true,
        ]);

        return redirect()->route('categories.index')
                        ->with('success', __('app.saved_successfully'));
    }

    public function show(Category $category)
    {
        Gate::authorize('access-account-data', $category);
        
        $category->load(['parent', 'children.children', 'products']);
        
        return Inertia::render('Products/Categories/Show', [
            'category' => $category
        ]);
    }

    public function edit(Category $category)
    {
        Gate::authorize('manage-products');
        Gate::authorize('access-account-data', $category);
        
        $parentCategories = Category::where('account_id', Auth::user()->account_id)
            ->whereNull('parent_id')
            ->where('id', '!=', $category->id)
            ->orderBy('sort_order')
            ->get();
            
        return Inertia::render('Products/Categories/Edit', [
            'category' => $category,
            'parentCategories' => $parentCategories
        ]);
    }

    public function update(Request $request, Category $category)
    {
        Gate::authorize('manage-products');
        Gate::authorize('access-account-data', $category);
        
        $request->validate([
            'name' => 'required|string|max:255',
            'parent_id' => 'nullable|exists:categories,id',
            'description' => 'nullable|string',
            'is_service' => 'boolean',
            'sort_order' => 'nullable|integer|min:0',
            'is_active' => 'boolean',
        ]);

        // Prevent circular reference
        if ($request->parent_id == $category->id) {
            return back()->withErrors(['parent_id' => 'Kateqoriya özünün ana kateqoriyası ola bilməz.']);
        }

        $category->update([
            'name' => $request->name,
            'parent_id' => $request->parent_id,
            'description' => $request->description,
            'is_service' => $request->boolean('is_service'),
            'sort_order' => $request->sort_order ?? $category->sort_order,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()->route('categories.show', $category)
                        ->with('success', __('app.updated_successfully'));
    }

    public function destroy(Category $category)
    {
        Gate::authorize('manage-products');
        Gate::authorize('access-account-data', $category);
        
        // Check if category has children or products
        if ($category->children()->count() > 0) {
            return back()->withErrors(['category' => 'Alt kateqoriyaları olan kateqoriya silinə bilməz.']);
        }
        
        if ($category->products()->count() > 0) {
            return back()->withErrors(['category' => 'Məhsulları olan kateqoriya silinə bilməz.']);
        }

        $category->delete();

        return redirect()->route('categories.index')
                        ->with('success', __('app.deleted_successfully'));
    }

    public function bulkDelete(Request $request)
    {
        Gate::authorize('manage-products');

        $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'required|integer|exists:categories,id',
        ]);

        $user = Auth::user();
        $deletedCount = 0;
        $failedCategories = [];

        DB::transaction(function () use ($request, $user, &$deletedCount, &$failedCategories) {
            $categories = Category::whereIn('id', $request->ids)
                ->where('account_id', $user->account_id)
                ->get();

            foreach ($categories as $category) {
                // Check if category has children
                if ($category->children()->count() > 0) {
                    $failedCategories[] = $category->name . ' (alt kateqoriyalara sahibdir)';
                    continue;
                }

                // Check if category has products
                if ($category->products()->count() > 0) {
                    $failedCategories[] = $category->name . ' (məhsullara sahibdir)';
                    continue;
                }

                $category->delete();
                $deletedCount++;
            }
        });

        if (count($failedCategories) > 0) {
            $failedList = implode(', ', $failedCategories);
            $message = $deletedCount > 0
                ? "{$deletedCount} kateqoriya silindi. Bu kateqoriyalar silinə bilmədi: {$failedList}"
                : "Heç bir kateqoriya silinmədi. {$failedList}";

            return redirect()->route('categories.index')
                ->with($deletedCount > 0 ? 'warning' : 'error', $message);
        }

        return redirect()->route('categories.index')
            ->with('success', "{$deletedCount} kateqoriya uğurla silindi");
    }

    public function tree()
    {
        Gate::authorize('access-account-data');

        $categories = Category::with(['children' => function ($query) {
            $query->orderBy('sort_order');
        }])
        ->where('account_id', Auth::user()->account_id)
        ->whereNull('parent_id')
        ->orderBy('sort_order')
        ->get();

        return response()->json($categories);
    }
}
