<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\BranchController;
use App\Http\Controllers\WarehouseController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProductPhotoController;
use App\Http\Controllers\ProductVariantController;
use App\Http\Controllers\ProductPriceController;
use App\Http\Controllers\BarcodeController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\CustomerItemController;
use App\Http\Controllers\TailorServiceController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\StockMovementController;
use App\Http\Controllers\ProductStockController;
use App\Http\Controllers\GoodsReceiptController;
use App\Http\Controllers\WarehouseTransferController;
use App\Http\Controllers\ProductReturnController;
use App\Http\Controllers\MinMaxAlertController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\OnlineOrderController;
use App\Http\Controllers\PrinterConfigController;
use App\Http\Controllers\ReceiptTemplateController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\ExpenseCategoryController;
use App\Http\Controllers\SupplierPaymentController;
use App\Http\Controllers\EmployeeSalaryController;
use App\Http\Controllers\SystemSettingsController;
use App\Http\Controllers\SuperAdminController;
use App\Http\Controllers\SuperAdmin\FiscalPrinterProviderController;
use App\Http\Controllers\Admin\SystemHealthController;
use App\Http\Controllers\Admin\SecurityController;
use App\Http\Controllers\Admin\LoyaltyCardController as AdminLoyaltyCardController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\CreditController;
use App\Http\Controllers\SmsController;
use App\Http\Controllers\FiscalPrinterConfigController;
use App\Http\Controllers\FiscalPrinterJobController;
use App\Http\Controllers\FiscalShiftController;
use App\Http\Controllers\IntegrationsController;
use App\Http\Controllers\RentalTemplateController;
use App\Http\Controllers\ProductActivityController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\Request;
use Inertia\Inertia;

// Awareness landing page - separate URL for local testing
Route::get('/awareness', function () {
    return Inertia::render('Awareness');
})->name('awareness');

// 301 Permanent Redirect to main website - SEO optimized
Route::get('/', function () {
    return redirect('https://onyx.az/az/xpos', 301);
});

// Super Admin Routes (Before Main Dashboard)
Route::middleware(['auth', 'superadmin'])->prefix('admin')->name('superadmin.')->group(function () {
    Route::get('/', [SuperAdminController::class, 'index'])->name('dashboard');
    Route::get('/accounts', [SuperAdminController::class, 'accounts'])->name('accounts');
    Route::get('/accounts/{account}', [SuperAdminController::class, 'showAccount'])->name('accounts.show');
    Route::post('/accounts', [SuperAdminController::class, 'createAccount'])->name('accounts.store');
    Route::put('/accounts/{account}', [SuperAdminController::class, 'updateAccount'])->name('accounts.update');
    Route::delete('/accounts/{account}', [SuperAdminController::class, 'deleteAccount'])->name('accounts.destroy');
    Route::patch('/accounts/{account}/toggle-status', [SuperAdminController::class, 'toggleAccountStatus'])->name('accounts.toggle-status');

    // Account Payments Management
    Route::get('/payments', [App\Http\Controllers\AccountPaymentsController::class, 'index'])->name('payments');
    Route::post('/payments/{account}/mark-paid', [App\Http\Controllers\AccountPaymentsController::class, 'markAsPaid'])->name('payments.mark-paid');
    Route::post('/payments/{account}/mark-unpaid', [App\Http\Controllers\AccountPaymentsController::class, 'markAsUnpaid'])->name('payments.mark-unpaid');
    Route::put('/payments/{account}/settings', [App\Http\Controllers\AccountPaymentsController::class, 'updatePaymentSettings'])->name('payments.update-settings');
    Route::patch('/payments/{account}/toggle-status', [App\Http\Controllers\AccountPaymentsController::class, 'toggleAccountStatus'])->name('payments.toggle-status');

    Route::get('/users', [SuperAdminController::class, 'users'])->name('users');
    Route::delete('/users/{user}', [SuperAdminController::class, 'deleteUser'])->name('users.destroy');
    Route::patch('/users/{user}/toggle-status', [SuperAdminController::class, 'toggleUserStatus'])->name('users.toggle-status');
    Route::get('/system-stats', [SuperAdminController::class, 'systemStats'])->name('system-stats');
    
    // Storage Settings
    Route::get('/storage-settings', [SuperAdminController::class, 'storageSettings'])->name('storage-settings');
    Route::put('/storage-settings', [SuperAdminController::class, 'updateStorageSettings'])->name('storage-settings.update');
    Route::post('/storage-settings/test', [SuperAdminController::class, 'testStorageConnection'])->name('storage-settings.test');
    
    // System Health Dashboard
    Route::get('/system-health', [SystemHealthController::class, 'index'])->name('system-health');
    
    // Security & Audit Center
    Route::get('/security', [SecurityController::class, 'index'])->name('security');

    // Fiscal Printer Providers Management
    Route::resource('fiscal-printer-providers', FiscalPrinterProviderController::class);
    
    // System Health API endpoints
    Route::prefix('api')->name('api.')->group(function () {
        Route::get('/system-health/metrics', [SystemHealthController::class, 'metrics'])->name('system-health.metrics');
        Route::get('/system-health/account-usage', [SystemHealthController::class, 'accountUsage'])->name('system-health.account-usage');
        Route::get('/system-health/performance', [SystemHealthController::class, 'performance'])->name('system-health.performance');
        Route::get('/system-health/queue-status', [SystemHealthController::class, 'queueStatus'])->name('system-health.queue-status');
        Route::get('/system-health/health-check', [SystemHealthController::class, 'healthCheck'])->name('system-health.health-check');
        Route::post('/system-health/refresh', [SystemHealthController::class, 'refreshMetrics'])->name('system-health.refresh');
        Route::get('/system-health/export', [SystemHealthController::class, 'exportReport'])->name('system-health.export');
    });

    // Security API endpoints
    Route::prefix('security')->name('security.')->group(function () {
        Route::get('/metrics', [SecurityController::class, 'getMetrics'])->name('metrics');
        Route::get('/events', [SecurityController::class, 'getSecurityEvents'])->name('events');
        Route::get('/login-attempts', [SecurityController::class, 'getLoginAttempts'])->name('login-attempts');
        Route::get('/blocked-ips', [SecurityController::class, 'getBlockedIPs'])->name('blocked-ips');
        Route::post('/block-ip', [SecurityController::class, 'blockIP'])->name('block-ip');
        Route::post('/unblock-ip', [SecurityController::class, 'unblockIP'])->name('unblock-ip');
        Route::post('/events/{event}/resolve', [SecurityController::class, 'resolveEvent'])->name('events.resolve');
        Route::get('/suspicious-activity', [SecurityController::class, 'getSuspiciousActivity'])->name('suspicious-activity');
        Route::get('/threat-level', [SecurityController::class, 'getThreatLevel'])->name('threat-level');
        Route::post('/export-report', [SecurityController::class, 'exportSecurityReport'])->name('export-report');
        Route::get('/audit-logs', [SecurityController::class, 'getAuditLogs'])->name('audit-logs');
    });

    // Loyalty Cards Management
    Route::prefix('loyalty-cards')->name('loyalty-cards.')->group(function () {
        Route::get('/', [AdminLoyaltyCardController::class, 'index'])->name('index');
        Route::post('/generate', [AdminLoyaltyCardController::class, 'generate'])->name('generate');
        Route::post('/{card}/deactivate', [AdminLoyaltyCardController::class, 'deactivate'])->name('deactivate');
        Route::post('/{card}/activate', [AdminLoyaltyCardController::class, 'activate'])->name('activate');
        Route::post('/{card}/unassign', [AdminLoyaltyCardController::class, 'unassign'])->name('unassign');
        Route::get('/reports', [AdminLoyaltyCardController::class, 'reports'])->name('reports');
    });

    // Gift Cards Management
    Route::prefix('gift-cards')->name('gift-cards.')->group(function () {
        Route::get('/', [App\Http\Controllers\Admin\GiftCardController::class, 'index'])->name('index');
        Route::post('/generate', [App\Http\Controllers\Admin\GiftCardController::class, 'generate'])->name('generate');
        Route::post('/bulk-delete', [App\Http\Controllers\Admin\GiftCardController::class, 'bulkDelete'])->name('bulk-delete');
        Route::get('/reports/summary', [App\Http\Controllers\Admin\GiftCardController::class, 'reports'])->name('reports');
        Route::get('/{card}', [App\Http\Controllers\Admin\GiftCardController::class, 'show'])->name('show');
        Route::delete('/{card}', [App\Http\Controllers\Admin\GiftCardController::class, 'destroy'])->name('destroy');
        Route::post('/{card}/deactivate', [App\Http\Controllers\Admin\GiftCardController::class, 'deactivate'])->name('deactivate');
        Route::post('/{card}/activate', [App\Http\Controllers\Admin\GiftCardController::class, 'activate'])->name('activate');
    });
});

