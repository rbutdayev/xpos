<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\BranchController;
use App\Http\Controllers\WarehouseController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProductVariantController;
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
use App\Http\Controllers\PrinterConfigController;
use App\Http\Controllers\ReceiptTemplateController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\ExpenseCategoryController;
use App\Http\Controllers\SupplierPaymentController;
use App\Http\Controllers\EmployeeSalaryController;
use App\Http\Controllers\SystemSettingsController;
use App\Http\Controllers\SuperAdminController;
use App\Http\Controllers\Admin\SystemHealthController;
use App\Http\Controllers\Admin\SecurityController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\CreditController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\Request;
use Inertia\Inertia;

Route::get('/', function () {
    return view('welcome');
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
});

// Main Dashboard 
Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

// Debug route for translations
Route::get('/debug-translations', function () {
    return \Inertia\Inertia::render('DebugTranslations');
})->middleware(['auth', 'verified'])->name('debug.translations');

Route::middleware(['auth', 'account.access'])->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    
    // Company Setup Wizard
    Route::get('/setup', [CompanyController::class, 'setupWizard'])->name('setup.wizard');
    Route::post('/setup', [CompanyController::class, 'store'])->name('setup.store');
    
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
        $request->validate([
            'warehouse_id' => 'nullable|exists:warehouses,id'
        ]);
        
        if ($request->warehouse_id) {
            $user = Auth::user();
            
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
    Route::post('/products/{product}/calculate-price', [ProductController::class, 'calculatePrice'])->name('products.calculate-price');
    Route::post('/products/generate-barcode', [ProductController::class, 'generateBarcode'])->name('products.generate-barcode');
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

    // Barcode Management
    Route::get('/barcodes/{product}', [BarcodeController::class, 'show'])->name('barcodes.show');
    Route::get('/barcodes/{product}/print', [BarcodeController::class, 'print'])->name('barcodes.print');
    Route::post('/barcodes/{product}/generate', [BarcodeController::class, 'generate'])->name('barcodes.generate');
    Route::post('/barcodes/validate', [BarcodeController::class, 'validateBarcode'])->name('barcodes.validate');
    Route::get('/barcodes/types', [BarcodeController::class, 'types'])->name('barcodes.types');
    
    // Document Management
    Route::get('/products/{product}/documents', [DocumentController::class, 'index'])->name('documents.index');
    Route::post('/products/{product}/documents', [DocumentController::class, 'store'])->name('documents.store');
    Route::post('/products/{product}/documents/single', [DocumentController::class, 'uploadSingle'])->name('documents.upload');
    Route::delete('/documents/{document}', [DocumentController::class, 'destroy'])->name('documents.destroy');
    Route::get('/documents/{document}/serve', [DocumentController::class, 'serve'])->name('documents.serve');
    Route::get('/documents/{document}/thumbnail', [DocumentController::class, 'thumbnail'])->name('documents.thumbnail');
    Route::get('/documents/types', [DocumentController::class, 'types'])->name('documents.types');
    Route::get('/documents/statistics', [DocumentController::class, 'statistics'])->name('documents.statistics');
    
    // Generic file serving route for uploaded files (company logos, etc.)
    Route::get('/files/{path}', function (Request $request, $path) {
        Gate::authorize('access-account-data');
        
        $filePath = base64_decode($path);
        $documentService = app(\App\Services\DocumentUploadService::class);
        
        if (!$documentService->fileExists($filePath)) {
            abort(404, 'Fayl tapılmadı');
        }
        
        $download = $request->boolean('download', false);
        
        if (!Storage::disk('documents')->exists($filePath)) {
            abort(404, 'Fayl tapılmadı');
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
    Route::resource('customers', CustomerController::class);

    // Customer Items Management (clothing, fabrics for tailor services)
    Route::get('/customer-items/search', [CustomerItemController::class, 'search'])->name('customer-items.search');
    Route::resource('customer-items', CustomerItemController::class);

    // Tailor Service Management (renamed from service-records)
    Route::resource('tailor-services', TailorServiceController::class)->except(['create']);
    Route::patch('/tailor-services/{tailorService}/make-credit', [TailorServiceController::class, 'makeCredit'])->name('tailor-services.make-credit');
    Route::patch('/tailor-services/{tailorService}/pay-credit', [TailorServiceController::class, 'payServiceCredit'])->name('tailor-services.pay-credit');
    Route::patch('/tailor-services/{tailor_service}/status', [TailorServiceController::class, 'updateStatus'])->name('tailor-services.update-status');
    Route::get('/tailor-services/{tailor_service}/print-options', [TailorServiceController::class, 'getPrintOptions'])->name('tailor-services.print-options');
    Route::post('/tailor-services/{tailor_service}/print', [TailorServiceController::class, 'print'])->name('tailor-services.print');
    Route::post('/tailor-services/{tailor_service}/send-to-printer', [TailorServiceController::class, 'sendToPrinter'])->name('tailor-services.send-to-printer');

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
    
    // Sales & POS Management
    Route::get('/pos', [\App\Http\Controllers\POSController::class, 'index'])->name('pos.index');
    Route::get('/pos/touch', [\App\Http\Controllers\POSController::class, 'touch'])->name('pos.touch');
    Route::post('/pos/sale', [\App\Http\Controllers\POSController::class, 'storeSale'])->name('pos.sale');
    Route::post('/pos/service', [\App\Http\Controllers\POSController::class, 'storeService'])->name('pos.service');
    
    // Redirect standalone create pages to POS system
    Route::get('/sales/create', function() {
        return redirect()->route('pos.index');
    })->name('sales.create.redirect');
    Route::get('/tailor-services/create', function() {
        return redirect()->route('pos.index', ['mode' => 'service']);
    })->name('tailor-services.create.redirect');
    
    Route::get('/sales/search', [SaleController::class, 'search'])->name('sales.search');
    Route::resource('sales', SaleController::class)->except(['create']);
    Route::patch('/sales/{sale}/make-credit', [SaleController::class, 'makeCredit'])->name('sales.make-credit');
    Route::patch('/sales/{sale}/pay-credit', [SaleController::class, 'paySaleCredit'])->name('sales.pay-credit');
    Route::get('/sales/{sale}/print-options', [SaleController::class, 'getPrintOptions'])->name('sales.print-options');
    Route::post('/sales/{sale}/print', [SaleController::class, 'print'])->name('sales.print');
    Route::post('/sales/{sale}/send-to-printer', [SaleController::class, 'sendToPrinter'])->name('sales.send-to-printer');
    
    // Thermal Printing Management
    Route::get('/printer-configs/search', [PrinterConfigController::class, 'search'])->name('printer-configs.search');
    Route::post('/printer-configs/{printerConfig}/test', [PrinterConfigController::class, 'testPrint'])->name('printer-configs.test');
    Route::resource('printer-configs', PrinterConfigController::class);
    
    Route::get('/receipt-templates/search', [ReceiptTemplateController::class, 'search'])->name('receipt-templates.search');
    Route::post('/receipt-templates/{receiptTemplate}/preview', [ReceiptTemplateController::class, 'preview'])->name('receipt-templates.preview');
    Route::post('/receipt-templates/{receiptTemplate}/duplicate', [ReceiptTemplateController::class, 'duplicate'])->name('receipt-templates.duplicate');
    Route::post('/receipt-templates/create-default', [ReceiptTemplateController::class, 'createDefault'])->name('receipt-templates.create-default');
    Route::resource('receipt-templates', ReceiptTemplateController::class);
    
    // System Settings
    Route::get('/settings', [SystemSettingsController::class, 'index'])->name('settings.index');
    Route::put('/settings', [SystemSettingsController::class, 'update'])->name('settings.update');
    
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
    
    // Redirect legacy/misspelled stock routes
    Route::get('/stock-herektleri', function() {
        return redirect('/stock-movements');
    });
    
    Route::get('/stock-xeberdaligi', function() {
        return redirect('/alerts');
    });
});

require __DIR__.'/auth.php';

