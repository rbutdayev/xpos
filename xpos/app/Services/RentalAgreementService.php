<?php

namespace App\Services;

use App\Models\Rental;
use App\Models\RentalAgreement;
use App\Models\RentalAgreementTemplate;
use Illuminate\Support\Facades\Storage;
use Barryvdh\DomPDF\Facade\Pdf;

class RentalAgreementService
{
    /**
     * Create agreement from template
     */
    public function createAgreement(Rental $rental, array $data): RentalAgreement
    {
        // Get template
        $template = null;
        if (isset($data['template_id'])) {
            $template = RentalAgreementTemplate::where('account_id', $rental->account_id)
                ->findOrFail($data['template_id']);
        } else {
            // Use default template for category
            $category = $data['rental_category'] ?? 'general';
            $template = RentalAgreementTemplate::getDefaultForCategory($rental->account_id, $category);

            if (!$template) {
                throw new \Exception("No default template found for category: {$category}");
            }
        }

        // Get language preference
        $language = $data['language'] ?? 'az';

        // Create agreement
        $agreement = RentalAgreement::create([
            'account_id' => $rental->account_id,
            'rental_id' => $rental->id,
            'template_id' => $template->id,
            'rental_category' => $data['rental_category'] ?? $template->rental_category,
            'terms_and_conditions' => $template->getTerms($language),
            'damage_liability_terms' => $template->getDamageTerms($language),
            'condition_checklist' => $data['condition_checklist'] ?? $template->getConditionChecklist($language),
            'condition_photos' => $data['condition_photos'] ?? null,
            'status' => 'draft',
            'notes' => $data['notes'] ?? null,
        ]);

        return $agreement;
    }

    /**
     * Sign agreement by customer
     */
    public function signByCustomer(RentalAgreement $agreement, array $data): RentalAgreement
    {
        $agreement->signByCustomer(
            $data['signature'],
            $data['ip'] ?? request()->ip(),
            $data['user_agent'] ?? request()->userAgent()
        );

        return $agreement->fresh();
    }

    /**
     * Sign agreement by staff
     */
    public function signByStaff(RentalAgreement $agreement, int $userId, string $signature): RentalAgreement
    {
        $agreement->signByStaff($userId, $signature);

        return $agreement->fresh();
    }

    /**
     * Process return and compare conditions
     */
    public function processReturn(RentalAgreement $agreement, array $data): RentalAgreement
    {
        // Save return condition checklist
        $agreement->condition_checklist_return = $data['condition_checklist_return'];

        // Compare conditions and assess damage
        $differences = $agreement->compareConditions();
        $damageAssessment = [];
        $totalDamageFee = 0;

        foreach ($differences as $key => $diff) {
            if ($diff['deteriorated']) {
                $itemDamage = [
                    'item' => $key,
                    'rental_condition' => $diff['at_rental'],
                    'return_condition' => $diff['at_return'],
                    'fee' => $data['damage_fees'][$key] ?? 0,
                ];
                $damageAssessment[] = $itemDamage;
                $totalDamageFee += $itemDamage['fee'];
            }
        }

        // Save damage assessment
        if (!empty($damageAssessment)) {
            $agreement->damage_assessment = $damageAssessment;
            $agreement->damage_fee_calculated = $totalDamageFee;
        }

        $agreement->status = 'completed';
        $agreement->save();

        return $agreement->fresh();
    }

    /**
     * Waive damage fee
     */
    public function waiveDamageFee(RentalAgreement $agreement, string $reason): RentalAgreement
    {
        $agreement->waiveDamageFee($reason);

        return $agreement->fresh();
    }