// Main Dashboard
Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

// Debug route for translations
Route::get('/debug-translations', function () {
    return \Inertia\Inertia::render('DebugTranslations');
})->middleware(['auth', 'verified'])->name('debug.translations');

// Photo serving route (PUBLIC - for shop frontend and fallback when Azure temporaryUrl fails)
Route::get('/photos/serve/{path}', function (Request $request, string $path) {
    $decodedPath = base64_decode($path);

    // Security: Prevent directory traversal attacks
    if (str_contains($decodedPath, '..') ||
        str_contains($decodedPath, './') ||
        str_contains($decodedPath, '\\')) {
        abort(403, 'Invalid path');
    }

    // Security: Ensure path is within allowed directories
    $allowedPrefixes = ['products/', 'photos/', 'companies/'];
    $hasValidPrefix = false;
    foreach ($allowedPrefixes as $prefix) {
        if (str_starts_with($decodedPath, $prefix)) {
            $hasValidPrefix = true;
            break;
        }
    }

    if (!$hasValidPrefix) {
        abort(403, 'Access denied');
    }

    if (!Storage::disk('documents')->exists($decodedPath)) {
        abort(404, 'Photo not found');
    }

    // Security: Verify the resolved path is within the storage directory
    try {
        $fullPath = Storage::disk('documents')->path($decodedPath);
        $basePath = Storage::disk('documents')->path('');

        // Only check if both paths can be resolved
        if (file_exists($fullPath) && file_exists($basePath)) {
            $realPath = realpath($fullPath);
            $realBasePath = realpath($basePath);

            if (!$realPath || !$realBasePath || !str_starts_with($realPath, $realBasePath)) {
                abort(403, 'Access denied');
            }
        }
    } catch (\Exception $e) {
        \Log::warning('Path validation error: ' . $e->getMessage());
        abort(403, 'Access denied');
    }

    $mimeType = Storage::disk('documents')->mimeType($decodedPath);
    $content = Storage::disk('documents')->get($decodedPath);

    return response($content, 200)
        ->header('Content-Type', $mimeType)
        ->header('Cache-Control', 'public, max-age=3600');
})->name('photos.serve')->where('path', '.*');

