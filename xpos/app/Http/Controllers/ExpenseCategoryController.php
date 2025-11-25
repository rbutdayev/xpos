<?php

namespace App\Http\Controllers;

use App\Models\ExpenseCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class ExpenseCategoryController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
        $this->middleware('account.access');
    }

    public function index()
    {
        Gate::authorize('access-account-data');
        
        $categories = ExpenseCategory::with(['parent', 'children'])
            ->byAccount(auth()->user()->account_id)
            ->orderBy('type')
            ->orderBy('name')
            ->get();
            
        return Inertia::render('Expenses/Categories/Index', [
            'categories' => $categories,
            'types' => ExpenseCategory::getTypes()
        ]);
    }

    public function create()
    {
        Gate::authorize('manage-expenses');
        
        $parentCategories = ExpenseCategory::byAccount(auth()->user()->account_id)
            ->whereNull('parent_id')
            ->orderBy('name')
            ->get();
            
        return Inertia::render('Expenses/Categories/Create', [
            'parentCategories' => $parentCategories,
            'types' => ExpenseCategory::getTypes()
        ]);
    }

    public function store(Request $request)
    {
        Gate::authorize('manage-expenses');
        
        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:maaş,xərclər,ödənişlər,kommunal,nəqliyyat,digər',
            'parent_id' => 'nullable|exists:expense_categories,category_id',
            'description' => 'nullable|string',
        ]);

        $category = ExpenseCategory::create([
            'account_id' => auth()->user()->account_id,
            'name' => $request->name,
            'type' => $request->type,
            'parent_id' => $request->parent_id,
            'description' => $request->description,
            'is_active' => true,
        ]);

        return redirect()->route('expense-categories.index')
                        ->with('success', __('app.saved_successfully'));
    }

    public function show(ExpenseCategory $expenseCategory)
    {
        Gate::authorize('access-account-data', $expenseCategory);
        
        $expenseCategory->load(['parent', 'children.children', 'expenses']);
        
        return Inertia::render('Expenses/Categories/Show', [
            'category' => $expenseCategory,
            'types' => ExpenseCategory::getTypes()
        ]);
    }

    public function edit(ExpenseCategory $expenseCategory)
    {
        Gate::authorize('manage-expenses');
        Gate::authorize('access-account-data', $expenseCategory);
        
        $parentCategories = ExpenseCategory::byAccount(auth()->user()->account_id)
            ->whereNull('parent_id')
            ->where('category_id', '!=', $expenseCategory->category_id)
            ->orderBy('name')
            ->get();
            
        return Inertia::render('Expenses/Categories/Edit', [
            'category' => $expenseCategory,
            'parentCategories' => $parentCategories,
            'types' => ExpenseCategory::getTypes()
        ]);
    }

    public function update(Request $request, ExpenseCategory $expenseCategory)
    {
        Gate::authorize('manage-expenses');
        Gate::authorize('access-account-data', $expenseCategory);
        
        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:maaş,xərclər,ödənişlər,kommunal,nəqliyyat,digər',
            'parent_id' => 'nullable|exists:expense_categories,category_id',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        // Prevent circular reference
        if ($request->parent_id == $expenseCategory->category_id) {
            return back()->withErrors(['parent_id' => 'Kateqoriya özünün ana kateqoriyası ola bilməz.']);
        }

        $expenseCategory->update([
            'name' => $request->name,
            'type' => $request->type,
            'parent_id' => $request->parent_id,
            'description' => $request->description,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()->route('expense-categories.show', $expenseCategory)
                        ->with('success', __('app.updated_successfully'));
    }

    public function destroy(ExpenseCategory $expenseCategory)
    {
        Gate::authorize('manage-expenses');
        Gate::authorize('access-account-data', $expenseCategory);
        
        // Check if category has children or expenses
        if ($expenseCategory->children()->count() > 0) {
            return back()->withErrors(['category' => 'Alt kateqoriyaları olan kateqoriya silinə bilməz.']);
        }
        
        if ($expenseCategory->expenses()->count() > 0) {
            return back()->withErrors(['category' => 'Xərcləri olan kateqoriya silinə bilməz.']);
        }

        $expenseCategory->delete();

        return redirect()->route('expense-categories.index')
                        ->with('success', __('app.deleted_successfully'));
    }

    public function search(Request $request)
    {
        Gate::authorize('access-account-data');
        
        $request->validate([
            'search' => 'nullable|string|max:255',
            'type' => 'nullable|string|in:operating,administrative,financial,other',
            'parent_id' => 'nullable|integer|exists:expense_categories,id',
        ]);
        
        $validated = $request->validated();
        $query = ExpenseCategory::byAccount(auth()->user()->account_id);
        
        if ($request->filled('search')) {
            $search = $validated['search'];
            $query->where('name', 'like', '%' . $search . '%')
                  ->orWhere('description', 'like', '%' . $search . '%');
        }
        
        if ($request->filled('type')) {
            $query->where('type', $validated['type']);
        }
        
        if ($request->filled('parent_id')) {
            $query->where('parent_id', $validated['parent_id']);
        }
        
        $categories = $query->with(['parent'])
                           ->orderBy('name')
                           ->limit(50)
                           ->get();
        
        return response()->json($categories);
    }
}