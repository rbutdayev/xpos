# XPOS Sistemi - Bilik Bazası Məqalələri

## KATEQORİYA 7: SİSTEM AYARLARI

### 1. Şirkət məlumatları

## Şirkət məlumatları

### Giriş

Şirkət məlumatları XPOS sisteminin əsas tənzimləmələridir. Bu məlumatlar kvitansiyyalarda, hesabatlarda və müştəri ilə əlaqə məlumatlarında istifadə edilir. Düzgün şirkət məlumatlarının tənzimlənməsi, hüquqi uyğunluq və peşəkarca görünüş üçün vacibdir.

### Addım-addım Təlimat

1. **Sistem Ayarlarına Daxil Olma**
   - Əsas menuda "Ayarlar" bölməsinə keçin
   - "Şirkət Məlumatları" seçimini tapın

2. **Əsas Məlumatları Doldurma**
   - Şirkət adını daxil edin (tam rəsmi ad)
   - Şirkət mövqeini (ünvanını) yazın
   - Telefon nömrəsini əlavə edin
   - Elektron poçt ünvanını daxil edin
   - Vergi nömrəsini (VN) qeyd edin

3. **Logo Yükləmə**
   - "Logo Yüklə" düyməsinə basın
   - Şirkət logosunu seçin (PNG, JPG formatında)
   - Logo avtomatik olarak ölçüləndirilir və kvitansiyyalarda göstərilir

4. **Hüquqi Məlumatlar**
   - Qanuni formasını seçin (Şəxs, Cəmiyyət, Hüquqi Şəxs)
   - ROT nömrəsini daxil edin (əgər tətbiq olunursa)
   - Bank məlumatlarını əlavə edin

5. **Dəyişiklikləri Saxlama**
   - Bütün məlumatları doldurdukdan sonra "Saxla" düyməsinə basın
   - Sistem təsdiq mesajı göstərəcəkdir

### İpuçları və Fəndləri

- Şirkət adını tam rəsmi olaraq yazın - bu vergiqanun məlumatları ilə uyğun olmalıdır
- Logo ən yaxşı 200x200 piksel ölçüsündə olmaq üçün hazırlayın
- Telefon nömrəsinin formatı: +994 (AA) BBB-BB-BB
- İstənilən zaman məlumatları yeniləyə bilərsiniz, köhnə məlumatlar avtomatik arxivlənir
- Logoda açıq rənglərdən istifadə edin, çünki kvitansiyyalarda siyah-ağ çapılır

### Ümumi Problemlər

**Məsələ: Logo kvitansiyyada görünmür**
- Həll: Logo faylının ölçüsünün 1 MB-dan az olduğundan əmin olun
- Faylın formatının PNG və ya JPG olduğunu yoxlayın
- Sistemi yenidən yükləməyi sınayın

**Məsələ: Xüsusi simvollar (ü, ə, ı) düzgün göstərilmir**
- Həll: Məlumatları UTF-8 kodlaması ilə yenidən daxil edin
- Sistem tətbiqini yenidən başlatmağı sınayın

---

#### 2. Fiskal printer ayarları

## Fiskal printer ayarları

### Giriş

Fiskal printer ayarları XPOS sisteminin ən mühüm komponentlərindən biridir. Fiskal printer vergi orqanlarının tələblərinə uyğun olaraq satış əməliyyatlarını qeydə alır. Düzgün ayarlandırılmış fiskal printer olmadan sistem tam imkanında işləyə bilməz.

### Addım-addım Təlimat

1. **Fiskal Printerin Bağlanması**
   - Fiskal printerin hər hansı USB portuna bağlayın
   - Printerin elektrik cihazına qoşduğundan əmin olun
   - Sistem çıxarışını yoxlamağa imkan vermək üçün sözləşməni təsdiq edin

2. **Ayarlara Keçid**
   - "Sistem Ayarları" → "Fiskal Printer" bölməsinə keçin
   - "Printer Seçimi" açılır siyahısından cihazı seçin
   - Sistem otomatik olaraq əlaqə portunu müəyyən edəcəkdir

3. **Printer Parametrləri**
   - Printer modelini seçin (Datecs, Shtrikh, ktp.)
   - Bağlantı sürətini (adətən 9600 bit/san) təyin edin
   - Parite ayarını Normal (Even) olarak saxlayın

4. **Registrasiya Məlumatları**
   - Fiskal yaddaş nömrəsini (FYN) daxil edin
   - Registrasiya nömrəsini qeyd edin
   - Vergi orqanı tərəfindən verildiyini təsdiq edin

5. **Sınaq Əməliyyatı**
   - "Sınaq Çapı" düyməsinə basın
   - Printer tiq səsi çıxarıb test çıxarışını yazdıracaq
   - Çıxarışın düzgün formatında olduğunu yoxlayın

### İpuçları və Fəndləri

- Printer bağlantısını hər gün iş başlangıcında yoxlayın
- Hər ay printer təmizləmə və texniki xidmətə göndərməyi planlayın
- Printer boş yaddaş uyarısı alırsa, "Boş Yaddaş Sıfırla" əməliyyatını icra edin
- Uzun satış gün sonunda "Z-Hesabat" çapın
- USB kabeli sıxmalı olmayan, kalitəli olmalıdır

### Ümumi Problemlər

**Məsələ: Printer "Bağlı deyil" mesajı göstərir**
- Həll: USB kabelini çıxarıb 10 saniyə sonra yenidən qoşun
- Sistem ayarlarında doğru port seçildiyini yoxlayın
- Printer pilot işığının yanışıp söndüğünü yoxlayın

**Məsələ: Qırmızı işıq yanıb sönüyor (Xəta)**
- Həll: Printer kağıdının qurulduğundan əmin olun
- Printerin qapağını açıb bağlayın
- Sistem ayarlarında printer reset (sıfırlama) düyməsinə basın

**Məsələ: Çıxarış bulanıq çapılır**
- Həll: Printerin baskı başlığını təmizləyin
- Kağıt keyfiyyətini yoxlayın
- Printer servis mərkəzinə göndərməyi düşünün

---

#### 3. SMS xidməti

## SMS xidməti

### Giriş

SMS xidməti müştərilərə müxtəlif bilgiləndirmə mesajları göndərməyə imkan verir. Kvitansiya SMS-ə, müştəri xoşbəxtlik mesajı, fəaliyyət bildirişləri və s. SMS vasitəsilə göndərilə bilər. Bu xidmət müştəri əlaqəsi və məsuliyyətli satış üçün mühümdür.

### Addım-addım Təlimat

1. **SMS Xidmətinin Aktivləşdirilməsi**
   - "Sistem Ayarları" → "Bildiriş Kanalları" bölməsinə daxil olun
   - "SMS Xidməti" seçimini tapın
   - "Aktivləşdir" düyməsinə basın

2. **SMS Sağlayıcı Seçimi**
   - Sms sağlayıcı operator seçin (Azərbaycan üçün ümumi seçim)
   - Sağlayıcıdan API açarını əldə edin
   - API Açarını müvafiq sahəyə daxil edin

3. **Gönderici Nömrəsinin Təyin Edilməsi**
   - "Gönderici Nömrəsi" bölməsində öz nömrənizi yazın
   - Məsələn: +994XXXXXXXXXX
   - Nömrənin sağlayıcı tərəfindən təsdiq edilməsini gözləyin

4. **SMS Şablonlarının Qurğusu**
   - Müxtəlif hadisələr üçün SMS şablonları əlavə edin
   - Satış sonrası teşəkkür mesajı yazın
   - Promotsiya və endirim xəbərləri hazırlayın
   - Hər şablonda müştərinin adını istifadə etmək üçün {ad} istifadə edin

5. **Test Mesajı Göndərmə**
   - Ayarlar tamamlandıqdan sonra test mesajı göndərin
   - Mesajın düzgün göndərildiyini yoxlayın
   - Gecikmə müddətini qeyd edin (adətən 1-5 saniyə)

### İpuçları və Fəndləri

- SMS paket düzəngəliyini həftə boyunca səfərbər edin
- Həssas zamanlar (8:00-10:00, 12:00-14:00) üçün mesaj göndərməyi məhdudlaştırın
- SMS şablonunda maksimum 160 simvol istifadə edin
- Müştərinin telefon nömrəsini düzgün formatda saxlayın (+994...)
- SMS məlumatlarını hər ay vəziyyətini yoxlayın

### Ümumi Problemlər

**Məsələ: SMS göndərilmir**
- Həll: API açarının düzgün daxil edilməsini yoxlayın
- Sağlayıcının hesabında kifayət qədər balans olduğundan əmin olun
- Müştərinin telefon nömrəsinin formatının düzgün olduğunu yoxlayın

**Məsələ: Mesajlar gecikilir**
- Həll: Sağlayıcının serverinin vəziyyətini yoxlayın
- İnternet bağlantısı sürətini yoxlayın
- Sağlayıcıya dərhal məktub yazın

---

#### 4. Telegram bot

## Telegram bot

### Giriş

Telegram bot XPOS sisteminin müştəri əlaqə kanallarından biridir. Müştərilər Telegram vasitəsilə sifariş verə, sorğularına cavab ala, promosyon məlumatlarını əldə edə bilərlər. Bot texniki dəstəyə müraciət etmə imkanı da verir.

### Addım-addım Təlimat

1. **Telegram Bot Yaratma**
   - Telegram'da @BotFather-ə mesaj göndərin
   - "/newbot" əmrini çəkin
   - Bot üçün ad və istifadəçi adı yazın (p.ş. xpos_shop_bot)
   - Sistem sizə bot token-i verəcəkdir

2. **Token'in Sistemi Daxil Edilməsi**
   - "Sistem Ayarları" → "Telegram Bot" bölməsinə keçin
   - Bot token-ini daxil sahəyə yapışdırın
   - "Sahibi Bağla" düyməsinə basın

3. **Bot Əmrləri Ayarlanması**
   - Əsas əmrləri müəyyən edin:
     * /start - başlama mesajı
     * /help - yardım məlumatı
     * /catalog - məhsul kataloqu
     * /order - sifariş vermə
     * /contact - əlaqə məlumatları

4. **Otomatik Cavablar**
   - Müstəqil suallar üçün şablonlar yaradın
   - Fəaliyyət saatları haqqında məlumat yazın
   - Məsul şəxsin məlumatlarını əlavə edin

5. **Bot Testləri**
   - Telegram'da bot nümunəsini açın
   - "/start" əmrini sınayın
   - Müxtəlif əmrlərin işlədiyini yoxlayın

### İpuçları və Fəndləri

- Bot cavablarını qısa və aydın tutun
- Emoji istifadə etərək visualə və cəzbəkarlığı artırın
- Müştəri əlaqəsi qeydlərini günlük yoxlayın
- Xüsusi promosyon dövründə bot xəbərləri göndərin
- Bot tərəfindən olmayan suallarda avtomatik cəlbedici mesaj göndərin

### Ümumi Problemlər

**Məsələ: Bot cavab vermir**
- Həll: Bot token-in düzgün daxil edilməsini yoxlayın
- @BotFather'a "/mybots" yazıb botun fəal olduğundan əmin olun
- Sistem qeydlərini yoxlayın

**Məsələ: Mesajlar göstərilmir**
- Həll: İnternet bağlantısını yoxlayın
- Telegram API-nın fəal olduğundan əmin olun
- Şifrələmə sertifikatını yeniləmənin zəruriliyi yoxlayın

---

#### 5. Printer seçimi və ayarları

## Printer seçimi və ayarları

### Giriş

Printer seçimi və ayarları XPOS sisteminin mühüm komponentidir. Düzgün printer seçimi xidmət keyfiyyətini artırır, istifadə ömrünü uzadır və xərcləri azaldır. Termik, lazer və linki printerlərin müxtəlif üstünlükləri vardır.

### Addım-addım Təlimat

