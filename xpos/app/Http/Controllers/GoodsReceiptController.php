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
use App\Models\AsyncJob;
use App\Services\DocumentUploadService;
use App\Jobs\ProcessGoodsReceipt;
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

        $query = GoodsReceipt::with(['items.product', 'items.variant', 'supplier', 'warehouse', 'employee', 'supplierCredit'])
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
                  ->orWhere('invoice_number', 'like', '%' . $searchTerm . '%')
                  ->orWhereHas('items.product', function ($subQ) use ($searchTerm) {
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

        if ($request->filled('receipt_number')) {
            $query->where('receipt_number', 'like', '%' . $request->receipt_number . '%');
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

            $invoiceNumber = $request->invoice_number;
            $totalCost = 0;
            $items = [];

            // Validate and prepare all items first
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

                $totalCost += $itemFinalTotal;

                // Store item data for later
                $items[] = [
                    'product_id' => $productData['product_id'],
                    'variant_id' => $productData['variant_id'] ?? null,
                    'quantity' => $inventoryQuantity,
                    'unit' => $productData['receiving_unit'] ?: $productData['unit'],
                    'unit_cost' => $unitCost,
                    'total_cost' => $itemFinalTotal,
                    'discount_percent' => $discountPercent,
                    'sale_price' => $productData['sale_price'] ?? null,
                    'additional_data' => [
                        'received_quantity' => $productData['quantity'],
                        'received_unit' => $productData['receiving_unit'],
                        'base_quantity' => $inventoryQuantity,
                        'base_unit' => $productData['unit'],
                        'subtotal_before_discount' => $itemSubtotal,
                        'discount_percent' => $discountPercent,
                        'discount_amount' => $itemDiscountAmount,
                    ],
                    'product' => $product,
                ];
            }

            // Create ONE goods receipt for the entire transaction
            $goodsReceipt = new GoodsReceipt();
            $goodsReceipt->account_id = auth()->user()->account_id;
            $goodsReceipt->warehouse_id = $request->warehouse_id;
            $goodsReceipt->supplier_id = $request->supplier_id;
            $goodsReceipt->employee_id = auth()->id();
            $goodsReceipt->invoice_number = $invoiceNumber;
            $goodsReceipt->total_cost = sprintf('%.2f', $totalCost);
            $goodsReceipt->status = $status;
            $goodsReceipt->notes = $request->notes;

            // Upload document if provided
            if ($request->hasFile('document')) {
                $documentPath = $this->documentService->uploadGoodsReceiptDocument(
                    $request->file('document'),
                    'qaimə'
                );
                $goodsReceipt->document_path = $documentPath;
            }

            $goodsReceipt->save();

            // Create goods receipt items
            foreach ($items as $itemData) {
                $item = \App\Models\GoodsReceiptItem::create([
                    'goods_receipt_id' => $goodsReceipt->id,
                    'account_id' => auth()->user()->account_id,
                    'product_id' => $itemData['product_id'],
                    'variant_id' => $itemData['variant_id'],
                    'quantity' => $itemData['quantity'],
                    'unit' => $itemData['unit'],
                    'unit_cost' => $itemData['unit_cost'],
                    'total_cost' => $itemData['total_cost'],
                    'discount_percent' => $itemData['discount_percent'],
                    'additional_data' => $itemData['additional_data'],
                ]);

                // Skip stock and price updates for drafts
                if ($isDraft) {
                    continue;
                }

                // Update product prices
                if (!empty($itemData['unit_cost'])) {
                    $itemData['product']->purchase_price = $itemData['unit_cost'];
                    $itemData['product']->save();
                }

                if (!empty($itemData['sale_price'])) {
                    $itemData['product']->sale_price = $itemData['sale_price'];
                    $itemData['product']->save();
                }

                // Create stock movement
                $stockMovement = new StockMovement();
                $stockMovement->account_id = auth()->user()->account_id;
                $stockMovement->warehouse_id = $request->warehouse_id;
                $stockMovement->product_id = $itemData['product_id'];
                $stockMovement->variant_id = $itemData['variant_id'];
                $stockMovement->movement_type = 'daxil_olma';
                $stockMovement->quantity = $itemData['quantity'];
                $stockMovement->unit_cost = $itemData['unit_cost'];
                $stockMovement->reference_type = 'goods_receipt';
                $stockMovement->reference_id = $goodsReceipt->id;
                $stockMovement->employee_id = $goodsReceipt->employee_id;
                $stockMovement->notes = "Mal qəbulu: {$goodsReceipt->receipt_number}";
                $stockMovement->save();

                // Update product stock
                $productStock = ProductStock::firstOrCreate(
                    [
                        'product_id' => $itemData['product_id'],
                        'variant_id' => $itemData['variant_id'],
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
                $productStock->increment('quantity', $itemData['quantity']);

                // Create stock history record
                StockHistory::create([
                    'product_id' => $itemData['product_id'],
                    'variant_id' => $itemData['variant_id'],
                    'warehouse_id' => $request->warehouse_id,
                    'quantity_before' => $quantityBefore,
                    'quantity_change' => $itemData['quantity'],
                    'quantity_after' => $quantityBefore + $itemData['quantity'],
                    'type' => 'daxil_olma',
                    'reference_type' => 'goods_receipt',
                    'reference_id' => $goodsReceipt->id,
                    'user_id' => auth()->id(),
                    'notes' => "Mal qəbulu: {$goodsReceipt->receipt_number}",
                    'occurred_at' => $goodsReceipt->created_at ?? now(),
                ]);
            }

            // Process payment after successful goods receipt creation (skip for drafts)
            if (!$isDraft) {
                $this->processGoodsReceiptPayment($goodsReceipt, $request);
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

    /**
     * Store a goods receipt asynchronously (background job)
     * Returns immediately with a job ID for polling
     */
    public function storeAsync(Request $request)
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
            'idempotency_key' => 'nullable|string|max:100',
        ]);

        $user = Auth::user();
        $accountId = $user->account_id;
        $userId = $user->id;

        // Generate idempotency key if not provided
        $idempotencyKey = $request->idempotency_key ?? AsyncJob::generateIdempotencyKey(
            $accountId,
            $userId,
            $request->all()
        );

        // Check for duplicate submission
        $existingJob = AsyncJob::findByIdempotencyKey($accountId, $idempotencyKey);
        if ($existingJob) {
            return response()->json([
                'success' => true,
                'job_id' => $existingJob->job_id,
                'message' => 'Bu sorğu artıq emal edilir',
                'is_duplicate' => true,
            ]);
        }

        // Handle document upload - save to temp location for job to process
        $documentTempPath = null;
        if ($request->hasFile('document')) {
            $file = $request->file('document');
            $tempFileName = uniqid('gr_doc_') . '.' . $file->getClientOriginalExtension();
            $documentTempPath = 'temp/goods-receipt-docs/' . $tempFileName;
            Storage::disk('local')->put($documentTempPath, file_get_contents($file->getRealPath()));
        }

        // Prepare data for the job (exclude file)
        $jobData = $request->except(['document', 'idempotency_key']);

        // Create async job record
        $asyncJob = AsyncJob::create([
            'account_id' => $accountId,
            'user_id' => $userId,
            'type' => 'goods_receipt',
            'status' => 'pending',
            'message' => 'Növbədə gözləyir...',
            'input_data' => $jobData,
            'idempotency_key' => $idempotencyKey,
        ]);

        // Dispatch the job to the queue
        ProcessGoodsReceipt::dispatch($asyncJob, $documentTempPath)
            ->onQueue('goods-receipts');

        return response()->json([
            'success' => true,
            'job_id' => $asyncJob->job_id,
            'message' => 'Mal qəbulu növbəyə əlavə edildi',
            'is_duplicate' => false,
        ]);
    }

    /**
     * Get the status of an async goods receipt job
     */
    public function jobStatus(Request $request, string $jobId)
    {
        Gate::authorize('access-account-data');

        $asyncJob = AsyncJob::where('job_id', $jobId)
            ->where('account_id', Auth::user()->account_id)
            ->first();

        if (!$asyncJob) {
            return response()->json([
                'success' => false,
                'message' => 'İş tapılmadı',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'job_id' => $asyncJob->job_id,
            'status' => $asyncJob->status,
            'message' => $asyncJob->message,
            'data' => $asyncJob->result_data ?? [],
            'created_at' => $asyncJob->created_at?->toISOString(),
            'started_at' => $asyncJob->started_at?->toISOString(),
            'completed_at' => $asyncJob->completed_at?->toISOString(),
        ]);
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

            // Generate receipt number and mark as completed
            $goodsReceipt->receipt_number = $goodsReceipt->generateReceiptNumber();
            $goodsReceipt->status = 'completed';
            $goodsReceipt->save();

            // Process all items in this goods receipt
            foreach ($goodsReceipt->items as $item) {
                // Update product purchase price
                if ($item->unit_cost > 0) {
                    $product = Product::find($item->product_id);
                    if ($product) {
                        $product->purchase_price = $item->unit_cost;
                        $product->save();
                    }
                }

                // Create stock movement
                $stockMovement = new StockMovement();
                $stockMovement->account_id = $goodsReceipt->account_id;
                $stockMovement->warehouse_id = $goodsReceipt->warehouse_id;
                $stockMovement->product_id = $item->product_id;
                $stockMovement->variant_id = $item->variant_id;
                $stockMovement->movement_type = 'daxil_olma';
                $stockMovement->quantity = $item->quantity;
                $stockMovement->unit_cost = $item->unit_cost;
                $stockMovement->reference_type = 'goods_receipt';
                $stockMovement->reference_id = $goodsReceipt->id;
                $stockMovement->employee_id = $goodsReceipt->employee_id;
                $stockMovement->notes = "Mal qəbulu: {$goodsReceipt->receipt_number}";
                $stockMovement->save();

                // Update product stock
                $productStock = ProductStock::firstOrCreate(
                    [
                        'product_id' => $item->product_id,
                        'variant_id' => $item->variant_id,
                        'warehouse_id' => $goodsReceipt->warehouse_id,
                        'account_id' => $goodsReceipt->account_id,
                    ],
                    [
                        'quantity' => 0,
                        'reserved_quantity' => 0,
                        'min_level' => 3,
                    ]
                );

                $quantityBefore = $productStock->quantity;
                $productStock->increment('quantity', $item->quantity);

                // Create stock history record
                StockHistory::create([
                    'product_id' => $item->product_id,
                    'variant_id' => $item->variant_id,
                    'warehouse_id' => $goodsReceipt->warehouse_id,
                    'quantity_before' => $quantityBefore,
                    'quantity_change' => $item->quantity,
                    'quantity_after' => $quantityBefore + $item->quantity,
                    'type' => 'daxil_olma',
                    'reference_type' => 'goods_receipt',
                    'reference_id' => $goodsReceipt->id,
                    'user_id' => auth()->id(),
                    'notes' => "Mal qəbulu: {$goodsReceipt->receipt_number}",
                    'occurred_at' => $goodsReceipt->created_at ?? now(),
                ]);
            }

            // Process payment
            $this->processGoodsReceiptPayment($goodsReceipt, $request);

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

        $goodsReceipt->load([
            'items.product',
            'items.variant',
            'supplier',
            'warehouse',
            'employee',
            'supplierCredit',
            'expenses.user', // Load payments (expenses) related to this goods receipt
        ]);

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

        $goodsReceipt->load(['items.product', 'items.variant', 'supplier', 'warehouse', 'employee']);

        $suppliers = Supplier::byAccount(auth()->user()->account_id)
            ->active()
            ->select('id', 'name', 'contact_person', 'phone', 'payment_terms_days', 'payment_terms_text')
            ->get();

        $warehouses = Warehouse::byAccount(auth()->user()->account_id)
            ->select('id', 'name', 'location')
            ->get();

        return Inertia::render('GoodsReceipts/Edit', [
            'receipt' => $goodsReceipt,
            'suppliers' => $suppliers,
            'warehouses' => $warehouses,
        ]);
    }

    public function update(Request $request, GoodsReceipt $goodsReceipt)
    {
        Gate::authorize('access-account-data');

        // For drafts, allow full editing of items
        // For completed receipts, only allow updating basic fields (no item changes)
        $isDraft = $goodsReceipt->isDraft();

        if ($isDraft) {
            // Full validation for drafts (same as store)
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
            ]);
        } else {
            // Limited validation for completed receipts (only basic fields)
            $request->validate([
                'warehouse_id' => 'required|exists:warehouses,id',
                'supplier_id' => 'nullable|exists:suppliers,id',
                'invoice_number' => 'nullable|string|max:255',
                'notes' => 'nullable|string|max:1000',
                'document' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            ]);
        }

        try {
            DB::beginTransaction();

            if ($isDraft) {
                // DRAFT EDITING: Allow full changes including items

                // Delete all existing items (no stock impact since it's a draft)
                $goodsReceipt->items()->delete();

                // Recalculate total from new products
                $totalCost = 0;
                $items = [];

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

                    $inventoryQuantity = $productData['base_quantity'] ?: $productData['quantity'];
                    $product = Product::find($productData['product_id']);

                    // Calculate costs with per-product discount
                    $unitCost = !empty($productData['unit_cost']) ? $productData['unit_cost'] : ($product->purchase_price ?? 0);
                    $discountPercent = floatval($productData['discount_percent'] ?? 0);
                    $itemSubtotal = $unitCost * $inventoryQuantity;
                    $itemDiscountAmount = ($itemSubtotal * $discountPercent) / 100;
                    $itemFinalTotal = $itemSubtotal - $itemDiscountAmount;

                    $totalCost += $itemFinalTotal;

                    $items[] = [
                        'product_id' => $productData['product_id'],
                        'variant_id' => $productData['variant_id'] ?? null,
                        'quantity' => $inventoryQuantity,
                        'unit' => $productData['receiving_unit'] ?: $productData['unit'],
                        'unit_cost' => $unitCost,
                        'total_cost' => $itemFinalTotal,
                        'discount_percent' => $discountPercent,
                        'additional_data' => [
                            'received_quantity' => $productData['quantity'],
                            'received_unit' => $productData['receiving_unit'],
                            'base_quantity' => $inventoryQuantity,
                            'base_unit' => $productData['unit'],
                            'subtotal_before_discount' => $itemSubtotal,
                            'discount_percent' => $discountPercent,
                            'discount_amount' => $itemDiscountAmount,
                        ],
                    ];
                }

                // Update receipt-level fields
                $goodsReceipt->warehouse_id = $request->warehouse_id;
                $goodsReceipt->supplier_id = $request->supplier_id;
                $goodsReceipt->invoice_number = $request->invoice_number;
                $goodsReceipt->total_cost = sprintf('%.2f', $totalCost);
                $goodsReceipt->notes = $request->notes;

                // Handle document upload
                if ($request->hasFile('document')) {
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

                // Create new items
                foreach ($items as $itemData) {
                    \App\Models\GoodsReceiptItem::create([
                        'goods_receipt_id' => $goodsReceipt->id,
                        'account_id' => auth()->user()->account_id,
                        'product_id' => $itemData['product_id'],
                        'variant_id' => $itemData['variant_id'],
                        'quantity' => $itemData['quantity'],
                        'unit' => $itemData['unit'],
                        'unit_cost' => $itemData['unit_cost'],
                        'total_cost' => $itemData['total_cost'],
                        'discount_percent' => $itemData['discount_percent'],
                        'additional_data' => $itemData['additional_data'],
                    ]);
                }

            } else {
                // COMPLETED RECEIPT EDITING: Only allow basic field updates (no item changes)

                $goodsReceipt->warehouse_id = $request->warehouse_id;
                $goodsReceipt->supplier_id = $request->supplier_id;
                $goodsReceipt->invoice_number = $request->invoice_number;
                $goodsReceipt->notes = $request->notes;

                // Handle document upload
                if ($request->hasFile('document')) {
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
            }

            DB::commit();

            return redirect()->route('goods-receipts.show', $goodsReceipt)
                ->with('success', 'Mal qəbulu uğurla yeniləndi');

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error updating goods receipt: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'receipt_id' => $goodsReceipt->id,
            ]);
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

    public function destroy(GoodsReceipt $goodsReceipt)
    {
        Gate::authorize('delete-account-data');
        Gate::authorize('access-account-data', $goodsReceipt);

        // STRICT VALIDATION: Block if paid
        // Paid receipts have completed financial transactions that should not be reversed
        if ($goodsReceipt->payment_status === 'paid') {
            return back()->withErrors([
                'error' => 'Ödənilmiş mal qəbulunu silmək mümkün deyil. Əvvəlcə ödəməni (xərci) silin.'
            ]);
        }

        // STRICT VALIDATION: Check if any stock from this receipt has been sold (current stock < received quantity)
        // This prevents inventory data corruption
        foreach ($goodsReceipt->items as $item) {
            $currentStock = ProductStock::where('product_id', $item->product_id)
                ->where('warehouse_id', $goodsReceipt->warehouse_id)
                ->where('variant_id', $item->variant_id)
                ->where('account_id', $goodsReceipt->account_id)
                ->first();

            if ($currentStock && $currentStock->quantity < $item->quantity) {
                return back()->withErrors([
                    'error' => 'Diqqət: Cari stok miqdarı (' . $currentStock->quantity . ') qəbul edilən miqdardan (' . $item->quantity . ') azdır. ' .
                               'Stok satılmış ola bilər. Silmək təhlükəlidir və inventar məlumatlarını pozacaq. Məhsul: ' . $item->product->name
                ]);
            }
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

                // Delete the expense record
                $expense->delete();
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

            // STEP 4: REVERSE PRODUCT STOCK quantities for all items
            // This is critical for inventory accuracy
            foreach ($goodsReceipt->items as $item) {
                $productStock = ProductStock::where('product_id', $item->product_id)
                    ->where('variant_id', $item->variant_id)
                    ->where('warehouse_id', $goodsReceipt->warehouse_id)
                    ->where('account_id', $goodsReceipt->account_id)
                    ->first();

                if ($productStock) {
                    $quantityBefore = $productStock->quantity;
                    $productStock->decrement('quantity', (float) $item->quantity);

                    \Log::info("Reversed product stock", [
                        'product_id' => $item->product_id,
                        'variant_id' => $item->variant_id,
                        'warehouse_id' => $goodsReceipt->warehouse_id,
                        'quantity_before' => $quantityBefore,
                        'quantity_reversed' => $item->quantity,
                        'quantity_after' => $quantityBefore - (float) $item->quantity,
                    ]);

                    // STEP 5: Create STOCK HISTORY for audit trail
                    StockHistory::create([
                        'product_id' => $item->product_id,
                        'variant_id' => $item->variant_id,
                        'warehouse_id' => $goodsReceipt->warehouse_id,
                        'quantity_before' => $quantityBefore,
                        'quantity_change' => -(float) $item->quantity,
                        'quantity_after' => $quantityBefore - (float) $item->quantity,
                        'type' => 'duzelis_azaltma',
                        'reference_type' => 'goods_receipt_delete',
                        'reference_id' => $goodsReceipt->id,
                        'user_id' => auth()->id(),
                        'notes' => "Mal qəbulu silindi (kaskad): {$goodsReceipt->receipt_number} | " .
                                   "İstifadəçi: " . auth()->user()->name . " | " .
                                   "Tarix: " . now()->format('Y-m-d H:i:s') . " | " .
                                   "Ödəniş metodu: {$goodsReceipt->payment_method} | " .
                                   "Məbləğ: {$goodsReceipt->total_cost} AZN | " .
                                   "Məhsul: {$item->product->name} | " .
                                   "Səbəb: Tam kaskad silinmə (xərclər, ödəmələr, kredit və stok bərpa edildi)",
                        'occurred_at' => now(),
                    ]);
                }
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

                // Get the first branch that has access to this warehouse, or use the first available branch
                $warehouse = \App\Models\Warehouse::with('branches')->find($goodsReceipt->warehouse_id);
                $branchId = $warehouse->branches->first()?->id
                    ?? \App\Models\Branch::byAccount(auth()->user()->account_id)->first()?->id;

                // Validate that we have a branch
                if (!$branchId) {
                    throw new \Exception('Filial tapılmadı. Xahiş edirik sistem administratoru ilə əlaqə saxlayın.');
                }

                // Create expense record for instant payment
                $expense = \App\Models\Expense::create([
                    'account_id' => auth()->user()->account_id,
                    'category_id' => $expenseCategory->category_id,
                    'branch_id' => $branchId,
                    'amount' => $goodsReceipt->total_cost,
                    'description' => "Dərhal ödəniş - Mal qəbulu: {$goodsReceipt->receipt_number}",
                    'expense_date' => now()->format('Y-m-d'),
                    'payment_method' => 'cash', // Default to cash for instant payment
                    'invoice_number' => $goodsReceipt->receipt_number,
                    'user_id' => Auth::id(),
                    'supplier_id' => $goodsReceipt->supplier_id,
                    'goods_receipt_id' => $goodsReceipt->id,
                    'notes' => "Avtomatik yaradıldı - Dərhal ödəniş",
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

        $goodsReceipt->load(['items.product', 'items.variant', 'supplier', 'warehouse', 'employee', 'account']);

        return view('goods-receipts.print', [
            'receipt' => $goodsReceipt,
            'account' => $goodsReceipt->account,
        ]);
    }

    public function bulkDelete(Request $request)
    {
        Gate::authorize('delete-account-data');

        $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'required|integer|exists:goods_receipts,id',
        ]);

        try {
            DB::beginTransaction();

            $accountId = Auth::user()->account_id;
            $deletedCount = 0;
            $errors = [];

            // Fetch all goods receipts that belong to the user's account
            $goodsReceipts = GoodsReceipt::whereIn('id', $request->ids)
                ->where('account_id', $accountId)
                ->get();

            // Check if any IDs were not found or don't belong to the account
            if ($goodsReceipts->count() !== count($request->ids)) {
                throw new \Exception('Bəzi mal qəbulları tapılmadı və ya sizə aid deyil');
            }

            foreach ($goodsReceipts as $goodsReceipt) {
                // Validate business rules for each receipt
                if ($goodsReceipt->payment_status === 'paid') {
                    $errors[] = "Qəbul #{$goodsReceipt->receipt_number}: Ödənilmiş mal qəbulunu silmək mümkün deyil";
                    continue;
                }

                if ($goodsReceipt->payment_status === 'partial') {
                    $errors[] = "Qəbul #{$goodsReceipt->receipt_number}: Qismən ödənilmiş mal qəbulunu silmək mümkün deyil";
                    continue;
                }

                // Check if stock has been sold for completed receipts
                if ($goodsReceipt->status === 'completed') {
                    $hasStockIssues = false;
                    foreach ($goodsReceipt->items as $item) {
                        $currentStock = ProductStock::where('product_id', $item->product_id)
                            ->where('warehouse_id', $goodsReceipt->warehouse_id)
                            ->where('variant_id', $item->variant_id)
                            ->where('account_id', $goodsReceipt->account_id)
                            ->first();

                        if ($currentStock && $currentStock->quantity < $item->quantity) {
                            $errors[] = "Qəbul #{$goodsReceipt->receipt_number}: Stok satılmış ola bilər (Məhsul: {$item->product->name})";
                            $hasStockIssues = true;
                            break;
                        }
                    }

                    if ($hasStockIssues) {
                        continue;
                    }
                }

                // Delete supplier credit if exists
                if ($goodsReceipt->supplier_credit_id) {
                    $supplierCredit = \App\Models\SupplierCredit::find($goodsReceipt->supplier_credit_id);
                    if ($supplierCredit) {
                        if ($supplierCredit->status !== 'pending' || $supplierCredit->remaining_amount != $supplierCredit->amount) {
                            $errors[] = "Qəbul #{$goodsReceipt->receipt_number}: Təchizatçı kreditinə ödəmələr edilib";
                            continue;
                        }
                        $supplierCredit->delete();
                    }
                }

                // Delete linked expenses
                $linkedExpenses = \App\Models\Expense::where('goods_receipt_id', $goodsReceipt->id)->get();
                foreach ($linkedExpenses as $expense) {
                    $expense->delete();
                }

                // Delete stock movements
                StockMovement::where('reference_type', 'goods_receipt')
                    ->where('reference_id', $goodsReceipt->id)
                    ->delete();

                StockMovement::where('reference_type', 'goods_receipt_update')
                    ->where('reference_id', $goodsReceipt->id)
                    ->delete();

                // Reverse product stock for completed receipts
                if ($goodsReceipt->status === 'completed') {
                    foreach ($goodsReceipt->items as $item) {
                        $productStock = ProductStock::where('product_id', $item->product_id)
                            ->where('variant_id', $item->variant_id)
                            ->where('warehouse_id', $goodsReceipt->warehouse_id)
                            ->where('account_id', $goodsReceipt->account_id)
                            ->first();

                        if ($productStock) {
                            $quantityBefore = $productStock->quantity;
                            $productStock->decrement('quantity', (float) $item->quantity);

                            // Create stock history
                            StockHistory::create([
                                'product_id' => $item->product_id,
                                'variant_id' => $item->variant_id,
                                'warehouse_id' => $goodsReceipt->warehouse_id,
                                'quantity_before' => $quantityBefore,
                                'quantity_change' => -(float) $item->quantity,
                                'quantity_after' => $quantityBefore - (float) $item->quantity,
                                'type' => 'duzelis_azaltma',
                                'reference_type' => 'goods_receipt_delete',
                                'reference_id' => $goodsReceipt->id,
                                'user_id' => auth()->id(),
                                'notes' => "Toplu silinmə - Qəbul: {$goodsReceipt->receipt_number}",
                                'occurred_at' => now(),
                            ]);
                        }
                    }
                }

                // Delete document if exists
                if ($goodsReceipt->document_path) {
                    $this->documentService->deleteFile($goodsReceipt->document_path);
                }

                // Soft delete the goods receipt
                $goodsReceipt->delete();
                $deletedCount++;
            }

            DB::commit();

            if (count($errors) > 0) {
                return back()
                    ->with('warning', "$deletedCount mal qəbulu silindi. " . count($errors) . " qəbul silinə bilmədi:")
                    ->withErrors($errors);
            }

            return redirect()->route('goods-receipts.index')
                ->with('success', "$deletedCount mal qəbulu uğurla silindi");

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Bulk delete goods receipts failed: ' . $e->getMessage());
            return back()->withErrors(['error' => 'Toplu silinmə zamanı xəta baş verdi: ' . $e->getMessage()]);
        }
    }
}
