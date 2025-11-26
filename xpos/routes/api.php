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
    Route::post('/job/{job}/fail', [\App\Http\Controllers\Api\FiscalPrinterBridgeController::class, 'failJob'])->name('job.fail');
});

// Job Status API (for frontend polling)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/jobs/sale/{saleId}/status', [\App\Http\Controllers\Api\JobStatusController::class, 'getSaleJobStatus'])->name('jobs.sale.status');
});
