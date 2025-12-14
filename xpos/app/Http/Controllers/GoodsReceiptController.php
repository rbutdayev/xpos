<?php

namespace App\Http\Controllers;

use App\Models\GoodsReceipt;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Supplier;
use App\Models\Warehouse;
use App\Models\StockMovement;
use App\Models\StockHistory;
use App\Models\ProductStock;
use App\Services\DocumentUploadService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class GoodsReceiptController extends Controller
{
    private DocumentUploadService $documentService;

    public function __construct(DocumentUploadService $documentService)
    {
        $this->middleware('auth');
        $this->middleware('account.access');
        $this->documentService = $documentService;
    }

    public function index(Request $request)
    {
        Gate::authorize('access-account-data');

        $query = GoodsReceipt::with(['product', 'variant', 'supplier', 'warehouse', 'employee', 'supplierCredit'])
            ->where('account_id', Auth::user()->account_id);

        // Filter by status (draft/completed)
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        } else {
            // By default, show only completed receipts
            $query->where('status', 'completed');
        }

        if ($request->filled('search')) {
            $validated = $request->validate(['search' => 'required|string|max:255']);
            $searchTerm = $validated['search'];
            $query->where(function ($q) use ($searchTerm) {
                $q->where('receipt_number', 'like', '%' . $searchTerm . '%')
                  ->orWhere('batch_id', 'like', '%' . $searchTerm . '%')
                  ->orWhere('invoice_number', 'like', '%' . $searchTerm . '%')
                  ->orWhereHas('product', function ($subQ) use ($searchTerm) {
                      $subQ->where('name', 'like', '%' . $searchTerm . '%')
                           ->orWhere('sku', 'like', '%' . $searchTerm . '%');
                  })
                  ->orWhereHas('supplier', function ($subQ) use ($searchTerm) {
                      $subQ->where('name', 'like', '%' . $searchTerm . '%');
                  });
            });
        }

        if ($request->filled('warehouse_id')) {
            $query->where('warehouse_id', $request->warehouse_id);
        }

        if ($request->filled('supplier_id')) {
            $query->where('supplier_id', $request->supplier_id);
        }

        if ($request->filled('batch_id')) {
            $query->where('batch_id', $request->batch_id);
        }

        if ($request->filled('invoice_number')) {
            $query->where('invoice_number', 'like', '%' . $request->invoice_number . '%');
        }

        if ($request->filled('date_from') && $request->filled('date_to')) {
            $query->whereBetween('created_at', [$request->date_from, $request->date_to]);
        }

        $receipts = $query->latest()->paginate(25);

        // Add document URLs to receipts that have documents
        $receipts->getCollection()->transform(function ($receipt) {
            if ($receipt->hasDocument()) {
                $receipt->document_view_url = route('goods-receipts.view-document', $receipt);
                $receipt->document_download_url = route('goods-receipts.download-document', $receipt);
            }
            return $receipt;
        });

        $warehouses = Warehouse::byAccount(auth()->user()->account_id)->get();
        $suppliers = Supplier::byAccount(auth()->user()->account_id)->active()->get();

        // Get categories and branches for payment modal
        $categories = \App\Models\ExpenseCategory::byAccount(auth()->user()->account_id)
            ->active()
            ->select('category_id', 'name')
            ->get();

        $branches = \App\Models\Branch::byAccount(auth()->user()->account_id)
            ->select('id', 'name')
            ->get();

        return Inertia::render('GoodsReceipts/Index', [
            'receipts' => $receipts,
            'warehouses' => $warehouses,
            'suppliers' => $suppliers,
            'categories' => $categories,
            'branches' => $branches,
            'paymentMethods' => \App\Models\Expense::getPaymentMethods(),
            'filters' => $request->only(['search', 'warehouse_id', 'supplier_id', 'date_from', 'date_to', 'status']),
        ]);
    }

    public function create()
    {
        Gate::authorize('access-account-data');

        // Products are now loaded via live search, no need to preload all products

        $suppliers = Supplier::byAccount(auth()->user()->account_id)
            ->active()
            ->select('id', 'name', 'contact_person', 'phone', 'payment_terms_days', 'payment_terms_text')
            ->get();

        $warehouses = Warehouse::byAccount(auth()->user()->account_id)
            ->select('id', 'name', 'location')
            ->get();

        return Inertia::render('GoodsReceipts/Create', [
            'suppliers' => $suppliers,
            'warehouses' => $warehouses,
        ]);
    }

    public function store(Request $request)
    {
        Gate::authorize('access-account-data');

        $request->validate([
            'warehouse_id' => 'required|exists:warehouses,id',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'invoice_number' => 'nullable|string|max:255',
            'products' => 'required|array|min:1',
            'products.*.product_id' => 'required|exists:products,id',
            'products.*.variant_id' => 'nullable|exists:product_variants,id',
            'products.*.quantity' => 'required|numeric|gt:0',
            'products.*.base_quantity' => 'nullable|numeric|gt:0',
            'products.*.unit' => 'required|string|max:50',
            'products.*.receiving_unit' => 'nullable|string|max:50',
            'products.*.unit_cost' => 'nullable|numeric|min:0',
            'products.*.discount_percent' => 'nullable|numeric|min:0|max:100',
            'products.*.sale_price' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
            'document' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'payment_method' => 'required|in:instant,credit',
            'payment_status' => 'nullable|in:paid,unpaid,partial',
            'custom_payment_terms' => 'nullable|integer|min:0|max:365',
            'use_custom_terms' => 'boolean',
            'status' => 'nullable|in:draft,completed',
        ]);

        try {
            DB::beginTransaction();

            // Determine if this is a draft or completed receipt
            $status = $request->input('status', 'completed');
            $isDraft = $status === 'draft';

            // Generate batch_id for both drafts and completed (to group products together)
            $batchId = GoodsReceipt::generateBatchId(auth()->user()->account_id);
            $invoiceNumber = $request->invoice_number;

            $goodsReceiptIds = [];
            $totalCost = 0;

            foreach ($request->products as $productData) {
                // Validate variant belongs to product and account if provided
                if (!empty($productData['variant_id'])) {
                    $variant = ProductVariant::where('id', $productData['variant_id'])
                        ->where('account_id', auth()->user()->account_id)
                        ->where('product_id', $productData['product_id'])
                        ->first();

                    if (!$variant) {
                        throw new \Exception('Seçilmiş variant bu məhsula aid deyil və ya mövcud deyil');
                    }
                }

                // Determine the quantity to use for inventory tracking
                $inventoryQuantity = $productData['base_quantity'] ?: $productData['quantity'];

                // Get the product to access its prices
                $product = Product::find($productData['product_id']);

                // Calculate costs with per-product discount
                // If unit_cost is not provided or is 0, fallback to product's purchase_price
                $unitCost = !empty($productData['unit_cost']) ? $productData['unit_cost'] : ($product->purchase_price ?? 0);
                $discountPercent = floatval($productData['discount_percent'] ?? 0);
                $itemSubtotal = $unitCost * $inventoryQuantity;
                $itemDiscountAmount = ($itemSubtotal * $discountPercent) / 100;
                $itemFinalTotal = $itemSubtotal - $itemDiscountAmount;

                $goodsReceipt = new GoodsReceipt();
                $goodsReceipt->account_id = auth()->user()->account_id;
                $goodsReceipt->warehouse_id = $request->warehouse_id;
                $goodsReceipt->product_id = $productData['product_id'];
                $goodsReceipt->variant_id = $productData['variant_id'] ?? null;
                $goodsReceipt->supplier_id = $request->supplier_id;
                $goodsReceipt->employee_id = auth()->id();
                $goodsReceipt->batch_id = $batchId; // Assign batch ID to group all products in this transaction (NULL for drafts)
                $goodsReceipt->invoice_number = $invoiceNumber; // Supplier's invoice number
                $goodsReceipt->quantity = $inventoryQuantity; // Use base quantity for inventory
                $goodsReceipt->status = $status; // Set draft or completed status
                $goodsReceipt->unit = $productData['receiving_unit'] ?: $productData['unit'];
                $goodsReceipt->unit_cost = $unitCost;
                // IMPORTANT: total_cost is the FINAL amount after discount (what was actually paid)
                $goodsReceipt->total_cost = $itemFinalTotal;
                $goodsReceipt->notes = $request->notes;

                // Store additional data for packaging information and discount details
                $goodsReceipt->additional_data = [
                    'received_quantity' => $productData['quantity'],
                    'received_unit' => $productData['receiving_unit'],
                    'base_quantity' => $inventoryQuantity,
                    'base_unit' => $productData['unit'],
                    'subtotal_before_discount' => $itemSubtotal,
                    'discount_percent' => $discountPercent,
                    'discount_amount' => $itemDiscountAmount,
                ];

                if ($request->hasFile('document')) {
                    $documentPath = $this->documentService->uploadGoodsReceiptDocument(
                        $request->file('document'),
                        'qaimə'
                    );
                    $goodsReceipt->document_path = $documentPath;
                }

                $goodsReceipt->save();
                $goodsReceiptIds[] = $goodsReceipt->id;

                // Skip stock and price updates for drafts
                if ($isDraft) {
                    continue; // Skip to next product
                }

                // Update the product's purchase_price (alış qiyməti) from unit_cost
                // Only update if a value was explicitly provided
                if (!empty($productData['unit_cost'])) {
                    // Update product or variant purchase price
                    if (!empty($productData['variant_id'])) {
                        $variant = ProductVariant::find($productData['variant_id']);
                        if ($variant && $variant->price_adjustment !== null) {
                            // Variant has custom price - update variant's price_adjustment
                            // Note: This maintains the variant pricing structure
                        }
                    }

                    // Always update the base product's purchase_price if provided
                    if ($product) {
                        $product->purchase_price = $productData['unit_cost'];
                        $product->save();
                    }
                }

                // Update sale_price if provided
                if (!empty($productData['sale_price'])) {
                    if ($product) {
                        $product->sale_price = $productData['sale_price'];
                        $product->save();
                    }
                }

                // Calculate total cost for payment processing (after discount)
                $totalCost += $itemFinalTotal;

                $stockMovement = new StockMovement();
                $stockMovement->account_id = auth()->user()->account_id;
                $stockMovement->warehouse_id = $request->warehouse_id;
                $stockMovement->product_id = $productData['product_id'];
                $stockMovement->variant_id = $productData['variant_id'] ?? null;
                $stockMovement->movement_type = 'daxil_olma';
                $stockMovement->quantity = $inventoryQuantity; // Use base quantity for inventory tracking
                $stockMovement->unit_cost = $productData['unit_cost'] ?? 0;
                $stockMovement->reference_type = 'goods_receipt';
                $stockMovement->reference_id = $goodsReceipt->id;
                $stockMovement->employee_id = $goodsReceipt->employee_id;
                $stockMovement->notes = "Mal qəbulu: {$goodsReceipt->receipt_number}";
                $stockMovement->save();

                $productStock = ProductStock::firstOrCreate(
                    [
                        'product_id' => $productData['product_id'],
                        'variant_id' => $productData['variant_id'] ?? null,
                        'warehouse_id' => $request->warehouse_id,
                        'account_id' => auth()->user()->account_id,
                    ],
                    [
                        'quantity' => 0,
                        'reserved_quantity' => 0,
                        'min_level' => 3,
                    ]
                );

                $quantityBefore = $productStock->quantity;
                $productStock->increment('quantity', $inventoryQuantity);

                // Create stock history record
                StockHistory::create([
                    'product_id' => $productData['product_id'],
                    'variant_id' => $productData['variant_id'] ?? null,
                    'warehouse_id' => $request->warehouse_id,
                    'quantity_before' => $quantityBefore,
                    'quantity_change' => $inventoryQuantity,
                    'quantity_after' => $quantityBefore + $inventoryQuantity,
                    'type' => 'daxil_olma',
                    'reference_type' => 'goods_receipt',
                    'reference_id' => $goodsReceipt->id,
                    'user_id' => auth()->id(),
                    'notes' => "Mal qəbulu: {$goodsReceipt->receipt_number}",
                    'occurred_at' => $goodsReceipt->created_at ?? now(),
                ]);
            }

            // Process payment after successful goods receipt creation (skip for drafts)
            if (!$isDraft && !empty($goodsReceiptIds)) {
                // Get all created goods receipts
                $goodsReceipts = GoodsReceipt::whereIn('id', $goodsReceiptIds)->get();

                // Process payment for instant payment method
                if ($request->payment_method === 'instant') {
                    // Create a single expense and supplier payment for all products
                    $firstGoodsReceipt = $goodsReceipts->first();
                    $firstGoodsReceipt->total_cost = $totalCost;
                    $this->processGoodsReceiptPayment($firstGoodsReceipt, $request);

                    // Mark all goods receipts as paid
                    foreach ($goodsReceipts as $receipt) {
                        $receipt->update([
                            'payment_status' => 'paid',
                            'payment_method' => 'instant'
                        ]);
                    }
                } else {
                    // For credit payment, process each goods receipt separately to create individual supplier credits
                    foreach ($goodsReceipts as $receipt) {
                        $this->processGoodsReceiptPayment($receipt, $request);
                    }
                }
            }

            DB::commit();

            $successMessage = $isDraft
                ? 'Mal qəbulu qaralama olaraq saxlanıldı'
                : 'Mal qəbulu uğurla yaradıldı';

            return redirect()->route('goods-receipts.index')
                ->with('success', $successMessage);

        } catch (\Exception $e) {
            DB::rollBack();
            return back()
                ->withErrors(['error' => 'Mal qəbulu yaradılarkən xəta baş verdi: ' . $e->getMessage()])
                ->withInput();
        }
    }

    public function complete(Request $request, GoodsReceipt $goodsReceipt)
    {
        Gate::authorize('access-account-data');

        // Validate the goods receipt is a draft
        if (!$goodsReceipt->isDraft()) {
            return back()->withErrors(['error' => 'Bu mal qəbulu artıq tamamlanmışdır']);
        }

        // Validate payment details are provided for completion
        $request->validate([
            'payment_method' => 'required|in:instant,credit',
            'payment_status' => 'nullable|in:paid,unpaid,partial',
            'custom_payment_terms' => 'nullable|integer|min:0|max:365',
            'use_custom_terms' => 'boolean',
        ]);

        try {
            DB::beginTransaction();

            // Get all draft receipts in the same batch
            $draftReceipts = GoodsReceipt::where('batch_id', $goodsReceipt->batch_id)
                ->where('account_id', auth()->user()->account_id)
                ->where('status', 'draft')
                ->get();

            if ($draftReceipts->isEmpty()) {
                throw new \Exception('Qaralama tapılmadı');
            }

            $totalCost = 0;

            foreach ($draftReceipts as $receipt) {
                // Generate receipt number for this receipt
                $receipt->receipt_number = $receipt->generateReceiptNumber();
                $receipt->status = 'completed';
                $receipt->save();

                // Update product purchase price
                if ($receipt->unit_cost > 0) {
                    $product = Product::find($receipt->product_id);
                    if ($product) {
                        $product->purchase_price = $receipt->unit_cost;
                        $product->save();
                    }
                }

                // Create stock movement
                $stockMovement = new StockMovement();
                $stockMovement->account_id = $receipt->account_id;
                $stockMovement->warehouse_id = $receipt->warehouse_id;
                $stockMovement->product_id = $receipt->product_id;
                $stockMovement->variant_id = $receipt->variant_id;
                $stockMovement->movement_type = 'daxil_olma';
                $stockMovement->quantity = $receipt->quantity;
                $stockMovement->unit_cost = $receipt->unit_cost;
                $stockMovement->reference_type = 'goods_receipt';
                $stockMovement->reference_id = $receipt->id;
                $stockMovement->employee_id = $receipt->employee_id;
                $stockMovement->notes = "Mal qəbulu: {$receipt->receipt_number}";
                $stockMovement->save();

                // Update product stock
                $productStock = ProductStock::firstOrCreate(
                    [
                        'product_id' => $receipt->product_id,
                        'variant_id' => $receipt->variant_id,
                        'warehouse_id' => $receipt->warehouse_id,
                        'account_id' => $receipt->account_id,
                    ],
                    [
                        'quantity' => 0,
                        'reserved_quantity' => 0,
                        'min_level' => 3,
                    ]
                );

                $quantityBefore = $productStock->quantity;
                $productStock->increment('quantity', $receipt->quantity);

                // Create stock history record
                StockHistory::create([
                    'product_id' => $receipt->product_id,
                    'variant_id' => $receipt->variant_id,
                    'warehouse_id' => $receipt->warehouse_id,
                    'quantity_before' => $quantityBefore,
                    'quantity_change' => $receipt->quantity,
                    'quantity_after' => $quantityBefore + $receipt->quantity,
                    'type' => 'daxil_olma',
                    'reference_type' => 'goods_receipt',
                    'reference_id' => $receipt->id,
                    'user_id' => auth()->id(),
                    'notes' => "Mal qəbulu: {$receipt->receipt_number}",
                    'occurred_at' => $receipt->created_at ?? now(),
                ]);

                $totalCost += $receipt->total_cost;
            }

            // Process payment
            if ($request->payment_method === 'instant') {
                // Create a single expense and supplier payment for all products
                $firstReceipt = $draftReceipts->first();
                $firstReceipt->total_cost = $totalCost;
                $this->processGoodsReceiptPayment($firstReceipt, $request);

                // Mark all receipts as paid
                foreach ($draftReceipts as $receipt) {
                    $receipt->update([
                        'payment_status' => 'paid',
                        'payment_method' => 'instant'
                    ]);
                }
            } else {
                // For credit payment, process each receipt separately
                foreach ($draftReceipts as $receipt) {
                    $this->processGoodsReceiptPayment($receipt, $request);
                }
            }

            DB::commit();

            return redirect()->route('goods-receipts.index')
                ->with('success', 'Mal qəbulu uğurla tamamlandı');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()
                ->withErrors(['error' => 'Mal qəbulu tamamlanarkən xəta baş verdi: ' . $e->getMessage()])
                ->withInput();
        }
    }

    public function show(GoodsReceipt $goodsReceipt)
    {
        Gate::authorize('access-account-data');

        $goodsReceipt->load(['product', 'variant', 'supplier', 'warehouse', 'employee', 'supplierCredit']);

        // Add document URLs if document exists
        if ($goodsReceipt->hasDocument()) {
            $goodsReceipt->document_view_url = route('goods-receipts.view-document', $goodsReceipt);
            $goodsReceipt->document_download_url = route('goods-receipts.download-document', $goodsReceipt);
        }

        return Inertia::render('GoodsReceipts/Show', [
            'receipt' => $goodsReceipt,
        ]);
    }

    public function edit(GoodsReceipt $goodsReceipt)
    {
        Gate::authorize('access-account-data');

        $goodsReceipt->load(['product', 'variant', 'supplier', 'warehouse', 'employee']);

        // If this receipt is part of a batch, load all receipts in the batch
        $batchReceipts = null;
        if ($goodsReceipt->batch_id) {
            $batchReceipts = GoodsReceipt::where('batch_id', $goodsReceipt->batch_id)
                ->where('account_id', auth()->user()->account_id)
                ->with(['product', 'variant'])
                ->get();
        }

        $suppliers = Supplier::byAccount(auth()->user()->account_id)
            ->active()
            ->select('id', 'name', 'contact_person', 'phone', 'payment_terms_days', 'payment_terms_text')
            ->get();

        $warehouses = Warehouse::byAccount(auth()->user()->account_id)
            ->select('id', 'name', 'location')
            ->get();

        return Inertia::render('GoodsReceipts/Edit', [
            'receipt' => $goodsReceipt,
            'batchReceipts' => $batchReceipts,
            'suppliers' => $suppliers,
            'warehouses' => $warehouses,
        ]);
    }

    public function update(Request $request, GoodsReceipt $goodsReceipt)
    {
        Gate::authorize('access-account-data');

        $request->validate([
            'warehouse_id' => 'required|exists:warehouses,id',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'employee_id' => 'nullable|exists:users,id',
            'variant_id' => 'nullable|exists:product_variants,id',
            'quantity' => 'required|numeric|gt:0',
            'unit' => 'required|string|max:50',
            'unit_cost' => 'nullable|numeric|min:0',
            'sale_price' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
            'document' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            // payment_method and payment_status are not editable - removed from validation
        ]);

        try {
            DB::beginTransaction();

            // Validate variant belongs to product and account if provided
            if (!empty($request->variant_id)) {
                $variant = ProductVariant::where('id', $request->variant_id)
                    ->where('account_id', auth()->user()->account_id)
                    ->where('product_id', $goodsReceipt->product_id)
                    ->first();

                if (!$variant) {
                    throw new \Exception('Seçilmiş variant bu məhsula aid deyil və ya mövcud deyil');
                }
            }

            // Calculate difference in quantity for stock adjustment
            $quantityDifference = $request->quantity - $goodsReceipt->quantity;
            $variantChanged = $request->variant_id != $goodsReceipt->variant_id;

            // Update goods receipt (payment_method and payment_status are not editable)
            $goodsReceipt->warehouse_id = $request->warehouse_id;
            $goodsReceipt->supplier_id = $request->supplier_id;
            $goodsReceipt->employee_id = $request->employee_id;
            $goodsReceipt->variant_id = $request->variant_id;
            $goodsReceipt->quantity = $request->quantity;
            $goodsReceipt->unit = $request->unit;
            $goodsReceipt->unit_cost = $request->unit_cost ?? 0;
            $goodsReceipt->notes = $request->notes;

            // Handle document upload
            if ($request->hasFile('document')) {
                // Delete old document if exists
                if ($goodsReceipt->document_path) {
                    $this->documentService->deleteFile($goodsReceipt->document_path);
                }
                
                $documentPath = $this->documentService->uploadGoodsReceiptDocument(
                    $request->file('document'),
                    'qaimə'
                );
                $goodsReceipt->document_path = $documentPath;
            }

            $goodsReceipt->save();

            // Update the product's purchase_price (alış qiyməti) from unit_cost if changed
            if ($request->filled('unit_cost')) {
                $product = Product::find($goodsReceipt->product_id);
                if ($product) {
                    $product->purchase_price = $request->input('unit_cost');

                    // Update sale_price if provided
                    if ($request->filled('sale_price')) {
                        $product->sale_price = $request->input('sale_price');
                    }

                    $product->save();
                }
            }

            // Update the original stock movement's unit_cost if it changed
            $originalStockMovement = StockMovement::where('reference_type', 'goods_receipt')
                ->where('reference_id', $goodsReceipt->id)
                ->first();

            if ($originalStockMovement && $originalStockMovement->unit_cost != $request->unit_cost) {
                $originalStockMovement->update(['unit_cost' => $request->unit_cost ?? 0]);
            }

            // Adjust stock if quantity or variant changed
            if ($quantityDifference != 0 || $variantChanged) {
                // If variant changed, we need to handle old and new stock separately
                if ($variantChanged) {
                    $oldVariantId = $goodsReceipt->getOriginal('variant_id');

                    // Remove stock from old variant
                    $oldProductStock = ProductStock::where('product_id', $goodsReceipt->product_id)
                        ->where('variant_id', $oldVariantId)
                        ->where('warehouse_id', $goodsReceipt->warehouse_id)
                        ->where('account_id', $goodsReceipt->account_id)
                        ->first();

                    if ($oldProductStock) {
                        $oldQuantityBefore = $oldProductStock->quantity;
                        $oldProductStock->decrement('quantity', $goodsReceipt->getOriginal('quantity'));

                        // Create stock history for old variant
                        StockHistory::create([
                            'product_id' => $goodsReceipt->product_id,
                            'variant_id' => $oldVariantId,
                            'warehouse_id' => $goodsReceipt->warehouse_id,
                            'quantity_before' => $oldQuantityBefore,
                            'quantity_change' => -$goodsReceipt->getOriginal('quantity'),
                            'quantity_after' => $oldQuantityBefore - $goodsReceipt->getOriginal('quantity'),
                            'type' => 'duzelis_azaltma',
                            'reference_type' => 'goods_receipt_update',
                            'reference_id' => $goodsReceipt->id,
                            'user_id' => auth()->id(),
                            'notes' => "Mal qəbulu düzəlişi (variant dəyişdi): {$goodsReceipt->receipt_number}",
                            'occurred_at' => now(),
                        ]);
                    }

                    // Add stock to new variant
                    $newProductStock = ProductStock::firstOrCreate(
                        [
                            'product_id' => $goodsReceipt->product_id,
                            'variant_id' => $request->variant_id,
                            'warehouse_id' => $goodsReceipt->warehouse_id,
                            'account_id' => $goodsReceipt->account_id,
                        ],
                        [
                            'quantity' => 0,
                            'reserved_quantity' => 0,
                            'min_level' => 3,
                        ]
                    );
                    $newQuantityBefore = $newProductStock->quantity;
                    $newProductStock->increment('quantity', $request->quantity);

                    // Create stock history for new variant
                    StockHistory::create([
                        'product_id' => $goodsReceipt->product_id,
                        'variant_id' => $request->variant_id,
                        'warehouse_id' => $goodsReceipt->warehouse_id,
                        'quantity_before' => $newQuantityBefore,
                        'quantity_change' => $request->quantity,
                        'quantity_after' => $newQuantityBefore + $request->quantity,
                        'type' => 'duzelis_artim',
                        'reference_type' => 'goods_receipt_update',
                        'reference_id' => $goodsReceipt->id,
                        'user_id' => auth()->id(),
                        'notes' => "Mal qəbulu düzəlişi (variant dəyişdi): {$goodsReceipt->receipt_number}",
                        'occurred_at' => now(),
                    ]);

                    // Create stock movement for variant change
                    $stockMovement = new StockMovement();
                    $stockMovement->account_id = auth()->user()->account_id;
                    $stockMovement->warehouse_id = $goodsReceipt->warehouse_id;
                    $stockMovement->product_id = $goodsReceipt->product_id;
                    $stockMovement->variant_id = $request->variant_id;
                    $stockMovement->movement_type = 'duzelis_artim';
                    $stockMovement->quantity = $request->quantity;
                    $stockMovement->unit_cost = $goodsReceipt->unit_cost;
                    $stockMovement->reference_type = 'goods_receipt_update';
                    $stockMovement->reference_id = $goodsReceipt->id;
                    $stockMovement->employee_id = $goodsReceipt->employee_id;
                    $stockMovement->notes = "Mal qəbulu düzəlişi (variant dəyişdi): {$goodsReceipt->receipt_number}";
                    $stockMovement->save();
                } else {
                    // Only quantity changed, same variant
                    $productStock = ProductStock::where('product_id', $goodsReceipt->product_id)
                        ->where('variant_id', $request->variant_id)
                        ->where('warehouse_id', $goodsReceipt->warehouse_id)
                        ->where('account_id', $goodsReceipt->account_id)
                        ->first();

                    if ($productStock) {
                        $quantityBefore = $productStock->quantity;
                        $productStock->increment('quantity', $quantityDifference);

                        // Create stock history for quantity adjustment
                        $movementType = $quantityDifference > 0 ? 'duzelis_artim' : 'duzelis_azaltma';
                        StockHistory::create([
                            'product_id' => $goodsReceipt->product_id,
                            'variant_id' => $request->variant_id,
                            'warehouse_id' => $goodsReceipt->warehouse_id,
                            'quantity_before' => $quantityBefore,
                            'quantity_change' => $quantityDifference,
                            'quantity_after' => $quantityBefore + $quantityDifference,
                            'type' => $movementType,
                            'reference_type' => 'goods_receipt_update',
                            'reference_id' => $goodsReceipt->id,
                            'user_id' => auth()->id(),
                            'notes' => "Mal qəbulu düzəlişi: {$goodsReceipt->receipt_number}",
                            'occurred_at' => now(),
                        ]);
                    }

                    // Create stock movement for the adjustment
                    $movementType = $quantityDifference > 0 ? 'duzelis_artim' : 'duzelis_azaltma';
                    $stockMovement = new StockMovement();
                    $stockMovement->account_id = auth()->user()->account_id;
                    $stockMovement->warehouse_id = $goodsReceipt->warehouse_id;
                    $stockMovement->product_id = $goodsReceipt->product_id;
                    $stockMovement->variant_id = $request->variant_id;
                    $stockMovement->movement_type = $movementType;
                    $stockMovement->quantity = abs($quantityDifference);
                    $stockMovement->unit_cost = $goodsReceipt->unit_cost;
                    $stockMovement->reference_type = 'goods_receipt_update';
                    $stockMovement->reference_id = $goodsReceipt->id;
                    $stockMovement->employee_id = $goodsReceipt->employee_id;
                    $stockMovement->notes = "Mal qəbulu düzəlişi: {$goodsReceipt->receipt_number}";
                    $stockMovement->save();
                }
            }

            DB::commit();

            return redirect()->route('goods-receipts.index')
                ->with('success', 'Mal qəbulu uğurla yeniləndi');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()
                ->withErrors(['error' => 'Mal qəbulu yenilənərkən xəta baş verdi: ' . $e->getMessage()])
                ->withInput();
        }
    }

    public function searchProductByBarcode(Request $request)
    {
        try {
            Gate::authorize('access-account-data');

            $request->validate([
                'barcode' => 'required|string|max:255',
            ]);

            $barcode = trim($request->barcode);

            if (empty($barcode)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Barkod boş ola bilməz',
                ], 400);
            }

            // STEP 1: Check if it's a variant barcode first (higher priority)
            $variant = ProductVariant::byAccount(auth()->user()->account_id)
                ->where('barcode', $barcode)
                ->with('product')
                ->active()
                ->first();

            if ($variant && $variant->product) {
                return response()->json([
                    'success' => true,
                    'type' => 'variant',
                    'variant' => [
                        'id' => $variant->id,
                        'size' => $variant->size,
                        'color' => $variant->color,
                        'color_code' => $variant->color_code,
                        'barcode' => $variant->barcode,
                        'sku' => $variant->sku,
                        'display_name' => $variant->display_name,
                        'short_display' => $variant->short_display,
                    ],
                    'product' => [
                        'id' => $variant->product->id,
                        'name' => $variant->product->name,
                        'sku' => $variant->product->sku,
                        'unit' => $variant->product->unit,
                        'base_unit' => $variant->product->base_unit,
                        'has_variants' => true,
                    ],
                ]);
            }

            // STEP 2: Check if it's a product barcode
            $product = Product::byAccount(auth()->user()->account_id)
                ->where('barcode', $barcode)
                ->active()
                ->products() // Only actual products, not services
                ->first();

            if (!$product) {
                return response()->json([
                    'success' => false,
                    'message' => 'Bu barkodla məhsul tapılmadı',
                ], 404);
            }

            // Check if product has variants
            $hasVariants = $product->variants()->active()->exists();
            $variants = [];

            if ($hasVariants) {
                $variants = $product->variants()
                    ->active()
                    ->select('id', 'size', 'color', 'color_code', 'barcode', 'sku', 'price_adjustment')
                    ->get()
                    ->map(function ($v) {
                        return [
                            'id' => $v->id,
                            'size' => $v->size,
                            'color' => $v->color,
                            'color_code' => $v->color_code,
                            'barcode' => $v->barcode,
                            'sku' => $v->sku,
                            'display_name' => $v->display_name,
                            'short_display' => $v->short_display,
                        ];
                    });
            }

            return response()->json([
                'success' => true,
                'type' => 'product',
                'product' => [
                    'id' => $product->id,
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'barcode' => $product->barcode,
                    'unit' => $product->unit,
                    'base_unit' => $product->base_unit,
                    'packaging_size' => $product->packaging_size,
                    'packaging_quantity' => $product->packaging_quantity,
                    'has_variants' => $hasVariants,
                ],
                'variants' => $variants,
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Barkod məlumatları düzgün deyil',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Barcode search error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Sistem xətası. Zəhmət olmasa yenidən cəhd edin.',
            ], 500);
        }
    }

    /**
     * Delete all goods receipts in a batch
     * Uses the same validation logic as individual delete
     */
    public function deleteBatch(Request $request, string $batch_id)
    {
        Gate::authorize('delete-account-data');

        try {
            DB::beginTransaction();

            // Get all receipts in this batch for this account
            $receipts = GoodsReceipt::where('batch_id', $batch_id)
                ->where('account_id', auth()->user()->account_id)
                ->get();

            if ($receipts->isEmpty()) {
                return redirect()->back()->with('error', 'Partiya tapılmadı');
            }

            // Validate each receipt before deleting any
            foreach ($receipts as $receipt) {
                // Check payment status - can't delete paid or partial receipts
                if ($receipt->payment_status === 'paid') {
                    DB::rollBack();
                    return redirect()->back()->with('error', "Ödənilmiş mal qəbulu var. Partiyanı silmək mümkün deyil.");
                }

                if ($receipt->payment_status === 'partial') {
                    DB::rollBack();
                    return redirect()->back()->with('error', "Qismən ödənilmiş mal qəbulu var. Partiyanı silmək mümkün deyil.");
                }

                // Check stock - can't delete if stock has been sold
                $receivedQuantity = $receipt->quantity;
                $currentStock = ProductStock::where('product_id', $receipt->product_id)
                    ->where('warehouse_id', $receipt->warehouse_id)
                    ->where('variant_id', $receipt->variant_id)
                    ->where('account_id', $receipt->account_id)
                    ->first();

                if ($currentStock && $currentStock->quantity < $receivedQuantity) {
                    DB::rollBack();
                    return redirect()->back()->with('error', "Stokda kifayət qədər məhsul yoxdur. Bəzi məhsullar satılmış ola bilər. Partiyanı silmək təhlükəlidir.");
                }
            }

            // All validations passed, now delete all receipts in the batch
            $deletedCount = 0;
            foreach ($receipts as $receipt) {
                // Call the existing destroy logic for each receipt
                // This will handle expenses, supplier credits, stock movements, etc.
                $receipt->delete();
                $deletedCount++;
            }

            DB::commit();

            return redirect()->route('goods-receipts.index')
                ->with('success', "Partiya ({$deletedCount} məhsul) uğurla silindi");

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Batch delete error: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Partiya silinərkən xəta baş verdi: ' . $e->getMessage());
        }
    }

    public function destroy(GoodsReceipt $goodsReceipt)
    {
        Gate::authorize('delete-account-data');
        Gate::authorize('access-account-data', $goodsReceipt);

        // STRICT VALIDATION: Block if paid
        // Paid receipts have completed financial transactions that should not be reversed
        if ($goodsReceipt->payment_status === 'paid') {
            return back()->withErrors([
                'error' => 'Ödənilmiş mal qəbulunu silmək mümkün deyil. Ödənilmiş əməliyyatlar maliyyə uçotunda tamamlanıb və geri qaytarıla bilməz.'
            ]);
        }

        // STRICT VALIDATION: Check if stock has been sold (current stock < received quantity)
        // This prevents inventory data corruption
        $receivedQuantity = $goodsReceipt->quantity;
        $currentStock = ProductStock::where('product_id', $goodsReceipt->product_id)
            ->where('warehouse_id', $goodsReceipt->warehouse_id)
            ->where('variant_id', $goodsReceipt->variant_id)
            ->where('account_id', $goodsReceipt->account_id)
            ->first();

        if ($currentStock && $currentStock->quantity < $receivedQuantity) {
            return back()->withErrors([
                'error' => 'Diqqət: Cari stok miqdarı (' . $currentStock->quantity . ') qəbul edilən miqdardan (' . $receivedQuantity . ') azdır. ' .
                           'Stok satılmış ola bilər. Silmək təhlükəlidir və inventar məlumatlarını pozacaq.'
            ]);
        }

        // STRICT VALIDATION: Partial payments are not allowed to be deleted
        // If there are any payments against a credit, they must be reversed first
        if ($goodsReceipt->payment_status === 'partial') {
            return back()->withErrors([
                'error' => 'Qismən ödənilmiş mal qəbulunu silmək mümkün deyil. Ödəmələr edilib və geri qaytarılmalıdır.'
            ]);
        }

        try {
            DB::beginTransaction();

            \Log::info("Starting goods receipt deletion cascade", [
                'receipt_id' => $goodsReceipt->id,
                'receipt_number' => $goodsReceipt->receipt_number,
                'payment_method' => $goodsReceipt->payment_method,
                'payment_status' => $goodsReceipt->payment_status,
                'user_id' => auth()->id(),
            ]);

            // STEP 1: Handle SUPPLIER CREDIT deletion (for credit payment method)
            // This must be done FIRST before deleting expenses
            if ($goodsReceipt->supplier_credit_id) {
                $supplierCredit = \App\Models\SupplierCredit::find($goodsReceipt->supplier_credit_id);

                if ($supplierCredit) {
                    // STRICT CHECK: Credit must be fully unpaid (no payments made)
                    if ($supplierCredit->status !== 'pending' || $supplierCredit->remaining_amount != $supplierCredit->amount) {
                        DB::rollBack();
                        return back()->withErrors([
                            'error' => 'Təchizatçı kreditinə ödəmələr edilib. Əvvəlcə bütün ödəmələri geri qaytarın və ya krediti ləğv edin.'
                        ]);
                    }

                    \Log::info("Deleting supplier credit", [
                        'credit_id' => $supplierCredit->id,
                        'credit_reference' => $supplierCredit->reference_number,
                        'amount' => $supplierCredit->amount,
                    ]);

                    // Delete the supplier credit (unpaid only)
                    $supplierCredit->delete();
                }
            }

            // STEP 2: Handle EXPENSE and SUPPLIER PAYMENT deletion (for instant payment method)
            // These are created together for instant payments and must be deleted together
            $linkedExpenses = \App\Models\Expense::where('goods_receipt_id', $goodsReceipt->id)->get();

            foreach ($linkedExpenses as $expense) {
                \Log::info("Deleting linked expense", [
                    'expense_id' => $expense->expense_id,
                    'reference_number' => $expense->reference_number,
                    'amount' => $expense->amount,
                    'supplier_payment_id' => $expense->supplier_payment_id,
                ]);

                // Find and delete associated supplier payment FIRST (before expense)
                // This prevents the expense deleting hook from triggering on orphaned payment
                if ($expense->supplier_payment_id) {
                    $supplierPayment = \App\Models\SupplierPayment::find($expense->supplier_payment_id);
                    if ($supplierPayment) {
                        \Log::info("Deleting supplier payment", [
                            'payment_id' => $supplierPayment->payment_id,
                            'reference_number' => $supplierPayment->reference_number,
                            'amount' => $supplierPayment->amount,
                        ]);

                        // Delete supplier payment (will cascade to expense via its deleting hook)
                        // NOTE: SupplierPayment's deleting hook will try to delete expense, but we're doing it manually
                        // So we need to delete expense first to avoid double deletion

                        // Delete expense WITHOUT triggering its hooks for supplier credit reversal
                        // (since we already handled supplier credit above)
                        $expense->delete();

                        // Now delete supplier payment
                        // We need to detach the relationship first to prevent cascade
                        $supplierPayment->delete();
                    }
                } else {
                    // No supplier payment linked, just delete expense
                    $expense->delete();
                }
            }

            // STEP 3: Handle STOCK MOVEMENTS
            // Delete all stock movements related to this goods receipt
            $stockMovements = StockMovement::where('reference_type', 'goods_receipt')
                ->where('reference_id', $goodsReceipt->id)
                ->get();

            foreach ($stockMovements as $stockMovement) {
                \Log::info("Deleting stock movement", [
                    'movement_id' => $stockMovement->id,
                    'movement_type' => $stockMovement->movement_type,
                    'quantity' => $stockMovement->quantity,
                ]);

                $stockMovement->delete();
            }

            // Also check for adjustment movements created during edits
            $adjustmentMovements = StockMovement::where('reference_type', 'goods_receipt_update')
                ->where('reference_id', $goodsReceipt->id)
                ->get();

            foreach ($adjustmentMovements as $movement) {
                \Log::info("Deleting adjustment stock movement", [
                    'movement_id' => $movement->id,
                    'movement_type' => $movement->movement_type,
                    'quantity' => $movement->quantity,
                ]);

                $movement->delete();
            }

            // STEP 4: REVERSE PRODUCT STOCK quantities
            // This is critical for inventory accuracy
            $productStock = ProductStock::where('product_id', $goodsReceipt->product_id)
                ->where('variant_id', $goodsReceipt->variant_id)
                ->where('warehouse_id', $goodsReceipt->warehouse_id)
                ->where('account_id', $goodsReceipt->account_id)
                ->first();

            if ($productStock) {
                $quantityBefore = $productStock->quantity;
                $productStock->decrement('quantity', (float) $goodsReceipt->quantity);

                \Log::info("Reversed product stock", [
                    'product_id' => $goodsReceipt->product_id,
                    'variant_id' => $goodsReceipt->variant_id,
                    'warehouse_id' => $goodsReceipt->warehouse_id,
                    'quantity_before' => $quantityBefore,
                    'quantity_reversed' => $goodsReceipt->quantity,
                    'quantity_after' => $quantityBefore - (float) $goodsReceipt->quantity,
                ]);

                // STEP 5: Create STOCK HISTORY for audit trail
                StockHistory::create([
                    'product_id' => $goodsReceipt->product_id,
                    'variant_id' => $goodsReceipt->variant_id,
                    'warehouse_id' => $goodsReceipt->warehouse_id,
                    'quantity_before' => $quantityBefore,
                    'quantity_change' => -(float) $goodsReceipt->quantity,
                    'quantity_after' => $quantityBefore - (float) $goodsReceipt->quantity,
                    'type' => 'duzelis_azaltma',
                    'reference_type' => 'goods_receipt_delete',
                    'reference_id' => $goodsReceipt->id,
                    'user_id' => auth()->id(),
                    'notes' => "Mal qəbulu silindi (kaskad): {$goodsReceipt->receipt_number} | " .
                               "İstifadəçi: " . auth()->user()->name . " | " .
                               "Tarix: " . now()->format('Y-m-d H:i:s') . " | " .
                               "Ödəniş metodu: {$goodsReceipt->payment_method} | " .
                               "Məbləğ: {$goodsReceipt->total_cost} AZN | " .
                               "Səbəb: Tam kaskad silinmə (xərclər, ödəmələr, kredit və stok bərpa edildi)",
                    'occurred_at' => now(),
                ]);
            }

            // STEP 6: Delete DOCUMENT file if exists
            if ($goodsReceipt->document_path) {
                \Log::info("Deleting document file", [
                    'document_path' => $goodsReceipt->document_path,
                ]);

                $this->documentService->deleteFile($goodsReceipt->document_path);
            }

            // STEP 7: SOFT DELETE the goods receipt itself
            // This preserves the record in database with deleted_at timestamp
            \Log::info("Soft deleting goods receipt", [
                'receipt_id' => $goodsReceipt->id,
                'receipt_number' => $goodsReceipt->receipt_number,
            ]);

            $goodsReceipt->delete();

            DB::commit();

            \Log::info("Goods receipt deletion completed successfully", [
                'receipt_id' => $goodsReceipt->id,
                'receipt_number' => $goodsReceipt->receipt_number,
            ]);

            return redirect()->route('goods-receipts.index')
                ->with('success', 'Mal qəbulu və bütün əlaqəli maliyyə qeydləri uğurla silindi (xərclər, ödəmələr, kredit və stok bərpa edildi)');

        } catch (\Exception $e) {
            DB::rollBack();

            \Log::error("Goods receipt deletion failed", [
                'receipt_id' => $goodsReceipt->id,
                'receipt_number' => $goodsReceipt->receipt_number,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return back()
                ->withErrors(['error' => 'Mal qəbulu silinərkən xəta baş verdi: ' . $e->getMessage()]);
        }
    }

    public function viewDocument(GoodsReceipt $goodsReceipt)
    {
        Gate::authorize('access-account-data', $goodsReceipt);

        if (!$goodsReceipt->hasDocument()) {
            abort(404, 'Sənəd tapılmadı');
        }

        $disk = 'documents';
        if (!Storage::disk($disk)->exists($goodsReceipt->document_path)) {
            abort(404, 'Sənəd faylı tapılmadı');
        }

        try {
            $file = Storage::disk($disk)->get($goodsReceipt->document_path);
            $extension = pathinfo($goodsReceipt->document_path, PATHINFO_EXTENSION);
            $mimeType = match(strtolower($extension)) {
                'pdf' => 'application/pdf',
                'jpg', 'jpeg' => 'image/jpeg',
                'png' => 'image/png',
                'gif' => 'image/gif',
                'webp' => 'image/webp',
                'doc' => 'application/msword',
                'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'xls' => 'application/vnd.ms-excel',
                'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'txt' => 'text/plain',
                'csv' => 'text/csv',
                default => 'application/octet-stream'
            };

            return response($file, 200)
                ->header('Content-Type', $mimeType)
                ->header('Content-Disposition', 'inline');
        } catch (\Exception $e) {
            \Log::error('Error viewing goods receipt document: ' . $e->getMessage());
            abort(404, 'Sənəd oxuna bilmədi');
        }
    }

    public function downloadDocument(GoodsReceipt $goodsReceipt)
    {
        Gate::authorize('access-account-data', $goodsReceipt);

        if (!$goodsReceipt->hasDocument()) {
            abort(404, 'Sənəd tapılmadı');
        }

        $disk = 'documents';
        if (!Storage::disk($disk)->exists($goodsReceipt->document_path)) {
            abort(404, 'Sənəd faylı tapılmadı');
        }

        try {
            $pathinfo = pathinfo($goodsReceipt->document_path);
            $filename = 'goods_receipt_' . $goodsReceipt->id . '.' . ($pathinfo['extension'] ?? 'file');

            // For Azure storage, we need to get the file content and return it as a response
            $file = Storage::disk($disk)->get($goodsReceipt->document_path);
            $mimeType = match(strtolower($pathinfo['extension'] ?? '')) {
                'pdf' => 'application/pdf',
                'jpg', 'jpeg' => 'image/jpeg',
                'png' => 'image/png',
                'gif' => 'image/gif',
                'webp' => 'image/webp',
                'doc' => 'application/msword',
                'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'xls' => 'application/vnd.ms-excel',
                'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'txt' => 'text/plain',
                'csv' => 'text/csv',
                default => 'application/octet-stream'
            };

            return response($file, 200, [
                'Content-Type' => $mimeType,
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
                'Content-Length' => strlen($file),
            ]);
        } catch (\Exception $e) {
            \Log::error('Error downloading goods receipt document: ' . $e->getMessage());
            abort(404, 'Sənəd endirilə bilmədi');
        }
    }

    /**
     * Process payment for goods receipt based on payment method
     */
    private function processGoodsReceiptPayment(GoodsReceipt $goodsReceipt, Request $request): void
    {
        if ($request->payment_method === 'credit' && $goodsReceipt->supplier_id) {
            // Calculate due date using custom terms or supplier payment terms
            $dueDate = $this->calculateCustomDueDate($goodsReceipt, $request);

            // Create supplier credit for unpaid goods receipt
            $supplierCredit = $goodsReceipt->createSupplierCredit();

            // Update goods receipt with payment information
            $goodsReceipt->update([
                'payment_status' => 'unpaid',
                'payment_method' => 'credit',
                'due_date' => $dueDate,
                'supplier_credit_id' => $supplierCredit->id
            ]);
        } else {
            // For instant payments, create expense and supplier payment records
            if ($goodsReceipt->supplier_id && $goodsReceipt->total_cost > 0) {
                // Find or create expense category for goods purchases
                $expenseCategory = \App\Models\ExpenseCategory::byAccount(auth()->user()->account_id)
                    ->where(function($q) {
                        $q->where('name', 'Mal alışı')
                          ->orWhere('name', 'Təchizatçı ödəməsi');
                    })
                    ->first();

                // If no category exists, create a default one
                if (!$expenseCategory) {
                    $expenseCategory = \App\Models\ExpenseCategory::create([
                        'account_id' => auth()->user()->account_id,
                        'name' => 'Mal alışı',
                        'is_active' => true,
                    ]);
                }

                // Get the warehouse's branch or use the first available branch
                $warehouse = \App\Models\Warehouse::find($goodsReceipt->warehouse_id);
                $branchId = $warehouse->branch_id ?? \App\Models\Branch::byAccount(auth()->user()->account_id)->first()->id;

                // Create expense record
                $expense = \App\Models\Expense::create([
                    'account_id' => auth()->user()->account_id,
                    'category_id' => $expenseCategory->category_id,
                    'branch_id' => $branchId,
                    'amount' => $goodsReceipt->total_cost,
                    'description' => "Dərhal ödəniş - Mal qəbulu: {$goodsReceipt->receipt_number}",
                    'expense_date' => now()->format('Y-m-d'),
                    'payment_method' => 'cash', // Default to cash for instant payment
                    'user_id' => Auth::id(),
                    'supplier_id' => $goodsReceipt->supplier_id,
                    'goods_receipt_id' => $goodsReceipt->id,
                    'notes' => "Avtomatik yaradıldı - Dərhal ödəniş",
                ]);

                // Create supplier payment record
                $supplierPayment = \App\Models\SupplierPayment::create([
                    'account_id' => auth()->user()->account_id,
                    'supplier_id' => $goodsReceipt->supplier_id,
                    'amount' => $goodsReceipt->total_cost,
                    'description' => "Dərhal ödəniş - Mal qəbulu: {$goodsReceipt->receipt_number}",
                    'payment_date' => now()->format('Y-m-d'),
                    'payment_method' => 'cash',
                    'invoice_number' => $goodsReceipt->receipt_number,
                    'user_id' => Auth::id(),
                    'notes' => "Avtomatik yaradıldı - Xerc: {$expense->reference_number}",
                ]);
            }

            // Mark as paid immediately
            $goodsReceipt->update([
                'payment_status' => 'paid',
                'payment_method' => 'instant'
            ]);
        }
    }

    private function calculateCustomDueDate(GoodsReceipt $goodsReceipt, Request $request): ?\Carbon\Carbon
    {
        // Use custom payment terms if provided
        if ($request->use_custom_terms && $request->custom_payment_terms !== null) {
            return now()->addDays($request->custom_payment_terms);
        }

        // Fall back to supplier payment terms or goods receipt calculation
        return $goodsReceipt->calculateDueDate();
    }

    public function print(GoodsReceipt $goodsReceipt)
    {
        Gate::authorize('access-account-data', $goodsReceipt);

        $goodsReceipt->load(['product', 'variant', 'supplier', 'warehouse', 'employee', 'account']);

        return view('goods-receipts.print', [
            'receipt' => $goodsReceipt,
            'account' => $goodsReceipt->account,
        ]);
    }
}
