<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\RentalAgreementTemplate;
use App\Models\Account;

class RentalAgreementTemplateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all accounts to create templates for each
        $accounts = Account::all();

        foreach ($accounts as $account) {
            $this->createTemplatesForAccount($account->id);
        }

        $this->command->info('Rental agreement templates created successfully!');
    }

    private function createTemplatesForAccount(int $accountId): void
    {
        // General Template
        RentalAgreementTemplate::updateOrCreate(
            [
                'account_id' => $accountId,
                'rental_category' => 'general',
                'is_default' => true,
            ],
            [
                'name' => 'Ümumi İcarə Müqaviləsi',
                'terms_and_conditions_az' => $this->getGeneralTermsAz(),
                'terms_and_conditions_en' => $this->getGeneralTermsEn(),
                'damage_liability_terms_az' => $this->getGeneralDamageTermsAz(),
                'damage_liability_terms_en' => $this->getGeneralDamageTermsEn(),
                'condition_checklist' => $this->getGeneralChecklist(),
                'is_active' => true,
                'require_photos' => true,
                'min_photos' => 2,
            ]
        );

        // Clothing Template
        RentalAgreementTemplate::updateOrCreate(
            [
                'account_id' => $accountId,
                'rental_category' => 'clothing',
                'is_default' => true,
            ],
            [
                'name' => 'Paltar İcarəsi Müqaviləsi',
                'terms_and_conditions_az' => $this->getClothingTermsAz(),
                'terms_and_conditions_en' => $this->getClothingTermsEn(),
                'damage_liability_terms_az' => $this->getClothingDamageTermsAz(),
                'damage_liability_terms_en' => $this->getClothingDamageTermsEn(),
                'condition_checklist' => $this->getClothingChecklist(),
                'is_active' => true,
                'require_photos' => true,
                'min_photos' => 2,
            ]
        );

        // Electronics Template
        RentalAgreementTemplate::updateOrCreate(
            [
                'account_id' => $accountId,
                'rental_category' => 'electronics',
                'is_default' => true,
            ],
            [
                'name' => 'Elektronika İcarəsi Müqaviləsi',
                'terms_and_conditions_az' => $this->getElectronicsTermsAz(),
                'terms_and_conditions_en' => $this->getElectronicsTermsEn(),
                'damage_liability_terms_az' => $this->getElectronicsDamageTermsAz(),
                'damage_liability_terms_en' => $this->getElectronicsDamageTermsEn(),
                'condition_checklist' => $this->getElectronicsChecklist(),
                'is_active' => true,
                'require_photos' => true,
                'min_photos' => 4,
            ]
        );

        // Home Appliances Template
        RentalAgreementTemplate::updateOrCreate(
            [
                'account_id' => $accountId,
                'rental_category' => 'home_appliances',
                'is_default' => true,
            ],
            [
                'name' => 'Ev Texnikası İcarəsi Müqaviləsi',
                'terms_and_conditions_az' => $this->getHomeAppliancesTermsAz(),
                'terms_and_conditions_en' => $this->getHomeAppliancesTermsEn(),
                'damage_liability_terms_az' => $this->getHomeAppliancesDamageTermsAz(),
                'damage_liability_terms_en' => $this->getHomeAppliancesDamageTermsEn(),
                'condition_checklist' => $this->getHomeAppliancesChecklist(),
                'is_active' => true,
                'require_photos' => true,
                'min_photos' => 3,
            ]
        );

        // Jewelry Template
        RentalAgreementTemplate::updateOrCreate(
            [
                'account_id' => $accountId,
                'rental_category' => 'jewelry',
                'is_default' => true,
            ],
            [
                'name' => 'Zərgərlik İcarəsi Müqaviləsi',
                'terms_and_conditions_az' => $this->getJewelryTermsAz(),
                'terms_and_conditions_en' => $this->getJewelryTermsEn(),
                'damage_liability_terms_az' => $this->getJewelryDamageTermsAz(),
                'damage_liability_terms_en' => $this->getJewelryDamageTermsEn(),
                'condition_checklist' => $this->getJewelryChecklist(),
                'is_active' => true,
                'require_photos' => true,
                'min_photos' => 4,
            ]
        );
    }

    // ===== GENERAL TEMPLATES =====

    private function getGeneralTermsAz(): string
    {
        return <<<EOT
# İCARƏ MÜQAVİLƏSİ

## 1. ÜMUMI ŞƏRTLƏR

1.1. Müştəri icarəyə götürdüyü məhsulu müqavilədə göstərilən tarixə qədər qaytarmağı öhdəsinə götürür.

1.2. Məhsul yalnız şəxsi istifadə üçün icarəyə götürülür və başqasına veriləbilməz.

1.3. Gecikmə halında günlük cərimə tətbiq olunur.

## 2. MƏSULİYYƏT

2.1. Müştəri məhsulun qəbul zamanı qeyd edilən vəziyyətdə qaytarılmasına məsuliyyət daşıyır.

2.2. Müştəri məhsulun itməsi və ya zədələnməsi halında tam məsuliyyət daşıyır.

## 3. TƏMİNAT

3.1. Təminat məhsul qaytarıldıqdan sonra geri verilir (zərər olmadıqda).

3.2. Zərər halında təminatdan müvafiq məbləğ tutulacaq.
EOT;
    }

    private function getGeneralTermsEn(): string
    {
        return <<<EOT
# RENTAL AGREEMENT

## 1. GENERAL TERMS

1.1. The customer agrees to return the rented item by the date specified in the agreement.

1.2. The item is rented for personal use only and cannot be sublet.

1.3. A daily late fee applies for overdue returns.

## 2. LIABILITY

2.1. Customer is responsible for returning the item in the condition documented at rental.

2.2. Customer bears full responsibility in case of loss or damage to the item.

## 3. SECURITY

3.1. Security will be returned after item return (if no damage).

3.2. In case of damage, appropriate amount will be deducted from security.
EOT;
    }

    private function getGeneralDamageTermsAz(): string
    {
        return <<<EOT
## ZƏDƏLƏNMƏ MƏSULİYYƏTİ

- Kiçik zərər: Təmir dəyəri
- Ciddi zərər: Məhsulun tam dəyəri
- İtki: Məhsulun tam dəyəri + 20%
EOT;
    }

    private function getGeneralDamageTermsEn(): string
    {
        return <<<EOT
## DAMAGE LIABILITY

- Minor damage: Repair cost
- Major damage: Full replacement value
- Loss: Full value + 20%
EOT;
    }

    private function getGeneralChecklist(): array
    {
        return [
            [
                'id' => 'no_damage',
                'label_az' => 'Zədə yoxdur',
                'label_en' => 'No damage',
                'type' => 'boolean',
                'required' => true,
                'critical' => true,
            ],
            [
                'id' => 'clean_condition',
                'label_az' => 'Təmiz vəziyyətdədir',
                'label_en' => 'Clean condition',
                'type' => 'boolean',
                'required' => true,
            ],
            [
                'id' => 'fully_functional',
                'label_az' => 'Tam işləkdir',
                'label_en' => 'Fully functional',
                'type' => 'boolean',
                'required' => true,
            ],
            [
                'id' => 'condition_notes',
                'label_az' => 'Əlavə qeydlər',
                'label_en' => 'Additional notes',
                'type' => 'text',
                'required' => false,
            ],
        ];
    }

    // ===== CLOTHING TEMPLATES =====

    private function getClothingTermsAz(): string
    {
        return <<<EOT
# PALTAR İCARƏSİ MÜQAVİLƏSİ

## 1. ÜMUMI ŞƏRTLƏR

1.1. Müştəri icarəyə götürdüyü paltarı müqavilədə göstərilən tarixə qədər qaytarmağı öhdəsinə götürür.

1.2. Paltar yalnız şəxsi istifadə üçün icarəyə götürülür və başqasına veriləbilməz.

1.3. Gecikmə halında günlük cərimə tətbiq olunur.

## 2. PALTAR ÜÇÜN XÜSUSİ ŞƏRTLƏR

2.1. Məhsul təmiz vəziyyətdə qaytarılmalıdır. Çirklənmə halında təmizlik haqqı tətbiq olunur.

2.2. Qadağandır: Ləkələndirici maddələr (boruqq və s.), kəskin ətirlər, siqaret tüstüsü.

2.3. Düymə/fermuar zədələnməsi ayrıca ödənişlə təmir ediləcək.

2.4. Cırıq/kəsilmə: Təmir dəyəri və ya tam məhsul dəyəri.

## 3. MƏSULİYYƏT

3.1. Müştəri paltarın qəbul zamanı qeyd edilən vəziyyətdə qaytarılmasına məsuliyyət daşıyır.

3.2. Ləkə, cırıq, yanıq və ya digər zədələr halında müştəri təmir və ya dəyişdirmə xərclərini ödəyəcək.
EOT;
    }

    private function getClothingTermsEn(): string
    {
        return <<<EOT
# CLOTHING RENTAL AGREEMENT

## 1. GENERAL TERMS

1.1. The customer agrees to return the rented clothing by the date specified in the agreement.

1.2. The item is rented for personal use only and cannot be sublet.

1.3. A daily late fee applies for overdue returns.

## 2. CLOTHING SPECIFIC TERMS

2.1. Item must be returned clean. Cleaning fee applies if soiled.

2.2. Prohibited: Staining substances, strong perfumes, cigarette smoke.

2.3. Button/zipper damage will be repaired with additional charge.

2.4. Tears/cuts: Repair cost or full replacement value.

## 3. LIABILITY

3.1. Customer is responsible for returning the item in the condition documented at rental.

3.2. In case of stains, tears, burns or other damage, customer will pay repair or replacement costs.
EOT;
    }

    private function getClothingDamageTermsAz(): string
    {
        return <<<EOT
## ZƏDƏLƏNMƏ MƏSULİYYƏTİ

- Təmizlik tələb edən çirklənmə: Kimyəvi təmizlik haqqı
- Düymə/fermuar dəyişdirilməsi: Material və iş haqqı
- Cırıq/kəsilmə: Təmir dəyəri və ya tam məhsul dəyəri
- Ləkə (təmizlənməyən): Məhsulun tam dəyəri
- İtki: Məhsulun tam dəyəri + 20%
EOT;
    }

    private function getClothingDamageTermsEn(): string
    {
        return <<<EOT
## DAMAGE LIABILITY

- Soiling requiring cleaning: Dry cleaning fee
- Button/zipper replacement: Material and labor cost
- Tears/cuts: Repair cost or full replacement value
- Permanent stains: Full item value
- Loss: Full value + 20%
EOT;
    }

    private function getClothingChecklist(): array
    {
        return [
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
        ];
    }

    // ===== ELECTRONICS TEMPLATES =====

    private function getElectronicsTermsAz(): string
    {
        return <<<EOT
# ELEKTRONİKA İCARƏSİ MÜQAVİLƏSİ

## 1. ÜMUMI ŞƏRTLƏR

1.1. Müştəri icarəyə götürdüyü elektronika məhsulunu müqavilədə göstərilən tarixə qədər qaytarmağı öhdəsinə götürür.

1.2. Məhsul yalnız şəxsi istifadə üçün icarəyə götürülür və başqasına veriləbilməz.

1.3. Gecikmə halında günlük cərimə tətbiq olunur.

## 2. ELEKTRONİKA ÜÇÜN XÜSUSİ ŞƏRTLƏR

2.1. Məhsulun IMEI/Serial nömrəsi yoxlanılacaq.

2.2. Ekran zədələnməsi: Tam dəyişdirmə dəyəri.

2.3. Su zədələnməsi: Məhsulun tam dəyəri.

2.4. Proqram dəyişikliyi/jailbreak qadağandır. Aşkarlanma halında cərimə tətbiq olunur.

2.5. Bütün aksesuarlar (adapter, kabel və s.) eyni vəziyyətdə qaytarılmalıdır.

## 3. MƏSULİYYƏT

3.1. Müştəri məhsulun qəbul zamanı qeyd edilən vəziyyətdə qaytarılmasına məsuliyyət daşıyır.

3.2. Fiziki zədələr, su təsiri, proqram dəyişikliyi halında müştəri tam məsuliyyət daşıyır.
EOT;
    }

    private function getElectronicsTermsEn(): string
    {
        return <<<EOT
# ELECTRONICS RENTAL AGREEMENT

## 1. GENERAL TERMS

1.1. The customer agrees to return the rented electronic device by the date specified in the agreement.

1.2. The device is rented for personal use only and cannot be sublet.

1.3. A daily late fee applies for overdue returns.

## 2. ELECTRONICS SPECIFIC TERMS

2.1. Device IMEI/Serial will be verified.

2.2. Screen damage: Full replacement cost.

2.3. Water damage: Full device value.

2.4. Software modification/jailbreaking prohibited. Penalty applies if detected.

2.5. All accessories must be returned in same condition.

## 3. LIABILITY

3.1. Customer is responsible for returning the device in the condition documented at rental.

3.2. Customer bears full responsibility for physical damage, water exposure, software modifications.
EOT;
    }

    private function getElectronicsDamageTermsAz(): string
    {
        return <<<EOT
## ZƏDƏLƏNMƏ MƏSULİYYƏTİ

- Ekran zədələnməsi: Tam ekran dəyişdirilməsi dəyəri
- Su zədələnməsi: Məhsulun tam dəyəri
- Fiziki zədə (korpus): Təmir dəyəri və ya tam dəyər
- Proqram dəyişikliyi: Cərimə və ya tam dəyər
- Aksesuar itkisi: Aksesuar dəyəri
- Tam itki: Məhsulun tam dəyəri + 20%
EOT;
    }

    private function getElectronicsDamageTermsEn(): string
    {
        return <<<EOT
## DAMAGE LIABILITY

- Screen damage: Full screen replacement cost
- Water damage: Full device value
- Physical damage (body): Repair cost or full value
- Software modification: Penalty or full value
- Accessory loss: Accessory value
- Total loss: Full value + 20%
EOT;
    }

    private function getElectronicsChecklist(): array
    {
        return [
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
        ];
    }

    // ===== HOME APPLIANCES TEMPLATES =====

    private function getHomeAppliancesTermsAz(): string
    {
        return <<<EOT
# EV TEXNİKASI İCARƏSİ MÜQAVİLƏSİ

## 1. ÜMUMI ŞƏRTLƏR

1.1. Müştəri icarəyə götürdüyü ev texnikasını müqavilədə göstərilən tarixə qədər qaytarmağı öhdəsinə götürür.

1.2. Məhsul yalnız ev şəraitində istifadə üçün icarəyə götürülür.

1.3. Gecikmə halında günlük cərimə tətbiq olunur.

## 2. EV TEXNİKASI ÜÇÜN XÜSUSİ ŞƏRTLƏR

2.1. Məhsul düzgün quraşdırılmalı və istifadə təlimatına uyğun işlədilməlidir.

2.2. Elektrik gərginliyindən və ya qeyri-düzgün istifadədən yaranacaq zərərə müştəri məsuliyyət daşıyır.

2.3. Bütün aksesuarlar və kabellər eyni vəziyyətdə qaytarılmalıdır.

## 3. MƏSULİYYƏT

3.1. Müştəri məhsulun qəbul zamanı qeyd edilən vəziyyətdə qaytarılmasına məsuliyyət daşıyır.

3.2. Texniki nasazlıq halında dərhal şirkətə məlumat verilməlidir.
EOT;
    }

    private function getHomeAppliancesTermsEn(): string
    {
        return <<<EOT
# HOME APPLIANCES RENTAL AGREEMENT

## 1. GENERAL TERMS

1.1. The customer agrees to return the rented appliance by the date specified in the agreement.

1.2. The appliance is rented for home use only.

1.3. A daily late fee applies for overdue returns.

## 2. HOME APPLIANCES SPECIFIC TERMS

2.1. The appliance must be properly installed and used according to instructions.

2.2. Customer is responsible for damage from power surges or improper use.

2.3. All accessories and cables must be returned in same condition.

## 3. LIABILITY

3.1. Customer is responsible for returning the appliance in the condition documented at rental.

3.2. In case of technical issues, company must be notified immediately.
EOT;
    }

    private function getHomeAppliancesDamageTermsAz(): string
    {
        return <<<EOT
## ZƏDƏLƏNMƏ MƏSULİYYƏTİ

- Fiziki zədə: Təmir dəyəri və ya tam dəyər
- Elektrik zədəsi: Təmir dəyəri və ya tam dəyər
- Aksesuar itkisi: Aksesuar dəyəri
- Tam itki: Məhsulun tam dəyəri + 20%
EOT;
    }

    private function getHomeAppliancesDamageTermsEn(): string
    {
        return <<<EOT
## DAMAGE LIABILITY

- Physical damage: Repair cost or full value
- Electrical damage: Repair cost or full value
- Accessory loss: Accessory value
- Total loss: Full value + 20%
EOT;
    }

    private function getHomeAppliancesChecklist(): array
    {
        return [
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
        ];
    }

    // ===== JEWELRY TEMPLATES =====

    private function getJewelryTermsAz(): string
    {
        return <<<EOT
# ZƏRGƏRLİK İCARƏSİ MÜQAVİLƏSİ

## 1. ÜMUMI ŞƏRTLƏR

1.1. Müştəri icarəyə götürdüyü zərgərliyi müqavilədə göstərilən tarixə qədər qaytarmağı öhdəsinə götürür.

1.2. Zərgərlik məhsulu yalnız şəxsi istifadə üçün icarəyə götürülür.

1.3. Gecikmə halında günlük cərimə tətbiq olunur.

## 2. ZƏRGƏRLİK ÜÇÜN XÜSUSİ ŞƏRTLƏR

2.1. Məhsulun çəkisi qəbul və qaytarma zamanı yoxlanılacaq.

2.2. Daşlar və sertifikatlar yoxlanılacaq.

2.3. İstənilən zədə, itki və ya dəyişiklik halında müştəri tam məsuliyyət daşıyır.

2.4. Kimyəvi maddələrdən (xlorlu təmizləyicilər, parfüm və s.) uzaq saxlanılmalıdır.

## 3. MƏSULİYYƏT

3.1. Müştəri məhsulun qəbul zamanı qeyd edilən vəziyyətdə qaytarılmasına məsuliyyət daşıyır.

3.2. Daş itkisi, zədələnmə və ya çəki fərqi halında müştəri tam dəyəri ödəyəcək.
EOT;
    }

    private function getJewelryTermsEn(): string
    {
        return <<<EOT
# JEWELRY RENTAL AGREEMENT

## 1. GENERAL TERMS

1.1. The customer agrees to return the rented jewelry by the date specified in the agreement.

1.2. The jewelry is rented for personal use only.

1.3. A daily late fee applies for overdue returns.

## 2. JEWELRY SPECIFIC TERMS

2.1. Item weight will be verified at rental and return.

2.2. Stones and certificates will be verified.

2.3. Customer bears full responsibility for any damage, loss or alterations.

2.4. Must be kept away from chemicals (chlorinated cleaners, perfumes, etc.).

## 3. LIABILITY

3.1. Customer is responsible for returning the item in the condition documented at rental.

3.2. In case of stone loss, damage or weight discrepancy, customer will pay full value.
EOT;
    }

    private function getJewelryDamageTermsAz(): string
    {
        return <<<EOT
## ZƏDƏLƏNMƏ MƏSULİYYƏTİ

- Daş itkisi: Daş dəyəri + təmir
- Zədələnmə/əyilmə: Təmir dəyəri və ya tam dəyər
- Çəki fərqi: Qram başına cari qızıl/gümüş qiyməti
- Sertifikat itkisi: 50 AZN
- Tam itki: Məhsulun tam dəyəri + 20%
EOT;
    }

    private function getJewelryDamageTermsEn(): string
    {
        return <<<EOT
## DAMAGE LIABILITY

- Stone loss: Stone value + repair
- Damage/bending: Repair cost or full value
- Weight discrepancy: Current gold/silver price per gram
- Certificate loss: 50 AZN
- Total loss: Full value + 20%
EOT;
    }

    private function getJewelryChecklist(): array
    {
        return [
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
        ];
    }
}
