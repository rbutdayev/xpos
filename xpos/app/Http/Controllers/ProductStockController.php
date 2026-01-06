<?php

namespace App\Http\Controllers;

use App\Models\ProductStock;
use App\Models\Product;
use App\Models\Warehouse;
use App\Models\ImportJob;
use App\Exports\StockTemplateExport;
use App\Jobs\ProcessStockImport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use Maatwebsite\Excel\HeadingRowImport;

class ProductStockController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
        $this->middleware('account.access');
    }

    public function index(Request $request)
    {
        Gate::authorize('access-account-data');

        $validated = $request->validate([
            'search' => 'nullable|string|max:255',
            'warehouse_id' => 'nullable|integer|exists:warehouses,id',
            'low_stock' => 'nullable|boolean',
            'per_page' => 'nullable|integer|min:10|max:100',
        ]);
        $search = $validated['search'] ?? null;
        $warehouseId = $validated['warehouse_id'] ?? null;
        $lowStock = $validated['low_stock'] ?? null;
        $perPage = $validated['per_page'] ?? 25;

        $stocks = ProductStock::with(['product', 'warehouse'])
            ->whereHas('product', function ($query) {
                $query->where('account_id', auth()->user()->account_id);
            })
            ->when($search, function ($query, $search) {
                $query->whereHas('product', function ($q) use ($search) {
                    $q->where('name', 'like', '%' . $search . '%')
                      ->orWhere('sku', 'like', '%' . $search . '%');
                });
            })
            ->when($warehouseId, function ($query, $warehouseId) {
                $query->where('warehouse_id', $warehouseId);
            })
            ->when($lowStock, function ($query) {
                $query->whereRaw('quantity <= min_level');
            })
            ->latest()
            ->paginate($perPage);

        $warehouses = Warehouse::where('account_id', auth()->user()->account_id)->get();

        return Inertia::render('ProductStock/Index', [
            'stocks' => $stocks,
            'warehouses' => $warehouses,
            'filters' => $request->only(['search', 'warehouse_id', 'low_stock']),
        ]);
    }

    public function edit(ProductStock $productStock)
    {
        Gate::authorize('access-account-data');

        // Verify the product stock belongs to the user's account
        if ($productStock->product->account_id !== auth()->user()->account_id) {
            abort(403);
        }

        return Inertia::render('ProductStock/Edit', [
            'productStock' => $productStock->load(['product', 'warehouse']),
        ]);
    }

    public function update(Request $request, ProductStock $productStock)
    {
        Gate::authorize('access-account-data');

        $request->validate([
            'min_level' => 'required|numeric|min:0',
            'max_level' => 'nullable|numeric|min:0',
            'reorder_point' => 'nullable|numeric|min:0',
            'reorder_quantity' => 'nullable|numeric|min:0',
            'location' => 'nullable|string|max:255',
        ]);

        $productStock->update($request->only([
            'min_level',
            'max_level', 
            'reorder_point',
            'reorder_quantity',
            'location'
        ]));

        return redirect()->route('product-stock.index')
            ->with('success', 'Stok məlumatları yeniləndi');
    }

    public function search(Request $request)
    {
        Gate::authorize('access-account-data');

        $validated = $request->validate([
            'q' => 'required|string|max:255',
        ]);

        $search = $validated['q'];

        $stocks = ProductStock::with(['product', 'warehouse'])
            ->whereHas('product', function ($query) use ($search) {
                $query->where('account_id', auth()->user()->account_id)
                      ->where(function ($q) use ($search) {
                          $q->where('name', 'like', '%' . $search . '%')
                            ->orWhere('sku', 'like', '%' . $search . '%');
                      });
            })
            ->limit(10)
            ->get();

        return response()->json($stocks);
    }

    /**
     * Download Excel template for bulk stock import
     */
    public function downloadTemplate()
    {
        Gate::authorize('manage-inventory');

        ini_set('memory_limit', '512M');
        ini_set('max_execution_time', '120');

        try {
            return Excel::download(
                new StockTemplateExport(),
                'stock_import_template_' . date('Y-m-d') . '.xlsx'
            );
        } catch (\Exception $e) {
            \Log::error('Stock template download error: ' . $e->getMessage(), [
                'user_id' => Auth::id(),
                'exception' => $e->getTraceAsString()
            ]);

            return back()->withErrors([
                'error' => 'Şablon yükləməsi zamanı xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.',
            ]);
        }
    }

    /**
     * Import stock from Excel file (queued for background processing)
     */
    public function import(Request $request)
    {
        Gate::authorize('manage-inventory');

        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv|max:20480', // 20MB max
        ]);

        try {
            $file = $request->file('file');
            $fileName = $file->getClientOriginalName();

            // Store file temporarily
            $filePath = $file->store('imports', 'local');

            // Count total rows in the file (for progress tracking)
            // Use Excel::toArray to read all rows
            $data = Excel::toArray([], $filePath, 'local');
            $totalRows = 0;
            if (!empty($data) && !empty($data[0])) {
                // -1 for header row
                $totalRows = count($data[0]) - 1;
            }

            // Create import job record
            $importJob = ImportJob::create([
                'account_id' => Auth::user()->account_id,
                'user_id' => Auth::id(),
                'type' => 'stock',
                'status' => 'pending',
                'file_name' => $fileName,
                'file_path' => $filePath,
                'total_rows' => $totalRows,
                'processed_rows' => 0,
                'successful_rows' => 0,
                'failed_rows' => 0,
                'errors' => [],
            ]);

            // Dispatch the job to the queue
            ProcessStockImport::dispatch($importJob);

            return response()->json([
                'success' => true,
                'message' => 'Qalıq importu başladıldı. Proses arxa planda davam edir.',
                'import_job_id' => $importJob->id,
            ]);

        } catch (\Exception $e) {
            \Log::error('Stock import upload error: ' . $e->getMessage(), [
                'user_id' => Auth::id(),
                'file_name' => $fileName ?? 'N/A',
                'exception' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Fayl yüklənərkən xəta baş verdi: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get import job status
     */
    public function importStatus($importJobId)
    {
        Gate::authorize('access-account-data');

        $importJob = ImportJob::where('id', $importJobId)
            ->where('account_id', Auth::user()->account_id)
            ->firstOrFail();

        return response()->json([
            'id' => $importJob->id,
            'status' => $importJob->status,
            'file_name' => $importJob->file_name,
            'total_rows' => $importJob->total_rows,
            'processed_rows' => $importJob->processed_rows,
            'successful_rows' => $importJob->successful_rows,
            'failed_rows' => $importJob->failed_rows,
            'progress_percentage' => $importJob->progress_percentage,
            'errors' => $importJob->errors ?? [],
            'started_at' => $importJob->started_at?->toISOString(),
            'completed_at' => $importJob->completed_at?->toISOString(),
        ]);
    }
}
