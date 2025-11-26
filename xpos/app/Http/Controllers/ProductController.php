<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Category;
use App\Models\Warehouse;
use App\Models\Branch;
use App\Services\BarcodeService;
use App\Services\DocumentUploadService;
use App\Services\ProductPhotoService;
use App\Imports\ProductsImport;
use App\Exports\ProductsTemplateExport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class ProductController extends Controller
{
    private BarcodeService $barcodeService;
    private DocumentUploadService $documentService;
    private ProductPhotoService $photoService;

    public function __construct(
        BarcodeService $barcodeService,
        DocumentUploadService $documentService,
        ProductPhotoService $photoService
    ) {
        $this->middleware('auth');
        $this->middleware('account.access');
        $this->middleware('branch.access');
        $this->barcodeService = $barcodeService;
        $this->documentService = $documentService;
        $this->photoService = $photoService;
    }

    /**
     * Search products for parent product selector
     * Returns only parent products (no child variants)
     */
    public function searchParentProducts(Request $request)
    {
        Gate::authorize('access-account-data');

        $request->validate([
            'q' => 'nullable|string|max:255',
            'limit' => 'nullable|integer|min:1|max:50',
        ]);

        $user = Auth::user();
        $query = $request->input('q', '');
        $limit = $request->input('limit', 20);

        $products = Product::where('account_id', $user->account_id)
            ->where('type', 'product')
            ->parentProducts()  // Only parent products
            ->active()
            ->where(function($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                  ->orWhere('sku', 'like', "%{$query}%")
                  ->orWhere('id', $query);
            })
            ->select('id', 'name', 'sku', 'image_url')
            ->orderBy('name')
            ->limit($limit)
            ->get();

        return response()->json([
            'data' => $products->map(fn($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'sku' => $p->sku,
                'label' => $p->name . ($p->sku ? " ({$p->sku})" : ''),
            ])
        ]);
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

    public function bulkCreate()
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
            ->where('is_active', true)
            ->orderBy('name')
            ->get();
        
        return Inertia::render('Products/BulkCreate', [
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
            'parent_product_id' => 'nullable|exists:products,id,account_id,' . Auth::user()->account_id,
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
                // Clothing attributes - optional (only for non-variants or if specified)
                'attributes.size' => 'nullable|string|max:50',
                'attributes.color' => 'nullable|string|max:100',
                'attributes.color_code' => 'nullable|string|max:7',
            ]);
        }

        // Add photo validation
        if ($request->hasFile('photos')) {
            $rules['photos'] = 'array|max:' . ProductPhotoService::getMaxPhotos();
            $rules['photos.*'] = 'image|mimes:jpeg,png,gif,webp|max:' . (ProductPhotoService::getMaxFileSize() / 1024);
        }

        $request->validate($rules);

        $product = DB::transaction(function () use ($request) {
            // Base fields for both products and services
            $productData = $request->only([
                'name', 'category_id', 'parent_product_id', 'type', 'description', 'sale_price', 'unit', 'attributes'
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

            // Upload photos if provided
            if ($request->hasFile('photos')) {
                try {
                    $primaryIndex = $request->input('primary_photo_index', 0);
                    foreach ($request->file('photos') as $index => $file) {
                        $isPrimary = ($index == $primaryIndex);
                        $this->photoService->uploadPhoto($product, $file, $isPrimary);
                    }
                } catch (\Exception $e) {
                    \Log::error('Photo upload failed during product creation: ' . $e->getMessage());
                    // Continue - don't fail product creation if photo upload fails
                }
            }

            return $product;
        });

        return redirect()->route('products.index')
                        ->with('success', __('app.saved_successfully'));
    }

    public function bulkStore(Request $request)
    {
        // Salesmen cannot create products
        if (Auth::user()->role === 'sales_staff') {
            abort(403, 'Satış əməkdaşları məhsul yarada bilməz.');
        }
        
        Gate::authorize('manage-products');
        
        $request->validate([
            'category_id' => 'required|exists:categories,id,account_id,' . Auth::user()->account_id,
            'sale_price' => 'required|numeric|min:0',
            'purchase_price' => 'required|numeric|min:0',
            'unit' => 'required|string|max:20',
            'products' => 'required|array|min:1|max:50',
            'products.*.name' => 'required|string|max:255',
            'products.*.sku' => 'nullable|string|max:100',
            'products.*.barcode' => 'nullable|string|max:100',
            'products.*.size' => 'nullable|string|max:50',
            'products.*.color' => 'nullable|string|max:100',
            'products.*.initial_quantity' => 'nullable|numeric|min:0',
            'products.*.warehouse_id' => 'nullable|exists:warehouses,id,account_id,' . Auth::user()->account_id,
        ]);

        $products = [];
        $user = Auth::user();
        $accountId = $user->account_id;

        DB::transaction(function () use ($request, &$products, $accountId) {
            foreach ($request->products as $productData) {
                // Prepare product data
                $data = [
                    'account_id' => $accountId,
                    'name' => $productData['name'],
                    'category_id' => $request->category_id,
                    'type' => 'product',
                    'sale_price' => $request->sale_price,
                    'purchase_price' => $request->purchase_price,
                    'unit' => $request->unit,
                    'base_unit' => $request->unit,
                    'packaging_quantity' => 1,
                    'allow_negative_stock' => false,
                    'has_custom_barcode' => !empty($productData['barcode']),
                    'is_active' => true,
                ];

                // Add optional fields
                if (!empty($productData['sku'])) {
                    $data['sku'] = $productData['sku'];
                }

                // Handle barcode
                if (!empty($productData['barcode'])) {
                    // Check for duplicate barcode within account
                    $existingProduct = Product::where('account_id', $accountId)
                        ->where('barcode', $productData['barcode'])
                        ->first();
                    
                    if ($existingProduct) {
                        throw new \Exception("Barcode '{$productData['barcode']}' already exists for product '{$existingProduct->name}'");
                    }
                    
                    $data['barcode'] = $productData['barcode'];
                    $data['barcode_type'] = 'EAN-13';
                    $data['has_custom_barcode'] = true;
                } else {
                    // Generate unique barcode using EAN-13 (matching existing system)
                    $data['barcode'] = $this->barcodeService->generateUniqueBarcode($accountId, 'EAN13');
                    $data['barcode_type'] = 'EAN-13';
                    $data['has_custom_barcode'] = false;
                }

                // Add clothing attributes if provided
                $attributes = [];
                if (!empty($productData['size'])) {
                    $attributes['size'] = $productData['size'];
                }
                if (!empty($productData['color'])) {
                    $attributes['color'] = $productData['color'];
                }
                if (!empty($attributes)) {
                    $data['attributes'] = $attributes;
                }

                // Check for duplicate SKU within account if provided
                if (!empty($data['sku'])) {
                    $existingSku = Product::where('account_id', $accountId)
                        ->where('sku', $data['sku'])
                        ->first();
                    
                    if ($existingSku) {
                        throw new \Exception("SKU '{$data['sku']}' already exists for product '{$existingSku->name}'");
                    }
                }

                $product = Product::create($data);
                
                // Create initial stock if this product has warehouse and quantity
                if (!empty($productData['warehouse_id']) && 
                    !empty($productData['initial_quantity']) && 
                    $productData['initial_quantity'] > 0) {
                    
                    $product->stock()->create([
                        'warehouse_id' => $productData['warehouse_id'],
                        'quantity' => $productData['initial_quantity'],
                        'min_level' => 0,
                        'location' => null,
                    ]);

                    // Create stock history entry
                    $product->stockHistory()->create([
                        'warehouse_id' => $productData['warehouse_id'],
                        'quantity_before' => 0,
                        'quantity_change' => $productData['initial_quantity'],
                        'quantity_after' => $productData['initial_quantity'],
                        'type' => 'daxil_olma',
                        'reference_type' => 'initial',
                        'user_id' => Auth::id(),
                        'notes' => 'İlkin stok - Toplu yaratma',
                        'occurred_at' => now(),
                    ]);
                }
                
                $products[] = $product;
            }
        });

        $count = count($products);
        return redirect()->route('products.index')
                        ->with('success', "{$count} məhsul uğurla yaradıldı");
    }

    public function show(Product $product)
    {
        Gate::authorize('access-account-data', $product);

        $product->load([
            'category',
            'parentProduct',
            'stock.warehouse',
            'stockHistory' => function ($query) {
                $query->with(['warehouse', 'user'])->latest('occurred_at')->take(10);
            },
            'documents.uploader',
            'orderedPhotos',
            'prices.branch'
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

        // Format photos for frontend
        $formattedPhotos = $product->orderedPhotos->map(function ($photo) {
            $originalPath = $photo->original_path;
            $mediumPath = $photo->medium_path ?: $photo->original_path;
            $thumbnailPath = $photo->thumbnail_path ?: ($photo->medium_path ?: $photo->original_path);

            return [
                'id' => $photo->id,
                'original_url' => $this->photoService->getPhotoUrl($originalPath),
                'medium_url' => $this->photoService->getPhotoUrl($mediumPath),
                'thumbnail_url' => $this->photoService->getPhotoUrl($thumbnailPath),
                'is_primary' => $photo->is_primary,
                'alt_text' => $photo->alt_text,
                'sort_order' => $photo->sort_order,
            ];
        });

        // Get branches for discount form
        $branches = \App\Models\Branch::where('account_id', Auth::user()->account_id)
            ->select('id', 'name')
            ->get();

        return Inertia::render('Products/Show', [
            'product' => $product,
            'documents' => $formattedDocuments,
            'photos' => $formattedPhotos,
            'branches' => $branches,
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

        $product->load(['stock.warehouse', 'documents.uploader', 'orderedPhotos', 'parentProduct']);

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

        // Format photos for frontend
        $formattedPhotos = $product->orderedPhotos->map(function ($photo) {
            $originalPath = $photo->original_path;
            $mediumPath = $photo->medium_path ?: $photo->original_path;
            $thumbnailPath = $photo->thumbnail_path ?: ($photo->medium_path ?: $photo->original_path);

            return [
                'id' => $photo->id,
                'original_url' => $this->photoService->getPhotoUrl($originalPath),
                'medium_url' => $this->photoService->getPhotoUrl($mediumPath),
                'thumbnail_url' => $this->photoService->getPhotoUrl($thumbnailPath),
                'is_primary' => $photo->is_primary,
                'alt_text' => $photo->alt_text,
                'sort_order' => $photo->sort_order,
            ];
        });

        // Format parent product info if this is a variant
        $parentProductInfo = null;
        if ($product->parent_product_id && $product->parentProduct) {
            $parentProductInfo = [
                'id' => $product->parentProduct->id,
                'name' => $product->parentProduct->name,
                'sku' => $product->parentProduct->sku,
            ];
        }

        return Inertia::render('Products/Edit', [
            'product' => $product,
            'parentProduct' => $parentProductInfo,
            'categories' => $categories,
            'warehouses' => $warehouses,
            'documents' => $formattedDocuments,
            'photos' => $formattedPhotos,
            'maxPhotos' => ProductPhotoService::getMaxPhotos(),
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
            'parent_product_id' => 'nullable|exists:products,id,account_id,' . Auth::user()->account_id,
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

        // Add clothing attributes validation for products (optional now for variants)
        if ($request->type === 'product') {
            $rules['attributes.size'] = 'nullable|string|max:50';
            $rules['attributes.color'] = 'nullable|string|max:100';
            $rules['attributes.color_code'] = 'nullable|string|max:7';
        }

        $request->validate($rules);

        $productData = $request->only([
            'name', 'sku', 'category_id', 'parent_product_id', 'type', 'description',
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

        // Delete all product photos
        try {
            $this->photoService->deleteAllProductPhotos($product);
        } catch (\Exception $e) {
            \Log::error('Failed to delete product photos during product deletion: ' . $e->getMessage());
            // Continue with product deletion even if photo deletion fails
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
                ->with('prices')
                ->limit(10)
                ->get()
                ->map(function ($product) use ($branchId) {
                    // Services don't have stock, set to null for services
                    if ($product->type === 'service') {
                        $product->filtered_stock = null;
                    } else {
                        // Calculate total stock from filtered warehouses for products
                        // Use the relationship or default to empty collection to avoid errors
                        $stockCollection = $product->stock ?? collect();
                        $product->filtered_stock = $stockCollection->sum('quantity');
                    }

                    // Apply discount if available
                    $effectivePrice = $product->getEffectivePrice($branchId);
                    $discount = $product->getActiveDiscount($branchId);

                    $product->sale_price = $effectivePrice;
                    $product->original_price = $discount ? $discount['original_price'] : null;
                    $product->discount_percentage = $discount ? $discount['discount_percentage'] : null;
                    $product->has_discount = $discount !== null;

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

    /**
     * Display all products with active discounts
     */
    public function discounts(Request $request)
    {
        Gate::authorize('access-account-data');

        $branchId = $request->input('branch_id');
        $tab = $request->input('tab', 'active'); // 'active' or 'history'

        // Get all products that have active, effective prices with discounts
        $products = Product::where('account_id', Auth::user()->account_id)
            ->where('type', 'product')
            ->where('is_active', true)
            ->whereHas('prices', function ($query) use ($branchId, $tab) {
                $query->active()
                      ->where('discount_percentage', '>', 0);

                // Apply effective or expired scope based on tab
                if ($tab === 'history') {
                    $query->expired();
                } else {
                    $query->effective();
                }

                if ($branchId) {
                    $query->where(function ($q) use ($branchId) {
                        $q->where('branch_id', $branchId)
                          ->orWhereNull('branch_id');
                    });
                } else {
                    $query->whereNull('branch_id');
                }
            })
            ->with(['prices' => function ($query) use ($branchId, $tab) {
                $query->active()
                      ->where('discount_percentage', '>', 0);

                // Apply effective or expired scope based on tab
                if ($tab === 'history') {
                    $query->expired();
                } else {
                    $query->effective();
                }

                if ($branchId) {
                    $query->where(function ($q) use ($branchId) {
                        $q->where('branch_id', $branchId)
                          ->orWhereNull('branch_id');
                    });
                } else {
                    $query->whereNull('branch_id');
                }
            }, 'prices.branch', 'category'])
            ->orderBy('name')
            ->paginate(20)
            ->through(function ($product) use ($branchId) {
                $discount = $product->getActiveDiscount($branchId);

                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'category' => $product->category?->name,
                    'original_price' => $product->sale_price,
                    'discount_percentage' => $discount ? $discount['discount_percentage'] : 0,
                    'discounted_price' => $discount ? $discount['discounted_price'] : $product->sale_price,
                    'savings' => $discount ? ($product->sale_price - $discount['discounted_price']) : 0,
                    'effective_from' => $discount ? $discount['effective_from'] : null,
                    'effective_until' => $discount ? $discount['effective_until'] : null,
                    'branch_name' => $product->prices->first()?->branch?->name ?? 'Bütün filiallar',
                ];
            });

        return Inertia::render('Products/Discounts/Index', [
            'products' => $products,
            'branches' => Branch::where('account_id', Auth::user()->account_id)
                ->select('id', 'name')
                ->get(),
            'filters' => [
                'branch_id' => $branchId,
                'tab' => $tab,
            ],
        ]);
    }

    /**
     * Download Excel template for bulk product import
     */
    public function downloadTemplate()
    {
        // Salesmen cannot import products
        if (Auth::user()->role === 'sales_staff') {
            abort(403, 'Satış əməkdaşları məhsul import edə bilməz.');
        }

        Gate::authorize('manage-products');

        return Excel::download(
            new ProductsTemplateExport(),
            'products_import_template_' . date('Y-m-d') . '.xlsx'
        );
    }

    /**
     * Import products from Excel file
     */
    public function import(Request $request)
    {
        // Salesmen cannot import products
        if (Auth::user()->role === 'sales_staff') {
            abort(403, 'Satış əməkdaşları məhsul import edə bilməz.');
        }

        Gate::authorize('manage-products');

        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv|max:10240', // 10MB max
        ]);

        try {
            $import = new ProductsImport(Auth::user()->account_id);
            Excel::import($import, $request->file('file'));

            $summary = $import->getSummary();

            if ($summary['errors'] > 0) {
                return back()->with([
                    'success' => "{$summary['success']} məhsul uğurla import edildi.",
                    'warning' => "{$summary['errors']} sətr xəta ilə atlandı.",
                    'import_errors' => $summary['error_details'],
                ]);
            }

            return redirect()->route('products.index')
                ->with('success', "{$summary['success']} məhsul uğurla import edildi.");

        } catch (\Maatwebsite\Excel\Validators\ValidationException $e) {
            $failures = $e->failures();
            $errors = [];

            foreach ($failures as $failure) {
                $errors[] = [
                    'row' => $failure->row(),
                    'attribute' => $failure->attribute(),
                    'errors' => $failure->errors(),
                ];
            }

            return back()->withErrors([
                'file' => 'Import faylında xəta var.',
            ])->with('import_errors', $errors);

        } catch (\Exception $e) {
            \Log::error('Product import error: ' . $e->getMessage(), [
                'user_id' => Auth::id(),
                'exception' => $e->getTraceAsString()
            ]);

            return back()->withErrors([
                'file' => 'Import zamanı xəta baş verdi: ' . $e->getMessage(),
            ]);
        }
    }
}
