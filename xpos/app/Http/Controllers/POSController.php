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
use App\Models\StockHistory;
use App\Models\StockMovement;
use App\Models\NegativeStockAlert;
use App\Models\Warehouse;
use App\Services\ThermalPrintService;
use App\Services\FiscalPrinterService;
use App\Models\FiscalPrinterJob;
use App\Models\FiscalPrinterConfig;
use App\Services\LoyaltyService;
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
        Gate::authorize('access-pos');

        try {
            $accountId = Auth::user()->account_id;

            $employees = User::where('account_id', $accountId)
                ->where('status', 'active')
                ->whereIn('role', ['account_owner', 'admin', 'branch_manager', 'warehouse_manager', 'sales_staff', 'cashier', 'accountant'])
                ->orderBy('name')
                ->get(['id', 'name', 'position', 'role']);

            $services = Product::where('account_id', $accountId)
                ->where("type", "service")
                ->where("is_active", true)
                ->orderBy('name')
                ->get(['id', 'name', 'sku as code', 'sale_price as price']);

            // Get customers for gift card sales
            $customers = Customer::where('account_id', $accountId)
                ->select('id', 'name', 'phone')
                ->orderBy('name')
                ->get();

            // Branch filtering based on user role
            if (Auth::user()->role === 'sales_staff') {
                $branches = Branch::where('id', Auth::user()->branch_id)
                    ->select('id', 'name')->get();
            } else {
                $branches = Branch::where('account_id', $accountId)
                    ->select('id', 'name')->get();
            }

            // Get loyalty program
            $loyaltyService = app(LoyaltyService::class);
            $loyaltyProgram = $loyaltyService->getProgramForAccount($accountId);

            // Get fiscal printer config for shift status
            $fiscalConfig = \App\Models\FiscalPrinterConfig::where('account_id', $accountId)
                ->where('is_active', true)
                ->first();

            return Inertia::render('POS/Index', [
                'employees' => $employees,
                'services' => $services,
                'customers' => $customers,
                'branches' => $branches,
                'fiscalPrinterEnabled' => Auth::user()->account->fiscal_printer_enabled ?? false,
                'fiscalConfig' => $fiscalConfig,
                'loyaltyProgram' => $loyaltyProgram,
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
        Gate::authorize('access-pos');

        try {
            $accountId = Auth::user()->account_id;

            // Get customers for customer selection
            $customers = Customer::where('account_id', $accountId)
                ->select('id', 'name', 'email', 'phone', 'current_points')
                ->orderBy('name')
                ->get();

            // Branch filtering based on user role
            if (Auth::user()->role === 'sales_staff') {
                $branches = Branch::where('id', Auth::user()->branch_id)
                    ->select('id', 'name')->get();
            } else {
                $branches = Branch::where('account_id', $accountId)
                    ->select('id', 'name')->get();
            }

            // Get loyalty program
            $loyaltyService = app(LoyaltyService::class);
            $loyaltyProgram = $loyaltyService->getProgramForAccount($accountId);

            // Get fiscal printer config for shift status
            $fiscalConfig = \App\Models\FiscalPrinterConfig::where('account_id', $accountId)
                ->where('is_active', true)
                ->first();

            return Inertia::render('TouchPOS/Index', [
                'customers' => $customers,
                'branches' => $branches,
                'fiscalConfig' => $fiscalConfig,
                'loyaltyProgram' => $loyaltyProgram,
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
        Gate::authorize('access-pos');

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
            'payment_method' => 'nullable|in:cash,card,bank_transfer,bank_credit',
            'paid_amount' => 'nullable|numeric|min:0',
            'credit_amount' => 'nullable|numeric|min:0',
            'credit_due_date' => 'nullable|date|after:today',
            'credit_description' => 'nullable|string|max:500',
            'points_to_redeem' => 'nullable|integer|min:0',
            'use_fiscal_printer' => 'nullable|boolean',
            // Gift card payment fields
            'gift_card_code' => 'nullable|string|min:4',
            'gift_card_amount' => 'nullable|numeric|min:0',
            // Gift card sale fields
            'gift_card_expiry_months' => 'nullable|integer|min:1|max:60', // 1-60 months validity
        ];

        // For credit or partial payment, customer is required
        if (in_array($request->payment_status, ['credit', 'partial'])) {
            $rules['customer_id'] = 'required|exists:customers,id';
        }

        // If gift card code is provided, validate amount is also provided
        if ($request->gift_card_code) {
            $rules['gift_card_code'] = 'required|string|min:4';
            $rules['gift_card_amount'] = 'required|numeric|min:0.01';
        }

        $validated = $request->validate($rules);

        \Log::info('POS Sale validation passed', ['validated' => $validated]);

        try {
            $sale = DB::transaction(function() use ($validated, $request) {
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

                // Add loyalty points discount if applicable
                $pointsDiscount = 0;
                if (($validated['points_to_redeem'] ?? 0) > 0 && $validated['customer_id']) {
                    $loyaltyService = app(LoyaltyService::class);
                    $program = $loyaltyService->getProgramForAccount($accountId);

                    if ($program && $program->is_active) {
                        $pointsDiscount = $program->calculateDiscount($validated['points_to_redeem']);
                        $discountAmount += $pointsDiscount;
                    }
                }

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
                    $product = \App\Models\Product::find($item['product_id']);

                    SaleItem::create([
                        'sale_id' => $sale->sale_id,
                        'product_id' => $item['product_id'],
                        'variant_id' => $item['variant_id'] ?? null,
                        'quantity' => $item['quantity'],
                        'unit_price' => $item['unit_price'],
                        'purchase_price' => $product->purchase_price ?? null,
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

                // Handle gift card product sales
                foreach ($validated['items'] as $item) {
                    $product = \App\Models\Product::find($item['product_id']);

                    if ($product && $product->isGiftCard()) {
                        \Log::info('Gift card product detected in sale', [
                            'product_id' => $product->id,
                            'denomination' => $product->gift_card_denomination,
                            'quantity' => $item['quantity']
                        ]);

                        // Process each gift card (in case quantity > 1)
                        $quantity = (int) $item['quantity'];
                        for ($i = 0; $i < $quantity; $i++) {
                            // Find a configured gift card with matching denomination
                            $giftCard = \App\Models\GiftCard::where('account_id', $accountId)
                                ->where('status', \App\Models\GiftCard::STATUS_CONFIGURED)
                                ->where('denomination', $product->gift_card_denomination)
                                ->first();

                            if (!$giftCard) {
                                throw new \Exception("Konfiqurasiya olunmuş {$product->gift_card_denomination} AZN məbləğli hədiyyə kartı tapılmadı. Zəhmət olmasa əvvəlcə kartları konfiqurasiya edin.");
                            }

                            // Queue fiscal prepayment job for gift card sale (uses bridge)
                            if ($account->fiscal_printer_enabled) {
                                $config = \App\Models\FiscalPrinterConfig::where('account_id', $accountId)
                                    ->where('is_active', true)
                                    ->first();

                                if ($config) {
                                    // Validate shift status before creating fiscal job
                                    if (!$config->isShiftValid()) {
                                        \Log::warning('Gift card fiscal shift validation failed', [
                                            'account_id' => $accountId,
                                            'sale_id' => $sale->sale_id,
                                            'gift_card_id' => $giftCard->id,
                                            'shift_open' => $config->shift_open,
                                        ]);

                                        // Don't create fiscal job, but allow sale to continue
                                    } else {
                                        $fiscalService = app(\App\Services\FiscalPrinterService::class);

                                        // Prepare payment data from the sale
                                        $paymentData = [
                                            'cash_amount' => $validated['payment_method'] === 'cash' ? $giftCard->denomination : 0,
                                            'card_amount' => ($validated['payment_method'] === 'card' || $validated['payment_method'] === 'bank_transfer') ? $giftCard->denomination : 0,
                                            'client_name' => $validated['customer_id'] ? Customer::find($validated['customer_id'])?->name : null,
                                        ];

                                        // Format request data for bridge queue
                                        $requestData = $fiscalService->getFormattedGiftCardPrepaymentRequestData(
                                            $config,
                                            $giftCard,
                                            $paymentData
                                        );

                                        // Add gift card ID to request data for later reference
                                        $requestData['gift_card_id'] = $giftCard->id;

                                        // Create job for bridge to process
                                        \App\Models\FiscalPrinterJob::create([
                                            'account_id' => $accountId,
                                            'sale_id' => $sale->sale_id,
                                            'operation_type' => 'gift_card_prepayment',
                                            'status' => \App\Models\FiscalPrinterJob::STATUS_PENDING,
                                            'request_data' => $requestData,
                                            'provider' => $config->provider,
                                        ]);

                                        \Log::info('Gift card fiscal prepayment job queued', [
                                            'sale_id' => $sale->sale_id,
                                            'gift_card_id' => $giftCard->id,
                                            'account_id' => $accountId,
                                        ]);
                                    }
                                }
                            }

                            // Activate the gift card
                            // Use custom expiry months if provided, otherwise default to 12 months
                            $expiryMonths = $validated['gift_card_expiry_months'] ?? 12;

                            $giftCard->update([
                                'status' => \App\Models\GiftCard::STATUS_ACTIVE,
                                'initial_balance' => $giftCard->denomination,
                                'current_balance' => $giftCard->denomination,
                                'customer_id' => $validated['customer_id'],
                                'activated_at' => now(),
                                'expiry_date' => now()->addMonths($expiryMonths),
                            ]);

                            // Create transaction record for activation
                            \App\Models\GiftCardTransaction::create([
                                'gift_card_id' => $giftCard->id,
                                'type' => 'activation',
                                'amount' => $giftCard->denomination,
                                'balance_before' => 0,
                                'balance_after' => $giftCard->denomination,
                                'sale_id' => $sale->sale_id,
                                'user_id' => $userId,
                                'notes' => "Aktivləşdirildi - Satış #{$sale->sale_number}",
                            ]);

                            \Log::info('Gift card activated', [
                                'gift_card_id' => $giftCard->id,
                                'card_number' => $giftCard->card_number,
                                'sale_id' => $sale->sale_id,
                            ]);
                        }
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

                // Handle gift card payment FIRST (if provided)
                $giftCardAmount = 0;
                if (!empty($validated['gift_card_code']) && ($validated['gift_card_amount'] ?? 0) > 0) {
                    $giftCardCode = strtoupper(trim($validated['gift_card_code']));
                    $giftCardAmount = (float) $validated['gift_card_amount'];

                    \Log::info('Processing gift card payment', [
                        'sale_id' => $sale->sale_id,
                        'gift_card_code' => $giftCardCode,
                        'amount' => $giftCardAmount
                    ]);

                    // Find the gift card
                    $giftCard = \App\Models\GiftCard::where('card_number', $giftCardCode)
                        ->where('account_id', $accountId)
                        ->first();

                    if (!$giftCard) {
                        throw new \Exception("Hədiyyə kartı tapılmadı: {$giftCardCode}");
                    }

                    // Validate gift card can be used
                    if (!$giftCard->canBeUsed()) {
                        $reason = $giftCard->isExpired() ? 'vaxtı bitib' :
                                 ($giftCard->current_balance <= 0 ? 'balansı yoxdur' : 'aktiv deyil');
                        throw new \Exception("Hədiyyə kartı istifadə oluna bilməz: {$reason}");
                    }

                    // Validate amount doesn't exceed card balance
                    if ($giftCardAmount > $giftCard->current_balance) {
                        throw new \Exception("Hədiyyə kartı balansı kifayət deyil. Mövcud balans: ₼{$giftCard->current_balance}");
                    }

                    // Validate amount doesn't exceed sale total
                    if ($giftCardAmount > $total) {
                        throw new \Exception("Hədiyyə kartı məbləği satış məbləğindən çox ola bilməz.");
                    }

                    // Deduct amount from gift card
                    $balanceBefore = $giftCard->current_balance;
                    $balanceAfter = $balanceBefore - $giftCardAmount;

                    $giftCard->current_balance = $balanceAfter;

                    // If balance reaches zero, mark as depleted
                    if ($balanceAfter <= 0) {
                        $giftCard->status = \App\Models\GiftCard::STATUS_DEPLETED;
                    }

                    $giftCard->save();

                    // Create payment record for gift card
                    Payment::create([
                        'sale_id' => $sale->sale_id,
                        'method' => 'hədiyyə_kartı',
                        'amount' => $giftCardAmount,
                        'gift_card_id' => $giftCard->id,
                        'notes' => "Hədiyyə kartı: {$giftCard->card_number}",
                    ]);

                    // Create gift card transaction record
                    \App\Models\GiftCardTransaction::create([
                        'gift_card_id' => $giftCard->id,
                        'type' => 'payment',
                        'amount' => $giftCardAmount,
                        'balance_before' => $balanceBefore,
                        'balance_after' => $balanceAfter,
                        'sale_id' => $sale->sale_id,
                        'user_id' => $userId,
                        'notes' => "Ödəniş - Satış #{$sale->sale_number}",
                    ]);

                    \Log::info('Gift card payment processed', [
                        'gift_card_id' => $giftCard->id,
                        'amount' => $giftCardAmount,
                        'balance_before' => $balanceBefore,
                        'balance_after' => $balanceAfter,
                        'sale_id' => $sale->sale_id,
                    ]);
                }

                // Create payment records for remaining amount (after gift card deduction)
                $paymentMethod = $validated['payment_method'] ?? 'cash';
                $remainingAmount = $total - $giftCardAmount; // Amount left to pay after gift card

                if ($validated['payment_status'] === 'paid' && $remainingAmount > 0) {
                    // Paid status - create payment for remaining amount
                    Payment::create([
                        'sale_id' => $sale->sale_id,
                        'method' => $paymentMethod,
                        'amount' => $remainingAmount,
                        'notes' => $giftCardAmount > 0
                            ? "POS satışı - tam ödəniş (Hədiyyə kartı: ₼{$giftCardAmount})"
                            : 'POS satışı - tam ödəniş',
                    ]);
                    \Log::info('Payment created for remaining amount', [
                        'sale_id' => $sale->sale_id,
                        'amount' => $remainingAmount,
                        'method' => $paymentMethod,
                        'gift_card_used' => $giftCardAmount
                    ]);
                } elseif ($validated['payment_status'] === 'partial' && ($validated['paid_amount'] ?? 0) > 0) {
                    // Partial payment - create payment for paid amount
                    Payment::create([
                        'sale_id' => $sale->sale_id,
                        'method' => $paymentMethod,
                        'amount' => $validated['paid_amount'],
                        'notes' => 'POS satışı - qismən ödəniş',
                    ]);
                    \Log::info('Payment created for partial sale', [
                        'sale_id' => $sale->sale_id,
                        'amount' => $validated['paid_amount'],
                        'method' => $paymentMethod
                    ]);
                }

                // Handle loyalty points redemption
                if (($validated['points_to_redeem'] ?? 0) > 0 && $validated['customer_id']) {
                    $loyaltyService = app(LoyaltyService::class);
                    $customer = Customer::find($validated['customer_id']);

                    try {
                        $loyaltyService->redeemPoints(
                            $customer,
                            $validated['points_to_redeem'],
                            $sale,
                            "Redeemed {$validated['points_to_redeem']} points for ₼{$pointsDiscount} discount"
                        );
                    } catch (\Exception $e) {
                        \Log::error('Points redemption failed', ['error' => $e->getMessage()]);
                        throw new \Exception('Bonus ballarını istifadə etmək mümkün olmadı: ' . $e->getMessage());
                    }
                }

                return $sale;
            });

            \Log::info('Sale transaction completed successfully', ['sale_id' => $sale->sale_id]);

            // Award loyalty points for the purchase (outside transaction)
            if ($sale->customer_id && $sale->payment_status === 'paid') {
                $loyaltyService = app(LoyaltyService::class);
                $customer = Customer::find($sale->customer_id);
                $program = $loyaltyService->getProgramForAccount($sale->account_id);

                if ($customer && $program && $program->is_active) {
                    // Calculate amount eligible for points (subtract discount if configured)
                    $amountForPoints = $sale->total;

                    if (!$program->earn_on_discounted_items && $sale->discount_amount > 0) {
                        $amountForPoints = $sale->subtotal - $sale->discount_amount;
                    }

                    try {
                        $pointsEarned = $loyaltyService->earnPoints(
                            $customer,
                            $sale,
                            max(0, $amountForPoints)
                        );

                        if ($pointsEarned) {
                            \Log::info('Loyalty points awarded', [
                                'sale_id' => $sale->sale_id,
                                'customer_id' => $customer->id,
                                'points' => $pointsEarned->points
                            ]);
                        }
                    } catch (\Exception $e) {
                        \Log::error('Failed to award loyalty points', [
                            'sale_id' => $sale->sale_id,
                            'error' => $e->getMessage()
                        ]);
                        // Don't fail the sale if points award fails
                    }
                }
            }

            // Check if auto-print is enabled
            $account = Auth::user()->account;
            $autoPrint = $account->auto_print_receipt ?? false;

            // Send to fiscal printer if enabled and sale requires it
            $fiscalPrinted = false;
            $fiscalNumber = null;
            $fiscalError = null;
            $fiscalConfig = null;
            $fiscalRequestData = null;

            if ($account->fiscal_printer_enabled && $sale->use_fiscal_printer) {
                $config = FiscalPrinterConfig::where('account_id', $account->id)
                    ->where('is_active', true)
                    ->first();

                if ($config) {
                    // Validate shift status before creating fiscal job
                    if (!$config->isShiftValid()) {
                        if (!$config->isShiftOpen()) {
                            $fiscalError = 'Fiskal növbə bağlıdır. Zəhmət olmasa növbəni açın.';
                        } elseif ($config->isShiftExpired()) {
                            $fiscalError = 'Fiskal növbə vaxtı bitib (24 saat). Növbəni bağlayıb yeni növbə açın.';
                        }

                        \Log::warning('Fiscal shift validation failed', [
                            'account_id' => $account->id,
                            'sale_id' => $sale->sale_id,
                            'shift_open' => $config->shift_open,
                            'shift_hours' => $config->getShiftDurationHours(),
                            'error' => $fiscalError
                        ]);

                        // Don't create fiscal job, but allow sale to continue
                    } else {
                        // Shift is valid, queue job for bridge to pick up
                        $fiscalService = app(FiscalPrinterService::class);
                        $requestData = $fiscalService->getFormattedRequestData($config, $sale);

                        FiscalPrinterJob::create([
                            'account_id' => $account->id,
                            'sale_id' => $sale->sale_id,
                            'status' => FiscalPrinterJob::STATUS_PENDING,
                            'request_data' => $requestData,
                            'provider' => $config->provider,
                        ]);

                        \Log::info('Fiscal print job queued', [
                            'sale_id' => $sale->sale_id,
                            'account_id' => $account->id,
                        ]);

                        // Job queued successfully - bridge will process it
                        $fiscalPrinted = false; // Not yet printed, just queued
                    }
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
                    ->with('fiscal_error', $fiscalError)
                    ->with('fiscal_config', $fiscalConfig)
                    ->with('fiscal_request_data', $fiscalRequestData);
            }

            // For regular POS, redirect to sales detail page
            \Log::info('Redirecting to sales.show', [
                'sale_id' => $sale->sale_id,
                'fiscal_config_set' => !is_null($fiscalConfig),
                'fiscal_request_data_set' => !is_null($fiscalRequestData),
                'fiscal_config' => $fiscalConfig,
            ]);

            return redirect()->route('sales.show', $sale->sale_id)
                ->with('success', 'Satış uğurla tamamlandı. Qaimə #' . $sale->sale_number)
                ->with('auto_print', $autoPrint)
                ->with('print_sale_id', $sale->sale_id)
                ->with('fiscal_printed', $fiscalPrinted)
                ->with('fiscal_number', $fiscalNumber)
                ->with('fiscal_error', $fiscalError)
                ->with('fiscal_config', $fiscalConfig)
                ->with('fiscal_request_data', $fiscalRequestData);
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

            $quantityBefore = $productStock->quantity;
            $productStock->decrement('quantity', $quantity);

            // Create stock history record
            StockHistory::create([
                'product_id' => $productId,
                'variant_id' => $variantId,
                'warehouse_id' => $warehouse->id,
                'quantity_before' => $quantityBefore,
                'quantity_change' => -$quantity,
                'quantity_after' => $quantityBefore - $quantity,
                'type' => 'xaric_olma',
                'reference_type' => 'sale',
                'reference_id' => $sale->sale_id,
                'user_id' => auth()->id(),
                'notes' => "POS Satış #{$sale->sale_number} üçün xaric olma",
                'occurred_at' => $sale->created_at ?? now(),
            ]);

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

    /**
     * Lookup gift card by card number
     */
    public function lookupGiftCard(Request $request)
    {
        Gate::authorize('access-pos');

        $validated = $request->validate([
            'card_number' => 'required|string',
        ]);

        $accountId = Auth::user()->account_id;

        $card = \App\Models\GiftCard::where('account_id', $accountId)
            ->where('card_number', strtoupper($validated['card_number']))
            ->first();

        if (!$card) {
            return response()->json([
                'success' => false,
                'error' => 'Kart tapılmadı.',
            ], 404);
        }

        // Return card info based on status
        return response()->json([
            'success' => true,
            'card' => [
                'id' => $card->id,
                'card_number' => $card->card_number,
                'status' => $card->status,
                'denomination' => $card->denomination,
                'current_balance' => $card->current_balance,
                'customer_id' => $card->customer_id,
            ],
        ]);
    }

    /**
     * Sell gift card directly (not through products)
     */
    public function sellGiftCard(Request $request)
    {
        Gate::authorize('access-pos');

        $validated = $request->validate([
            'card_number' => 'required|string',
            'customer_id' => 'nullable|exists:customers,id',
            'payment_method' => 'required|in:cash,card,bank_transfer',
            'employee_id' => 'nullable|exists:users,id',
            'branch_id' => 'nullable|exists:branches,id',
            'gift_card_expiry_months' => 'nullable|integer|min:1|max:60',
        ]);

        $accountId = Auth::user()->account_id;
        $userId = Auth::id();

        // Get branch_id: from request, user's assigned branch, or first available branch
        $branchId = $validated['branch_id'] ?? Auth::user()->branch_id;
        if (!$branchId) {
            $branchId = \App\Models\Branch::where('account_id', $accountId)->value('id');
            if (!$branchId) {
                throw new \Exception('Filial tapılmadı. Zəhmət olmasa filial yaradın.');
            }
        }

        DB::beginTransaction();
        try {
            // Find the card
            $card = \App\Models\GiftCard::where('account_id', $accountId)
                ->where('card_number', strtoupper($validated['card_number']))
                ->lockForUpdate()
                ->first();

            if (!$card) {
                throw new \Exception('Kart tapılmadı.');
            }

            if (!$card->isConfigured()) {
                throw new \Exception('Bu kart konfiqurasiya olunmayıb. Status: ' . $card->status);
            }

            // Get account for fiscal printer check
            $account = \App\Models\Account::find($accountId);

            // Create sale record (sale_number auto-generated by model with FOR UPDATE locking)
            $sale = Sale::create([
                'account_id' => $accountId,
                'customer_id' => $validated['customer_id'] ?? null,
                'user_id' => $validated['employee_id'] ?? $userId,
                'branch_id' => $branchId,
                'sale_date' => now(),
                'subtotal' => $card->denomination,
                'discount_amount' => 0,
                'tax_amount' => 0,
                'total' => $card->denomination,
                'paid_amount' => $card->denomination,
                'payment_status' => 'paid',
                'payment_method' => $validated['payment_method'],
                'notes' => "Hədiyyə kartı satışı: {$card->card_number} - ₼{$card->denomination}",
            ]);

            // Note: No sale_items record needed - gift card transactions provide full tracking

            // Create payment record
            Payment::create([
                'account_id' => $accountId,
                'sale_id' => $sale->sale_id,
                'customer_id' => $validated['customer_id'] ?? null,
                'amount' => $card->denomination,
                'payment_date' => now(),
                'payment_method' => $validated['payment_method'],
                'status' => 'completed',
                'reference_number' => $sale->sale_number,
                'notes' => "Hədiyyə kartı satışı: {$card->card_number}",
            ]);

            // Queue fiscal prepayment job for gift card sale (uses bridge)
            if ($account->fiscal_printer_enabled) {
                $config = \App\Models\FiscalPrinterConfig::where('account_id', $accountId)
                    ->where('is_active', true)
                    ->first();

                if ($config) {
                    // Validate shift status before creating fiscal job
                    if (!$config->isShiftValid()) {
                        \Log::warning('Gift card fiscal shift validation failed', [
                            'account_id' => $accountId,
                            'sale_id' => $sale->sale_id,
                            'gift_card_id' => $card->id,
                            'shift_open' => $config->shift_open,
                        ]);

                        // Don't create fiscal job, but allow sale to continue
                    } else {

                    $fiscalService = app(FiscalPrinterService::class);

                    $paymentData = [
                        'cash_amount' => $validated['payment_method'] === 'cash' ? $card->denomination : 0,
                        'card_amount' => ($validated['payment_method'] === 'card' || $validated['payment_method'] === 'bank_transfer') ? $card->denomination : 0,
                        'client_name' => $validated['customer_id'] ? Customer::find($validated['customer_id'])?->name : null,
                    ];

                    // Format request data for bridge queue
                    $requestData = $fiscalService->getFormattedGiftCardPrepaymentRequestData(
                        $config,
                        $card,
                        $paymentData
                    );

                    // Add gift card ID to request data for later reference
                    $requestData['gift_card_id'] = $card->id;

                    // Create job for bridge to process
                    \App\Models\FiscalPrinterJob::create([
                        'account_id' => $accountId,
                        'sale_id' => $sale->sale_id,
                        'operation_type' => 'gift_card_prepayment',
                        'status' => \App\Models\FiscalPrinterJob::STATUS_PENDING,
                        'request_data' => $requestData,
                        'provider' => $config->provider,
                    ]);

                    \Log::info('Gift card fiscal prepayment job queued', [
                        'sale_id' => $sale->sale_id,
                        'gift_card_id' => $card->id,
                        'account_id' => $accountId,
                    ]);
                    }
                }
            }

            // Activate the gift card
            // Use custom expiry months if provided, otherwise default to 12 months
            $expiryMonths = $validated['gift_card_expiry_months'] ?? 12;

            $card->update([
                'status' => \App\Models\GiftCard::STATUS_ACTIVE,
                'initial_balance' => $card->denomination,
                'current_balance' => $card->denomination,
                'customer_id' => $validated['customer_id'],
                'activated_at' => now(),
                'expiry_date' => now()->addMonths($expiryMonths),
            ]);

            // Create transaction record
            \App\Models\GiftCardTransaction::create([
                'gift_card_id' => $card->id,
                'type' => 'activation',
                'amount' => $card->denomination,
                'balance_before' => 0,
                'balance_after' => $card->denomination,
                'sale_id' => $sale->sale_id,
                'user_id' => $userId,
                'notes' => "Aktivləşdirildi - Satış #{$sale->sale_number}",
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Hədiyyə kartı uğurla satıldı.',
                'sale' => [
                    'sale_id' => $sale->sale_id,
                    'sale_number' => $sale->sale_number,
                    'total_amount' => $sale->total,
                    'fiscal_number' => $sale->fiscal_number ?? null,
                ],
                'card' => [
                    'card_number' => $card->card_number,
                    'denomination' => $card->denomination,
                    'status' => $card->status,
                ],
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Gift card sale failed', [
                'error' => $e->getMessage(),
                'card_number' => $validated['card_number'] ?? null,
            ]);

            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 400);
        }
    }

}