    /**
     * Generate PDF for agreement and upload to Azure
     */
    public function generatePdf(RentalAgreement $agreement): string
    {
        $rental = $agreement->rental()->with(['customer', 'items.product', 'branch', 'user'])->first();

        $data = [
            'agreement' => $agreement,
            'rental' => $rental,
            'customer' => $rental->customer,
            'items' => $rental->items,
            'branch' => $rental->branch,
        ];

        // Generate PDF
        $pdf = Pdf::loadView('pdf.rental-agreement', $data)
            ->setPaper('a4')
            ->setOption('margin-top', 10)
            ->setOption('margin-right', 10)
            ->setOption('margin-bottom', 10)
            ->setOption('margin-left', 10);

        // Generate filename
        $fileName = "rental_agreement_{$rental->rental_number}_" . now()->format('YmdHis') . ".pdf";

        // Azure path: rentals/{account_id}/{rental_id}/agreement/
        $path = "rentals/{$rental->account_id}/{$rental->id}/agreement/{$fileName}";

        // Upload to Azure (documents disk)
        Storage::disk('documents')->put($path, $pdf->output());

        // Update agreement with PDF path
        $agreement->setPdfPath($path);

        return $path;
    }

    /**
     * Get PDF download URL
     */
    public function getPdfUrl(RentalAgreement $agreement): ?string
    {
        if (!$agreement->hasPdf()) {
            return null;
        }

        return Storage::url($agreement->pdf_path);
    }

    /**
     * Void agreement
     */
    public function voidAgreement(RentalAgreement $agreement, string $reason): RentalAgreement
    {
        $agreement->markAsVoided($reason);

        return $agreement->fresh();
    }