1. **Printer Tipinin Seçilməsi**
   - Termik Printer (80x120 mm qiymətləndir)
     * Ən asan istifadə olunan seçim
     * Operasion xərci aşağı
     * Bir böyük satış yeri üçün ideal

   - Termal Printer (Şerit printeri)
     * Rəngli çıxarış
     * Daha yüksək qiymət
     * Dekorativ çaplar üçün

   - Lazer Printer
     * Sürətli çap
     * Yüksək keyfiyyət
     * Böyük mağaza üçün

2. **Printer Qurğusu**
   - "Sistem Ayarları" → "Printer Seçimi" bölməsinə daxil olun
   - Mövcud printerlərin siyahısından seçin
   - Printer modelini aydın şəkildə seçin

3. **Port Ayarları**
   - USB port müvəffəqiyyəti bilavasıta tanındı
   - Paralel port üçün, cihaz meneceri yoxlayın
   - Şəbəkə printeri üçün IP ünvan daxil edin

4. **Çap Parametrləri**
   - Kağız ölçüsünü seçin (A4, A5, 80x120mm)
   - Səhifə istiqamətini müəyyən edin (Portret/Manzara)
   - Xətlərin sayını nizamla
   - Yazı qutuşunun ölçüsünü ayarla

5. **Ayarları Saxlama və Sınaq**
   - "Saxla" düyməsinə basın
   - "Test Çapı" düyməsində basıb sınayın
   - Çıxarışın düzgün formatında olduğunu yoxlayın

### İpuçları və Fəndləri

- Printer seçmədən əvvəl sizin fəaliyyət yükünü hesablayın
- Düşük həcmli mağazalar üçün termik printer tövsiyə olunur
- Printerlərin sürətini (mm/san) yoxlayın - 150mm/san ideal
- Kağız qiyməti müqayisə edin (termik = 2-3x daha bahalı)
- Servisi keyfiyyətli olması əsas seçim meyarı olmalıdır

### Ümumi Problemlər

**Məsələ: Printer işləmir**
- Həll: Printer sürücüsünü yenidən quraşdırın
- USB kabelini yenidən qoşun
- Sistem qeydlərini yoxlayın

**Məsələ: Çıxarış bulanıqdır**
- Həll: Printerin temiri xidmətinə müraciət edin
- Kağız keyfiyyətini yüksəlt
- Yazı başlığını təmizlə

---

#### 6. Bildiriş kanalları

## Bildiriş kanalları

### Giriş

Bildiriş kanalları müştəri əlaqəsinin əsasıdır. XPOS sistemi SMS, Telegram, E-mail və Push-bildirişləri dəstəkləyir. Bütün kanalları düzgün qurğu sistemin məhsuldarlığını artırır.

### Addım-addım Təlimat

1. **Bildiriş Kanallarının Aktivləşdirilməsi**
   - "Sistem Ayarları" → "Bildiriş Kanalları" bölməsinə keçin
   - Hər bir kanal üçün "Aktivləşdir" düyməsinə basın

2. **SMS Kanalının Qurğusu**
   - Sağlayıcı: Operator seçin
   - API Açarı: Daxil edin
   - Gönderici Nömrəsi: Yazın

3. **Telegram Kanalının Qurğusu**
   - Bot Token: Daxil edin
   - İstifadəçi Chat ID-sı: Əlavə edin
   - Mesaj Şablonu: Hazırlayın

4. **E-mail Kanalının Qurğusu**
   - SMTP Serveri: smtp.gmail.com (təxmini)
   - Port: 587 (TLS)
   - İstifadəçi Adı: E-mail ünvanı
   - Şifrə: App Şifrə
   - Mövzu Şablonu: Hazırlayın

5. **İlkinlik Ayarlaması**
   - Hansı kanalın əsas olacağını seçin
   - Müştəri sürəti əsasında seçin
   - Qara siyahı müştərilərini tutun

### İpuçları və Fəndləri

- Müxtəli kanalları eyni zamanda işə salın - təqvim uyğunluğu artır
- Bildiriş şablonlarını müştəri feedback-inə əsasən düzəldin
- Bildiriş tezliyini həftə nəticələrinə əsasən ayarlayın
- Hər kanala üçün alıcı məlumatını avtomatik olaraq doğrulayın
- Yüksək fəaliyyət dövründə bildiriş gecikmelerini müşahidə edin

### Ümumi Problemlər

**Məsələ: Bildirişlər göndərilmir**
- Həll: Şəbəkə bağlantısını yoxlayın
- Sağlayıcı dəstəyinə müraciət edin
- SMTP ayarlarını yenidən kontrol edin

**Məsələ: Müştərilər bildirişlərə cavab vermir**
- Həll: Mesaj mətni ilk nəzərdə cəzbəkarlı yazın
- Göndərmə saatını dəyişin
- İstifadəçilər üçün opt-in seçimlərini təklif edin

---

## KATEQORİYA 8: ÇAP VƏ KVİTANSİYALAR

#### 7. Kvitansiya şablonu yaratma

## Kvitansiya şablonu yaratma

### Giriş

Kvitansiya şablonu müştəriyə verilən satış dokumentunun formatını müəyyən edir. Professional görünüş, qanuni məlumatlar və branding XPOS-daki kvitansiya şablonu ilə həyata keçirilir. Müxtəlif mağazalar, müxtəlif şablonlar istifadə edə bilərlər.

### Addım-addım Təlimat

1. **Şablon Açma**
   - "Sistem Ayarları" → "Çap Ayarları" → "Kvitansiya Şablonları" bölməsinə daxil olun
   - "Yeni Şablon" düyməsinə basın

2. **Əsas Məlumatlar**
   - Şablon adı yazın (p.ş. "Standart A4", "Termal 80x120")
   - Kağız ölçüsünü seçin
   - Əsas yazı ölçüsünü tənzimləyin

3. **Başlıq Qurğusu**
   - Şirkət adını əlavə edin
   - Logonu seçin (Qalereyadan)
   - Ünvanı və telefonu yerləşdirin
   - Böyük başlığında qəbul-mərlin vaxtını

4. **Məhsul Cədvəli**
   - Sütun başlıqlarını seçin: Məhsul, Miqdar, Qiymət, Cəmi
   - Sütun enini ayarlayın
   - Başlıq rəngini seçin (tekstdir, HTML yoxdur)

5. **Altbilgi Qurğusu**
   - Teşəkkür mesajı yazın
   - Fəaliyyət saatlarını əlavə edin
   - Əlaqə məlumatlarını düzün
   - Vergiqanun məlumatlarını əlavə edin

6. **Şablonu Saxlama**
   - "Saxla" düyməsinə basın
   - Sistem təsdiq mesajı göstərəcəkdir

### İpuçları və Fəndləri

- Şablonda en çox 80 simvol istifadə edin (termik printer üçün)
- Logo PNG formatında, 200x200 piksel ölçüsündə olmalıdır
- Məhsul cədvəlində 3-4 əsas sütun saxlayın
- Qiymət saatlarında bir-birini kəsmə məlumatlarını əlavə edin
- Məsul şəxsin imzası üçün boş yer buraxın

### Ümumi Problemlər

**Məsələ: Şablon sayadaya çapılır**
- Həll: Kağız ölçüsünü yenidən yoxlayın
- Sütun enini tarazlaşdırın
- Şablonun tətbiqini sıfırla

**Məsələ: Loqo görünmür**
- Həll: Loqo faylının ölçüsünü yoxlayın (< 1 MB)
- Faylın formatı PNG olduğundan əmin olun
- Sistem əlaqəsini yenidən başlat

---

#### 8. Termal Printer qurğusu

## Termal Printer qurğusu

### Giriş

Termal Printer (Termal Transfer Printer) rəngli, yüksək keyfiyyətli çap üçün ideal həldir. Logolar, barkodlar və dekorativ elementlər üçün istifadə edilir. XPOS ilə tamamilə inteqrasiya olunur.

### Addım-addım Təlimat

1. **Printerə Cihaz Sürücüsünün Qurulması**
   - Printer istehsalçısının saytından sürücü yükləyin
   - Sürücüyü quraşdırın
   - Sistemi yenidən başlatın

2. **XPOS Ayarlarında Printerə Bağlama**
   - "Sistem Ayarları" → "Printer Seçimi" bölməsinə daxil olun
   - "Termal Printer" seçin
   - "Avtomatik Axtarış" düyməsinə basın
   - Printer avtomatik tapılacaq

3. **Kağız Parametrləri**
   - Kağız enliyini (mm) daxil edin (adətən 203mm)
   - Kağız hündürlüyünü seçin
   - Marjin ayarları: Üst 10mm, Alt 10mm

4. **Rəng Profili Seçimi**
   - Kağız tipi seçin (Parlaq, Mat, Custom)
   - Renk doygunluğu tənzimləyin
   - Rəng kalibrasiyasını səs edin

5. **Sınaq Çapı**
   - "Sınaq Çapı" düyməsinə basın
   - Rəng balansının düzgün olduğunuz yoxlayın
   - Çıxarış kənarlarını və mərkəzini yoxlayın

### İpuçları və Fəndləri

- Termal şerit həftə iki dəfə yeniləyin
- Nəm olmayan mühitdə saxlamağını tövsiyi edin
- Uzun müddət istifadə etmədən əvvəl test çapı alın
- Kağız seçicisini hər dəfə düzləyin
- Yazı temiz tutmaq üçün aylıq təmizləmə planı hazırlayın

### Ümumi Problemlər

**Məsələ: Rəng çıxarışı solğun çapılır**
- Həll: Rəng doygunluğunu artırın
- Kağız tipi seçimini dəyişin
- Yazı başlığını təmizlə

**Məsələ: Çıxarış əyri çapılır**
- Həll: Kağız qılavuzunu tənzimləyin
- Kağızın müvəffəqiyyətlə yerləşdirildiyini yoxlayın
- Mekanik parametrləri yoxlayın

---

#### 9. Printer sınağı

## Printer sınağı

### Giriş

Printer sınağı sistemin qurğusunun səhih olub olmadığını, printerə ehtiyac olub olmadığını müəyyən edir. Gündəlik fəaliyyət həftə başında sınaq məsləhətli olur.

### Addım-addım Təlimat

1. **Sınaq Başlama**
   - "Sistem Ayarları" → "Printer Seçimi" bölməsinə daxil olun
   - Sınaq üçün printer seçin
   - "Test Çapı" düyməsinə basın

2. **Çıxarış Nəticəsini Yoxlama**
   - Sistem məlumatları yoxlayın: Printer tipi, versiya
   - Mətn çapını yoxlayın: Simvollar aydın, mərkəzdə
   - Grafikanı yoxlayın: Çizgilər tünd, xətaları yoxdur
   - Qiymət cədvəlini yoxlayın: Sütunlar düzün yerləşib

3. **Başarısızlıq Halında**
   - Çıxarışda göstərilən xətanın kodunu qeyd edin
   - Printer sürücüsünü yenidən quraşdırın
   - Sistem qeydlərini yoxlayın

### İpuçları və Fəndləri

- Test çapını həftə bir dəfə rutinlik olaraq aparın
- Çıxarışları tarixləri ilə arşivləyin
- Kağız azalmasını qeyd edin
- İqrarsızlıqlar halında dərhal rəparasyonu sıfırla
- Sınaq sonrası balansı saxlayın (uzun saytış istifadəsi)

### Ümumi Problemlər

**Məsələ: "Printer bağlı deyil" xətası**
- Həll: Printer elektrik cihazına bağlı olduğundan əmin olun
- USB kabelini yenidən qoşun (10 saniyə gözləyin)
- Sistem ayarlarında doğru port seçildiyini yoxlayın
- Cihaz menecerində printer görünüp görünmədiyi yoxlayın

**Məsələ: Sınaq çapı açılmır**
- Həll: Kağız printerə qoymuş və qapağını bağlayın
- Printer sürücüsünün son versiyası olduğundan əmin olun
- Windows Printer Explorer'da printer ayarlarını yoxlayın

