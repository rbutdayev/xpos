# Azərbaycan POS Sistemi - Bilik Bazası Məqalələri

---

## KATEQORİYA 4: MƏHSUL İDARƏSİ

---

#### Yeni Məhsul Əlavə Etmə

### Giriş
POS sisteminə yeni məhsul əlavə etmə prosesi biznesinizin kataloquna yeni satış maddələrini daxil etməyi zəruri hala gətirən vacib prosedurdur. Bu məqalə sizə addım-addım yol göstərəcəkdir ki, məhsulları sürətlə və düzgün şəkildə sisteminə əlavə edəsiniz.

### Addım-addım Təlimat

1. **Məhsul İdarəçiliyi Bölümünə Keçid**
   - Ana menyu sağlayan panel açılır
   - "Məhsullar" seçiminə klikləyin
   - "Yeni Məhsul" və ya "+" düyməsi tapın

2. **Əsas Məlumatları Doldurma**
   - **Məhsul Adı**: Aydın, səliqəli ad daxil edin. Misalən: "Klassik Kolbasa 500qr" əvəzinə sadəcə "Kolbasa"
   - **Kategoriya**: Məhsulu aid olduğu kateqoriyanı seçin (Ərzaq, Geyim, Elektronika və s.)
   - **Təsvir**: Məhsul haqqında qısa məlumat yazın (isteğe bağlı amma faydalı)
   - **SKU Kodu**: Daxili ident nömrəsi (Misal: KOLS-500-BLK)

3. **Qiymət Məlumatları**
   - **Satış Qiyməti**: Müştərinin ödəyəcəyi final qiymət
   - **Xərcləmə Qiyməti**: Sizin ödədiyiniz qiymət (mənfəət hesablaması üçün)
   - **Endirim Qiyməti**: İsteğe bağlı (loyallıq üzvləri üçün)

4. **Stok Məlumatları**
   - **Başlanğıc Stoku**: Hazırda eləməlisiniz varsa daxil edin
   - **Minimum Stok Səviyyəsi**: Xəbərdarlıq üçün kritik rəqəm
   - **Maksimum Stok Səviyyəsi**: Sifariş limiti

5. **Vergilər və Xüsusi Ayarlar**
   - **Vergi Dərəcəsi**: Məhsulun vergi faizini seçin
   - **Anbar**: Məhsulun saxlanacağı anbarı göstərin

6. **Dəyişiklikləri Yadda Saxla**
   - Sağ üst küşədə "Yadda Saxla" düyməsini basın
   - Sistem sizə təsdiqləndirmə xəbəri göstərəcəkdir

### İpuçları və Fəndləri

- **Adlandırma Qaydasından Istifadə Edin**: Məhsul adlarında ardıcıl adlandırma sistemi istifadə edin. Misal: "Cəld Yemə - Burger - Klassik" səliqəli bir struktur yaradır
- **Barkod Avtomatlaşması**: Əlavə etmə zamanı sistem avtomatik barkod yarada bilər. Sonra onu redaktə edə bilərsiniz
- **Kütləvi Əlavə Etmə**: Yüzlərlə məhsul varsa, CSV faylından idxal funksiyasını istifadə edin
- **Məhsulların Fotoğrafları**: Əlavə etmə zamanı dərhal fotoğraf əlavə etməyi unutmayın (ehtiyat)
- **Cəld Kategori Yaratma**: Əgər kateqoriya yoxdursa, direkt olaraq yeni kateqoriya yarada bilərsiniz

### Ümumi Problemlər

**Problem 1: "SKU Kodu Artıq Mövcuddur"**
- **Həlli**: Eyni SKU kodu ilə başqa məhsul mövcuddur. Unikal kod istifadə edin
- Sisteminizin əlində olan kodları "Məhsullar" siyahısında yoxlayın

**Problem 2: Məhsul Yadda Saxlanmır**
- **Həlli**: Bütün tələb olunan sahələri doldurmağınızı yoxlayın (ad, kateqoriya, qiymət)
- Mavi rənglə işarələnmiş sahələr məcburi sahələrdir

**Problem 3: Qiymət Göstərilmir**
- **Həlli**: Səhv valyuta seçilmiş ola bilər. "Sistem Ayarları"nda valyutanı yoxlayın

---

#### Məhsul Məlumatlarını Redaktə Etmə

### Giriş
Satış prosesində məhsul məlumatları dəyişə biləcək (qiymət dəyişikliyi, təsvir yenilənməsi, anbar dəyişikliyi və s.). Bu məqalə mövcud məhsullarınızı necə uyğunlaştıracağınızı göstərəcəkdir.

### Addım-addım Təlimat

1. **Redaktə Etmək İstədiyiniz Məhsulu Tapma**
   - "Məhsullar" bölümünə daxil olun
   - Siyahıdan məhsulu axtarış çubuğu vasitəsilə tapmağa çalışın
   - Məhsulun adını məhsuluların sırasında tapıp, onun üzərinə klikləyin

2. **Redaktə Rejimini Başlat**
   - Məhsul detalları açıldıqdan sonra sağ üst küşədə "Redaktə Yap" düyməsini tapın
   - Bir sıra redaktə edilə biləcək sahələr aktivləşəcəkdir

3. **Dəyişiklik Edin**
   - Dəyişmək istədiyiniz hər sahəni yenilənin
   - **Qiymət Dəyişikliyi**: Satış və xərcləmə qiymətlərini yenilənin
   - **Təsvir**: Məhsul təsvirini əlavə edin və ya yeniləyin
   - **Anbar Məlumatları**: Anbara aid ayarları dəyişin
   - **Vergi Dərəcəsi**: Vergi səviyyəsini tənzimləyin

4. **Dəyişiklik Tarixini Görün**
   - "Tarix" sekmesində kimin nə zaman dəyişdirdiğini görmək mümkündür
   - Audit yolu üçün faydalıdır

5. **Yadda Saxla**
   - Bütün dəyişiklikləri verdikdən sonra "Yadda Saxla" basın

### İpuçları və Fəndləri

- **Qiymət Tarix**: Qiymət dəyişiklikləri siyahıda "Tarix" sekmesində qeyd edilir. Bu, nə vaxt qiymət dəyişdirildiyini izləməyə kömək edir
- **Kütləvi Redaktə**: 10+ məhsulun qiymətini dəyişmək lazımdırsa, "Kütləvi Redaktə" seçiminə klikləyin
- **Arxiv**: Köhnə məhsulları silmədən, "Arxiv" seçiminə köçürə bilərsiniz
- **Qayta Aktivləşdirmə**: Əgər məhsulu silinmiş hesab etsəniz, "Arxiv"dən geri qaytara biləsiniz

### Ümumi Problemlər

**Problem 1: "Bu Məhsul Cəld Satışda Istifadə Ediliyor"**
- **Həlli**: Satış prosesində qeyd olunan məhsullar dərhal redaktə edilə bilməz. Satışı bitirdikdən sonra yenidən cəhd edin

**Problem 2: Qiymət Dəyişikliyi Göstərilmir**
- **Həlli**: Brauzer kəşini xali edin (Ctrl+Shift+Delete) və yenidən daxil olun

**Problem 3: Anbarlar Görünmür**
- **Həlli**: Sistem Ayarlarında "Çoxlu Anbar" seçilməmişdir. Admin seçimindən bunu aktivləşdirin

---

#### Məhsul Variantları