    /**
     * Get default checklist for category
     */
    public function getDefaultChecklistForCategory(string $category): array
    {
        $checklists = [
            'clothing' => [
                ['id' => 'clean', 'label_az' => 'Təmizdir', 'label_en' => 'Clean', 'type' => 'boolean', 'required' => true],
                ['id' => 'no_stains', 'label_az' => 'Ləkə yoxdur', 'label_en' => 'No stains', 'type' => 'boolean', 'required' => true],
                ['id' => 'no_tears', 'label_az' => 'Cırıq yoxdur', 'label_en' => 'No tears', 'type' => 'boolean', 'required' => true],
                ['id' => 'buttons_intact', 'label_az' => 'Düymələr yerindədir', 'label_en' => 'Buttons intact', 'type' => 'boolean', 'required' => true],
                ['id' => 'zipper_works', 'label_az' => 'Fermuar işləyir', 'label_en' => 'Zipper works', 'type' => 'boolean', 'required' => false],
                ['id' => 'no_odor', 'label_az' => 'Pis qoxu yoxdur', 'label_en' => 'No odor', 'type' => 'boolean', 'required' => true],
                ['id' => 'accessories_complete', 'label_az' => 'Aksesuarlar tamdır (kəmər, qalstuk və s.)', 'label_en' => 'Accessories complete', 'type' => 'boolean', 'required' => false],
                ['id' => 'condition_notes', 'label_az' => 'Əlavə qeydlər', 'label_en' => 'Additional notes', 'type' => 'text', 'required' => false],
            ],
            'electronics' => [
                ['id' => 'powers_on', 'label_az' => 'Yandırılır', 'label_en' => 'Powers on', 'type' => 'boolean', 'required' => true, 'critical' => true],
                ['id' => 'screen_condition', 'label_az' => 'Ekran vəziyyəti', 'label_en' => 'Screen condition', 'type' => 'select', 'options_az' => ['Mükəmməl', 'Kiçik cızıqlar', 'Çat var', 'Zədələnib'], 'options_en' => ['Perfect', 'Minor scratches', 'Cracked', 'Damaged'], 'required' => true],
                ['id' => 'no_scratches', 'label_az' => 'Cızıq/xırda zədə yoxdur', 'label_en' => 'No scratches/dents', 'type' => 'boolean', 'required' => true],
                ['id' => 'battery_health', 'label_az' => 'Batareya sağlamlığı (%)', 'label_en' => 'Battery health (%)', 'type' => 'number', 'min' => 0, 'max' => 100, 'required' => false],
                ['id' => 'all_buttons_work', 'label_az' => 'Bütün düymələr işləyir', 'label_en' => 'All buttons work', 'type' => 'boolean', 'required' => true],
                ['id' => 'ports_functional', 'label_az' => 'Portlar işləyir (USB, audio və s.)', 'label_en' => 'Ports functional', 'type' => 'boolean', 'required' => true],
                ['id' => 'accessories_included', 'label_az' => 'Aksesuarlar (adapter, kabel və s.)', 'label_en' => 'Accessories included', 'type' => 'checklist', 'items_az' => ['Adapter', 'Kabel', 'Qulaqlıq', 'Qab', 'Təlimat'], 'items_en' => ['Charger', 'Cable', 'Headphones', 'Case', 'Manual'], 'required' => true],
                ['id' => 'imei_serial', 'label_az' => 'IMEI/Serial nömrə', 'label_en' => 'IMEI/Serial number', 'type' => 'text', 'required' => true],
                ['id' => 'condition_notes', 'label_az' => 'Əlavə qeydlər', 'label_en' => 'Additional notes', 'type' => 'text', 'required' => false],
            ],
            'home_appliances' => [
                ['id' => 'powers_on', 'label_az' => 'İşə düşür', 'label_en' => 'Powers on', 'type' => 'boolean', 'required' => true, 'critical' => true],
                ['id' => 'screen_condition', 'label_az' => 'Ekran vəziyyəti (TV üçün)', 'label_en' => 'Screen condition (for TV)', 'type' => 'select', 'options_az' => ['Mükəmməl', 'Kiçik cızıqlar', 'Piksel problemi', 'Çat var'], 'options_en' => ['Perfect', 'Minor scratches', 'Pixel issues', 'Cracked'], 'required' => false],
                ['id' => 'no_physical_damage', 'label_az' => 'Fiziki zərər yoxdur', 'label_en' => 'No physical damage', 'type' => 'boolean', 'required' => true],
                ['id' => 'all_functions_work', 'label_az' => 'Bütün funksiyalar işləyir', 'label_en' => 'All functions work', 'type' => 'boolean', 'required' => true],
                ['id' => 'remote_included', 'label_az' => 'Pult daxildir (TV üçün)', 'label_en' => 'Remote included', 'type' => 'boolean', 'required' => false],
                ['id' => 'cables_complete', 'label_az' => 'Bütün kabellər tamdır', 'label_en' => 'All cables complete', 'type' => 'boolean', 'required' => true],
                ['id' => 'clean_exterior', 'label_az' => 'Xarici görünüş təmizdir', 'label_en' => 'Clean exterior', 'type' => 'boolean', 'required' => true],
                ['id' => 'serial_model', 'label_az' => 'Serial/Model nömrə', 'label_en' => 'Serial/Model number', 'type' => 'text', 'required' => true],
                ['id' => 'condition_notes', 'label_az' => 'Əlavə qeydlər', 'label_en' => 'Additional notes', 'type' => 'text', 'required' => false],
            ],
            'jewelry' => [
                ['id' => 'no_damage', 'label_az' => 'Zədə yoxdur', 'label_en' => 'No damage', 'type' => 'boolean', 'required' => true, 'critical' => true],
                ['id' => 'stones_intact', 'label_az' => 'Daşlar yerindədir', 'label_en' => 'Stones intact', 'type' => 'boolean', 'required' => true],
                ['id' => 'clasp_works', 'label_az' => 'Bağlama işləyir', 'label_en' => 'Clasp works', 'type' => 'boolean', 'required' => true],
                ['id' => 'no_tarnish', 'label_az' => 'Tutqunlaşma yoxdur', 'label_en' => 'No tarnish', 'type' => 'boolean', 'required' => true],
                ['id' => 'weight', 'label_az' => 'Çəki (qram)', 'label_en' => 'Weight (grams)', 'type' => 'number', 'required' => true],
                ['id' => 'metal_type', 'label_az' => 'Metal növü', 'label_en' => 'Metal type', 'type' => 'select', 'options_az' => ['Qızıl', 'Gümüş', 'Platin', 'Digər'], 'options_en' => ['Gold', 'Silver', 'Platinum', 'Other'], 'required' => true],
                ['id' => 'certificate_included', 'label_az' => 'Sertifikat daxildir', 'label_en' => 'Certificate included', 'type' => 'boolean', 'required' => false],
                ['id' => 'box_included', 'label_az' => 'Qutu daxildir', 'label_en' => 'Box included', 'type' => 'boolean', 'required' => false],
                ['id' => 'condition_notes', 'label_az' => 'Əlavə qeydlər', 'label_en' => 'Additional notes', 'type' => 'text', 'required' => false],
            ],
            'general' => [
                ['id' => 'overall_condition', 'label_az' => 'Ümumi vəziyyət', 'label_en' => 'Overall condition', 'type' => 'select', 'options_az' => ['Mükəmməl', 'Yaxşı', 'Orta', 'Pis'], 'options_en' => ['Perfect', 'Good', 'Fair', 'Poor'], 'required' => true],
                ['id' => 'damage_present', 'label_az' => 'Zədə var', 'label_en' => 'Damage present', 'type' => 'boolean', 'required' => true],
            ],
        ];

        return $checklists[$category] ?? $checklists['general'];
    }