---

#### 10. Barkod çapı

## Barkod çapı

### Giriş

Barkod çapı məhsulların identifikasiyas,ı satış sürətini və dəqiqliyini artırır. XPOS sistemi EAN13, QR kod və digər barkod formatlarını dəstəkləyir. Barkod çapını düzgün qurğu istifadəçi məmnuniyyətini yüksəltir.

### Addım-addım Təlimat

1. **Barkod Formatı Seçimi**
   - "Məhsul Idarəsi" → "Məhsul Ayarları" bölməsinə daxil olun
   - Barkod tip seçin:
     * EAN13 (Standart)
     * QR Code (Əlavə məlumat)
     * CODE128 (Sınırlı məhsul)

2. **Barkod Ölçüsü Tənzimlənməsi**
   - Ölçü (mm): 30x20 (standart)
   - Yüksəklik: 25mm-dən azı olmamalıdır
   - Buraxılacaq məmlə (mm): 2-3

3. **Çap Ayarları**
   - Çap aparatında "Barkod Şablonu" seçin
   - Hərəkət qurğusunu (label printer) tənzimləyin
   - Qutuda çapılacak ölçüsü daxil edin

4. **Toplu Barkod Çapı**
   - "Məhsul İdarəsi" → "Toplaç Çapı" bölməsinə daxil olun
   - Çap üçün məhsul seçin
   - "Çap" düyməsinə basın

5. **Kalite Yoxlanması**
   - Barbar məhvizində oxunduğundan əmin olun
   - Siyah rəng (maye terapia) çıxarışında

### İpuçları və Fəndləri

- Əlavə məlumat üçün QR kod istifadə edin
- Barkod etiketini məhsulun görünən yerinə yapışdırın
- Etiket kağızını yüksək keyfiyyətə seçin
- Barkod şablonunda logosu əlavə edin (göstəriş olaraq)
- Mövsüm dəyişməsində yeni barkodlar çapın (əgər şəxsi məhsul)

### Ümumi Problemlər

**Məsələ: Barkod skaneri oxumur**
- Həll: Barkodun formatını yoxlayın (EAN13 təklif)
- Barkod etiketini təmiz sakit (keçirmə işi)
- Skaner batareyalarını dəyişin
- Skaner Bluetooth ayarlarını reset edin

**Məsələ: QR kod mobil telefonla oxunmur**
- Həll: QR kod ölçüsünü artırın (40x40 mm minimum)
- Mühiş kontrastı yoxlayın (qara fonda ağ, v.s.)
- Sistemi yenidən kalibrləmə sınayın

---

#### 11. Fiskal printer inteqrasiyası

## Fiskal printer inteqrasiyası

### Giriş

Fiskal printer inteqrasiyası vergi orqanlarının tələblərinə uyğun satış qeydiyyatının aparılmasını təmin edir. Hüquqi uyğunluq və cəzasız fəaliyyət üçün kritikidir. XPOS aşağıdakı fizkal printerləri dəstəkləyir: Datecs, Shtrikh, FP-900, POS 700.

### Addım-addım Təlimat

1. **Fizkal Printer Qurğusu**
   - "Sistem Ayarları" → "Fiskal Printer" bölməsinə daxil olun
   - Printer modelini seçin
   - Port ayarlarını düzəltin (USB, Paralel, Şəbəkə)

2. **Registrasiya Əməliyyatı**
   - Vergi orqanı tərəfindən verilmiş fişkal yaddaş nömrəsini (FYN) daxil edin
   - Registrasiya nömrəsini qeyd edin
   - Sahibinin şəxsiyyət nömrəsini daxil edin

3. **Fiskal Əməliyyatı Sınağı**
   - "Test Əməliyyatı" düyməsinə basın
   - Sistemin test satış qeydini aparacağını yoxlayın
   - Z-hesabat (gündəlik inxulasə) aparın

4. **Qəbul Şablonunun Hazırlanması**
   - Vergi nömrəsini, şirkət adını, seç şəxsinin nömrəsini təyin edin
   - Sorğu ünvanını və digər qanuni məlumatları daxil edin
   - Hər əməliyyatdan sonra çap olmayan hissə seçin

5. **Sınaq Əməliyyatları**
   - Kiçik cəmli satış əməliyyatını aparın
   - Çıxarışın hüquqi məlumatlar ilə tamamilə doldurulduğunu yoxlayın
   - Xötassە kontrollü qoşulub qoşulmadığını yoxlayın

### İpuçları və Fəndləri

- Gündəlik Z-hesabat aparmalı (cəm taps)
- Fiskal printi eviər yaddaş doldursa, boş məlumat sil
- Printer sürücüsünü aylıq müasırlaştırma (update)
- Fiskal əməliyyatları keçmiş yaddaş saxla
- Vergi orqanı ilə aydın məlumatları tərəfdarlaştırın

### Ümumi Problemlər

**Məsələ: Fiskal printer bağlı deyil**
- Həll: Printer elektrik cihazına bağlı olduğundan əmin olun
- USB kabelini 10 saniyə gözləyərək yenidən qoşun
- Sistem ayarlarında doğru port seçildiyini yoxlayın

**Məsələ: Fiskal yaddaş dolduydu**
- Həll: Z-hesabat aparın
- Köhnə məlumatları sil
- Yeni yaddaş qartı quraşdır

---

## KATEQORİYA 9: İSTİFADƏÇİ İDARƏSİ

#### 12. İstifadəçi profili yaratma

## İstifadəçi profili yaratma

### Giriş

İstifadəçi profili yaratma XPOS sisteminin ən əsas idarəçilik tapşırıqlarından biridir. Hər işçi üçün fərdi profil təhlükəsizliyi artırır, tapşırıqları aydınlaşdırır və məsuliyyəti müəyyən edir. Professional idarəçilik başlayır yaxşı istifadəçi sistemi ilə.

### Addım-addım Təlimat

1. **İstifadəçi İdarəçilik Panelini Açma**
   - "Sistem Ayarları" → "İstifadəçi İdarəsi" bölməsinə daxil olun
   - "Yeni İstifadəçi" düyməsinə basın

2. **Şəxsi Məlumatların Doldurulması**
   - Soyadı və adı yazın (Rəsmən yazılmış şəkil)
   - Doğum tarixini daxil edin
   - Telefon nömrəsini qeyd edin
   - E-mail ünvanını daxil edin
   - Fərdi şəkli yükləyin (isteğe bağlı)

3. **Qeydiyyat Məlumatlarının Hazırlanması**
   - İstifadəçi adını avtomatik olaraq sistemə daxil edin
   - İlkin şifrəni sistem təyin edin (müştəri ilk giriş zamanı dəyişməlidir)
   - Giriş sahəsini tənzimləyin (məsələn, "Saler 1")

4. **Rolu Təyin Etmə**
   - Açılır siyahıdan rolu seçin:
     * Mağaza Müdürü
     * Sələr
     * Buhaltər
     * Admin (Təhlükəsiz istifadə)
   - Rol mühümdür - məsuliyyət və icazəsi müəyyən edir

5. **Təqdim Ayarlarının Qurulması**
   - Standart kassa seçin (əgər mövcuddursa)
   - İş saatlarını müəyyən edin
   - Şirkət departamentini seçin
   - İş vəzifəsini qeyd edin

6. **Profili Saxlama**
   - Bütün məlumatları yoxlayın
   - "Saxla" düyməsinə basın
   - Sistem təsdiq mesajı göstərəcəkdir

### İpuçları və Fəndləri

- Soyadı ilk hərfi böyük yazın (Məsələn: Ələsgər)
- İstifadəçi adı 3-16 simvoldan ibarət olmalıdır
- Güclü ilk şifrə tənzimləyin (A-z0-9 ilə, minimum 8 simvol)
- Profil şəkli profilə razyonal olmalı
- Departament seçimini tafsil edin

### Ümumi Problemlər

**Məsələ: E-mail adresi daxil edildikdə xəta göstərir**
- Həll: E-mail formatının düzgün olduğunu yoxlayın (misalə@domen.az)
- Başqa istifadəçi bu e-mail istifadə etməsinin
 yoxlayın
- Sistema dəstəyə müraciət edin

**Məsələ: Rol seçilə bilmir**
- Həll: Admin hüquqları ilə daxil olduğundan əmin olun
- Sistem ayarlarında rol nümunəsinin mövcud olduğunu yoxlayın

---

#### 13. Rol təyini

## Rol təyini

### Giriş

Rol təyini istifadəçinin sistemde nə edə biləcəyini müəyyən edir. Fərqli roller - fərqli icazələr. Təhlükəsiz iş səviyyəsi rolu düzgün təyinin ilə başlayır. XPOS-da 5 əsas rol: Admin, Mağaza Müdürü, Sələr, Buhaltər, Seifçi.

### Addım-addım Təlimat

1. **Rol Seçim Məkani**
   - İstifadəçi profil səhifəsində "Rol Seçimi" bölməsini tapın
   - Açılır siyahıdan əlverişli rolu seçin

2. **Rol Açıqlamaları**

   **Admin**
   - Tam hüquqlar (sistem ayarları, istifadəçi idarəsi, rəportlar)
   - İstifadə: Mağaza idarəçisi
   - Məlumat girişi: Hüquqs müçərrəbilər istifadə

   **Mağaza Müdürü**
   - Satış, hesabat, mağaza ayarları
   - Istifadə: Mağazalar idarəçi
   - Məlumat girişi: Fəaliyyət haqqında müşahidə

   **Sələr**
   - Satış əməliyyatları, müştəri qeydiyyatı
   - İstifadə: Satış nöqtəsi işçiləri
   - Məlumat girişi: Məhsul satışı

   **Buhaltər**
   - Finansal hesabatlıq, əməliyyat düzəlişi
   - İstifadə: Buhaltər departamenti
   - Məlumat girişi: Vergi və məlumatlar

   **Seifçi (Kassir)**
   - Pul işləri, çəkmə, depozit
   - İstifadə: Kassа məsulları
   - Məlumat girişi: Pul dokumentləri

3. **Rol Tamirlənməsi**
   - İstifadəçi profil səhifəsində dəyişdi
   - "Saxla" düyməsinə basın
   - Sistem yeni icazəsi tətbiq edəcəkdir

### İpuçları və Fəndləri

- Rol qrafikü iş görü (müdür gündüzü, seifçi axşamı)
- Həqiqi fəaliyyətinə uyğun rol təyin edin
- Rol dəyişdirmə də siyasi icazə aldıqdan sonra həyata keçirin
- Zaman-zaman role baxıb tənzimləyin
- Rolu hazırlamaq üçün test əməliyyatı aparın

### Ümumi Problemlər

**Məsələ: İstifadəçi seçilmiş rolu görmür**
- Həll: Sistemi yenidən yükləməyi sınayın
- Brauzer keş belliyini təmizləyin
- Admin olaraq dəstəyə müraciət edin

**Məsələ: Rol dəyişdirdikdən sonra icazə vermir**
- Həll: İstifadəçinin sistemi tərk etib yenidən daxil olmasını sağlayın
- Şifrə dəyişdirmə təklif edin

---

#### 14. İcazə tənzimləmələri

## İcazə tənzimləmələri

### Giriş

İcazə tənzimləmələri istifadəçinin sahəyə erişim derecəsini çox ayrıntılı müəyyən edir. Eyni rol içində fərqli icazələr mümkündür. Məsələn, bir sələr satış edə biləri amma indirim verə biləri yoxdu.

### Addım-addım Təlimat

1. **İcazə Səhifəsinə Keçid**
   - İstifadəçi profil səhifəsində "İcazə Tənzimləmələri" bölməsini açın
   - Rol seçdikdən sonra icazə siyahısı açılacaq

