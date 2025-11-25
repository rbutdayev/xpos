<?php

namespace App\Http\Controllers;

use App\Models\FiscalPrinterConfig;
use App\Services\FiscalPrinterService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class FiscalPrinterConfigController extends Controller
{
    /**
     * Display fiscal printer configuration page
     */
    public function index()
    {
        Gate::authorize('access-account-data');

        // Only account_owner can access fiscal printer configuration
        if (!Auth::user()->hasRole('account_owner')) {
            abort(403, 'Bu səhifəyə yalnız account owner daxil ola bilər.');
        }

        $accountId = Auth::user()->account_id;
        $config = FiscalPrinterConfig::where('account_id', $accountId)->first();

        // Get providers from database
        $providersFromDb = \App\Models\FiscalPrinterProvider::where('is_active', true)
            ->orderBy('name')
            ->get();

        $providers = $providersFromDb->map(function ($provider) {
            return [
                'id' => $provider->code,
                'name' => $provider->name,
                'port' => $provider->default_port,
                'fields' => $provider->required_fields ?? [],
                'description' => $provider->description,
            ];
        })->toArray();

        return Inertia::render('Settings/FiscalPrinter/Index', [
            'config' => $config,
            'providers' => $providers,
            'account' => Auth::user()->account,
        ]);
    }

    /**
     * Store or update fiscal printer configuration
     */
    public function store(Request $request)
    {
        Gate::authorize('edit-account-data');

        // Only account_owner can update fiscal printer configuration
        if (!Auth::user()->hasRole('account_owner')) {
            abort(403, 'Bu əməliyyatı yalnız account owner edə bilər.');
        }

        $accountId = Auth::user()->account_id;

        $rules = [
            'provider' => 'required|in:nba,caspos,oneclick,omnitech,azsmart',
            'name' => 'required|string|max:255',
            'ip_address' => 'required|ip',
            'port' => 'required|integer|min:1|max:65535',
            'default_tax_name' => 'required|string|max:50',
            'default_tax_rate' => 'required|numeric|min:0|max:100',
            'auto_send' => 'boolean',
            'show_in_terminal' => 'boolean',
            'is_active' => 'boolean',
        ];

        // Add provider-specific validation
        switch ($request->provider) {
            case 'nba':
                $rules['username'] = 'required|string|max:255';
                $rules['password'] = 'required|string|max:255';
                $rules['bank_port'] = 'nullable|integer|min:1|max:65535';
                break;
            case 'caspos':
                $rules['username'] = 'required|string|max:255';
                $rules['password'] = 'required|string|max:255';
                $rules['device_serial'] = 'required|string|max:255';
                break;
            case 'oneclick':
                $rules['security_key'] = 'required|string|max:255';
                break;
            case 'azsmart':
                $rules['merchant_id'] = 'required|string|max:255';
                break;
        }

        $validated = $request->validate($rules);
        $validated['account_id'] = $accountId;

        // Update or create configuration
        $config = FiscalPrinterConfig::updateOrCreate(
            ['account_id' => $accountId],
            $validated
        );

        // Update account fiscal_printer_enabled
        Auth::user()->account->update([
            'fiscal_printer_enabled' => $validated['is_active'] ?? true,
        ]);

        return redirect()->route('fiscal-printer.index')
            ->with('success', 'Fiskal printer konfiqurasiyası uğurla yadda saxlanıldı');
    }

    /**
     * Test connection to fiscal printer
     */
    public function testConnection()
    {
        Gate::authorize('access-account-data');

        // Only account_owner can test fiscal printer connection
        if (!Auth::user()->hasRole('account_owner')) {
            return response()->json([
                'success' => false,
                'message' => 'Bu əməliyyatı yalnız account owner edə bilər.',
            ], 403);
        }

        $accountId = Auth::user()->account_id;
        $fiscalService = app(FiscalPrinterService::class);

        $result = $fiscalService->testConnection($accountId);

        if ($result['success']) {
            return response()->json([
                'success' => true,
                'message' => $result['message'],
                'provider' => $result['provider'] ?? null,
            ]);
        } else {
            return response()->json([
                'success' => false,
                'message' => $result['error'],
            ], 400);
        }
    }

    /**
     * Delete fiscal printer configuration
     */
    public function destroy()
    {
        Gate::authorize('delete-account-data');

        // Only account_owner can delete fiscal printer configuration
        if (!Auth::user()->hasRole('account_owner')) {
            abort(403, 'Bu əməliyyatı yalnız account owner edə bilər.');
        }

        $accountId = Auth::user()->account_id;

        FiscalPrinterConfig::where('account_id', $accountId)->delete();

        // Disable fiscal printer for account
        Auth::user()->account->update([
            'fiscal_printer_enabled' => false,
        ]);

        return redirect()->route('fiscal-printer.index')
            ->with('success', 'Fiskal printer konfiqurasiyası silindi');
    }

    /**
     * Get fiscal printer statistics and logs
     */
    public function logs()
    {
        Gate::authorize('access-account-data');

        // Only account_owner can view fiscal printer logs
        if (!Auth::user()->hasRole('account_owner')) {
            abort(403, 'Bu səhifəyə yalnız account owner daxil ola bilər.');
        }

        $accountId = Auth::user()->account_id;
        $fiscalService = app(FiscalPrinterService::class);

        $logs = $fiscalService->getLogs($accountId, 100);
        $statistics = $fiscalService->getStatistics($accountId);

        return Inertia::render('Settings/FiscalPrinter/Logs', [
            'logs' => $logs,
            'statistics' => $statistics,
        ]);
    }
}
