<?php

namespace App\Http\Controllers;

use App\Models\Rental;
use App\Models\Payment;
use App\Services\RentalService;
use App\Services\RentalPhotoService;
use App\Http\Requests\Rental\StoreRentalRequest;
use App\Http\Requests\Rental\UpdateRentalRequest;
use App\Http\Requests\Rental\ProcessReturnRequest;
use App\Http\Requests\Rental\AddPaymentRequest;
use App\Http\Resources\RentalResource;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class RentalController extends Controller
{
    public function __construct(
        protected RentalService $rentalService,
        protected RentalPhotoService $photoService
    ) {}

    /**
     * Display a listing of rentals
     */
    public function index(Request $request): InertiaResponse|JsonResponse
    {
        $accountId = auth()->user()->account_id;

        $query = Rental::where('account_id', $accountId)
            ->with(['customer', 'branch', 'items.product', 'agreement']);

        // Filters
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('payment_status')) {
            $query->where('payment_status', $request->payment_status);
        }

        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->filled('start_date')) {
            $query->where('rental_start_date', '>=', $request->start_date);
        }

        if ($request->filled('end_date')) {
            $query->where('rental_end_date', '<=', $request->end_date);
        }

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('rental_number', 'like', "%{$search}%")
                  ->orWhereHas('customer', function ($q) use ($search) {
                      $q->where('name', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                  });
            });
        }

        // Sorting
        $sortBy = $request->get('sort', 'created_at');
        $sortOrder = $request->get('direction', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // Pagination
        $perPage = $request->get('per_page', 15);
        $rentals = $query->paginate($perPage)->withQueryString();

        // Return Inertia response for web, JSON for API
        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'data' => RentalResource::collection($rentals),
                'meta' => [
                    'current_page' => $rentals->currentPage(),
                    'last_page' => $rentals->lastPage(),
                    'per_page' => $rentals->perPage(),
                    'total' => $rentals->total(),
                ],
            ]);
        }

        return Inertia::render('Rentals/Index', [
            'rentals' => [
                'data' => RentalResource::collection($rentals->items())->resolve(),
                'links' => $rentals->linkCollection()->toArray(),
                'current_page' => $rentals->currentPage(),
                'last_page' => $rentals->lastPage(),
                'total' => $rentals->total(),
                'per_page' => $rentals->perPage(),
                'from' => $rentals->firstItem(),
                'to' => $rentals->lastItem(),
            ],
            'filters' => $request->only(['search', 'status', 'payment_status', 'sort', 'direction']),
        ]);
    }

    /**
     * Display the rental calendar view
     */
    public function calendar(): InertiaResponse
    {
        $accountId = auth()->user()->account_id;

        // Get branches for filtering
        $branches = \App\Models\Branch::where('account_id', $accountId)
            ->select('id', 'name')
            ->get();

        // Get rental categories for filtering
        $categories = \App\Models\RentalCategory::where('account_id', $accountId)
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

        return Inertia::render('Rentals/Calendar', [
            'branches' => $branches,
            'categories' => $categories,
        ]);
    }

    /**
     * Show the form for creating a new rental
     */
    public function create(): InertiaResponse
    {
        $accountId = auth()->user()->account_id;

        $customers = \App\Models\Customer::where('account_id', $accountId)
            ->select('id', 'name', 'phone', 'email')
            ->orderBy('name')
            ->get();

        $branches = \App\Models\Branch::where('account_id', $accountId)
            ->select('id', 'name')
            ->get();

        // Get all active rental categories
        $categories = \App\Models\RentalCategory::where('account_id', $accountId)
            ->active()
            ->ordered()
            ->get();

        // Get default templates for each active category
        $templates = [];
        foreach ($categories as $category) {
            $template = \App\Models\RentalAgreementTemplate::getDefaultForCategory($accountId, $category->slug);
            if ($template) {
                $templates[$category->slug] = $template;
            }
        }

        // Map categories for frontend
        $categoriesForFrontend = $categories->map(function ($category) {
            return [
                'slug' => $category->slug,
                'name_az' => $category->name_az,
                'name_en' => $category->name_en,
                'description_az' => $category->description_az,
                'description_en' => $category->description_en,
                'color' => $category->color,
            ];
        });

        return Inertia::render('Rentals/Create', [
            'customers' => $customers,
            'branches' => $branches,
            'templates' => $templates,
            'categories' => $categoriesForFrontend,
        ]);
    }

    /**
     * Show the form for editing a rental
     */
    public function edit(int $id): InertiaResponse
    {
        $accountId = auth()->user()->account_id;

        $rental = Rental::where('account_id', $accountId)
            ->with([
                'customer',
                'branch',
                'items.product',
                'items.rentalInventory',
                'agreement'
            ])
            ->findOrFail($id);

        // Only allow editing if rental is reserved, active, or overdue
        if (!in_array($rental->status, ['reserved', 'active', 'overdue'])) {
            return redirect()
                ->route('rentals.show', $id)
                ->with('error', 'Yalnız rezerv edilmiş, aktiv və ya gecikmiş kirayələr redaktə edilə bilər.');
        }

        $customers = \App\Models\Customer::where('account_id', $accountId)
            ->select('id', 'name', 'phone', 'email')
            ->orderBy('name')
            ->get();

        $branches = \App\Models\Branch::where('account_id', $accountId)
            ->select('id', 'name')
            ->get();

        // Get all active rental categories
        $categories = \App\Models\RentalCategory::where('account_id', $accountId)
            ->active()
            ->ordered()
            ->get();

        // Get default templates for each active category
        $templates = [];
        foreach ($categories as $category) {
            $template = \App\Models\RentalAgreementTemplate::getDefaultForCategory($accountId, $category->slug);
            if ($template) {
                $templates[$category->slug] = $template;
            }
        }

        // Map categories for frontend
        $categoriesForFrontend = $categories->map(function ($category) {
            return [
                'slug' => $category->slug,
                'name_az' => $category->name_az,
                'name_en' => $category->name_en,
                'description_az' => $category->description_az,
                'description_en' => $category->description_en,
                'color' => $category->color,
            ];
        });

        return Inertia::render('Rentals/Edit', [
            'rental' => (new RentalResource($rental))->resolve(),
            'customers' => $customers,
            'branches' => $branches,
            'templates' => $templates,
            'categories' => $categoriesForFrontend,
        ]);
    }

    /**
     * Store a newly created rental
     */
    public function store(StoreRentalRequest $request)
    {
        try {
            $data = $request->validated();
            $data['account_id'] = auth()->user()->account_id;
            $data['user_id'] = auth()->id();

            // Upload collateral photo to Azure if provided
            if (isset($data['collateral_photo']) && !empty($data['collateral_photo'])) {
                // First create the rental to get the rental ID (needed for photo path)
                $rental = $this->rentalService->createRental($data);

                $collateralPhotoPath = $this->photoService->uploadCollateralPhoto(
                    $data['account_id'],
                    $rental->id,
                    $data['collateral_photo']
                );

                // Update rental with the actual photo path
                if ($collateralPhotoPath) {
                    $rental->update(['collateral_photo_path' => $collateralPhotoPath]);
                } else {
                    \Log::warning('Collateral photo upload failed for rental', [
                        'rental_id' => $rental->id,
                        'account_id' => $data['account_id'],
                    ]);
                }
            } else {
                $rental = $this->rentalService->createRental($data);
            }

            // Create agreement if provided
            if (isset($data['agreement'])) {
                $agreementData = $data['agreement'];
                $agreementData['staff_user_id'] = auth()->id();

                // Create the agreement using RentalAgreementService
                $agreementService = app(\App\Services\RentalAgreementService::class);
                $agreement = $agreementService->createAgreement($rental, $agreementData);

                // Upload condition photos to Azure if provided
                if (isset($agreementData['condition_photos']) && is_array($agreementData['condition_photos']) && count($agreementData['condition_photos']) > 0) {
                    $uploadedPhotos = $this->photoService->uploadConditionPhotos($agreement, $agreementData['condition_photos']);
                    $agreement->update(['condition_photos' => $uploadedPhotos]);
                }

                // Upload customer signature to Azure if provided
                if (isset($agreementData['customer_signature']) && !empty($agreementData['customer_signature'])) {
                    $signaturePath = $this->photoService->uploadSignature($agreement, $agreementData['customer_signature'], 'customer');

                    // Only sign if upload was successful
                    if ($signaturePath) {
                        // Sign by customer
                        $agreementService->signByCustomer($agreement, [
                            'signature' => $signaturePath,
                            'ip' => $request->ip(),
                            'user_agent' => $request->userAgent(),
                        ]);
                    } else {
                        throw new \Exception('Müştəri imzasının yüklənməsi uğursuz oldu.');
                    }
                }

                // Auto-confirm by staff (since staff is creating the rental)
                $agreementService->signByStaff($agreement, auth()->id(), 'auto-confirmed');

                // Generate PDF after agreement is fully signed
                try {
                    $pdfPath = $agreementService->generatePdf($agreement->fresh());
                    \Log::info('Rental agreement PDF generated', [
                        'agreement_id' => $agreement->id,
                        'rental_id' => $rental->id,
                        'pdf_path' => $pdfPath,
                    ]);
                } catch (\Exception $e) {
                    \Log::error('Failed to generate rental agreement PDF', [
                        'agreement_id' => $agreement->id,
                        'rental_id' => $rental->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            return redirect()
                ->route('rentals.index')
                ->with('success', 'Kirayə uğurla yaradıldı. Kirayə nömrəsi: ' . $rental->rental_number);
        } catch (\Exception $e) {
            return redirect()
                ->back()
                ->withInput()
                ->with('error', 'Kirayə yaradılarkən xəta baş verdi: ' . $e->getMessage());
        }
    }

    /**
     * Display the specified rental
     */
    public function show(Request $request, int $id): InertiaResponse|JsonResponse
    {
        $accountId = auth()->user()->account_id;

        $rental = Rental::where('account_id', $accountId)
            ->with([
                'customer',
                'branch',
                'user',
                'items.product',
                'items.rentalInventory',
                'agreement',
                'payments'
            ])
            ->findOrFail($id);

        // Return JSON for API
        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'data' => new RentalResource($rental),
            ]);
        }

        // Get photo and signature URLs if agreement exists
        $agreementPhotos = [];
        $customerSignatureUrl = null;
        $staffSignatureUrl = null;

        if ($rental->agreement) {
            // Get condition photo URLs
            if ($rental->agreement->condition_photos && is_array($rental->agreement->condition_photos)) {
                $agreementPhotos = array_filter(array_map(function ($path) {
                    return $this->photoService->getPhotoUrl($path);
                }, $rental->agreement->condition_photos));
            }

            // Get customer signature URL
            if ($rental->agreement->customer_signature) {
                $customerSignatureUrl = $this->photoService->getPhotoUrl($rental->agreement->customer_signature);
            }

            // Get staff signature URL if exists
            if ($rental->agreement->staff_signature) {
                $staffSignatureUrl = $this->photoService->getPhotoUrl($rental->agreement->staff_signature);
            }
        }

        // Return Inertia view for web
        return Inertia::render('Rentals/Show', [
            'rental' => (new RentalResource($rental))->resolve(),
            'agreementPhotos' => $agreementPhotos,
            'customerSignatureUrl' => $customerSignatureUrl,
            'staffSignatureUrl' => $staffSignatureUrl,
        ]);
    }

    /**
     * Update the specified rental
     */
    public function update(UpdateRentalRequest $request, int $id)
    {
        $accountId = auth()->user()->account_id;

        $rental = Rental::where('account_id', $accountId)->findOrFail($id);

        try {
            $data = $request->validated();
            $data['account_id'] = $accountId;

            // Update rental using service
            $rental = $this->rentalService->updateRental($rental, $data);

            // For Inertia requests, redirect to show page
            if (!$request->wantsJson()) {
                return redirect()
                    ->route('rentals.show', $rental->id)
                    ->with('success', 'Kirayə uğurla yeniləndi.');
            }

            // For API requests, return JSON
            return response()->json([
                'success' => true,
                'message' => 'Kirayə uğurla yeniləndi.',
                'data' => new RentalResource($rental->fresh(['customer', 'branch', 'items'])),
            ]);
        } catch (\Exception $e) {
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Kirayə yenilənərkən xəta baş verdi: ' . $e->getMessage(),
                ], 400);
            }

            return redirect()
                ->back()
                ->withInput()
                ->with('error', 'Kirayə yenilənərkən xəta baş verdi: ' . $e->getMessage());
        }
    }

    /**
     * Remove the specified rental
     */
    public function destroy(Request $request, int $id)
    {
        $accountId = auth()->user()->account_id;

        $rental = Rental::where('account_id', $accountId)->findOrFail($id);

        if (!$rental->isCancelled()) {
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Yalnız ləğv edilmiş kirayələr silinə bilər.',
                ], 400);
            }

            return redirect()
                ->back()
                ->with('error', 'Yalnız ləğv edilmiş kirayələr silinə bilər.');
        }

        $rental->delete();

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Kirayə uğurla silindi.',
            ]);
        }

        return redirect()
            ->route('rentals.index')
            ->with('success', 'Kirayə uğurla silindi.');
    }

    /**
     * Show the return page for a rental
     */
    public function showReturnPage(int $id): InertiaResponse
    {
        $accountId = auth()->user()->account_id;

        $rental = Rental::where('account_id', $accountId)
            ->with([
                'customer',
                'branch',
                'user',
                'items.product',
                'items.rentalInventory',
                'agreement.template',
                'payments'
            ])
            ->findOrFail($id);

        // Check if rental can be returned
        if ($rental->isReturned()) {
            return redirect()
                ->route('rentals.show', $id)
                ->with('error', 'Bu kirayə artıq qaytarılıb.');
        }

        if ($rental->isCancelled()) {
            return redirect()
                ->route('rentals.show', $id)
                ->with('error', 'Ləğv edilmiş kirayə qaytarıla bilməz.');
        }

        // Get the rental category from agreement to ensure correct condition checklist is used
        $rentalCategory = $rental->agreement?->rental_category ?? 'general';

        // Get the checklist DEFINITION from the template (not the values from agreement)
        $conditionChecklist = [];

        if ($rental->agreement && $rental->agreement->template) {
            // Get from the associated template
            $conditionChecklist = $rental->agreement->template->condition_checklist ?? [];
        } else {
            // Fallback: Get the default template for this category
            $defaultTemplate = \App\Models\RentalAgreementTemplate::getDefaultForCategory(
                auth()->user()->account_id,
                $rentalCategory
            );

            if ($defaultTemplate) {
                $conditionChecklist = $defaultTemplate->condition_checklist ?? [];
            }
        }

        // Ensure it's always an array
        if (!is_array($conditionChecklist)) {
            $conditionChecklist = [];
        }

        return Inertia::render('Rentals/Return', [
            'rental' => (new RentalResource($rental))->resolve(),
            'rentalCategory' => $rentalCategory,
            'conditionChecklist' => $conditionChecklist,
        ]);
    }

    /**
     * Process rental return
     */
    public function processReturn(ProcessReturnRequest $request, int $id)
    {
        $accountId = auth()->user()->account_id;

        $rental = Rental::where('account_id', $accountId)->findOrFail($id);

        try {
            $rental = $this->rentalService->processReturn($rental, $request->validated());

            // For API requests, return JSON
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Kirayə qaytarılması uğurla işləndi.',
                    'data' => new RentalResource($rental),
                ]);
            }

            // For Inertia requests, redirect with success message
            return redirect()
                ->route('rentals.show', $rental->id)
                ->with('success', 'Kirayə uğurla qaytarıldı.');
        } catch (\Exception $e) {
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Qaytarma zamanı xəta baş verdi: ' . $e->getMessage(),
                ], 400);
            }

            return redirect()
                ->back()
                ->with('error', 'Qaytarma zamanı xəta baş verdi: ' . $e->getMessage());
        }
    }

    /**
     * Extend rental period
     */
    public function extend(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'new_end_date' => 'required|date|after:' . now()->toDateString(),
        ]);

        $accountId = auth()->user()->account_id;

        $rental = Rental::where('account_id', $accountId)->findOrFail($id);

        try {
            $rental = $this->rentalService->extendRental($rental, $request->all());

            return response()->json([
                'success' => true,
                'message' => 'Kirayə müddəti uğurla uzadıldı.',
                'data' => new RentalResource($rental),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Uzatma zamanı xəta baş verdi: ' . $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Cancel rental
     */
    public function cancel(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'reason' => 'nullable|string',
        ]);

        $accountId = auth()->user()->account_id;

        $rental = Rental::where('account_id', $accountId)->findOrFail($id);

        try {
            $rental = $this->rentalService->cancelRental($rental, $request->reason);

            return response()->json([
                'success' => true,
                'message' => 'Kirayə uğurla ləğv edildi.',
                'data' => new RentalResource($rental),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Ləğv etmə zamanı xəta baş verdi: ' . $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Get rentals due today
     */
    public function dueToday(): JsonResponse
    {
        $accountId = auth()->user()->account_id;

        $rentals = Rental::where('account_id', $accountId)
            ->dueToday()
            ->with(['customer', 'branch', 'items'])
            ->get();

        return response()->json([
            'success' => true,
            'data' => RentalResource::collection($rentals),
            'count' => $rentals->count(),
        ]);
    }

    /**
     * Get overdue rentals
     */
    public function overdue(): JsonResponse
    {
        $accountId = auth()->user()->account_id;

        $rentals = Rental::where('account_id', $accountId)
            ->overdue()
            ->with(['customer', 'branch', 'items'])
            ->get();

        return response()->json([
            'success' => true,
            'data' => RentalResource::collection($rentals),
            'count' => $rentals->count(),
        ]);
    }

    /**
     * Check and update overdue rentals
     */
    public function checkOverdue(): JsonResponse
    {
        $accountId = auth()->user()->account_id;

        $count = $this->rentalService->checkOverdueRentals($accountId);

        return response()->json([
            'success' => true,
            'message' => "{$count} kirayə gecikmiş kimi işarələndi.",
            'count' => $count,
        ]);
    }

    /**
     * Get rental statistics
     */
    public function statistics(): JsonResponse
    {
        $accountId = auth()->user()->account_id;

        $stats = [
            'total' => Rental::where('account_id', $accountId)->count(),
            'active' => Rental::where('account_id', $accountId)->active()->count(),
            'reserved' => Rental::where('account_id', $accountId)->reserved()->count(),
            'overdue' => Rental::where('account_id', $accountId)->overdue()->count(),
            'returned' => Rental::where('account_id', $accountId)->returned()->count(),
            'due_today' => Rental::where('account_id', $accountId)->dueToday()->count(),
            'total_revenue' => Rental::where('account_id', $accountId)
                ->whereIn('status', ['returned', 'active'])
                ->sum('total_cost'),
            'unpaid_amount' => Rental::where('account_id', $accountId)
                ->whereIn('status', ['reserved', 'active', 'overdue'])
                ->sum('credit_amount'),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    /**
     * Get default checklist for category
     */
    public function getDefaultChecklist(Request $request, string $category): JsonResponse
    {
        $agreementService = app(\App\Services\RentalAgreementService::class);
        $checklist = $agreementService->getDefaultChecklistForCategory($category);

        return response()->json([
            'success' => true,
            'data' => [
                'category' => $category,
                'checklist' => $checklist,
            ],
        ]);
    }

    /**
     * Search for rental inventory items by barcode, inventory number, or product name
     */
    public function searchByBarcode(Request $request): JsonResponse
    {
        try {
            $accountId = auth()->user()->account_id;

            $request->validate([
                'barcode' => 'nullable|string',
                'query' => 'nullable|string',
                'branch_id' => [
                    'required',
                    'exists:branches,id,account_id,' . $accountId
                ],
            ]);

            $searchTerm = $request->input('barcode') ?? $request->input('query');
            $branchId = $request->input('branch_id');

            // Return empty if no search term
            if (empty($searchTerm)) {
                return response()->json([
                    'success' => true,
                    'data' => ['inventory_items' => []],
                    'found' => false,
                ]);
            }

            $results = [
                'inventory_items' => [],
            ];

            // Search in RentalInventory by:
            // - Rental inventory barcode (exact or partial)
            // - Inventory number (partial) - e.g., "INV2025110001"
            // - Product name (partial)
            // - Product SKU (partial)
            // - Product barcode (exact or partial)
            $inventoryItems = \App\Models\RentalInventory::where('account_id', $accountId)
                ->where('branch_id', $branchId)
                ->where('is_active', true)
                ->where(function($query) use ($searchTerm) {
                    // Search by rental inventory barcode
                    $query->where('barcode', 'LIKE', "%{$searchTerm}%")
                          // Search by inventory number (INV...)
                          ->orWhere('inventory_number', 'LIKE', "%{$searchTerm}%")
                          // Search by product name, SKU, or product barcode
                          ->orWhereHas('product', function($q) use ($searchTerm) {
                              $q->where('name', 'LIKE', "%{$searchTerm}%")
                                ->orWhere('sku', 'LIKE', "%{$searchTerm}%")
                                ->orWhere('barcode', 'LIKE', "%{$searchTerm}%");
                          });
                })
                ->with(['product'])
                ->limit(20) // Limit results for performance
                ->get();

            if ($inventoryItems->count() > 0) {
                $results['inventory_items'] = $inventoryItems->map(function ($item) {
                    // Safety check for product relationship
                    if (!$item->product) {
                        return null;
                    }

                    return [
                        'id' => $item->id,
                        'inventory_number' => $item->inventory_number,
                        'barcode' => $item->barcode,
                        'product_id' => $item->product_id,
                        'product_name' => $item->product->name,
                        'product_sku' => $item->product->sku ?? '',
                        'status' => $item->status,
                        'daily_rate' => $item->daily_rate,
                        'weekly_rate' => $item->weekly_rate,
                        'monthly_rate' => $item->monthly_rate,
                        'is_available' => $item->isAvailable(),
                        'type' => 'inventory',
                    ];
                })->filter()->values()->toArray(); // Remove null values
            }

            return response()->json([
                'success' => true,
                'data' => $results,
                'found' => count($results['inventory_items']) > 0,
            ]);
        } catch (\Exception $e) {
            \Log::error('Rental inventory search error', [
                'error' => $e->getMessage(),
                'query' => $request->all(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Axtarışda xəta baş verdi: ' . $e->getMessage(),
                'data' => ['inventory_items' => []],
                'found' => false,
            ], 500);
        }
    }

    /**
     * Check availability for rental inventory item or product
     */
    public function checkAvailability(Request $request): JsonResponse
    {
        $request->validate([
            'rental_inventory_id' => 'nullable|exists:rental_inventory,id',
            'product_id' => 'nullable|exists:products,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'branch_id' => 'required|exists:branches,id',
        ]);

        $accountId = auth()->user()->account_id;
        $startDate = new \DateTime($request->start_date);
        $endDate = new \DateTime($request->end_date);

        $availability = [
            'is_available' => false,
            'bookings' => [],
            'available_quantity' => 0,
            'message' => '',
        ];

        // Check rental inventory item availability
        if ($request->filled('rental_inventory_id')) {
            // CRITICAL: Always ensure account isolation
            $inventoryItem = \App\Models\RentalInventory::where('account_id', $accountId)
                ->where('id', $request->rental_inventory_id)
                ->first();

            if (!$inventoryItem) {
                $availability['is_available'] = false;
                $availability['current_status'] = 'not_found';
                $availability['message'] = 'İnventar elementi tapılmadı və ya sizin hesabınıza aid deyil.';
            } else {
                // Verify account_id matches (extra security check)
                if ($inventoryItem->account_id !== $accountId) {
                    $availability['is_available'] = false;
                    $availability['current_status'] = 'access_denied';
                    $availability['message'] = 'İnventar elementi başqa hesaba aiddir.';
                } else {
                    // Use centralized availability check with detailed status
                    $availabilityStatus = $inventoryItem->getAvailabilityStatus($startDate, $endDate);
                    $availability['is_available'] = $availabilityStatus['is_available'];
                    $availability['current_status'] = $availabilityStatus['current_status'];
                    $availability['message'] = $availabilityStatus['message'];

                    // Get all bookings for this inventory item (with account isolation)
                    $bookings = \App\Models\Rental::where('account_id', $accountId)
                        ->whereHas('items', function($query) use ($request, $accountId) {
                            $query->where('account_id', $accountId) // Ensure rental_items are also account-scoped
                                  ->where('rental_inventory_id', $request->rental_inventory_id);
                        })
                        ->whereIn('status', ['reserved', 'active', 'overdue'])
                        ->with(['customer', 'items'])
                        ->orderBy('rental_start_date')
                        ->get()
                        ->map(function($rental) {
                            return [
                                'rental_id' => $rental->id,
                                'rental_number' => $rental->rental_number,
                                'customer_name' => $rental->customer->name,
                                'start_date' => $rental->rental_start_date->format('Y-m-d'),
                                'end_date' => $rental->rental_end_date->format('Y-m-d'),
                                'status' => $rental->status,
                            ];
                        });

                    $availability['bookings'] = $bookings;
                    $availability['available_quantity'] = $availability['is_available'] ? 1 : 0;
                }
            }
        }

        // Check product availability
        if ($request->filled('product_id')) {
            // CRITICAL: Always ensure account isolation
            $product = \App\Models\Product::where('account_id', $accountId)
                ->where('id', $request->product_id)
                ->with(['stocks' => function ($query) use ($request, $accountId) {
                    $query->where('account_id', $accountId) // Ensure stocks are account-scoped
                          ->whereHas('warehouse.branches', function ($q) use ($request, $accountId) {
                              $q->where('branches.id', $request->branch_id)
                                ->where('branches.account_id', $accountId); // Ensure branches are account-scoped
                          });
                }])
                ->first();

            if (!$product) {
                $availability['is_available'] = false;
                $availability['current_status'] = 'not_found';
                $availability['message'] = 'Məhsul tapılmadı və ya sizin hesabınıza aid deyil.';
            } else {
                // Verify account_id matches (extra security check)
                if ($product->account_id !== $accountId) {
                    $availability['is_available'] = false;
                    $availability['current_status'] = 'access_denied';
                    $availability['message'] = 'Məhsul başqa hesaba aiddir.';
                } else {
                    $totalStock = $product->stocks->sum('quantity');

                    // Count how many of this product are currently rented for the date range (with account isolation)
                    $rentedQuantity = \App\Models\RentalItem::where('account_id', $accountId) // Ensure rental_items are account-scoped
                        ->whereHas('rental', function($query) use ($accountId, $startDate, $endDate) {
                                $query->where('account_id', $accountId)
                                      ->whereIn('status', ['reserved', 'active', 'overdue'])
                                      ->where(function($q) use ($startDate, $endDate) {
                                          $q->whereBetween('rental_start_date', [$startDate, $endDate])
                                            ->orWhereBetween('rental_end_date', [$startDate, $endDate])
                                            ->orWhere(function($subQ) use ($startDate, $endDate) {
                                                $subQ->where('rental_start_date', '<=', $startDate)
                                                     ->where('rental_end_date', '>=', $endDate);
                                            });
                                      });
                            })
                            ->where('product_id', $request->product_id)
                            ->whereNull('rental_inventory_id') // Only count product rentals, not inventory rentals
                            ->sum('quantity');

                    $availableQuantity = $totalStock - $rentedQuantity;
                    $isAvailable = $availableQuantity > 0 || $product->allow_negative_stock;

                    // Get all bookings for this product (with account isolation)
                    $bookings = \App\Models\Rental::where('account_id', $accountId)
                        ->whereHas('items', function($query) use ($request, $accountId) {
                            $query->where('account_id', $accountId) // Ensure rental_items are account-scoped
                                  ->where('product_id', $request->product_id)
                                  ->whereNull('rental_inventory_id');
                        })
                        ->whereIn('status', ['reserved', 'active', 'overdue'])
                        ->with(['customer', 'items' => function($query) use ($request, $accountId) {
                            $query->where('account_id', $accountId)
                                  ->where('product_id', $request->product_id);
                        }])
                        ->orderBy('rental_start_date')
                        ->get()
                        ->map(function($rental) {
                            $quantity = $rental->items->sum('quantity');
                            return [
                                'rental_id' => $rental->id,
                                'rental_number' => $rental->rental_number,
                                'customer_name' => $rental->customer->name,
                                'start_date' => $rental->rental_start_date->format('Y-m-d'),
                                'end_date' => $rental->rental_end_date->format('Y-m-d'),
                                'quantity' => $quantity,
                                'status' => $rental->status,
                            ];
                        });

                    $availability['is_available'] = $isAvailable;
                    $availability['bookings'] = $bookings;
                    $availability['available_quantity'] = max(0, $availableQuantity);
                    $availability['total_stock'] = $totalStock;
                    $availability['rented_quantity'] = $rentedQuantity;
                    $availability['allow_negative_stock'] = $product->allow_negative_stock;
                    $availability['message'] = $isAvailable
                        ? "Məhsul seçilmiş tarixlər üçün mövcuddur. Mövcud miqdar: {$availableQuantity}"
                        : 'Məhsul seçilmiş tarixlər üçün kifayət qədər stokda yoxdur.';
                }
            }
        }

        return response()->json([
            'success' => true,
            'data' => $availability,
        ]);
    }

    /**
     * Add payment to rental
     */
    public function addPayment(AddPaymentRequest $request, int $id)
    {
        $accountId = auth()->user()->account_id;

        $rental = Rental::where('account_id', $accountId)->findOrFail($id);

        try {
            $data = $request->validated();

            // Map payment method to Azeri
            $paymentMethodAz = match($data['method']) {
                'cash' => 'nağd',
                'card' => 'kart',
                'transfer' => 'köçürmə',
                default => 'nağd'
            };

            // Create payment record
            $payment = Payment::create([
                'rental_id' => $rental->id,
                'method' => $paymentMethodAz,
                'amount' => $data['amount'],
                'notes' => $data['notes'] ?? 'Əlavə ödəniş',
            ]);

            // Update rental paid_amount and credit_amount
            $rental->paid_amount += $data['amount'];
            $rental->credit_amount = max(0, $rental->total_cost - $rental->paid_amount);

            // Update payment status
            if ($rental->credit_amount == 0) {
                $rental->payment_status = 'paid';
            } elseif ($rental->paid_amount > 0) {
                $rental->payment_status = 'partial';
            }

            $rental->save();

            // For API requests, return JSON
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Ödəniş uğurla əlavə edildi.',
                    'data' => new RentalResource($rental->fresh(['customer', 'branch', 'payments'])),
                ]);
            }

            // For Inertia requests, redirect with success message
            return redirect()
                ->route('rentals.show', $rental->id)
                ->with('success', 'Ödəniş uğurla əlavə edildi. Yeni balans: ₼' . number_format($rental->credit_amount, 2));
        } catch (\Exception $e) {
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ödəniş əlavə edilərkən xəta baş verdi: ' . $e->getMessage(),
                ], 400);
            }

            return redirect()
                ->back()
                ->with('error', 'Ödəniş əlavə edilərkən xəta baş verdi: ' . $e->getMessage());
        }
    }

    /**
     * Download rental agreement PDF
     */
    public function downloadAgreementPdf(int $id)
    {
        $accountId = auth()->user()->account_id;

        $rental = Rental::where('account_id', $accountId)
            ->with(['agreement'])
            ->findOrFail($id);

        if (!$rental->agreement) {
            abort(404, 'Müqavilə tapılmadı');
        }

        $agreement = $rental->agreement;

        // If PDF doesn't exist, generate it
        if (!$agreement->hasPdf()) {
            $agreementService = app(\App\Services\RentalAgreementService::class);
            try {
                $agreementService->generatePdf($agreement);
            } catch (\Exception $e) {
                \Log::error('Failed to generate PDF on download', [
                    'rental_id' => $id,
                    'error' => $e->getMessage(),
                ]);
                abort(500, 'PDF yaradıla bilmədi');
            }
        }

        // Get PDF from Azure
        try {
            $pdfContent = Storage::disk('documents')->get($agreement->pdf_path);
            $fileName = "muqavile_{$rental->rental_number}.pdf";

            return response($pdfContent, 200)
                ->header('Content-Type', 'application/pdf')
                ->header('Content-Disposition', "attachment; filename=\"{$fileName}\"");
        } catch (\Exception $e) {
            \Log::error('Failed to download PDF from Azure', [
                'rental_id' => $id,
                'pdf_path' => $agreement->pdf_path,
                'error' => $e->getMessage(),
            ]);
            abort(500, 'PDF yüklənə bilmədi');
        }
    }
}