2. **Əsas İcazələrin Təyin Edilməsi**

   **Satış Əməliyyatları**
   - Satış yarada bilər - Belə/Yoxdur
   - Satışı məmləl edə bilər - Belə/Yoxdur
   - İndirim verə bilər - Belə/Yoxdur
   - İndirim maksimum faiz - 0-100 arası

   **Məhsul İdarəsi**
   - Məhsul əlavə edə bilər - Belə/Yoxdur
   - Məhsul qiymətini dəyişə bilər - Belə/Yoxdur
   - Məhsul silə bilər - Belə/Yoxdur

   **Hesabatlıq**
   - Gündəlik hesabat görə bilər - Belə/Yoxdur
   - Aydın hesabat görə bilər - Belə/Yoxdur
   - Yıllıq hesabat görə bilər - Belə/Yoxdur

3. **İstifadəçi-Spesifik İcazələr**
   - Hər istifadəçi üçün fərdi icazə sağlamaq mümkündür
   - "Xüsusi İcazə Əlavə Et" düyməsinə basın
   - İcazə tipini açılır siyahıdan seçin
   - Müddətini müəyyən edin (opsional)

4. **İcazənin Tətbiqi**
   - Bütün ayarlamaları yoxlayın
   - "Saxla" düyməsinə basın
   - İcazə dərhal tətbiq olunacaq

### İpuçları və Fəndləri

- Ən kiçik icazə prinsipini tətbiq edin - sadəcə lazım olanı verin
- Mühüm əməliyyatlar üçün (məhsul silmə) Admin icazəsi tələb edin
- İndirim icazəsini sələrlərin mübaşir ilə verilməsini şərtləndirin
- Yüksək qiyməti məhsullar üçün əlavə icazə tələb edin
- İcazə dəyişdirmə tarixini qeyd edin

### Ümumi Problemlər

**Məsələ: İcazə əlavə edilə bilmir**
- Həll: Admin rolunun olduğundan əmin olun
- Dəstəyin tərəfdən istifadəçi əlavə etmələrini sağlayın
- Sistem servisi yenidən başlatmağı sınayın

**Məsələ: İstifadəçi icazə verildiyini söyləmişdir, edin edə bilmir**
- Həll: İcazə siyahısını qapayib yenidən açın
- İstifadəçinin sistemi yenidən daxil olmasını sağlayın
- Rolunun doğru olduğunu yoxlayın

---

#### 15. Şifrə sıfırlama

## Şifrə sıfırlama

### Giriş

Şifrə sıfırlama güvənlik məsələsində mühüm prosesdir. Unutulmuş şifrələri bərpa etməji, güvenliksiz şifrələri dəyişdirmə XPOS-da sadə və təhlükəlidir. Admin olmalı şifrə sıfırlama icazəsi almalıdır.

### Addım-addım Təlimat

1. **Şifrə Sıfırlama Səhifəsinə Keçid**
   - "Sistem Ayarları" → "İstifadəçi İdarəsi" bölməsinə daxil olun
   - İstifadəçi siyahısından şifrəsi sıfırlanacaq şəxsi seçin
   - "Şifrə Sıfırla" düyməsinə basın

2. **Sıfırlama Prosesi**
   - Sistem təsdiq mesajı göstərəcəkdir
   - "Bəli, sıfırla" düyməsini seçin
   - Sistem yeni sıfra (temp) yaradacaq

3. **Yeni Şifrəni İstifadəçiyə Çatdırma**
   - Yeni şifrəni "Kopyala" düyməsi vasitəsilə kopyalayın
   - E-mail və ya şəxsən istifadəçiyə çatdırın
   - İstifadəçiyə ilk girişdə şifrəni dəyişmə talimatı verin

4. **İstifadəçi Şifrəsini Dəyişdirmə**
   - İstifadəçi sistem daxil olur
   - Yeni şifrə daxil edir
   - "Profil" → "Şifrə Dəyişdir" bölməsinə keçər
   - Köhnə şifrəni (temp) daxil edir
   - Yeni güclü şifrə yaradır

### İpuçları və Fəndləri

- Yeni şifrənin 8 simvoldan çox olmasını tövsiyi edin
- Böyük-kiçik hərflər, rəqəmlər və simvollar istifadə edin
- Şifrə dəyişdirmə zamanını saat-saat izləyin
- Arşividə sıfırlama tarixini qeyd edin
- Təkrar sıfırlamaları əngəlləmək üçün audit log baxın

### Ümumi Problemlər

**Məsələ: Yeni şifrə almaq mümkün deyil**
- Həll: Admin olaraq daxil olduğundan əmin olun
- İstifadəçinin aktivliyinin (aktiv, dökunülmüş) yoxlayın
- Sistem qeydlərini yoxlayın

**Məsələ: İstifadəçi yeni şifrə ilə daxil olmaq mümkün deyil**
- Həll: Temp şifrə sayını yoxlayın (kopiya zamanı səhv)
- Caps Lock'un AÇIQ olmadığını yoxlayın
- Sistem taraçı (cache) təmizləyin

---

#### 16. İstifadəçi aktivləşdirmə/deaktivləşdirmə

## İstifadəçi aktivləşdirmə/deaktivləşdirmə

### Giriş

İstifadəçi aktivləşdirmə/deaktivləşdirmə işçilərin gəlişməsi, ayrılması və cəzanın müddətli pauzası hallarında istifadə olunur. Deaktiv istifadəçi sisteme daxil olmaq mümkün deyil, hətta tarixçə saxlanılır.

### Addım-addım Təlimat

1. **İstifadəçi Statusunun Yoxlanılması**
   - "Sistem Ayarları" → "İstifadəçi İdarəsi" bölməsinə keçin
   - İstifadəçi siyahısında statusu ("Aktiv" yəhut "Deaktiv") yoxlayın

2. **Deaktivləşdirmə Prosesi**
   - İstifadəçi profilini açın
   - "Status" bölməsində "Deaktiv" seçin
   - Deaktivləşdirmə səbəbini yazın (opsional):
     * İş ayrılması
     * Cəza
     * Tətil müddəti
     * Digər
   - "Saxla" düyməsinə basın

3. **Deaktiv Qeydlərin Sürət Vəziyyətinin Müşahidə Edilməsi**
   - Deaktiv istifadəçi satış əməliyyatlarında iştirak edə biləri yoxdu
   - Keçmiş əməliyyatlar arşivdə saxlanılır
   - Rəportlarda deaktiv kimi işarələnir

4. **Yenidən Aktivləşdirmə**
   - İstifadəçi profili açın
   - "Status" bölməsində "Aktiv" seçin
   - Yenidən aktivləşdirmə səbəbini yazın (opsional)
   - "Saxla" düyməsinə basın

### İpuçları və Fəndləri

- Deaktivləşdirmə səbəbini həmişə qeyd edin (daha sonra yoxlamaq üçün)
- Deaktiv istifadəçinin rəportlarını arxivləyin
- Tətil müddətindən əvvəl takvim ayarla
- Tərk əməliyyatı tamamlandıqdan sonra deaktiv edin
- Yenidən işə qəbul halında, köhnə profilini activated edin

### Ümumi Problemlər

**Məsələ: Deaktiv istifadəçi hələ daxil oldu**
- Həll: Sistem keşini (cache) təmizləyin
- İstifadəçinin gözləyib yenidən sistem daxil olmasını sağlayın
- Admin panelində statusun "Deaktiv" olduğunu yoxlayın

**Məsələ: Yenidən aktivləşdirmə bərə vermir**
- Həll: Şifrə sıfırlama əməliyyatı aparın
- Admin olaraq daxil olduğundan əmin olun
- Sistem servisi yenidən başlatmağı sınayın

---

#### 17. Fəaliyyət qeydləri

## Fəaliyyət qeydləri

### Giriş

Fəaliyyət qeydləri (Audit Logs) sistemi istifadə edən hər bir istifadəçinin hər bir əməliyyatını qeydə alır. Xətaları tapmağa, davranışı izləməyə və güvənliyi artırmağa kömək edir. Hər qeyd zaman damgası, istifadəçi, əməliyyat tipi və nəticəsini ehtiva edir.

### Addım-addım Təlimat

1. **Qeydlər Səhifəsinə Keçid**
   - "Sistem Ayarları" → "Fəaliyyət Qeydləri" bölməsinə daxil olun
   - Qeydlərin siyahısı göstəriləcəkdir

2. **Qeydləri Filtirləmə**
   - **İstifadəçi adı ilə**: Siyahıdan istifadəçi seçin
   - **Tarix ilə**: Başlanğıc və son tarixi daxil edin
   - **Əməliyyat tipi ilə**: Satış, Məhsul, İdarəçilik seçin
   - **Nəticə ilə**: "Başarılı" və ya "Xəta" seçin

3. **Qeydin Detallarını Görüntülləmə**
   - Hər qeydin yanında "Detalları Gör" düyməsini tapın
   - Qeydin tam məlumatlarını sıra-sıra görüntüləyin:
     * Tarix və saat
     * İstifadəçi adı
     * Əməliyyat tipi
     * Detallar (nə dəyişdi?)
     * Nəticə (Başarılı/Xəta/Ləğv)

4. **Qeydləri İxraç Etmə**
   - "Excel İxracı" düyməsinə basın
   - Filtirləmə şərtləri ötürülüb idat olacaq
   - Excel dosyası yükləməsinə başlanacaq

### İpuçları və Fəndləri

- Hər gün işin sonunda mühüm qeydləri yoxlayın
- Aylıq cəm qeydləri işarə edin
- Şübhəli aktivitələr üçün tarixçəni araştırın
- Qeydləri 6 ay-1 il saxlayın (vergiqanun tələbi)
- Qeydləri Excel-ə ixrac edərək kağıza çap edin

### Ümumi Problemlər

**Məsələ: Qeydlər göstərilmir**
- Həll: Tarix aralığını yoxlayın (çox uzun aralıq yavaşlatabilir)
- Filterləri sıfırla ("Hamısını Göstər" seçin)
- Sistem qeydlərinin fəal olduğundan əmin olun

**Məsələ: Çox qeyd vardır, kəsilməsi çətindir**
- Həll: Tarix aralığını dar edin (1-2 haftaya limit edin)
- İstifadəçi filtirini istifadə edin
- Excel'ə ixrac edip orada analiz edin

---

## KATEQORİYA 10: XİDMƏT VƏ KİRAYƏ

#### 18. Xidmət Əməliyyatı

## Xidmət Əməliyyatı

### Giriş
Xidmət əməliyyatları, müştərilərə təqdim edən hər cür xidmətləri rəsmiləşdirmə prosesidir. Saç ustası, avtomobil təmiri, texniki dəstək və s. kimi xidmətlər bu bölmədə qeydiyyatdan keçirilə bilər.

### Addım-addım Təlimat

1. **Xidmət Əməliyyatı Açma:**
   - Ana menyuda "Satış" sekmesini seçin
   - "Xidmət Əməliyyatı" düyməsini basın
   - Yeni xidmət forması açılacaq

2. **Xidmət Məlumatlarını Doldurma:**
   - Xidmət adını daxil edin (məs: "Mobil Telefon Təmiri")
   - Xidmət kateqoriyasını seçin
   - Qiymət dəyərini həqiqətən qeyd edin
   - Xidmət müddətini (dəqiqə, saat) göstərin

3. **Müştəri Məlumatları:**
   - Müştərinin telefon nömrəsini daxil edin
   - Şəxsi məlumatları qeyd edin
   - Xidmət başlama tarixini seçin

4. **Xidmətin Tamamlanması:**
   - Xidmət başa çatdığında "Tamamlandı" statusunu seçin
   - Ödəniş metodunu təyin edin
   - "Satış Tamamla" düyməsini basın

### İpuçları və Fəndləri