### Giriş
Bir məhsulun fərqli rəngləri, ölçüləri, dadları və ya variantları olduqda, bu seçimləri sisteminiz daxilində idarə etmə zərurəti yaranır. Məhsul variantları sayəsində siz bir məhsulu bir neçə seçimə bölmədən, ayrı stoklar və qiymətlərlə idarə edə bilərsiniz.

### Addım-addım Təlimat

1. **Variantlı Məhsul Seçmə**
   - Variantlar olacaq məhsulu açın (Misal: T-shirt)
   - "Redaktə Yap" düyməsini basın

2. **Variant Qrupu Yaratma**
   - "Variantlar" sekmesini tapın
   - "Yeni Variant Qrupu" düyməsini basın
   - **Variant Tipi**: "Ölçü", "Rəng", "Aromataziqlı", "Bədən" kimi seçin

3. **Variant Seçimləri Əlavə Etmə**
   - Misal: Ölçü variantı üçün "S, M, L, XL" əlavə edin
   - Hər seçim üçün:
     - **Ad**: "Kiçik" (S)
     - **SKU Əlavəsi**: "S" kodu əlavə olunacak (TSHRT-001-S)
     - **Qiymət Fərqi**: Əgər "XL" daha baha olarsa, fərq əlavə edin (+5 AZN)
     - **Stok**: Hər variant üçün ayrı stok

4. **Bir Neçə Variant Kombinasiyası**
   - Rəng + Ölçü variantları istifadə etmişsinizsə:
   - Sistem avtomatik kombinasiyaları yaratacaq (Misal: Qırmızı-S, Qırmızı-M, Mavi-S və s.)

5. **Variantları Yadda Saxla**
   - "Yadda Saxla" düyməsini basın

### İpuçları və Fəndləri