    /**
     * Create default templates for account
     */
    public function createDefaultTemplates(int $accountId): array
    {
        $templates = [];

        // Clothing template
        $templates[] = $this->createClothingTemplate($accountId);

        // Electronics template
        $templates[] = $this->createElectronicsTemplate($accountId);

        // Home Appliances template
        $templates[] = $this->createHomeAppliancesTemplate($accountId);

        // Jewelry template
        $templates[] = $this->createJewelryTemplate($accountId);

        // General template
        $templates[] = $this->createGeneralTemplate($accountId);

        return $templates;
    }

    /**
     * Create clothing template
     */
    protected function createClothingTemplate(int $accountId): RentalAgreementTemplate
    {
        return RentalAgreementTemplate::create([
            'account_id' => $accountId,
            'name' => 'Geyim Kirayə Müqaviləsi',
            'rental_category' => 'clothing',
            'is_active' => true,
            'is_default' => true,
            'require_photos' => true,
            'min_photos' => 2,
            'terms_and_conditions_az' => "
1. Kirayə müddəti: Müəyyən edilmiş tarixlərdə başlayır və bitir.
2. Geyim təmiz və yaxşı vəziyyətdə qaytarılmalıdır.
3. Zədələnmə və ya ləkə halında əlavə ödəniş tələb olunur.
4. Gecikmə hər gün üçün əlavə ödəniş tələb edir.
5. Geyim digər şəxslərə verilə bilməz.
            ",
            'terms_and_conditions_en' => "
1. Rental period: Starts and ends on specified dates.
2. Clothing must be returned clean and in good condition.
3. Additional payment required for damage or stains.
4. Late return incurs daily fees.
5. Clothing cannot be transferred to other persons.
            ",
            'damage_liability_terms_az' => "
Kirayəçi aşağıdakı hallar üçün məsuliyyət daşıyır:
- Cırılma, kəsilmə, yırtılma
- Ləkələr (çıxarıla bilməyən)
- Düymələrin və ya aksesuarların itirilməsi
- Pis qoxu və ya çirklənmə

Zədələnmə dəyəri məhsulun dəyərindən asılı olaraq müəyyən edilir.
            ",
            'damage_liability_terms_en' => "
Renter is liable for:
- Tears, cuts, rips
- Stains (non-removable)
- Loss of buttons or accessories
- Odor or dirt

Damage value determined based on item value.
            ",
            'condition_checklist' => [
                [
                    'id' => 'clean',
                    'label_az' => 'Təmizdir',
                    'label_en' => 'Clean',
                    'type' => 'boolean',
                    'required' => true,
                ],
                [
                    'id' => 'no_stains',
                    'label_az' => 'Ləkə yoxdur',
                    'label_en' => 'No stains',
                    'type' => 'boolean',
                    'required' => true,
                ],
                [
                    'id' => 'no_tears',
                    'label_az' => 'Cırıq yoxdur',
                    'label_en' => 'No tears',
                    'type' => 'boolean',
                    'required' => true,
                ],
                [
                    'id' => 'buttons_intact',
                    'label_az' => 'Düymələr yerindədir',
                    'label_en' => 'Buttons intact',
                    'type' => 'boolean',
                    'required' => true,
                ],
                [
                    'id' => 'zipper_works',
                    'label_az' => 'Fermuar işləyir',
                    'label_en' => 'Zipper works',
                    'type' => 'boolean',
                    'required' => false,
                ],
                [
                    'id' => 'no_odor',
                    'label_az' => 'Pis qoxu yoxdur',
                    'label_en' => 'No odor',
                    'type' => 'boolean',
                    'required' => true,
                ],
                [
                    'id' => 'accessories_complete',
                    'label_az' => 'Aksesuarlar tamdır (kəmər, qalstuk və s.)',
                    'label_en' => 'Accessories complete',
                    'type' => 'boolean',
                    'required' => false,
                ],
                [
                    'id' => 'condition_notes',
                    'label_az' => 'Əlavə qeydlər',
                    'label_en' => 'Additional notes',
                    'type' => 'text',
                    'required' => false,
                ],
            ],
        ]);
    }

