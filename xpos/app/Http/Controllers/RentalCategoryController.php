<?php

namespace App\Http\Controllers;

use App\Models\RentalCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\JsonResponse;

class RentalCategoryController extends Controller
{
    /**
     * Display a listing of rental categories.
     */
    public function index(Request $request): Response|JsonResponse
    {
        $accountId = auth()->user()->account_id;

        $query = RentalCategory::where('account_id', $accountId);

        // Apply filters
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name_az', 'like', "%{$search}%")
                  ->orWhere('name_en', 'like', "%{$search}%")
                  ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            if ($request->status === 'active') {
                $query->where('is_active', true);
            } elseif ($request->status === 'inactive') {
                $query->where('is_active', false);
            }
        }

        $categories = $query->ordered()
            ->withCount('templates')
            ->paginate(20)
            ->withQueryString();

        // Return JSON for API
        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'data' => $categories,
            ]);
        }

        return Inertia::render('RentalCategories/Index', [
            'categories' => $categories,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    /**
     * Show the form for creating a new category.
     */
    public function create(): Response
    {
        return Inertia::render('RentalCategories/Form', [
            'category' => null,
        ]);
    }

    /**
     * Store a newly created category.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name_az' => 'required|string|max:255',
            'name_en' => 'nullable|string|max:255',
            'slug' => 'nullable|string|max:255|alpha_dash',
            'color' => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/',
            'description_az' => 'nullable|string',
            'description_en' => 'nullable|string',
            'is_active' => 'boolean',
            'sort_order' => 'nullable|integer',
        ]);

        $validated['account_id'] = auth()->user()->account_id;

        RentalCategory::create($validated);

        return redirect()->route('rental-categories.index')
            ->with('success', 'Kateqoriya uğurla yaradıldı');
    }

    /**
     * Display the specified category.
     */
    public function show(RentalCategory $rentalCategory): Response
    {
        // Ensure user can only access their own account's categories
        if ($rentalCategory->account_id !== auth()->user()->account_id) {
            abort(403);
        }

        $rentalCategory->loadCount('templates');

        return Inertia::render('RentalCategories/Show', [
            'category' => $rentalCategory,
        ]);
    }

    /**
     * Show the form for editing the specified category.
     */
    public function edit(RentalCategory $rentalCategory): Response
    {
        // Ensure user can only access their own account's categories
        if ($rentalCategory->account_id !== auth()->user()->account_id) {
            abort(403);
        }

        return Inertia::render('RentalCategories/Form', [
            'category' => $rentalCategory,
        ]);
    }

    /**
     * Update the specified category.
     */
    public function update(Request $request, RentalCategory $rentalCategory): RedirectResponse
    {
        // Ensure user can only update their own account's categories
        if ($rentalCategory->account_id !== auth()->user()->account_id) {
            abort(403);
        }

        $validated = $request->validate([
            'name_az' => 'required|string|max:255',
            'name_en' => 'nullable|string|max:255',
            'slug' => 'nullable|string|max:255|alpha_dash',
            'color' => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/',
            'description_az' => 'nullable|string',
            'description_en' => 'nullable|string',
            'is_active' => 'boolean',
            'sort_order' => 'nullable|integer',
        ]);

        // If slug is being changed, ensure it's unique
        if (isset($validated['slug']) && $validated['slug'] !== $rentalCategory->slug) {
            $request->validate([
                'slug' => 'unique:rental_categories,slug,NULL,id,account_id,' . $rentalCategory->account_id,
            ]);
        }

        $rentalCategory->update($validated);

        return redirect()->route('rental-categories.index')
            ->with('success', 'Kateqoriya uğurla yeniləndi');
    }

    /**
     * Remove the specified category.
     */
    public function destroy(RentalCategory $rentalCategory): RedirectResponse
    {
        // Ensure user can only delete their own account's categories
        if ($rentalCategory->account_id !== auth()->user()->account_id) {
            abort(403);
        }

        // Check if category can be deleted
        if (!$rentalCategory->canBeDeleted()) {
            return redirect()->route('rental-categories.index')
                ->with('error', 'Bu kateqoriya istifadədə olduğu üçün silinə bilməz. Əvəzinə deaktiv edin.');
        }

        $rentalCategory->delete();

        return redirect()->route('rental-categories.index')
            ->with('success', 'Kateqoriya uğurla silindi');
    }

    /**
     * Toggle category active status.
     */
    public function toggleStatus(RentalCategory $rentalCategory): RedirectResponse
    {
        // Ensure user can only toggle their own account's categories
        if ($rentalCategory->account_id !== auth()->user()->account_id) {
            abort(403);
        }

        if ($rentalCategory->is_active) {
            $rentalCategory->deactivate();
            $message = 'Kateqoriya deaktiv edildi';
        } else {
            $rentalCategory->activate();
            $message = 'Kateqoriya aktiv edildi';
        }

        return redirect()->route('rental-categories.index')
            ->with('success', $message);
    }

    /**
     * Get all active categories for dropdown/select
     */
    public function getActive(): JsonResponse
    {
        $accountId = auth()->user()->account_id;

        $categories = RentalCategory::where('account_id', $accountId)
            ->active()
            ->ordered()
            ->get()
            ->map(function ($category) {
                return [
                    'value' => $category->slug,
                    'label' => $category->name_az,
                    'label_en' => $category->name_en,
                    'color' => $category->color,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $categories,
        ]);
    }

    /**
     * Reorder categories
     */
    public function reorder(Request $request): JsonResponse
    {
        $request->validate([
            'categories' => 'required|array',
            'categories.*.id' => 'required|exists:rental_categories,id',
            'categories.*.sort_order' => 'required|integer',
        ]);

        $accountId = auth()->user()->account_id;

        foreach ($request->categories as $categoryData) {
            RentalCategory::where('id', $categoryData['id'])
                ->where('account_id', $accountId)
                ->update(['sort_order' => $categoryData['sort_order']]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Kateqoriyalar yenidən sıralandı',
        ]);
    }
}
