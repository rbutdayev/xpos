<?php

namespace App\Services;

use App\Models\ReceiptTemplate;
use App\Models\ServiceRecord;
use App\Models\Sale;
use App\Models\CustomerItem;
use Illuminate\Support\Facades\Auth;

class ThermalPrintService
{
    /**
     * Generate print content for service record
     */
    public function generateServiceReceipt(ServiceRecord $serviceRecord, ?int $templateId = null): array
    {
        // Get template
        $template = $this->getTemplate('service', $templateId);
        if (!$template) {
            throw new \Exception('Çek şablonu tapılmadı.');
        }

        // Default thermal printer settings for standard PC printing
        $defaultSettings = (object)[
            'width_chars' => 32,
            'paper_size' => '80mm',
            'printer_type' => 'thermal'
        ];

        // Load relationships
        $serviceRecord->load(['customer', 'vehicle', 'employee', 'branch.account', 'serviceItems.product', 'serviceItems.service']);

        // Calculate totals
        $partsTotal = $serviceRecord->serviceItems->sum('total_price');
        $totalCost = $serviceRecord->labor_cost + $partsTotal;
        
        // For service records, we can extend this in the future to include actual tax/discount fields
        // For now, we'll make it work with current structure
        $subtotal = $totalCost;
        $taxAmount = $serviceRecord->tax_amount ?? 0; // If field exists in future
        $discountAmount = $serviceRecord->discount_amount ?? 0; // If field exists in future
        $finalTotal = $subtotal + $taxAmount - $discountAmount;

        // Prepare template variables - Account model has company fields directly
        $account = $serviceRecord->branch->account ?? null;
        $variables = [
            'company_name' => $account->company_name ?? '',
            'company_address' => $account->address ?? '',
            'company_phone' => $account->phone ?? '',
            'company_email' => $account->email ?? '',
            'company_website' => '', // Not available in Account model
            'tax_number' => $account->tax_number ?? '',
            'branch_name' => $serviceRecord->branch->name,
            'branch_address' => $serviceRecord->branch->address ?? '',
            'branch_phone' => $serviceRecord->branch->phone ?? '',
            'branch_email' => $serviceRecord->branch->email ?? '',
            'date' => $serviceRecord->service_date->format('d.m.Y'),
            'time' => $serviceRecord->created_at->format('H:i'),
            'receipt_number' => $serviceRecord->service_number,
            'customer_name' => $serviceRecord->customer->name,
            'customer_phone' => $serviceRecord->customer->phone ?? '',
            'customer_vehicle' => $serviceRecord->vehicle ? $serviceRecord->vehicle->brand . ' ' . $serviceRecord->vehicle->model : '',
            'vehicle_number' => $serviceRecord->vehicle ? $serviceRecord->vehicle->formatted_plate : '',
            'vehicle_plate' => $serviceRecord->vehicle ? $serviceRecord->vehicle->formatted_plate : '',
            'vehicle_brand' => $serviceRecord->vehicle ? $serviceRecord->vehicle->brand . ' ' . $serviceRecord->vehicle->model : '',
            'vehicle_mileage' => $serviceRecord->vehicle_mileage !== null ? number_format($serviceRecord->vehicle_mileage) . ' km' : '-',
            'service_description' => $serviceRecord->description,
            'employee_name' => $serviceRecord->employee->name ?? '',
            'labor_cost' => number_format($serviceRecord->labor_cost, 2) . ' AZN',
            'parts_cost' => number_format($partsTotal, 2) . ' AZN',
            'total_cost' => number_format($totalCost, 2) . ' AZN',
            // Sales-equivalent variables for service records
            'subtotal' => number_format($subtotal, 2) . ' AZN',
            'tax_amount' => number_format($taxAmount, 2) . ' AZN',
            'discount_amount' => number_format($discountAmount, 2) . ' AZN',
            'total' => number_format($finalTotal, 2) . ' AZN',
            'payment_method' => $serviceRecord->payment_method ?? 'Nağd', // Default payment method for services
            'divider' => str_repeat('-', $template->width_chars ?? $defaultSettings->width_chars),
        ];

        // Generate items list
        $itemsContent = '';
        foreach ($serviceRecord->serviceItems as $item) {
            $itemName = $item->product ? $item->product->name : 
                       ($item->service ? $item->service->name : $item->item_name);
            $itemsContent .= sprintf(
                "%-20s %3.1fx%6.2f %8.2f\n",
                mb_substr($itemName, 0, 20),
                $item->quantity,
                $item->unit_price,
                $item->total_price
            );
        }
        $variables['items'] = $itemsContent;

        // Replace variables in template
        $content = $this->replaceTemplateVariables($template->template_content, $variables);

        return [
            'success' => true,
            'content' => $content,
            'printer_config' => $defaultSettings,
            'template' => $template,
        ];
    }