    /**
     * Create electronics template
     */
    protected function createElectronicsTemplate(int $accountId): RentalAgreementTemplate
    {
        return RentalAgreementTemplate::create([
            'account_id' => $accountId,
            'name' => 'Elektronika Kirayə Müqaviləsi',
            'rental_category' => 'electronics',
            'is_active' => true,
            'is_default' => true,
            'require_photos' => true,
            'min_photos' => 4,
            'terms_and_conditions_az' => "
1. Kirayə müddəti: Müəyyən edilmiş tarixlərdə başlayır və bitir.
2. Cihaz işlək vəziyyətdə qaytarılmalıdır.
3. Zədələnmə halında tam dəyəri ödənilməlidir.
4. Serial nömrə qeyd olunub, saxlanılmalıdır.
5. Aksesuarlar və qablaşdırma ilə birlikdə qaytarılmalıdır.
            ",
            'terms_and_conditions_en' => "
1. Rental period: Starts and ends on specified dates.
2. Device must be returned in working condition.
3. Full value must be paid in case of damage.
4. Serial number is recorded and must be maintained.
5. Must be returned with accessories and packaging.
            ",
            'damage_liability_terms_az' => "
Kirayəçi aşağıdakı hallar üçün məsuliyyət daşıyır:
- Ekran zədələnməsi
- Fiziki zədələr (cızıqlar, çatlar)
- Aksesuarların itirilməsi
- Su və ya digər maye zədələri
- Sistem və ya proqram problemləri

Təmir və ya əvəzetmə xərcləri kirayəçi tərəfindən ödənilir.
            ",
            'damage_liability_terms_en' => "
Renter is liable for:
- Screen damage
- Physical damage (scratches, cracks)
- Loss of accessories
- Water or liquid damage
- System or software issues

Repair or replacement costs paid by renter.
            ",
            'condition_checklist' => [
                [
                    'id' => 'powers_on',
                    'label_az' => 'Yandırılır',
                    'label_en' => 'Powers on',
                    'type' => 'boolean',
                    'required' => true,
                    'critical' => true,
                ],
                [
                    'id' => 'screen_condition',
                    'label_az' => 'Ekran vəziyyəti',
                    'label_en' => 'Screen condition',
                    'type' => 'select',
                    'options_az' => ['Mükəmməl', 'Kiçik cızıqlar', 'Çat var', 'Zədələnib'],
                    'options_en' => ['Perfect', 'Minor scratches', 'Cracked', 'Damaged'],
                    'required' => true,
                ],
                [
                    'id' => 'no_scratches',
                    'label_az' => 'Cızıq/xırda zədə yoxdur',
                    'label_en' => 'No scratches/dents',
                    'type' => 'boolean',
                    'required' => true,
                ],
                [
                    'id' => 'battery_health',
                    'label_az' => 'Batareya sağlamlığı (%)',
                    'label_en' => 'Battery health (%)',
                    'type' => 'number',
                    'min' => 0,
                    'max' => 100,
                    'required' => false,
                ],
                [
                    'id' => 'all_buttons_work',
                    'label_az' => 'Bütün düymələr işləyir',
                    'label_en' => 'All buttons work',
                    'type' => 'boolean',
                    'required' => true,
                ],
                [
                    'id' => 'ports_functional',
                    'label_az' => 'Portlar işləyir (USB, audio və s.)',
                    'label_en' => 'Ports functional',
                    'type' => 'boolean',
                    'required' => true,
                ],
                [
                    'id' => 'accessories_included',
                    'label_az' => 'Aksesuarlar (adapter, kabel və s.)',
                    'label_en' => 'Accessories included',
                    'type' => 'checklist',
                    'items_az' => ['Adapter', 'Kabel', 'Qulaqlıq', 'Qab', 'Təlimat'],
                    'items_en' => ['Charger', 'Cable', 'Headphones', 'Case', 'Manual'],
                    'required' => true,
                ],
                [
                    'id' => 'imei_serial',
                    'label_az' => 'IMEI/Serial nömrə',
                    'label_en' => 'IMEI/Serial number',
                    'type' => 'text',
                    'required' => true,
                ],
                [
                    'id' => 'condition_notes',
                    'label_az' => 'Əlavə qeydlər',
                    'label_en' => 'Additional notes',
                    'type' => 'text',
                    'required' => false,
                ],
            ],
        ]);
    }

