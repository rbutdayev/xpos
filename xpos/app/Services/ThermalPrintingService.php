<?php

namespace App\Services;

use App\Models\PrinterConfig;
use App\Models\ReceiptTemplate;
use App\Models\Sale;
use App\Models\ServiceRecord;
use App\Models\Company;
use App\Models\Branch;

class ThermalPrintingService
{
    private const ESC = "\x1B";
    private const GS = "\x1D";
    private const LF = "\x0A";
    private const CR = "\x0D";

    public function printSaleReceipt(Sale $sale, ?int $printerConfigId = null): string
    {
        $printer = $this->getPrinterConfig($sale->account_id, $sale->branch_id, $printerConfigId);
        $template = $this->getReceiptTemplate($sale->account_id, 'sale');
        
        $data = $this->prepareSaleData($sale);
        $content = $this->renderTemplate($template, $data);
        
        return $this->formatForThermalPrinter($content, $printer);
    }

    public function printServiceReceipt(ServiceRecord $serviceRecord, ?int $printerConfigId = null): string
    {
        $printer = $this->getPrinterConfig($serviceRecord->account_id, $serviceRecord->customer->account_id, $printerConfigId);
        $template = $this->getReceiptTemplate($serviceRecord->account_id, 'service');
        
        $data = $this->prepareServiceData($serviceRecord);
        $content = $this->renderTemplate($template, $data);
        
        return $this->formatForThermalPrinter($content, $printer);
    }

    private function getPrinterConfig(int $accountId, int $branchId, ?int $configId = null): PrinterConfig
    {
        if ($configId) {
            return PrinterConfig::where('account_id', $accountId)
                ->where('config_id', $configId)
                ->firstOrFail();
        }

        return PrinterConfig::where('account_id', $accountId)
            ->where('branch_id', $branchId)
            ->where('is_default', true)
            ->where('is_active', true)
            ->firstOrFail();
    }

    private function getReceiptTemplate(int $accountId, string $type): ReceiptTemplate
    {
        return ReceiptTemplate::where('account_id', $accountId)
            ->where('type', $type)
            ->where('is_default', true)
            ->where('is_active', true)
            ->firstOrFail();
    }

    private function prepareSaleData(Sale $sale): array
    {
        $sale->load(['customer', 'branch', 'branch.company', 'saleItems.product', 'payments']);

        // Get payment methods and convert enums to labels
        $paymentMethods = $sale->payments->map(function ($payment) {
            return $payment->method instanceof \App\Enums\PaymentMethod
                ? $payment->method->labelAz()
                : $payment->method;
        })->join(', ');

        return [
            'company_name' => $sale->branch->company->name,
            'company_address' => $sale->branch->company->address,
            'company_phone' => $sale->branch->company->phone ?? '',
            'branch_name' => $sale->branch->name,
            'branch_address' => $sale->branch->address,
            'date' => $sale->sale_date->format('d.m.Y'),
            'time' => $sale->sale_date->format('H:i'),
            'receipt_number' => $sale->sale_number,
            'customer_name' => $sale->customer->name ?? 'Kassadan satış',
            'customer_phone' => $sale->customer->phone ?? '',
            'items' => $sale->saleItems->map(function ($item) {
                return [
                    'name' => $item->product->name,
                    'quantity' => $item->quantity,
                    'unit_price' => number_format($item->unit_price, 2),
                    'total' => number_format($item->total, 2),
                ];
            })->toArray(),
            'subtotal' => number_format($sale->subtotal, 2),
            'tax_amount' => number_format($sale->tax_amount, 2),
            'discount_amount' => number_format($sale->discount_amount, 2),
            'total' => number_format($sale->total, 2),
            'payment_method' => $paymentMethods,
        ];
    }

