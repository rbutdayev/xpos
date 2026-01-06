<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Fiscal Printer Bridge API (uses bearer token authentication)
Route::prefix('bridge')->name('bridge.')->group(function () {
    Route::post('/register', [\App\Http\Controllers\Api\FiscalPrinterBridgeController::class, 'register'])->name('register');
    Route::get('/poll', [\App\Http\Controllers\Api\FiscalPrinterBridgeController::class, 'poll'])->name('poll');
    Route::post('/heartbeat', [\App\Http\Controllers\Api\FiscalPrinterBridgeController::class, 'heartbeat'])->name('heartbeat');
    Route::post('/job/{job}/complete', [\App\Http\Controllers\Api\FiscalPrinterBridgeController::class, 'completeJob'])->name('job.complete');
    Route::post('/job/{job}/complete-shift', [\App\Http\Controllers\Api\FiscalPrinterBridgeController::class, 'completeShiftJob'])->name('job.complete-shift');
    Route::post('/job/{job}/fail', [\App\Http\Controllers\Api\FiscalPrinterBridgeController::class, 'failJob'])->name('job.fail');
    Route::get('/get-shift-status-request', [\App\Http\Controllers\Api\FiscalPrinterBridgeController::class, 'getShiftStatusRequest'])->name('get-shift-status-request');
    Route::post('/push-status', [\App\Http\Controllers\Api\FiscalPrinterBridgeController::class, 'pushStatus'])->name('push-status');
});

// Job Status API (for frontend polling - using web session auth)
Route::middleware(['web', 'auth'])->group(function () {
    Route::get('/jobs/sale/{saleId}/status', [\App\Http\Controllers\Api\JobStatusController::class, 'getSaleJobStatus'])->name('jobs.sale.status');
    Route::get('/shift-status', [\App\Http\Controllers\Api\ShiftStatusController::class, 'getStatus'])->name('shift.status');

    // User Language Settings
    Route::post('/user/language', [\App\Http\Controllers\UserController::class, 'updateLanguage'])->name('user.language.update');

    // Currency Management
    Route::get('/currencies', [\App\Http\Controllers\Api\CurrencyController::class, 'index'])->name('currencies.index');
    Route::get('/company/currency', [\App\Http\Controllers\Api\CurrencyController::class, 'show'])->name('company.currency.show');
    Route::put('/company/currency', [\App\Http\Controllers\Api\CurrencyController::class, 'update'])->name('company.currency.update');
});

// Delivery Platform Webhooks (no middleware - public endpoints with platform-specific authentication)
Route::prefix('webhooks')->name('webhooks.')->group(function () {
    // Wolt webhooks
    Route::post('/wolt/orders', [\App\Http\Controllers\Api\WoltWebhookController::class, 'handleOrder'])->name('wolt.orders');

    // Yango webhooks
    Route::post('/yango/orders', [\App\Http\Controllers\Api\YangoWebhookController::class, 'handleOrder'])->name('yango.orders');

    // Bolt Food webhooks
    Route::post('/bolt/orders', [\App\Http\Controllers\Api\BoltWebhookController::class, 'handleOrder'])->name('bolt.orders');
});

// Kiosk API Routes (uses bearer token authentication via kiosk.auth middleware)
Route::prefix('kiosk')->name('kiosk.')->middleware('kiosk.auth')->group(function () {
    // Authentication & Device Management
    Route::post('/register', [\App\Http\Controllers\Kiosk\KioskAuthController::class, 'register'])->name('register');
    Route::post('/login', [\App\Http\Controllers\Kiosk\KioskAuthController::class, 'loginWithPin'])->name('login');
    Route::get('/heartbeat', [\App\Http\Controllers\Kiosk\KioskAuthController::class, 'heartbeat'])->name('heartbeat');
    Route::post('/disconnect', [\App\Http\Controllers\Kiosk\KioskAuthController::class, 'disconnect'])->name('disconnect');

    // Sync endpoints (with rate limiting: 10 req/min)
    Route::prefix('sync')->name('sync.')->middleware('kiosk.rate_limit:sync')->group(function () {
        Route::get('/products/delta', [\App\Http\Controllers\Kiosk\KioskSyncController::class, 'syncProductsDelta'])->name('products.delta');
        Route::get('/customers/delta', [\App\Http\Controllers\Kiosk\KioskSyncController::class, 'syncCustomersDelta'])->name('customers.delta');
        Route::get('/users', [\App\Http\Controllers\Kiosk\KioskAuthController::class, 'getKioskUsers'])->name('users');
        Route::get('/config', [\App\Http\Controllers\Kiosk\KioskSyncController::class, 'getConfig'])->name('config');
    });

    // Fiscal configuration (with sync rate limit)
    Route::get('/fiscal-config', [\App\Http\Controllers\Kiosk\KioskSyncController::class, 'getFiscalConfig'])
        ->middleware('kiosk.rate_limit:sync')
        ->name('fiscal-config');

    // Sales Operations (with rate limiting: 50 req/min)
    Route::middleware('kiosk.rate_limit:sales')->group(function () {
        Route::post('/sale', [\App\Http\Controllers\Kiosk\KioskSalesController::class, 'createSale'])->name('sale.create');
        Route::post('/sales/upload', [\App\Http\Controllers\Kiosk\KioskSalesController::class, 'uploadSales'])->name('sales.upload');
    });
    Route::get('/sales/status/{localId}', [\App\Http\Controllers\Kiosk\KioskSalesController::class, 'getSaleStatus'])->name('sales.status');

    // Quick Actions - Search & Lookup (with rate limiting: 100 req/min)
    Route::middleware('kiosk.rate_limit:search')->group(function () {
        Route::get('/products/search', [\App\Http\Controllers\Kiosk\KioskQuickActionsController::class, 'searchProducts'])->name('products.search');
        Route::get('/customers/search', [\App\Http\Controllers\Kiosk\KioskQuickActionsController::class, 'searchCustomers'])->name('customers.search');
    });

    // Quick Actions - Store & Validate (default rate limit: 30 req/min)
    Route::post('/customers/quick-store', [\App\Http\Controllers\Kiosk\KioskQuickActionsController::class, 'quickStoreCustomer'])->name('customers.quick-store');
    Route::post('/loyalty/validate', [\App\Http\Controllers\Kiosk\KioskQuickActionsController::class, 'validateLoyaltyCard'])->name('loyalty.validate');
    Route::post('/gift-card/lookup', [\App\Http\Controllers\Kiosk\KioskQuickActionsController::class, 'lookupGiftCard'])->name('gift-card.lookup');
});
