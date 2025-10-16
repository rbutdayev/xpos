<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Support\Facades\Route;

return Application::configure(basePath: dirname(__DIR__))
    ->withSchedule(function ($schedule) {
        // Generate stock alerts every hour
        $schedule->command('alerts:generate')->hourly();
        
        // Clean up old audit logs daily at 2 AM (keep 30 days)
        $schedule->command('audit:cleanup --days=30')
                 ->dailyAt('02:00')
                 ->withoutOverlapping()
                 ->runInBackground();
    })
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function () {
            // Custom route model bindings for models with custom primary keys
            Route::bind('expense', function ($value) {
                return \App\Models\Expense::where('expense_id', $value)->firstOrFail();
            });
            Route::bind('expense_category', function ($value) {
                return \App\Models\ExpenseCategory::where('category_id', $value)->firstOrFail();
            });
            Route::bind('product_return', function ($value) {
                return \App\Models\ProductReturn::where('return_id', $value)->firstOrFail();
            });
            Route::bind('employee_salary', function ($value) {
                return \App\Models\EmployeeSalary::where('salary_id', $value)->firstOrFail();
            });
            Route::bind('supplier_payment', function ($value) {
                return \App\Models\SupplierPayment::where('payment_id', $value)->firstOrFail();
            });
            Route::bind('sale', function ($value) {
                return \App\Models\Sale::where('sale_id', $value)->firstOrFail();
            });
            Route::bind('warehouse_transfer', function ($value) {
                return \App\Models\WarehouseTransfer::where('transfer_id', $value)->firstOrFail();
            });
            Route::bind('printer_config', function ($value) {
                return \App\Models\PrinterConfig::where('config_id', $value)->firstOrFail();
            });
            Route::bind('receipt_template', function ($value) {
                return \App\Models\ReceiptTemplate::where('template_id', $value)->firstOrFail();
            });
        },
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias([
            'account.access' => \App\Http\Middleware\EnsureAccountAccess::class,
            'superadmin' => \App\Http\Middleware\SuperAdminAccess::class,
            'branch.access' => \App\Http\Middleware\BranchAccess::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Handle database connection errors
        $exceptions->render(function (\Illuminate\Database\QueryException $e, \Illuminate\Http\Request $request) {
            // Handle missing tables
            if (str_contains($e->getMessage(), "Base table or view not found") || 
                str_contains($e->getMessage(), "doesn't exist")) {
                
                if ($request->expectsJson()) {
                    return response()->json([
                        'message' => 'Sistem yenilənir. Zəhmət olmasa bir az gözləyin.',
                        'error' => 'database_setup_required'
                    ], 503);
                }
                
                return response()->view('errors.database-setup', [
                    'message' => 'Sistem hazırlanır',
                    'description' => 'Məlumat bazası yenilənir. Zəhmət olmasa bir neçə dəqiqə gözləyin.'
                ], 503);
            }
            
            // Handle connection errors
            if (str_contains($e->getMessage(), "Connection refused") || 
                str_contains($e->getMessage(), "Can't connect")) {
                
                if ($request->expectsJson()) {
                    return response()->json([
                        'message' => 'Məlumat bazası əlçatan deyil. Admin ilə əlaqə saxlayın.',
                        'error' => 'database_connection_failed'
                    ], 503);
                }
                
                return response()->view('errors.database-connection', [
                    'message' => 'Bağlantı problemi',
                    'description' => 'Məlumat bazası ilə əlaqə yaradıla bilmədi. Administratorla əlaqə saxlayın.'
                ], 503);
            }
        });
        
        // Handle PDO exceptions (connection issues)
        $exceptions->render(function (\PDOException $e, \Illuminate\Http\Request $request) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Məlumat bazası xətası. Admin ilə əlaqə saxlayın.',
                    'error' => 'database_error'
                ], 503);
            }
            
            return response()->view('errors.database-connection', [
                'message' => 'Məlumat bazası xətası',
                'description' => 'Sistem xətası baş verdi. Administratorla əlaqə saxlayın.'
            ], 503);
        });
    })->create();
