<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Product;
use App\Models\Category;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Services\DocumentUploadService;
use App\Services\ProductPhotoService;
use App\Services\NotificationService;
use App\Mail\NewOnlineOrder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class PublicShopController extends Controller
{
    public function __construct(
        private DocumentUploadService $documentService,
        private ProductPhotoService $photoService,
        private NotificationService $notificationService
    ) {}

    /**
     * MULTI-TENANT: Load account by shop_slug and set context
     */
    private function loadShopAccount(string $shop_slug): Account
    {
        $account = Account::where('shop_slug', $shop_slug)
            ->where('shop_enabled', true)
            ->where('is_active', true)
            ->firstOrFail();

        // Set account context for this request
        app()->instance('shop_account', $account);

        return $account;
    }

    /**
     * Shop Homepage
     */
    public function index(string $shop_slug)
    {
        $account = $this->loadShopAccount($shop_slug);

        // MULTI-TENANT: Only get PARENT products for THIS account (not child variants)
        // This shows one product card per parent, with child products as selectable variants
        $productsQuery = Product::where('account_id', $account->id)
            ->where('type', 'product')
            ->active()
            ->parentProducts()  // Only show parent products, not variants
            ->with(['orderedPhotos', 'category', 'activeVariants', 'activeChildProducts']);

        // WAREHOUSE FILTERING: If shop has a specific warehouse selected, only show products with stock in that warehouse
        if ($account->shop_warehouse_id) {
            $productsQuery->whereHas('stock', function($query) use ($account) {
                $query->where('warehouse_id', $account->shop_warehouse_id)
                      ->where('quantity', '>', 0);
            });
        }

        $products = $productsQuery->latest()->paginate(12);

        // Load images and available sizes
        foreach ($products as $product) {
            // Set warehouse-specific stock if warehouse is selected
            if ($account->shop_warehouse_id) {
                $product->shop_stock = $product->getStockInWarehouse($account->shop_warehouse_id);
            } else {
                $product->shop_stock = $product->total_stock;
            }
            // Use primary photo or first photo, fallback to old image_url field
            $primaryPhoto = $product->orderedPhotos->where('is_primary', true)->first()
                ?? $product->orderedPhotos->first();

            if ($primaryPhoto) {
                $thumbnailPath = $primaryPhoto->thumbnail_path ?: ($primaryPhoto->medium_path ?: $primaryPhoto->original_path);
                $product->image_url = $this->photoService->getPhotoUrl($thumbnailPath);
            }
            // else: keep existing image_url field value as fallback

            // Extract sizes/colors from child products OR ProductVariants
            $childProducts = $product->activeChildProducts ?? collect();
            $productVariants = $product->activeVariants ?? collect();

            // Method 1: From child products (separate Product records)
            if ($childProducts->isNotEmpty()) {
                // Create a collection that includes parent product + child products
                $allProducts = collect([$product])->concat($childProducts);

                // Extract size from attributes JSON field (including parent)
                $product->available_sizes = $allProducts
                    ->map(fn($p) => $p->attributes['size'] ?? null)
                    ->filter()
                    ->unique()
                    ->values();

                // Extract color from attributes JSON field (including parent)
                $product->available_colors = $allProducts
                    ->map(fn($p) => [
                        'name' => $p->attributes['color'] ?? null,
                        'code' => $p->attributes['color_code'] ?? null
                    ])
                    ->filter(fn($c) => $c['name'] !== null)
                    ->unique('name')
                    ->values();

                // Calculate price range from all products (parent + children)
                $prices = $allProducts->pluck('sale_price');
                $minPrice = $prices->min();
                $maxPrice = $prices->max();

                $product->price_range = [
                    'min' => $minPrice,
                    'max' => $maxPrice,
                    'has_range' => round($minPrice, 2) !== round($maxPrice, 2)
                ];

                // Store child products for frontend (keeping original behavior for now)
                $product->variant_products = $childProducts;
            }
            // Method 2: From ProductVariants table (fallback)
            elseif ($productVariants->isNotEmpty()) {
                $product->available_sizes = $productVariants
                    ->whereNotNull('size')
                    ->pluck('size')
                    ->unique()
                    ->values();

                $product->available_colors = $productVariants
                    ->whereNotNull('color')
                    ->map(fn($v) => ['name' => $v->color, 'code' => $v->color_code])
                    ->unique('name')
                    ->values();

                $variantPrices = $productVariants->map(fn($v) => $v->final_price);
                $minPrice = $variantPrices->min();
                $maxPrice = $variantPrices->max();

                $product->price_range = [
                    'min' => $minPrice,
                    'max' => $maxPrice,
                    'has_range' => round($minPrice, 2) !== round($maxPrice, 2)
                ];
            }
            // No variants
            else {
                $product->available_sizes = collect();
                $product->available_colors = collect();
                $product->price_range = [
                    'min' => $product->sale_price,
                    'max' => $product->sale_price,
                    'has_range' => false
                ];
            }
        }

        // MULTI-TENANT: Only get categories for THIS account
        $categories = Category::where('account_id', $account->id)
            ->products()
            ->active()
            ->whereNull('parent_id')
            ->with(['children' => function($q) use ($account) {
                $q->where('account_id', $account->id)
                  ->active()
                  ->orderBy('sort_order');
            }])
            ->orderBy('sort_order')
            ->get();

        return Inertia::render('Shop/Home', [
            'account' => $this->formatAccountForPublic($account),
            'products' => $products,
            'categories' => $categories,
        ]);
    }

    /**
     * Product Detail Page
     */
    public function show(string $shop_slug, int $id)
    {
        $account = $this->loadShopAccount($shop_slug);

        // MULTI-TENANT: Ensure product belongs to THIS account
        $product = Product::where('account_id', $account->id)
            ->where('id', $id)
            ->where('type', 'product')
            ->active()
            ->with(['orderedPhotos', 'category', 'activeVariants.stock', 'activeChildProducts.stock', 'activeChildProducts.orderedPhotos'])
            ->firstOrFail();

        // Set warehouse-specific stock
        if ($account->shop_warehouse_id) {
            $product->shop_stock = $product->getStockInWarehouse($account->shop_warehouse_id);
        } else {
            $product->shop_stock = $product->total_stock;
        }

        // If this is a child product, redirect to parent product page
        if ($product->isChildProduct()) {
            return redirect()->route('shop.product', [
                'shop_slug' => $shop_slug,
                'id' => $product->parent_product_id
            ]);
        }

        // Load all product photos (parent product photos)
        $allImages = $product->orderedPhotos->map(function($photo) use ($product) {
            $mediumPath = $photo->medium_path ?: $photo->original_path;
            $thumbnailPath = $photo->thumbnail_path ?: ($photo->medium_path ?: $photo->original_path);

            return [
                'id' => $photo->id,
                'url' => $this->photoService->getPhotoUrl($mediumPath),
                'thumbnail' => $this->photoService->getPhotoUrl($thumbnailPath),
                'is_primary' => $photo->is_primary,
                'alt_text' => $photo->alt_text,
                'product_id' => $product->id,
                'variant_id' => null,
            ];
        });

        // Add child product photos (variant photos)
        if ($product->activeChildProducts && $product->activeChildProducts->isNotEmpty()) {
            foreach ($product->activeChildProducts as $child) {
                if ($child->orderedPhotos && $child->orderedPhotos->isNotEmpty()) {
                    $childImages = $child->orderedPhotos->map(function($photo) use ($child) {
                        $mediumPath = $photo->medium_path ?: $photo->original_path;
                        $thumbnailPath = $photo->thumbnail_path ?: ($photo->medium_path ?: $photo->original_path);

                        return [
                            'id' => $photo->id,
                            'url' => $this->photoService->getPhotoUrl($mediumPath),
                            'thumbnail' => $this->photoService->getPhotoUrl($thumbnailPath),
                            'is_primary' => $photo->is_primary,
                            'alt_text' => $photo->alt_text,
                            'product_id' => $child->id,
                            'variant_id' => $child->id,
                            'variant_size' => $child->attributes['size'] ?? null,
                            'variant_color' => $child->attributes['color'] ?? null,
                        ];
                    });
                    $allImages = $allImages->concat($childImages);
                }
            }
        }

        $product->images = $allImages;

        // Format ProductVariants with computed price and stock
        if ($product->activeVariants) {
            $product->activeVariants->each(function($variant) use ($account) {
                $variant->sale_price = $variant->final_price;
                // Use warehouse-specific stock if warehouse is selected
                if ($account->shop_warehouse_id) {
                    $warehouseStock = $variant->stock->where('warehouse_id', $account->shop_warehouse_id)->first();
                    $variant->stock_quantity = $warehouseStock ? $warehouseStock->quantity : 0;
                } else {
                    $variant->stock_quantity = $variant->total_stock;
                }
            });
        }

        // Format child products (variant products) for display
        if ($product->activeChildProducts && $product->activeChildProducts->isNotEmpty()) {
            $variants = collect();

            // First, add the parent product itself as a variant (if it has size/color attributes)
            if ($product->attributes && (isset($product->attributes['size']) || isset($product->attributes['color']))) {
                // Get warehouse-specific stock for parent product
                $stockQty = $account->shop_warehouse_id
                    ? $product->getStockInWarehouse($account->shop_warehouse_id)
                    : $product->total_stock;

                $variants->push([
                    'id' => $product->id,
                    'product_id' => $product->id,
                    'size' => $product->attributes['size'] ?? null,
                    'color' => $product->attributes['color'] ?? null,
                    'color_code' => $product->attributes['color_code'] ?? null,
                    'sale_price' => $product->sale_price,
                    'stock_quantity' => $stockQty,
                    'sku' => $product->sku,
                    'barcode' => $product->barcode,
                ]);
            }

            // Then add all child products as variants
            $childVariants = $product->activeChildProducts->map(function($child) use ($account) {
                // Get warehouse-specific stock for child product
                $stockQty = $account->shop_warehouse_id
                    ? $child->getStockInWarehouse($account->shop_warehouse_id)
                    : $child->total_stock;

                return [
                    'id' => $child->id,
                    'product_id' => $child->id,
                    'size' => $child->attributes['size'] ?? null,
                    'color' => $child->attributes['color'] ?? null,
                    'color_code' => $child->attributes['color_code'] ?? null,
                    'sale_price' => $child->sale_price,
                    'stock_quantity' => $stockQty,
                    'sku' => $child->sku,
                    'barcode' => $child->barcode,
                ];
            });

            $product->variant_products = $variants->concat($childVariants);
        }

        return Inertia::render('Shop/Product', [
            'account' => $this->formatAccountForPublic($account),
            'product' => $product,
        ]);
    }

    /**
     * Create Order (Quick Order)
     */
    public function createOrder(Request $request, string $shop_slug)
    {
        $account = $this->loadShopAccount($shop_slug);

        $validated = $request->validate([
            'customer_name' => 'required|string|max:255',
            'customer_phone' => 'required|string|max:50',
            'items' => 'required|array|min:1',
            'items.*.product_id' => [
                'required',
                'exists:products,id',
                // MULTI-TENANT: Ensure product belongs to this account
                function ($attribute, $value, $fail) use ($account) {
                    if (!Product::where('id', $value)->where('account_id', $account->id)->exists()) {
                        $fail('Məhsul tapılmadı');
                    }
                },
            ],
            'items.*.variant_id' => 'nullable|exists:product_variants,id',
            'items.*.quantity' => 'required|integer|min:1|max:9999',
            'items.*.sale_price' => 'required|numeric|min:0',
            'city' => 'required|string|max:255',
            'address' => 'nullable|string|max:500',
            'notes' => 'nullable|string|max:1000',
        ]);

        DB::beginTransaction();
        try {
            // Calculate totals
            $subtotal = 0;
            foreach ($validated['items'] as $item) {
                $subtotal += $item['sale_price'] * $item['quantity'];
            }

            // Get the first branch for this account (required field)
            $branch = \App\Models\Branch::where('account_id', $account->id)->first();

            if (!$branch) {
                throw new \Exception('Filial tapılmadı. Zəhmət olmasa sistem administratoru ilə əlaqə saxlayın.');
            }

            // Get the "Online Shop" system user for this account
            // MULTI-TENANT: System user email uses shop_slug for uniqueness
            $systemEmail = "online-shop@system-{$account->shop_slug}.local";
            $onlineShopUser = \App\Models\User::where('account_id', $account->id)
                ->where('email', $systemEmail)
                ->first();

            if (!$onlineShopUser) {
                throw new \Exception('Online mağaza istifadəçisi tapılmadı. Zəhmət olmasa mağaza parametrlərini yenilənin.');
            }

            // Format phone number to international format
            $formattedPhone = $this->formatAzerbaijanPhone($validated['customer_phone']);

            // Combine city and address for delivery_notes
            $deliveryInfo = $validated['city'];
            if (!empty($validated['address'])) {
                $deliveryInfo .= ', ' . $validated['address'];
            }

            // MULTI-TENANT: Create sale for THIS account
            $sale = Sale::create([
                'account_id' => $account->id, // CRITICAL: Set account_id
                'branch_id' => $branch->id, // Required field
                'user_id' => $onlineShopUser->id, // Online shop system user
                'sale_number' => $this->generateOnlineSaleNumber($account->id),
                'is_online_order' => true,
                'customer_name' => $validated['customer_name'],
                'customer_phone' => $formattedPhone,
                'subtotal' => $subtotal,
                'tax_amount' => 0,
                'discount_amount' => 0,
                'total' => $subtotal,
                'paid_amount' => 0,
                'credit_amount' => $subtotal,
                'payment_status' => 'credit', // Online orders are unpaid (credit)
                'notes' => $validated['notes'],
                'delivery_notes' => $deliveryInfo,
                'sale_date' => now(),
            ]);

            // Create sale items
            foreach ($validated['items'] as $item) {
                $product = \App\Models\Product::find($item['product_id']);

                SaleItem::create([
                    'sale_id' => $sale->sale_id,
                    'product_id' => $item['product_id'],
                    'variant_id' => $item['variant_id'] ?? null,
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['sale_price'],
                    'purchase_price' => $product->purchase_price ?? null,
                    'discount_amount' => 0,
                    'total' => $item['sale_price'] * $item['quantity'],
                ]);
            }

            DB::commit();

            // Send notifications (async)
            $this->sendOrderNotifications($account, $sale);

            // Redirect to success page with order details
            return redirect()->route('shop.order.success', [
                'shop_slug' => $account->shop_slug,
                'order_number' => $sale->sale_number,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Online order creation failed', [
                'account_id' => $account->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            // Redirect back with error message
            return back()->withErrors([
                'order' => 'Xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.'
            ])->withInput();
        }
    }

    /**
     * Order success page
     */
    public function orderSuccess(string $shop, string $order_number)
    {
        $account = Account::where('shop_slug', $shop)
            ->where('shop_enabled', true)
            ->firstOrFail();

        return Inertia::render('Shop/OrderSuccess', [
            'account' => [
                'company_name' => $account->company_name,
                'shop_slug' => $account->shop_slug,
                'phone' => $account->phone,
                'email' => $account->email,
            ],
            'order_number' => $order_number,
        ]);
    }

    /**
     * Generate unique sale number for online orders
     */
    private function generateOnlineSaleNumber(int $account_id): string
    {
        $prefix = 'WEB';
        $year = date('Y');

        // MULTI-TENANT: Get last sale for THIS account only
        $lastSale = Sale::where('account_id', $account_id)
            ->where('sale_number', 'like', "$prefix-$year-%")
            ->latest('sale_id')
            ->first();

        $newNumber = $lastSale
            ? ((int) substr($lastSale->sale_number, -6)) + 1
            : 1;

        return sprintf('%s-%s-%06d', $prefix, $year, $newNumber);
    }

    /**
     * Format Azerbaijan phone number to international format
     * Examples:
     *   "50" -> "+99450"
     *   "055" -> "+994055" (this is wrong, should be +99455)
     *   "055123" -> "+99455123"
     *   "0551234567" -> "+994551234567"
     *   "551234567" -> "+994551234567"
     *   "+994551234567" -> "+994551234567" (no change)
     */
    private function formatAzerbaijanPhone(string $phone): string
    {
        // Remove all spaces, dashes, and parentheses
        $phone = preg_replace('/[\s\-\(\)]/', '', $phone);

        // If already starts with +994, return as is
        if (str_starts_with($phone, '+994')) {
            return $phone;
        }

        // If starts with 994, add +
        if (str_starts_with($phone, '994')) {
            return '+' . $phone;
        }

        // If starts with 0, remove it (e.g., "0551234567" -> "551234567")
        if (str_starts_with($phone, '0')) {
            $phone = substr($phone, 1);
        }

        // Add +994 prefix
        return '+994' . $phone;
    }

    /**
     * Send order notifications using unified NotificationService
     * Supports: Email, SMS, Telegram (multi-channel)
     */
    private function sendOrderNotifications(Account $account, Sale $sale): void
    {
        // 1. Email notification to merchant (legacy - keep for now)
        if ($account->email) {
            try {
                Mail::to($account->email)->send(new NewOnlineOrder($sale));
            } catch (\Exception $e) {
                Log::warning('Failed to send order email', [
                    'account_id' => $account->id,
                    'sale_id' => $sale->sale_id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // 2. Multi-channel notification to merchant (NEW UNIFIED SYSTEM)
        // This will send through SMS, Telegram, or both based on settings
        try {
            $itemsCount = SaleItem::where('sale_id', $sale->sale_id)->sum('quantity');

            $orderData = [
                'order_number' => $sale->sale_number,
                'customer_name' => $sale->customer_name,
                'customer_phone' => $sale->customer_phone,
                'total' => number_format($sale->total, 2),
                'items_count' => $itemsCount,
                'delivery_address' => $sale->delivery_notes ?? '',
                'notes' => $sale->notes ?? '',
                'payment_method' => 'Online',
            ];

            Log::info('Attempting to send new order notification', [
                'account_id' => $account->id,
                'order_number' => $sale->sale_number,
                'order_data' => $orderData,
            ]);

            $result = $this->notificationService->sendNewOrderNotification($account->id, $orderData);

            Log::info('Notification result', [
                'account_id' => $account->id,
                'result' => $result,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send multi-channel merchant notification', [
                'account_id' => $account->id,
                'sale_id' => $sale->sale_id,
                'error' => $e->getMessage(),
            ]);
        }

        // 3. Multi-channel confirmation to customer (NEW UNIFIED SYSTEM)
        if ($sale->customer_phone) {
            try {
                $orderData = [
                    'customer_name' => $sale->customer_name,
                    'order_number' => $sale->sale_number,
                    'total' => number_format($sale->total, 2),
                ];

                $this->notificationService->sendOrderConfirmation(
                    $account->id,
                    $orderData,
                    $sale->customer_phone
                );
            } catch (\Exception $e) {
                Log::warning('Failed to send customer confirmation', [
                    'account_id' => $account->id,
                    'sale_id' => $sale->sale_id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // BACKWARD COMPATIBILITY: Support old shop_sms_merchant_notifications settings
        // This will be deprecated once users migrate to new notification_settings
        if (($account->shop_sms_merchant_notifications || $account->shop_sms_customer_notifications)
            && !$account->notification_settings) {

            // Auto-migrate old settings to new structure
            try {
                $newSettings = [
                    'merchant' => [
                        'new_order' => [
                            'enabled' => $account->shop_sms_merchant_notifications,
                            'channels' => $account->hasSmsConfigured() ? ['sms'] : [],
                            'recipients' => [
                                'sms' => $account->getMerchantNotificationPhone(),
                            ],
                        ],
                    ],
                    'customer' => [
                        'order_confirmation' => [
                            'enabled' => $account->shop_sms_customer_notifications,
                            'channels' => $account->hasSmsConfigured() ? ['sms'] : [],
                        ],
                    ],
                ];

                $account->updateNotificationSettings($newSettings);

                Log::info('Auto-migrated notification settings', [
                    'account_id' => $account->id,
                ]);
            } catch (\Exception $e) {
                Log::warning('Failed to auto-migrate notification settings', [
                    'account_id' => $account->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }

    /**
     * Format account data for public display (hide sensitive info)
     */
    private function formatAccountForPublic(Account $account): array
    {
        return [
            'company_name' => $account->company_name,
            'shop_slug' => $account->shop_slug,
            'phone' => $account->phone,
            'email' => $account->email,
            'address' => $account->address,
        ];
    }
}