    private function prepareServiceData(ServiceRecord $serviceRecord): array
    {
        $serviceRecord->load(['customer', 'vehicle', 'employee', 'serviceItems.product', 'account.company', 'account.branches']);
        
        // Get company and branch data dynamically
        $company = $serviceRecord->account->company ?? null;
        $branch = $serviceRecord->account->branches->where('is_main', true)->first() 
                 ?? $serviceRecord->account->branches->first() ?? null;

        return [
            'company_name' => $company->name ?? 'xPos',
            'company_address' => $company->address ?? '',
            'company_phone' => $company->phone ?? '',
            'company_email' => $company->email ?? '',
            'company_website' => $company->website ?? '',
            'tax_number' => $company->tax_number ?? '',
            'branch_name' => $branch->name ?? '',
            'branch_address' => $branch->address ?? '',
            'branch_phone' => $branch->phone ?? '',
            'branch_email' => $branch->email ?? '',
            'date' => $serviceRecord->service_date->format('d.m.Y'),
            'time' => $serviceRecord->service_date->format('H:i'),
            'receipt_number' => $serviceRecord->service_number,
            'customer_name' => $serviceRecord->customer->name,
            'vehicle_plate' => $serviceRecord->vehicle->plate_number,
            'vehicle_brand' => $serviceRecord->vehicle->brand . ' ' . $serviceRecord->vehicle->model,
            'service_description' => $serviceRecord->description,
            'employee_name' => $serviceRecord->employee->name,
            'labor_cost' => number_format($serviceRecord->labor_cost, 2),
            'parts_cost' => number_format($serviceRecord->serviceItems->sum('total'), 2),
            'total_cost' => number_format($serviceRecord->total_cost, 2),
        ];
    }