- **Xidmət Şablonları:** Tez-tez istifadə etdiyiniz xidmətlər üçün şablonlar yaradın
- **Zaman Qeydləri:** Xidmətin həqiqətən neçə dəqiqə çəkdiyini qeyd edin, gələcək planlaşdırma üçün
- **Avtomatik Hesaplama:** Saatı üstündən keçirsəniz, sistem avtomatik əlavə rüsum əlavə edə bilər
- **Müştəri Tarixi:** Eyni müştəri üçün keçmiş xidmətləri görə bilərsiz

### Ümumi Problemlər

**Problem:** Xidməti tamamlaya bilmirəm
- **Həll:** Müştəri adı/nömrəsinin düzgün olduğundan əmin olun. Internetə bağlı olduğunuzu yoxlayın.

**Problem:** Qiymət səhvən hesablandı
- **Həll:** Xidmət müddətini və saat tarifini yenidən yoxlayın. Zərurilik halında rəqəmi əl ilə dəyişdirə bilərsiz.

---

#### 19. Kirayə Əşyaları Əlavə Etmə

## Kirayə Əşyaları Əlavə Etmə

### Giriş
Kirayə sistemi, müşteri kirayə üzrə avadanlıq, geyim və digər əşyaları izləməyə kömək edir. Bu məqalə kirayə kataloquna yeni əşya əlavə etmə prosesini əhatə edir.

### Addım-addım Təlimat

1. **Kirayə Kataloqunu Açma:**
   - Ana menyuda "Kirayə" sekmesini seçin
   - "Kataloq" və ya "Əşyalar" bölməsinə keçin
   - "Yeni Əşya Əlavə Et" düyməsini basın

2. **Əşya Məlumatlarını Doldurma:**
   - Əşyanın adını yazın (məs: "Xərəng Döşəməsi")
   - Əşya kodu/barcode-u (isteğə bağlı) daxil edin
   - Əşyanın təsviri əlavə edin (rəng, ölçü və s.)

3. **Kirayə Şərtləri:**
   - Günlük kirayə qiymətini göstərin
   - Həftəlik kirayə qiymətini (isteğə bağlı) qeyd edin
   - Aylıq kirayə qiymətini müəyyən edin
   - Zəruri Deposit miktarını göstərin

4. **Inventar Qeydləri:**
   - Əlində neçə ədəd olduğunu qeyd edin
   - Əşyanın vəziyyətini seçin (Yeni, İyi, Təmir Lazım)
   - Dəpodan məqamını göstərin (isteğə bağlı)

### İpuçları və Fəndləri

- **Barkod Etiketləri:** Hər əşyaya barkod etiketləri yapışdırın, sürətli skanında üçün
- **Fotolar Əlavə Edin:** Əşyanın fotosunu yükləyin
- **Qiymət Revizyonları:** Mövsümü əsasında qiymətləri avtomatik dəyişdirin
- **Kirayə Cədvəli:** Populyar əşyalar üçün standart kirayə cədvəli yaradın

### Ümumi Problemlər

**Problem:** Barcode skanı işləmir
- **Həll:** Barkodun düzgün formatda olduğundan əmin olun. Sistemə dəstəklən format yoxlayın.

---

#### 20. Kirayə Qrafikində Görüş

## Kirayə Qrafikində Görüş

### Giriş
Kirayə qrafiği, bütün kirayə əməliyyatlarını takvim formatında görməyə kömək edir. Çatışma cəhdləri qadağa etmə və müştəri tənəzzülət təmin etmə əsasında istifadə olunur.

### Addım-addım Təlimat

1. **Qrafiki Açma:**
   - Ana menyuda "Kirayə" sekmesini seçin
   - "Qrafik" və ya "Takvim" bölməsinə keçin
   - İcazə verilən ay/həftəni seçin

2. **Görüş Parametrlərini Dəyişdirmə:**
   - Üst sağda "Ay/Həftə/Gün" görüşü seçin
   - "Bu gün" düyməsi ilə cari günə qayıdın
   - Sonrakı/Əvvəlki dövr üçün oxları istifadə edin

3. **Kirayə Əməliyyatını Görə Bilmə:**
   - Müştərinin adı, kirayə müddəti, əşya sayı göstərilir
   - Rəng kodları: Yaşıl (Fəal), Sarı (Tez bitmək üzrə), Qırmızı (Gecikmiş)
   - Əməliyyata basaraq ətraflı məlumat görə bilərsiz

4. **Geri Qaytarma Rəmzləri:**
   - Siyah rəng: Müştəri geri qaytarma tarixini keçmiş
   - "Xatırladma Göndər" düyməsi ilə avtomatik mesaj göndərin

### İpuçları və Fəndləri

- **Filtrləmə:** Müştəri adı əsasında qrafiki filtirləyin
- **Məlumat İxrac Etmə:** Qrafiki PDF/Excel formatında ixrac edə bilərsiz
- **Bildiriş Ayarları:** Gecikmiş kirayələr üçün avtomatik bildiriş ayarlayın
- **Aylıq Hesablar:** Müştəri üçün aylıq kirayə hesabını avtomatik hazırlayın

### Ümumi Problemlər

**Problem:** Qrafik yüklənmir
- **Həll:** Sayfanı yeniləyin. Internetə bağlı olduğunuzu yoxlayın.

---

#### 21. Xidmət Qeydləri

## Xidmət Qeydləri

### Giriş
Xidmət qeydləri, müştəriyə təqdim edən hər cür xidmətin ayrıntılarını sənədləşdirmə sistemidir. Qayta müştəri ilə məsuliyyət münasibətini qorumaq üçün vacibdir.

### Addım-addım Təlimat

1. **Xidmət Qeydini Açma:**
   - Satış tarixçəsində xidmət seçin
   - "Qeyd Əlavə Et" düyməsini basın
   - Yeni qeyd forması açılacaq

2. **Qeyd Məlumatlarını Doldurma:**
   - Qeyd tarixini açılış qeyd edin (avtomatik qeyd olunur)
   - Xidmət məqsədini ayrıntılı şəkildə yazın
   - İstifadə edilən materialları/alətləri siyahıya alın
   - Müştəri tələbi varsa, xüsusi tərəfləri qeyd edin

3. **Texniki Məlumatlar:**
   - Problemin açıq şərhini yazın
   - Həll yolu üçün addımları sadalayın
   - İstifadə edilən hissələrin fiyatlarını qeyd edin
   - Qarantiyanın müddətini göstərin (əgər varsa)

### İpuçları və Fəndləri

- **Şablonlar:** Tez-tez xidmətlər üçün standart qeyd şablonları yaradın
- **Fotolar:** Şərtikləmə prosesinin fotolarını qeyd əlavə edin
- **Təsvir Dili:** Hər zaman miqyaslı və peşəkarcə dil istifadə edin
- **Çoxdilli Qeydlər:** Müştəri istəsə, qeydləri onun dili ilə yazın

### Ümumi Problemlər

**Problem:** Qeyd saxlanıla bilmir
- **Həll:** Bütün vacib sahələrin doldurulduğundan əmin olun. Internetə bağlı olduğunuzu yoxlayın.

---

#### 22. Avadanlıq Təmiri Qeydləri

## Avadanlıq Təmiri Qeydləri

### Giriş
Avadanlıq təmiri qeydləri, işdə istifadə olunan cihazların baxım və təmiri tarixçəsini tutur. Bu, uzunmüddətli avadanlıq idarəsi üçün kritik əhəmiyyətli.

### Addım-addım Təlimat

1. **Avadanlıq Döngüsünü Açma:**
   - Ana menyuda "Ayarlar" sekmesini seçin
   - "Avadanlıq" bölməsinə keçin
   - "Avadanlıq Siyahısı" seçin

2. **Avadanlıq Qeydləri:**
   - Avadanlığın adını seçin (məs: "Kassa Makinesi #1")
   - "Baxım Tarixi" sekmesini açın
   - "Yeni Baxım Əlavə Et" düyməsini basın

3. **Baxım Məlumatlarını Doldurma:**
   - Baxım tarixini seçin
   - Baxım tipini seçin (Planlanan, Təcili, Rutin)
   - Problemi qeyd edin
   - Həll yolunu dəqiq yazın

4. **Baxım Sonrası:**
   - Avadanlığın status "İşdə" / "Təmir Altında" dəyişin
   - Tamamlandı işarəsini qoyun
   - Sonrakı planlanan baxım tarixini göstərin

### İpuçları və Fəndləri

- **Planlanan Baxım Cətvəli:** Hər avadanlıq üçün planlanan baxım cətvəli yaradın
- **Xərcin İzlənməsi:** Hər avadanlıq üçün toplam baxım xərcini təqib edin
- **Xəbərdarlıq Sistemi:** Planlanan baxımdan əvvəl avtomatik xəbərdarlıq alın
- **Təmiri Tarixi:** Uzun müddətli xidmət tarixini saxlayın

### Ümumi Problemlər

**Problem:** Keçmiş baxım qeydlərini tapa bilmirəm
- **Həll:** Avadanlığa basaraq "Baxım Tarixi" sekmesini açın. Tarix filtrini istifadə edin.

---

## KATEQORİYA 11: MALİYYƏ İDARƏSİ

#### 23. Xərc Qeydləri

## Xərc Qeydləri

### Giriş
Xərc qeydləri sistemi, işdə istifadə olunan hər cür xərcləri rəsmiləşdirməyə və izləməyə kömək edir. Stafçı maaşından təchizata qədər, hər xərci qeyd etmə mümkündür.

### Addım-addım Təlimat

1. **Xərc Menüsünə Daxil Olma:**
   - Ana menyuda "Maliyyə" sekmesini seçin
   - "Xərc Qeydləri" bölməsinə keçin
   - "Yeni Xərç Əlavə Et" düyməsini basın

2. **Xərc Kateqoriyasını Seçmə:**
   - Xərc kateqoriyası seçin:
     * Təchizat (Qaynaqqalar, Plastik Torbalar)
     * Maaş (Stafçı maaşları, Bonus)
     * İcarə (Binanın kirasının, Ödənişlər)
     * Kommunal (Elektrik, Su, İnternet)
     * Digər

3. **Xərc Məlumatlarını Doldurma:**
   - Xərçin səbəbini qısa adlandırın
   - Xərçin məbləğini daxil edin
   - Ödəniş metodunu seçin (Nəqd, Bank Köçürmə, Kart)
   - Tarixi qeyd edin (avtomatik: cari tarix)

4. **Sənəd Əlavə Etmə:**
   - Fatura/Qəbz rəsmini əlavə edin
   - Tədarükçü məlumatlarını qeyd edin (isteğə bağlı)
   - Qablaşdırma əçarı/Sifariş nömrəsini yazın

5. **Xərcin Tamamlanması:**
   - Hər məlumatı yoxlayın
   - "Yadda Saxla" düyməsini basın
   - Sistem avtomatik mühasibə hesabına qeyd edəcəkdir

### İpuçları və Fəndləri

- **Məbləğ Batches:** Eyni kateqoriyanın içində çoxlu kiçik xərçləri bir dəfəyə qeyd edə bilərsiz
- **Təkrarlanan Xərçlər:** Rəvayət ödənişlər üçün "Avtomatik Xərc" ayarlayın
- **Sorğu Qurğusu:** "Bu ay cəmi xərc nədir?" kimi sorğuları hazırlayın
- **Təcili Xərçlər:** Böyük xərçlər üçün onay prosesi qurun

### Ümumi Problemlər

**Problem:** Xərc saxlanılmır
- **Həll:** Bütün vacib sahələrin doldurulduğundan əmin olun. Məbləğin düzgün formatda olduğundan yoxlayın.

---

#### 24. Tədarükçü Krediti

## Tədarükçü Krediti

### Giriş
Tədarükçü krediti, işletmənin tədarükçü ilə mal/xidmət alması, amma ödənişi daha sonra qaytarması məkanizmidir. Bu, pul axını idarəsində mühüm rol oynayır.

### Addım-addım Təlimat