    /**
     * Create home appliances template
     */
    protected function createHomeAppliancesTemplate(int $accountId): RentalAgreementTemplate
    {
        return RentalAgreementTemplate::create([
            'account_id' => $accountId,
            'name' => 'Ev Texnikası Kirayə Müqaviləsi',
            'rental_category' => 'home_appliances',
            'is_active' => true,
            'is_default' => true,
            'require_photos' => true,
            'min_photos' => 3,
            'terms_and_conditions_az' => "
1. Kirayə müddəti: Müəyyən edilmiş tarixlərdə başlayır və bitir.
2. Cihaz işlək vəziyyətdə qaytarılmalıdır.
3. Serial/Model nömrə qeyd olunub, saxlanılmalıdır.
4. Bütün funksiyalar işləyir vəziyyətdə olmalıdır.
5. Təmiz vəziyyətdə qaytarılmalıdır.
            ",
            'terms_and_conditions_en' => "
1. Rental period: Starts and ends on specified dates.
2. Device must be returned in working condition.
3. Serial/Model number is recorded and must be maintained.
4. All functions must be operational.
5. Must be returned in clean condition.
            ",
            'damage_liability_terms_az' => "
Kirayəçi aşağıdakı hallar üçün məsuliyyət daşıyır:
- Ekran zədələnməsi (TV üçün)
- Fiziki zədələr
- Funksional problemlər
- Kabellərin və ya aksesuarların itirilməsi

Təmir və ya əvəzetmə xərcləri kirayəçi tərəfindən ödənilir.
            ",
            'damage_liability_terms_en' => "
Renter is liable for:
- Screen damage (for TV)
- Physical damage
- Functional issues
- Loss of cables or accessories

Repair or replacement costs paid by renter.
            ",
            'condition_checklist' => [
                [
                    'id' => 'powers_on',
                    'label_az' => 'İşə düşür',
                    'label_en' => 'Powers on',
                    'type' => 'boolean',
                    'required' => true,
                    'critical' => true,
                ],
                [
                    'id' => 'screen_condition',
                    'label_az' => 'Ekran vəziyyəti (TV üçün)',
                    'label_en' => 'Screen condition (for TV)',
                    'type' => 'select',
                    'options_az' => ['Mükəmməl', 'Kiçik cızıqlar', 'Piksel problemi', 'Çat var'],
                    'options_en' => ['Perfect', 'Minor scratches', 'Pixel issues', 'Cracked'],
                    'required' => false,
                ],
                [
                    'id' => 'no_physical_damage',
                    'label_az' => 'Fiziki zərər yoxdur',
                    'label_en' => 'No physical damage',
                    'type' => 'boolean',
                    'required' => true,
                ],
                [
                    'id' => 'all_functions_work',
                    'label_az' => 'Bütün funksiyalar işləyir',
                    'label_en' => 'All functions work',
                    'type' => 'boolean',
                    'required' => true,
                ],
                [
                    'id' => 'remote_included',
                    'label_az' => 'Pult daxildir (TV üçün)',
                    'label_en' => 'Remote included',
                    'type' => 'boolean',
                    'required' => false,
                ],
                [
                    'id' => 'cables_complete',
                    'label_az' => 'Bütün kabellər tamdır',
                    'label_en' => 'All cables complete',
                    'type' => 'boolean',
                    'required' => true,
                ],
                [
                    'id' => 'clean_exterior',
                    'label_az' => 'Xarici görünüş təmizdir',
                    'label_en' => 'Clean exterior',
                    'type' => 'boolean',
                    'required' => true,
                ],
                [
                    'id' => 'serial_model',
                    'label_az' => 'Serial/Model nömrə',
                    'label_en' => 'Serial/Model number',
                    'type' => 'text',
                    'required' => true,
                ],
                [
                    'id' => 'condition_notes',
                    'label_az' => 'Əlavə qeydlər',
                    'label_en' => 'Additional notes',
                    'type' => 'text',
                    'required' => false,
                ],
            ],
        ]);
    }

