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
            'type' => 'required|in:sale,service,return,payment',
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
            'type' => 'required|in:sale,service,return,payment',
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
            'company_name' => $company->name ?? 'ONYX xPos',
            'company_address' => $company->address ?? 'Bakı şəhəri, Nizami rayonu',
            'company_phone' => $company->phone ?? '+994 12 123 45 67',
            'company_email' => $company->email ?? 'info@onyx.az',
            'company_website' => $company->website ?? 'www.onyx.az',
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

        foreach ($data as $key => $value) {
            if (is_array($value) && $key === 'items') {
                $itemsText = '';
                foreach ($value as $item) {
                    // Format: "item_name quantity"
                    // For services (unit = xidmət): "yag deyishme servisi 20"
                    // For products: "yag filteri 5" or "motor yagl 4.5"
                    
                    // Format quantity nicely - remove trailing zeros for decimals
                    $quantity = $item['quantity'];
                    if (is_float($quantity) && $quantity == intval($quantity)) {
                        $quantity = intval($quantity);
                    }
                    
                    $itemName = $item['name'];
                    $unitPrice = number_format($item['unit_price'], 2);
                    $total = number_format($item['total'], 2);
                    
                    // Clean format: "name quantity"
                    $itemsText .= sprintf("%-30s %s\n", $itemName . ' ' . $quantity, $total . ' AZN');
                }
                $content = str_replace('{{' . $key . '}}', trim($itemsText), $content);
            } else {
                $content = str_replace('{{' . $key . '}}', $value, $content);
            }
        }

        // Always add the standard footer
        $footer = "\n================================\n================================\nONYX xPos\nwww.xpos.az\n================================\n================================";
        $content .= $footer;

        return $content;
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