1. **Tədarükçü Krediti Formasını Açma:**
   - Ana menyuda "Maliyyə" sekmesini seçin
   - "Tədarükçü Krediti" bölməsinə keçin
   - "Yeni Kredit Əlavə Et" düyməsini basın

2. **Tədarükçü Məlumatları:**
   - Tədarükçü adını seçin (mövcud Siyahıdan)
   - Tədarükçü telefon nömrəsini tamamlayın
   - Tədarükçü hesab nömrəsini yazın (isteğə bağlı)

3. **Kredit Şərtlərini Təyin Etmə:**
   - Kredit məbləğini daxil edin
   - Ödəniş müddətini göstərin (məs: 30 gün)
   - Faiz dərəcəsi (əgər varsa)
   - Başlama tarixini seçin

4. **Mallar/Xidmətlərin Siyahısı:**
   - Alınan mal/xidmətləri sadalayın
   - Hər bir əşya üçün məbləğ yazın
   - Cəmi məbləği hesablayın
   - Mal sənədli/Qəbz fotolarını əlavə edin

5. **Geri Ödəmə Tərtibi:**
   - Bircə ödəmə ya hissə-hissə ödəmə seçin
   - Ödəmə cədvəlini yaradın
   - Hər ödəmə tarixini göstərin
   - Xatırlatma tarixini qurun

### İpuçları və Fəndləri

- **Krediti Zaman Gözləyin:** İşletmə büyüsü üçün krediti dəqiq istifadə edin
- **Tədarükçü İlişkiləri:** Müsbət krediti tarixçəsi ilə daha yaxşı şərtlər əldə edə bilərsiz
- **Ödəmə Xatırlatması:** Sistemə "Ödəmə Xatırlatma" göndərmə ayarını qurun
- **Faiz Hesabı:** Faiz dərəcəsini düzgün göstərin

### Ümumi Problemlər

**Problem:** Tədarükçü kredit formasında hesablama yavaş
- **Həll:** Sayfanı yeniləyin. Böyük siyahıları filtirləmə seçeneğini istifadə edin.

---

#### 25. Əməkdaş Maaşları

## Əməkdaş Maaşları

### Giriş
Əməkdaş maaş sistemi, işçilərin maaşlarını hesablamaq, ödəmə planlaşdırmaq və vergilər əsasında düzəlişlər etməyə kömək edir. Qanuni uyğunluğu qorumaq üçün vacibdir.

### Addım-addım Təlimat

1. **Maaş Modulu Açma:**
   - Ana menyuda "HR" ya da "Maliyyə" sekmesini seçin
   - "Maaş" bölməsinə keçin
   - "Maaş Cətveli" sekmesini açın

2. **Əməkdaş Maaş Məlumatlarını Qurmaq:**
   - Siyahıdan əməkdaşı seçin
   - "Maaş Dəyərləri" sekmesine keçin
   - Əsas maaşı qeyd edin
   - Əlavə ödənişləri göstərin (Bonus, İşlək Vaxt)

3. **Maaş Hesabı:**
   - Sistem otomatik əsas maaş + əlavələr hesablar
   - Vergιləri otomatik hesablar
   - "Saf Maaş" (Net Salary) göstərilir
   - İnsan Kaynakları Nəzarəti Hissəsinə çıkartma (isteğə bağlı) yapılır

4. **Hesablamaya Ek Tənzimləmə:**
   - Xərçi büyütüşmə (Allowance) əlavə edə bilərsiz
   - Kəsintilər (Deductions) qeyd edə bilərsiz
   - Qoyuma (Advance Salary) əlavə edin
   - Dənə işləmiş saat əlavə edin

5. **Ödəniş Qeyd Etmə:**
   - Ödəmə metodunu seçin (Nəqd, Bank Köçürmə)
   - Ödəniş tarixini göstərin
   - Ödəmə Alındı işarəsini əməkdaş tərəfində alın
   - Maaş Sürəti (Salary Slip) yazdırın

### İpuçları və Fəndləri

- **Maaş Səbətləri:** Müxtəlif əməkdaş qrupları üçün maaş şablonları yaradın
- **Otomatik Hesaplama:** Sabit əməkdaşlar üçün otomatik maaş ödəmə qurun
- **Vergi Uyum:** Yerli vergi qanunlarına uyğun vergi oranlarını düzəltən saxlayın
- **Tarixi Qeyd:** Bütün ödəmə tarixçəsini tutun

### Ümumi Problemlər

**Problem:** Vergiler səhvən hesablanır
- **Həll:** Əməkdaşın Şəxsi Məlumat Formasındakı Vergi ID-nin düzgün olduğundan əmin olun.

---

#### 26. Ödəniş Xülasəsi

## Ödəniş Xülasəsi

### Giriş
Ödəniş xülasəsi, bir müəyyən dövr üçün bütün ödənişləri cəm edən hesablanış. Bu, mühasibə dərlikləşməsi işkəsdədir (Reconciliation).

### Addım-addım Təlimat

1. **Ödəniş Xülasəsi Menüsünü Açma:**
   - Ana menyuda "Maliyyə" sekmesini seçin
   - "Ödəniş Xülasəsi" bölməsinə keçin
   - Dönem seçin (Gün, Həftə, Ay)

2. **Xülasə Filtirlərini Seçmə:**
   - Tarix aralığını seçin
   - Ödəniş metodunu filtirləyin (Nəqd, Kart, Bank)
   - Kassa/Qapı seçin (Birden çox kassanız varsa)
   - Məbləğ aralığı filtirlərini (isteğə bağlı) daxil edin

3. **Xülasə Məlumatlarını Görüntüleme:**
   - Satılan mal/xidmət dəyəri
   - Ödəniş metoduna görə təqsim
   - Vergilər məbləği
   - Xərçlər məbləği
   - Net gəlir (Profit)

4. **Xülasəni Yazdırmaq/İxrac Etmə:**
   - "Yazdır" düyməsini basaraq Kasir Sürəti alın
   - "PDF Olaraq İxrac Et" seçərisində
   - "Excel Olaraq İxrac Et" seçərisində vergi məmurlığına sunmaq üçün

5. **Xülasə Doğrulama:**
   - Nəqd əldə tutduğunuz məbləğ ilə müqayisə edin
   - Diskrepansiyası varsa araştırın
   - Qəbul işarəsini qoyun

### İpuçları və Fəndləri

- **Günlük Xülasə:** Hər gün kasa saatında günlük xülasə alın
- **Qıraqlanma Kontrol:** Hər məbləğin doğru sayıldığından əmin olun
- **Rə əl Tutuş:** Sistem dışı ödənişləri müəyyən edin
- **Aylıq Balans:** Hər ay sonu balans hesab çıkarın

### Ümumi Problemlər

**Problem:** Nəqd məbləği sistemdə göstərilən məbləğe uyğun gəlmir
- **Həll:** Qəbulu bölməsinə baxın, sistem dəyişikliklərini yoxlayın.

---

#### 27. Gəlir-Xərc Balansı

## Gəlir-Xərc Balansı

### Giriş
Gəlir-xərc balansı (Income Statement), işdə müəyyən dövrdə nə qədər gəlir əldə olunduğunu və nə qədər xərc çəkildiyini göstərən məcmu hesabdır. Bu, işletmənin sağlıqlı olub olmadığını anlamaq üçün kritik əhəmiyyətlidir.

### Addım-addım Təlimat

1. **Balans Hesab Modulu Açma:**
   - Ana menyuda "Maliyyə" sekmesini seçin
   - "Balans Hesab" ya da "Gəlir-Xərc" bölməsinə keçin
   - Dönem seçin (Ay, Rüb, İl)

2. **Gəlir Bölümünü Görüş:**
   - Satış gəliri
   - Xidmət gəliri
   - Digər gəlir (Faiz, Kiraya)
   - Cəmi Gəlir (Total Revenue)

3. **Xərc Bölümünü Görüş:**
   - Tədarükçü xərçləri
   - Stafçı maaşları
   - İcarə/Kirayə
   - Kommunal (Elektrik, Su, İnternet)
   - Digər xərçlər
   - Cəmi Xərçlər

4. **Kar Hesabı:**
   - Cəmi Gəlir - Cəmi Xərçlər = Net Kar
   - Kar Marjini (Profit Margin) % müəyyən edən
   - Tarix əvəl ilə müqayisə göstərən

5. **Balans Hesab Yazdırma:**
   - "Balans Hesab" sənədi yazdırın
   - Vergi məmurlığına sunmaq üçün qeyd edin
   - Bank ilə mühasəbə (Reconciliation) üçün saxlayın

### İpuçları və Fəndləri

- **Aylıq Balans:** Hər ay sonu balans hesab çıkarın
- **Kar Marjini Analiz:** Hansı mal/xidmətlərin yüksək marjin verdiyi müəyyən edin
- **Xərc Nəzarəti:** Yüksək xərcləri azaltmaq üçün imkanları axtarın
- **Rəqabətçi Analiz:** Tarix əvəl ilə müqayisə edərək inkişafı ölçün

### Ümumi Problemlər

**Problem:** Balans hesab səhvən göstərilir
- **Həll:** Gəlir və xərc qeydlərinin düzgün olduğundan əmin olun. Sistem dəqiqliyi yoxlayın.

---

## KATEQORİYA 12: PROBLEMIN HƏLLI

#### 28. Daxil Olma Problemləri

## Daxil Olma Problemləri

### Giriş
Daxil olma problemləri, sistem hesabına giriş əngəli yaşayan istifadəçilərə çökmə məqsədidir. Hər cür parolu, bimə, və ya əhvali məsulləri burada tapıla bilər.

### Ümumi Daxil Olma Problemləri

**1. Parol Yanlışlığı**
- Parolunuzu yenidən qeydlə yoxlayın
- "Parolumu Unuttum" düyməsini basın
- E-poçtuna göndərilən bağlantı ilə yeni parol yaratın
- Əgər linkə daxil olmadıysanız, spam qovluğuna baxın

**2. Hesab Kilidlənməsi**
- 5 dəfə parolu yanlış girərdiysə, hesab 30 dəqiqə kilidlənir
- "Kilidlənmiş Hesab" bölməsinə keçin
- Təhlükəsizlik soruşturmasını cavablandırın
- SMS ya da E-poçt ilə təsdiq kodu alın

**3. İki Addımlı Doğrulama (2FA) Problemləri**
- Telefonda 2FA uyğulmasını açın
- "Doğrulama Kodunu Gir" bölməsinə 6 rəqəm kodunu yazın
- Kodunun vaxtı bitmiş varsa, yeni kod tələb edin
- Telefonu kaybetmişsə, Administrator hökmünə əlaqə kurun

**4. E-poçt Dəqiqləşdirmə**
- Sistem, ilk dəfə daxil olarkən e-poçtu təsdiq edir
- E-poçtunuza göndərilən linki basın
- Spam qovluğunda axtarın
- 24 saat sonra hesab avtomatik təhlükəsiz ediləcəkdir

### İpuçları və Fəndləri

- **Parolunuzu Saxlayın:** Parolu "Parol Meneceri"də saxlayın
- **2FA Açın:** Əlavə təhlükəsizlik üçün 2FA istifadə edin
- **Şəxsi Məlumatı Güncəlləyin:** E-poçt, telefon, adres cari saxlayın
- **Oflayn Rejimdə Giriş:** Əgər internet yoxdursa, əvvəlcə yüklənmiş uyğulama istifadə edin

### Ümumi Problemlər

**Problem:** "Hesab Tapılmadı" xətası alırım
- **Həll:** Daxil olmaq üçün istifadə etdiyiniz e-poçtun düzgün olduğundan əmin olun.

---

#### 29. İnternet Bağlantısı Problemləri

## İnternet Bağlantısı Problemləri

### Giriş
İnternet bağlantısı problemləri, XPOS sisteminin cloud hesabına ulaşamama vəziyyətidir. Hər cür ağ xətasının həlli burada göstərilir.

