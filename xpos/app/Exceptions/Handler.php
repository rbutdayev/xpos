<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * The list of the inputs that are never flashed to the session on validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });
    }

    /**
     * Render an exception into an HTTP response.
     */
    public function render($request, Throwable $e)
    {
        // Show detailed database errors in development (when APP_DEBUG=true)
        if (config('app.debug')) {
            if ($e instanceof \Illuminate\Database\QueryException) {
                if ($request->expectsJson() || $request->is('api/*')) {
                    return response()->json([
                        'message' => 'Database Error',
                        'error' => $e->getMessage(),
                        'sql' => $e->getSql() ?? 'N/A',
                        'bindings' => $e->getBindings() ?? [],
                    ], 500);
                }

                return back()->withErrors([
                    'error' => 'Database Error: ' . $e->getMessage()
                ]);
            }
        } else {
            // In production, hide detailed SQL errors
            if ($e instanceof \Illuminate\Database\QueryException) {
                return back()->withErrors([
                    'error' => 'Məlumat bazası xətası baş verdi. Zəhmət olmasa daha sonra yenidən cəhd edin.'
                ]);
            }
        }

        return parent::render($request, $e);
    }
}