<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Category;
use App\Models\Warehouse;
use App\Services\BarcodeService;
use App\Services\DocumentUploadService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class ProductController extends Controller
{
    private BarcodeService $barcodeService;
    private DocumentUploadService $documentService;

    public function __construct(BarcodeService $barcodeService, DocumentUploadService $documentService)
    {
        $this->middleware('auth');
        $this->middleware('account.access');
        $this->middleware('branch.access');
        $this->barcodeService = $barcodeService;
        $this->documentService = $documentService;
    }

    public function index(Request $request)
    {
        Gate::authorize('access-account-data');
        
        $request->validate([
            'search' => 'nullable|string|max:255',
            'category_id' => 'nullable|integer|exists:categories,id',
            'type' => 'nullable|string|in:product,service',
            'status' => 'nullable|string|in:active,inactive',
            'warehouse_id' => 'nullable|integer|exists:warehouses,id',
        ]);
        
        $user = Auth::user();
        $selectedWarehouseId = $request->session()->get('selected_warehouse_id');
        
        // Validate warehouse access for sales_staff
        if ($user->role === 'sales_staff' && $user->branch_id && $selectedWarehouseId) {
            $hasAccess = \App\Models\WarehouseBranchAccess::where('warehouse_id', $selectedWarehouseId)
                ->where('branch_id', $user->branch_id)
                ->where('can_view_stock', true)
                ->exists();
                
            if (!$hasAccess) {
                // Clear invalid warehouse selection
                $request->session()->forget('selected_warehouse_id');
                $selectedWarehouseId = null;
            }
        }
        
        $query = Product::with(['category']); // Show both products and services
        
        // For salesmen, only show products from warehouses they have access to
        if ($user->role === 'sales_staff' && $user->branch_id) {
            $accessibleWarehouses = Warehouse::where('account_id', $user->account_id)
                ->where('is_active', true)
                ->whereHas('branches', function($q) use ($user) {
                    $q->where('branch_id', $user->branch_id);
                })
                ->pluck('id');
                
            if ($accessibleWarehouses->count() > 0) {
                $query->whereHas('stock', function ($q) use ($accessibleWarehouses) {
                    $q->whereIn('warehouse_id', $accessibleWarehouses);
                });
            } else {
                // If no accessible warehouses, show no products
                $query->whereRaw('1 = 0');
            }
        }
        
        // Add warehouse-specific stock information
        if ($selectedWarehouseId) {
            $query->with(['stock' => function ($q) use ($selectedWarehouseId) {
                $q->where('warehouse_id', $selectedWarehouseId)->with('warehouse');
            }]);
        } else {
            $query->with(['stock.warehouse']);
        }
        
        // Filters
        if ($request->filled('search')) {
            $searchTerm = $request->input('search');
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', '%' . $searchTerm . '%')
                  ->orWhere('sku', 'like', '%' . $searchTerm . '%')
                  ->orWhere('barcode', 'like', '%' . $searchTerm . '%');
            });
        }
        
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }
        
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }
        
        if ($request->filled('status')) {
            if ($request->status === 'active') {
                $query->where('is_active', true);
            } elseif ($request->status === 'inactive') {
                $query->where('is_active', false);
            }
        }

        // Add warehouse filter
        if ($request->filled('warehouse_id')) {
            $warehouseFilter = $request->warehouse_id;
            $query->whereHas('stock', function ($q) use ($warehouseFilter) {
                $q->where('warehouse_id', $warehouseFilter);
            });
        }
        
        $products = $query->orderBy('name')->paginate(20);
        
        $categories = Category::where('account_id', Auth::user()->account_id)
            ->where('is_service', false)
            ->where('is_active', true)
            ->orderBy('name')
            ->get();
            
        // Filter warehouses for salesmen
        $warehousesQuery = Warehouse::where('is_active', true);
        if ($user->role === 'sales_staff' && $user->branch_id) {
            $warehousesQuery->whereHas('branches', function($q) use ($user) {
                $q->where('branch_id', $user->branch_id);
            });
        }
        $warehouses = $warehousesQuery->orderBy('name')->get();
        
        return Inertia::render('Products/Index', [
            'products' => $products,
            'categories' => $categories,
            'warehouses' => $warehouses,
            'filters' => $request->only(['search', 'category_id', 'type', 'status', 'warehouse_id']),
            'selectedWarehouse' => $selectedWarehouseId,
        ]);
    }

    public function create()
    {
        // Salesmen cannot create products
        if (Auth::user()->role === 'sales_staff') {
            abort(403, 'Satış əməkdaşları məhsul yarada bilməz.');
        }
        
        Gate::authorize('manage-products');
        
        $categories = Category::where('account_id', Auth::user()->account_id)
            ->where('is_service', false)
            ->where('is_active', true)
            ->orderBy('name')
            ->get();
        $warehouses = Warehouse::where('account_id', Auth::user()->account_id)
            ->where('is_active', true)->orderBy('name')->get();
        
        return Inertia::render('Products/Create', [
            'categories' => $categories,
            'warehouses' => $warehouses
        ]);
    }

    public function store(Request $request)
    {
        // Salesmen cannot create products
        if (Auth::user()->role === 'sales_staff') {
            abort(403, 'Satış əməkdaşları məhsul yarada bilməz.');
        }
        
        Gate::authorize('manage-products');
        
        // Base validation rules
        $rules = [
            'name' => 'required|string|max:255',
            'category_id' => 'nullable|exists:categories,id,account_id,' . Auth::user()->account_id,
            'type' => 'required|in:product,service',
            'description' => 'nullable|string',
            'sale_price' => 'required|numeric|min:0',
            'unit' => 'required|string|max:20',
            'allow_negative_stock' => 'boolean',
            'attributes' => 'nullable|array',
        ];

        // Add product-specific validation rules
        if ($request->type === 'product') {
            $rules = array_merge($rules, [
                'sku' => 'nullable|string|max:100|unique:products,sku,NULL,id,account_id,' . Auth::user()->account_id,
                // Custom barcodes: account-scoped (multiple accounts can use same manufacturer barcode)
                // Auto-generated barcodes: globally unique (handled by BarcodeService)
                'barcode' => 'nullable|string|max:100|unique:products,barcode,NULL,id,account_id,' . Auth::user()->account_id,
                'barcode_type' => 'nullable|in:EAN-13,UPC-A,Code-128,QR-Code',
                'has_custom_barcode' => 'boolean',
                'purchase_price' => 'required|numeric|min:0',
                'packaging_size' => 'nullable|string|max:50',
                'base_unit' => 'nullable|string|max:20',
                'packaging_quantity' => 'nullable|numeric|min:0.01',
                'weight' => 'nullable|numeric|min:0',
                'dimensions' => 'nullable|string|max:100',
                'brand' => 'nullable|string|max:100',
                'model' => 'nullable|string|max:100',
                'initial_stock' => 'nullable|array',
                'initial_stock.*.warehouse_id' => 'required|exists:warehouses,id,account_id,' . Auth::user()->account_id,
                'initial_stock.*.quantity' => 'required|numeric|min:0',
                'initial_stock.*.min_level' => 'nullable|numeric|min:0',
                'initial_stock.*.location' => 'nullable|string|max:100',
                // Clothing attributes - mandatory
                'attributes.size' => 'required|string|max:50',
                'attributes.color' => 'required|string|max:100',
            ]);
        }

        $request->validate($rules);

        DB::transaction(function () use ($request) {
            // Base fields for both products and services
            $productData = $request->only([
                'name', 'category_id', 'type', 'description', 'sale_price', 'unit', 'attributes'
            ]);
            
            // Add product-specific fields
            if ($request->type === 'product') {
                $productData = array_merge($productData, $request->only([
                    'sku', 'purchase_price', 'packaging_size', 'base_unit', 
                    'packaging_quantity', 'weight', 'dimensions', 'brand', 'model'
                ]));
                
                $productData['allow_negative_stock'] = $request->boolean('allow_negative_stock');
                $productData['has_custom_barcode'] = $request->boolean('has_custom_barcode');

                // Fallback base_unit to unit if not provided
                if (empty($productData['base_unit'])) {
                    $productData['base_unit'] = $request->unit ?? 'ədəd';
                }

                // Set default packaging_quantity if not provided
                if (empty($productData['packaging_quantity'])) {
                    $productData['packaging_quantity'] = 1;
                }
                
                // Generate barcode if not provided
                if (!$request->has_custom_barcode && empty($request->barcode)) {
                    $productData['barcode'] = $this->barcodeService->generateUniqueBarcode(
                        Auth::user()->account_id,
                        $request->barcode_type ?? 'Code-128'
                    );
                    $productData['barcode_type'] = $request->barcode_type ?? 'Code-128';
                } else {
                    $productData['barcode'] = $request->barcode;
                    $productData['barcode_type'] = $request->barcode_type;
                }
            } else {
                // Services: Set default values for fields that are required in the database
                $productData['purchase_price'] = 0;
                $productData['base_unit'] = $request->unit ?? 'ədəd';
                $productData['packaging_quantity'] = 1;
                $productData['allow_negative_stock'] = true; // Services don't need stock tracking
            }
            
            $product = Product::create($productData);
            
            // Auto-parse packaging size if provided (products only)
            if ($request->type === 'product' && !empty($productData['packaging_size'])) {
                $product->updatePackagingFromSize();
                $product->save();
            }
            
            // Create initial stock entries (products only)
            if ($request->type === 'product' && $request->filled('initial_stock')) {
                foreach ($request->initial_stock as $stock) {
                    if ($stock['quantity'] > 0) {
                        $product->stock()->create([
                            'warehouse_id' => $stock['warehouse_id'],
                            'quantity' => $stock['quantity'],
                            'min_level' => $stock['min_level'] ?? 0,
                            'location' => $stock['location'] ?? null,
                        ]);
                        
                        // Create stock history entry
                        $product->stockHistory()->create([
                            'warehouse_id' => $stock['warehouse_id'],
                            'quantity_before' => 0,
                            'quantity_change' => $stock['quantity'],
                            'quantity_after' => $stock['quantity'],
                            'type' => 'daxil_olma',
                            'reference_type' => 'initial',
                            'user_id' => Auth::id(),
                            'notes' => 'İlkin stok',
                            'occurred_at' => now(),
                        ]);
                    }
                }
            }
        });

        return redirect()->route('products.index')
                        ->with('success', __('app.saved_successfully'));
    }

    public function show(Product $product)
    {
        Gate::authorize('access-account-data', $product);
        
        $product->load([
            'category',
            'stock.warehouse',
            'stockHistory' => function ($query) {
                $query->with(['warehouse', 'user'])->latest('occurred_at')->take(10);
            },
            'documents.uploader'
        ]);

        // Format documents for frontend
        $formattedDocuments = $product->documents->map(function ($doc) {
            return [
                'id' => $doc->id,
                'original_name' => $doc->original_name,
                'file_type' => $doc->file_type,
                'file_size' => $doc->file_size,
                'document_type' => $doc->document_type,
                'description' => $doc->description,
                'uploaded_at' => $doc->created_at->toISOString(),
                'uploaded_by' => $doc->uploader?->name,
                'download_url' => $this->documentService->getDocumentUrl($doc),
                'thumbnail_url' => $this->documentService->getThumbnailUrl($doc),
            ];
        });
        
        return Inertia::render('Products/Show', [
            'product' => $product,
            'documents' => $formattedDocuments
        ]);
    }

    public function edit(Product $product)
    {
        Gate::authorize('manage-products');
        Gate::authorize('access-account-data', $product);
        
        $categories = Category::where('account_id', Auth::user()->account_id)
            ->where('is_service', false)
            ->where('is_active', true)
            ->orderBy('name')
            ->get();
        $warehouses = Warehouse::where('account_id', Auth::user()->account_id)
            ->where('is_active', true)->orderBy('name')->get();
        
        $product->load(['stock.warehouse', 'documents.uploader']);

        // Format documents for frontend
        $formattedDocuments = $product->documents->map(function ($doc) {
            return [
                'id' => $doc->id,
                'original_name' => $doc->original_name,
                'file_type' => $doc->file_type,
                'file_size' => $doc->file_size,
                'document_type' => $doc->document_type,
                'description' => $doc->description,
                'uploaded_at' => $doc->created_at->toISOString(),
                'uploaded_by' => $doc->uploader?->name,
                'download_url' => $this->documentService->getDocumentUrl($doc),
                'thumbnail_url' => $this->documentService->getThumbnailUrl($doc),
            ];
        });
        
        return Inertia::render('Products/Edit', [
            'product' => $product,
            'categories' => $categories,
            'warehouses' => $warehouses,
            'documents' => $formattedDocuments
        ]);
    }

    public function update(Request $request, Product $product)
    {
        // Salesmen cannot update products
        if (Auth::user()->role === 'sales_staff') {
            abort(403, 'Satış əməkdaşları məhsulu redaktə edə bilməz.');
        }
        
        Gate::authorize('manage-products');
        Gate::authorize('access-account-data', $product);
        
        // Handle partial update for status toggle
        if ($request->has('is_active') && count($request->all()) === 1) {
            $request->validate([
                'is_active' => 'required|boolean',
            ]);
            
            $product->update([
                'is_active' => $request->boolean('is_active')
            ]);
            
            $status = $request->boolean('is_active') ? 'aktiv' : 'deaktiv';
            return redirect()->route('products.index')
                            ->with('success', "Məhsul {$status} edildi.");
        }
        
        // Full product update validation
        $rules = [
            'name' => 'required|string|max:255',
            'sku' => 'nullable|string|max:100|unique:products,sku,' . $product->id . ',id,account_id,' . Auth::user()->account_id,
            'barcode' => 'nullable|string|max:100|unique:products,barcode,' . $product->id . ',id,account_id,' . Auth::user()->account_id,
            'barcode_type' => 'nullable|in:EAN-13,UPC-A,Code-128,QR-Code',
            'has_custom_barcode' => 'boolean',
            'category_id' => 'nullable|exists:categories,id,account_id,' . Auth::user()->account_id,
            'type' => 'required|in:product,service',
            'description' => 'nullable|string',
            'purchase_price' => 'required|numeric|min:0',
            'sale_price' => 'required|numeric|min:0',
            'unit' => 'required|string|max:20',
            'packaging_size' => 'nullable|string|max:50',
            'base_unit' => 'required|string|max:20',
            'packaging_quantity' => 'required|numeric|min:0.01',
            'allow_negative_stock' => 'boolean',
            'weight' => 'nullable|numeric|min:0',
            'dimensions' => 'nullable|string|max:100',
            'brand' => 'nullable|string|max:100',
            'model' => 'nullable|string|max:100',
            'attributes' => 'nullable|array',
            'is_active' => 'boolean',
        ];

        // Add clothing attributes validation for products
        if ($request->type === 'product') {
            $rules['attributes.size'] = 'required|string|max:50';
            $rules['attributes.color'] = 'required|string|max:100';
        }

        $request->validate($rules);

        $productData = $request->only([
            'name', 'sku', 'category_id', 'type', 'description',
            'purchase_price', 'sale_price', 'unit', 'packaging_size',
            'base_unit', 'packaging_quantity', 'weight',
            'dimensions', 'brand', 'model', 'attributes'
        ]);
        
        $productData['allow_negative_stock'] = $request->boolean('allow_negative_stock');
        $productData['has_custom_barcode'] = $request->boolean('has_custom_barcode');
        $productData['is_active'] = $request->boolean('is_active', true);
        
        // Handle barcode changes
        if ($request->filled('barcode') && $request->barcode !== $product->barcode) {
            $productData['barcode'] = $request->barcode;
            $productData['barcode_type'] = $request->barcode_type;
        }
        
        $product->update($productData);
        
        // Auto-parse packaging size if provided
        if (!empty($productData['packaging_size'])) {
            $product->updatePackagingFromSize();
            $product->save();
        }

        return redirect()->route('products.show', $product)
                        ->with('success', __('app.updated_successfully'));
    }

    public function destroy(Product $product)
    {
        // Salesmen cannot delete products
        if (Auth::user()->role === 'sales_staff') {
            abort(403, 'Satış əməkdaşları məhsulu silə bilməz.');
        }
        
        Gate::authorize('manage-products');
        Gate::authorize('access-account-data', $product);
        
        // Check if product has been used in any transactions
        if ($product->stockHistory()->count() > 0) {
            return back()->withErrors(['error' => 'İstifadə edilmiş məhsul silinə bilməz. Deaktiv edin.']);
        }
        
        $product->delete();

        return redirect()->route('products.index')
                        ->with('success', __('app.deleted_successfully'));
    }

    public function calculatePrice(Request $request, Product $product)
    {
        Gate::authorize('access-account-data', $product);
        
        $request->validate([
            'quantity' => 'required|numeric|min:0.001'
        ]);
        
        $quantity = $request->input('quantity');
        $calculatedPrice = $product->calculatePriceForQuantity($quantity);
        
        return response()->json([
            'unit_price' => $calculatedPrice / $quantity,
            'total_price' => $calculatedPrice,
            'base_unit' => $product->display_unit,
            'packaging_info' => [
                'packaging_size' => $product->packaging_size,
                'packaging_quantity' => $product->packaging_quantity,
                'unit_price' => $product->unit_price
            ]
        ]);
    }

    public function generateBarcode(Request $request)
    {
        Gate::authorize('manage-products');
        
        $request->validate([
            'type' => 'required|in:EAN-13,UPC-A,Code-128,QR-Code'
        ]);
        
        // Map frontend types to backend types
        $typeMapping = [
            'EAN-13' => 'EAN13',
            'UPC-A' => 'UPCA',
            'Code-128' => 'CODE128',
            'QR-Code' => 'CODE128', // Fallback since QR codes aren't supported by BarcodeService
        ];
        
        $backendType = $typeMapping[$request->type] ?? 'EAN13';
        
        $barcode = $this->barcodeService->generateUniqueBarcode(
            Auth::user()->account_id,
            $backendType
        );
        
        return response()->json(['barcode' => $barcode]);
    }

    public function search(Request $request)
    {
        try {
            Gate::authorize('access-account-data');
            
            $request->validate([
                'q' => 'required|string|max:255',
                'include_services' => 'nullable|string',
                'branch_id' => 'nullable|integer|exists:branches,id',
                'service_type' => 'nullable|string|in:tailor,phone_repair,electronics,general',
            ]);

            $query = $request->input('q');
            $includeServices = $request->boolean('include_services', false);
            $branchId = $request->input('branch_id');
            $serviceType = $request->input('service_type');

            $productsQuery = Product::where('account_id', Auth::user()->account_id);

            if ($includeServices) {
                // For service mode, include both products and services
                $productsQuery->whereIn('type', ['product', 'service']);
            } else {
                // For sale mode, only products
                $productsQuery->where('type', 'product');
            }

            // Filter by service_type if provided
            if ($serviceType) {
                $productsQuery->byServiceType($serviceType);
            }
            
            $productsQuery = $productsQuery->where(function ($q) use ($query) {
                $q->where('name', 'like', '%' . $query . '%')
                  ->orWhere('sku', 'like', '%' . $query . '%')
                  ->orWhere('barcode', 'like', '%' . $query . '%');
            });

            // If branch is selected, only show products that have stock in warehouses accessible to that branch
            if ($branchId) {
                $productsQuery->whereHas('stock', function ($stockQuery) use ($branchId) {
                    $stockQuery->whereHas('warehouse', function ($warehouseQuery) use ($branchId) {
                        $warehouseQuery->whereHas('branches', function ($branchQuery) use ($branchId) {
                            $branchQuery->where('branches.id', $branchId)
                                ->where('warehouse_branch_access.can_view_stock', true);
                        });
                    });
                });
            }

            $products = $productsQuery
                ->select('id', 'name', 'sku', 'barcode', 'unit', 'base_unit', 'packaging_quantity', 'sale_price', 'unit_price', 'packaging_size', 'allow_negative_stock', 'type')
                ->with(['stock' => function ($stockQuery) use ($branchId) {
                    $stockQuery->select('product_id', 'quantity', 'warehouse_id');
                    
                    // If branch is selected, only include stock from warehouses accessible to that branch
                    if ($branchId) {
                        $stockQuery->whereHas('warehouse', function ($warehouseQuery) use ($branchId) {
                            $warehouseQuery->whereHas('branches', function ($branchQuery) use ($branchId) {
                                $branchQuery->where('branches.id', $branchId)
                                    ->where('warehouse_branch_access.can_view_stock', true);
                            });
                        });
                    }
                }])
                ->limit(10)
                ->get()
                ->map(function ($product) {
                    // Services don't have stock, set to null for services
                    if ($product->type === 'service') {
                        $product->filtered_stock = null;
                    } else {
                        // Calculate total stock from filtered warehouses for products
                        // Use the relationship or default to empty collection to avoid errors
                        $stockCollection = $product->stock ?? collect();
                        $product->filtered_stock = $stockCollection->sum('quantity');
                    }
                    return $product;
                });
            
            return response()->json($products);
        } catch (\Exception $e) {
            \Log::error('Product search error: ' . $e->getMessage(), [
                'query' => $request->input('q', ''),
                'user_id' => Auth::id(),
                'exception' => $e->getTraceAsString()
            ]);
            return response()->json(['error' => 'Search failed'], 500);
        }
    }
}