### Ümumi Bağlantı Problemləri

**1. "Şəbəkəyə Bağlı Deyilsiniz" Xətası**
- WiFi ya da Kabel ilə bağlı olduğunuzdan əmin olun
- Router-i 30 saniyə qapatın, sonra açın
- İP ünvanını yeniləyin
- Başqa WiFi ilə sınayın

**2. "Servera Bağlınamıyorum" Xətası**
- Serverin statusunu yoxlayın
- Firewall ayarlarınızı kontrol edin
- VPN istifadə edirsəniz, kəsin
- Administrator hökmünə rapor edin

**3. Yavaş İnternet Bağlantı**
- Başka uyğulama kapalı edin
- Modemə yaxınlaşın
- WiFi kanalını dəyişdirin
- İnternet sürətini test edin

**4. Bağlantı Kəsilişi (Intermittent Connection)**
- Modem yenidən başlatın
- Router antennasını yenidən açın
- İnterneti sağlayan şirkəti əlaqə kurun
- Offline Mode istifadə edin

### İpuçları və Fəndləri

- **Offline Mode:** İnternet olmadıqda da satış edə bilərsiz
- **Mobil Hotspot:** Əgər WiFi bozulsa, telefon hotspot-u istifadə edin
- **Aktibləşdirilmiş Bağlantı:** İnternet sağlayıcısında qəbz yoxlayın
- **Ağ Ayarları:** Şəbəkə administraoru tərəfən XPOS server portu açılmalıdır

### Ümumi Problemlər

**Problem:** Ofislərdə internetim var, ancaq XPOS açılmırsa
- **Həll:** İşdə Firewall/Proxy var ola bilər. IT administraoru ilə əlaqə kurun.

---

#### 30. Printer Problemləri

## Printer Problemləri

### Giriş
Printer problemləri, XPOS sistemindən qiymətlilik, mərula, ya da fis çıxarıla bilməməsi hallarıdır. Hər cür printer xətasının həlli burada verilir.

### Ümumi Printer Problemləri

**1. "Printer Tapılmadı" Xətası**
- Printerin aydınlandığından əmin olun
- Printerin XPOS sistemində qeydiyatlandığını yoxlayın
- USB kabeli yenidən qoşun
- Printer sürücüsünü yenidən qurğulayın

**2. Kağız Bitir (Paper Out)**
- Printer kağıt haznesini açın
- Yeni kağız rulonunu quraşdırın
- Kağızın tam yerləşdiyindən əmin olun
- Kapağı bağlayın, printerdə "Reset" basın

**3. Sürücü Problemi**
- Windows: Devices and Printers > Right-click Printer > Troubleshoot
- Mac: System Preferences > Printers & Scanners
- Sürücü yenidən qurğulayın
- Windows Printer Troubleshooter-i çalıştırın

**4. Yazıçı/Şirə Bitir (Ink/Toner Low)**
- Yazıçı bildirilir varsa, yeni yazıçı cartridge quraşdırın
- Yazıçı qutosunu kaldırın
- Yeni cartridge-i düzgün istiqamətə qoşun
- Kapağı bağlayın, printer otomatik kalibre edəcəkdir

### İpuçları və Fəndləri

- **Düzenli Baxım:** Printerə aylıq olaraq kağız mişiyi qaçırın
- **Kağız Seçimi:** Standart termal kağız istifadə edin
- **Yedək Sürücü:** Sürücü CD-sini təhlükəli yerə saxlayın
- **Aktibləşdirilmiş Bağlantı:** Printer bağlantısını həmişə kontrol edin

### Ümumi Problemlər

**Problem:** Printer işləyir, amma mərula çapı yavaş
- **Həll:** Prinaterin kağız sensoru pis olabilir. Kağız mişiyi ilə təmizləyin.

---

#### 31. Məlumat Sinxronizasiyası Problemləri

## Məlumat Sinxronizasiyası Problemləri

### Giriş
Məlumat sinxronizasiyası, mobil cihaz ya da başka terminalda əl ilə qeyd etdiyiniz məlumatların XPOS sisteminin mərkəz server-inə ötürülməsini təmin edir.

### Ümumi Sinxronizasyon Problemləri

**1. "Sinxronizasyon Başarısız Oldu" Xətası**
- İnternet bağlantınızı yoxlayın
- XPOS serverinin işlədiyini yoxlayın
- Sistemi yenidən açıb-bağlayın
- Bulud axını boş yerə gözləyin

**2. Məlumatlar Sinxron Olmadığı**
- "Sinxronizasiya" bölməsinə keçin
- "Yoxla" düyməsini basın
- Pending məlumatları görün
- "Sinxronizasiya Etdirin" basılan

**3. Çox Vaxt Sinxronizasyon**
- İnternet sürətini sınayın
- Yavaş ağ varsa, Oflayn Mode istifadə edin
- Serverin yüksek yüklü olmadığını yoxlayın

**4. Dublikat Məlumatlar**
- Server eyni qeydi 2 dəfə qeyd etmiş ola bilər
- "Sinxronizasyon Tarixçəsi"nə keçin
- Dublikatları müəyyən edin
- Birini sil, digərini saxla

### İpuçları və Fəndləri

- **Qəmə Başında Sinxronizasyon:** Hər axşam internetə bağlan
- **Yığın Sinxronizasyon:** Çox məlumatlanızsa, gecə vaxtında işə salan
- **Bağlantılı Cihazlar:** Bütün terminallar eyni server-ə bağlanmış olmalıdır
- **Zaman Sürü:** Cihazınızda saat sürü düzgün olmalıdır

### Ümumi Problemlər

**Problem:** Mobil ilə qeyd etdiyim satış server-ə gəlmir
- **Həll:** Mobil internetini açın, sinxronizasyonu əl ilə başlat.

---

#### 32. Sistem Yavaşlığı

## Sistem Yavaşlığı

### Giriş
Sistem yavaşlığı, XPOS uyğulayıcısının ya məhalı cihazın yavaş işləməsini göstərir. Bu, iş effektivliyini azaldır. Optimizasyon yolları burada göstərilir.

### Ümumi Yavaşlıq Problemləri

**1. Menü Açılması Yavaş**
- Başarısız uyğulama qapatın
- Cihazı yenidən başlatın
- XPOS uyğulayıcısını yeni versiyaya güncəlləyin
- Cihaz RAM-ı azdır

**2. Satış Qeydləri Yavaş**
- Məlunat bazası böyük ola bilər
- Məlunatları "arxivləmə" modu yapılan
- Depo sistemində çok sayda məhsul varsa, filtrlərin istifadə edin
- RAM yeterli olmayabilir

**3. Reportlar Yavaş Yüklənir**
- Tarix aralığını dar tutun
- Filtrləri istifadə edin
- Background-da başka işi bağlayın
- Server-in yavaş olarsa, İnternet sürətini yoxla

**4. Kassa Cihazı Donmuş Görünür**
- Ekrana dokunun
- "Cəbren Bağlayıb Açma" komut istifadə edin
- iOS: Ekranı kapatıb açmak
- Android: Settings > Apps > XPOS > Force Stop

### İpuçları və Fəndləri

- **Hafif Modun İstifadəsi:** Ayarlar > Appearance > "Hafif Rejim" seçin
- **Arka Planda Sinxronizasyon Deaktiv:** Arka planda sinxronizasyon aktiv olarsa yavaşlar
- **Başka Uyğulama Bağlayın:** Facebook, Maps, Chrome artıq RAM istifadə edən
- **Cihaz Yenidən Başlatma:** Həftə bir dəfə cihazı yenidən başlatın

### Ümumi Problemlər

**Problem:** Her gün sistem yavaşlaşırsa
- **Həll:** Gecə saat 2-4 arası sistem otomatik optimizasyon çalıştırır.

---

#### 33. Dəstək Sorğusu Açmak

## Dəstək Sorğusu Açmak

### Giriş
Dəstək sorğusu, XPOS sistem problemini Administrator/dəstək cəmiyyətinə bildirmə prosesidir. Bu məqalə dəstək sorğusunun təfərrüatlı açılması prosedurunu əhatə edir.

### Addım-addım Həll Addımları

1. **Dəstək Menüsünə Daxil Olma:**
   - XPOS ana menyuda "?" yardım nişanə basın
   - Ya da Ayarlar > "Dəstəklə İletişim" seçin
   - "Yeni Sorğu Açmak" düyməsini basın

2. **Sorğu Formasını Doldurma:**
   - **Sorğu Başlığı:** Problemi qısa adlandırın
   - **Sorğu Kateqoriyası:** Seçin (Teknik, Ödəniş, Məlumat, Digər)
   - **Üstünlük Səviyyəsi:** Seçin
     - Aşağı: Soran başta deyil (2-3 gün)
     - Normal: Adi problem (24 saat)
     - Yüksək: İş durmuş (4-6 saat)
     - Acil: İş tamamilə durmuş (1 saat)

3. **Təfərrüatlı Açıqlama:**
   - Problemi mümkün qədər dəqiq yazın
   - Ne zaman başladığını qeyd edin
   - Həll cəhdlərini sadalayın
   - Cihaz, versiyası, OS məlumatını yazın

4. **Ekran Şəkli/Loq Dosyasını Əlavə Etmə:**
   - "Dosya Əlavə Et" düyməsini basın
   - Problemin ekran şəklini yükləyin
   - Varsa, sistem loq dosyasını əlavə edin
   - Müştəri adı məlumatını yazın

5. **Sorğunun Göndərilməsi:**
   - "Sorğuyu Göndər" düyməsini basın
   - Sistem sorğu nömrəsü göstərəcəkdir
   - Məst ötərə bu nömrə yazın
   - Dəstəktə gedən mesajı alacaksınız

### Dəstəklə İletişim Vasitələri

**1. İçində XPOS Sorğusu Sistemi (Recommended)**
- En sürətli cavab
- Sorğu tarixçəsini görə bilərsiz
- Dosyalar əlavə edə bilərsiz

**2. E-poçt:**
- support@xpos.az
- Başlıqda sorğu nömrəsü yazın
- 24-48 saat içində cavab alacaksınız

**3. WhatsApp/Telegram:**
- +994 50 XXX XXXX (WhatsApp)
- @xpos_support (Telegram)
- En çox, saat başında cavab olur

**4. Telefon:**
- +994 12 XXX XXXX
- Səhər 9-Axşam 6 (Bazar gün hariç)

### İpuçları və Fəndləri

- **Açıqlı Sorğu:** Problemin tam təfərrüatını yazın
- **Dosya Əlavə Etmə:** Sorğuda ekran şəkli əlavə edirsə, cavab sürəsi yaxşılaşır
- **Açıq Etməmə:** Şəxsi məlumatlarını, parol, kredit kartı sorğuda yazmazın
- **Qayıtma Xəbəri:** Dəstəktən cavab gələndə işarəti tamamlanmış kimin

### Ümumi Sorğu Tipləri

**Teknik Sorğular:**
- Daxil olma, printer, internet, sinxronizasyon problemləri
- Sistem xətaları, qəza, yavaşlıq

**Ödəniş Sorğuları:**
- Abonəlik ödənişi, ayrıntılar, yeniləməsi
- Əlavə modullar, lisenziya

**Məlumat Sorğuları:**
- Keçmiş məlumatları recover, əl ilə selik/dəyişdirmə
- İxraç etdirmə (CSV, Excel)

---

## KATEQORİYA 13: KİOSK VƏ İNTEGRASİYALAR

#### 34. Kiosk Qurğusu

## Kiosk Qurğusu

### Giriş
Kiosk qurğusu, müşteri öz-özünə satın almışı ya da sifariş verməsi üçün avtomatik qurğuda XPOS sistemini quraşdırmadır. Bu, customer experience yaxşılaşdırır ve staf yükünü azaldır.