    /**
     * Create jewelry template
     */
    protected function createJewelryTemplate(int $accountId): RentalAgreementTemplate
    {
        return RentalAgreementTemplate::create([
            'account_id' => $accountId,
            'name' => 'Zərgərlik Kirayə Müqaviləsi',
            'rental_category' => 'jewelry',
            'is_active' => true,
            'is_default' => true,
            'require_photos' => true,
            'min_photos' => 4,
            'terms_and_conditions_az' => "
1. Kirayə müddəti: Müəyyən edilmiş tarixlərdə başlayır və bitir.
2. Zərgərlik qiymətli olduğu üçün əlavə təminat tələb olunur.
3. Çəki qeyd olunub, qaytarılarkən yoxlanılacaq.
4. Metal növü və daşlar qeyd edilib.
5. İtki və ya oğurluq halında tam dəyər ödənilməlidir.
            ",
            'terms_and_conditions_en' => "
1. Rental period: Starts and ends on specified dates.
2. Additional security required due to high value.
3. Weight is recorded and will be verified upon return.
4. Metal type and stones are documented.
5. Full value must be paid in case of loss or theft.
            ",
            'damage_liability_terms_az' => "
Kirayəçi aşağıdakı hallar üçün məsuliyyət daşıyır:
- Daşların düşməsi və ya itirilməsi
- Bağlamanın zədələnməsi
- Tutqunlaşma və ya rəng dəyişikliyi
- Cızıqlar və ya əzilmələr
- İtki və ya oğurluq: Tam dəyər + 20%

Bütün zədələr qiymətləndirilərək müvafiq ödəniş tələb olunur.
            ",
            'damage_liability_terms_en' => "
Renter is liable for:
- Missing or lost stones
- Clasp damage
- Tarnishing or discoloration
- Scratches or dents
- Loss or theft: Full value + 20%

All damage will be assessed and appropriate payment required.
            ",
            'condition_checklist' => [
                [
                    'id' => 'no_damage',
                    'label_az' => 'Zədə yoxdur',
                    'label_en' => 'No damage',
                    'type' => 'boolean',
                    'required' => true,
                    'critical' => true,
                ],
                [
                    'id' => 'stones_intact',
                    'label_az' => 'Daşlar yerindədir',
                    'label_en' => 'Stones intact',
                    'type' => 'boolean',
                    'required' => true,
                ],
                [
                    'id' => 'clasp_works',
                    'label_az' => 'Bağlama işləyir',
                    'label_en' => 'Clasp works',
                    'type' => 'boolean',
                    'required' => true,
                ],
                [
                    'id' => 'no_tarnish',
                    'label_az' => 'Tutqunlaşma yoxdur',
                    'label_en' => 'No tarnish',
                    'type' => 'boolean',
                    'required' => true,
                ],
                [
                    'id' => 'weight',
                    'label_az' => 'Çəki (qram)',
                    'label_en' => 'Weight (grams)',
                    'type' => 'number',
                    'required' => true,
                ],
                [
                    'id' => 'metal_type',
                    'label_az' => 'Metal növü',
                    'label_en' => 'Metal type',
                    'type' => 'select',
                    'options_az' => ['Qızıl', 'Gümüş', 'Platin', 'Digər'],
                    'options_en' => ['Gold', 'Silver', 'Platinum', 'Other'],
                    'required' => true,
                ],
                [
                    'id' => 'certificate_included',
                    'label_az' => 'Sertifikat daxildir',
                    'label_en' => 'Certificate included',
                    'type' => 'boolean',
                    'required' => false,
                ],
                [
                    'id' => 'box_included',
                    'label_az' => 'Qutu daxildir',
                    'label_en' => 'Box included',
                    'type' => 'boolean',
                    'required' => false,
                ],
                [
                    'id' => 'condition_notes',
                    'label_az' => 'Əlavə qeydlər',
                    'label_en' => 'Additional notes',
                    'type' => 'text',
                    'required' => false,
                ],
            ],
        ]);
    }

