<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Services\ThermalPrintingService;
use App\Models\ReceiptTemplate;

class UpdateReceiptTemplatesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Updates existing templates to new format
     */
    public function run(): void
    {
        $this->command->info('Updating receipt templates to new format...');

        $printingService = new ThermalPrintingService();

        // Get all templates
        $templates = ReceiptTemplate::all();

        foreach ($templates as $template) {
            // Get the new template content based on type
            $newContent = null;

            switch ($template->type) {
                case 'sale':
                    $newContent = $this->getUpdatedSaleTemplate();
                    break;
                case 'service':
                    $newContent = $this->getUpdatedServiceTemplate();
                    break;
                case 'customer_item':
                    $newContent = $this->getUpdatedCustomerItemTemplate();
                    break;
                case 'return':
                    $newContent = $this->getUpdatedReturnTemplate();
                    break;
                case 'payment':
                    $newContent = $this->getUpdatedPaymentTemplate();
                    break;
            }

            if ($newContent && $template->is_default) {
                // Only update default templates automatically
                $template->update(['template_content' => $newContent]);
                $this->command->info("  ✓ Updated {$template->type} template for account {$template->account_id}");
            }
        }

        $this->command->info('Receipt templates update completed!');
    }

    private function getUpdatedSaleTemplate(): string
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

    private function getUpdatedServiceTemplate(): string
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

    private function getUpdatedCustomerItemTemplate(): string
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

    private function getUpdatedReturnTemplate(): string
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

    private function getUpdatedPaymentTemplate(): string
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
