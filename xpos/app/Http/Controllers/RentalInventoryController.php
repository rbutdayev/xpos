<?php

namespace App\Http\Controllers;

use App\Models\RentalInventory;
use App\Models\Product;
use App\Models\Branch;
use App\Models\ProductStock;
use App\Models\StockMovement;
use App\Models\Warehouse;
use App\Services\RentalService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class RentalInventoryController extends Controller
{
    public function __construct(
        protected RentalService $rentalService
    ) {}

    /**
     * Display a listing of rental inventory
     */
    public function index(Request $request)
    {
        $accountId = auth()->user()->account_id;

        $query = RentalInventory::where('account_id', $accountId)
            ->with(['product', 'branch', 'currentRental']);

        // Filters
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('product_id')) {
            $query->where('product_id', $request->product_id);
        }

        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->filled('rental_category')) {
            $query->where('rental_category', $request->rental_category);
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('inventory_number', 'like', "%{$search}%")
                  ->orWhere('serial_number', 'like', "%{$search}%")
                  ->orWhereHas('product', function ($q) use ($search) {
                      $q->where('name', 'like', "%{$search}%");
                  });
            });
        }

        // Sorting
        $sortBy = $request->get('sort', 'created_at');
        $sortOrder = $request->get('direction', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // Pagination
        $perPage = $request->get('per_page', 15);
        $inventory = $query->paginate($perPage)->withQueryString();

        // Return JSON for API
        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'data' => $inventory->items(),
                'meta' => [
                    'current_page' => $inventory->currentPage(),
                    'last_page' => $inventory->lastPage(),
                    'per_page' => $inventory->perPage(),
                    'total' => $inventory->total(),
                ],
            ]);
        }

        // Return Inertia view for web
        return Inertia::render('RentalInventory/Index', [
            'inventory' => $inventory,
            'filters' => $request->only(['search', 'status', 'rental_category', 'sort', 'direction']),
        ]);
    }

    /**
     * Show the form for creating a new inventory item
     */
    public function create(): InertiaResponse
    {
        $accountId = auth()->user()->account_id;

        // Don't load all products - use search API instead for better performance
        // Products will be loaded dynamically via AJAX when user searches

        $branches = Branch::where('account_id', $accountId)
            ->orderBy('name')
            ->get(['id', 'name']);

        $categories = $this->getRentalCategories();

        return Inertia::render('RentalInventory/Create', [
            'branches' => $branches,
            'categories' => $categories,
        ]);
    }

    /**
     * Store a newly created inventory item
     */
    public function store(Request $request)
    {
        $accountId = auth()->user()->account_id;

        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'branch_id' => 'required|exists:branches,id',
            'barcode' => 'nullable|string|max:255', // Removed unique constraint - multiple items can share same product barcode
            'serial_number' => 'nullable|string|max:255',
            'rental_category' => 'required|string|max:255',
            'daily_rate' => 'nullable|numeric|min:0',
            'weekly_rate' => 'nullable|numeric|min:0',
            'monthly_rate' => 'nullable|numeric|min:0',
            'purchase_price' => 'nullable|numeric|min:0',
            'replacement_cost' => 'nullable|numeric|min:0',
            'condition_notes' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $validated['account_id'] = $accountId;
        $validated['status'] = 'available';
        $validated['is_active'] = true;

        // Auto-copy barcode from product if not provided
        if (empty($validated['barcode'])) {
            $product = Product::find($validated['product_id']);
            if ($product && !empty($product->barcode)) {
                $validated['barcode'] = $product->barcode;
            }
        }

        try {
            // Use transaction to ensure stock deduction and inventory creation happen together
            $inventory = DB::transaction(function () use ($validated, $accountId) {
                // Ensure account_id is set
                $validated['account_id'] = $accountId;
                
                // Check stock availability
                $product = Product::where('account_id', $accountId)->findOrFail($validated['product_id']);
                $totalStock = ProductStock::where('product_id', $product->id)
                    ->where('account_id', $accountId)
                    ->sum('quantity');

                if ($totalStock < 1 && !$product->allow_negative_stock) {
                    throw new \Exception("Məhsul '{$product->name}' üçün kifayət qədər stok yoxdur. Mövcud: {$totalStock}. Kirayə inventarı yaratmaq üçün ən azı 1 ədəd lazımdır.");
                }

                // Find the appropriate warehouse
                $warehouse = $this->findWarehouseForBranch($validated['branch_id'], $accountId);

                if (!$warehouse) {
                    throw new \Exception("Filial üçün anbara giriş tapılmadı. Anbara giriş təyin edin və ya əsas anbar yaradın.");
                }

                // Create the inventory item using createFromProduct to copy product data
                $inventory = RentalInventory::createFromProduct($product, array_merge($validated, [
                    'stock_deducted' => true,
                    'stock_warehouse_id' => $warehouse->id,
                    'status' => 'available', // Ensure status is explicitly set
                    'is_active' => true,     // Ensure item is active
                ]));

                // Deduct stock from warehouse
                $this->deductStockForRentalInventory($product->id, $warehouse->id, $inventory, $accountId);

                return $inventory;
            });

            // Return JSON for API requests
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Inventar elementi uğurla yaradıldı və stokdan çıxarıldı.',
                    'data' => $inventory->load(['product', 'branch', 'stockWarehouse']),
                ], 201);
            }

            // Return redirect for web requests
            return redirect()->route('rental-inventory.index')
                ->with('success', 'İnventar elementi uğurla yaradıldı və stokdan çıxarıldı.');
        } catch (\Exception $e) {
            // For Inertia.js requests (which want JSON), return errors properly
            if ($request->wantsJson() || $request->header('X-Inertia')) {
                // Return validation errors in the format Inertia expects
                return redirect()->back()
                    ->withInput()
                    ->withErrors(['general' => $e->getMessage()]);
            }

            // Return redirect for regular web requests
            return redirect()->back()
                ->withInput()
                ->with('error', $e->getMessage());
        }
    }

    /**
     * Display the specified inventory item
     */
    public function show(Request $request, int $id)
    {
        $accountId = auth()->user()->account_id;

        $inventory = RentalInventory::where('account_id', $accountId)
            ->with(['product', 'branch', 'currentRental', 'rentalItems.rental'])
            ->findOrFail($id);

        // Return JSON for API requests
        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'data' => $inventory,
            ]);
        }

        // Return Inertia view for web requests
        return Inertia::render('RentalInventory/Show', [
            'inventoryItem' => $inventory,
        ]);
    }

    /**
     * Show the form for editing the specified inventory item
     */
    public function edit(int $id): InertiaResponse
    {
        $accountId = auth()->user()->account_id;

        $inventory = RentalInventory::where('account_id', $accountId)
            ->with(['product', 'branch'])
            ->findOrFail($id);

        $products = Product::where('account_id', $accountId)
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'sku']);

        $branches = Branch::where('account_id', $accountId)
            ->orderBy('name')
            ->get(['id', 'name']);

        $categories = $this->getRentalCategories();

        return Inertia::render('RentalInventory/Edit', [
            'inventoryItem' => $inventory,
            'products' => $products,
            'branches' => $branches,
            'categories' => $categories,
        ]);
    }

    /**
     * Update the specified inventory item
     */
    public function update(Request $request, int $id)
    {
        $accountId = auth()->user()->account_id;

        $inventory = RentalInventory::where('account_id', $accountId)->findOrFail($id);

        $validated = $request->validate([
            'barcode' => 'nullable|string|max:255', // Removed unique constraint - multiple items can share same product barcode
            'serial_number' => 'nullable|string|max:255',
            'status' => 'nullable|in:available,rented,maintenance,damaged,retired',
            'is_active' => 'nullable|boolean',
            'daily_rate' => 'nullable|numeric|min:0',
            'weekly_rate' => 'nullable|numeric|min:0',
            'monthly_rate' => 'nullable|numeric|min:0',
            'replacement_cost' => 'nullable|numeric|min:0',
            'condition_notes' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $inventory->update($validated);

        // Return JSON for API requests
        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Inventar elementi uğurla yeniləndi.',
                'data' => $inventory->fresh(['product', 'branch']),
            ]);
        }

        // Return redirect for web requests
        return redirect()->route('rental-inventory.index')
            ->with('success', 'İnventar elementi uğurla yeniləndi.');
    }

    /**
     * Remove the specified inventory item
     * Only admins and account owners can delete inventory
     */
    public function destroy(Request $request, int $id)
    {
        $user = auth()->user();
        $accountId = $user->account_id;

        // Check if user has permission to delete (admin or account owner)
        if (!in_array($user->role, ['admin', 'account_owner'])) {
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Bu əməliyyatı yerinə yetirmək üçün icazəniz yoxdur.',
                ], 403);
            }
            return redirect()->back()->with('error', 'Bu əməliyyatı yerinə yetirmək üçün icazəniz yoxdur.');
        }

        $inventory = RentalInventory::where('account_id', $accountId)->findOrFail($id);

        if ($inventory->isRented()) {
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Hazırda kirayədə olan inventar silinə bilməz.',
                ], 400);
            }
            return redirect()->back()->with('error', 'Hazırda kirayədə olan inventar silinə bilməz.');
        }

        // Use transaction to ensure stock restoration and deletion happen together
        DB::transaction(function () use ($inventory) {
            // Restore stock before deleting (only if it was deducted)
            $this->restoreStockForRentalInventory($inventory);

            // Delete the inventory item
            $inventory->delete();
        });

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Inventar elementi uğurla silindi və stoka qaytarıldı.',
            ]);
        }

        return redirect()->route('rental-inventory.index')
            ->with('success', 'Inventar elementi uğurla silindi və stoka qaytarıldı.');
    }

    /**
     * Bulk delete rental inventory items
     * CRITICAL: Do not allow deletion of items that are currently rented or have active rentals
     */
    public function bulkDelete(Request $request)
    {
        Gate::authorize('delete-account-data');

        $validated = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'required|integer',
        ]);

        $user = auth()->user();
        $accountId = $user->account_id;
        $deletedCount = 0;
        $failedItems = [];

        DB::beginTransaction();

        try {
            $inventoryItems = RentalInventory::whereIn('id', $validated['ids'])
                ->where('account_id', $accountId)
                ->get();

            foreach ($inventoryItems as $item) {
                // CRITICAL: Check if item is currently rented
                if ($item->status === 'rented' || $item->isRented()) {
                    $failedItems[] = $item->inventory_number . ' (hazırda kirayədə)';
                    continue;
                }

                // Check if item has any rental history (active or reserved rentals)
                $hasActiveRentals = \App\Models\RentalItem::where('rental_inventory_id', $item->id)
                    ->whereHas('rental', function ($query) use ($accountId) {
                        $query->where('account_id', $accountId)
                              ->whereIn('status', ['active', 'reserved', 'overdue']);
                    })
                    ->exists();

                if ($hasActiveRentals) {
                    $failedItems[] = $item->inventory_number . ' (aktiv kirayə var)';
                    continue;
                }

                // Use transaction to ensure stock restoration and deletion happen together
                $this->restoreStockForRentalInventory($item);
                $item->delete();
                $deletedCount++;
            }

            DB::commit();

            // Prepare response message
            $message = '';
            if ($deletedCount > 0) {
                $message = "{$deletedCount} inventar elementi uğurla silindi və stoka qaytarıldı.";
            }

            if (!empty($failedItems)) {
                $failedList = implode(', ', $failedItems);
                $failedMessage = "Aşağıdakı elementlər silinə bilmədi: {$failedList}";
                $message = $message ? $message . ' ' . $failedMessage : $failedMessage;
            }

            if ($deletedCount > 0) {
                return redirect()->back()->with('success', $message);
            } else {
                return redirect()->back()->with('error', $message ?: 'Heç bir element silinə bilmədi.');
            }
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Xəta baş verdi: ' . $e->getMessage());
        }
    }

    /**
     * Get available inventory for date range
     */
    public function getAvailable(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'branch_id' => 'nullable|exists:branches,id',
        ]);

        $accountId = auth()->user()->account_id;

        $availableInventory = $this->rentalService->getAvailableInventory(
            $accountId,
            $validated['product_id'],
            $validated['start_date'],
            $validated['end_date'],
            $validated['branch_id'] ?? null
        );

        return response()->json([
            'success' => true,
            'data' => $availableInventory,
            'count' => $availableInventory->count(),
        ]);
    }

    /**
     * Schedule maintenance for inventory item
     */
    public function scheduleMaintenance(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'maintenance_date' => 'required|date',
        ]);

        $accountId = auth()->user()->account_id;

        $inventory = RentalInventory::where('account_id', $accountId)->findOrFail($id);

        $inventory->scheduleMaintenance(new \DateTime($validated['maintenance_date']));

        return response()->json([
            'success' => true,
            'message' => 'Texniki baxış planlaşdırıldı.',
            'data' => $inventory,
        ]);
    }

    /**
     * Complete maintenance for inventory item
     */
    public function completeMaintenance(int $id): JsonResponse
    {
        $accountId = auth()->user()->account_id;

        $inventory = RentalInventory::where('account_id', $accountId)->findOrFail($id);

        $inventory->completeMaintenance();

        return response()->json([
            'success' => true,
            'message' => 'Texniki baxış tamamlandı.',
            'data' => $inventory,
        ]);
    }

    /**
     * Mark inventory as damaged
     */
    public function markAsDamaged(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'notes' => 'nullable|string',
        ]);

        $accountId = auth()->user()->account_id;

        $inventory = RentalInventory::where('account_id', $accountId)->findOrFail($id);

        $inventory->markAsDamaged($validated['notes'] ?? null);

        return response()->json([
            'success' => true,
            'message' => 'Inventar zədəli kimi işarələndi.',
            'data' => $inventory,
        ]);
    }

    /**
     * Get bookings/rentals for a specific inventory item (for calendar view)
     */
    public function getBookings(Request $request, int $id): JsonResponse
    {
        $accountId = auth()->user()->account_id;

        $inventory = RentalInventory::where('account_id', $accountId)->findOrFail($id);

        // Get all rental items for this inventory with their rental details
        // Only show active, reserved, and overdue rentals in calendar
        $bookings = \App\Models\RentalItem::where('rental_inventory_id', $id)
            ->with(['rental.customer', 'rental.branch'])
            ->whereHas('rental', function ($query) use ($accountId) {
                $query->where('account_id', $accountId)
                      ->whereIn('status', ['active', 'reserved', 'overdue']);
            })
            ->get()
            ->map(function ($rentalItem) {
                $rental = $rentalItem->rental;
                return [
                    'id' => $rental->id,
                    'rental_number' => $rental->rental_number,
                    'title' => $rental->customer->name ?? 'Unknown Customer',
                    'start' => $rental->rental_start_date ? $rental->rental_start_date->format('Y-m-d') : null,
                    'end' => $rental->rental_end_date ? $rental->rental_end_date->format('Y-m-d') : null,
                    'customer' => [
                        'id' => $rental->customer->id ?? null,
                        'name' => $rental->customer->name ?? 'Unknown',
                        'phone' => $rental->customer->phone ?? null,
                    ],
                    'status' => $rental->status,
                    'total_amount' => $rental->total_amount ?? 0,
                    'branch_name' => $rental->branch->name ?? null,
                    'backgroundColor' => $this->getStatusColor($rental->status),
                    'borderColor' => $this->getStatusColor($rental->status),
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $bookings,
        ]);
    }

    /**
     * Get all rentals for calendar view (all inventory items)
     */
    public function getAllBookings(Request $request): JsonResponse
    {
        $accountId = auth()->user()->account_id;

        $query = \App\Models\Rental::where('account_id', $accountId)
            ->with(['customer', 'branch', 'items.rentalInventory.product', 'items.product']);

        // Optional filters
        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->filled('rental_category')) {
            $query->whereHas('items.rentalInventory', function ($q) use ($request) {
                $q->where('rental_category', $request->rental_category);
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        } else {
            // By default, only show active, reserved, and overdue rentals in calendar
            $query->whereIn('status', ['active', 'reserved', 'overdue']);
        }

        $rentals = $query->get()->map(function ($rental) {
            // Get all items for this rental (can be inventory items OR regular products)
            $inventoryItems = $rental->items->map(function ($item) {
                // Check if it's a rental inventory item or regular product
                if ($item->rental_inventory_id && $item->rentalInventory) {
                    return [
                        'id' => $item->rentalInventory->id,
                        'number' => $item->rentalInventory->inventory_number,
                        'product' => $item->rentalInventory->product->name ?? 'N/A',
                        'category' => $item->rentalInventory->rental_category ?? null,
                    ];
                } elseif ($item->product_id && $item->product) {
                    return [
                        'id' => $item->product_id,
                        'number' => 'Product #' . $item->product_id,
                        'product' => $item->product->name,
                        'category' => null,
                    ];
                }
                return null;
            })->filter();

            return [
                'id' => $rental->id,
                'rental_number' => $rental->rental_number,
                'title' => ($rental->customer->name ?? 'Unknown') . ' - ' . $inventoryItems->pluck('product')->unique()->implode(', '),
                'start' => $rental->rental_start_date ? $rental->rental_start_date->format('Y-m-d') : null,
                'end' => $rental->rental_end_date ? $rental->rental_end_date->format('Y-m-d') : null,
                'customer' => [
                    'id' => $rental->customer->id ?? null,
                    'name' => $rental->customer->name ?? 'Unknown',
                    'phone' => $rental->customer->phone ?? null,
                ],
                'status' => $rental->status,
                'total_amount' => $rental->total_amount ?? 0,
                'branch_name' => $rental->branch->name ?? null,
                'inventory_items' => $inventoryItems->values()->toArray(),
                'backgroundColor' => $this->getStatusColor($rental->status),
                'borderColor' => $this->getStatusColor($rental->status),
                'textColor' => '#ffffff',
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $rentals,
        ]);
    }

    /**
     * Get color for rental status
     */
    private function getStatusColor(string $status): string
    {
        return match($status) {
            'draft' => '#6B7280',
            'active' => '#10B981',
            'overdue' => '#EF4444',
            'completed' => '#3B82F6',
            'cancelled' => '#6B7280',
            default => '#6B7280',
        };
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

    /**
     * Find appropriate warehouse for a branch
     */
    private function findWarehouseForBranch(int $branchId, int $accountId): ?Warehouse
    {
        $branch = Branch::find($branchId);

        if (!$branch) {
            return null;
        }

        // Get the first warehouse that the branch can modify stock for
        $warehouse = $branch->warehouses()
            ->wherePivot('can_modify_stock', true)
            ->first();

        // If no accessible warehouse with modify permissions, fall back to main warehouse
        if (!$warehouse) {
            $warehouse = Warehouse::where('account_id', $accountId)
                ->where('type', 'main')
                ->first();
        }

        return $warehouse;
    }

    /**
     * Deduct stock from warehouse for rental inventory allocation
     */
    private function deductStockForRentalInventory(int $productId, int $warehouseId, RentalInventory $inventory, int $accountId): void
    {
        // Update product stock
        $productStock = ProductStock::firstOrCreate([
            'product_id' => $productId,
            'warehouse_id' => $warehouseId,
            'account_id' => $accountId,
        ], [
            'quantity' => 0,
            'min_level' => 3,
        ]);

        // Deduct 1 unit (since each rental inventory item represents 1 physical unit)
        $productStock->decrement('quantity', 1);

        // Create stock movement record
        StockMovement::create([
            'account_id' => $accountId,
            'warehouse_id' => $warehouseId,
            'product_id' => $productId,
            'movement_type' => 'rental_allocation',
            'quantity' => -1,
            'reference_type' => 'rental_inventory',
            'reference_id' => $inventory->id,
            'employee_id' => null,
            'notes' => "Kirayə inventarı #{$inventory->inventory_number} üçün stokdan ayırma",
        ]);
    }

    /**
     * Restore stock to warehouse when rental inventory is deleted/retired
     */
    private function restoreStockForRentalInventory(RentalInventory $inventory): void
    {
        // Only restore stock if it was previously deducted and we have warehouse info
        if (!$inventory->stock_deducted || !$inventory->stock_warehouse_id) {
            return;
        }

        $accountId = $inventory->account_id;
        $productId = $inventory->product_id;
        $warehouseId = $inventory->stock_warehouse_id;

        // Update product stock
        $productStock = ProductStock::firstOrCreate([
            'product_id' => $productId,
            'warehouse_id' => $warehouseId,
            'account_id' => $accountId,
        ], [
            'quantity' => 0,
            'min_level' => 3,
        ]);

        // Restore 1 unit back to stock
        $productStock->increment('quantity', 1);

        // Create stock movement record
        StockMovement::create([
            'account_id' => $accountId,
            'warehouse_id' => $warehouseId,
            'product_id' => $productId,
            'movement_type' => 'rental_return_to_stock',
            'quantity' => 1,
            'reference_type' => 'rental_inventory',
            'reference_id' => $inventory->id,
            'employee_id' => null,
            'notes' => "Kirayə inventarı #{$inventory->inventory_number} silindi və stoka qaytarıldı",
        ]);
    }
}
