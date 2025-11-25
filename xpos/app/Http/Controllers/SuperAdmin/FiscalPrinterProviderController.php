<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\FiscalPrinterProvider;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FiscalPrinterProviderController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
        $this->middleware('superadmin');
    }

    /**
     * Display list of fiscal printer providers
     */
    public function index()
    {
        $providers = FiscalPrinterProvider::orderBy('name')->get();

        return Inertia::render('SuperAdmin/FiscalPrinterProviders/Index', [
            'providers' => $providers,
        ]);
    }

    /**
     * Show form to edit provider
     */
    public function edit($id)
    {
        $provider = FiscalPrinterProvider::findOrFail($id);

        return Inertia::render('SuperAdmin/FiscalPrinterProviders/Edit', [
            'provider' => $provider,
        ]);
    }

    /**
     * Update provider configuration
     */
    public function update(Request $request, $id)
    {
        $provider = FiscalPrinterProvider::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'default_port' => 'required|integer|min:1|max:65535',
            'api_base_path' => 'required|string|max:255',
            'print_endpoint' => 'required|string|max:255',
            'status_endpoint' => 'required|string|max:255',
            'required_fields' => 'nullable|array',
            'endpoint_config' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        $provider->update($validated);

        return redirect()->route('superadmin.fiscal-printer-providers.index')
            ->with('success', 'Provider konfiqurasiyası yeniləndi');
    }

    /**
     * Create new provider
     */
    public function create()
    {
        return Inertia::render('SuperAdmin/FiscalPrinterProviders/Create');
    }

    /**
     * Store new provider
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:fiscal_printer_providers,code',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'default_port' => 'required|integer|min:1|max:65535',
            'api_base_path' => 'required|string|max:255',
            'print_endpoint' => 'required|string|max:255',
            'status_endpoint' => 'required|string|max:255',
            'required_fields' => 'nullable|array',
            'endpoint_config' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        FiscalPrinterProvider::create($validated);

        return redirect()->route('superadmin.fiscal-printer-providers.index')
            ->with('success', 'Yeni provider əlavə edildi');
    }

    /**
     * Delete provider
     */
    public function destroy($id)
    {
        $provider = FiscalPrinterProvider::findOrFail($id);

        // Check if any configs are using this provider
        $configsCount = \App\Models\FiscalPrinterConfig::where('provider', $provider->code)->count();

        if ($configsCount > 0) {
            return redirect()->route('superadmin.fiscal-printer-providers.index')
                ->with('error', "Bu provider {$configsCount} konfiqurasiyada istifadə olunur. Əvvəlcə konfiqurasiyaları silin.");
        }

        $provider->delete();

        return redirect()->route('superadmin.fiscal-printer-providers.index')
            ->with('success', 'Provider silindi');
    }
}
