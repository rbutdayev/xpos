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

        // Only account_owner and admin can access fiscal printer configuration
        if (!Auth::user()->isAdmin()) {
            abort(403, 'Bu səhifəyə yalnız administrator daxil ola bilər.');
        }

        $accountId = Auth::user()->account_id;
        $config = FiscalPrinterConfig::where('account_id', $accountId)->first();

        // Get all providers from database (including inactive ones)
        $providersFromDb = \App\Models\FiscalPrinterProvider::orderBy('name')->get();

        $providers = $providersFromDb->map(function ($provider) {
            return [
                'id' => $provider->code,
                'name' => $provider->name,
                'port' => $provider->default_port,
                'api_base_path' => $provider->api_base_path,
                'fields' => $provider->required_fields ?? [],
                'description' => $provider->description,
                'is_active' => $provider->is_active,
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

        // Only account_owner and admin can update fiscal printer configuration
        if (!Auth::user()->isAdmin()) {
            abort(403, 'Bu əməliyyatı yalnız administrator edə bilər.');
        }

        $accountId = Auth::user()->account_id;

        // Get active provider codes or allow editing existing config with disabled provider
        $existingConfig = FiscalPrinterConfig::where('account_id', $accountId)->first();
        $activeProviders = \App\Models\FiscalPrinterProvider::where('is_active', true)
            ->pluck('code')
            ->toArray();

        // Allow existing provider even if disabled, so users can edit existing configs
        if ($existingConfig && !in_array($existingConfig->provider, $activeProviders)) {
            $activeProviders[] = $existingConfig->provider;
        }

        $allowedProviders = implode(',', $activeProviders);

        $rules = [
            'provider' => 'required|in:' . $allowedProviders,
            'name' => 'required|string|max:255',
            'ip_address' => 'required|ip',
            'port' => 'required|integer|min:1|max:65535',
            'api_path' => 'nullable|string|max:255',
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

        // Extract api_path and store in settings
        $apiPath = $validated['api_path'] ?? null;
        unset($validated['api_path']);

        if ($apiPath) {
            $validated['settings'] = ['api_path' => $apiPath];
        }

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

        // Only account_owner and admin can test fiscal printer connection
        if (!Auth::user()->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Bu əməliyyatı yalnız administrator edə bilər.',
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

        // Only account_owner and admin can delete fiscal printer configuration
        if (!Auth::user()->isAdmin()) {
            abort(403, 'Bu əməliyyatı yalnız administrator edə bilər.');
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

        // Only account_owner and admin can view fiscal printer logs
        if (!Auth::user()->isAdmin()) {
            abort(403, 'Bu səhifəyə yalnız administrator daxil ola bilər.');
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

    /**
     * Get shift status
     */
    public function getShiftStatus()
    {
        Gate::authorize('access-account-data');

        $accountId = Auth::user()->account_id;
        $fiscalService = app(FiscalPrinterService::class);

        $result = $fiscalService->getShiftStatus($accountId);

        return response()->json($result);
    }

    /**
     * Open shift
     */
    public function openShift()
    {
        Gate::authorize('manage-products');

        $accountId = Auth::user()->account_id;
        $fiscalService = app(FiscalPrinterService::class);

        $result = $fiscalService->openShift($accountId);

        return response()->json($result);
    }

    /**
     * Close shift (Z-Report)
     */
    public function closeShift()
    {
        Gate::authorize('manage-products');

        $accountId = Auth::user()->account_id;
        $fiscalService = app(FiscalPrinterService::class);

        $result = $fiscalService->closeShift($accountId);

        return response()->json($result);
    }

    /**
     * Print X-Report
     */
    public function printXReport()
    {
        Gate::authorize('manage-products');

        $accountId = Auth::user()->account_id;
        $fiscalService = app(FiscalPrinterService::class);

        $result = $fiscalService->printXReport($accountId);

        return response()->json($result);
    }
}