    /**
     * Generate print content for sale
     */
    public function generateSaleReceipt(Sale $sale, ?int $templateId = null): array
    {
        // Get template
        $template = $this->getTemplate('sale', $templateId);
        if (!$template) {
            throw new \Exception('Satış çeki şablonu tapılmadı.');
        }

        // Default thermal printer settings for standard PC printing
        $defaultSettings = (object)[
            'width_chars' => 32,
            'paper_size' => '80mm',
            'printer_type' => 'thermal'
        ];

        // Load relationships
        $sale->load(['customer', 'branch.account', 'items.product', 'payments']);

        // Prepare template variables - Account model has company fields directly
        $account = $sale->branch->account ?? null;
        $variables = [
            'company_name' => $account->company_name ?? '',
            'company_address' => $account->address ?? '',
            'company_phone' => $account->phone ?? '',
            'company_email' => $account->email ?? '',
            'company_website' => '', // Not available in Account model
            'tax_number' => $account->tax_number ?? '',
            'branch_name' => $sale->branch->name,
            'branch_address' => $sale->branch->address ?? '',
            'branch_phone' => $sale->branch->phone ?? '',
            'branch_email' => $sale->branch->email ?? '',
            'date' => $sale->sale_date->format('d.m.Y'),
            'time' => $sale->created_at->format('H:i'),
            'receipt_number' => $sale->sale_number,
            'customer_name' => $sale->customer ? $sale->customer->name : 'Anonim Müştəri',
            'customer_phone' => $sale->customer ? $sale->customer->phone ?? '' : '',
            'subtotal' => number_format($sale->subtotal, 2) . ' AZN',
            'tax_amount' => number_format($sale->tax_amount, 2) . ' AZN',
            'discount_amount' => number_format($sale->discount_amount, 2) . ' AZN',
            'total' => number_format($sale->total, 2) . ' AZN',
            'payment_method' => $sale->payments->pluck('method')->map(function($method) {
                $labels = [
                    'nağd' => 'Nağd',
                    'kart' => 'Kart',
                    'köçürmə' => 'Köçürmə',
                ];
                return $labels[$method] ?? $method;
            })->implode(', '),
            'divider' => str_repeat('-', $template->width_chars ?? $defaultSettings->width_chars),
        ];

        // Generate items list
        $itemsContent = '';
        foreach ($sale->items as $item) {
            $itemsContent .= sprintf(
                "%-20s %3.1fx%6.2f %8.2f\n",
                mb_substr($item->product->name, 0, 20),
                $item->quantity,
                $item->unit_price,
                $item->total
            );
        }
        $variables['items'] = $itemsContent;

        // Replace variables in template
        $content = $this->replaceTemplateVariables($template->template_content, $variables);

        return [
            'success' => true,
            'content' => $content,
            'printer_config' => $defaultSettings,
            'template' => $template,
        ];
    }

    /**
     * Get receipt template
     */
    private function getTemplate(string $type, ?int $templateId = null): ?ReceiptTemplate
    {
        $query = ReceiptTemplate::where('account_id', Auth::user()->account_id)
            ->where('type', $type)
            ->where('is_active', true);

        if ($templateId) {
            return $query->where('template_id', $templateId)->first();
        }

        // Get default template or first available
        return $query->where('is_default', true)->first() ?: $query->first();
    }


