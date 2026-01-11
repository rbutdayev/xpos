<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Models\ModulePricingSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ModulePricingController
{
    /**
     * Display all module pricing settings
     */
    public function index()
    {
        Gate::authorize('manage-knowledge-base'); // Reusing existing super admin gate

        // Auto-sync modules from config file
        $this->syncModulesFromConfig();

        $pricing = ModulePricingSetting::with('lastUpdatedBy:id,name')
            ->orderBy('module_name')
            ->get();

        $configModules = config('modules.modules', []);

        return Inertia::render('SuperAdmin/ModulePricing', [
            'modules' => $pricing->map(function($p) use ($configModules) {
                $moduleConfig = $configModules[$p->module_name] ?? [];
                return [
                    'id' => $p->id,
                    'name' => $moduleConfig['name'] ?? $p->module_name,
                    'price' => (float) $p->monthly_price,
                    'is_paid' => $p->monthly_price > 0,
                    'updated_at' => $p->updated_at?->format('Y-m-d H:i'),
                ];
            }),
        ]);
    }

    /**
     * Sync modules from config file to database
     * This ensures any new modules added to config are automatically created
     */
    protected function syncModulesFromConfig()
    {
        $configModules = config('modules.modules', []);

        foreach ($configModules as $moduleKey => $moduleData) {
            ModulePricingSetting::firstOrCreate(
                ['module_name' => $moduleKey],
                [
                    'monthly_price' => $moduleData['default_price'] ?? 0.00,
                    'is_active' => true,
                    'description' => $moduleData['description'] ?? null,
                ]
            );
        }
    }

    /**
     * Update a single module pricing setting
     */
    public function update(Request $request, ModulePricingSetting $pricing)
    {
        Gate::authorize('manage-knowledge-base'); // Reusing existing super admin gate

        $validated = $request->validate([
            'monthly_price' => 'required|numeric|min:0',
            'is_active' => 'boolean',
            'description' => 'nullable|string',
        ]);

        $pricing->update([
            'monthly_price' => $validated['monthly_price'],
            'is_active' => $validated['is_active'] ?? true,
            'description' => $validated['description'] ?? null,
            'last_updated_by' => Auth::id(),
        ]);

        return redirect()->back()->with('success', 'Modul qiyməti yeniləndi');
    }

    /**
     * Bulk update multiple module pricing settings
     */
    public function bulkUpdate(Request $request)
    {
        Gate::authorize('manage-knowledge-base'); // Reusing existing super admin gate

        $validated = $request->validate([
            'updates' => 'required|array',
            'updates.*.id' => 'required|exists:module_pricing_settings,id',
            'updates.*.monthly_price' => 'required|numeric|min:0',
            'updates.*.is_active' => 'boolean',
            'updates.*.description' => 'nullable|string',
        ]);

        $updatedCount = 0;

        foreach ($validated['updates'] as $update) {
            $pricing = ModulePricingSetting::find($update['id']);
            if ($pricing) {
                $pricing->update([
                    'monthly_price' => $update['monthly_price'],
                    'is_active' => $update['is_active'] ?? true,
                    'description' => $update['description'] ?? null,
                    'last_updated_by' => Auth::id(),
                ]);
                $updatedCount++;
            }
        }

        return redirect()->back()->with('success', "{$updatedCount} modul qiyməti yeniləndi");
    }
}
