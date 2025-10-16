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
use App\Models\StockMovement;
use App\Models\NegativeStockAlert;
use App\Models\CustomerCredit;
use App\Models\Warehouse;
use App\Models\ReceiptTemplate;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Payment;
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

    public function index(Request $request)
    {
        Gate::authorize('access-account-data');

        $query = TailorService::with(['customer', 'customerItem', 'employee', 'branch', 'customerCredit'])
            ->whereHas('customer', function($q) {
                $q->where('account_id', Auth::user()->account_id);
            });

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
            $query->byDateRange($request->date_from, $request->date_to);
        }

        // Filter by branch
        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        $tailorServices = $query->latest('created_at')
            ->paginate(15)
            ->withQueryString();

        $branches = Branch::where('account_id', Auth::user()->account_id)
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('TailorServices/Index', [
            'tailorServices' => $tailorServices,
            'filters' => $request->only(['search', 'status', 'date_from', 'date_to', 'branch_id']),
            'branches' => $branches,
        ]);
    }

    public function create()
    {
        Gate::authorize('create-account-data');

        $customers = Customer::where('account_id', Auth::user()->account_id)
            ->active()
            ->orderBy('name')
            ->get()
            ->map(function ($customer) {
                return [
                    'id' => $customer->id,
                    'name' => $customer->name,
                    'customer_type' => $customer->customer_type,
                    'customer_type_text' => $customer->customer_type_text,
                    'phone' => $customer->phone,
                    'email' => $customer->email,
                ];
            });

        $customerItems = CustomerItem::whereHas('customer', function($q) {
                $q->where('account_id', Auth::user()->account_id);
            })
            ->where('is_active', true)
            ->with('customer')
            ->orderBy('plate_number')
            ->get()
            ->map(function ($customerItem) {
                return [
                    'id' => $customerItem->id,
                    'customer_id' => $customerItem->customer_id,
                    'plate_number' => $customerItem->plate_number,
                    'brand' => $customerItem->brand,
                    'model' => $customerItem->model,
                    'year' => $customerItem->year,
                    'full_name' => $customerItem->full_name,
                    'formatted_plate' => $customerItem->formatted_plate,
                ];
            });

        $employees = User::where('account_id', Auth::user()->account_id)
            ->where('status', 'active')
            ->whereIn('role', ['account_owner', 'admin', 'branch_manager', 'warehouse_manager', 'sales_staff', 'cashier', 'accountant', 'tailor'])
            ->orderBy('name')
            ->get(['id', 'name', 'position', 'role'])
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'position' => $user->position,
                    'role' => $user->role,
                    'display_text' => $user->position ?: __('app.' . $user->role),
                ];
            });

        // Don't preload products - use AJAX search instead for better performance

        $services = Product::where('account_id', Auth::user()->account_id)
            ->where("type", "service")->where("is_active", true)
            ->orderBy('name')
            ->get(['id', 'name', 'sku as code', 'sale_price as price']);

        // Get branches accessible to the user
        if (Auth::user()->role === 'sales_staff') {
            // Sales staff only see their assigned branch
            $branches = Branch::where('id', Auth::user()->branch_id)
                ->select('id', 'name')->get();
        } else {
            // Other roles see all branches
            $branches = Branch::where('account_id', Auth::user()->account_id)
                ->select('id', 'name')->get();
        }

        return Inertia::render('TailorServices/Create', [
            'customers' => $customers,
            'customerItems' => $customerItems,
            'employees' => $employees,
            'services' => $services,
            'branches' => $branches,
            'auth' => [
                'user' => [
                    'role' => Auth::user()->role,
                ],
            ],
        ]);
    }

    public function store(Request $request)
    {
        \Log::info('TailorService store method called', [
            'user_id' => Auth::id(),
            'request_data' => $request->all()
        ]);
        
        Gate::authorize('create-account-data');

        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'customerItem_id' => 'nullable|exists:customer_items,id',
            'employee_id' => 'nullable|exists:users,id',
            'branch_id' => 'nullable|exists:branches,id',
            'description' => 'required|string|max:2000',
            'labor_cost' => 'required|numeric|min:0',
            'service_date' => 'required|date',
            'service_time' => 'nullable|date_format:H:i',
            'status' => 'required|in:pending,in_progress,completed,cancelled',
            'notes' => 'nullable|string|max:1000',
            'customerItem_mileage' => 'required_with:customerItem_id|nullable|integer|min:0',
            'service_items' => 'nullable|array',
            'service_items.*.item_type' => 'required|in:product,service',
            'service_items.*.product_id' => 'nullable|exists:products,id',
            'service_items.*.service_id_ref' => 'nullable|exists:products,id',
            'service_items.*.item_name' => 'nullable|string|max:255',
            'service_items.*.quantity' => 'required|numeric|min:0',
            'service_items.*.base_quantity' => 'nullable|numeric|min:0', // For inventory deduction
            'service_items.*.unit_price' => 'required|numeric|min:0',
            'payment_status' => 'nullable|in:paid,credit,partial',
            'paid_amount' => 'nullable|numeric|min:0',
            'credit_amount' => 'nullable|numeric|min:0',
            'credit_due_date' => 'nullable|date|after:today',
            'credit_description' => 'nullable|string|max:500',
        ]);

        // Restrict date/time selection to managers and account owners only
        $user = Auth::user();
        $canEditDateTime = in_array($user->role, ['account_owner', 'admin', 'branch_manager']);
        
        if (!$canEditDateTime) {
            // Force current date and time for non-privileged users
            $validated['service_date'] = now()->format('Y-m-d');
            $validated['service_time'] = now()->format('H:i');
        } else {
            // If no time provided but user can edit, default to current time
            if (empty($validated['service_time'])) {
                $validated['service_time'] = now()->format('H:i');
            }
        }

        // Additional validation for service items
        if (isset($validated['service_items']) && is_array($validated['service_items'])) {
            foreach ($validated['service_items'] as $index => $item) {
                if (isset($item['item_type']) && $item['item_type'] === 'service' && !empty($item['service_id_ref'])) {
                    $serviceProduct = Product::where('id', $item['service_id_ref'])
                        ->where('type', 'service')
                        ->where('account_id', Auth::user()->account_id)
                        ->first();
                    
                    if (!$serviceProduct) {
                        return back()->withErrors([
                            "service_items.{$index}.service_id_ref" => 'Seçilən xidmət mövcud deyil və ya sizin hesabınıza aid deyil.'
                        ]);
                    }
                }
            }
        }        // Clean empty string customerItem_id to null
        if (isset($validated['customerItem_id']) && $validated['customerItem_id'] === '') {
            $validated['customerItem_id'] = null;
        }

        // Verify relationships belong to the same account
        $customer = Customer::findOrFail($validated['customer_id']);
        if ($customer->account_id !== Auth::user()->account_id) {
            abort(403);
        }

        if (isset($validated['customerItem_id']) && !empty($validated['customerItem_id'])) {
            $customerItem = CustomerItem::findOrFail($validated['customerItem_id']);
            // Check if customerItem belongs to the selected customer
            if ((int)$customerItem->customer_id !== (int)$validated['customer_id']) {
                return back()->withErrors(['customerItem_id' => 'Seçilmiş nəqliyyat vasitəsi müştəriyə aid deyil.'])->withInput();
            }
            // Also verify the customerItem's customer belongs to the same account
            if ($customerItem->customer->account_id !== Auth::user()->account_id) {
                abort(403);
            }
        }

        // Handle branch selection - auto-select if not provided
        if (!isset($validated['branch_id']) || empty($validated['branch_id'])) {
            // Auto-select branch based on user role
            if (Auth::user()->role === 'sales_staff' && Auth::user()->branch_id) {
                $validated['branch_id'] = Auth::user()->branch_id;
            } else {
                // Get user's main branch or first available branch
                $branch = Branch::where('account_id', Auth::user()->account_id)
                    ->where('is_main', true)
                    ->first();
                
                if (!$branch) {
                    $branch = Branch::where('account_id', Auth::user()->account_id)->first();
                }
                
                if (!$branch) {
                    return back()->withErrors(['branch_id' => 'Hesabınızda filial tapılmadı.'])->withInput();
                }
                
                $validated['branch_id'] = $branch->id;
            }
        }

        // Verify branch belongs to the user's account and user has access
        $branch = Branch::findOrFail($validated['branch_id']);
        if ($branch->account_id !== Auth::user()->account_id) {
            abort(403);
        }

        // For sales staff, ensure they can only create records for their assigned branch
        if (Auth::user()->role === 'sales_staff' && $branch->id !== Auth::user()->branch_id) {
            return back()->withErrors(['branch_id' => 'Seçilmiş filial sizə təyin edilməyib.'])->withInput();
        }

        try {
            \Log::info('Starting service record transaction', ['user_id' => Auth::id()]);
            
            DB::transaction(function () use ($validated, $branch) {
                \Log::info('Inside transaction, processing service items');
                
                $serviceItems = $validated['service_items'] ?? [];
                unset($validated['service_items']); // Remove from validated data
                
                // Validate stock levels for product items only
                if (is_array($serviceItems) && !empty($serviceItems)) {
                    \Log::info('Validating stock levels', ['item_count' => count($serviceItems)]);
                    
                    foreach ($serviceItems as $index => $item) {
                        \Log::info('Processing service item', ['index' => $index, 'item' => $item]);
                        
                        if ($item['item_type'] === 'product' && !empty($item['product_id'])) {
                            \Log::info('Validating product item', ['product_id' => $item['product_id'], 'product_id_type' => gettype($item['product_id'])]);
                            
                            // Convert string to integer if needed
                            $productId = is_string($item['product_id']) ? (int)$item['product_id'] : $item['product_id'];
                            
                            if ($productId <= 0) {
                                \Log::warning('Invalid product ID', ['product_id' => $item['product_id']]);
                                continue;
                            }
                            
                            try {
                                $product = Product::findOrFail($productId);
                                \Log::info('Product found', ['product_name' => $product->name, 'account_id' => $product->account_id]);
                                
                                if ($product->account_id !== Auth::user()->account_id) {
                                    \Log::warning('Product account mismatch', ['product_account' => $product->account_id, 'user_account' => Auth::user()->account_id]);
                                    continue;
                                }
                                
                                // Check stock levels - use base_quantity for inventory deduction
                                $totalStock = ProductStock::where('product_id', $productId)->sum('quantity');
                                $deductionQuantity = $item['base_quantity'] ?? $item['quantity'];
                                
                                \Log::info('Stock check', [
                                    'product_id' => $productId, 
                                    'total_stock' => $totalStock, 
                                    'deduction_quantity' => $deductionQuantity,
                                    'allow_negative' => $product->allow_negative_stock
                                ]);
                                
                                if ($totalStock < $deductionQuantity && !$product->allow_negative_stock) {
                                    \Log::error('Insufficient stock', [
                                        'product_name' => $product->name,
                                        'available' => $totalStock,
                                        'required' => $deductionQuantity
                                    ]);
                                    throw new \Exception("Məhsul '{$product->name}' üçün kifayət qədər stok yoxdur. Mövcud: {$totalStock}, tələb olunan: {$deductionQuantity}");
                                }
                            } catch (\Exception $e) {
                                \Log::error('Error processing product item', ['error' => $e->getMessage(), 'item' => $item]);
                                throw $e;
                            }
                            
                        } elseif ($item['item_type'] === 'service' && !empty($item['service_id_ref'])) {
                            \Log::info('Validating service item', ['service_id' => $item['service_id_ref'], 'service_id_type' => gettype($item['service_id_ref'])]);
                            
                            // Convert string to integer if needed
                            $serviceId = is_string($item['service_id_ref']) ? (int)$item['service_id_ref'] : $item['service_id_ref'];
                            
                            if ($serviceId <= 0) {
                                \Log::warning('Invalid service ID', ['service_id' => $item['service_id_ref']]);
                                continue;
                            }
                            
                            try {
                                $service = Product::where('type', 'service')->findOrFail($serviceId);
                                \Log::info('Service found', ['service_name' => $service->name, 'account_id' => $service->account_id]);
                                
                                if ($service->account_id !== Auth::user()->account_id) {
                                    \Log::warning('Service account mismatch', ['service_account' => $service->account_id, 'user_account' => Auth::user()->account_id]);
                                    continue;
                                }
                            } catch (\Exception $e) {
                                \Log::error('Error processing service item', ['error' => $e->getMessage(), 'item' => $item]);
                                throw $e;
                            }
                        }
                    }
                }
                
                $validated['account_id'] = Auth::user()->account_id;
                // branch_id already validated and included in $validated
                
                // Combine service_date and service_time into proper datetime
                if (isset($validated['service_time'])) {
                    $validated['service_date'] = $validated['service_date'] . ' ' . $validated['service_time'];
                    unset($validated['service_time']); // Remove the separate time field
                }
                
                \Log::info('Creating service record', ['data' => $validated]);
                $tailorService = TailorService::create($validated);
                \Log::info('Service record created', ['id' => $tailorService->id]);

                // Update customerItem mileage if provided
                if (isset($validated['customerItem_mileage']) && !empty($validated['customerItem_id'])) {
                    \Log::info('Updating customerItem mileage');
                    $customerItem = CustomerItem::find($validated['customerItem_id']);
                    if ($customerItem && $customerItem->customer->account_id === Auth::user()->account_id) {
                        // Only update if the new mileage is higher than current
                        if (!$customerItem->mileage || $validated['customerItem_mileage'] > $customerItem->mileage) {
                            $customerItem->update(['mileage' => $validated['customerItem_mileage']]);
                        }
                    }
                }

                // Add service items if provided
                if (is_array($serviceItems) && !empty($serviceItems)) {
                    \Log::info('Processing service items for creation', ['count' => count($serviceItems)]);
                    
                    foreach ($serviceItems as $index => $item) {
                        \Log::info('Creating service item', ['index' => $index, 'item' => $item]);
                        
                        // Skip empty items
                        if (empty($item['product_id']) && empty($item['service_id_ref']) && empty($item['item_name'])) {
                            continue;
                        }

                        $serviceItemData = [
                            'service_id' => $tailorService->id, // This should be service_id, not tailor_service_id
                            'item_type' => $item['item_type'],
                            'quantity' => $item['quantity'],
                            'base_quantity' => $item['base_quantity'] ?? null,
                            'unit_price' => $item['unit_price'],
                            'total_price' => $item['quantity'] * $item['unit_price'],
                        ];

                        if ($item['item_type'] === 'product' && !empty($item['product_id'])) {
                            $serviceItemData['product_id'] = $item['product_id'];
                            
                            \Log::info('Before stock update', ['product_id' => $item['product_id']]);
                            
                            try {
                                // Update stock for product items using base_quantity for deduction
                                $deductionQuantity = $item['base_quantity'] ?? $item['quantity'];
                                $this->updateProductStockForService($item['product_id'], $deductionQuantity, $tailorService);
                                
                                \Log::info('After stock update');
                                
                                // Create service item
                                $serviceItem = TailorServiceItem::create($serviceItemData);
                                \Log::info('Product service item created', ['service_item_id' => $serviceItem->id]);
                            } catch (\Exception $e) {
                                \Log::error('Error creating product service item', ['error' => $e->getMessage(), 'item_data' => $serviceItemData]);
                                throw $e;
                            }
                            
                        } elseif ($item['item_type'] === 'service' && !empty($item['service_id_ref'])) {
                            $serviceItemData['service_id_ref'] = $item['service_id_ref'];
                            
                            try {
                                // Create service item (no stock management for services)
                                $serviceItem = TailorServiceItem::create($serviceItemData);
                                \Log::info('Service item created', ['service_item_id' => $serviceItem->id]);
                            } catch (\Exception $e) {
                                \Log::error('Error creating service item', ['error' => $e->getMessage(), 'item_data' => $serviceItemData]);
                                throw $e;
                            }
                            
                        } else {
                            // Manual item name entry
                            $serviceItemData['item_name'] = $item['item_name'];
                            
                            try {
                                $serviceItem = TailorServiceItem::create($serviceItemData);
                                \Log::info('Manual service item created', ['service_item_id' => $serviceItem->id]);
                            } catch (\Exception $e) {
                                \Log::error('Error creating manual service item', ['error' => $e->getMessage(), 'item_data' => $serviceItemData]);
                                throw $e;
                            }
                        }
                    }
                }
                
                // Recalculate total cost after adding all service items
                $tailorService->calculateTotalWithItems();

                // Handle credit payment if specified
                if (isset($validated['payment_status']) && $validated['payment_status'] !== 'paid') {
                    \Log::info('Processing credit payment', ['payment_status' => $validated['payment_status']]);

                    $creditAmount = $validated['credit_amount'] ?? $tailorService->total_cost;
                    $paidAmount = $validated['paid_amount'] ?? 0;
                    $dueDate = $validated['credit_due_date'] ?? null;
                    $description = $validated['credit_description'] ?? null;

                    // Validate amounts (with small tolerance for floating point precision)
                    $tolerance = 0.01;
                    $totalExpected = round(floatval($creditAmount) + floatval($paidAmount), 2);
                    $totalActual = round(floatval($tailorService->total_cost), 2);

                    if (abs($totalExpected - $totalActual) > $tolerance) {
                        throw new \Exception("Ödəmə məbləği ({$paidAmount} AZN) və borc məbləği ({$creditAmount} AZN) cəmi {$totalExpected} AZN, amma ümumi dəyər {$totalActual} AZN. Cəm ümumi dəyərə bərabər olmalıdır.");
                    }

                    if ($validated['payment_status'] === 'credit') {
                        // Full credit
                        $tailorService->setAsCredit($creditAmount, $dueDate, $description);
                    } elseif ($validated['payment_status'] === 'partial') {
                        // Partial payment
                        $tailorService->setAsPartialPayment($paidAmount, $creditAmount, $dueDate, $description);
                    }

                    \Log::info('Credit payment processed', ['customer_credit_id' => $tailorService->customer_credit_id]);
                }

                // Automatically create Sale record for products used in service
                $this->createSaleFromServiceProducts($tailorService, $serviceItems, $validated);

                \Log::info('Transaction completed successfully');
            });

            \Log::info('About to redirect to index');
            return redirect()->route('tailor-services.index')
                ->with('success', 'Servis qeydi uğurla yaradıldı.');
        } catch (\Exception $e) {
            \Log::error('Service record creation failed', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return back()->withErrors(['error' => $e->getMessage()])->withInput();
        }
    }

    public function show(TailorService $tailorService)
    {
        Gate::authorize('access-account-data');

        // Verify service record belongs to current account through customer
        if (!$tailorService->customer || $tailorService->customer->account_id !== Auth::user()->account_id) {
            abort(403);
        }

        $tailorService->load([
            'customer',
            'customerItem',
            'employee',
            'branch'
        ]);

        $serviceItems = $tailorService->serviceItems()
            ->with(['product', 'service'])
            ->get();

        return Inertia::render('TailorServices/Show', [
            'tailorService' => $tailorService,
            'serviceItems' => $serviceItems,
        ]);
    }

    public function edit(TailorService $tailorService)
    {
        Gate::authorize('edit-account-data');

        // Verify service record belongs to current account through customer
        if (!$tailorService->customer || $tailorService->customer->account_id !== Auth::user()->account_id) {
            abort(403);
        }

        $tailorService->load(['serviceItems.product', 'serviceItems.service', 'customer', 'customerItem', 'employee']);

        $customers = Customer::where('account_id', Auth::user()->account_id)
            ->active()
            ->orderBy('name')
            ->get()
            ->map(function ($customer) {
                return [
                    'id' => $customer->id,
                    'name' => $customer->name,
                    'customer_type' => $customer->customer_type,
                    'customer_type_text' => $customer->customer_type_text,
                    'phone' => $customer->phone,
                    'email' => $customer->email,
                ];
            });

        $customerItems = CustomerItem::whereHas('customer', function($q) {
                $q->where('account_id', Auth::user()->account_id);
            })
            ->where('is_active', true)
            ->with('customer')
            ->orderBy('plate_number')
            ->get()
            ->map(function ($customerItem) {
                return [
                    'id' => $customerItem->id,
                    'customer_id' => $customerItem->customer_id,
                    'plate_number' => $customerItem->plate_number,
                    'brand' => $customerItem->brand,
                    'model' => $customerItem->model,
                    'year' => $customerItem->year,
                    'full_name' => $customerItem->full_name,
                    'formatted_plate' => $customerItem->formatted_plate,
                ];
            });

        $employees = User::where('account_id', Auth::user()->account_id)
            ->where('status', 'active')
            ->whereIn('role', ['account_owner', 'admin', 'branch_manager', 'warehouse_manager', 'sales_staff', 'cashier', 'accountant', 'tailor'])
            ->orderBy('name')
            ->get(['id', 'name', 'position', 'role'])
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'position' => $user->position,
                    'role' => $user->role,
                    'display_text' => $user->position ?: __('app.' . $user->role),
                ];
            });

        $products = Product::where('account_id', Auth::user()->account_id)
            ->products() // Only actual products, not services
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'sku', 'sale_price', 'unit', 'base_unit', 'packaging_quantity', 'packaging_size']);

        // Get services (products with type='service')
        $services = Product::where('account_id', Auth::user()->account_id)
            ->where('type', 'service')
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'sku as code', 'sale_price as price']);

        // Get branches accessible to the user
        if (Auth::user()->role === 'sales_staff') {
            // Sales staff only see their assigned branch
            $branches = Branch::where('id', Auth::user()->branch_id)
                ->select('id', 'name')->get();
        } else {
            // Other roles see all branches
            $branches = Branch::where('account_id', Auth::user()->account_id)
                ->select('id', 'name')->get();
        }

        return Inertia::render('TailorServices/Edit', [
            'tailorService' => [
                'id' => $tailorService->id,
                'service_number' => $tailorService->service_number,
                'customer_id' => $tailorService->customer_id,
                'customerItem_id' => $tailorService->customerItem_id,
                'branch_id' => $tailorService->branch_id,
                'employee_id' => $tailorService->employee_id,
                'description' => $tailorService->description,
                'labor_cost' => (float) $tailorService->labor_cost,
                'service_date' => $tailorService->service_date->format('Y-m-d'),
                'service_time' => $tailorService->service_date->format('H:i'),
                'status' => $tailorService->status,
                'notes' => $tailorService->notes,
                'customerItem_mileage' => $tailorService->customerItem_mileage,
                'created_at' => $tailorService->created_at,
                'status_text' => $tailorService->status_text,
                'formatted_total_cost' => $tailorService->formatted_total_cost,
            ],
            'serviceItems' => $tailorService->serviceItems,
            'customers' => $customers,
            'customerItems' => $customerItems,
            'employees' => $employees,
            'products' => $products,
            'services' => $services,
            'branches' => $branches,
            'auth' => [
                'user' => [
                    'role' => Auth::user()->role,
                ],
            ],
        ]);
    }

    public function update(Request $request, TailorService $tailorService)
    {
        Gate::authorize('edit-account-data');

        // Verify service record belongs to current account through customer
        if (!$tailorService->customer || $tailorService->customer->account_id !== Auth::user()->account_id) {
            abort(403);
        }

        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'customerItem_id' => 'nullable|exists:customer_items,id',
            'employee_id' => 'nullable|exists:users,id',
            'branch_id' => 'nullable|exists:branches,id',
            'description' => 'required|string|max:2000',
            'labor_cost' => 'required|numeric|min:0',
            'service_date' => 'required|date',
            'service_time' => 'nullable|date_format:H:i',
            'status' => 'required|in:pending,in_progress,completed,cancelled',
            'notes' => 'nullable|string|max:1000',
            'customerItem_mileage' => 'required_with:customerItem_id|nullable|integer|min:0',
            'payment_status' => 'required|in:paid,credit,partial',
            'paid_amount' => 'required|numeric|min:0',
            'credit_amount' => 'nullable|numeric|min:0',
            'credit_due_date' => 'nullable|date|after:today',
            'service_items' => 'nullable|array',
            'service_items.*.item_type' => 'required|in:product,service',
            'service_items.*.product_id' => 'nullable|exists:products,id',
            'service_items.*.service_id_ref' => 'nullable|exists:products,id',
            'service_items.*.item_name' => 'nullable|string|max:255',
            'service_items.*.quantity' => 'required|numeric|min:0',
            'service_items.*.base_quantity' => 'nullable|numeric|min:0', // For inventory deduction
            'service_items.*.unit_price' => 'required|numeric|min:0',
        ]);

        // Additional validation for service items
        if (isset($validated['service_items']) && is_array($validated['service_items'])) {
            foreach ($validated['service_items'] as $index => $item) {
                if (isset($item['item_type']) && $item['item_type'] === 'service' && !empty($item['service_id_ref'])) {
                    $serviceProduct = Product::where('id', $item['service_id_ref'])
                        ->where('type', 'service')
                        ->where('account_id', Auth::user()->account_id)
                        ->first();
                    
                    if (!$serviceProduct) {
                        return back()->withErrors([
                            "service_items.{$index}.service_id_ref" => 'Seçilən xidmət mövcud deyil və ya sizin hesabınıza aid deyil.'
                        ]);
                    }
                }
            }
        }
        // Clean empty string customerItem_id to null
        if (isset($validated['customerItem_id']) && $validated['customerItem_id'] === '') {
            $validated['customerItem_id'] = null;
        }

        // Verify relationships belong to the same account and validate customerItem-customer relationship
        $customer = Customer::findOrFail($validated['customer_id']);
        if ($customer->account_id !== Auth::user()->account_id) {
            abort(403);
        }

        if (isset($validated['customerItem_id']) && !empty($validated['customerItem_id'])) {
            $customerItem = CustomerItem::findOrFail($validated['customerItem_id']);
            // Check if customerItem belongs to the selected customer
            if ((int)$customerItem->customer_id !== (int)$validated['customer_id']) {
                return back()->withErrors(['customerItem_id' => 'Seçilmiş nəqliyyat vasitəsi müştəriyə aid deyil.'])->withInput();
            }
            // Also verify the customerItem's customer belongs to the same account
            if ($customerItem->customer->account_id !== Auth::user()->account_id) {
                abort(403);
            }
        }

        // Verify branch belongs to the user's account and user has access
        $branch = Branch::findOrFail($validated['branch_id']);
        if ($branch->account_id !== Auth::user()->account_id) {
            abort(403);
        }

        // For sales staff, ensure they can only update records for their assigned branch
        if (Auth::user()->role === 'sales_staff' && $branch->id !== Auth::user()->branch_id) {
            return back()->withErrors(['branch_id' => 'Seçilmiş filial sizə təyin edilməyib.'])->withInput();
        }

        // Update status timestamps
        if ($validated['status'] === 'in_progress' && !$tailorService->started_at) {
            $validated['started_at'] = now();
        } elseif ($validated['status'] === 'completed' && !$tailorService->completed_at) {
            $validated['completed_at'] = now();
        }

        // Restrict date/time selection to managers and account owners only
        $user = Auth::user();
        $canEditDateTime = in_array($user->role, ['account_owner', 'admin', 'branch_manager']);
        
        if (!$canEditDateTime) {
            // Keep the original service date for non-privileged users
            $validated['service_date'] = $tailorService->service_date->format('Y-m-d');
            unset($validated['service_time']); // Remove the time field
        } else {
            // For privileged users, keep the date as-is (time is not stored in service_date)
            unset($validated['service_time']); // Remove the separate time field since we don't store time
        }

        DB::transaction(function () use ($validated, $tailorService) {
            $serviceItems = $validated['service_items'] ?? [];
            unset($validated['service_items']); // Remove from validated data
            
            // Store old service items for stock reversal
            $oldTailorServiceItems = $tailorService->serviceItems()->get();
            
            // Validate stock levels for new product items only
            if (is_array($serviceItems) && !empty($serviceItems)) {
                foreach ($serviceItems as $item) {
                    if ($item['item_type'] === 'product' && !empty($item['product_id'])) {
                        $product = Product::findOrFail($item['product_id']);
                        if ($product->account_id !== Auth::user()->account_id) {
                            continue;
                        }
                        
                        // Check stock levels (considering we'll return old items first)
                        $totalStock = ProductStock::where('product_id', $item['product_id'])->sum('quantity');
                        $oldQuantity = $oldTailorServiceItems->where('product_id', $item['product_id'])->sum('base_quantity');
                        $availableStock = $totalStock + $oldQuantity; // Add back what we'll return
                        $deductionQuantity = $item['base_quantity'] ?? $item['quantity'];
                        
                        if ($availableStock < $deductionQuantity && !$product->allow_negative_stock) {
                            throw new \Exception("Məhsul '{$product->name}' üçün kifayət qədər stok yoxdur. Mövcud: {$availableStock}, tələb olunan: {$deductionQuantity}");
                        }
                    } elseif ($item['item_type'] === 'service' && !empty($item['service_id_ref'])) {
                        $service = Product::where('type', 'service')->findOrFail($item['service_id_ref']);
                        if ($service->account_id !== Auth::user()->account_id) {
                            continue;
                        }
                    }
                }
            }
            
            $tailorService->update($validated);

            // Update customerItem mileage if provided
            if (isset($validated['customerItem_mileage']) && !empty($validated['customerItem_id'])) {
                $customerItem = CustomerItem::find($validated['customerItem_id']);
                if ($customerItem && $customerItem->customer->account_id === Auth::user()->account_id) {
                    // Only update if the new mileage is higher than current
                    if (!$customerItem->mileage || $validated['customerItem_mileage'] > $customerItem->mileage) {
                        $customerItem->update(['mileage' => $validated['customerItem_mileage']]);
                    }
                }
            }

            // Return stock for old product items only
            foreach ($oldTailorServiceItems as $oldItem) {
                if ($oldItem->item_type === 'product' && $oldItem->product_id) {
                    $returnQuantity = $oldItem->base_quantity ?? $oldItem->quantity;
                    $this->returnProductStockForService($oldItem->product_id, $returnQuantity, $tailorService);
                }
            }

            // Delete existing service items
            $tailorService->serviceItems()->delete();

            // Add new service items if provided
            if (is_array($serviceItems) && !empty($serviceItems)) {
                foreach ($serviceItems as $item) {
                    // Skip empty items
                    if (empty($item['product_id']) && empty($item['service_id_ref']) && empty($item['item_name'])) {
                        continue;
                    }
                    
                    // Prepare service item data
                    $serviceItemData = [
                        'service_id' => $tailorService->id,
                        'item_type' => $item['item_type'],
                        'quantity' => $item['quantity'],
                        'base_quantity' => $item['base_quantity'] ?? $item['quantity'],
                        'unit_price' => $item['unit_price'],
                        'total_price' => $item['quantity'] * $item['unit_price'],
                        'notes' => $item['notes'] ?? null,
                    ];
                    
                    if ($item['item_type'] === 'product' && !empty($item['product_id'])) {
                        $serviceItemData['product_id'] = $item['product_id'];
                        
                        // Create service item
                        TailorServiceItem::create($serviceItemData);
                        
                        // Update stock levels and create movement record for products only
                        $deductionQuantity = $item['base_quantity'] ?? $item['quantity'];
                        $this->updateProductStockForService($item['product_id'], $deductionQuantity, $tailorService);
                        
                        // Create negative stock alert if needed
                        $currentStock = ProductStock::where('product_id', $item['product_id'])->sum('quantity');
                        if ($currentStock < 0) {
                            NegativeStockAlert::create([
                                'service_id' => $tailorService->id,
                                'product_id' => $item['product_id'],
                                'quantity_sold' => $item['quantity'],
                                'stock_level' => $currentStock,
                                'status' => 'active',
                                'message' => "Servis qeydi #{$tailorService->id} yenilənməsi üçün məhsul istifadəsi: {$item['quantity']} istifadə edildi",
                            ]);
                        }
                    } elseif ($item['item_type'] === 'service' && !empty($item['service_id_ref'])) {
                        $serviceItemData['service_id_ref'] = $item['service_id_ref'];
                        
                        // Create service item (no stock management for services)
                        TailorServiceItem::create($serviceItemData);
                    } else {
                        // Manual item name entry
                        $serviceItemData['item_name'] = $item['item_name'];
                        TailorServiceItem::create($serviceItemData);
                    }
                }
            }
            
            // Recalculate total cost after updating all service items
            $tailorService->refresh(); // Refresh to get updated data
            $tailorService->calculateTotalWithItems();

            // Handle credit payment updates if specified
            if (isset($validated['payment_status'])) {
                \Log::info('Processing payment status update', ['payment_status' => $validated['payment_status']]);

                // If payment status changed or amounts changed, handle credit updates
                if ($validated['payment_status'] === 'paid') {
                    // Mark as fully paid - remove existing credit if any
                    if ($tailorService->customer_credit_id) {
                        $existingCredit = CustomerCredit::find($tailorService->customer_credit_id);
                        if ($existingCredit && $existingCredit->status !== 'paid') {
                            // Mark existing credit as paid
                            $existingCredit->addPayment($existingCredit->remaining_amount, 'Servis qeydi tam ödənildi');
                        }
                        $tailorService->update([
                            'payment_status' => 'paid',
                            'paid_amount' => $tailorService->total_cost,
                            'credit_amount' => 0,
                            'customer_credit_id' => null,
                        ]);
                    } else {
                        $tailorService->update([
                            'payment_status' => 'paid',
                            'paid_amount' => $tailorService->total_cost,
                            'credit_amount' => 0,
                        ]);
                    }
                } elseif ($validated['payment_status'] === 'credit' || $validated['payment_status'] === 'partial') {
                    $creditAmount = $validated['credit_amount'] ?? $tailorService->total_cost;
                    $paidAmount = $validated['paid_amount'] ?? 0;
                    $dueDate = $validated['credit_due_date'] ?? null;
                    $description = "Servis qeydi #{$tailorService->service_number} üçün borc";

                    // Validate amounts (with small tolerance for floating point precision)
                    $tolerance = 0.01;
                    $totalExpected = round(floatval($creditAmount) + floatval($paidAmount), 2);
                    $totalActual = round(floatval($tailorService->total_cost), 2);

                    if (abs($totalExpected - $totalActual) > $tolerance) {
                        throw new \Exception("Ödəmə məbləği ({$paidAmount} AZN) və borc məbləği ({$creditAmount} AZN) cəmi {$totalExpected} AZN, amma ümumi dəyər {$totalActual} AZN. Cəm ümumi dəyərə bərabər olmalıdır.");
                    }

                    // Update or create credit record
                    if ($tailorService->customer_credit_id) {
                        // Update existing credit
                        $existingCredit = CustomerCredit::find($tailorService->customer_credit_id);
                        if ($existingCredit) {
                            $existingCredit->update([
                                'amount' => $creditAmount,
                                'remaining_amount' => $creditAmount,
                                'due_date' => $dueDate,
                                'description' => $description,
                                'status' => $creditAmount > 0 ? 'pending' : 'paid',
                                'payment_history' => [], // Reset payment history for updated credit
                            ]);
                            \Log::info('Updated existing credit', ['credit_id' => $existingCredit->id]);
                        }
                    } else {
                        // Create new credit if needed
                        if ($creditAmount > 0) {
                            if ($validated['payment_status'] === 'credit') {
                                $tailorService->setAsCredit($creditAmount, $dueDate, $description);
                            } else {
                                $tailorService->setAsPartialPayment($paidAmount, $creditAmount, $dueDate, $description);
                            }
                            \Log::info('Created new credit', ['customer_credit_id' => $tailorService->customer_credit_id]);
                        }
                    }

                    // Update service record payment info
                    $tailorService->update([
                        'payment_status' => $validated['payment_status'],
                        'paid_amount' => $paidAmount,
                        'credit_amount' => $creditAmount,
                        'credit_due_date' => $dueDate,
                    ]);
                }

                \Log::info('Payment status update completed', ['payment_status' => $validated['payment_status']]);
            }

            // Update or create Sale record for products used in service
            $this->updateSaleFromServiceProducts($tailorService, $serviceItems, $validated);
        });

        return redirect()->route('tailor-services.show', $tailorService)
            ->with('success', 'Servis qeydi yeniləndi.');
    }

    public function destroy(TailorService $tailorService)
    {
        Gate::authorize('delete-account-data');

        // Verify service record belongs to current account through customer
        if (!$tailorService->customer || $tailorService->customer->account_id !== Auth::user()->account_id) {
            abort(403);
        }

        DB::transaction(function () use ($tailorService) {
            // Return stock for product items only before deletion
            $serviceItems = $tailorService->serviceItems()->get();
            foreach ($serviceItems as $item) {
                if ($item->item_type === 'product' && $item->product_id) {
                    $returnQuantity = $item->base_quantity ?? $item->quantity;
                    $this->returnProductStockForService($item->product_id, $returnQuantity, $tailorService);
                }
            }

            // Delete associated sale if it exists
            $associatedSale = Sale::where('account_id', $tailorService->account_id)
                ->where('notes', 'LIKE', "Servis qeydi #{$tailorService->service_number}%")
                ->first();

            if ($associatedSale) {
                \Log::info('Deleting associated sale for service record', ['sale_id' => $associatedSale->sale_id]);
                $associatedSale->items()->delete();
                $associatedSale->payments()->delete();
                $associatedSale->delete();
            }

            $tailorService->serviceItems()->delete();
            $tailorService->delete();
        });

        return redirect()->route('tailor-services.index')
            ->with('success', 'Servis qeydi silindi və stok geri qaytarıldı.');
    }

    public function updateStatus(Request $request, TailorService $tailorService)
    {
        Gate::authorize('edit-account-data');

        $validated = $request->validate([
            'status' => 'required|in:pending,in_progress,completed,cancelled',
        ]);

        $updates = ['status' => $validated['status']];

        if ($validated['status'] === 'in_progress' && !$tailorService->started_at) {
            $updates['started_at'] = now();
        } elseif ($validated['status'] === 'completed' && !$tailorService->completed_at) {
            $updates['completed_at'] = now();
        }

        $tailorService->update($updates);

        return back()->with('success', 'Servis statusu yeniləndi.');
    }

    private function updateProductStockForService(int $productId, float $quantity, TailorService $tailorService): void
    {
        \Log::info('updateProductStockForService called', [
            'product_id' => $productId, 
            'quantity' => $quantity, 
            'tailor_service_id' => $tailorService->id,
            'branch_id' => $tailorService->branch_id
        ]);
        
        // Get the branch and its accessible warehouses
        $branch = Branch::find($tailorService->branch_id);
        
        if (!$branch) {
            \Log::warning('No branch found', ['branch_id' => $tailorService->branch_id]);
            return; // No branch found, skip stock update
        }
        
        \Log::info('Branch found', ['branch_name' => $branch->name]);
        
        // Get the first warehouse that the branch can modify stock for
        $warehouse = $branch->warehouses()
            ->wherePivot('can_modify_stock', true)
            ->first();

        \Log::info('Branch warehouse check', ['warehouse' => $warehouse ? $warehouse->toArray() : null]);

        // If no accessible warehouse with modify permissions, try to get any warehouse for this account
        if (!$warehouse) {
            \Log::info('No branch warehouse found, looking for main warehouse');
            $warehouse = Warehouse::where('account_id', $tailorService->account_id)
                ->where('type', 'main')
                ->first();
        }

        if ($warehouse) {
            \Log::info('Using warehouse', ['warehouse_id' => $warehouse->id, 'warehouse_name' => $warehouse->name]);
            
            // Update product stock
            $productStock = ProductStock::firstOrCreate([
                'product_id' => $productId,
                'warehouse_id' => $warehouse->id,
                'account_id' => auth()->user()->account_id,
            ], [
                'quantity' => 0,
                'min_level' => 3,
            ]);

            \Log::info('Product stock before update', ['current_quantity' => $productStock->quantity]);
            
            $productStock->decrement('quantity', $quantity);
            
            \Log::info('Product stock after update', ['new_quantity' => $productStock->fresh()->quantity]);

            // Create stock movement record
            $stockMovement = StockMovement::create([
                'account_id' => $tailorService->account_id,
                'warehouse_id' => $warehouse->id,
                'product_id' => $productId,
                'movement_type' => 'xaric_olma',
                'quantity' => -$quantity,
                'reference_type' => 'service',
                'reference_id' => $tailorService->id,
                'employee_id' => $tailorService->employee_id ?? Auth::id(),
                'notes' => "Servis #{$tailorService->id} üçün istifadə olunan hissə",
            ]);
            
            \Log::info('Stock movement created', ['movement_id' => $stockMovement->id]);
        } else {
            \Log::warning('No warehouse found for stock update');
        }
    }

    private function returnProductStockForService(int $productId, float $quantity, TailorService $tailorService): void
    {
        // Get the branch and its accessible warehouses
        $branch = Branch::find($tailorService->branch_id);
        
        if (!$branch) {
            return; // No branch found, skip stock update
        }
        
        // Get the first warehouse that the branch can modify stock for
        $warehouse = $branch->warehouses()
            ->wherePivot('can_modify_stock', true)
            ->first();

        // If no accessible warehouse with modify permissions, try to get any warehouse for this account
        if (!$warehouse) {
            $warehouse = Warehouse::where('account_id', $tailorService->account_id)
                ->where('type', 'main')
                ->first();
        }

        if ($warehouse) {
            // Update product stock - return the quantity
            $productStock = ProductStock::firstOrCreate([
                'product_id' => $productId,
                'warehouse_id' => $warehouse->id,
                'account_id' => auth()->user()->account_id,
            ], [
                'quantity' => 0,
                'min_level' => 3,
            ]);

            $productStock->increment('quantity', $quantity);

            // Create stock movement record for return
            StockMovement::create([
                'account_id' => $tailorService->account_id,
                'warehouse_id' => $warehouse->id,
                'product_id' => $productId,
                'movement_type' => 'daxil_olma',
                'quantity' => $quantity,
                'reference_type' => 'service_return',
                'reference_id' => $tailorService->id,
                'employee_id' => $tailorService->employee_id ?? Auth::id(),
                'notes' => "Servis #{$tailorService->id} üçün geri qaytarılan hissə",
            ]);
        }
    }

    /**
     * Print service record receipt
     */
    public function print(Request $request, TailorService $tailorService)
    {
        Gate::authorize('access-account-data');

        $validated = $request->validate([
            'template_id' => 'nullable|exists:receipt_templates,template_id',
        ]);

        try {
            $printService = new ThermalPrintService();
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
    public function sendToPrinter(Request $request, TailorService $tailorService)
    {
        Gate::authorize('access-account-data');

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
    public function getPrintOptions(TailorService $tailorService)
    {
        Gate::authorize('access-account-data');

        $templates = ReceiptTemplate::where('account_id', Auth::user()->account_id)
            ->where('type', 'service')
            ->where('is_active', true)
            ->orderBy('is_default', 'desc')
            ->orderBy('name')
            ->get(['template_id', 'name', 'is_default']);

        return response()->json([
            'templates' => $templates,
            // Note: Printer configs disabled - using standard PC printing
        ]);
    }

    public function makeCredit(Request $request, TailorService $tailorService)
    {
        Gate::authorize('edit-account-data', $tailorService);

        $validated = $request->validate([
            'payment_status' => 'required|in:credit,partial',
            'paid_amount' => 'nullable|numeric|min:0',
            'credit_amount' => 'required|numeric|min:0.01',
            'credit_due_date' => 'nullable|date|after:today',
            'credit_description' => 'nullable|string|max:500',
        ]);

        // Validate amounts
        $totalCost = $tailorService->total_cost;
        $paidAmount = $validated['paid_amount'] ?? 0;
        $creditAmount = $validated['credit_amount'];

        if ($validated['payment_status'] === 'partial' && ($paidAmount + $creditAmount) != $totalCost) {
            return back()->withErrors(['amount' => 'Ödəmə məbləği və borc məbləği cəminin ümumi dəyərə bərabər olması lazımdır.']);
        }

        if ($validated['payment_status'] === 'credit' && $creditAmount != $totalCost) {
            return back()->withErrors(['credit_amount' => 'Borc məbləği ümumi dəyərə bərabər olmalıdır.']);
        }

        try {
            if ($validated['payment_status'] === 'credit') {
                $tailorService->setAsCredit(
                    $creditAmount, 
                    $validated['credit_due_date'], 
                    $validated['credit_description']
                );
            } else {
                $tailorService->setAsPartialPayment(
                    $paidAmount, 
                    $creditAmount, 
                    $validated['credit_due_date'], 
                    $validated['credit_description']
                );
            }

            return redirect()->back()->with('success', 'Servis borc statusu uğurla dəyişdirildi.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function payServiceCredit(Request $request, TailorService $tailorService)
    {
        Gate::authorize('edit-account-data', $tailorService);

        if (!$tailorService->hasUnpaidCredit() || !$tailorService->customer_credit_id) {
            return back()->withErrors(['error' => 'Bu servis üçün ödənilməmiş borc yoxdur.']);
        }

        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01|max:' . $tailorService->credit_amount,
            'description' => 'nullable|string|max:500',
        ]);

        try {
            $customerCredit = $tailorService->customerCredit;
            if ($customerCredit && $customerCredit->addPayment($validated['amount'], $validated['description'])) {
                // Update service record credit amount
                $tailorService->credit_amount -= $validated['amount'];
                $tailorService->paid_amount += $validated['amount'];

                if ($tailorService->credit_amount <= 0) {
                    $tailorService->payment_status = 'paid';
                    $tailorService->credit_amount = 0;
                }

                $tailorService->save();

                return redirect()->back()->with('success', 'Servis borcu ödəməsi uğurla edildi.');
            }

            return back()->withErrors(['error' => 'Ödəmə zamanı xəta baş verdi.']);
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Update or create Sale record for products used in service (during update)
     * This handles the case when a service record is edited
     */
    private function updateSaleFromServiceProducts(TailorService $tailorService, array $serviceItems, array $validated): void
    {
        // Find existing sale linked to this service record by notes
        $existingSale = Sale::where('account_id', $tailorService->account_id)
            ->where('notes', 'LIKE', "Servis qeydi #{$tailorService->service_number}%")
            ->first();

        // Filter only product items
        $productItems = array_filter($serviceItems, function($item) {
            return $item['item_type'] === 'product' && !empty($item['product_id']);
        });

        // If no products and no existing sale, nothing to do
        if (empty($productItems) && !$existingSale) {
            \Log::info('No product items and no existing sale, skipping');
            return;
        }

        // If no products but there is an existing sale, delete it
        if (empty($productItems) && $existingSale) {
            \Log::info('No products but existing sale found, deleting sale', ['sale_id' => $existingSale->sale_id]);
            $existingSale->items()->delete();
            $existingSale->payments()->delete();
            $existingSale->delete();
            return;
        }

        // If we have products, either update existing sale or create new one
        if (!empty($productItems)) {
            if ($existingSale) {
                \Log::info('Updating existing sale for service', ['sale_id' => $existingSale->sale_id]);

                // Calculate new totals
                $subtotal = 0;
                foreach ($productItems as $item) {
                    $itemTotal = $item['quantity'] * $item['unit_price'];
                    $subtotal += $itemTotal;
                }
                $total = $subtotal;

                // Determine correct payment status
                $paymentStatus = $validated['payment_status'] ?? $existingSale->payment_status;
                if ($paymentStatus === 'unpaid' || empty($paymentStatus)) {
                    $paymentStatus = 'paid';
                }

                // Calculate paid and credit amounts based on payment status
                $paidAmount = 0;
                $creditAmount = 0;

                if ($paymentStatus === 'paid') {
                    $paidAmount = $total;
                    $creditAmount = 0;
                } elseif ($paymentStatus === 'credit') {
                    $paidAmount = 0;
                    $creditAmount = $validated['credit_amount'] ?? $total;
                } elseif ($paymentStatus === 'partial') {
                    $paidAmount = $validated['paid_amount'] ?? 0;
                    $creditAmount = $validated['credit_amount'] ?? 0;
                }

                // Update sale totals and payment info
                $existingSale->update([
                    'subtotal' => $subtotal,
                    'total' => $total,
                    'payment_status' => $paymentStatus,
                    'paid_amount' => $paidAmount,
                    'credit_amount' => $creditAmount,
                    'credit_due_date' => $validated['credit_due_date'] ?? null,
                ]);

                // Update customer credit link
                if (isset($tailorService->customer_credit_id) && $tailorService->customer_credit_id) {
                    $existingSale->customer_credit_id = $tailorService->customer_credit_id;
                    $existingSale->save();
                }

                // Delete old sale items and create new ones
                $existingSale->items()->delete();
                foreach ($productItems as $item) {
                    SaleItem::create([
                        'sale_id' => $existingSale->sale_id,
                        'product_id' => $item['product_id'],
                        'quantity' => $item['quantity'],
                        'unit_price' => $item['unit_price'],
                        'discount_amount' => 0,
                        'total' => $item['quantity'] * $item['unit_price'],
                    ]);
                }

                // Update payment records
                $existingSale->payments()->delete();
                if ($validated['payment_status'] === 'paid') {
                    Payment::create([
                        'sale_id' => $existingSale->sale_id,
                        'method' => 'nağd',
                        'amount' => $total,
                        'notes' => "Servis qeydi #{$tailorService->service_number} - tam ödəniş",
                    ]);
                } elseif ($validated['payment_status'] === 'partial' && ($validated['paid_amount'] ?? 0) > 0) {
                    Payment::create([
                        'sale_id' => $existingSale->sale_id,
                        'method' => 'nağd',
                        'amount' => $validated['paid_amount'],
                        'notes' => "Servis qeydi #{$tailorService->service_number} - qismən ödəniş",
                    ]);
                }

                \Log::info('Sale updated successfully');
            } else {
                // No existing sale, create a new one
                \Log::info('No existing sale found, creating new one');
                $this->createSaleFromServiceProducts($tailorService, $serviceItems, $validated);
            }
        }
    }

    /**
     * Get customer items for a specific customer (AJAX)
     *
     * @param int $customerId
     * @return \Illuminate\Http\JsonResponse
     */
    public function getCustomerItems(int $customerId)
    {
        Gate::authorize('access-account-data');

        $accountId = auth()->user()->account_id;

        // Verify customer belongs to account
        $customer = Customer::where('account_id', $accountId)
            ->where('id', $customerId)
            ->firstOrFail();

        $items = CustomerItem::whereHas('customer', function($q) use ($accountId) {
                $q->where('account_id', $accountId);
            })
            ->where('customer_id', $customerId)
            ->where('is_active', true)
            ->get()
            ->map(function($item) {
                return [
                    'id' => $item->id,
                    'display_name' => $item->display_name ?? $item->full_name,
                    'full_description' => $item->full_description ?? $item->item_description,
                    'item_type' => $item->item_type,
                    'color' => $item->color,
                    'size' => $item->size,
                ];
            });

        return response()->json($items);
    }

    /**
     * Automatically create a Sale record for products used in service
     * This ensures that service products appear in sales records and incoming reports
     */
    private function createSaleFromServiceProducts(TailorService $tailorService, array $serviceItems, array $validated): ?Sale
    {
        // Filter only product items (not services)
        $productItems = array_filter($serviceItems, function($item) {
            return $item['item_type'] === 'product' && !empty($item['product_id']);
        });

        // If no products were used, don't create a sale
        if (empty($productItems)) {
            \Log::info('No product items in service, skipping sale creation');
            return null;
        }

        \Log::info('Creating sale from service products', ['service_id' => $tailorService->id, 'product_count' => count($productItems)]);

        try {
            // Calculate totals for products only
            $subtotal = 0;
            foreach ($productItems as $item) {
                $itemTotal = $item['quantity'] * $item['unit_price'];
                $subtotal += $itemTotal;
            }

            $taxAmount = 0;
            $discountAmount = 0;
            $total = $subtotal;

            // Determine correct payment status
            // Map 'unpaid' to 'paid' for sales (since we only create sales when there are actual products used)
            $paymentStatus = $validated['payment_status'] ?? 'paid';
            if ($paymentStatus === 'unpaid' || empty($paymentStatus)) {
                $paymentStatus = 'paid';
            }

            // Calculate paid and credit amounts based on payment status
            $paidAmount = 0;
            $creditAmount = 0;

            if ($paymentStatus === 'paid') {
                $paidAmount = $total;
                $creditAmount = 0;
            } elseif ($paymentStatus === 'credit') {
                $paidAmount = 0;
                $creditAmount = $validated['credit_amount'] ?? $total;
            } elseif ($paymentStatus === 'partial') {
                $paidAmount = $validated['paid_amount'] ?? 0;
                $creditAmount = $validated['credit_amount'] ?? 0;
            }

            // Create sale record linked to the service
            $sale = Sale::create([
                'account_id' => $tailorService->account_id,
                'branch_id' => $tailorService->branch_id,
                'customer_id' => $tailorService->customer_id,
                'subtotal' => $subtotal,
                'tax_amount' => $taxAmount,
                'discount_amount' => $discountAmount,
                'total' => $total,
                'status' => 'completed',
                'user_id' => Auth::id(),
                'notes' => "Servis qeydi #{$tailorService->service_number} üçün məhsullar",
                'sale_date' => $tailorService->service_date ?? now(),
                'payment_status' => $paymentStatus,
                'paid_amount' => $paidAmount,
                'credit_amount' => $creditAmount,
                'credit_due_date' => $validated['credit_due_date'] ?? null,
            ]);

            \Log::info('Sale created from service', ['sale_id' => $sale->sale_id, 'sale_number' => $sale->sale_number]);

            // Create sale items for each product
            foreach ($productItems as $item) {
                SaleItem::create([
                    'sale_id' => $sale->sale_id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'discount_amount' => 0,
                    'total' => $item['quantity'] * $item['unit_price'],
                ]);
            }

            // Handle credit if needed (similar to POS)
            if (($validated['payment_status'] === 'credit' || $validated['payment_status'] === 'partial') &&
                ($validated['credit_amount'] ?? 0) > 0) {
                $creditAmount = $validated['credit_amount'];

                // Link to the same customer credit as service record if exists
                if (isset($tailorService->customer_credit_id) && $tailorService->customer_credit_id) {
                    $sale->customer_credit_id = $tailorService->customer_credit_id;
                    $sale->save();
                    \Log::info('Linked sale to existing service credit', ['customer_credit_id' => $tailorService->customer_credit_id]);
                }
            }

            // Create payment record if paid or partial
            if ($validated['payment_status'] === 'paid') {
                Payment::create([
                    'sale_id' => $sale->sale_id,
                    'method' => 'nağd',
                    'amount' => $total,
                    'notes' => "Servis qeydi #{$tailorService->service_number} - tam ödəniş",
                ]);
                \Log::info('Payment created for sale', ['sale_id' => $sale->sale_id, 'amount' => $total]);
            } elseif ($validated['payment_status'] === 'partial' && ($validated['paid_amount'] ?? 0) > 0) {
                Payment::create([
                    'sale_id' => $sale->sale_id,
                    'method' => 'nağd',
                    'amount' => $validated['paid_amount'],
                    'notes' => "Servis qeydi #{$tailorService->service_number} - qismən ödəniş",
                ]);
                \Log::info('Partial payment created for sale', ['sale_id' => $sale->sale_id, 'amount' => $validated['paid_amount']]);
            }

            \Log::info('Sale creation from service completed successfully');
            return $sale;

        } catch (\Exception $e) {
            \Log::error('Failed to create sale from service products', [
                'service_id' => $tailorService->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            // Don't throw - we don't want to fail the entire service record creation if sale creation fails
            return null;
        }
    }
}
