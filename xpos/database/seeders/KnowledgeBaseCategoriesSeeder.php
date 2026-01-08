<?php

namespace Database\Seeders;

use App\Models\KnowledgeCategory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class KnowledgeBaseCategoriesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 14 Ana Kategoriya - Azərbaycanca Təmiz
        $categories = [
            [
                'name' => 'BAŞLAMAQ',
                'description' => 'Sistem istifadəsinə başlamaq üçün əsas məlumatlar və rəhbərlər',
                'icon' => 'rocket',
                'children' => [
                    'Sistem Haqqında' => 'Sistem xüsusiyyətləri və imkanları',
                    'Dashboard Bələdçi' => 'Ana paneli ve tərkibini öyrənmə',
                    'İstifadəçi Rolu və İcazələri' => 'Fərqli rolların icazələri',
                    'Hesab Qurğusu' => 'Sistem initial qurğusu',
                    'Mobil Tətbiq' => 'Mobil versiyası ilə işləmə',
                ]
            ],
            [
                'name' => 'Hesabatlar',
                'description' => 'Əməliyyat hesabatları, analitika və məlumat excelə çıxarma',
                'icon' => 'chart-bar',
                'children' => [
                    'Satış Hesabatı' => 'Satış nəticə və analizi',
                    'İnventar Hesabatı' => 'Ehtiyat və stok hesabatları',
                    'Müştəri Hesabatı' => 'Müştəri analizi və statistikası',
                    'Maliyyə Hesabatı' => 'Gəlir, xərc və mənfəət hesabatı',
                    'Fəaliyyət Hesabatı' => 'Sistem fəaliyyətinin əsas göstəriciləri',
                    'Hesabatı Endirmə' => 'Hesabatları PDF və Excel formatında çıxarma',
                    'Hesabatı Çap' => 'Hesabatların çapı',
                ]
            ],
            [
                'name' => 'SATIŞLAR VƏ ÖDƏMƏLƏR',
                'description' => 'Satış prosesi, ödəmə metodları və qaytarılma işləri',
                'icon' => 'shopping-cart',
                'children' => [
                    'Yeni Satış Yaratma' => 'Satış fişi yaratma prosesi',
                    'Ödəmə Metodları' => 'Müxtəlif ödəniş üsulları',
                    'Geri Qaytarış və Geri Cəbrayş' => 'Satış ləğvü və geri ödəniş işləri',
                    'Online Sifarişlər' => 'Onlayn əmriyyə işlənməsi',
                    'Ekspeditor' => 'Meydança satış işi',
                    'Hədiyyə Kartı Satışı' => 'Hədiyyə kartları ilə satış',
                    'Kassa Işləri' => 'Kassir əməliyyatları',
                ]
            ],
            [
                'name' => 'MƏHSUL İDARƏSİ',
                'description' => 'Məhsul kataloqu, qiymətləndirmə və barkod idarəçiliyi',
                'icon' => 'box',
                'children' => [
                    'Məhsul Yaratma' => 'Yeni məhsul əlavə etmə',
                    'Məhsul Redaktəsi' => 'Məhsul məlumatının dəyişdirilməsi',
                    'Məhsul Variantları' => 'Rəng, ölçü və digər variantlar',
                    'Qiymətləndirmə Strategiyaları' => 'Məhsul qiymətinin təyin edilməsi',
                    'Barkod Yaratma' => 'Barkod generasiyası',
                    'Məhsul Kateqoriyaları' => 'Məhsul təsnifatı',
                    'Şəkil və Fayllar' => 'Məhsul şəkilləri və sənədləri',
                    'Məhsul Atributları' => 'Məhsulun xüsusiyyətləri',
                ]
            ],
            [
                'name' => 'İNVENTAR VƏ ANBAR',
                'description' => 'Ehtiyat idarəçiliyi, anbar transferləri və mal qəbulu',
                'icon' => 'warehouse',
                'children' => [
                    'Ehtiyat İdarəçiliyi' => 'Stok seviyyəsi kontrol',
                    'Anbar Transferləri' => 'Anbarlar arasında stok köçürülməsi',
                    'Mal Qəbulu' => 'Gələn əmriyyənin qəbulu',
                    'Tez Skan' => 'Barkod skan ilə sürətli inventar',
                    'Inventar Sayılması' => 'Stok fiziki sayılması',
                    'Aşağı Ehtiyat Xəbərləri' => 'Az stok haqqında bildiriş',
                    'Çoxlu Anbar' => 'Çoxlu anbarla işləmə',
                    'Anbar Rolu' => 'Anbar müdürünün icazələri',
                ]
            ],
            [
                'name' => 'MÜŞTƏRİ İDARƏSİ',
                'description' => 'Müştəri məlumatı, loyallıq proqramı və kredit idarəçiliyi',
                'icon' => 'users',
                'children' => [
                    'Müştəri Yaratma' => 'Yeni müştəri profili əlavə etmə',
                    'Müştəri Məlumatları' => 'Müştəri şəxsi məlumatı',
                    'Loyallıq Proqramı' => 'Ballar və mükafatlar sistemi',
                    'Müştəri Krediti' => 'Müştəriyə kredit vermə',
                    'Müştəri Tarixi' => 'Müştərinin əməliyyatlar tarixi',
                    'Müştəri Xidmətləri' => 'Müştəriyə verilən xidmətlər',
                ]
            ],
            [
                'name' => 'SİSTEM AYARLARI',
                'description' => 'Şirkət, POS, bildirişlər, çap və bulud saxlama ayarları',
                'icon' => 'sliders-h',
                'children' => [
                    'Şirkət Qurğusu' => 'Şirkət məlumatı və tamlaması',
                    'POS Ayarları' => 'POS terminal parametrləri',
                    'Bildirişlər Kanalları' => 'Bildiriş sisteminin qurğusu',
                    'SMS İntegrasiyası' => 'SMS servisi əlaqəsi',
                    'Telegram İntegrasiyası' => 'Telegram bot əlaqəsi',
                    'Çap Ayarları' => 'Printer qoşulması və seçimi',
                    'Bulud Saxlama' => 'Faylların saxlanması',
                    'Sistem Sağlamlığı' => 'Server performans monitorinqi',
                ]
            ],
            [
                'name' => 'ÇAP VƏ KVİTANSİYALAR',
                'description' => 'Kvitansiya şablonları, termal çapçı qurğusu və əmlak çapı',
                'icon' => 'print',
                'children' => [
                    'Kvitansiya Şablonları' => 'Çap formatının düzəldilməsi',
                    'Termal Çapçı Qurğusu' => 'Termal printer əlaqəsi',
                    'Çapı Test Etmə' => 'Printer sınaqdan keçirmə',
                    'Barkod Çapı' => 'Barkod çapçısı ayarları',
                    'Rəsmi Çapçı' => 'Fiskal printer integrasyonu',
                    'Sənəd Çapı' => 'Sənədlərin çapı',
                ]
            ],
            [
                'name' => 'İSTİFADƏÇİ İDARƏSİ',
                'description' => 'İstifadəçi yaratma, rol təyini, icazələr və audit',
                'icon' => 'user-cog',
                'children' => [
                    'İstifadəçi Yaratma' => 'Yeni istifadəçi profili',
                    'İstifadəçi Redaktəsi' => 'İstifadəçi məlumatının əvəz edilməsi',
                    'Rol Təyini' => 'Rolu istifadəçiyə verilməsi',
                    'İcazə Tənzimləmələri' => 'Əyrı-ayrı icazələr',
                    'Şifrə Dəyişdirmə' => 'Şifrə sıfirləmə',
                    'Auditləşdirmə Jurnalı' => 'İstifadəçi fəaliyyətinin qeydləri',
                    'Fəaliyyət İzləmə' => 'Canlı istifadəçi fəaliyyəti',
                ]
            ],
            [
                'name' => 'XİDMƏT VƏ KİRAYƏ',
                'description' => 'Xidmət əməliyyatları, kirayə idarəçiliyi, tərzi və təmir xidmətləri',
                'icon' => 'tools',
                'children' => [
                    'Xidmət Qaydası' => 'Xidmət əməliyyatı prosesi',
                    'Kirayə İdarəçiliyi' => 'Avadanlıq kirayəsi',
                    'Kirayə Təqvimi' => 'Kirayə qrafiki',
                    'Tərzi Xidməti' => 'Tərzilik xidməti',
                    'TV Təmiri' => 'Televizar təmir xidməti',
                    'Cihaz Təmiri' => 'Elektrik cihazının təmiri',
                    'Xidmət Redaktəsi' => 'Xidmət məlumatının əvəzlənməsi',
                ]
            ],
            [
                'name' => 'MALİYYƏ İDARƏSİ',
                'description' => 'Xərc, kredit, maaş, ödəniş və gəlir idarəçiliyi',
                'icon' => 'money-bill-wave',
                'children' => [
                    'Xərc İdarəçiliyi' => 'Fərqli xərclər',
                    'Təchizatçı Krediti' => 'Tədarükçü krediti',
                    'Əməkdaş Maaşları' => 'İstifadəçi maaş idarəçiliyi',
                    'Ödəniş Yığcamı' => 'Gən ödəniş hesabatı',
                    'Maliyyə Göstəriciləri' => 'Cəmi gəlir və xərc',
                    'Dövriyyə Raportu' => 'Əməliyyat dövriyyəsi',
                ]
            ],
            [
                'name' => 'PROBLEMIN HƏLLI',
                'description' => 'Bilinən problemlər, həllər, İnternet problemləri, dəstək sorğuları',
                'icon' => 'life-ring',
                'children' => [
                    'Ümumi Problemlər' => 'Tez-tez sorulan suallar',
                    'Çapçı Problemləri' => 'Printer bağlantısı və çap problemləri',
                    'Ağ Problemləri' => 'İnternet bağlantısı',
                    'Daxil Olma Problemləri' => 'Giriş problemləri',
                    'Məlumat Sinxronizasiyası' => 'Məlumatların sinxron edilməsi',
                    'Performans Problemi' => 'Sistemi yavaşlığı',
                    'Bilet Açmaq' => 'Texniki dəstəkə müraciət',
                ]
            ],
            [
                'name' => 'KİOSK VƏ İNTEGRASİYALAR',
                'description' => 'Kiosk qurğusu, Wolt, Yango, Bolt Food integrasyonları',
                'icon' => 'plug',
                'children' => [
                    'Kiosk Qurğusu' => 'Kiosk cihazını qurma',
                    'Kiosk İstifadəsi' => 'Kiosk cihazında satış',
                    'Wolt İntegrasiyası' => 'Wolt platforması',
                    'Yango İntegrasiyası' => 'Yango dostavka',
                    'Bolt Food İntegrasiyası' => 'Bolt Food order',
                    'API Əlaqəsi' => 'API dokumentasiyası',
                ]
            ],
        ];

        $createdCount = 0;

        foreach ($categories as $parentData) {
            $children = $parentData['children'] ?? [];
            unset($parentData['children']);

            // Parent kategoriyanı yaratma
            $slug = $this->generateSlug($parentData['name']);
            $parent = KnowledgeCategory::firstOrCreate(
                ['slug' => $slug],
                [
                    'name' => $parentData['name'],
                    'description' => $parentData['description'] ?? '',
                    'icon' => $parentData['icon'] ?? 'info-circle',
                    'sort_order' => $createdCount + 1,
                    'is_active' => true,
                ]
            );
            $createdCount++;

            // Subcategories yaratma
            $sort_order = 1;
            foreach ($children as $childName => $childDescription) {
                KnowledgeCategory::firstOrCreate(
                    ['slug' => $this->generateSlug($childName)],
                    [
                        'name' => $childName,
                        'description' => $childDescription,
                        'icon' => $parentData['icon'] ?? 'info-circle',
                        'parent_id' => $parent->id,
                        'sort_order' => $sort_order++,
                        'is_active' => true,
                    ]
                );
                $createdCount++;
            }
        }

        $this->command->info("✅ Azərbaycanca KB kateqoriyaları uğurla yaradıldı!");
        $this->command->info("📊 Cəmi kategoriya: {$createdCount}");
        $this->command->info("📌 Əsas kategoriya: 13");
        $this->command->info("📑 Alt kategoriya: " . ($createdCount - 13));
    }

    /**
     * Generate slug from Azerbaijani text
     */
    private function generateSlug(string $text): string
    {
        // Azerbaijani character mappings
        $characters = [
            'Ə' => 'e', 'ə' => 'e',
            'Ş' => 's', 'ş' => 's',
            'Ğ' => 'g', 'ğ' => 'g',
            'I' => 'i', 'ı' => 'i',
            'İ' => 'i', 'i' => 'i',
            'Ö' => 'o', 'ö' => 'o',
            'Ü' => 'u', 'ü' => 'u',
            'Ç' => 'c', 'ç' => 'c',
        ];

        $text = str_replace(array_keys($characters), array_values($characters), $text);
        $slug = Str::slug($text);

        return $slug;
    }
}
