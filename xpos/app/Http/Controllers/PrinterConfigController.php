<?php

namespace App\Http\Controllers;

use App\Models\PrinterConfig;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class PrinterConfigController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
        $this->middleware('account.access');
    }

    public function index(Request $request)
    {
        $query = PrinterConfig::with(['branch'])
            ->where('account_id', auth()->user()->account_id);

        if ($request->has('search') && !empty($request->search)) {
            $request->validate(['search' => 'required|string|max:255']);
            $validated = $request->validated();
            $searchTerm = $validated['search'];
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', '%' . $searchTerm . '%')
                  ->orWhere('printer_type', 'like', '%' . $searchTerm . '%')
                  ->orWhere('connection_type', 'like', '%' . $searchTerm . '%');
            });
        }

        if ($request->has('printer_type') && !empty($request->printer_type)) {
            $query->where('printer_type', $request->printer_type);
        }

        if ($request->has('is_active') && $request->is_active !== '') {
            $query->where('is_active', (bool) $request->is_active);
        }

        $printerConfigs = $query->orderBy('name')->paginate(15);

        $branches = Branch::where('account_id', auth()->user()->account_id)
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('PrinterConfigs/Index', [
            'printerConfigs' => $printerConfigs,
            'branches' => $branches,
            'filters' => $request->only(['search', 'printer_type', 'is_active']),
        ]);
    }

    public function create()
    {
        $branches = Branch::where('account_id', auth()->user()->account_id)
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('PrinterConfigs/Create', [
            'branches' => $branches,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'name' => 'required|string|max:255',
            'printer_type' => 'required|in:thermal,impact,laser,inkjet',
            'paper_size' => 'required|in:58mm,80mm,A4,letter',
            'connection_type' => 'required|string|max:50',
            'ip_address' => 'nullable|ip',
            'port' => 'nullable|integer|min:1|max:65535',
            'settings' => 'nullable|array',
            'is_default' => 'boolean',
            'is_active' => 'boolean',
        ]);

        // Verify branch belongs to account
        $branch = Branch::where('id', $validated['branch_id'])
            ->where('account_id', auth()->user()->account_id)
            ->firstOrFail();

        // If setting as default, remove default from others in the same branch
        if ($validated['is_default'] ?? false) {
            PrinterConfig::where('account_id', auth()->user()->account_id)
                ->where('branch_id', $validated['branch_id'])
                ->update(['is_default' => false]);
        }

        $printerConfig = PrinterConfig::create([
            'account_id' => auth()->user()->account_id,
            ...$validated,
        ]);

        return redirect()->route('printer-configs.index')
            ->with('success', __('app.printer_config_created'));
    }

    public function show(PrinterConfig $printer_config)
    {
        Gate::authorize('view', $printer_config);

        $printer_config->load(['branch']);

        return Inertia::render('PrinterConfigs/Show', [
            'printerConfig' => $printer_config,
        ]);
    }

    public function edit(PrinterConfig $printer_config)
    {
        Gate::authorize('update', $printer_config);

        $printer_config->load(['branch']);

        $branches = Branch::where('account_id', auth()->user()->account_id)
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('PrinterConfigs/Edit', [
            'printerConfig' => $printer_config,
            'branches' => $branches,
        ]);
    }

    public function update(Request $request, PrinterConfig $printer_config)
    {
        Gate::authorize('update', $printer_config);

        $validated = $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'name' => 'required|string|max:255',
            'printer_type' => 'required|in:thermal,impact,laser,inkjet',
            'paper_size' => 'required|in:58mm,80mm,A4,letter',
            'connection_type' => 'required|string|max:50',
            'ip_address' => 'nullable|ip',
            'port' => 'nullable|integer|min:1|max:65535',
            'settings' => 'nullable|array',
            'is_default' => 'boolean',
            'is_active' => 'boolean',
        ]);

        // Verify branch belongs to account
        $branch = Branch::where('id', $validated['branch_id'])
            ->where('account_id', auth()->user()->account_id)
            ->firstOrFail();

        // If setting as default, remove default from others in the same branch
        if ($validated['is_default'] ?? false) {
            PrinterConfig::where('account_id', auth()->user()->account_id)
                ->where('branch_id', $validated['branch_id'])
                ->where('config_id', '!=', $printer_config->config_id)
                ->update(['is_default' => false]);
        }

        $printer_config->update($validated);

        return redirect()->route('printer-configs.index')
            ->with('success', __('app.printer_config_updated'));
    }

    public function destroy(PrinterConfig $printer_config)
    {
        Gate::authorize('delete', $printer_config);

        $printer_config->delete();

        return redirect()->route('printer-configs.index')
            ->with('success', __('app.printer_config_deleted'));
    }

    public function testPrint(Request $request, PrinterConfig $printer_config)
    {
        Gate::authorize('view', $printer_config);

        // This would integrate with actual printer hardware
        // For now, return a test ESC/POS command string
        $testContent = "Test Print\n";
        $testContent .= "Printer: {$printer_config->name}\n";
        $testContent .= "Type: {$printer_config->printer_type}\n";
        $testContent .= "Paper: {$printer_config->paper_size}\n";
        $testContent .= str_repeat("-", 32) . "\n";
        $testContent .= "Test completed successfully!\n";

        return response()->json([
            'success' => true,
            'message' => __('app.test_print_sent'),
            'content' => $testContent,
        ]);
    }
}