- **Fərqli Ölçülər Üçün Ayrı Qiymətlər**: Əgər "XL" ölçü daha istehsal baha başa gəlirsə, bu fərqi etiraz edə bilərsiniz
- **Rəng Kodu Göstərin**: Rəng variantı yaratarkən, rəngin HTML kodunu (misal: #FF5733) əlavə edəsi, cəld identifikasiya olunur
- **Variantlı Məhsullar Satış Sırasında**: Satış zamanı müştəri birinci əsas məhsulu seçər, sonra variantı seçər
- **Stok Sayılması**: Hər variant ayrıca stok sayılır, buna göre inventar idarəçiliyi daha əsaslı olur

### Ümumi Problemlər

**Problem 1: Kombinasiyalar Yaranmır**
- **Həlli**: Hər variant qrupunda ən azı 2 seçim lazımdır. Seçimlərə daxil olub yoxlayın

**Problem 2: Variantlar Satış Zamanı Göstərilmir**
- **Həlli**: Variantları "Yadda Saxla"madan brauzer kəşini xali edin

**Problem 3: Variantı Silmə**
- **Həlli**: Variantın sekmesində "Sil" düyməsi (çöp qutusu) variantı silər. Diqqətli olun!

---

#### Qiymət Təyini

### Giriş
Məhsullar üçün doğru qiymətləndirmə strategiyası biznesinizin rentabel olmasının açarıdır. POS sistemi müxtəlif qiymətləndirmə seçimləri təqdim edir - klassik satış qiyməti, endirim, loyallıq qiyməti və s.

### Addım-addım Təlimat

1. **Əsas Qiymətləndirmə**
   - Məhsulu açın və "Redaktə Yap"a basın
   - **Xərcləmə Qiyməti**: Məhsulu satıcıdan nə qiymətə aldığınız
   - **Satış Qiyməti**: Müştərinin ödəyəcəyi qiymət
   - Sistem avtomatik mənfəət marjasını hesablayacaqdır

2. **Endirim Qiyməti Tətbiq Etmə**
   - Bəzi tətkilər üçün endirimli qiymət tətbiq edə bilərsiniz
   - "Endirim Qiyməti" sahəsinə xüsusi qiymət daxil edin
   - Misal: Normal 50 AZN, Endirim 40 AZN

3. **Loyallıq Qiyməti**
   - "Loyallıq Qiyməti" aktivləşdirin
   - Loyallıq üzvləri bu qiymətdən faydalanacaqdırlar
   - Misal: Normal 100 AZN, Loyallıq 85 AZN

4. **Kütləvi Qiymət Dəyişikliyi**
   - Bütün məhsulların qiymətini % artırmaq lazımdırsa:
   - "Məhsullar" siyahısında "Kütləvi Redaktə" seçin
   - Bütün məhsulları seçib, "Qiymət +%" dən istifadə edin

5. **Zaman-Əsaslı Qiymətləndirmə**
   - Müəyyən tarixdə qiymət dəyişikliyi planlaşdırırsınızsa:
   - "Qiymət Cədvəli" sekmesində gələcək tarixə qiymət daxil edin
   - Sistem avtomatik olaraq bu tarixə qiyməti dəyişəcəkdir

### İpuçları və Fəndləri

- **Marj Hesabı**: Mənfəət marjı = (Satış Qiyməti - Xərcləmə Qiyməti) / Satış Qiyməti × 100. Normal təbəqə 30-50% dir
- **Psikoloji Qiymətləndirmə**: 99, 95, 90 ilə bitən qiymətlər daha cazibədir (50 AZN əvəzinə 49,99 AZN)
- **Təhliflər Üçün Qiymət**: Mövsümi satışlar üçün promos dəstək edən tarix-əsaslı qiymətlər istifadə edin
- **Yarışçı Analizi**: Yarışçıların qiymətlərini izləyib, kənarlaşdırılmış qiymətlər təyin edin

### Ümumi Problemlər

**Problem 1: Endirim Qiyməti Satışda Göstərilmir**
- **Həlli**: Endirim qiyməti aktiv olması lazım olabilir. "Sistem Ayarları"nda yoxlayın

**Problem 2: Loyallıq Qiyməti İstifadə Edilmir**
- **Həlli**: Müştəri loyallıq proqramına daxil olmalıdır. Müştəri profilinə baxın

**Problem 3: Qiymət Dəyişikliyi Gözlənilən Tarixdə Başlamadı**
- **Həlli**: Sistem saatı doğru olmalıdır. Sistem saatını yoxlayın

---

#### Barkod Yaratma

### Giriş
Barkodlar hızlı satış, doğru inventar idarəçiliyi və müştəri deneyimi üçün vacibdir. POS sistemi avtomatik barkodlar yarada bilər və ya mövcud barkodları idxal edə bilərsiniz.

### Addım-addım Təlimat

1. **Məhsul Barkodu Yaratma**
   - Məhsulu açın
   - "Redaktə Yap"a basın
   - "Barkod" sekmesini tapın

2. **Avtomatik Barkod Yaratma**
   - "Avtomatik Barkod Yaratma" düyməsini basın
   - Sistem EAN-13 standart barkodu yaratacaqdır
   - Barkod sisteminiz üçün automatik dəyişir

3. **Manuel Barkod Daxil Etmə**
   - Əgər artıq barkod varsa (məhsul qutusunda), daxil edə bilərsiniz
   - "Barkod Sahəsi"ndə barkod rəqəmlərini yazın
   - **Barkod Tipi**: EAN-13, UPC-A, CODE128 və s. seçin

4. **Variant Barkodları**
   - Əgər məhsulin variantları varsa (rəng, ölçü):
   - Hər variant üçün ayrı barkod yaratılır (avtomatik əlavə)
   - Misal: Ana məhsul barkodu 5901234123451, Qırmızı-S variantı 5901234123452 və s.

5. **Barkod Çap Etmə**
   - Sağ üst küşədə "Barkod Çap Et" düyməsini basın
   - Çap seçimləri:
     - **Barkod Etiket Çap Etmə**: Etikət çapına uyğun format
     - **Siyahı Çap Etmə**: Bir neçə məhsulun barkod siyahısı

6. **Barkod Skaneri İlə Test Etmə**
   - Barkod çapı etdikdən sonra:
   - Cihaza barkod skaneri bağlayın
   - Barkodu skan edin - sisteminiz məhsulu tanıyacak

### İpuçları və Fəndləri

- **Barkod Standartları**: EAN-13 beynəlmilləl standartdır (13 rəqəm). Azərbaycanda ən çox istifadə olunan standartdır
- **Davamlı Barkod Seriyası**: Barkodları ardıcıl şəkildə yaradırsınızsa, sistem bunu avtomatik olaraq artıracaqdır
- **Barkod Skan Sürəti**: Barkod skaneri 1-3 saniyə ərzində skan edərsə, sistemə tanış olacaq
- **Barkod Etiketləri**: Termo etiketçi (barcod printer) istifadə edin. Məhsul üstündə durğun, barkod oxunabilir olmalıdır

### Ümumi Problemlər

**Problem 1: "Bu Barkod Artıq Mövcuddur"**
- **Həlli**: Sistem duplikat barkodları qəbul etmir. Başqa barkod yaratın və ya mövcud məhsulu birləşdirin

**Problem 2: Barkod Skan Etmə Zamanı Səhv Məhsul Açılır**
- **Həlli**: Barkod skaneri yanlış barkodu skan etmiş ola bilər. Barkodu yenidən çap edin

**Problem 3: Barkod Çap Olmur**
- **Həlli**: Çap cihazının bağlanmasını yoxlayın. Çap sürücüsünü yükləyin

---

#### Məhsul Şəkilləri Yükləmə

### Giriş
Məhsulların fotoğrafları müştəri deneyimini və satış gücünü əhəmiyyətli dərəcədə artırır. Yüksək keyfiyyətli şəkillər məhsulları ayırd etməyi və cəlb etməyi asanlaşdırır.

### Addım-addım Təlimat

1. **Məhsul Açma və Redaktə Rejimi**
   - Məhsulu siyahıdan tapın
   - "Redaktə Yap" düyməsini basın

2. **Şəkil Bölümünü Tapma**
   - "Şəkillər" sekmesini açın
   - Mövcud şəkillər siyahısını görmüş olacaqsınız

3. **Birinci (Ana) Şəkil Yükləmə**
   - "Ana Şəkil Yüklə" düyməsini basın
   - Kompyuterinizdən şəkili seçin
   - Şəkil otomatik sayt üzərində görünəcəkdir

4. **Əlavə Şəkillər Yükləmə**
   - Məhsulun başqa açılardan şəkilləri yükləyin
   - "Şəkil Əlavə Et" düyməsini basın
   - Bir neçə şəkil yüklə (3-5 şəkil ideal sayıdır)

5. **Şəkil Sıralaması**
   - Şəkilləri sürüyərək yenidən sıralayın
   - İlk şəkil alışqan müştəri gözüne ilk görüncək

6. **Şəkil Silmə**
   - Əgər şəkil xoş gəlməzlərsə:
   - Şəkilin üzərinə sağ klikləyin
   - "Sil" seçin

7. **Dəyişiklikləri Yadda Saxla**
   - Bütün şəkilləri yükləndikdən sonra "Yadda Saxla" basın

### İpuçları və Fəndləri

- **Şəkil Ölçüsü**: Ən azı 800×800 piksel olmalıdır. İdeal ölçü 1200×1200 pikseld ir
- **Faylın Formatı**: JPG və ya PNG formatında yüklənə bilər. PNG fonda şəffaflıq dəstəkləyir
- **Fon**: Beyaz və ya aydın fon ən professional görsənəkdir
- **Şəkil Açılarından İstifadə Edin**: Məhsulun ön, arxa, üst, yan açıları göstərin
- **Məhsul Boyutu**: Qutunun üzərində, etiketində olan məlumatlar aydın olmalıdır
- **İşıqlandırma**: Doğru işıqlandırma ilə şəkillərin keyfiyyəti əhəmiyyətli dərəcədə artır

### Ümumi Problemlər

**Problem 1: "Şəkil Çox Böyükdür"**
- **Həlli**: Şəkili kompresə edin. Kompresiya proqramları (ImageOptim, TinyPNG) istifadə edin
- **Maksimum Ölçü**: 5 MB-dan çox şəkil yüklənə bilməz

**Problem 2: Şəkil Yüklündükdən Sonra Əymək Görünür**
- **Həlli**: Şəkil formatı qeyri-standart ola bilər. JPG-ə çevirin

**Problem 3: Şəkillər Cəld Yüklənirlər**
- **Həlli**: İnternet sürəti yavaş ola bilər. Başqa vaxt cəhd edin və ya daha sürətli internet istifadə edin

**Problem 4: Mobil Cihazda Şəkillər Göstərilmir**
- **Həlli**: Sistem ayarlarında "Mobil Görünüşü" aktivləşdirin

---

## KATEQORİYA 5: İNVENTAR VƏ ANBAR

---

#### Stok Sayılması

### Giriş
Stok sayılması (inventar) biznesiniz üçün kritik prosesdir. Təqdim olunan stoku real stokla müqayisə etmək, hissədüşmə və səhvləri aşkar etmələr üçün lazımdır. POS sistemi stok sayılmasını sadələşdirmişdir.

### Addım-addım Təlimat

1. **Stok Sayılmasını Başlatma**
   - "İnventar" bölümünə daxil olun
   - "Yeni Stok Sayılması" düyməsini basın

2. **Sayılma Şəraiti Təyin Etmə**
   - **Ad**: "Yanvarı Uyğunlaşdırılması" kimi adlandırın
   - **Anbar**: Sayılma hedef anbarı seçin (əgər çoxlu anbar varsa)
   - **Tarix**: Sayılmanın keçirildiyi tarix (adi hallarda bugün)
   - **Qeydiyyat**: Yorum əlavə edin (misal: "Fiziki sayılma sonrası")

3. **Məhsulları Sayılma Formasına Əlavə Etmə**
   - **Üsul 1 - Manual**: "Məhsul Əlavə Et" basın, hər məhsulu ayrı seçin
   - **Üsul 2 - Skan**: Barkod skaneri ilə barkodları skan edin. Sistem özünü əlavə edəcəkdir
   - **Üsul 3 - Siyahı Idxal**: Öncə hazırlanmış CSV faylını idxal edin

4. **Həqiqi Saymakları Daxil Etmə**
   - Hər məhsul üçün:
     - **Sistem Stoku**: Sistemdə qeyd olunmuş rəqəm (otomatik doldurulur)
     - **Həqiqi Stok**: Duzənə gələn məhsul miqdarı
     - **Fərq**: Sistem avtomatik hesaplayacaq

5. **Fərqləri Analiz Etmə**
   - Əgər fərq mənfi olarsa (həqiqi < sistem), hissədüşmə olmuş
   - Əgər fərq müsbət olarsa (həqiqi > sistem), əlavə məhsul tapılmış
   - Qeydiyyat bölümünə səbəb yazın (dəyən paket, tərəzidə səhv və s.)

6. **Sayılmanı Başa Vurma**
   - Bütün məhsulları sayıb, fərqləri gördükdən sonra:
   - "Tamamla" düyməsini basın
   - Sistem stokları həqiqi rəqəmlərə uyğunlaşdıracaqdır

### İpuçları və Fəndləri

- **Dövri Sayma**: Ayda bir dəfə tam sayılma, həftəda bir dəfə cəlləm kategori sayılması tərəfindən məqbul hesab edilir
- **Sayma Cədvəlini Çap Et**: Sayılmadan əvvəl cədvəli çap edin. Sahədə işçilər qələmlə yazacaqlar, sonra daxil olarsa daha düzgün olur
- **Barkod Skaneri Istifadə Edin**: Manual girmə səhvlərə səbəb olur. Skan etmə daha sürətli və dəqiqdir
- **İki Nəfərlik Tim**: Bir nəfər sayar, bir nəfər sistemi doldurur

### Ümumi Problemlər

**Problem 1: "Sistem Stoku Göstərilmir"**
- **Həlli**: Məhsul satış cədvəlində aktiv olmayabilir. Məhsulu öncə aktivləşdirin

**Problem 2: Stok Sayılması Tamamlanmadı**
- **Həlli**: Bəzi məhsullar doldurulmamışdır. Cədvəli bütün məhsullar üçün yoxlayın

**Problem 3: Sayma Tamamlandıqdan Sonra Fərq Çox Böyükdür**
- **Həlli**: İkinci sayılma keçirin. Fərqin səbəbini araştırın (hissədüşmə, mal daxil olmasa)

---

#### Anbarlar Arasında Transfer

### Giriş
Əgər şirkətiniz bir neçə anbarla operasyon keçirərsə, məhsulları anbarlar arasında transfer etməniz lazım ola biləcəkdir. Transfer prosesi stokları idarə etməyi və tələbi ödəməyi asanlaşdırır.

### Addım-addım Təlimat

1. **Transfer Formasını Açma**
   - "İnventar" bölümünə daxil olun
   - "Anbarlar Arası Transfer" seçin
   - "Yeni Transfer" düyməsini basın

2. **Transfer Məlumatlarını Doldurma**
   - **Transfer Nömrəsi**: Sistem avtomatik verir
   - **Mənbə Anbarı**: Transfer edən anbar (Misal: Baku Anbarı)
   - **Hədəf Anbarı**: Transfer alan anbar (Misal: Ganja Anbarı)
   - **Tarix**: Transfer keçirildiyi tarix
   - **Səbəb**: Transfer səbəbini yazın (misal: "Tələb yüksəkdir")

3. **Transfer Məhsullarını Seçmə**
   - "Məhsul Əlavə Et" basın
   - Anbardan çıxacak məhsulu seçin
   - **Miqdar**: Transfer olunacak miqdar daxil edin

4. **Bir Neçə Məhsulun Transferi**
   - Lazım olan bütün məhsulları əlavə edin
   - Hər məhsulu ayrıca seçmə lazım deyil - siyahıdan direkt seçə bilərsiniz

5. **Transfer Onaylaması**
   - Bütün məhsulları seçdikdən sonra:
   - "Başla" düyməsini basın
   - Transfer edən anbardan məhsullar çıxacaq
   - Transfer alan anbaraya məhsullar əlavə olunacaq

6. **Transfer Tarixini Görəmə**
   - "Transfer Tarixçəsi" sekmesində bütün transferləri görmək mümkündür

### İpuçları və Fəndləri

- **Transfer Zəhmətkeşliyi**: Böyük transferlər üçün aparıcı səbəbini yazın
- **Transfer Vəsiqəsi**: Transfer başlayanda, sistem səndləş sənəd yaradır. Bunu çap edin
- **Mobil Transferi**: Transfer sırasında sistemi aktuallaştırmak lazımdırsa, mobil cihazdan yoxlayın
- **Kütləvi Transfer**: Bir dəfəlik 20+ məhsul transfer etsəniz, CSV forması istifadə edin

### Ümumi Problemlər

**Problem 1: "Mənbə Anbarında Yetərli Stok Yoxdur"**
- **Həlli**: Anbarda transfer etmək istədiyiniz məhsulun kifayət stoku yoxdur. Daha az miqdar seçin

**Problem 2: Transfer Tamamlanmadı**
- **Həlli**: Hədəf anbarı aktiv olmayabilir. Sistem ayarlarında anbarı yoxlayın

**Problem 3: Transfer Hədəf Anbarında Görünmür**
- **Həlli**: Transfer edən anbar, hədəf anbarından fraqmenti olmaya biləcəyinə görə 1-2 gün çəkə biləcəkdir. Sonra yoxlayın

---

#### Mal Qəbulu

### Giriş
Tədarəçidən gələn malları qəbul etmə prosesi düzgün şəkildə yapılmalıdır. POS sistemi mal qəbulusu izləməyə, gözləmə sənədlərinə baxmağa və stokları yeniləməyə kömək edir.

### Addım-addım Təlimat

1. **Sifariş Oluşturma və İzləmə**
   - "İnventar" bölümündən "Sifariş" bölümünə daxil olun
   - "Yeni Sifariş" düyməsini basın

2. **Sifariş Məlumatlarını Doldurma**
   - **Tədarəçi**: Sifariş keçildiyi tədarəçini seçin
   - **Sifariş Nömrəsi**: Sifarişə aid nömrə (tədarəçi tərəfindən verilən)
   - **Tarix**: Sifariş keçirildiyi tarix
   - **Gözlənilən Çatış**: Mallın ne zaman gəlməsi gözləniir
   - **Qeydiyyat**: Sifariş haqqında notlar

3. **Sifariş Məhsullarını Əlavə Etmə**
   - "Məhsul Əlavə Et" basın
   - Sifarişə daxil olacaq məhsulları seçin
   - **Sifariş Miqdarı**: Neçə sayda?
   - **Vahid Qiyməti**: Tədarəçi qiyməti
   - **Cəmi Qiymət**: Sistem avtomatik hesaplayacaq

4. **Sifariş Onaylaması**
   - Bütün məhsullar seçildikdən sonra:
   - "Sifariş Yolla" basın
   - Sistem sifariş vəsiqəsi yaradacaqdır

5. **Mal Qəbulusu**
   - Mal tədarəçidən çatdıqda:
   - Qəbul sənədini açın
   - "Mal Qəbul Et" basın

6. **Qəbul Sırasında Məhsulları Yoxlama**
   - Gələn mal üstündə:
     - **Eyni Miqdar**: Sifariş edilən miqdarla eyni mi?
     - **Keyfiyyət**: Məhsullar sağlam mı?
     - **İnfraraktozlari**: Sən, ekspirasyon tarixi və s.

7. **Stoku Yeniləmə**
   - Qəbul prosesinə daxil olan məhsullar:
   - Sistem avtomatik olaraq anbar stokuna əlavə olunacaq
   - Mal qəbulusu tamamlandıqdan sonra sistem güncəllənəcəkdir

### İpuçları və Fəndləri

- **Sifariş Şablonları**: Daimi sifariş edən məhsullar üçün şablon yaratın
- **Tədarəçi Qiyməti Farqı**: Qəbul zamanı qiymət fərq olmuşsa, qeydiyyatda yazın
- **İki Nəfərli Qəbul**: Bir nəfər sayar, bir nəfər sistemi doldurur
- **Mal Qəbulusu Vəsiqəsi**: Qəbul tamamlandıqdan sonra vəsiqə çap edin, imza xanası düşün

### Ümumi Problemlər

**Problem 1: "Gələn Mal Sifariş Edildiyindən Çox Olar"**
- **Həlli**: Qəbul sırasında əlavə miqdarı əlavə edin. Sistem fərqini izləyəcəkdir

**Problem 2: Sifarişin Parçası Eksik Olarsa**
- **Həlli**: "Qismən Qəbul" seçin. Eksik olan məhsulları ayrı Not edin

**Problem 3: Qiymət Sifarişdən Fərqlidir**
- **Həlli**: Qəbuluya qiymət korreksiyasını əlavə edin. Muhasəbə bölümünə bildirin

---

#### Tez Skan İlə Inventar Sayılması

### Giriş
Hızlı sayılma metodu, sayımı skan ederek daha sürətli şəkildə bitirmənin yolüdür. Bu əsasən mağazalarda istifadə olunur.

### Addım-addım Təlimat

1. **Hızlı Sayılmaya Başlama**
   - "İnventar" bölümündən "Hızlı Sayılma" seçin
   - "Yeni Sayılma Seansı" basın

2. **Cihaz Üzərinde Barkod Skanı**
   - Mobil cihazda skan uygulamasını açın
   - Mağazadaki məhsulların barkodlarını skan edin
   - Sistem otomatik olaraq hər skan edilən məhsulun sayını artıracaq

3. **Cihazda Daxili Sayılma**
   - Skan sırasında məhsulun sayı ekranda göstərilir
   - Eyni barkodu 3 dəfə skan etsəniz, sayı 3 olur
   - Səhv etsəniz, məhsulun üzərinə klikləyib, saydığınız rəqəmi ləğv edə bilərsiniz

4. **Sayılmanı Tamamlama**
   - Bütün məhsulları skan etdikdən sonra:
   - "Tamamla" düyməsini basın
   - Sistem stok sayılma vəsiqəsini yaradacak

5. **Sistemlə Müqayisə**
   - Sayılmış məhsullar sistem stoku ilə müqayisə olunacak
   - Fərqlər göstəriləcəkdir
   - Fərqləri qəbul edin

### İpuçları və Fəndləri

- **Skan Sürəti**: Hər barkodu maksimum 1 saniyəyə skan edin
- **Döyüş Səsləndirməsi**: Skan edildikdə sistem "bip" səsini verərək dəqiqliyi təmin edir
- **Barkod Ordusu**: Mağazanın çox hissəsi varsa, ekipaya bölün. Hər tim ayrı bölüm skan edir
- **Sayılma Yardımı**: Hər barkod skan edilərkən, sayı və məhsul adını gözükmə bölümündə yoxlayın

### Ümumi Problemlər

**Problem 1: "Barkodlar Skan Olmur"**
- **Həlli**: Skan cihazının bağlanmasını yoxlayın. Barkod etiketinin zədələnməmiş olduğundan əmin olun

**Problem 2: Səhv Məhsul Skan Edildi**
- **Həlli**: Məhsulin sırasında saydığınız rəqəmi ləğv edin, düzgün məhsulu skan edin

**Problem 3: Sayılma Yarıda Qaldı**
- **Həlli**: Seansı yadda saxla ve sonra davam et. Sistem məlumatları saxlayacaqdır

---

#### Az Stok Xəbərdarlıqları

### Giriş
Məhsulun stoku azaldığında, yeni sifarişi vaxtında etməniz lazımdır. POS sistemi siz kritik stok səviyyəsinə çatdıqda avtomatik xəbərdarlıq verir.

### Addım-addım Təlimat

1. **Minimum Stok Səviyyəsi Təyin Etmə**
   - Məhsulu açın
   - "Redaktə Yap" basın
   - "İnventar" sekmesini tapın
   - **Minimum Stok**: "Bu rəqəm təyin edin (misal: 10 vahid)"
   - **Maksimum Stok**: Sifariş etmək lazım olan maksimal rəqəm (misal: 50 vahid)

2. **Xəbərdarlıq Həddi**
   - Sistem hər gün minimum stokla müqayisə edir
   - Stok minimum səviyyəsinə çatdıqda:
     - Sistem xəbərdarlıq verir
     - İnventar siyahısında xəbərdarlıq göstərilir

3. **Xəbərdarlıqları Görəmə**
   - "İnventar" bölümündən "Az Stok" seçin
   - Kritik stoku olan bütün məhsulları görmüş olacaqsınız
   - Hər məhsulun yanında:
     - Cari stok
     - Minimum stok
     - Fərq

4. **Avtomatik Email Xəbərdarlığı**
   - Sistem ayarlarında email seçin
   - Her gün kritik məhsulların email xəbərdarlığını alın
   - Müdür, anbar müdürü vb. email göndərin

5. **Sifarişin Otomatikaşdırması**
   - "Otomatik Sifariş" aktivləşdirin (əgər mövcuddursa)
   - Sistem kritik stoklu məhsulları avtomatik sifariş edəcəkdir

### İpuçları və Fəndləri

- **Minimum Stok Hesablaması**: Orta gündəlik satış × Tədarəçi gəlişi günü = Minimum Stok
  - Misal: Günə 10 satış, gəliş 7 günü, Minimum = 10 × 7 = 70
- **Maksimum Stok**: Depo məkanı ve məhsulun sorğulanılığına görə dəyişir
- **Siyasbiyətçi Görmə**: Tələb azalan məhsullar üçün minimum stoku azaldın
- **Əvvəlcə Sayılma**: Yeni məhsullar əlavə etdikdən sonra, ilkin sayılma etkiniz

### Ümumi Problemlər

**Problem 1: "Xəbərdarlıq Verilmiyi Olmasına Baxmayaraq, Stok Yetərlidir"**
- **Həlli**: Yeni mal qəbul edilmişdir. Sayılma güncəllənmişdir. Minimum stoku artırın

**Problem 2: Çox Sık Xəbərdarlıq Gəlir**
- **Həlli**: Minimum stok çox aşağı təyin edilmişdir. Təyin etdiyiniz rəqəmi yüksəltsin

**Problem 3: Email Xəbərdarlığı Gəlmir**
- **Həlli**: Email ünvanlarını sistem ayarlarında yoxlayın. Email aktivləşdirildiyindən əmin olun

---

#### Çoxlu Anbar İdarəçiliyi

### Giriş
Eğer şirkətiniz bir neçə mağaza ve ya anbar operasyon keçirərsə, çoxlu anbar idarəçiliyi zəruri hala gəlir. POS sistemi fərqli anbarlardakı stokları izləməyə, transferləri idarə etməyə ve konsolidə raporta baxa biləcəkdir.

### Addım-addım Təlimat

1. **Anbarlar Səviyyəsində Aktivləşdirmə**
   - Sistem Ayarları açın
   - "İnventar" sekmesini tapın
   - "Çoxlu Anbar" aktivləşdirin (On/Off)

2. **Anbarları Yaratma**
   - "Anbarlar" sekmesində "Yeni Anbar" basın
   - **Anbar Adı**: "Baku Mərkəz Anbarı" kimi
   - **Anbar Kodu**: Unikal kod (BAKU01)
   - **Ünvan**: Anbarın tam ünvanı
   - **Tel**: Anbar təlsiz nömrəsi
   - **Müdür**: Anbardan məsul şəxs

3. **Məhsulları Anbarlarla Əlaqələndirmə**
   - Məhsulu açın
   - "Redaktə Yap" basın
   - "Anbar" sekmesini tapın
   - Hər anbar üçün ayrı stok daxil edin

4. **Anbar-Mühasir Raporta**
   - "Raporlar" bölümündən "Anbar Stok Üstü" basın
   - Tüm anbarlardakı cəmi stoku görün
   - Anbarlara görə filtrləyə bilərsiniz

5. **Anbarlar Arasında Transfer**
   - (Bax: "Anbarlar Arası Transfer" məqaləsi)

6. **Anbara Göz Atma**
   - "İnventar" > "Anbarlar" seçin
   - Hər anbarın stok detaylarını görün
   - Xəbərdarlıqları ana görmə görmün

### İpuçları və Fəndləri

- **Anbar Müdürlüyü**: Hər anbarın müdürünü təyin edin. O şəxs o anbardan məsuldur
- **Konsolidə Raporta**: CEO/Sahibinin tüm anbarlardaki cəmi stoku görmədə fayda var
- **Anbar Transferləri**: Tələb az olan anbardan, tələb çox olan anbaraya transfer edin
- **İntegrasiyalı Satış**: Birinci anbar stoku tükəndisə, sistemin ikinci anbardan satması mümkün dəyil (müəyyən ayardan sonra)

### Ümumi Problemlər

**Problem 1: "Anbarlar Göstərilmir"**
- **Həlli**: Sistem ayarlarında "Çoxlu Anbar" aktivləşdirillmiş olduğundan əmin olun

**Problem 2: Məhsulun Stoku Anbarlar Arasında Sıfırlandı**
- **Həlli**: Transfer sxəmasında xəta olmuşdur. Transfer tarixçəsini yoxlayın

**Problem 3: İki Anbardan Eyni Məhsul Satılmasında Çətinlik**
- **Həlli**: Sistem tərəfindən bir anbardan satış tamamlandıqda, ikincisi seçilmir (Beynəlmilləl)

---

#### Anbar Müdürü Rolu

### Giriş
Anbar müdürü rolu, anbar əməkdaşlarının belə təkamül edənə və yetkinliklərə borc olması üçün zəruri rollardan biridir. Bu məqalə anbar müdürünün vəzifələrini və POS sistemindəki rolunu açıqlar.

### Addım-addım Təlimat

1. **Anbar Müdürü Yaratma**
   - "İstifadəçilər" bölümündən "Yeni İstifadəçi" basın
   - **Ad**: Müdürün tam adı
   - **Email**: Müdürün email ünvanı
   - **Rol**: "Anbar Müdürü" seçin
   - **Anbar**: Müdürlüyünü yapacağı anbarı seçin

2. **Anbar Müdürünün Səlahiyyətləri**
   - Sistem otomatik aşağıdakı səlahiyyətləri verir:
     - Stok sayılması keçirmə
     - Mal qəbul etmə
     - Anbarlar arası transfer
     - İnventar raporta baxma
     - Xəbərdarlıqları görəmə
   - Satış kəsid etməyə dəstək (əgər ayarlandıysa)

3. **Anbar Müdürü Ayarları**
   - Müdür üçün dashboard:
     - "İnventar" bölümündən hər şeyi görmə
     - Diğer anbarlara nəzarət etməyə dəstək yoxdur (sistem digər anbarı gizlədi)

4. **Anbar Müdürü Raporta**
   - "Raporlar" bölümündən:
     - Anbarın stok raporta (sadəcə kənd anbarını)
     - Mal qəbulunun tarixçəsi
     - Transferlərin qeydiyyatı
     - Az stok xəbərdarlıqları

5. **Anbar Müdürünün Sorumlulukları**
   - **Günlük Sayılma**: Cəll əmsalı kategorisinin sayılması
   - **Mal Qəbulu**: Tədarəçidən gələn mallar qəbul etmə
   - **Transfer İcraası**: Başqasından gələn transferi qəbul etmə
   - **Raporta**: Başqa müdürlərə anbar durumunu raporta verməsi

### İpuçları və Fəndləri

- **Başlangıç Açılışı**: Anbar müdürü öncə "Anbar Başlangıç Sayılması" keçirməlidir
- **Günlük Kontrolu**: Sistem her gün minimum stoku kontrol edir. Anbar müdürü bu məlumata baxmalıdır
- **Transfer Prosesi**: Transferdən əvvəl, anbar müdürü hazırlamışdır
- **İki Anbar Müdürü**: Böyük anbarlar 2-3 müdürü ola bilər

### Ümumi Problemlər

**Problem 1: "Anbar Müdürü Başqa Anbarı Görür"**
- **Həlli**: Sistem ayarlarında "Anbar Məcburlama" aktivləşdirin

**Problem 2: Anbar Müdürü Tədarəçi Əlavə Edə Bilməz**
- **Həlli**: Bu səlahiyyət müdür rolu üçün avans sayılmır. Admin etməlidir

**Problem 3: Anbar Müdürünün Raporta Sınırlanmışdır**
- **Həlli**: Tamamilə normal - anbar müdürü sadəcə öz anbarının raporta görməlidir

---

## KATEQORİYA 6: MÜŞTƏRİ İDARƏSİ

---

#### Müştəri Profili Yaratma

### Giriş
Müştəri profilləri POS sisteminizin əsasıdır. Doğru müştəri məlumatları, loyallıq proqramı takibi, borç idarəçiliyi və rəğbət analizində çox önemlidir. Bu məqalə müştəri profili yaratmanın düzgün yolunu göstərəcəkdir.

### Addım-addım Təlimat

1. **Müştəri İdarəçiliyi Bölümünə Keçid**
   - Ana menyu açın
   - "Müştərilər" seçin
   - "Yeni Müştəri" düyməsini basın

2. **Əsas Müştəri Məlumatları**
   - **Ad Soyad**: Müştərinin tam adı (zorunlu)
   - **Telefon**: Mobil nömrə (zorunlu - müştəri tanısı üçün)
   - **Email**: Email ünvanı (təsisat üçün)
   - **Şəhir**: Müştərin yaşadığı şəhər (seqmentasyon üçün)

3. **Müştəri Tipi Seçmə**
   - **Fərdi Müştəri**: Adi alıcı
   - **Ticari Müştəri**: Hükumət təmir (pərakəndə veya nəhəng)
   - **Kurumsal Müştəri**: Şirkət, idarə

4. **Müştəri Grupu Təyin Etmə**
   - **VIP**: Tez-tez ve çox alış
   - **Davalı**: Adi alıcı
   - **Yeni**: Illərdir müştəri
   - **Qədim**: Uzunmüddətli müştəri
   - Sistem avtomatik grublandırma edə bilər

5. **Müştəri Adresi**
   - **Ev Ünvanı**: Müştərinin evi (kargo üçün)
   - **İş Ünvanı**: Müştərinin işi (Ofis məhsulları üçün)
   - Eyni müştəri bir neçə ünvana sifariş edə biləcəkdir

6. **Opsiyonal Məlumatlar**
   - **Doğum Günü**: Loyallıq bütövləşməsi
   - **Şirkət**: Korporativ müştərilər üçün
   - **Vergi Nömrəsi**: Tədarəçi nömrəsi (ticari)
   - **Bank Məlumatları**: Kredili alışlar üçün (əgər mövcuddursa)

7. **Müştəri Profilini Yadda Saxla**
   - Bütün məlumatları verdikdən sonra:
   - "Yadda Saxla" düyməsini basın
   - Sistem müştəri nömrəsi verəcəkdir

### İpuçları və Fəndləri

- **Telefon Doğruluğu**: Telefon nömrəsi doğru olmalı. Sonra xəbərdarlıq göndərərkən istifadə edəcəksiniz
- **Müştəri Nömrəsi**: Sistem hər müştəriye unikal nömrə verər. Satış zamanı bu nömrə istifadə ediləcəkdir
- **Müştəri Kütləsi Qəbulu**: Bir neçə müştəri əlavə etsəniz, CSV faylından idxal edin
- **Müştəri Axtarışı**: Satış zamanı müştərin telefon nömrəsini daxil etərək cəld tapmaq mümkündür

### Ümumi Problemlər

**Problem 1: "Telefon Nömrəsi Artıq Qeyd Edilmişdir"**
- **Həlli**: Eyni telefonda başqa müştəri mövcuddur. Rəqəmin doğruluğunu yoxlayın

**Problem 2: Müştəri Profili Yadda Saxlanmır**
- **Həlli**: Əsas məlumatlar (ad, telefon) boşdur. Bu səhvləri düzəltən

**Problem 3: Müştəri Satış Zamanı Göstərilmir**
- **Həlli**: Müştəri profili arxiv edilmişdir. "Arxiv" sekmesində baxıb, geri qaytarın

---

#### Müştəri Məlumatlarını Dəyişdirmə

### Giriş
Müştəri məlumatları dəyişə biləcəkdir (ünvan dəyişikliyi, telefon güncəlləməsi, mənzil tipi dəyişikliyi ve s.). Bu məqalə müştəri profilini redaktə etmənin mükəmməl yolunu göstərəcəkdir.

### Addım-addım Təlimat

1. **Müştəri Profilini Açma**
   - "Müştərilər" bölümündən
   - Axtarış çubuğunda müştərinin adını ve ya telefon nömrəsini yazın
   - Müştəri siyahısında bulduğu seçin

2. **Redaktə Moduna Keçid**
   - Müştəri profili açıldıqdan sonra:
   - Sağ üst küşədə "Redaktə Yap" düyməsini basın

3. **Məlumatları Dəyişdirmə**
   - **Şəxsi Məlumatlar**:
     - Ad, Telefon, Email dəyişdir
     - Doğum günü əlavə edin (əgər olmadıysa)
   - **Ünvan Məlumatları**:
     - Ev ve iş ünvanlarını yenilə
     - Yeni ünvan əlavə edin (əgər lazımdırsa)
   - **Müştəri Tipi**:
     - Ticari müştəridən fərdi müştəriyə dəyişə biləciniz
   - **Müştəri Grupu**:
     - VIP, Davalı, Yeni statusunu dəyişin

4. **Loyallıq Məlumatları**
   - **Loyallıq Nömrəsi**: Müştərinin loyallıq kartı nömrəsi
   - **Loyallıq Puanı**: Manuəl puanı dəyişə biləciniz (əgər səhv olarsa)
   - **Loyallıq Səviyyəsi**: Səviyyə əyirtmə (Gümüş, Qızıl, Platn)

5. **Borç Məlumatları**
   - **Cəmi Borç**: Müştərinin sizə borcunu göstəriniz
   - **Ödəmə Tarixi**: Borcun ödənməsi gözləniən tarih

6. **Yadda Saxlama**
   - Bütün dəyişiklikləri verdikdən sonra:
   - "Yadda Saxla" basın

### İpuçları və Fəndləri

- **Tarix Takip**: "Tarix" sekmesində kimə nə zaman dəyişdiyini görmek mümkündür
- **Müştəri Aktivliyi**: Müştərinin satış rəftərini "Satış Tarixçəsi" sekmesində görəfə bilərsiniz
- **Notlar**: "Notlar" sahəsinə müştəri haqqında xüsusi məlumat yazın (Misal: "Hərgə salatasını seviyor")
- **Müştəri Silmə**: Müştəri silməyin əvəzinə "Arxiv"a köçürün. Bu satış tarixçəsini saxlayır

### Ümumi Problemlər

**Problem 1: "Müştəri Redaktə Edilə Bilinmir"**
- **Həlli**: Müştəri satış prosesində olarsa, satışı bitirdikdən sonra cəhd edin

**Problem 2: Loyallıq Puanı Yanlışdırsa**
- **Həlli**: "Loyallıq Puanı" sahəsinə doğru rəqəmi daxil edin

**Problem 3: Eski Telefon Nömrəsindən Yeni Nömrəyə Dəyişilirləkdə Xəta Olur**
- **Həlli**: Sistemdə yeni telefon nömrəsi olmadığından əmin olun

---

#### Loyallıq Proqramı

### Giriş
Loyallıq proqramı müştəri əlaqələrini güçləndirmə, geri dönüşü artırma və satışları artırmanın əsas aracıdır. POS sistemi müxtəlif loyallıq strukturlarını dəstəkləyir - puan sistemləri, səviyyə sistemləri, xüsusi endirimləri ve s.

### Addım-addım Təlimat

1. **Loyallıq Proqramını Aktivləşdirmə**
   - Sistem Ayarları açın
   - "Müştərilər" sekmesini tapın
   - "Loyallıq Proqramını Aktivləşdir" seçin

2. **Loyallıq Sistemi Seçmə**
   - **Puan Sistemi**: Hər alışdan puan topla, puan ilə endirim al
   - **Səviyyə Sistemi**: Alış miqdarına görə səviyyə qal (Gümüş, Qızıl, Platn)
   - **Hibrid**: Hər ikisini birləşdir

3. **Puan Sistemi Ayarları**
   - **Puan Oranı**: 1 AZN = 1 puan (ştandart)
   - **Puan Dəyəri**: 100 puan = 10 AZN (1 puan = 0.1 AZN)
   - **Aktivasyon**: Müştəri profili yaratdıkda avtomatik loyallıq aktivləşdirilir

4. **Səviyyə Sistemi Ayarları**
   - **Gümüş Səviyyə**: 0-500 AZN satış
   - **Qızıl Səviyyə**: 500-1500 AZN satış (5% endirim)
   - **Platn Səviyyə**: 1500+ AZN satış (10% endirim)
   - Səviyyə əyirtmə otomatik hesablanır

5. **Loyallıq Müşəyyəsi İnformasiyası**
   - **Loyallıq Kartı Nömrəsi**: Müştəriye verilən nömrə
   - **Doğum Günü Endirim**: Doğum gündə özel endirim
   - **Xüsusi Kampanya**: Müştəri grublarına fərqli endirim

6. **Satış Zamanı Loyallıq**
   - Müştəri loyallıq kartını skan edin
   - Sistem otomatik sayılır, endirim tətbiq edir
   - Puan automatik toplanır

### İpuçları və Fəndləri

- **Doğum Günü Endirim**: Doğum gündə müştəriye xüsusi endirim vermə müştəri bağlılığını artırır
- **Sınıf Endirim**: Fərqli müştəri gruplarına fərqli endirim (VIP, Davalı, Yeni)
- **Mobil Loyallıq**: Müştəriyə SMS yolu ilə puanlarını söyləyin
- **Loyallıq Dəyəri**: Puanın həddini əlində tutun. Hər 100 puan = bir şey qiymətli olsun

### Ümumi Problemlər

**Problem 1: "Loyallıq Kartı Taşınmadı"**
- **Həlli**: Müştəri profili yaradılmadan loyallıq nömrəsi yoxdur. Profil yaratın

**Problem 2: Puan Toplamadı**
- **Həlli**: Müştəri loyallıq proqramına daxil olmamışdır. Müştəri profilinə baxın

**Problem 3: Endirim Göstərilmir**
- **Həlli**: Müştərinin loyallıq səviyyəsi yetərli olmayabilir. Profilə baxın

---

#### Müştəri Borc İstifadəsi

### Giriş
Bəzi müştərilər borc ilə alış etmişləri ola biləcəkdir. Örgütün bo borçu takip etmə, hatırlatma göndərmə ve ödəmə idarəçiliyi zəruridir. POS sistemi müştəri borç idarəçiliyinin tamamını kimi idare edə biləcəkdir.

### Addım-addım Təlimat

1. **Müştəri Borcunu Kayıt Etmə**
   - Satış cədvəlində müştəri seçin
   - Satış tamamlandıqdan sonra:
   - "Ödəmə Tərzi" seçin
   - "Borc" seçin (əgər mövcuddursa)
   - **Borç Miqdarı**: Otomatik doldurulacak
   - **Ödəmə Tarixi**: Borcun ne zaman ödənməsi gözləniir

2. **Müştəri Profilində Borç Görəmə**
   - Müştəri profilini açın
   - "Borç" sekmesini tapın
   - **Cəmi Borç**: Müştərinin cəmi borcu
   - **Ödəmə Tarixi**: En son ödəmə tarixi
   - **Ödənmiş Miqdar**: Tədiye edilmiş miqdar

3. **Borç Ödətimesi**
   - Müştəri borç ödəmək istəyərsə:
   - Müştəri profilini açın
   - "Ödəmə Al" basın
   - **Ödəmə Miqdarı**: Müştəri ne qədər ödəyəcəkdir?
   - **Ödəmə Tərzi**: Nağd, Kart, Çek, etc.
   - "Ödəmə Qəbul Et" basın

4. **Borç Hatırlatmalarını Ayarlama**
   - Sistem Ayarları açın
   - "Borç Hatırlatması" aktivləşdirin
   - **Hatırlatma Tarixi**: Ödəmə tarixindən kaç gün əvvəl hatırlatma verilsə
   - **Hatırlatma Kanalı**: SMS, Email, Dialog

5. **Ödənmiş Borcu Kaydı**
   - Müştəri tam ödədiyi zaman:
   - Borç otomatik olaraq silinəcəkdir
   - Müştəri profilində "Borç Yoxdur" göstərilərəcəkdir

### İpuçları və Fəndləri

- **Borc Limiti**: Müştəri tipi başına borç limiti qoyun (VIP 5000 AZN, Davalı 1000 AZN)
- **Borc Faizi**: Vadəsi keçmiş borclardan faiz almaq mümkündür (əgər ayarlandıysa)
- **Borc Raporta**: Vəzifəli borcların siyahısını raporta ile görün
- **Müştəri Qrupunun Borcunun Sınırlaması**: Borç sınırını keçən müştəriye satış etməyin

### Ümumi Problemlər

**Problem 1: "Borç Ödəmişi Olaraq Göstərilmir"**
- **Həlli**: Ödəmə prosesi tamamlanmamışdır. Ödəmə sekmesini yoxlayın

**Problem 2: Müştəri Borc Limiti Keçdi**
- **Həlli**: Sistem səhvi olabilir. Admin tərəfindən müştərinin borç limitini artırın

**Problem 3: Borç Tarixçəsi Göstərilmir**
- **Həlli**: Müştəri profilində "Borç Tarixçəsi" sekmesini açın

---

#### Müştəri Satış Tarixi

### Giriş
Müştərinin əvvəlki satışlarını görəmə, onun alış davranışını anlamağa kömək edir. Bu məlumat, müştəriyə xüsusi təkliflər vermə, tələbi proqnozlaşdırma ve müştəri bağlılığını artırma üçün faydalıdır.

### Addım-addım Təlimat

1. **Müştəri Profili Açma**
   - "Müştərilər" bölümündən müştəri seçin
   - Müştəri profili açılacak

2. **Satış Tarixçəsi Sekmesini Tapma**
   - Müştəri profilində "Satış Tarixçəsi" sekmesini basın

3. **Satış Rəftərini Analiz Etmə**
   - Sətirlər:
     - **Tarix**: Satışın keçirildiyi tarix
     - **Qiymət**: Satışın cəmi qiyməti
     - **Məhsullar**: Alınan məhsullar
     - **Ödəmə Tərzi**: Nağd, Kart, Borc vb.
     - **Satış Nömrəsi**: Satışın sistem nömrəsi

4. **Satış Detaylarını Görəmə**
   - Hər satışın üzərinə klikləyin
   - Alınan məhsulların siyahısı, qiymətləri, endirimləri görəcəksiniz

5. **Satış Tarixçəsini Filtrləmə**
   - **Tarix Aralığı**: Müəyyən tarix aralığını seçin
   - **Məhsul**: Müəyyən məhsulun alınmasını göstər
   - **Qiymət Aralığı**: Müəyyən qiymət aralığında satışları göstər

6. **Raporta Çap Etmə**
   - "Çap Et" basın
   - Müştəri satış tarixçəsi PDF olaraq çap olunacak

### İpuçları və Fəndləri

- **Satış Trendləri**: Müştərinin ən çox satın aldığı məhsulları görmə
- **Alış Sıklığı**: Müştəri ne sırada alış keçirir (günə bir dəfə, həftəda bir dəfə?)
- **Orta Alış**: Müştərinin orta satış qiymətini hesabla
- **Seqmentasyon**: Müştərilərini alış məbləğinə ve sıklığına görə qruplaya biləcəksiniz

### Ümumi Problemlər

**Problem 1: "Satış Tarixçəsi Boş Göstərilir"**
- **Həlli**: Müştəri hələ satın almamışdır. Birinci satışdan sonra tarixçə göstərilərəcəkdir

**Problem 2: Eski Satışlar Görünmür**
- **Həlli**: "Tarix Aralığı" filtrimiz yanlış ayarlanmış ola biləcəkdir. Aralığı genişləyin

**Problem 3: Satış Tarixçəsi Yanlışdırsa**
- **Həlli**: Sistem bu məlumatı satış zamanı əsasında yazır. Tarixçə ləğv edilə bilməz (audit trail)

---

## SONUÇ

Bu bilik bazası məqalələri Azərbaycan POS sisteminiz üçün yön göstərəcək resurslarıdır. Hər məqalə praktiki informasiya, ipuçları ve ümumi problemlərin həllinə fokus edirmiş. İstifadəçiləriniz bu məqalələrdən istifadə edərək sistemi səmərəli istifadə edə biləcəklər.

Əlavə suallarınız varsa, tərtibat komandası ilə əlaqə saxlayın.