    /**
     * Generate print content for customer item
     */
    public function generateCustomerItemReceipt(CustomerItem $item, ?int $templateId = null): array
    {
        // Get template
        $template = $this->getTemplate('customer_item', $templateId);
        if (!$template) {
            throw new \Exception('Müştəri məhsulu çek şablonu tapılmadı.');
        }

        // Default thermal printer settings
        $defaultSettings = (object)[
            'width_chars' => 32,
            'paper_size' => '80mm',
            'printer_type' => 'thermal'
        ];

        // Load relationships
        $item->load(['customer', 'tailorServices']);

        // Get service type configuration
        $serviceTypeLabels = [
            'tailor' => 'Dərzi',
            'phone_repair' => 'Telefon Təmiri',
            'electronics' => 'Elektronika Təmiri',
            'general' => 'Ümumi Xidmət',
        ];

        // Calculate totals from associated services
        $servicesTotal = $item->tailorServices->sum('total_cost');
        $servicesPaid = $item->tailorServices->sum('paid_amount');
        $servicesBalance = $servicesTotal - $servicesPaid;

        // Determine payment status
        $paymentStatus = 'Ödənilməyib';
        if ($servicesTotal > 0) {
            if ($servicesPaid >= $servicesTotal) {
                $paymentStatus = 'Ödənilib';
            } elseif ($servicesPaid > 0) {
                $paymentStatus = 'Qismən ödənilib';
            }
        }

        // Format measurements
        $measurementsText = '';
        if ($item->measurements && is_array($item->measurements)) {
            foreach ($item->measurements as $key => $value) {
                $measurementsText .= sprintf("%-15s: %s\n", mb_substr($key, 0, 15), $value);
            }
        }

        // Format services summary
        $servicesSummary = '';
        if ($item->tailorServices && $item->tailorServices->count() > 0) {
            foreach ($item->tailorServices as $service) {
                $servicesSummary .= sprintf(
                    "%-20s %8.2f ₼\n",
                    mb_substr($service->service_number, 0, 20),
                    $service->total_cost
                );
            }
        } else {
            $servicesSummary = "Hələ xidmət yoxdur\n";
        }

        // Prepare template variables
        $account = Auth::user()->account ?? null;
        $variables = [
            'company_name' => $account->company_name ?? '',
            'company_address' => $account->address ?? '',
            'company_phone' => $account->phone ?? '',
            'company_email' => $account->email ?? '',
            'company_website' => '',
            'tax_number' => $account->tax_number ?? '',
            'branch_name' => '', // Customer items don't have branch
            'branch_address' => '',
            'branch_phone' => '',
            'branch_email' => '',
            'date' => $item->received_date ? $item->received_date->format('d.m.Y') : now()->format('d.m.Y'),
            'time' => $item->created_at->format('H:i'),
            'receipt_number' => $item->reference_number ?? '',
            'customer_name' => $item->customer->name ?? '',
            'customer_phone' => $item->customer->phone ?? '',
            'item_type' => $item->item_type ?? '',
            'service_type' => $serviceTypeLabels[$item->service_type] ?? $item->service_type,
            'item_description' => $item->description ?? '',
            'item_color' => $item->color ?? '',
            'fabric_type' => $item->fabric_type ?? '',
            'reference_number' => $item->reference_number ?? '',
            'received_date' => $item->received_date ? $item->received_date->format('d.m.Y') : '',
            'status' => $item->status_text ?? '',
            'measurements' => $measurementsText,
            'services_count' => $item->tailorServices->count(),
            'services_summary' => $servicesSummary,
            'subtotal' => number_format($servicesTotal, 2) . ' ₼',
            'paid_amount' => number_format($servicesPaid, 2) . ' ₼',
            'balance' => number_format($servicesBalance, 2) . ' ₼',
            'payment_status' => $paymentStatus,
            'notes' => $item->notes ?? '',
            'divider' => str_repeat('-', $template->width_chars ?? $defaultSettings->width_chars),
        ];

        // Replace variables in template
        $content = $this->replaceTemplateVariables($template->template_content, $variables);

        return [
            'success' => true,
            'content' => $content,
            'printer_config' => $defaultSettings,
            'template' => $template,
        ];
    }

    /**
     * Replace template variables with actual values
     */
    private function replaceTemplateVariables(string $template, array $variables): string
    {
        $content = $template;

        foreach ($variables as $key => $value) {
            $content = str_replace("{{{$key}}}", $value, $content);
        }

        // Always add the standard footer
        $footer = "\n" . str_repeat('-', 32) . "\n"
                . str_repeat('-', 32) . "\n"
                . str_pad('ONYX xPos', 32, ' ', STR_PAD_BOTH) . "\n"
                . str_pad('www.onyx.az', 32, ' ', STR_PAD_BOTH) . "\n"
                . str_repeat('-', 32) . "\n"
                . str_repeat('-', 32);
        $content .= $footer;

        return $content;
    }

    /**
     * Send to thermal printer using standard PC printing
     */
    public function printContent(string $content, object $settings = null): array
    {
        // For standard PC printing, we return the content that can be printed
        // using browser's print functionality or sent to system default printer
        
        return [
            'success' => true,
            'message' => 'Qəbz hazırlandı - brauzerin çap funksiyasından istifadə edin',
            'content' => $content,
            'print_ready' => true,
        ];
    }

}