Route::middleware(['auth', 'account.access'])->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    
    // Company Setup Wizard
    Route::get('/setup', [CompanyController::class, 'setupWizard'])->name('setup.wizard');
    Route::post('/setup', [CompanyController::class, 'store'])->name('setup.store');

    // Real-time validation endpoints for setup wizard
    Route::post('/api/company/check-name', [CompanyController::class, 'checkName'])->name('company.check-name');
    Route::post('/api/company/check-tin', [CompanyController::class, 'checkTin'])->name('company.check-tin');

    // Company Management (customers can only view/edit their single company)
    Route::get('/companies', [CompanyController::class, 'index'])->name('companies.index');
    Route::get('/companies/{company}', [CompanyController::class, 'show'])->name('companies.show');
    Route::get('/companies/{company}/edit', [CompanyController::class, 'edit'])->name('companies.edit');
    Route::put('/companies/{company}', [CompanyController::class, 'update'])->name('companies.update');
    Route::patch('/companies/{company}', [CompanyController::class, 'update']);
    
    // Branch Management
    Route::resource('branches', BranchController::class);
    
    // Warehouse Management
    Route::resource('warehouses', WarehouseController::class);
    Route::patch('/warehouses/{warehouse}/access', [WarehouseController::class, 'updateBranchAccess'])
         ->name('warehouses.access.update');
    
    // Warehouse Context Selection
    Route::post('/set-warehouse', function(\Illuminate\Http\Request $request) {
        $user = Auth::user();

        // Security: Validate warehouse belongs to user's account
        $request->validate([
            'warehouse_id' => [
                'nullable',
                'integer',
                \Illuminate\Validation\Rule::exists('warehouses', 'id')->where(function ($query) use ($user) {
                    $query->where('account_id', $user->account_id);
                })
            ]
        ]);

        if ($request->warehouse_id) {
            // Base verification: warehouse belongs to user's account
            $warehouse = \App\Models\Warehouse::where('id', $request->warehouse_id)
                ->where('account_id', $user->account_id)
                ->first();
            
            if (!$warehouse) {
                return back()->withErrors(['warehouse' => 'Anbar tapılmadı.']);
            }
            
            // Additional verification for sales_staff: check branch access
            if ($user->role === 'sales_staff' && $user->branch_id) {
                $hasAccess = \App\Models\WarehouseBranchAccess::where('warehouse_id', $warehouse->id)
                    ->where('branch_id', $user->branch_id)
                    ->where('can_view_stock', true)
                    ->exists();
                    
                if (!$hasAccess) {
                    return back()->withErrors(['warehouse' => 'Bu anbara giriş icazəniz yoxdur.']);
                }
            }
            
            $request->session()->put('selected_warehouse_id', $warehouse->id);
        } else {
            $request->session()->forget('selected_warehouse_id');
        }
        
        return back();
    })->name('set-warehouse');
    
    // Product Catalog Management
    Route::resource('categories', CategoryController::class);
    Route::get('/categories/tree', [CategoryController::class, 'tree'])->name('categories.tree');
    
    Route::get('/products/search', [ProductController::class, 'search'])->name('products.search');
    Route::get('/products/search-parent', [ProductController::class, 'searchParentProducts'])->name('products.search-parent');
    Route::post('/products/{product}/calculate-price', [ProductController::class, 'calculatePrice'])->name('products.calculate-price');
    Route::post('/products/generate-barcode', [ProductController::class, 'generateBarcode'])->name('products.generate-barcode');
    Route::get('/products/bulk-create', [ProductController::class, 'bulkCreate'])->name('products.bulk-create');
    Route::post('/products/bulk-store', [ProductController::class, 'bulkStore'])->name('products.bulk-store');
    Route::get('/products/discounts', [ProductController::class, 'discounts'])->name('products.discounts');
    Route::get('/products/import/template', [ProductController::class, 'downloadTemplate'])->name('products.import.template');
    Route::post('/products/import', [ProductController::class, 'import'])->name('products.import');
    Route::resource('products', ProductController::class);

    // Product Variants
    Route::prefix('products/{product}')->group(function() {
        Route::get('/variants', [ProductVariantController::class, 'index'])
            ->name('products.variants.index');
        Route::post('/variants', [ProductVariantController::class, 'store'])
            ->name('products.variants.store');
        Route::post('/variants/generate-barcodes', [ProductVariantController::class, 'generateBarcodes'])
            ->name('products.variants.generate-barcodes');
    });

    Route::prefix('variants')->group(function() {
        Route::put('/{variant}', [ProductVariantController::class, 'update'])
            ->name('variants.update');
        Route::delete('/{variant}', [ProductVariantController::class, 'destroy'])
            ->name('variants.destroy');
        Route::post('/{variant}/toggle-status', [ProductVariantController::class, 'toggleStatus'])
            ->name('variants.toggle-status');
    });

    // Product Pricing & Discounts
    Route::prefix('products/{product}/prices')->group(function() {
        Route::post('/', [ProductPriceController::class, 'store'])
            ->name('products.prices.store');
    });

    Route::prefix('product-prices')->group(function() {
        Route::put('/{productPrice}', [ProductPriceController::class, 'update'])
            ->name('product-prices.update');
        Route::delete('/{productPrice}', [ProductPriceController::class, 'destroy'])
            ->name('product-prices.destroy');
        Route::post('/{productPrice}/toggle-active', [ProductPriceController::class, 'toggleActive'])
            ->name('product-prices.toggle-active');
    });

    // Barcode Management
    Route::get('/barcodes/types', [BarcodeController::class, 'types'])->name('barcodes.types');
    Route::post('/barcodes/validate', [BarcodeController::class, 'validateBarcode'])->name('barcodes.validate');
    // Direct barcode printing for generated barcodes (doesn't require saved product)
    Route::get('/barcodes/print-direct/{barcode}', [BarcodeController::class, 'printDirect'])->name('barcodes.print-direct');
    Route::get('/barcodes/image/{barcode}', [BarcodeController::class, 'showImage'])->name('barcodes.show-image');
    // Use prefix to avoid route conflicts
    Route::get('/barcodes/print-by-value/{barcode}', [BarcodeController::class, 'printByBarcode'])->name('barcodes.print-by-barcode');
    
    // Legacy redirect for old barcode print URLs that look like barcodes instead of product IDs
    Route::get('/barcodes/{barcode}/print', function($barcode) {
        // If it looks like a barcode (longer than typical product ID), redirect to new route
        if (strlen($barcode) > 8 || (strlen($barcode) > 6 && !is_numeric($barcode))) {
            return redirect()->route('barcodes.print-by-barcode', ['barcode' => $barcode] + request()->query());
        }
        // Otherwise, treat as product ID and continue to product print route
        try {
            $product = \App\Models\Product::where('id', $barcode)
                ->where('account_id', auth()->user()->account_id)
                ->firstOrFail();
            return app(\App\Http\Controllers\BarcodeController::class)->print($product);
        } catch (\Exception $e) {
            abort(404, 'Product not found');
        }
    })->where('barcode', '[A-Za-z0-9\-]+');
    
    Route::get('/barcodes/{product}', [BarcodeController::class, 'show'])->name('barcodes.show')->where('product', '[0-9]+');
    Route::get('/barcodes/{product}/print', [BarcodeController::class, 'print'])->name('barcodes.print')->where('product', '[0-9]+');
    Route::post('/barcodes/{product}/generate', [BarcodeController::class, 'generate'])->name('barcodes.generate');
    Route::delete('/barcodes/{product}/cache', [BarcodeController::class, 'clearCache'])->name('barcodes.clear-cache');
    
    // Document Management
    Route::get('/products/{product}/documents', [DocumentController::class, 'index'])->name('documents.index');
    Route::post('/products/{product}/documents', [DocumentController::class, 'store'])->name('documents.store');
    Route::post('/products/{product}/documents/single', [DocumentController::class, 'uploadSingle'])->name('documents.upload');
    Route::delete('/documents/{document}', [DocumentController::class, 'destroy'])->name('documents.destroy');
    Route::get('/documents/{document}/serve', [DocumentController::class, 'serve'])->name('documents.serve');
    Route::get('/documents/{document}/thumbnail', [DocumentController::class, 'thumbnail'])->name('documents.thumbnail');
    Route::get('/documents/types', [DocumentController::class, 'types'])->name('documents.types');
    Route::get('/documents/statistics', [DocumentController::class, 'statistics'])->name('documents.statistics');

    // Product Photo Management
    Route::get('/products/{product}/photos', [ProductPhotoController::class, 'index'])->name('products.photos.index');
    Route::post('/products/{product}/photos', [ProductPhotoController::class, 'store'])->name('products.photos.store');
    Route::delete('/products/{product}/photos/{photo}', [ProductPhotoController::class, 'destroy'])->name('products.photos.destroy');
    Route::post('/products/{product}/photos/{photo}/set-primary', [ProductPhotoController::class, 'setPrimary'])->name('products.photos.set-primary');
    Route::post('/products/{product}/photos/update-order', [ProductPhotoController::class, 'updateOrder'])->name('products.photos.update-order');

    // Generic file serving route for uploaded files (company logos, etc.)
    Route::get('/files/{path}', function (Request $request, $path) {
        Gate::authorize('access-account-data');

        $filePath = base64_decode($path);

        // Security: Prevent directory traversal attacks
        if (str_contains($filePath, '..') ||
            str_contains($filePath, './') ||
            str_contains($filePath, '\\')) {
            abort(403, 'Invalid path');
        }

        // Security: Ensure path is within allowed directories
        $allowedPrefixes = ['products/', 'photos/', 'companies/', 'documents/', 'receipts/', 'expenses/'];
        $hasValidPrefix = false;
        foreach ($allowedPrefixes as $prefix) {
            if (str_starts_with($filePath, $prefix)) {
                $hasValidPrefix = true;
                break;
            }
        }

        if (!$hasValidPrefix) {
            abort(403, 'Access denied');
        }

        $documentService = app(\App\Services\DocumentUploadService::class);

        if (!$documentService->fileExists($filePath)) {
            abort(404, 'Fayl tapılmadı');
        }

        $download = $request->boolean('download', false);

        if (!Storage::disk('documents')->exists($filePath)) {
            abort(404, 'Fayl tapılmadı');
        }

        // Security: Verify the resolved path is within the storage directory
        try {
            $fullPath = Storage::disk('documents')->path($filePath);
            $basePath = Storage::disk('documents')->path('');

            // Only check if both paths can be resolved
            if (file_exists($fullPath) && file_exists($basePath)) {
                $realPath = realpath($fullPath);
                $realBasePath = realpath($basePath);

                if (!$realPath || !$realBasePath || !str_starts_with($realPath, $realBasePath)) {
                    abort(403, 'Access denied');
                }
            }
        } catch (\Exception $e) {
            \Log::warning('Path validation error: ' . $e->getMessage());
            abort(403, 'Access denied');
        }

        $mimeType = Storage::disk('documents')->mimeType($filePath);
        $size = Storage::disk('documents')->size($filePath);
        $filename = basename($filePath);

        $headers = [
            'Content-Type' => $mimeType,
            'Content-Length' => $size,
        ];

        if ($download) {
            $headers['Content-Disposition'] = 'attachment; filename="' . $filename . '"';
        } else {
            $headers['Content-Disposition'] = 'inline; filename="' . $filename . '"';
        }

        return new \Symfony\Component\HttpFoundation\StreamedResponse(function () use ($filePath) {
            $stream = Storage::disk('documents')->readStream($filePath);
            fpassthru($stream);
            fclose($stream);
        }, 200, $headers);
    })->name('files.serve')->where('path', '.*');
    
    // Supplier Management
    Route::get('/suppliers/search', [SupplierController::class, 'search'])->name('suppliers.search');
    Route::resource('suppliers', SupplierController::class);
    Route::get('/suppliers/{supplier}/products', [SupplierController::class, 'products'])->name('suppliers.products');
    Route::post('/suppliers/{supplier}/products', [SupplierController::class, 'linkProduct'])->name('suppliers.link-product');
    Route::put('/suppliers/{supplier}/products/{product}', [SupplierController::class, 'updateProductPricing'])->name('suppliers.update-product');
    Route::delete('/suppliers/{supplier}/products/{product}', [SupplierController::class, 'unlinkProduct'])->name('suppliers.unlink-product');
    
    // Customer Management
    Route::get('/customers/search', [CustomerController::class, 'search'])->name('customers.search');
    Route::get('/customers/{id}/get', [CustomerController::class, 'getById'])->name('customers.get-by-id');
    Route::post('/customers/quick-store', [CustomerController::class, 'quickStore'])->name('customers.quick-store');
    Route::post('/customers/validate-loyalty-card', [CustomerController::class, 'validateLoyaltyCard'])->name('customers.validate-loyalty-card');
    Route::resource('customers', CustomerController::class);

    // Customer Items Management (clothing, fabrics for tailor services)
    Route::get('/customer-items/search', [CustomerItemController::class, 'search'])->name('customer-items.search');
    Route::patch('/customer-items/{customer_item}/status', [CustomerItemController::class, 'updateStatus'])->name('customer-items.update-status');
    Route::get('/customer-items/{customer_item}/print-options', [CustomerItemController::class, 'getPrintOptions'])->name('customer-items.print-options');
    Route::post('/customer-items/{customer_item}/print', [CustomerItemController::class, 'print'])->name('customer-items.print');
    Route::post('/customer-items/{customer_item}/send-to-printer', [CustomerItemController::class, 'sendToPrinter'])->name('customer-items.send-to-printer');
    Route::resource('customer-items', CustomerItemController::class);

    // Dynamic Service Routes (multi-service support)
    Route::prefix('services/{serviceType}')->group(function () {
        Route::get('/', [TailorServiceController::class, 'index'])->name('services.index');
        Route::get('/create', [TailorServiceController::class, 'create'])->name('services.create');
        Route::post('/', [TailorServiceController::class, 'store'])->name('services.store');
        Route::get('/{tailorService}', [TailorServiceController::class, 'show'])->name('services.show');
        Route::get('/{tailorService}/edit', [TailorServiceController::class, 'edit'])->name('services.edit');
        Route::put('/{tailorService}', [TailorServiceController::class, 'update'])->name('services.update');
        Route::delete('/{tailorService}', [TailorServiceController::class, 'destroy'])->name('services.destroy');
        Route::patch('/{tailorService}/status', [TailorServiceController::class, 'updateStatus'])->name('services.update-status');
        Route::patch('/{tailorService}/make-credit', [TailorServiceController::class, 'makeCredit'])->name('services.make-credit');
        Route::patch('/{tailorService}/pay-credit', [TailorServiceController::class, 'payServiceCredit'])->name('services.pay-credit');
        Route::get('/{tailorService}/print-options', [TailorServiceController::class, 'getPrintOptions'])->name('services.print-options');
        Route::post('/{tailorService}/print', [TailorServiceController::class, 'print'])->name('services.print');
        Route::post('/{tailorService}/send-to-printer', [TailorServiceController::class, 'sendToPrinter'])->name('services.send-to-printer');
    });

    // Legacy routes - redirect old service types to new ones
    Route::get('/services/tv-repair', function () {
        return redirect('/services/electronics');
    });
    Route::get('/services/tv-repair/{id}', function ($id) {
        return redirect("/services/electronics/{$id}");
    });
    Route::get('/services/appliance', function () {
        return redirect('/services/electronics');
    });
    Route::get('/services/appliance/{id}', function ($id) {
        return redirect("/services/electronics/{$id}");
    });

    // Tailor Service Management (legacy routes - redirect to new structure for backward compatibility)
    Route::get('/tailor-services', function () {
        return redirect('/services/tailor');
    })->name('tailor-services.index.redirect');
    Route::get('/tailor-services/create', function () {
        return redirect('/services/tailor/create');
    })->name('tailor-services.create.redirect');
    Route::get('/tailor-services/{id}', function ($id) {
        return redirect("/services/tailor/{$id}");
    })->name('tailor-services.show.redirect');
    Route::get('/tailor-services/{id}/edit', function ($id) {
        return redirect("/services/tailor/{$id}/edit");
    })->name('tailor-services.edit.redirect');

    // Keep legacy resource routes for any remaining references
    Route::resource('tailor-services', TailorServiceController::class)->parameters([
        'tailor-services' => 'tailorService'
    ])->except(['index', 'create', 'show', 'edit']);
    Route::patch('/tailor-services/{tailorService}/make-credit', [TailorServiceController::class, 'makeCredit'])->name('tailor-services.make-credit');
    Route::patch('/tailor-services/{tailorService}/pay-credit', [TailorServiceController::class, 'payServiceCredit'])->name('tailor-services.pay-credit');
    Route::patch('/tailor-services/{tailorService}/status', [TailorServiceController::class, 'updateStatus'])->name('tailor-services.update-status');
    Route::get('/tailor-services/{tailorService}/print-options', [TailorServiceController::class, 'getPrintOptions'])->name('tailor-services.print-options');
    Route::post('/tailor-services/{tailorService}/print', [TailorServiceController::class, 'print'])->name('tailor-services.print');
    Route::post('/tailor-services/{tailorService}/send-to-printer', [TailorServiceController::class, 'sendToPrinter'])->name('tailor-services.send-to-printer');

    // Helper routes
    Route::get('customers/{customer}/items', [TailorServiceController::class, 'getCustomerItems'])
        ->name('customers.items');
    
    // Note: Employee management merged into User management
    
    // User Management (Authentication)
    Route::resource('users', UserController::class);
    
    // Stock Management
    Route::get('/stock-movements/search', [StockMovementController::class, 'search'])->name('stock-movements.search');
    Route::resource('stock-movements', StockMovementController::class);
    
    Route::get('/product-stock/search', [ProductStockController::class, 'search'])->name('product-stock.search');
    Route::get('/product-stock', [ProductStockController::class, 'index'])->name('product-stock.index');
    Route::get('/product-stock/{productStock}/edit', [ProductStockController::class, 'edit'])->name('product-stock.edit');
    Route::patch('/product-stock/{productStock}', [ProductStockController::class, 'update'])->name('product-stock.update');
    
    // Goods Receipt Management
    Route::post('/goods-receipts/search-barcode', [GoodsReceiptController::class, 'searchProductByBarcode'])->name('goods-receipts.search-barcode');
    Route::get('/goods-receipts/{goodsReceipt}/view-document', [GoodsReceiptController::class, 'viewDocument'])->name('goods-receipts.view-document');
    Route::get('/goods-receipts/{goodsReceipt}/download-document', [GoodsReceiptController::class, 'downloadDocument'])->name('goods-receipts.download-document');
    Route::resource('goods-receipts', GoodsReceiptController::class);
    
    Route::get('/warehouse-transfers/search', [WarehouseTransferController::class, 'search'])->name('warehouse-transfers.search');
    Route::get('/warehouse-transfers/warehouse-products', [WarehouseTransferController::class, 'getWarehouseProducts'])->name('warehouse-transfers.warehouse-products');
    Route::resource('warehouse-transfers', WarehouseTransferController::class);
    
    // Inventory Management
    Route::get('/inventory', [WarehouseController::class, 'inventory'])->name('inventory.index');
    Route::get('/inventory/{warehouse}', [WarehouseController::class, 'warehouseInventory'])->name('inventory.warehouse');
    
    Route::get('/product-returns/search', [ProductReturnController::class, 'search'])->name('product-returns.search');
    Route::post('/product-returns/products-by-supplier', [ProductReturnController::class, 'getProductsBySupplier'])->name('product-returns.products-by-supplier');
    Route::patch('/product-returns/{return}/approve', [ProductReturnController::class, 'approve'])->name('product-returns.approve');
    Route::patch('/product-returns/{return}/send', [ProductReturnController::class, 'send'])->name('product-returns.send');
    Route::patch('/product-returns/{return}/complete', [ProductReturnController::class, 'complete'])->name('product-returns.complete');
    Route::resource('product-returns', ProductReturnController::class);
    
    Route::get('/alerts/search', [MinMaxAlertController::class, 'search'])->name('alerts.search');
    Route::patch('/alerts/{alert}/view', [MinMaxAlertController::class, 'markAsViewed'])->name('alerts.view');
    Route::patch('/alerts/{alert}/resolve', [MinMaxAlertController::class, 'markAsResolved'])->name('alerts.resolve');
    Route::resource('alerts', MinMaxAlertController::class, ['except' => ['create', 'store', 'edit', 'update']]);

    // Product Activity & Discrepancy Investigation
    Route::get('/product-activity/timeline', [ProductActivityController::class, 'timeline'])->name('product-activity.timeline');
    Route::get('/product-activity/discrepancy', [ProductActivityController::class, 'discrepancy'])->name('product-activity.discrepancy');
    Route::post('/product-activity/investigate', [ProductActivityController::class, 'investigate'])->name('product-activity.investigate');
    Route::post('/product-activity/create-adjustment', [ProductActivityController::class, 'createAdjustment'])->name('product-activity.create-adjustment');

    // Sales & POS Management
    Route::get('/pos', [\App\Http\Controllers\POSController::class, 'index'])->name('pos.index');
    Route::get('/pos/touch', [\App\Http\Controllers\POSController::class, 'touch'])->name('pos.touch');
    Route::post('/pos/sale', [\App\Http\Controllers\POSController::class, 'storeSale'])->name('pos.sale');
    Route::post('/pos/service', [\App\Http\Controllers\POSController::class, 'storeService'])->name('pos.service');

    // Gift Card Sales (direct from POS, not through products)
    Route::post('/pos/gift-card/lookup', [\App\Http\Controllers\POSController::class, 'lookupGiftCard'])->name('pos.gift-card.lookup');
    Route::post('/pos/gift-card/sell', [\App\Http\Controllers\POSController::class, 'sellGiftCard'])->name('pos.gift-card.sell');

    // Shift Management
    Route::get('/shift-management', [\App\Http\Controllers\FiscalShiftController::class, 'index'])->name('shift-management.index');

    // Redirect standalone sales create page to POS system
    Route::get('/sales/create', function() {
        return redirect()->route('pos.index');
    })->name('sales.create.redirect');
    
    Route::get('/sales/search', [SaleController::class, 'search'])->name('sales.search');
    Route::resource('sales', SaleController::class)->except(['create']);
    Route::patch('/sales/{sale}/make-credit', [SaleController::class, 'makeCredit'])->name('sales.make-credit');
    Route::patch('/sales/{sale}/pay-credit', [SaleController::class, 'paySaleCredit'])->name('sales.pay-credit');
    Route::get('/sales/{sale}/print-options', [SaleController::class, 'getPrintOptions'])->name('sales.print-options');
    Route::post('/sales/{sale}/print', [SaleController::class, 'print'])->name('sales.print');
    Route::post('/sales/{sale}/send-to-printer', [SaleController::class, 'sendToPrinter'])->name('sales.send-to-printer');
    Route::post('/sales/{sale}/fiscal-number', [SaleController::class, 'updateFiscalNumber'])->name('sales.update-fiscal-number');

    // Returns & Refunds Management
    Route::get('/returns', [\App\Http\Controllers\ReturnController::class, 'index'])->name('returns.index');
    Route::get('/returns/create', [\App\Http\Controllers\ReturnController::class, 'create'])->name('returns.create');
    Route::post('/returns', [\App\Http\Controllers\ReturnController::class, 'store'])->name('returns.store');
    Route::get('/returns/{id}', [\App\Http\Controllers\ReturnController::class, 'show'])->name('returns.show');
    Route::post('/returns/{id}/cancel', [\App\Http\Controllers\ReturnController::class, 'cancel'])->name('returns.cancel');
    Route::get('/api/sales/{saleId}/for-return', [\App\Http\Controllers\ReturnController::class, 'getSaleForReturn'])->name('api.sales.for-return');

    // Online Orders Management
    Route::get('/online-orders', [OnlineOrderController::class, 'index'])->name('online-orders.index');
    Route::patch('/online-orders/{sale}/status', [OnlineOrderController::class, 'updateStatus'])->name('online-orders.update-status');
    Route::delete('/online-orders/{sale}/cancel', [OnlineOrderController::class, 'cancel'])->name('online-orders.cancel');

    // Gift Cards Management (Tenant)
    Route::prefix('gift-cards')->name('gift-cards.')->group(function () {
        Route::get('/', [\App\Http\Controllers\GiftCardController::class, 'index'])->name('index');
        Route::get('/configure', [\App\Http\Controllers\GiftCardConfigurationController::class, 'index'])->name('configure');
        Route::post('/bulk-configure', [\App\Http\Controllers\GiftCardConfigurationController::class, 'bulkConfigure'])->name('bulk-configure');
        Route::post('/update-denomination', [\App\Http\Controllers\GiftCardConfigurationController::class, 'updateDenomination'])->name('update-denomination');
        Route::post('/create-products', [\App\Http\Controllers\GiftCardConfigurationController::class, 'createProducts'])->name('create-products');
        Route::get('/available-denominations', [\App\Http\Controllers\GiftCardConfigurationController::class, 'getAvailableDenominations'])->name('available-denominations');
        Route::post('/{card}/reset', [\App\Http\Controllers\GiftCardConfigurationController::class, 'resetCard'])->name('reset');
        Route::get('/{card}/details', [\App\Http\Controllers\GiftCardController::class, 'details'])->name('details');
        Route::get('/{card}', [\App\Http\Controllers\GiftCardController::class, 'show'])->name('show');
        Route::post('/activate', [\App\Http\Controllers\GiftCardController::class, 'activate'])->name('activate');
        Route::post('/lookup', [\App\Http\Controllers\GiftCardController::class, 'lookup'])->name('lookup');
        Route::post('/validate', [\App\Http\Controllers\GiftCardController::class, 'validateCard'])->name('validate');
        Route::post('/{card}/reactivate', [\App\Http\Controllers\GiftCardController::class, 'reactivate'])->name('reactivate');
    });

    // Notification Channels
    Route::get('/notification-channels', [App\Http\Controllers\UnifiedSettingsController::class, 'notificationChannels'])->name('notification-channels.index');
    
    // Thermal Printing Management
    Route::get('/printer-configs/search', [PrinterConfigController::class, 'search'])->name('printer-configs.search');
    Route::get('/printer-configs/label-settings', [PrinterConfigController::class, 'getLabelSettings'])->name('printer-configs.label-settings');
    Route::post('/printer-configs/{printer_config}/test', [PrinterConfigController::class, 'testPrint'])->name('printer-configs.test');
    Route::resource('printer-configs', PrinterConfigController::class);
    
    Route::get('/receipt-templates/search', [ReceiptTemplateController::class, 'search'])->name('receipt-templates.search');
    Route::post('/receipt-templates/{receiptTemplate}/preview', [ReceiptTemplateController::class, 'preview'])->name('receipt-templates.preview');
    Route::post('/receipt-templates/{receiptTemplate}/duplicate', [ReceiptTemplateController::class, 'duplicate'])->name('receipt-templates.duplicate');
    Route::post('/receipt-templates/create-default', [ReceiptTemplateController::class, 'createDefault'])->name('receipt-templates.create-default');
    Route::resource('receipt-templates', ReceiptTemplateController::class);
    
    // Settings (POS only - Shop moved to dedicated page)
    Route::get('/settings', [App\Http\Controllers\UnifiedSettingsController::class, 'index'])->name('settings.index');
    Route::post('/settings/pos', [App\Http\Controllers\UnifiedSettingsController::class, 'updatePOS'])->name('settings.pos.update');
    Route::post('/settings/notifications', [App\Http\Controllers\UnifiedSettingsController::class, 'updateNotifications'])->name('settings.notifications.update');
    Route::post('/settings/sms', [App\Http\Controllers\UnifiedSettingsController::class, 'updateSms'])->name('settings.sms.update');
    Route::post('/settings/telegram', [App\Http\Controllers\UnifiedSettingsController::class, 'updateTelegram'])->name('settings.telegram.update');
    Route::post('/settings/telegram/test', [App\Http\Controllers\UnifiedSettingsController::class, 'testTelegram'])->name('settings.telegram.test');
    Route::post('/settings/test-notification', [App\Http\Controllers\UnifiedSettingsController::class, 'testNotification'])->name('settings.test-notification');
    Route::post('/settings/toggle-module', [App\Http\Controllers\UnifiedSettingsController::class, 'toggleModule'])->name('settings.toggle-module');

    // Telegram Logs
    Route::get('/telegram/logs', [App\Http\Controllers\UnifiedSettingsController::class, 'telegramLogs'])->name('telegram.logs');

    // Expense Management
    Route::get('/expense-categories/search', [ExpenseCategoryController::class, 'search'])->name('expense-categories.search');
    Route::resource('expense-categories', ExpenseCategoryController::class);
    
    Route::get('/expenses/search', [ExpenseController::class, 'search'])->name('expenses.search');
    Route::post('/expenses/pay-goods-receipt', [ExpenseController::class, 'payGoodsReceipt'])->name('expenses.pay-goods-receipt');
    Route::get('/expenses/{expense}/view-receipt', [ExpenseController::class, 'viewReceipt'])->name('expenses.view-receipt');
    Route::get('/expenses/{expense}/download-receipt', [ExpenseController::class, 'downloadReceipt'])->name('expenses.download-receipt');
    Route::resource('expenses', ExpenseController::class);
    
    // Supplier Payments
    Route::get('/supplier-payments/search', [SupplierPaymentController::class, 'search'])->name('supplier-payments.search');
    Route::resource('supplier-payments', SupplierPaymentController::class);
    
    // Employee Salaries
    Route::get('/employee-salaries/search', [EmployeeSalaryController::class, 'search'])->name('employee-salaries.search');
    Route::patch('/employee-salaries/{employee_salary}/mark-as-paid', [EmployeeSalaryController::class, 'markAsPaid'])->name('employee-salaries.mark-as-paid');
    Route::resource('employee-salaries', EmployeeSalaryController::class);
    
    // Credit Management
    Route::get('/credits/customer', [CreditController::class, 'customerCredits'])->name('credits.customer');
    Route::get('/credits/customer/create', [CreditController::class, 'createCustomerCredit'])->name('credits.customer.create');
    Route::post('/credits/customer', [CreditController::class, 'storeCustomerCredit'])->name('credits.customer.store');
    Route::patch('/credits/customer/{credit}/pay', [CreditController::class, 'payCustomerCredit'])->name('credits.customer.pay');
    
    Route::get('/credits/supplier', [CreditController::class, 'supplierCredits'])->name('credits.supplier');
    Route::get('/credits/supplier/create', [CreditController::class, 'createSupplierCredit'])->name('credits.supplier.create');
    Route::post('/credits/supplier', [CreditController::class, 'storeSupplierCredit'])->name('credits.supplier.store');
    Route::patch('/credits/supplier/{credit}/pay', [CreditController::class, 'paySupplierCredit'])->name('credits.supplier.pay');
    
    Route::get('/api/customer-credits', [CreditController::class, 'getCustomerCreditsForDropdown'])->name('api.customer-credits');
    Route::get('/api/supplier-credits', [CreditController::class, 'getSupplierCreditsForDropdown'])->name('api.supplier-credits');
    
    // Reports
    Route::get('/reports', [ReportController::class, 'index'])->name('reports.index');
    Route::post('/reports/generate', [ReportController::class, 'generate'])->name('reports.generate');
    Route::get('/reports/{report}', [ReportController::class, 'show'])->name('reports.show');
    Route::get('/reports/{report}/download', [ReportController::class, 'download'])->name('reports.download');

    // Audit Logs
    Route::resource('audit-logs', AuditLogController::class, ['only' => ['index', 'show']]);

    // Fiscal Printer Job Queue
    Route::prefix('fiscal-printer-jobs')->name('fiscal-printer-jobs.')->group(function () {
        Route::get('/', [FiscalPrinterJobController::class, 'index'])->name('index');
        Route::post('/{job}/retry', [FiscalPrinterJobController::class, 'retry'])->name('retry');
        Route::delete('/{job}', [FiscalPrinterJobController::class, 'destroy'])->name('destroy');
        Route::post('/bulk-delete', [FiscalPrinterJobController::class, 'bulkDelete'])->name('bulk-delete');
    });

    // Integrations Marketplace
    Route::prefix('integrations')->name('integrations.')->group(function () {
        Route::get('/', [IntegrationsController::class, 'index'])->name('index');
        Route::get('/sms', [IntegrationsController::class, 'sms'])->name('sms');
        Route::get('/telegram', [IntegrationsController::class, 'telegram'])->name('telegram');
    });

    // Shop Settings (Dedicated Page)
    Route::prefix('shop-settings')->name('shop-settings.')->group(function () {
        Route::get('/', [\App\Http\Controllers\ShopSettingsController::class, 'index'])->name('index');
        Route::post('/update', [\App\Http\Controllers\ShopSettingsController::class, 'update'])->name('update');
    });

    // SMS Management
    Route::prefix('sms')->name('sms.')->group(function () {
        Route::get('/', [SmsController::class, 'index'])->name('index');
        Route::get('/send-sms', [SmsController::class, 'sendPage'])->name('send-page');
        Route::post('/credentials', [SmsController::class, 'storeCredentials'])->name('credentials.store');
        Route::post('/send', [SmsController::class, 'send'])->name('send');
        Route::post('/send-bulk', [SmsController::class, 'sendBulk'])->name('send-bulk');
        Route::post('/send-all', [SmsController::class, 'sendAll'])->name('send-all');
        Route::get('/logs', [SmsController::class, 'logs'])->name('logs');
        Route::post('/test', [SmsController::class, 'test'])->name('test');
    });

    // Fiscal Printer Management
    Route::prefix('fiscal-printer')->name('fiscal-printer.')->group(function () {
        Route::get('/', [FiscalPrinterConfigController::class, 'index'])->name('index');
        Route::post('/', [FiscalPrinterConfigController::class, 'store'])->name('store');
        Route::delete('/', [FiscalPrinterConfigController::class, 'destroy'])->name('destroy');
        Route::post('/test-connection', [FiscalPrinterConfigController::class, 'testConnection'])->name('test-connection');
        Route::get('/logs', [FiscalPrinterConfigController::class, 'logs'])->name('logs');

        // Shift Management
        Route::get('/shift/status', [FiscalPrinterConfigController::class, 'getShiftStatus'])->name('shift.status');
        Route::post('/shift/open', [FiscalPrinterConfigController::class, 'openShift'])->name('shift.open');
        Route::post('/shift/close', [FiscalPrinterConfigController::class, 'closeShift'])->name('shift.close');
        Route::post('/shift/x-report', [FiscalPrinterConfigController::class, 'printXReport'])->name('shift.x-report');

        // Payment Operations
        Route::post('/credit-pay', [FiscalPrinterConfigController::class, 'printCreditPay'])->name('credit-pay');
        Route::post('/advance-sale', [FiscalPrinterConfigController::class, 'printAdvanceSale'])->name('advance-sale');

        // Cash Drawer Operations
        Route::post('/deposit', [FiscalPrinterConfigController::class, 'printDeposit'])->name('deposit');
        Route::post('/withdraw', [FiscalPrinterConfigController::class, 'printWithdraw'])->name('withdraw');
        Route::post('/open-cashbox', [FiscalPrinterConfigController::class, 'openCashBox'])->name('open-cashbox');

        // Utility Operations
        Route::post('/correction', [FiscalPrinterConfigController::class, 'printCorrection'])->name('correction');
        Route::post('/rollback', [FiscalPrinterConfigController::class, 'printRollBack'])->name('rollback');
        Route::post('/print-last', [FiscalPrinterConfigController::class, 'printLastReceipt'])->name('print-last');

        // Report Operations
        Route::post('/periodic-report', [FiscalPrinterConfigController::class, 'getPeriodicReport'])->name('periodic-report');
        Route::post('/control-tape', [FiscalPrinterConfigController::class, 'getControlTape'])->name('control-tape');
    });

    // Bridge Token Management
    Route::prefix('bridge-tokens')->name('bridge-tokens.')->group(function () {
        Route::get('/', [\App\Http\Controllers\BridgeTokenController::class, 'index'])->name('index');
        Route::post('/', [\App\Http\Controllers\BridgeTokenController::class, 'store'])->name('store');
        Route::get('/{bridgeToken}', [\App\Http\Controllers\BridgeTokenController::class, 'show'])->name('show');
        Route::post('/{bridgeToken}/revoke', [\App\Http\Controllers\BridgeTokenController::class, 'revoke'])->name('revoke');
        Route::delete('/{bridgeToken}', [\App\Http\Controllers\BridgeTokenController::class, 'destroy'])->name('destroy');
    });

    // Loyalty Program
    Route::prefix('loyalty-program')->name('loyalty-program.')->group(function () {
        Route::get('/', [\App\Http\Controllers\LoyaltyProgramController::class, 'index'])->name('index');
        Route::post('/', [\App\Http\Controllers\LoyaltyProgramController::class, 'store'])->name('store');
        Route::post('/toggle-active', [\App\Http\Controllers\LoyaltyProgramController::class, 'toggleActive'])->name('toggle-active');
        Route::post('/toggle-module', [\App\Http\Controllers\LoyaltyProgramController::class, 'toggleModule'])->name('toggle-module');
        Route::get('/show', [\App\Http\Controllers\LoyaltyProgramController::class, 'show'])->name('show');
    });

    // Rental Management
    Route::prefix('rentals')->name('rentals.')->group(function () {
        Route::get('/', [\App\Http\Controllers\RentalController::class, 'index'])->name('index');
        Route::post('/', [\App\Http\Controllers\RentalController::class, 'store'])->name('store');
        Route::get('/create', [\App\Http\Controllers\RentalController::class, 'create'])->name('create');
        Route::get('/calendar', [\App\Http\Controllers\RentalController::class, 'calendar'])->name('calendar');
        Route::get('/due-today', [\App\Http\Controllers\RentalController::class, 'dueToday'])->name('due-today');
        Route::get('/overdue', [\App\Http\Controllers\RentalController::class, 'overdue'])->name('overdue');
        Route::post('/check-overdue', [\App\Http\Controllers\RentalController::class, 'checkOverdue'])->name('check-overdue');
        Route::get('/statistics', [\App\Http\Controllers\RentalController::class, 'statistics'])->name('statistics');
        Route::get('/checklist/{category}', [\App\Http\Controllers\RentalController::class, 'getDefaultChecklist'])->name('checklist');
        Route::post('/search-barcode', [\App\Http\Controllers\RentalController::class, 'searchByBarcode'])->name('search-barcode');
        Route::post('/check-availability', [\App\Http\Controllers\RentalController::class, 'checkAvailability'])->name('check-availability');
        Route::get('/{rental}/edit', [\App\Http\Controllers\RentalController::class, 'edit'])->name('edit');
        Route::get('/{rental}', [\App\Http\Controllers\RentalController::class, 'show'])->name('show');
        Route::put('/{rental}', [\App\Http\Controllers\RentalController::class, 'update'])->name('update');
        Route::delete('/{rental}', [\App\Http\Controllers\RentalController::class, 'destroy'])->name('destroy');
        Route::get('/{rental}/return', [\App\Http\Controllers\RentalController::class, 'showReturnPage'])->name('return.show');
        Route::post('/{rental}/return', [\App\Http\Controllers\RentalController::class, 'processReturn'])->name('return');
        Route::post('/{rental}/extend', [\App\Http\Controllers\RentalController::class, 'extend'])->name('extend');
        Route::post('/{rental}/cancel', [\App\Http\Controllers\RentalController::class, 'cancel'])->name('cancel');
        Route::post('/{rental}/add-payment', [\App\Http\Controllers\RentalController::class, 'addPayment'])->name('add-payment');
        Route::get('/{rental}/agreement/pdf', [\App\Http\Controllers\RentalController::class, 'downloadAgreementPdf'])->name('agreement.pdf');
    });

    // Rental Inventory Management
    Route::prefix('rental-inventory')->name('rental-inventory.')->group(function () {
        Route::get('/', [\App\Http\Controllers\RentalInventoryController::class, 'index'])->name('index');
        Route::get('/create', [\App\Http\Controllers\RentalInventoryController::class, 'create'])->name('create');
        Route::post('/', [\App\Http\Controllers\RentalInventoryController::class, 'store'])->name('store');
        Route::get('/available', [\App\Http\Controllers\RentalInventoryController::class, 'getAvailable'])->name('available');
        Route::get('/calendar/bookings', [\App\Http\Controllers\RentalInventoryController::class, 'getAllBookings'])->name('calendar.bookings');
        Route::get('/{inventory}', [\App\Http\Controllers\RentalInventoryController::class, 'show'])->name('show');
        Route::get('/{inventory}/bookings', [\App\Http\Controllers\RentalInventoryController::class, 'getBookings'])->name('bookings');
        Route::get('/{inventory}/edit', [\App\Http\Controllers\RentalInventoryController::class, 'edit'])->name('edit');
        Route::put('/{inventory}', [\App\Http\Controllers\RentalInventoryController::class, 'update'])->name('update');
        Route::delete('/{inventory}', [\App\Http\Controllers\RentalInventoryController::class, 'destroy'])->name('destroy');
        Route::post('/{inventory}/maintenance/schedule', [\App\Http\Controllers\RentalInventoryController::class, 'scheduleMaintenance'])->name('maintenance.schedule');
        Route::post('/{inventory}/maintenance/complete', [\App\Http\Controllers\RentalInventoryController::class, 'completeMaintenance'])->name('maintenance.complete');
        Route::post('/{inventory}/mark-damaged', [\App\Http\Controllers\RentalInventoryController::class, 'markAsDamaged'])->name('mark-damaged');
    });

    // Rental Categories Management
    Route::prefix('rental-categories')->name('rental-categories.')->group(function () {
        Route::get('/', [\App\Http\Controllers\RentalCategoryController::class, 'index'])->name('index');
        Route::get('/create', [\App\Http\Controllers\RentalCategoryController::class, 'create'])->name('create');
        Route::post('/', [\App\Http\Controllers\RentalCategoryController::class, 'store'])->name('store');
        Route::get('/active', [\App\Http\Controllers\RentalCategoryController::class, 'getActive'])->name('active');
        Route::post('/reorder', [\App\Http\Controllers\RentalCategoryController::class, 'reorder'])->name('reorder');
        Route::get('/{rentalCategory}', [\App\Http\Controllers\RentalCategoryController::class, 'show'])->name('show');
        Route::get('/{rentalCategory}/edit', [\App\Http\Controllers\RentalCategoryController::class, 'edit'])->name('edit');
        Route::put('/{rentalCategory}', [\App\Http\Controllers\RentalCategoryController::class, 'update'])->name('update');
        Route::delete('/{rentalCategory}', [\App\Http\Controllers\RentalCategoryController::class, 'destroy'])->name('destroy');
        Route::post('/{rentalCategory}/toggle-status', [\App\Http\Controllers\RentalCategoryController::class, 'toggleStatus'])->name('toggle-status');
    });

    // Rental Agreement Templates Management
    Route::prefix('rental-templates')->name('rental-templates.')->group(function () {
        Route::get('/', [\App\Http\Controllers\RentalTemplateController::class, 'index'])->name('index');
        Route::get('/create', [\App\Http\Controllers\RentalTemplateController::class, 'create'])->name('create');
        Route::post('/', [\App\Http\Controllers\RentalTemplateController::class, 'store'])->name('store');
        Route::get('/{rentalTemplate}', [\App\Http\Controllers\RentalTemplateController::class, 'show'])->name('show');
        Route::get('/{rentalTemplate}/edit', [\App\Http\Controllers\RentalTemplateController::class, 'edit'])->name('edit');
        Route::put('/{rentalTemplate}', [\App\Http\Controllers\RentalTemplateController::class, 'update'])->name('update');
        Route::delete('/{rentalTemplate}', [\App\Http\Controllers\RentalTemplateController::class, 'destroy'])->name('destroy');
        Route::post('/{rentalTemplate}/toggle-status', [\App\Http\Controllers\RentalTemplateController::class, 'toggleStatus'])->name('toggle-status');
        Route::post('/{rentalTemplate}/set-default', [\App\Http\Controllers\RentalTemplateController::class, 'setDefault'])->name('set-default');
        Route::get('/{rentalTemplate}/preview', [\App\Http\Controllers\RentalTemplateController::class, 'preview'])->name('preview');
        Route::post('/{rentalTemplate}/duplicate', [\App\Http\Controllers\RentalTemplateController::class, 'duplicate'])->name('duplicate');
    });

    // Redirect legacy/misspelled stock routes
    Route::get('/stock-herektleri', function() {
        return redirect('/stock-movements');
    });

    Route::get('/stock-xeberdaligi', function() {
        return redirect('/alerts');
    });
});

require __DIR__.'/auth.php';

// NOTE: Shop settings moved to dedicated page
// Old route kept for backward compatibility
Route::middleware(['auth', 'account.access'])->group(function () {
    Route::get('/settings/shop', function() {
        return redirect('/shop-settings');
    });
});

// Public shop routes (no auth, rate limiting only)
Route::prefix('shop/{shop_slug}')->name('shop.')->middleware(['throttle:60,1'])->group(function () {
    Route::get('/', [App\Http\Controllers\PublicShopController::class, 'index'])->name('home');
    Route::get('/product/{id}', [App\Http\Controllers\PublicShopController::class, 'show'])->name('product');
    Route::post('/order', [App\Http\Controllers\PublicShopController::class, 'createOrder'])->name('order');
    Route::get('/order/success/{order_number}', [App\Http\Controllers\PublicShopController::class, 'orderSuccess'])->name('order.success');
});

