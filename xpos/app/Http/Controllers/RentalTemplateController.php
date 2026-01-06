<?php

namespace App\Http\Controllers;

use App\Models\RentalAgreementTemplate;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class RentalTemplateController extends Controller
{
    /**
     * Display a listing of rental agreement templates.
     */
    public function index(Request $request): Response
    {
        $accountId = auth()->user()->account_id;

        $query = RentalAgreementTemplate::where('account_id', $accountId);

        // Apply filters
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('rental_category', 'like', "%{$search}%");
            });
        }

        if ($request->filled('category')) {
            $query->where('rental_category', $request->category);
        }

        if ($request->filled('status')) {
            if ($request->status === 'active') {
                $query->where('is_active', true);
            } elseif ($request->status === 'inactive') {
                $query->where('is_active', false);
            }
        }

        $templates = $query->orderBy('rental_category')
            ->orderBy('is_default', 'desc')
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('RentalTemplates/Index', [
            'templates' => $templates,
            'filters' => $request->only(['search', 'category', 'status']),
            'categories' => $this->getRentalCategories(),
        ]);
    }

    /**
     * Show the form for creating a new template.
     */
    public function create(): Response
    {
        return Inertia::render('RentalTemplates/Form', [
            'template' => null,
            'categories' => $this->getRentalCategories(),
        ]);
    }

    /**
     * Store a newly created template.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'rental_category' => 'required|string',
            'terms_and_conditions_az' => 'required|string',
            'terms_and_conditions_en' => 'nullable|string',
            'damage_liability_terms_az' => 'required|string',
            'damage_liability_terms_en' => 'nullable|string',
            'condition_checklist' => 'nullable|array',
            'is_active' => 'boolean',
            'is_default' => 'boolean',
            'require_photos' => 'boolean',
            'min_photos' => 'nullable|integer|min:0|max:20',
            'notes' => 'nullable|string',
        ]);

        $validated['account_id'] = auth()->user()->account_id;

        RentalAgreementTemplate::create($validated);

        return redirect()->route('rental-templates.index')
            ->with('success', 'Şablon uğurla yaradıldı');
    }

    /**
     * Display the specified template.
     */
    public function show(RentalAgreementTemplate $rentalTemplate): Response
    {
        $accountId = auth()->user()->account_id;

        // Ensure user can only access their own account's templates
        if ($rentalTemplate->account_id !== $accountId) {
            abort(403);
        }

        $category = \App\Models\RentalCategory::where('account_id', $accountId)
            ->where('slug', $rentalTemplate->rental_category)
            ->first();

        return Inertia::render('RentalTemplates/Show', [
            'template' => $rentalTemplate,
            'categoryName' => $category?->name_az ?? $rentalTemplate->rental_category,
        ]);
    }

    /**
     * Show the form for editing the specified template.
     */
    public function edit(RentalAgreementTemplate $rentalTemplate): Response
    {
        // Ensure user can only access their own account's templates
        if ($rentalTemplate->account_id !== auth()->user()->account_id) {
            abort(403);
        }

        return Inertia::render('RentalTemplates/Form', [
            'template' => $rentalTemplate,
            'categories' => $this->getRentalCategories(),
        ]);
    }

    /**
     * Update the specified template.
     */
    public function update(Request $request, RentalAgreementTemplate $rentalTemplate): RedirectResponse
    {
        // Ensure user can only update their own account's templates
        if ($rentalTemplate->account_id !== auth()->user()->account_id) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'rental_category' => 'required|string',
            'terms_and_conditions_az' => 'required|string',
            'terms_and_conditions_en' => 'nullable|string',
            'damage_liability_terms_az' => 'required|string',
            'damage_liability_terms_en' => 'nullable|string',
            'condition_checklist' => 'nullable|array',
            'is_active' => 'boolean',
            'is_default' => 'boolean',
            'require_photos' => 'boolean',
            'min_photos' => 'nullable|integer|min:0|max:20',
            'notes' => 'nullable|string',
        ]);

        $rentalTemplate->update($validated);

        return redirect()->route('rental-templates.index')
            ->with('success', 'Şablon uğurla yeniləndi');
    }

    /**
     * Remove the specified template.
     */
    public function destroy(RentalAgreementTemplate $rentalTemplate): RedirectResponse
    {
        // Ensure user can only delete their own account's templates
        if ($rentalTemplate->account_id !== auth()->user()->account_id) {
            abort(403);
        }

        // Check if template is being used
        if ($rentalTemplate->agreements()->count() > 0) {
            return redirect()->route('rental-templates.index')
                ->with('error', 'Şablon istifadədə olduğu üçün silinə bilməz. Əvəzinə deaktiv edin.');
        }

        $rentalTemplate->delete();

        return redirect()->route('rental-templates.index')
            ->with('success', 'Şablon uğurla silindi');
    }

    /**
     * Toggle template active status.
     */
    public function toggleStatus(RentalAgreementTemplate $rentalTemplate): RedirectResponse
    {
        // Ensure user can only toggle their own account's templates
        if ($rentalTemplate->account_id !== auth()->user()->account_id) {
            abort(403);
        }

        if ($rentalTemplate->is_active) {
            $rentalTemplate->deactivate();
            $message = 'Şablon deaktiv edildi';
        } else {
            $rentalTemplate->activate();
            $message = 'Şablon aktiv edildi';
        }

        return redirect()->route('rental-templates.index')
            ->with('success', $message);
    }

    /**
     * Set template as default for its category.
     */
    public function setDefault(RentalAgreementTemplate $rentalTemplate): RedirectResponse
    {
        // Ensure user can only set their own account's templates as default
        if ($rentalTemplate->account_id !== auth()->user()->account_id) {
            abort(403);
        }

        // Can only set active templates as default
        if (!$rentalTemplate->is_active) {
            return redirect()->route('rental-templates.index')
                ->with('error', 'Yalnız aktiv şablonlar default edilə bilər');
        }

        $rentalTemplate->setAsDefault();

        return redirect()->route('rental-templates.index')
            ->with('success', 'Şablon default olaraq təyin edildi');
    }

    /**
     * Preview template as PDF.
     */
    public function preview(RentalAgreementTemplate $rentalTemplate, Request $request)
    {
        // Ensure user can only preview their own account's templates
        if ($rentalTemplate->account_id !== auth()->user()->account_id) {
            abort(403);
        }

        $language = $request->get('lang', 'az');

        // Sample data for preview
        $sampleData = [
            'customer_name' => 'Müştəri Adı',
            'customer_id' => '1234567',
            'customer_phone' => '+994501234567',
            'rental_date' => now()->format('d.m.Y'),
            'return_date' => now()->addDays(7)->format('d.m.Y'),
            'items' => [
                ['name' => 'Nümunə Məhsul 1', 'price' => '100 ₼'],
                ['name' => 'Nümunə Məhsul 2', 'price' => '150 ₼'],
            ],
            'total_amount' => '250 ₼',
            'deposit_amount' => '100 ₼',
        ];

        return Inertia::render('RentalTemplates/Preview', [
            'template' => $rentalTemplate,
            'language' => $language,
            'sampleData' => $sampleData,
        ]);
    }

    /**
     * Duplicate an existing template.
     */
    public function duplicate(RentalAgreementTemplate $rentalTemplate): RedirectResponse
    {
        // Ensure user can only duplicate their own account's templates
        if ($rentalTemplate->account_id !== auth()->user()->account_id) {
            abort(403);
        }

        $newTemplate = $rentalTemplate->replicate();
        $newTemplate->name = $rentalTemplate->name . ' (Kopya)';
        $newTemplate->is_default = false;
        $newTemplate->is_active = false;
        $newTemplate->save();

        return redirect()->route('rental-templates.edit', $newTemplate)
            ->with('success', 'Şablon kopyalandı. İndi düzənləyə bilərsiniz.');
    }

    /**
     * Bulk delete templates.
     */
    public function bulkDelete(Request $request): RedirectResponse
    {
        Gate::authorize('delete-account-data');

        $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'required|integer',
        ]);

        $accountId = auth()->user()->account_id;
        $deletedCount = 0;
        $failedTemplates = [];

        DB::transaction(function () use ($request, $accountId, &$deletedCount, &$failedTemplates) {
            $templates = RentalAgreementTemplate::whereIn('id', $request->ids)
                ->where('account_id', $accountId)
                ->get();

            foreach ($templates as $template) {
                // Do not delete default templates
                if ($template->is_default) {
                    $failedTemplates[] = $template->name . ' (default şablon silinə bilməz)';
                    continue;
                }

                // Check if template is being used
                if ($template->agreements()->count() > 0) {
                    $failedTemplates[] = $template->name . ' (istifadədə olduğu üçün silinə bilməz)';
                    continue;
                }

                $template->delete();
                $deletedCount++;
            }
        });

        if (count($failedTemplates) > 0) {
            $failedList = implode(', ', $failedTemplates);
            $message = $deletedCount > 0
                ? "{$deletedCount} şablon silindi. Bu şablonlar silinə bilmədi: {$failedList}"
                : "Heç bir şablon silinmədi. {$failedList}";

            return redirect()->route('rental-templates.index')
                ->with($deletedCount > 0 ? 'warning' : 'error', $message);
        }

        return redirect()->route('rental-templates.index')
            ->with('success', "{$deletedCount} şablon uğurla silindi");
    }

    /**
     * Get available rental categories.
     */
    private function getRentalCategories(): array
    {
        $accountId = auth()->user()->account_id;

        return \App\Models\RentalCategory::where('account_id', $accountId)
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
            })
            ->toArray();
    }
}
