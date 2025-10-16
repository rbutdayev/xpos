<?php

namespace App\Providers;

use App\Models\ProductStock;
use App\Models\PrinterConfig;
use App\Models\Product;
use App\Models\Customer;
use App\Models\Sale;
use App\Models\Expense;
use App\Models\Supplier;
use App\Models\User;
use App\Models\Company;
use App\Models\Branch;
use App\Models\Warehouse;
use App\Models\Category;
use App\Models\StockMovement;
use App\Models\WarehouseTransfer;
use App\Models\GoodsReceipt;
use App\Models\ProductReturn;
use App\Observers\ProductStockObserver;
use App\Observers\AuditLogObserver;
use App\Listeners\TrackLoginAttempts;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Failed;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);
        
        // Register observers
        ProductStock::observe(ProductStockObserver::class);
        
        // Register audit log observers for key models
        Product::observe(AuditLogObserver::class);
        Customer::observe(AuditLogObserver::class);
        Sale::observe(AuditLogObserver::class);
        Expense::observe(AuditLogObserver::class);
        Supplier::observe(AuditLogObserver::class);
        User::observe(AuditLogObserver::class);
        Company::observe(AuditLogObserver::class);
        Branch::observe(AuditLogObserver::class);
        Warehouse::observe(AuditLogObserver::class);
        Category::observe(AuditLogObserver::class);
        StockMovement::observe(AuditLogObserver::class);
        WarehouseTransfer::observe(AuditLogObserver::class);
        GoodsReceipt::observe(AuditLogObserver::class);
        ProductReturn::observe(AuditLogObserver::class);
        PrinterConfig::observe(AuditLogObserver::class);
        
        // Register explicit route model bindings for models with custom primary keys
        Route::model('printer_config', PrinterConfig::class);

        // Register login attempt tracking listeners
        Event::listen(Login::class, [TrackLoginAttempts::class, 'handleLogin']);
        Event::listen(Failed::class, [TrackLoginAttempts::class, 'handleFailed']);
    }
}
