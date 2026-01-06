<?php

namespace App\Http\Controllers;

use App\Models\TailorService;
use App\Models\TailorServiceItem;
use App\Models\Customer;
use App\Models\CustomerItem;
use App\Models\Product;
use App\Models\Branch;
use App\Models\User;
use App\Models\ProductStock;
use App\Models\ReceiptTemplate;
use App\Services\ThermalPrintService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class TailorServiceController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
        $this->middleware('account.access');
        $this->middleware('branch.access');
    }

    public function index(Request $request, $serviceType = 'tailor')
    {
        Gate::authorize('access-account-data');

        // Validate and convert service type
        $validTypes = ['tailor', 'phone-repair', 'electronics', 'general'];
        if (!in_array($serviceType, $validTypes)) {
            abort(404, 'Invalid service type');
        }

        // Convert to snake_case for database
        $dbServiceType = str_replace('-', '_', $serviceType);

        $query = TailorService::with(['customer', 'customerItem', 'employee', 'branch'])
            ->where('account_id', Auth::user()->account_id)
            ->ofType($dbServiceType);

        // Search
        if ($request->filled('search')) {
            $query->search($request->search);
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->byStatus($request->status);
        }

        // Filter by date range
        if ($request->filled('date_from') && $request->filled('date_to')) {
            $query->whereBetween('received_date', [$request->date_from, $request->date_to]);
        }

        // Filter by branch
        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        $services = $query->latest('created_at')
            ->paginate(15)
            ->withQueryString();

        $branches = Branch::where('account_id', Auth::user()->account_id)
            ->orderBy('name')
            ->get(['id', 'name']);

        // Get payment statistics
        $stats = [
            'total_credit' => TailorService::where('account_id', Auth::user()->account_id)
                ->where('payment_status', 'credit')
                ->count(),
            'total_credit_amount' => TailorService::where('account_id', Auth::user()->account_id)
                ->where('payment_status', 'credit')
                ->sum('credit_amount'),
            'total_partial' => TailorService::where('account_id', Auth::user()->account_id)
                ->where('payment_status', 'partial')
                ->count(),
            'total_partial_amount' => TailorService::where('account_id', Auth::user()->account_id)
                ->where('payment_status', 'partial')
                ->sum('credit_amount'),
        ];

        return Inertia::render('TailorServices/Index', [
            'services' => $services,
            'filters' => $request->only(['search', 'status', 'date_from', 'date_to', 'branch_id']),
            'branches' => $branches,
            'stats' => $stats,
            'serviceType' => $serviceType,
        ]);
    }

    public function create($serviceType = 'tailor')
    {
        Gate::authorize('create-account-data');

        // Validate service type
        $validTypes = ['tailor', 'phone-repair', 'electronics', 'general'];
        if (!in_array($serviceType, $validTypes)) {
            abort(404, 'Invalid service type');
        }

        // Convert route param to service_type (phone-repair -> phone_repair)
        $serviceTypeForFilter = str_replace('-', '_', $serviceType);

        $customers = Customer::where('account_id', Auth::user()->account_id)
            ->active()
            ->orderBy('name')
            ->get(['id', 'name', 'phone']);

        $customerItems = CustomerItem::whereHas('customer', function($q) {
                $q->where('account_id', Auth::user()->account_id);
            })
            ->where('is_active', true)
            ->availableForService()
            ->byServiceType($serviceTypeForFilter)  // Filter customer items by service type
            ->with('customer')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'customer_id' => $item->customer_id,
                    'display_name' => $item->display_name,
                    'description' => $item->description,
                ];
            });

        $employees = User::where('account_id', Auth::user()->account_id)
            ->where('status', 'active')
            ->whereIn('role', ['account_owner', 'admin', 'branch_manager', 'tailor'])
            ->orderBy('name')
            ->get(['id', 'name', 'position', 'role']);

        $products = Product::where('account_id', Auth::user()->account_id)
            ->where('is_active', true)
            ->byServiceType($serviceTypeForFilter)  // Filter products by service type
            ->orderBy('name')
            ->get(['id', 'name', 'sku', 'sale_price', 'type']);

        $branches = Branch::where('account_id', Auth::user()->account_id)
            ->select('id', 'name')
            ->get();

        return Inertia::render('TailorServices/Create', [
            'customers' => $customers,
            'customerItems' => $customerItems,
            'employees' => $employees,
            'products' => $products,
            'branches' => $branches,
            'serviceType' => $serviceType,
        ]);
    }

    public function store(Request $request, $serviceType = 'tailor')
    {
        Gate::authorize('create-account-data');

        // Validate and convert service type
        $validTypes = ['tailor', 'phone-repair', 'electronics', 'general'];
        if (!in_array($serviceType, $validTypes)) {
            abort(404, 'Invalid service type');
        }

        // Convert to snake_case for database
        $dbServiceType = str_replace('-', '_', $serviceType);

        // Convert empty strings to null for optional fields
        $request->merge([
            'customer_item_id' => $request->input('customer_item_id') ?: null,
            'employee_id' => $request->input('employee_id') ?: null,
            'promised_date' => $request->input('promised_date') ?: null,
            'credit_due_date' => $request->input('credit_due_date') ?: null,
            'notes' => $request->input('notes') ?: null,
            'item_condition' => $request->input('item_condition') ?: null,
        ]);

        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'customer_item_id' => 'nullable|exists:customer_items,id',
            'employee_id' => 'nullable|exists:users,id',
            'branch_id' => 'required|exists:branches,id',
            'description' => 'required|string|max:1000',
            'item_condition' => 'nullable|string|max:500',
            'labor_cost' => 'required|numeric|min:0',
            'received_date' => 'required|date',
            'promised_date' => 'nullable|date|after_or_equal:received_date',
            'notes' => 'nullable|string|max:1000',
            'items' => 'nullable|array',
            'items.*.item_type' => 'required|in:product,service',
            'items.*.product_id' => 'nullable|exists:products,id',
            'items.*.item_name' => 'required|string|max:255',
            'items.*.quantity' => 'required|numeric|min:0.001',
            'items.*.unit_price' => 'required|numeric|min:0',
            // Payment fields
            'payment_status' => 'required|in:paid,credit,partial',
            'paid_amount' => 'nullable|numeric|min:0',
            'credit_amount' => 'nullable|numeric|min:0',
            'credit_due_date' => 'nullable|date',
        ]);

        // Verify all relations belong to user's account
        $customer = Customer::findOrFail($validated['customer_id']);
        if ($customer->account_id !== Auth::user()->account_id) {
            abort(403);
        }

        $branch = Branch::findOrFail($validated['branch_id']);
        if ($branch->account_id !== Auth::user()->account_id) {
            abort(403);
        }

        try {
            DB::transaction(function () use ($validated, $dbServiceType) {
                $items = $validated['items'] ?? [];
                unset($validated['items']);

                $validated['account_id'] = Auth::user()->account_id;
                $validated['service_type'] = $dbServiceType;
                $validated['materials_cost'] = 0;
                $validated['status'] = 'received';

                // Handle payment status logic
                $paymentStatus = $validated['payment_status'];
                $paidAmount = $validated['paid_amount'] ?? 0;
                $creditAmount = $validated['credit_amount'] ?? 0;

                // Auto-calculate amounts based on payment status
                $totalCost = $validated['labor_cost'];
                foreach ($items as $item) {
                    $totalCost += $item['quantity'] * $item['unit_price'];
                }

                if ($paymentStatus === 'paid') {
                    $paidAmount = $totalCost;
                    $creditAmount = 0;
                } elseif ($paymentStatus === 'credit') {
                    $paidAmount = 0;
                    $creditAmount = $totalCost;
                } elseif ($paymentStatus === 'partial') {
                    // Ensure paid + credit = total
                    if ($paidAmount + $creditAmount != $totalCost) {
                        $creditAmount = $totalCost - $paidAmount;
                    }
                }

                $validated['paid_amount'] = $paidAmount;
                $validated['credit_amount'] = $creditAmount;

                $service = TailorService::create($validated);

                // Add items
                foreach ($items as $item) {
                    $itemData = [
                        'tailor_service_id' => $service->id,
                        'item_type' => $item['item_type'],
                        'product_id' => $item['product_id'] ?? null,
                        'item_name' => $item['item_name'],
                        'quantity' => $item['quantity'],
                        'unit_price' => $item['unit_price'],
                    ];

                    TailorServiceItem::create($itemData);

                    // Deduct stock for products
                    if ($item['item_type'] === 'product' && !empty($item['product_id'])) {
                        $this->deductStock($item['product_id'], $item['quantity'], $service);
                    }
                }

                // Update customer item status
                if ($service->customer_item_id) {
                    CustomerItem::where('id', $service->customer_item_id)
                        ->update(['status' => 'in_service']);
                }
            });

            return redirect()->route('services.index', ['serviceType' => $serviceType])
                ->with('success', 'Xidmət qeydi uğurla yaradıldı.');
        } catch (\Exception $e) {
            \Log::error('Tailor service creation failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'data' => $request->all()
            ]);
            return back()->withErrors(['error' => $e->getMessage()])->withInput();
        }
    }

    public function show($serviceType, TailorService $tailorService)
    {
        Gate::authorize('access-account-data');

        if ($tailorService->account_id !== Auth::user()->account_id) {
            abort(403);
        }

        $tailorService->load([
            'customer',
            'customerItem',
            'employee',
            'branch',
            'items.product',
            'creator'
        ]);

        return Inertia::render('TailorServices/Show', [
            'service' => $tailorService,
            'serviceType' => $serviceType,
        ]);
    }

    public function edit($serviceType, TailorService $tailorService)
    {
        Gate::authorize('edit-account-data');

        if ($tailorService->account_id !== Auth::user()->account_id) {
            abort(403);
        }

        // Convert route param to service_type (phone-repair -> phone_repair)
        $serviceTypeForFilter = str_replace('-', '_', $serviceType);

        $tailorService->load(['items.product', 'customer', 'customerItem', 'employee']);

        $customers = Customer::where('account_id', Auth::user()->account_id)
            ->active()
            ->orderBy('name')
            ->get(['id', 'name', 'phone']);

        // Get available customer items (status = 'received')
        // PLUS the current item linked to this service (if any) - so it appears in dropdown even if status changed
        $customerItems = CustomerItem::whereHas('customer', function($q) {
                $q->where('account_id', Auth::user()->account_id);
            })
            ->where('is_active', true)
            ->where(function($q) use ($tailorService, $serviceTypeForFilter) {
                $q->where(function($subQ) use ($serviceTypeForFilter) {
                    $subQ->availableForService()
                         ->byServiceType($serviceTypeForFilter);  // Filter by service type
                })
                ->when($tailorService->customer_item_id, function($query) use ($tailorService) {
                    $query->orWhere('id', $tailorService->customer_item_id);
                });
            })
            ->with('customer')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'customer_id' => $item->customer_id,
                    'display_name' => $item->display_name,
                    'description' => $item->description,
                ];
            });

        $employees = User::where('account_id', Auth::user()->account_id)
            ->where('status', 'active')
            ->whereIn('role', ['account_owner', 'admin', 'branch_manager', 'tailor'])
            ->orderBy('name')
            ->get(['id', 'name', 'position', 'role']);

        $products = Product::where('account_id', Auth::user()->account_id)
            ->where('is_active', true)
            ->byServiceType($serviceTypeForFilter)  // Filter products by service type
            ->orderBy('name')
            ->get(['id', 'name', 'sku', 'sale_price', 'type']);

        $branches = Branch::where('account_id', Auth::user()->account_id)
            ->select('id', 'name')
            ->get();

        return Inertia::render('TailorServices/Edit', [
            'service' => $tailorService,
            'customers' => $customers,
            'customerItems' => $customerItems,
            'employees' => $employees,
            'products' => $products,
            'branches' => $branches,
            'serviceType' => $serviceType,
        ]);
    }

    public function update(Request $request, $serviceType, TailorService $tailorService)
    {
        Gate::authorize('edit-account-data');

        if ($tailorService->account_id !== Auth::user()->account_id) {
            abort(403);
        }

        // Convert empty strings to null for optional fields
        $request->merge([
            'customer_item_id' => $request->input('customer_item_id') ?: null,
            'employee_id' => $request->input('employee_id') ?: null,
            'promised_date' => $request->input('promised_date') ?: null,
            'credit_due_date' => $request->input('credit_due_date') ?: null,
            'notes' => $request->input('notes') ?: null,
            'item_condition' => $request->input('item_condition') ?: null,
        ]);

        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'customer_item_id' => 'nullable|exists:customer_items,id',
            'employee_id' => 'nullable|exists:users,id',
            'branch_id' => 'required|exists:branches,id',
            'description' => 'required|string|max:1000',
            'item_condition' => 'nullable|string|max:500',
            'labor_cost' => 'required|numeric|min:0',
            'received_date' => 'required|date',
            'promised_date' => 'nullable|date|after_or_equal:received_date',
            'status' => 'required|in:received,in_progress,completed,delivered,cancelled',
            'notes' => 'nullable|string|max:1000',
            'items' => 'nullable|array',
            'items.*.item_type' => 'required|in:product,service',
            'items.*.product_id' => 'nullable|exists:products,id',
            'items.*.item_name' => 'required|string|max:255',
            'items.*.quantity' => 'required|numeric|min:0.001',
            'items.*.unit_price' => 'required|numeric|min:0',
            // Payment fields
            'payment_status' => 'required|in:paid,credit,partial',
            'paid_amount' => 'nullable|numeric|min:0',
            'credit_amount' => 'nullable|numeric|min:0',
            'credit_due_date' => 'nullable|date',
        ]);

        try {
            DB::transaction(function () use ($validated, $tailorService) {
                $items = $validated['items'] ?? [];
                unset($validated['items']);

                // Handle payment status logic
                $paymentStatus = $validated['payment_status'];
                $paidAmount = $validated['paid_amount'] ?? 0;
                $creditAmount = $validated['credit_amount'] ?? 0;

                // Auto-calculate amounts based on payment status
                $totalCost = $validated['labor_cost'];
                foreach ($items as $item) {
                    $totalCost += $item['quantity'] * $item['unit_price'];
                }

                if ($paymentStatus === 'paid') {
                    $paidAmount = $totalCost;
                    $creditAmount = 0;
                } elseif ($paymentStatus === 'credit') {
                    $paidAmount = 0;
                    $creditAmount = $totalCost;
                } elseif ($paymentStatus === 'partial') {
                    // Ensure paid + credit = total
                    if ($paidAmount + $creditAmount != $totalCost) {
                        $creditAmount = $totalCost - $paidAmount;
                    }
                }

                $validated['paid_amount'] = $paidAmount;
                $validated['credit_amount'] = $creditAmount;

                // Set completion date if status changed to completed
                if ($validated['status'] === 'completed' && !$tailorService->completed_date) {
                    $validated['completed_date'] = now();
                }

                // Set delivery date if status changed to delivered
                if ($validated['status'] === 'delivered' && !$tailorService->delivered_date) {
                    $validated['delivered_date'] = now();
                }

                // Return stock for old items
                foreach ($tailorService->items as $oldItem) {
                    if ($oldItem->item_type === 'product' && $oldItem->product_id) {
                        $this->returnStock($oldItem->product_id, $oldItem->quantity, $tailorService);
                    }
                }

                // Delete old items
                $tailorService->items()->delete();

                // Update service
                $tailorService->update($validated);

                // Add new items
                foreach ($items as $item) {
                    $itemData = [
                        'tailor_service_id' => $tailorService->id,
                        'item_type' => $item['item_type'],
                        'product_id' => $item['product_id'] ?? null,
                        'item_name' => $item['item_name'],
                        'quantity' => $item['quantity'],
                        'unit_price' => $item['unit_price'],
                    ];

                    TailorServiceItem::create($itemData);

                    // Deduct stock for products
                    if ($item['item_type'] === 'product' && !empty($item['product_id'])) {
                        $this->deductStock($item['product_id'], $item['quantity'], $tailorService);
                    }
                }

                // Update customer item status
                if ($tailorService->customer_item_id) {
                    $status = match($tailorService->status) {
                        'completed' => 'completed',
                        'delivered' => 'delivered',
                        'cancelled' => 'received',
                        default => 'in_service',
                    };
                    CustomerItem::where('id', $tailorService->customer_item_id)
                        ->update(['status' => $status]);
                }
            });

            return redirect()->route('services.show', ['serviceType' => $serviceType, 'tailorService' => $tailorService])
                ->with('success', 'Xidmət qeydi yeniləndi.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()])->withInput();
        }
    }

    public function updateStatus(Request $request, $serviceType, TailorService $tailorService)
    {
        Gate::authorize('edit-account-data');

        if ($tailorService->account_id !== Auth::user()->account_id) {
            abort(403);
        }

        $validated = $request->validate([
            'status' => 'required|in:received,in_progress,completed,delivered,cancelled',
        ]);

        DB::transaction(function () use ($validated, $tailorService) {
            // Set completion date if status changed to completed
            if ($validated['status'] === 'completed' && !$tailorService->completed_date) {
                $validated['completed_date'] = now();
            }

            // Set delivery date if status changed to delivered
            if ($validated['status'] === 'delivered' && !$tailorService->delivered_date) {
                $validated['delivered_date'] = now();
            }

            // Update service status
            $tailorService->update($validated);

            // Update customer item status
            if ($tailorService->customer_item_id) {
                $status = match($tailorService->status) {
                    'completed' => 'completed',
                    'delivered' => 'delivered',
                    'cancelled' => 'received',
                    default => 'in_service',
                };
                CustomerItem::where('id', $tailorService->customer_item_id)
                    ->update(['status' => $status]);
            }
        });

        return back()->with('success', 'Xidmət statusu yeniləndi.');
    }

    public function destroy($serviceType, TailorService $tailorService)
    {
        Gate::authorize('delete-account-data');

        if ($tailorService->account_id !== Auth::user()->account_id) {
            abort(403);
        }

        DB::transaction(function () use ($tailorService) {
            // Return stock for all product items
            foreach ($tailorService->items as $item) {
                if ($item->item_type === 'product' && $item->product_id) {
                    $this->returnStock($item->product_id, $item->quantity, $tailorService);
                }
            }

            // Update customer item status
            if ($tailorService->customer_item_id) {
                CustomerItem::where('id', $tailorService->customer_item_id)
                    ->update(['status' => 'received']);
            }

            $tailorService->items()->delete();
            $tailorService->delete();
        });

        return redirect()->route('services.index', ['serviceType' => $serviceType])
            ->with('success', 'Xidmət qeydi silindi və stok geri qaytarıldı.');
    }

    public function bulkDelete(Request $request, $serviceType)
    {
        Gate::authorize('delete-account-data');

        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'required|integer|exists:tailor_services,id',
        ]);

        $accountId = Auth::user()->account_id;

        try {
            DB::transaction(function () use ($validated, $accountId) {
                // Get all services to delete with account_id filtering
                $services = TailorService::whereIn('id', $validated['ids'])
                    ->where('account_id', $accountId)
                    ->with(['items.product', 'branch.warehouses'])
                    ->get();

                // Verify all services belong to user's account
                if ($services->count() !== count($validated['ids'])) {
                    throw new \Exception('Bəzi xidmətlər sizin hesabınıza aid deyil.');
                }

                foreach ($services as $service) {
                    // Return stock for all product items
                    foreach ($service->items as $item) {
                        if ($item->item_type === 'product' && $item->product_id) {
                            $this->returnStock($item->product_id, $item->quantity, $service);
                        }
                    }

                    // Update customer item status
                    if ($service->customer_item_id) {
                        CustomerItem::where('id', $service->customer_item_id)
                            ->update(['status' => 'received']);
                    }

                    // Delete items
                    $service->items()->delete();
                }

                // Delete all services
                TailorService::whereIn('id', $validated['ids'])
                    ->where('account_id', $accountId)
                    ->delete();
            });

            return redirect()->back()
                ->with('success', count($validated['ids']) . ' xidmət silindi və stoklar geri qaytarıldı.');
        } catch (\Exception $e) {
            \Log::error('Bulk delete failed', [
                'error' => $e->getMessage(),
                'ids' => $validated['ids'],
            ]);

            return redirect()->back()
                ->with('error', 'Xidmətləri silməkdə xəta: ' . $e->getMessage());
        }
    }

    private function deductStock(int $productId, float $quantity, TailorService $service): void
    {
        // Get branch's main warehouse
        $warehouse = $service->branch->warehouses()
            ->wherePivot('can_modify_stock', true)
            ->first();

        if (!$warehouse) {
            return;
        }

        $stock = ProductStock::firstOrCreate([
            'product_id' => $productId,
            'warehouse_id' => $warehouse->id,
            'account_id' => $service->account_id,
        ], [
            'quantity' => 0,
            'min_level' => 0,
        ]);

        $stock->decrement('quantity', $quantity);
    }

    private function returnStock(int $productId, float $quantity, TailorService $service): void
    {
        // Get branch's main warehouse
        $warehouse = $service->branch->warehouses()
            ->wherePivot('can_modify_stock', true)
            ->first();

        if (!$warehouse) {
            return;
        }

        $stock = ProductStock::firstOrCreate([
            'product_id' => $productId,
            'warehouse_id' => $warehouse->id,
            'account_id' => $service->account_id,
        ], [
            'quantity' => 0,
            'min_level' => 0,
        ]);

        $stock->increment('quantity', $quantity);
    }

    /**
     * Print tailor service receipt
     */
    public function print(Request $request, $serviceType, TailorService $tailorService)
    {
        Gate::authorize('access-account-data');

        // Verify service belongs to current account
        if ($tailorService->account_id !== Auth::user()->account_id) {
            abort(403);
        }

        $validated = $request->validate([
            'template_id' => 'nullable|exists:receipt_templates,template_id',
        ]);

        try {
            $printService = new ThermalPrintService();
            // Use generateServiceReceipt which works with ServiceRecord-like models
            // TailorService has compatible structure
            $result = $printService->generateServiceReceipt(
                $tailorService,
                $validated['template_id'] ?? null
            );

            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Send print to thermal printer
     */
    public function sendToPrinter(Request $request, $serviceType, TailorService $tailorService)
    {
        Gate::authorize('access-account-data');

        // Verify service belongs to current account
        if ($tailorService->account_id !== Auth::user()->account_id) {
            abort(403);
        }

        $validated = $request->validate([
            'template_id' => 'nullable|exists:receipt_templates,template_id',
        ]);

        try {
            $printService = new ThermalPrintService();
            $result = $printService->generateServiceReceipt(
                $tailorService,
                $validated['template_id'] ?? null
            );

            if ($result['success']) {
                $printResult = $printService->printContent(
                    $result['content'],
                    $result['printer_config']
                );

                return response()->json($printResult);
            }

            return response()->json($result, 400);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Get available templates and printers for print modal
     */
    public function getPrintOptions($serviceType, TailorService $tailorService)
    {
        Gate::authorize('access-account-data');

        // Verify service belongs to current account
        if ($tailorService->account_id !== Auth::user()->account_id) {
            abort(403);
        }

        $templates = ReceiptTemplate::where('account_id', Auth::user()->account_id)
            ->where('type', 'service')
            ->where('is_active', true)
            ->orderBy('is_default', 'desc')
            ->orderBy('name')
            ->get(['template_id', 'name', 'is_default']);

        return response()->json([
            'templates' => $templates,
        ]);
    }
}
