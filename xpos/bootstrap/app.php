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
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function () {
            // Custom route model bindings for models with custom primary keys
            // Security: All bindings verify account_id to prevent IDOR attacks

            Route::bind('expense', function ($value) {
                $expense = \App\Models\Expense::where('expense_id', $value)->firstOrFail();

                // Security: Verify user has access to this expense's account
                if (\Illuminate\Support\Facades\Auth::check() &&
                    !\Illuminate\Support\Facades\Auth::user()->isSuperAdmin()) {
                    if ($expense->account_id !== \Illuminate\Support\Facades\Auth::user()->account_id) {
                        abort(403, 'Access denied');
                    }
                }

                return $expense;
            });

            Route::bind('expense_category', function ($value) {
                $category = \App\Models\ExpenseCategory::where('category_id', $value)->firstOrFail();

                // Security: Verify user has access to this category's account
                if (\Illuminate\Support\Facades\Auth::check() &&
                    !\Illuminate\Support\Facades\Auth::user()->isSuperAdmin()) {
                    if ($category->account_id !== \Illuminate\Support\Facades\Auth::user()->account_id) {
                        abort(403, 'Access denied');
                    }
                }

                return $category;
            });

            Route::bind('product_return', function ($value) {
                $return = \App\Models\ProductReturn::where('return_id', $value)->firstOrFail();

                // Security: Verify user has access to this return's account
                if (\Illuminate\Support\Facades\Auth::check() &&
                    !\Illuminate\Support\Facades\Auth::user()->isSuperAdmin()) {
                    if ($return->account_id !== \Illuminate\Support\Facades\Auth::user()->account_id) {
                        abort(403, 'Access denied');
                    }
                }

                return $return;
            });

            Route::bind('employee_salary', function ($value) {
                $salary = \App\Models\EmployeeSalary::where('salary_id', $value)->firstOrFail();

                // Security: Verify user has access to this salary's account
                if (\Illuminate\Support\Facades\Auth::check() &&
                    !\Illuminate\Support\Facades\Auth::user()->isSuperAdmin()) {
                    if ($salary->account_id !== \Illuminate\Support\Facades\Auth::user()->account_id) {
                        abort(403, 'Access denied');
                    }
                }

                return $salary;
            });

            Route::bind('sale', function ($value) {
                // Include soft-deleted sales (for viewing/restoring deleted sales)
                $sale = \App\Models\Sale::withTrashed()->where('sale_id', $value)->firstOrFail();

                // Security: Verify user has access to this sale's account
                if (\Illuminate\Support\Facades\Auth::check() &&
                    !\Illuminate\Support\Facades\Auth::user()->isSuperAdmin()) {
                    if ($sale->account_id !== \Illuminate\Support\Facades\Auth::user()->account_id) {
                        abort(403, 'Access denied');
                    }
                }

                return $sale;
            });

            Route::bind('warehouse_transfer', function ($value) {
                $transfer = \App\Models\WarehouseTransfer::where('transfer_id', $value)->firstOrFail();

                // Security: Verify user has access to this transfer's account
                if (\Illuminate\Support\Facades\Auth::check() &&
                    !\Illuminate\Support\Facades\Auth::user()->isSuperAdmin()) {
                    if ($transfer->account_id !== \Illuminate\Support\Facades\Auth::user()->account_id) {
                        abort(403, 'Access denied');
                    }
                }

                return $transfer;
            });

            Route::bind('printer_config', function ($value) {
                $config = \App\Models\PrinterConfig::where('config_id', $value)->firstOrFail();

                // Security: Verify user has access to this config's account
                if (\Illuminate\Support\Facades\Auth::check() &&
                    !\Illuminate\Support\Facades\Auth::user()->isSuperAdmin()) {
                    if ($config->account_id !== \Illuminate\Support\Facades\Auth::user()->account_id) {
                        abort(403, 'Access denied');
                    }
                }

                return $config;
            });

            Route::bind('receipt_template', function ($value) {
                $template = \App\Models\ReceiptTemplate::where('template_id', $value)->firstOrFail();

                // Security: Verify user has access to this template's account
                if (\Illuminate\Support\Facades\Auth::check() &&
                    !\Illuminate\Support\Facades\Auth::user()->isSuperAdmin()) {
                    if ($template->account_id !== \Illuminate\Support\Facades\Auth::user()->account_id) {
                        abort(403, 'Access denied');
                    }
                }

                return $template;
            });
        },
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Trust all proxies (Kubernetes ingress-nginx)
        // This allows Laravel to detect HTTPS properly when behind a reverse proxy
        $middleware->trustProxies(at: '*');

        $middleware->web(append: [
            \App\Http\Middleware\RequestLogging::class,  // Request logging with correlation ID for distributed tracing
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
            \App\Http\Middleware\SecurityHeaders::class,  // Security: Add security headers to all responses
            \App\Http\Middleware\SetLocale::class,  // Set application locale based on user preference
            \App\Http\Middleware\AddCsrfTokenToResponse::class,  // CRITICAL: Add CSRF token to all responses (fixes 419 errors)
            \App\Http\Middleware\RedirectAttendanceUser::class,  // Restrict attendance_user role to attendance routes only
        ]);

        $middleware->api(append: [
            \App\Http\Middleware\RequestLogging::class,  // Request logging for API
            \App\Http\Middleware\SetLocale::class,  // Set application locale for API requests
        ]);

        $middleware->alias([
            'account.access' => \App\Http\Middleware\EnsureAccountAccess::class,
            'superadmin' => \App\Http\Middleware\SuperAdminAccess::class,
            'branch.access' => \App\Http\Middleware\BranchAccess::class,
            'guest' => \App\Http\Middleware\RedirectIfAuthenticated::class,
            'kiosk.auth' => \App\Http\Middleware\KioskAuthMiddleware::class,
            'kiosk.rate_limit' => \App\Http\Middleware\KioskRateLimitMiddleware::class,
        ]);

        // API routes don't need CSRF protection (stateless)
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Log all exceptions with context
        $exceptions->reportable(function (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Exception occurred', [
                'exception' => get_class($e),
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);
        });

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