    /**
     * Create general template
     */
    protected function createGeneralTemplate(int $accountId): RentalAgreementTemplate
    {
        return RentalAgreementTemplate::create([
            'account_id' => $accountId,
            'name' => 'Ümumi Kirayə Müqaviləsi',
            'rental_category' => 'general',
            'is_active' => true,
            'is_default' => true,
            'require_photos' => false,
            'min_photos' => 1,
            'terms_and_conditions_az' => "
1. Kirayə müddəti: Müəyyən edilmiş tarixlərdə başlayır və bitir.
2. Məhsul yaxşı vəziyyətdə qaytarılmalıdır.
3. Zədələnmə halında əlavə ödəniş tələb olunur.
4. Gecikmə hər gün üçün əlavə ödəniş tələb edir.
            ",
            'terms_and_conditions_en' => "
1. Rental period: Starts and ends on specified dates.
2. Item must be returned in good condition.
3. Additional payment required for damage.
4. Late return incurs daily fees.
            ",
            'damage_liability_terms_az' => "
Kirayəçi məhsulun zədələnməsi və ya itirilməsi üçün tam məsuliyyət daşıyır.
Zədələnmə dəyəri məhsulun dəyərindən asılı olaraq müəyyən edilir.
            ",
            'damage_liability_terms_en' => "
Renter bears full liability for damage or loss of item.
Damage value determined based on item value.
            ",
            'condition_checklist' => [
                [
                    'id' => 'overall_condition',
                    'label_az' => 'Ümumi vəziyyət',
                    'label_en' => 'Overall condition',
                    'type' => 'select',
                    'options_az' => ['Mükəmməl', 'Yaxşı', 'Orta', 'Pis'],
                    'options_en' => ['Perfect', 'Good', 'Fair', 'Poor'],
                    'required' => true,
                ],
                [
                    'id' => 'damage_present',
                    'label_az' => 'Zədə var',
                    'label_en' => 'Damage present',
                    'type' => 'boolean',
                    'required' => true,
                ],
            ],
        ]);
    }
}