    private function renderTemplate(ReceiptTemplate $template, array $data): string
    {
        $content = $template->template_content;

        foreach ($data as $key => $value) {
            if (is_array($value)) {
                if ($key === 'items') {
                    $itemsText = '';
                    $width = $template->width_chars ?? 48;

                    foreach ($value as $item) {
                        $name = $item['name'];
                        $qty = $item['quantity'];
                        $price = $item['unit_price'];
                        $total = $item['total'];

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
                }
            } else {
                $content = str_replace('{{' . $key . '}}', $value, $content);
            }
        }

        // Always add the standard footer
        $footer = "\n{line}\n{line}\n{center}xPOS\n{center}www.xpos.az\n{line}\n{line}";
        $content .= $footer;

        return $content;
    }

    private function formatForThermalPrinter(string $content, PrinterConfig $printer): string
    {
        $escPos = '';

        // Initialize printer
        $escPos .= self::ESC . '@'; // Initialize

        // Set character set to Turkish/Azerbaijani
        $escPos .= self::ESC . 't' . chr(18); // Turkish character set

        // Paper width settings
        if ($printer->paper_size === '58mm') {
            $escPos .= self::GS . 'W' . chr(384 & 0xFF) . chr((384 >> 8) & 0xFF); // 58mm width
        } else {
            $escPos .= self::GS . 'W' . chr(576 & 0xFF) . chr((576 >> 8) & 0xFF); // 80mm width
        }

        // Process content line by line
        $lines = explode("\n", $content);
        foreach ($lines as $line) {
            $line = trim($line);
            
            if (empty($line)) {
                $escPos .= self::LF;
                continue;
            }

            // Check for formatting commands
            if (strpos($line, '{center}') !== false) {
                $escPos .= self::ESC . 'a1'; // Center align
                $line = str_replace('{center}', '', $line);
            } elseif (strpos($line, '{left}') !== false) {
                $escPos .= self::ESC . 'a0'; // Left align
                $line = str_replace('{left}', '', $line);
            } elseif (strpos($line, '{right}') !== false) {
                $escPos .= self::ESC . 'a2'; // Right align
                $line = str_replace('{right}', '', $line);
            }

            if (strpos($line, '{bold}') !== false) {
                $escPos .= self::ESC . 'E1'; // Bold on
                $line = str_replace('{bold}', '', $line);
            }

            if (strpos($line, '{/bold}') !== false) {
                $escPos .= self::ESC . 'E0'; // Bold off
                $line = str_replace('{/bold}', '', $line);
            }

            if (strpos($line, '{double}') !== false) {
                $escPos .= self::GS . '!' . chr(0x11); // Double width and height
                $line = str_replace('{double}', '', $line);
            }

            if (strpos($line, '{/double}') !== false) {
                $escPos .= self::GS . '!' . chr(0x00); // Normal size
                $line = str_replace('{/double}', '', $line);
            }

            if (strpos($line, '{line}') !== false) {
                $lineChar = $printer->paper_size === '58mm' ? str_repeat('-', 32) : str_repeat('-', 48);
                $escPos .= $lineChar . self::LF;
                continue;
            }

            $escPos .= $line . self::LF;
        }

        // Cut paper
        $escPos .= self::GS . 'V1'; // Partial cut

        // Reset alignment
        $escPos .= self::ESC . 'a0';

        return $escPos;
    }

    public function generateQRCode(string $data): string
    {
        // QR Code ESC/POS commands
        $qr = '';
        
        // QR Code model
        $qr .= self::GS . '(k' . chr(4) . chr(0) . chr(49) . chr(65) . chr(50) . chr(0);
        
        // QR Code size
        $qr .= self::GS . '(k' . chr(3) . chr(0) . chr(49) . chr(67) . chr(8);
        
        // QR Code error correction
        $qr .= self::GS . '(k' . chr(3) . chr(0) . chr(49) . chr(69) . chr(48);
        
        // Store data
        $len = strlen($data) + 3;
        $qr .= self::GS . '(k' . chr($len & 0xFF) . chr(($len >> 8) & 0xFF) . chr(49) . chr(80) . chr(48) . $data;
        
        // Print QR Code
        $qr .= self::GS . '(k' . chr(3) . chr(0) . chr(49) . chr(81) . chr(48);
        
        return $qr;
    }

    public function createDefaultTemplate(int $accountId, string $type): ReceiptTemplate
    {
        $templates = [
            'sale' => $this->getDefaultSaleTemplate(),
            'service' => $this->getDefaultServiceTemplate(),
            'customer_item' => $this->getDefaultCustomerItemTemplate(),
            'return' => $this->getDefaultReturnTemplate(),
            'payment' => $this->getDefaultPaymentTemplate(),
        ];

        $typeNames = [
            'sale' => 'Satış',
            'service' => 'Xidmət',
            'customer_item' => 'Müştəri Məhsulu',
            'return' => 'Qaytarma',
            'payment' => 'Ödəniş',
        ];

        return ReceiptTemplate::create([
            'account_id' => $accountId,
            'name' => 'Standart ' . ($typeNames[$type] ?? ucfirst($type)) . ' Şablonu',
            'type' => $type,
            'template_content' => $templates[$type] ?? $templates['sale'],
            'paper_size' => '80mm',
            'width_chars' => 48,
            'is_default' => true,
            'is_active' => true,
        ]);
    }

    private function getDefaultSaleTemplate(): string
    {
        return "{center}{bold}{{company_name}}{/bold}
{center}{{company_address}}
{center}Tel: {{company_phone}}
{line}
{center}{bold}SATIŞ QƏBZİ{/bold}
{line}
Tarix: {{date}} {{time}}
Qəbz No: {{receipt_number}}
Müştəri: {{customer_name}}
{line}
{{items}}
{line}
{right}Ara cəm: {{subtotal}} AZN
{right}Endirim: {{discount_amount}} AZN
{right}Vergi: {{tax_amount}} AZN
{line}
{right}{bold}CƏMİ: {{total}} AZN{/bold}
{line}
Ödəniş: {{payment_method}}
{line}
{center}Təşəkkür edirik!
{center}Xoş gələsiniz!";
    }

    private function getDefaultServiceTemplate(): string
    {
        return "{center}{bold}{{company_name}}{/bold}
{center}XİDMƏT QƏBZİ
{line}
Tarix: {{date}} {{time}}
Qəbz No: {{receipt_number}}
{line}
Müştəri: {{customer_name}}
Avtomobil: {{vehicle_brand}}
Nömrə: {{vehicle_plate}}
{line}
Xidmət: {{service_description}}
Texnik: {{employee_name}}
{line}
{right}İş haqqı: {{labor_cost}} AZN
{right}Hissələr: {{parts_cost}} AZN
{right}{bold}CƏMİ: {{total_cost}} AZN{/bold}
{line}
{center}Zəmanət müddəti: 30 gün
{center}Təşəkkür edirik!";
    }

    private function getDefaultCustomerItemTemplate(): string
    {
        return "{center}{bold}{{company_name}}{/bold}
{center}{{company_address}}
{center}Tel: {{company_phone}}
{line}
{center}{bold}MÜŞTƏRİ MƏHSULU QƏBZİ{/bold}
{line}
Tarix: {{date}} {{time}}
Referans No: {{reference_number}}
{line}
Müştəri: {{customer_name}}
Tel: {{customer_phone}}
{line}
Məhsul növü: {{item_type}}
Xidmət növü: {{service_type}}
Təsvir: {{item_description}}
Rəng: {{item_color}}
Parça: {{fabric_type}}
{line}
Qəbul tarixi: {{received_date}}
Status: {{status}}
{line}
{{measurements}}
{line}
Xidmətlər:
{{services_summary}}
{line}
{right}Ümumi məbləğ: {{subtotal}} AZN
{right}Ödənilmiş: {{paid_amount}} AZN
{right}{bold}Qalıq: {{balance}} AZN{/bold}
{line}
Ödəniş statusu: {{payment_status}}
{line}
Qeydlər: {{notes}}
{line}
{center}Təşəkkür edirik!";
    }

    private function getDefaultReturnTemplate(): string
    {
        return "{center}{bold}{{company_name}}{/bold}
{center}{{company_address}}
{center}Tel: {{company_phone}}
{line}
{center}{bold}QAYTARMA QƏBZİ{/bold}
{line}
Tarix: {{date}} {{time}}
Qaytarma No: {{receipt_number}}
Orijinal satış: {{original_sale_number}}
{line}
Müştəri: {{customer_name}}
Tel: {{customer_phone}}
{line}
Qaytarılan məhsullar:
{{items}}
{line}
{right}Ara cəm: {{subtotal}} AZN
{right}Vergi: {{tax_amount}} AZN
{right}{bold}CƏMİ QAYTARMA: {{total}} AZN{/bold}
{line}
Qaytarma səbəbi: {{return_reason}}
Qaytarma metodu: {{return_method}}
{line}
{center}Qeyd: Bu qaytarma qəbzidir
{center}Təşəkkür edirik!";
    }

    private function getDefaultPaymentTemplate(): string
    {
        return "{center}{bold}{{company_name}}{/bold}
{center}{{company_address}}
{center}Tel: {{company_phone}}
{line}
{center}{bold}ÖDƏNİŞ QƏBZİ{/bold}
{line}
Tarix: {{date}} {{time}}
Qəbz No: {{receipt_number}}
{line}
Müştəri: {{customer_name}}
Tel: {{customer_phone}}
{line}
Ödəniş növü: {{payment_type}}
Ödəniş metodu: {{payment_method}}
{line}
{right}Ödəniş məbləği: {{payment_amount}} AZN
{right}Əvvəlki borc: {{previous_balance}} AZN
{right}{bold}Yeni balans: {{new_balance}} AZN{/bold}
{line}
Qeyd: {{notes}}
{line}
{center}Təşəkkür edirik!
{center}Xoş gələsiniz!";
    }
}