<?php

namespace App\Http\Controllers;

use App\Models\ReceiptTemplate;
use App\Models\Company;
use App\Models\Branch;
use App\Services\ThermalPrintingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class ReceiptTemplateController extends Controller
{
    protected $printingService;

    public function __construct(ThermalPrintingService $printingService)
    {
        $this->middleware('auth');
        $this->middleware('account.access');
        $this->printingService = $printingService;
    }

    public function index(Request $request)
    {
        $validated = $request->validate([
            'search' => 'nullable|string|max:255',
            'type' => 'nullable|string|max:50',
            'is_active' => 'nullable|boolean',
        ]);
        $query = ReceiptTemplate::where('account_id', auth()->user()->account_id);

        if ($request->has('search') && !empty($validated['search'])) {
            $search = $validated['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                  ->orWhere('type', 'like', '%' . $search . '%');
            });
        }

        if ($request->has('type') && !empty($validated['type'])) {
            $query->where('type', $validated['type']);
        }

        if ($request->has('is_active') && $request->is_active !== '') {
            $query->where('is_active', (bool) $validated['is_active']);
        }

        $templates = $query->orderBy('name')->paginate(15);

        return Inertia::render('ReceiptTemplates/Index', [
            'receiptTemplates' => $templates,
            'filters' => $request->only(['search', 'type', 'is_active']),
            'templateTypes' => [
                'sale' => 'Satış Qəbzi',
                'service' => 'Xidmət Qəbzi',
                'customer_item' => 'Müştəri Məhsulu Qəbzi',
                'return' => 'Qaytarma Qəbzi',
                'payment' => 'Ödəniş Qəbzi',
            ],
        ]);
    }

    public function create()
    {
        return Inertia::render('ReceiptTemplates/Create', [
            'templateTypes' => [
                'sale' => 'Satış Qəbzi',
                'service' => 'Xidmət Qəbzi',
                'customer_item' => 'Müştəri Məhsulu Qəbzi',
                'return' => 'Qaytarma Qəbzi',
                'payment' => 'Ödəniş Qəbzi',
            ],
            'paperSizes' => [
                '58mm' => '58mm',
                '80mm' => '80mm',
                'A4' => 'A4',
                'letter' => 'Letter',
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:sale,service,customer_item,return,payment',
            'template_content' => 'required|string',
            'paper_size' => 'required|in:58mm,80mm,A4,letter',
            'width_chars' => 'required|integer|min:20|max:100',
            'is_default' => 'boolean',
            'is_active' => 'boolean',
            'notes' => 'nullable|string',
        ]);

        // If setting as default, remove default from others of the same type
        if ($validated['is_default'] ?? false) {
            ReceiptTemplate::where('account_id', auth()->user()->account_id)
                ->where('type', $validated['type'])
                ->update(['is_default' => false]);
        }

        $template = ReceiptTemplate::create([
            'account_id' => auth()->user()->account_id,
            ...$validated,
        ]);

        return redirect()->route('receipt-templates.index')
            ->with('success', __('app.receipt_template_created'));
    }

    public function show(ReceiptTemplate $receiptTemplate)
    {
        Gate::authorize('view', $receiptTemplate);

        return Inertia::render('ReceiptTemplates/Show', [
            'receiptTemplate' => $receiptTemplate,
            'availableVariables' => $receiptTemplate->getAvailableVariables(),
            'systemSettings' => $this->getTemplateVariables(),
        ]);
    }

    public function edit(ReceiptTemplate $receiptTemplate)
    {
        Gate::authorize('update', $receiptTemplate);

        return Inertia::render('ReceiptTemplates/Edit', [
            'receiptTemplate' => $receiptTemplate,
            'templateTypes' => [
                'sale' => 'Satış Qəbzi',
                'service' => 'Xidmət Qəbzi',
                'customer_item' => 'Müştəri Məhsulu Qəbzi',
                'return' => 'Qaytarma Qəbzi',
                'payment' => 'Ödəniş Qəbzi',
            ],
            'paperSizes' => [
                '58mm' => '58mm',
                '80mm' => '80mm',
                'A4' => 'A4',
                'letter' => 'Letter',
            ],
            'availableVariables' => $receiptTemplate->getAvailableVariables(),
        ]);
    }

    public function update(Request $request, ReceiptTemplate $receiptTemplate)
    {
        Gate::authorize('update', $receiptTemplate);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:sale,service,customer_item,return,payment',
            'template_content' => 'required|string',
            'paper_size' => 'required|in:58mm,80mm,A4,letter',
            'width_chars' => 'required|integer|min:20|max:100',
            'is_default' => 'boolean',
            'is_active' => 'boolean',
            'notes' => 'nullable|string',
        ]);

        // If setting as default, remove default from others of the same type
        if ($validated['is_default'] ?? false) {
            ReceiptTemplate::where('account_id', auth()->user()->account_id)
                ->where('type', $validated['type'])
                ->where('template_id', '!=', $receiptTemplate->template_id)
                ->update(['is_default' => false]);
        }

        $receiptTemplate->update($validated);

        return redirect()->route('receipt-templates.index')
            ->with('success', __('app.receipt_template_updated'));
    }

    public function destroy(ReceiptTemplate $receiptTemplate)
    {
        Gate::authorize('delete', $receiptTemplate);

        $receiptTemplate->delete();

        return redirect()->route('receipt-templates.index')
            ->with('success', __('app.receipt_template_deleted'));
    }

    public function bulkDelete(Request $request)
    {
        Gate::authorize('delete-account-data');

        $validated = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'required|integer',
        ]);

        $deletedCount = 0;
        $failedTemplates = [];

        \DB::beginTransaction();

        try {
            $templates = ReceiptTemplate::where('account_id', auth()->user()->account_id)
                ->whereIn('template_id', $validated['ids'])
                ->get();

            foreach ($templates as $template) {
                // Do not delete default templates
                if ($template->is_default) {
                    $failedTemplates[] = $template->name . ' (əsas şablon)';
                    continue;
                }

                // Do not delete active templates that are currently in use
                if ($template->is_active) {
                    // Check if this is the only active template of this type
                    $activeCount = ReceiptTemplate::where('account_id', auth()->user()->account_id)
                        ->where('type', $template->type)
                        ->where('is_active', true)
                        ->count();

                    if ($activeCount <= 1) {
                        $failedTemplates[] = $template->name . ' (tək aktiv şablon)';
                        continue;
                    }
                }

                $template->delete();
                $deletedCount++;
            }

            \DB::commit();

            if ($deletedCount > 0 && count($failedTemplates) > 0) {
                return redirect()->route('receipt-templates.index')
                    ->with('success', "{$deletedCount} şablon silindi. " . count($failedTemplates) . " şablon silinə bilmədi: " . implode(', ', $failedTemplates));
            } elseif ($deletedCount > 0) {
                return redirect()->route('receipt-templates.index')
                    ->with('success', "{$deletedCount} şablon uğurla silindi.");
            } else {
                return redirect()->route('receipt-templates.index')
                    ->with('error', 'Heç bir şablon silinə bilmədi: ' . implode(', ', $failedTemplates));
            }

        } catch (\Exception $e) {
            \DB::rollBack();
            return redirect()->route('receipt-templates.index')
                ->with('error', 'Xəta baş verdi: ' . $e->getMessage());
        }
    }

    public function preview(Request $request, ReceiptTemplate $receiptTemplate)
    {
        Gate::authorize('view', $receiptTemplate);

        // Generate sample data for preview
        $sampleData = $this->getSampleData($receiptTemplate->type);
        
        // Render template with sample data
        $content = $this->renderTemplatePreview($receiptTemplate, $sampleData);

        return response()->json([
            'success' => true,
            'content' => $content,
            'sampleData' => $sampleData,
        ]);
    }

    public function duplicate(ReceiptTemplate $receiptTemplate)
    {
        Gate::authorize('view', $receiptTemplate);

        $newTemplate = $receiptTemplate->replicate();
        $newTemplate->name = $receiptTemplate->name . ' (Kopya)';
        $newTemplate->is_default = false;
        $newTemplate->save();

        return redirect()->route('receipt-templates.edit', $newTemplate)
            ->with('success', __('app.receipt_template_duplicated'));
    }

    public function createDefault(Request $request)
    {
        $type = $request->input('type', 'sale');
        
        $template = $this->printingService->createDefaultTemplate(
            auth()->user()->account_id,
            $type
        );

        return redirect()->route('receipt-templates.edit', $template)
            ->with('success', __('app.default_template_created'));
    }

    private function getSampleData(string $type): array
    {
        $user = auth()->user();
        $company = Company::where('account_id', $user->account_id)->first();
        $branch = Branch::where('account_id', $user->account_id)->where('is_main', true)->first() 
                 ?? Branch::where('account_id', $user->account_id)->first();
        
        $baseData = [
            'company_name' => $company->name ?? 'xPOS',
            'company_address' => $company->address ?? 'Bakı şəhəri, Nizami rayonu',
            'company_phone' => $company->phone ?? '+994 12 123 45 67',
            'company_email' => $company->email ?? 'info@xpos.az',
            'company_website' => $company->website ?? 'www.xpos.az',
            'tax_number' => $company->tax_number ?? '1234567890',
            'branch_name' => $branch->name ?? 'Mərkəzi Filial',
            'branch_address' => $branch->address ?? 'Nizami küçəsi 123',
            'branch_phone' => $branch->phone ?? '+994 12 123 45 67',
            'branch_email' => $branch->email ?? 'filial@onyx.az',
            'date' => now()->format('d.m.Y'),
            'time' => now()->format('H:i'),
            'receipt_number' => 'QBZ-' . rand(1000, 9999),
            'divider' => '================================',
        ];

        switch ($type) {
            case 'sale':
                return array_merge($baseData, [
                    'customer_name' => 'Əli Məmmədov',
                    'customer_phone' => '+994 50 123 45 67',
                    'items' => [
                        ['name' => 'Motor yağı 5W-30', 'quantity' => 1, 'unit_price' => 25.00, 'total' => 25.00, 'unit' => 'L'],
                        ['name' => 'Hava filtiri', 'quantity' => 1, 'unit_price' => 15.00, 'total' => 15.00, 'unit' => 'ədəd'],
                        ['name' => 'Əyləc yağı', 'quantity' => 0.5, 'unit_price' => 12.00, 'total' => 6.00, 'unit' => 'L'],
                    ],
                    'subtotal' => '46.00',
                    'tax_amount' => '8.28',
                    'discount_amount' => '0.00',
                    'total' => '54.28',
                    'payment_method' => 'Nağd',
                ]);

            case 'service':
                return array_merge($baseData, [
                    'customer_name' => 'Vəli Həsənov',
                    'customer_vehicle' => 'Toyota Camry 2020',
                    'vehicle_number' => '99-AA-999',
                    'vehicle_mileage' => '85,000 km',
                    'vehicle_plate' => '99-AA-999',
                    'vehicle_brand' => 'Toyota Camry',
                    'service_description' => 'Fren təmiri',
                    'employee_name' => 'İsmayıl Qasımov',
                    'items' => [
                        ['name' => 'Yağ dəyişmə xidməti', 'quantity' => 1, 'unit_price' => 20.00, 'total' => 20.00, 'unit' => 'xidmət'],
                        ['name' => 'Motor yağı 5W-30', 'quantity' => 4, 'unit_price' => 6.25, 'total' => 25.00, 'unit' => 'L'],
                        ['name' => 'Yağ filtiri', 'quantity' => 1, 'unit_price' => 8.00, 'total' => 8.00, 'unit' => 'ədəd'],
                    ],
                    'labor_cost' => '20.00',
                    'parts_cost' => '33.00',
                    'total_cost' => '53.00',
                ]);

            default:
                return $baseData;
        }
    }

    private function renderTemplatePreview(ReceiptTemplate $template, array $data): string
    {
        $content = $template->template_content;
        $width = $template->width_chars ?? 48;

        foreach ($data as $key => $value) {
            if (is_array($value) && $key === 'items') {
                $itemsText = '';
                foreach ($value as $item) {
                    $name = $item['name'];
                    $qty = $item['quantity'];
                    $price = $item['unit_price'];
                    $total = $item['total'];

                    // Format quantity nicely - remove trailing zeros for decimals
                    if (is_float($qty) && $qty == intval($qty)) {
                        $qty = intval($qty);
                    }

                    // Format: Name on one line, quantity x price = total on next line
                    // For better readability on thermal printers
                    if (strlen($name) > $width - 2) {
                        // Name is too long, wrap it
                        $itemsText .= substr($name, 0, $width - 2) . "\n";
                    } else {
                        $itemsText .= $name . "\n";
                    }

                    // Quantity x Price aligned right with total
                    $qtyLine = "  {$qty} x {$price}";
                    $totalStr = "{$total} AZN";
                    $spaces = max(1, $width - strlen($qtyLine) - strlen($totalStr));
                    $itemsText .= $qtyLine . str_repeat(' ', $spaces) . $totalStr . "\n";
                }
                $content = str_replace('{{' . $key . '}}', rtrim($itemsText), $content);
            } else {
                $content = str_replace('{{' . $key . '}}', $value, $content);
            }
        }

        // Process formatting commands
        $content = $this->formatPreviewContent($content, $width);

        // Always add the standard footer
        $footer = "\n================================\n================================\nxPOS\nwww.xpos.az\n================================\n================================";
        $content .= $footer;

        return $content;
    }

    /**
     * Format thermal printer commands for web preview
     */
    private function formatPreviewContent(string $content, int $width): string
    {
        $lines = explode("\n", $content);
        $formatted = [];

        foreach ($lines as $line) {
            // Replace {line} with separator
            if (strpos($line, '{line}') !== false) {
                $formatted[] = str_repeat('=', $width);
                continue;
            }

            // Process formatting tags
            $processedLine = $line;

            // Remove bold tags (can't show in plain text preview)
            $processedLine = str_replace(['{bold}', '{/bold}'], '', $processedLine);
            $processedLine = str_replace(['{double}', '{/double}'], '', $processedLine);

            // Handle alignment
            if (strpos($processedLine, '{center}') !== false) {
                $text = trim(str_replace('{center}', '', $processedLine));
                $spaces = max(0, floor(($width - mb_strlen($text)) / 2));
                $formatted[] = str_repeat(' ', $spaces) . $text;
            } elseif (strpos($processedLine, '{right}') !== false) {
                $text = trim(str_replace('{right}', '', $processedLine));
                $spaces = max(0, $width - mb_strlen($text));
                $formatted[] = str_repeat(' ', $spaces) . $text;
            } elseif (strpos($processedLine, '{left}') !== false) {
                $formatted[] = str_replace('{left}', '', $processedLine);
            } else {
                // No alignment tag, keep as is
                if (trim($processedLine) !== '') {
                    $formatted[] = $processedLine;
                } else {
                    $formatted[] = '';
                }
            }
        }

        return implode("\n", $formatted);
    }

    /**
     * Get template variables from company settings
     */
    private function getTemplateVariables(): array
    {
        $user = auth()->user();
        $company = Company::where('account_id', $user->account_id)->first();
        $branch = Branch::where('account_id', $user->account_id)->where('is_main', true)->first() 
                 ?? Branch::where('account_id', $user->account_id)->first();

        $variables = [
            'company_name' => $company->name ?? 'Şirkət Adı',
            'company_address' => $company->address ?? 'Şirkət Ünvanı',
            'company_phone' => $company->phone ?? 'Şirkət Telefonu',
            'company_email' => $company->email ?? 'Şirkət Email',
            'company_website' => $company->website ?? 'Şirkət Veb Saytı',
            'tax_number' => $company->tax_number ?? 'Vergi Nömrəsi',
            'branch_name' => $branch->name ?? 'Filial Adı',
            'branch_address' => $branch->address ?? 'Filial Ünvanı',
            'branch_phone' => $branch->phone ?? 'Filial Telefonu',
            'branch_email' => $branch->email ?? 'Filial Email',
            'divider' => '================================',
        ];

        return $variables;
    }
}