### Addım-addım Qurğu Təlimatı

1. **Kiosk Cihazının Seçilməsi:**
   - Minimum Tələb: 7-inch Tablet, iPad mini ya da 10-inch Display
   - OS: iOS, Android, ya da Windows
   - RAM: Minimum 2GB, Optimal 4GB
   - Storage: Minimum 500MB boş
   - Ekran Ölçüsü: 7 ilə 15 inç arası

2. **XPOS Kiosk Uyğulayıcısının Qurğulanması:**
   - Apple App Store / Google Play Store-dan "XPOS Kiosk" endirin
   - Qurğu tamamlandıqda, "Qurğu Başlat" basıb
   - İşletmə kodu daxil edin
   - Sistemə daxil olma məlumatlarını göstərin

3. **Kiosk Koneksiyon Ayarları:**
   - WiFi ağını seçin, parol daxil edin
   - Server ünvanını yazın
   - Offline Mode açın (Optional)
   - Printer seçin (Ödəniş qəbzü üçün)

4. **Menü Qurğusu:**
   - Müştəri görəcəyi məhsulları seçin
   - Məhsul fotoları yükləyin
   - Kategoriya nəmmərin düzəltən
   - Dili seçin (Azərbaycan, İngiliscə)

5. **Ödəniş Metodunun Qurğulanması:**
   - Kiosk tərəfən hangi ödəniş metodu istifadə ediləcəyi seçin:
     - Kredit/Debit Kart
     - NFC (Telefon Ödənişi)
     - Nəqd (Təhvil əl ilə qəbülkü)
   - Ödəniş gateway məlumatlarını daxil edin

6. **Müştəri Arayüzü Kustomizasyonu:**
   - Kioskun rəngi, şəxsə değiş (Branding)
   - "Səlam" mesajını əlavə edin
   - Qəbülün sayını göstərin
   - Alış-verişi sona erdirmə mesajını yazın

7. **Kiosk Testi:**
   - Menüdən 1-2 məhsul seçin
   - Ödəniş prosesini tamamlayın
   - Qəbzünün çapı düzgün görün
   - Sistem tarafından satışının qeyd olunduğunu yoxlayın

### İpuçları və Fəndləri

- **Ödəmə Alternatifleri:** Müşteri bu metodunu seçməz olarsa, başka metodun da sunasin
- **Ekran Koruma Vidyosu:** Kiosk etibarsız zamanı, tanıtım vidyosu göstərin
- **Rəy Sistemi:** Satın alındıqdan sonra müştəri rəy verlə biləcəyi sistem əlavə edin
- **Təhlükəsizlik:** Kiosk əl ilə Admin Modunda dəyişdilə bilməməsinin qüfl etkin

### Ümumi Problemlər

**Problem:** Kiosk tarafından ödəniş keçmişi görülmür
- **Həll:** Kiosk sinxronizasyon ayarını kontrol edin.

---

#### 35. Wolt Sifarişlərini İşləmə

## Wolt Sifarişlərini İşləmə

### Giriş
Wolt inteqrasyonu, müştərilərin Wolt tətbiqində sifariş verdikleri və XPOS sisteminə avtomatik ötürüldüğü mexanizmidir. Bu, onlayn satışı artırır.

### Addım-addım Qurğu Təlimatı

1. **Wolt Hesabının Oluşturulması:**
   - Wolt Partner Portal-a daxil olun
   - Restaurant yaratın
   - Işletmə adı, adresi, telefon, saatlarını göstərin
   - Bankacı məlumatlarını daxil edin

2. **XPOS ilə Wolt Əlaqəsi:**
   - XPOS Admin > Integrations > Wolt seçin
   - Wolt API Key-i daxil edin
   - Restaurant ID yazın
   - "Bağlantı Sına" düyməsini basıb, bağlantı təsdiqlənsin

3. **Menü Sinxronizasyonu:**
   - XPOS-da menü məhsulları daxil olmuş olmalıdır
   - "Menüyü Wolt-a Push Et" düyməsini basıb
   - Məhsullar, qiymətlər, kategoriyalar Wolt-a ötürülecek
   - "Sinxron Tamamlandı" mesajı alacaksınız

4. **Sifarişlərin Qəbülü:**
   - Müştəri Wolt app-da sifariş verdiyində
   - XPOS tərəfən avtomatik sifariş alınır
   - "Yeni Wolt Sifarişi" bildirişi alacaksınız
   - Sifariş tarixçəsi bölməsində "Wolt" işarəsi koyulur

5. **Sifarişi Hazırlamak:**
   - Wolt sifarişini mutbakda göstərən
   - Hazırlama sırasında durum (In Progress)
   - Hazır olduğunda "Hazır" işarəsi qoyun
   - Wolt kuryesine hazır olduğu bildiriş gidəcəkdir

6. **Sifarişin Təhvilatı:**
   - Kureye sofrası teslim edin
   - Wolt app-da teslimat tamamla
   - XPOS-da sifarişi "Teslim" işarə koyun
   - Müştərinin maliyyə ötürülecəkdir

### İpuçları və Fəndləri

- **Wolt Markesi:** Işletmənin Wolt dərəcəsini yüksəlt
- **Kişi Servisi Sürəsi:** Sifariş hazırlama sürəsini 30 dəqiqədən az saxlayın
- **Özel Hazırlama Talepleri:** Müştəri tələbini qeyd edin
- **Rəylər:** Her Wolt sifarişi tamamlandıqdan sonra, müştəri rəy verə biləcəkdir

### Ümumi Problemlər

**Problem:** Wolt sifarişi XPOS-da görülmür
- **Həll:** XPOS-da Wolt inteqrasyonu kontrol edin. API Key doğru mu, yoxla.

---

#### 36. Yango Sifarişlərini İşləmə

## Yango Sifarişlərini İşləmə

### Giriş
Yango (Yandex Food) inteqrasyonu, Yango tətbiqində müşteri sifarişləri XPOS-da otomatik görünməsini təmin edir. Wolt-a oxşar prosesdir, lakin ayrı platform məlumatlarıyla.

### Addım-addım Qurğu Təlimatı

1. **Yango Hesabının Oluşturulması:**
   - Yango Partner Portal-a keçin
   - "Rəstoran Əlavə Et" seçin
   - Işletmə adı, adresi, telefon nömrəsini daxil edin
   - Bank məlumatlarını göstərin

2. **XPOS ilə Yango Əlaqəsi:**
   - XPOS Admin > Integrations > Yango seçin
   - Yango API ID daxil edin
   - Yango API Secret Key-i yazın
   - "Bağlantı Sına" basıp, test edin

3. **Yango Menüsünün Qurğulanması:**
   - XPOS məhsulları Yango-da görmə istəyirsə, "Menü Push" edin
   - Ya da Yango Partner Portal-da əl ilə menü əlavə edin
   - Hər məhsunun qiymət, açıklama, fotosu olmalıdır

4. **Sifarişlərin Alınması:**
   - Müştəri Yango app-da sifariş verdiyində
   - XPOS otomatik sifariş alır
   - "Yeni Yango Sifarişi" bildirişi çıxarır
   - Sifarişi hazırlama cümlməsində göstərilir

5. **Sifarişi Hazırlamak:**
   - Yango sifarişini mutfakda nəzərə alıb
   - Hazırlama sürdüyü "In Progress" işarəsi
   - Hazır olduqda "Hazır" düyməsi basıb
   - Yango kuryesi yer müşahidə edəcəkdir

6. **Ödəniş Təsdiki:**
   - Yango müştərid nəqd ödəmişsə: Kureye nəqd versin
   - Yango app ilə ödəmişsə: XPOS-da avtomatik görün
   - XPOS hesab kütləşdirəcəkdir

### İpuçları və Fəndləri

- **Sürə Tənzimleme:** Hazırlama sürəsini əvvəlcə 40 dəqiqəyə qoyun
- **Yango Dərəcə:** Rəstoran dərəcəsini yüksək saxlayın
- **Qeyri-mövcud Məhsullar:** Əgər Yango-da göstərilən məhsul bitişsə, "Stokkda Yoxdur" işarə koyun
- **Müştəri Xidməti:** Müşteri çok gözlədiysə, apologize mesajı göndərin

### Ümumi Problemlər

**Problem:** Yango sifarişi XPOS ilə sinxron olmur
- **Həll:** XPOS API ayarlarını yoxlayın, Yango Partner Portal-da təsdiq edin.

---

#### 37. API Əlaqəsi

## API Əlaqəsi

### Giriş
API (Application Programming Interface) əlaqəsi, digər sistemlərə XPOS məlumatlarını göndərməyə kömək edir. İnteqrasiyalar, mühasibə, CRM sistemləri kimi tətbiqlərlə əlaqə qurmaq üçün istifadə olunur.

### API Əlaqəsinin Qurğulanması

1. **API Token Yaratmaq:**
   - XPOS Admin > API Settings > "Yeni Token Yaratmak"
   - Token Adı: "Muhasebe Sistemi" yazın
   - Tahlükəsizlik səviyyəsi: "Həssas Məlumat" açma
   - "Tokeni Yaratmak" basıb
   - Token göstərilüb, yadda saxlayıb

2. **API Endpoint-lərinə Qoşulmak:**
   - Mühasibə sisteminə XPOS API URL-i daxil edin:
     - `https://api.xpos.az/v1/`
   - Token-i "Authorization: Bearer [TOKEN]" formatında göndərin
   - Test sorğu göndərib, cavab alıb

3. **API İcazələrini Ayarlamak:**
   - Tokena hansı məlumatları görmə icazəsi vermək istəyirsə seçin:
     - Sales (Satış qeydləri)
     - Inventory (Inventar)
     - Customers (Müşteri məlumatları)
     - Payments (Ödəniş məlumatları)
   - "Əl ilə Sil" icazəsi vermə

4. **Vəsiqələrin Sinxronizasyonu:**
   - Mühasibə sistemi hər gün 23:00-də XPOS-dan məlumat çəksə
   - XPOS otomatik məlumatları sunacaq
   - Məlumatlar JSON formatında ötürülür

5. **API Xətaları Nəzarəti:**
   - "API Logs" sekmesində xətaları görə bilərsiz
   - Ötürülməmiş məlumatları əl ilə sınayas edə bilərsiz
   - Dəstəklə əlaqə kurarsa, log dosyasını göndərin

### API Təhlükəsizliyi

- **Token Rotasyon:** Hər ayda token dəyişdirin
- **Minimal İcazələr:** Sadəcə lazım məlumatlarını açın
- **IP Kısıtlanması:** Mühasibə sisteminin IP ünvanını qoşulma edin
- **HTTPS Istifadə:** Hər zaman şifrələnmiş bağlantı istifadə edin

### İpuçları və Fəndləri

- **WebHook Istifadəsi:** Hər yeni satış qeydində mühasibə sistemini "ping" edin
- **Rate Limiting:** Hər saatda maksimum 1000 sorğu göndərin
- **Backup Token:** API tokeni kəsilsə diye, ikinci token yaratıb saxlayın
- **Dokumentasiya:** Mühasibə sistem sağlayıcısı ilə API məlumatları əvvəlcə hazırlayıb

### Ümumi Problemlər

**Problem:** API sorğusu "401 Unauthorized" xətası vərir
- **Həll:** Token-in düzgün, xətası və müddətinin bitmədiyi kontrol edin.

---

## SONUÇ

Bütün bu məqalələr XPOS sisteminin əsas tənzimləmə və idarəçilik proseslərini əhatə edir. Professional istifadə üçün hər bir məqaləni ətraflı oxuyun, təlimatları ardıcıl edin və ipuçlarını tətbiq edin.

Hər hansı sual və ya problem halında XPOS texniki dəstəyinə müraciət edin:
- E-mail: support@xpos.az
- WhatsApp: +994 50 XXX XXXX
- Telefon: +994 12 XXX XXXX