<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Branch;
use App\Models\User;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Payment;
use App\Models\ProductStock;
use App\Models\StockMovement;
use App\Models\NegativeStockAlert;
use App\Models\Warehouse;
use App\Services\ThermalPrintService;
use App\Services\FiscalPrinterService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class POSController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
        $this->middleware('account.access');
    }

    public function index()
    {
        Gate::authorize('create-account-data');

        try {
            $customers = Customer::where('account_id', Auth::user()->account_id)
                ->active()
                ->orderBy('name')
                ->get(['id', 'name', 'phone', 'email', 'customer_type']);

            $employees = User::where('account_id', Auth::user()->account_id)
                ->where('status', 'active')
                ->whereIn('role', ['account_owner', 'admin', 'branch_manager', 'warehouse_manager', 'sales_staff', 'cashier', 'accountant', 'tailor'])
                ->orderBy('name')
                ->get(['id', 'name', 'position', 'role']);

            $services = Product::where('account_id', Auth::user()->account_id)
                ->where("type", "service")
                ->where("is_active", true)
                ->orderBy('name')
                ->get(['id', 'name', 'sku as code', 'sale_price as price']);

            // Branch filtering based on user role
            if (Auth::user()->role === 'sales_staff') {
                $branches = Branch::where('id', Auth::user()->branch_id)
                    ->select('id', 'name')->get();
            } else {
                $branches = Branch::where('account_id', Auth::user()->account_id)
                    ->select('id', 'name')->get();
            }

            return Inertia::render('POS/Index', [
                'customers' => $customers,
                'employees' => $employees,
                'services' => $services,
                'branches' => $branches,
                'fiscalPrinterEnabled' => Auth::user()->account->fiscal_printer_enabled ?? false,
                'auth' => [
                    'user' => [
                        'role' => Auth::user()->role,
                        'branch_id' => Auth::user()->branch_id,
                    ],
                ],
            ]);
        } catch (\Exception $e) {
            \Log::error('POS Index Error: ' . $e->getMessage());
            return back()->with('error', 'Xəta baş verdi: ' . $e->getMessage());
        }
    }

    public function touch()
    {
        Gate::authorize('create-account-data');

        try {
            $customers = Customer::where('account_id', Auth::user()->account_id)
                ->active()
                ->orderBy('name')
                ->get(['id', 'name', 'phone', 'email', 'customer_type']);

            // Branch filtering based on user role
            if (Auth::user()->role === 'sales_staff') {
                $branches = Branch::where('id', Auth::user()->branch_id)
                    ->select('id', 'name')->get();
            } else {
                $branches = Branch::where('account_id', Auth::user()->account_id)
                    ->select('id', 'name')->get();
            }

            return Inertia::render('TouchPOS/Index', [
                'customers' => $customers,
                'branches' => $branches,
                'auth' => [
                    'user' => [
                        'role' => Auth::user()->role,
                        'branch_id' => Auth::user()->branch_id,
                    ],
                ],
            ]);
        } catch (\Exception $e) {
            \Log::error('TouchPOS Index Error: ' . $e->getMessage());
            return back()->with('error', 'Xəta baş verdi: ' . $e->getMessage());
        }
    }

    public function storeSale(Request $request)
    {
        Gate::authorize('create-account-data');

        \Log::info('POS Sale submission received', ['data' => $request->all()]);

        // Validate sale data
        $rules = [
            'customer_id' => 'nullable|exists:customers,id',
            'branch_id' => 'required|exists:branches,id',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.variant_id' => 'nullable|exists:product_variants,id',
            'items.*.quantity' => 'required|numeric|min:0.001',
            'items.*.base_quantity' => 'nullable|numeric|min:0.001',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.discount_amount' => 'nullable|numeric|min:0',
            'tax_amount' => 'nullable|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
            'payment_status' => 'required|in:paid,credit,partial',
            'payment_method' => 'nullable|in:nağd,kart,köçürmə',
            'paid_amount' => 'nullable|numeric|min:0',
            'credit_amount' => 'nullable|numeric|min:0',
            'credit_due_date' => 'nullable|date|after:today',
            'credit_description' => 'nullable|string|max:500',
        ];

        // For credit or partial payment, customer is required
        if (in_array($request->payment_status, ['credit', 'partial'])) {
            $rules['customer_id'] = 'required|exists:customers,id';
        }

        $validated = $request->validate($rules);

        \Log::info('POS Sale validation passed', ['validated' => $validated]);

        try {
            $sale = DB::transaction(function() use ($validated) {
                $accountId = Auth::user()->account_id;
                $userId = Auth::id();

                \Log::info('Creating sale in transaction', ['account_id' => $accountId, 'user_id' => $userId]);

                // Calculate totals
                $subtotal = 0;
                foreach ($validated['items'] as $item) {
                    $itemTotal = ($item['quantity'] * $item['unit_price']) - ($item['discount_amount'] ?? 0);
                    $subtotal += $itemTotal;
                }

                $taxAmount = $validated['tax_amount'] ?? 0;
                $discountAmount = $validated['discount_amount'] ?? 0;
                $total = $subtotal + $taxAmount - $discountAmount;

                \Log::info('Calculated totals', ['subtotal' => $subtotal, 'tax' => $taxAmount, 'discount' => $discountAmount, 'total' => $total]);

                // Create sale
                $sale = Sale::create([
                    'account_id' => $accountId,
                    'branch_id' => $validated['branch_id'],
                    'customer_id' => $validated['customer_id'],
                    'subtotal' => $subtotal,
                    'tax_amount' => $taxAmount,
                    'discount_amount' => $discountAmount,
                    'total' => $total,
                    'status' => 'completed',
                    'user_id' => $userId,
                    'notes' => $validated['notes'],
                    'sale_date' => now(),
                    'payment_status' => $validated['payment_status'],
                    'paid_amount' => $validated['paid_amount'] ?? 0,
                    'credit_due_date' => $validated['credit_due_date'] ?? null,
                    'use_fiscal_printer' => $validated['use_fiscal_printer'] ?? true,
                ]);

                \Log::info('Sale created successfully', ['sale_id' => $sale->sale_id, 'sale_number' => $sale->sale_number]);

                // Create sale items
                foreach ($validated['items'] as $item) {
                    SaleItem::create([
                        'sale_id' => $sale->sale_id,
                        'product_id' => $item['product_id'],
                        'variant_id' => $item['variant_id'] ?? null,
                        'quantity' => $item['quantity'],
                        'unit_price' => $item['unit_price'],
                        'discount_amount' => $item['discount_amount'] ?? 0,
                        'total' => ($item['quantity'] * $item['unit_price']) - ($item['discount_amount'] ?? 0),
                    ]);

                    // Update stock for products (with variant support)
                    if (isset($item['product_id']) && $item['product_id']) {
                        $this->updateProductStock(
                            $item['product_id'],
                            $item['base_quantity'] ?? $item['quantity'],
                            $sale,
                            $item['variant_id'] ?? null
                        );
                    }
                }

                // Handle credit sale if specified
                if (($validated['payment_status'] === 'credit' || $validated['payment_status'] === 'partial') &&
                    ($validated['credit_amount'] ?? 0) > 0) {
                    $creditAmount = $validated['credit_amount'];
                    $totalPaid = $validated['paid_amount'] ?? 0;

                    // Validate that payments + credit = total
                    if (($totalPaid + $creditAmount) != $total) {
                        throw new \Exception('Ödəmə məbləği və borc məbləği cəmi ümumi məbləğə bərabər olmalıdır.');
                    }

                    // Create customer credit record
                    $sale->setAsCredit(
                        $creditAmount,
                        $validated['credit_due_date'] ?? null,
                        $validated['credit_description'] ?? "POS satışı borcu: {$sale->sale_number}"
                    );

                    \Log::info('Credit created for sale', [
                        'sale_id' => $sale->sale_id,
                        'credit_amount' => $creditAmount,
                        'customer_credit_id' => $sale->customer_credit_id
                    ]);
                }

                // Create payment records based on payment status
                $paymentMethod = $validated['payment_method'] ?? 'nağd'; // Default to cash if not specified

                if ($validated['payment_status'] === 'paid') {
                    // Full payment - create payment record for full amount
                    Payment::create([
                        'sale_id' => $sale->sale_id,
                        'method' => $paymentMethod,
                        'amount' => $total,
                        'notes' => 'POS satışı - tam ödəniş',
                    ]);
                    \Log::info('Payment created for paid sale', ['sale_id' => $sale->sale_id, 'amount' => $total, 'method' => $paymentMethod]);
                } elseif ($validated['payment_status'] === 'partial' && ($validated['paid_amount'] ?? 0) > 0) {
                    // Partial payment - create payment record for paid amount
                    Payment::create([
                        'sale_id' => $sale->sale_id,
                        'method' => $paymentMethod,
                        'amount' => $validated['paid_amount'],
                        'notes' => 'POS satışı - qismən ödəniş',
                    ]);
                    \Log::info('Payment created for partial sale', ['sale_id' => $sale->sale_id, 'amount' => $validated['paid_amount'], 'method' => $paymentMethod]);
                }
                // Note: For payment_status = 'credit', no payment record is created (full credit sale)

                return $sale;
            });

            \Log::info('Sale transaction completed successfully', ['sale_id' => $sale->sale_id]);

            // Check if auto-print is enabled
            $account = Auth::user()->account;
            $autoPrint = $account->auto_print_receipt ?? false;

            // Send to fiscal printer if enabled and sale requires it
            $fiscalPrinted = false;
            $fiscalNumber = null;
            $fiscalError = null;

            if ($account->fiscal_printer_enabled && $sale->use_fiscal_printer) {
                $fiscalService = app(FiscalPrinterService::class);
                $fiscalResult = $fiscalService->printReceipt($account->id, $sale);

                if ($fiscalResult['success']) {
                    $fiscalPrinted = true;
                    $fiscalNumber = $fiscalResult['fiscal_number'] ?? null;

                    if ($fiscalNumber) {
                        $sale->update(['fiscal_number' => $fiscalNumber]);
                        \Log::info('Fiscal receipt printed', [
                            'sale_id' => $sale->sale_id,
                            'fiscal_number' => $fiscalNumber
                        ]);
                    }
                } else {
                    $fiscalError = $fiscalResult['error'] ?? 'Unknown fiscal printer error';
                    \Log::warning('Fiscal printer failed', [
                        'sale_id' => $sale->sale_id,
                        'error' => $fiscalError
                    ]);
                }
            }

            // Check if request is from Touch POS - stay on POS page, don't redirect
            $referrer = $request->header('referer');
            $isTouchPOS = (
                ($referrer && str_contains($referrer, '/pos/touch')) ||
                $request->header('X-Touch-POS') ||
                $request->header('X-Inertia-Partial-Component') === 'TouchPOS/Index'
            );

            if ($isTouchPOS) {
                return redirect()->route('pos.touch')
                    ->with('success', 'Satış uğurla tamamlandı. Qaimə #' . $sale->sale_number)
                    ->with('sale_completed', true)
                    ->with('sale_id', $sale->sale_id)
                    ->with('sale_number', $sale->sale_number)
                    ->with('auto_print', $autoPrint)
                    ->with('fiscal_printed', $fiscalPrinted)
                    ->with('fiscal_number', $fiscalNumber)
                    ->with('fiscal_error', $fiscalError);
            }

            // For regular POS, redirect to sales detail page
            return redirect()->route('sales.show', $sale->sale_id)
                ->with('success', 'Satış uğurla tamamlandı. Qaimə #' . $sale->sale_number)
                ->with('auto_print', $autoPrint)
                ->with('print_sale_id', $sale->sale_id)
                ->with('fiscal_printed', $fiscalPrinted)
                ->with('fiscal_number', $fiscalNumber)
                ->with('fiscal_error', $fiscalError);
        } catch (\Exception $e) {
            \Log::error('POS Sale creation failed', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            
            // For Inertia requests, redirect back with validation errors
            return back()->withErrors([
                'general' => 'Satış zamanı xəta: ' . $e->getMessage()
            ])->withInput();
        }
    }


    private function updateProductStock(int $productId, float $quantity, Sale $sale, ?int $variantId = null): void
    {
        // Get the branch and its accessible warehouses
        $branch = Branch::find($sale->branch_id);

        if (!$branch) {
            return; // No branch found, skip stock update
        }

        // Get the first warehouse that the branch can modify stock for
        $warehouse = $branch->warehouses()
            ->wherePivot('can_modify_stock', true)
            ->first();

        // If no accessible warehouse with modify permissions, fall back to main warehouse
        if (!$warehouse) {
            $warehouse = Warehouse::where('account_id', $sale->account_id)
                ->where('type', 'main')
                ->first();
        }

        if ($warehouse) {
            $productStock = ProductStock::firstOrCreate([
                'product_id' => $productId,
                'variant_id' => $variantId,
                'warehouse_id' => $warehouse->id,
                'account_id' => $sale->account_id,
            ], [
                'quantity' => 0,
                'min_level' => 3,
            ]);

            $productStock->decrement('quantity', $quantity);

            StockMovement::create([
                'account_id' => $sale->account_id,
                'warehouse_id' => $warehouse->id,
                'product_id' => $productId,
                'variant_id' => $variantId,
                'movement_type' => 'xaric_olma',
                'quantity' => -$quantity,
                'reference_type' => 'sale',
                'reference_id' => $sale->sale_id,
                'notes' => "POS Satış #{$sale->sale_number} üçün xaric olma",
            ]);
        }
    }


    // ========================================
    // PRODUCT VARIANT SUPPORT METHODS (TASK-007)
    // ========================================

    /**
     * Search products for POS (with variant support)
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function searchProducts(Request $request)
    {
        Gate::authorize('view-account-data');

        $accountId = Auth::user()->account_id;
        $search = $request->input('q');
        $branchId = $request->input('branch_id');

        if (empty($search)) {
            return response()->json([]);
        }

        $products = Product::where('account_id', $accountId)
            ->where('is_active', true)
            ->where(function($query) use ($search) {
                $query->where('name', 'like', "%{$search}%")
                      ->orWhere('barcode', $search)
                      ->orWhere('sku', $search);
            })
            ->with(['variants' => function($q) use ($accountId) {
                $q->where('account_id', $accountId)
                  ->where('is_active', true)
                  ->with(['stock' => function($sq) use ($accountId) {
                      $sq->where('account_id', $accountId);
                  }]);
            }])
            ->limit(20)
            ->get()
            ->map(function($product) use ($branchId) {
                $effectivePrice = $product->getEffectivePrice($branchId);
                $discount = $product->getActiveDiscount($branchId);

                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'barcode' => $product->barcode,
                    'sale_price' => $effectivePrice, // Use effective price (discounted if applicable)
                    'original_price' => $discount ? $product->sale_price : null,
                    'discount_percentage' => $discount ? $discount['discount_percentage'] : null,
                    'has_discount' => $discount !== null,
                    'has_variants' => $product->variants->isNotEmpty(),
                    'variants' => $product->variants->map(function($variant) use ($branchId) {
                        $variantDiscount = $variant->getActiveDiscount($branchId);
                        $finalPrice = $variant->getFinalPriceForBranch($branchId);

                        return [
                            'id' => $variant->id,
                            'size' => $variant->size,
                            'color' => $variant->color,
                            'color_code' => $variant->color_code,
                            'display_name' => $variant->display_name,
                            'short_display' => $variant->short_display,
                            'final_price' => $finalPrice, // Use discounted final price
                            'original_price' => $variantDiscount ? $variant->final_price : null,
                            'discount_percentage' => $variantDiscount ? $variantDiscount['discount_percentage'] : null,
                            'has_discount' => $variantDiscount !== null,
                            'barcode' => $variant->barcode,
                            'sku' => $variant->sku,
                            'total_stock' => $variant->getTotalStock(),
                            'is_active' => $variant->is_active,
                        ];
                    }),
                    'category' => $product->category?->name,
                ];
            });

        return response()->json($products);
    }

    /**
     * Scan barcode (supports both product and variant barcodes)
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function scanBarcode(Request $request)
    {
        Gate::authorize('view-account-data');

        $accountId = Auth::user()->account_id;
        $barcode = $request->input('barcode');
        $branchId = $request->input('branch_id');

        if (empty($barcode)) {
            return response()->json(['error' => 'Barkod tələb olunur'], 400);
        }

        // First, try to find variant by barcode
        $variant = ProductVariant::where('account_id', $accountId)
            ->where('barcode', $barcode)
            ->where('is_active', true)
            ->with(['product' => function($q) use ($accountId) {
                $q->where('account_id', $accountId);
            }])
            ->first();

        if ($variant && $variant->product && $variant->product->is_active) {
            $finalPrice = $variant->getFinalPriceForBranch($branchId);
            $discount = $variant->getActiveDiscount($branchId);

            // Found variant - return with product data
            return response()->json([
                'type' => 'variant',
                'product' => [
                    'id' => $variant->product->id,
                    'name' => $variant->product->name,
                    'category' => $variant->product->category?->name,
                    'has_variants' => true,
                ],
                'variant' => [
                    'id' => $variant->id,
                    'size' => $variant->size,
                    'color' => $variant->color,
                    'color_code' => $variant->color_code,
                    'display_name' => $variant->display_name,
                    'short_display' => $variant->short_display,
                    'final_price' => $finalPrice, // Use discounted price
                    'original_price' => $discount ? $variant->final_price : null,
                    'discount_percentage' => $discount ? $discount['discount_percentage'] : null,
                    'has_discount' => $discount !== null,
                    'barcode' => $variant->barcode,
                    'total_stock' => $variant->getTotalStock(),
                ]
            ]);
        }

        // If variant not found, try to find product by barcode
        $product = Product::where('account_id', $accountId)
            ->where('barcode', $barcode)
            ->where('is_active', true)
            ->with(['variants' => function($q) use ($accountId) {
                $q->where('account_id', $accountId)
                  ->where('is_active', true);
            }])
            ->first();

        if ($product) {
            $effectivePrice = $product->getEffectivePrice($branchId);
            $discount = $product->getActiveDiscount($branchId);
            // Found product
            $hasVariants = $product->variants->isNotEmpty();

            return response()->json([
                'type' => 'product',
                'product' => [
                    'id' => $product->id,
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'barcode' => $product->barcode,
                    'sale_price' => $effectivePrice, // Use discounted price
                    'original_price' => $discount ? $product->sale_price : null,
                    'discount_percentage' => $discount ? $discount['discount_percentage'] : null,
                    'has_discount' => $discount !== null,
                    'category' => $product->category?->name,
                    'has_variants' => $hasVariants,
                    'variants' => $hasVariants ? $product->variants->map(function($v) use ($branchId) {
                        $variantFinalPrice = $v->getFinalPriceForBranch($branchId);
                        $variantDiscount = $v->getActiveDiscount($branchId);

                        return [
                            'id' => $v->id,
                            'size' => $v->size,
                            'color' => $v->color,
                            'color_code' => $v->color_code,
                            'display_name' => $v->display_name,
                            'final_price' => $variantFinalPrice, // Use discounted price
                            'original_price' => $variantDiscount ? $v->final_price : null,
                            'discount_percentage' => $variantDiscount ? $variantDiscount['discount_percentage'] : null,
                            'has_discount' => $variantDiscount !== null,
                            'total_stock' => $v->getTotalStock(),
                        ];
                    }) : null,
                ],
                'variant' => null, // Requires user to select variant
            ]);
        }

        // Not found
        return response()->json(['error' => 'Məhsul və ya variant tapılmadı'], 404);
    }

    /**
     * Add product to cart (with variant support)
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function addToCart(Request $request)
    {
        Gate::authorize('create-account-data');

        $accountId = Auth::user()->account_id;

        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'variant_id' => 'nullable|exists:product_variants,id',
            'quantity' => 'required|numeric|min:0.01',
            'price' => 'required|numeric|min:0',
        ]);

        // Verify product belongs to account
        $product = Product::where('account_id', $accountId)
            ->where('id', $validated['product_id'])
            ->firstOrFail();

        // If variant provided, verify it belongs to account and product
        $variant = null;
        if (!empty($validated['variant_id'])) {
            $variant = ProductVariant::where('account_id', $accountId)
                ->where('product_id', $validated['product_id'])
                ->where('id', $validated['variant_id'])
                ->firstOrFail();
        }

        // Check if product requires variant but none provided
        $hasVariants = ProductVariant::where('account_id', $accountId)
            ->where('product_id', $product->id)
            ->where('is_active', true)
            ->exists();

        if ($hasVariants && !$variant) {
            return response()->json([
                'error' => 'Zəhmət olmasa bu məhsul üçün variant (ölçü/rəng) seçin'
            ], 422);
        }

        // Add to session cart
        $cart = session()->get('pos_cart', []);

        // Generate unique cart key (product + variant)
        $cartKey = $product->id . '_' . ($variant?->id ?? '0');

        if (isset($cart[$cartKey])) {
            // Update existing cart item
            $cart[$cartKey]['quantity'] += $validated['quantity'];
            $cart[$cartKey]['subtotal'] = $cart[$cartKey]['quantity'] * $cart[$cartKey]['price'];
        } else {
            // Add new cart item
            $cart[$cartKey] = [
                'product_id' => $product->id,
                'variant_id' => $variant?->id,
                'product_name' => $product->name,
                'variant_display' => $variant?->short_display,
                'quantity' => $validated['quantity'],
                'price' => $validated['price'],
                'subtotal' => $validated['price'] * $validated['quantity'],
            ];
        }

        session()->put('pos_cart', $cart);

        return response()->json([
            'success' => true,
            'cart' => $cart,
            'cart_count' => count($cart),
            'cart_total' => array_sum(array_column($cart, 'subtotal')),
        ]);
    }
}