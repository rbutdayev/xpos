<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Product;
use App\Models\Branch;
use App\Models\Sale;
use App\Models\Warehouse;
use App\Services\ProductPhotoService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ExpeditorController extends Controller
{
    public function __construct(
        private ProductPhotoService $photoService
    ) {
        $this->middleware('auth');
        $this->middleware('account.access');
    }

    /**
     * Display the expeditor catalog interface
     */
    public function index()
    {
        Gate::authorize('access-pos');

        $accountId = Auth::user()->account_id;
        $user = Auth::user();

        // Check if expeditor module is enabled
        if (!$user->account->isExpeditorModuleEnabled()) {
            return redirect()->route('dashboard')
                ->with('error', 'Expeditor modulu aktiv deyil. Zəhmət olmasa ayarlardan aktivləşdirin.');
        }

        // Branch filtering based on user role
        if ($user->role === 'sales_staff' && $user->branch_id) {
            $branches = Branch::where('account_id', $accountId)
                ->where('id', $user->branch_id)
                ->select('id', 'name')
                ->get();
        } else {
            $branches = Branch::where('account_id', $accountId)
                ->select('id', 'name')
                ->get();
        }

        // Determine default branch
        $defaultBranchId = $user->branch_id ?? ($branches->isNotEmpty() ? $branches->first()->id : null);

        // Load initial products for catalog (optimized query) - page 1
        $initialProducts = $this->getProductsForBranch($accountId, $defaultBranchId, null, null, 1);

        return Inertia::render('Expeditor/Index', [
            'branches' => $branches,
            'initialProducts' => $initialProducts,
            'defaultBranch' => $defaultBranchId,
            'auth' => [
                'user' => [
                    'role' => $user->role,
                    'branch_id' => $user->branch_id,
                ],
            ],
        ]);
    }

    /**
     * Search customers (for lazy loading)
     */
    public function searchCustomers(Request $request)
    {
        Gate::authorize('access-pos');

        $accountId = Auth::user()->account_id;
        $search = $request->input('q', '');

        $customers = Customer::where('account_id', $accountId)
            ->where(function($query) use ($search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            })
            ->select('id', 'name', 'phone', 'email')
            ->orderBy('name')
            ->limit(50)
            ->get();

        return response()->json($customers);
    }

    /**
     * Get warehouse for a specific branch
     * Returns the first warehouse where branch has can_modify_stock = true
     * Returns null if branch has no accessible warehouse (will show no products)
     */
    private function getWarehouseForBranch($branchId, $accountId)
    {
        if (!$branchId) {
            // No branch selected - return main warehouse
            return Warehouse::where('account_id', $accountId)
                ->where('type', 'main')
                ->first();
        }

        // Get the branch and its accessible warehouses
        $branch = Branch::where('account_id', $accountId)
            ->find($branchId);

        if (!$branch) {
            // Branch not found - return null (no products)
            return null;
        }

        // Get the first warehouse that the branch can modify stock for
        $warehouse = $branch->warehouses()
            ->where('warehouses.account_id', $accountId)
            ->wherePivot('can_modify_stock', true)
            ->first();

        // Return the warehouse or null if branch has no accessible warehouse
        // This will cause no products to be shown for branches without warehouses
        return $warehouse;
    }

    /**
     * Get products for a specific branch (OPTIMIZED - eliminates N+1 queries)
     */
    private function getProductsForBranch($accountId, $branchId, $search = null, $categoryId = null, $page = 1)
    {
        // Get the appropriate warehouse for this branch using POS logic
        $warehouse = $this->getWarehouseForBranch($branchId, $accountId);
        $warehouseId = $warehouse ? $warehouse->id : null;

        if (!$warehouseId) {
            return collect([]);
        }

        $perPage = 30; // Products per page for infinite scroll
        $offset = ($page - 1) * $perPage;

        $query = Product::where('products.account_id', $accountId)
            ->where('products.is_active', true);

        // Search by name, barcode, or SKU if provided
        if (!empty($search)) {
            $query->where(function($q) use ($search) {
                $q->where('products.name', 'like', "%{$search}%")
                  ->orWhere('products.barcode', $search)
                  ->orWhere('products.sku', $search);
            });
        }

        // Filter by category if provided
        if (!empty($categoryId)) {
            $query->where('products.category_id', $categoryId);
        }

        // Only get products that have stock in the selected warehouse
        $query->whereHas('stock', function($q) use ($warehouseId, $accountId) {
            $q->where('product_stock.account_id', $accountId)
              ->where('product_stock.warehouse_id', $warehouseId)
              ->where('product_stock.quantity', '>', 0);
        });

        // OPTIMIZATION: Eager load all relationships and stock in single queries
        $products = $query
            ->with([
                'category' => function($q) use ($accountId) {
                    $q->where('categories.account_id', $accountId);
                },
                'orderedPhotos' => function($q) use ($accountId) {
                    $q->where('product_photos.account_id', $accountId);
                },
                'variants' => function($q) use ($accountId, $warehouseId, $branchId) {
                    $q->where('product_variants.account_id', $accountId)
                      ->where('product_variants.is_active', true)
                      ->with([
                          'stock' => function($stockQuery) use ($warehouseId, $accountId) {
                              $stockQuery->where('product_stock.account_id', $accountId)
                                  ->where('product_stock.warehouse_id', $warehouseId);
                          },
                          'prices' => function($priceQuery) use ($branchId) {
                              $priceQuery->where('product_prices.is_active', true)
                                  ->where('product_prices.effective_from', '<=', now())
                                  ->where(function($query) {
                                      $query->whereNull('product_prices.effective_until')
                                          ->orWhere('product_prices.effective_until', '>=', now());
                                  })
                                  ->when($branchId, function($query) use ($branchId) {
                                      $query->where(function($q) use ($branchId) {
                                          $q->whereNull('product_prices.branch_id')
                                            ->orWhere('product_prices.branch_id', $branchId);
                                      });
                                  });
                          }
                      ]);
                },
                'stock' => function($q) use ($warehouseId, $accountId) {
                    $q->where('product_stock.account_id', $accountId)
                      ->where('product_stock.warehouse_id', $warehouseId);
                },
                // Eager load prices (discounts) to avoid N+1 queries
                'prices' => function($q) use ($branchId) {
                    $q->where('product_prices.is_active', true)
                      ->where('product_prices.effective_from', '<=', now())
                      ->where(function($query) {
                          $query->whereNull('product_prices.effective_until')
                              ->orWhere('product_prices.effective_until', '>=', now());
                      })
                      ->when($branchId, function($query) use ($branchId) {
                          $query->where(function($q) use ($branchId) {
                              $q->whereNull('product_prices.branch_id')
                                ->orWhere('product_prices.branch_id', $branchId);
                          });
                      });
                }
            ])
            ->skip($offset)
            ->take($perPage)
            ->get();

        // Transform products with minimal queries
        return $products->map(function($product) use ($branchId, $warehouseId) {
            // Use eager-loaded price (discount) instead of calling getActiveDiscount()
            $price = $product->prices->first();
            $effectivePrice = $price && $price->discount_percentage > 0
                ? $price->discounted_price
                : $product->sale_price;

            // Use eager-loaded stock instead of querying
            $warehouseStock = $product->stock->sum('quantity');

            // Get product image URL from photos or fallback to image_url field
            $imageUrl = null;
            $primaryPhoto = $product->orderedPhotos->where('is_primary', true)->first()
                ?? $product->orderedPhotos->first();

            if ($primaryPhoto) {
                $thumbnailPath = $primaryPhoto->thumbnail_path ?: ($primaryPhoto->medium_path ?: $primaryPhoto->original_path);
                $imageUrl = $this->photoService->getPhotoUrl($thumbnailPath);
            } else {
                $imageUrl = $product->image_url;
            }

            return [
                'id' => $product->id,
                'name' => $product->name,
                'sku' => $product->sku,
                'barcode' => $product->barcode,
                'description' => $product->description,
                'image' => $imageUrl,
                'sale_price' => round($effectivePrice, 2),
                'original_price' => $price && $price->discount_percentage > 0 ? $product->sale_price : null,
                'discount_percentage' => $price && $price->discount_percentage > 0 ? $price->discount_percentage : null,
                'has_discount' => $price && $price->discount_percentage > 0,
                'stock_quantity' => $warehouseStock,
                'has_variants' => $product->variants->isNotEmpty(),
                'variants' => $product->variants->map(function($variant) {
                    // Use eager-loaded variant price (discount) - already filtered by branch and date
                    $variantPrice = $variant->prices->first();

                    $finalPrice = $variantPrice && $variantPrice->discount_percentage > 0
                        ? $variantPrice->discounted_price
                        : $variant->final_price;

                    // Use eager-loaded stock
                    $variantStock = $variant->stock->sum('quantity');

                    return [
                        'id' => $variant->id,
                        'size' => $variant->size,
                        'color' => $variant->color,
                        'color_code' => $variant->color_code,
                        'display_name' => $variant->display_name,
                        'final_price' => round($finalPrice, 2),
                        'original_price' => $variantPrice && $variantPrice->discount_percentage > 0 ? $variant->final_price : null,
                        'discount_percentage' => $variantPrice && $variantPrice->discount_percentage > 0 ? $variantPrice->discount_percentage : null,
                        'has_discount' => $variantPrice && $variantPrice->discount_percentage > 0,
                        'stock_quantity' => $variantStock,
                    ];
                }),
                'category' => $product->category?->name,
            ];
        });
    }

    /**
     * Load products for expeditor catalog (warehouse determined automatically from branch)
     */
    public function loadProducts(Request $request)
    {
        Gate::authorize('access-pos');

        $accountId = Auth::user()->account_id;
        $branchId = $request->input('branch_id');
        $search = $request->input('q');
        $categoryId = $request->input('category_id');
        $page = $request->input('page', 1); // Add page parameter

        $products = $this->getProductsForBranch($accountId, $branchId, $search, $categoryId, $page);

        return response()->json($products);
    }

    /**
     * Get customer's previous orders for quick reorder (OPTIMIZED)
     */
    public function getCustomerOrders(Request $request)
    {
        Gate::authorize('access-pos');

        $accountId = Auth::user()->account_id;
        $customerId = $request->input('customer_id');

        if (empty($customerId)) {
            return response()->json(['orders' => []]);
        }

        // Verify customer belongs to account
        $customer = Customer::where('account_id', $accountId)
            ->find($customerId);

        if (!$customer) {
            return response()->json(['orders' => []]);
        }

        // Get last 10 orders from customer - OPTIMIZED with eager loading
        $orders = Sale::where('sales.account_id', $accountId)
            ->where('sales.customer_id', $customerId)
            ->where('sales.status', 'completed')
            ->with([
                'items' => function($q) use ($accountId) {
                    $q->where('sale_items.account_id', $accountId);
                },
                'items.product' => function($q) use ($accountId) {
                    $q->where('products.account_id', $accountId);
                },
                'items.variant' => function($q) use ($accountId) {
                    $q->where('product_variants.account_id', $accountId);
                }
            ])
            ->orderBy('sales.sale_date', 'desc')
            ->limit(10)
            ->get()
            ->map(function($sale) {
                return [
                    'sale_id' => $sale->sale_id,
                    'sale_number' => $sale->sale_number,
                    'sale_date' => $sale->sale_date->format('Y-m-d H:i'),
                    'total' => $sale->total,
                    'items' => $sale->items->map(function($item) {
                        return [
                            'product_id' => $item->product_id,
                            'variant_id' => $item->variant_id,
                            'product_name' => $item->product?->name,
                            'variant_display' => $item->variant?->display_name,
                            'quantity' => $item->quantity,
                            'unit_price' => $item->unit_price,
                        ];
                    }),
                ];
            });

        return response()->json(['orders' => $orders]);
    }

    /**
     * Create a customer from expeditor interface
     */
    public function createCustomer(Request $request)
    {
        Gate::authorize('create-account-data');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
        ]);

        $accountId = Auth::user()->account_id;

        $customer = Customer::create([
            'account_id' => $accountId,
            'name' => $validated['name'],
            'phone' => $validated['phone'] ?? null,
            'email' => $validated['email'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'customer' => [
                'id' => $customer->id,
                'name' => $customer->name,
                'phone' => $customer->phone,
                'email' => $customer->email,
            ],
        ]);
    }
}
