<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Validation Language Lines
    |--------------------------------------------------------------------------
    |
    | The following language lines contain the default error messages used by
    | the validator class. Some of these rules have multiple versions such
    | as the size rules. Feel free to tweak each of these messages here.
    |
    */

    'accepted' => ':attribute qəbul edilməlidir.',
    'accepted_if' => ':other :value olduqda :attribute qəbul edilməlidir.',
    'active_url' => ':attribute etibarlı URL deyil.',
    'after' => ':attribute :date tarixindən sonra olmalıdır.',
    'after_or_equal' => ':attribute :date tarixindən sonra və ya bərabər olmalıdır.',
    'alpha' => ':attribute yalnız hərflərdən ibarət olmalıdır.',
    'alpha_dash' => ':attribute yalnız hərf, rəqəm, tire və alt xəttdən ibarət olmalıdır.',
    'alpha_num' => ':attribute yalnız hərf və rəqəmlərdən ibarət olmalıdır.',
    'array' => ':attribute massiv olmalıdır.',
    'ascii' => ':attribute yalnız tək-bayt alfanumeric simvol və işarələrdən ibarət olmalıdır.',
    'before' => ':attribute :date tarixindən əvvəl olmalıdır.',
    'before_or_equal' => ':attribute :date tarixindən əvvəl və ya bərabər olmalıdır.',
    'between' => [
        'array' => ':attribute :min və :max element arasında olmalıdır.',
        'file' => ':attribute :min və :max kilobayt arasında olmalıdır.',
        'numeric' => ':attribute :min və :max arasında olmalıdır.',
        'string' => ':attribute :min və :max simvol arasında olmalıdır.',
    ],
    'boolean' => ':attribute sahəsi doğru və ya yanlış olmalıdır.',
    'can' => ':attribute sahəsi icazəsiz dəyər ehtiva edir.',
    'confirmed' => ':attribute təsdiqi uyğun gəlmir.',
    'contains' => ':attribute sahəsində tələb olunan dəyər yoxdur.',
    'current_password' => 'Şifrə yalnışdır.',
    'date' => ':attribute etibarlı tarix deyil.',
    'date_equals' => ':attribute :date tarixi ilə bərabər olmalıdır.',
    'date_format' => ':attribute :format formatına uyğun gəlmir.',
    'decimal' => ':attribute :decimal onluq yer olmalıdır.',
    'declined' => ':attribute rədd edilməlidir.',
    'declined_if' => ':other :value olduqda :attribute rədd edilməlidir.',
    'different' => ':attribute və :other fərqli olmalıdır.',
    'digits' => ':attribute :digits rəqəm olmalıdır.',
    'digits_between' => ':attribute :min və :max rəqəm arasında olmalıdır.',
    'dimensions' => ':attribute etibarsız şəkil ölçülərinə malikdir.',
    'distinct' => ':attribute sahəsinin dublikat dəyəri var.',
    'doesnt_end_with' => ':attribute aşağıdakılardan biri ilə bitməməlidir: :values.',
    'doesnt_start_with' => ':attribute aşağıdakılardan biri ilə başlamamalıdır: :values.',
    'email' => ':attribute etibarlı e-poçt ünvanı olmalıdır.',
    'ends_with' => ':attribute aşağıdakılardan biri ilə bitməlidir: :values.',
    'enum' => 'Seçilən :attribute etibarsızdır.',
    'exists' => 'Seçilən :attribute etibarsızdır.',
    'extensions' => ':attribute sahəsi aşağıdakı uzantılardan birinə malik olmalıdır: :values.',
    'file' => ':attribute fayl olmalıdır.',
    'filled' => ':attribute sahəsinin dəyəri olmalıdır.',
    'gt' => [
        'array' => ':attribute :value elementdən çox olmalıdır.',
        'file' => ':attribute :value kilobaytdan böyük olmalıdır.',
        'numeric' => ':attribute :value-dan böyük olmalıdır.',
        'string' => ':attribute :value simvoldan uzun olmalıdır.',
    ],
    'gte' => [
        'array' => ':attribute :value element və ya daha çox olmalıdır.',
        'file' => ':attribute :value kilobayt və ya daha böyük olmalıdır.',
        'numeric' => ':attribute :value və ya daha böyük olmalıdır.',
        'string' => ':attribute :value simvol və ya daha uzun olmalıdır.',
    ],
    'hex_color' => ':attribute etibarlı onaltılıq rəng olmalıdır.',
    'image' => ':attribute şəkil olmalıdır.',
    'in' => 'Seçilən :attribute etibarsızdır.',
    'in_array' => ':attribute sahəsi :other-də mövcud deyil.',
    'integer' => ':attribute tam ədəd olmalıdır.',
    'ip' => ':attribute etibarlı IP ünvanı olmalıdır.',
    'ipv4' => ':attribute etibarlı IPv4 ünvanı olmalıdır.',
    'ipv6' => ':attribute etibarlı IPv6 ünvanı olmalıdır.',
    'json' => ':attribute etibarlı JSON sətri olmalıdır.',
    'list' => ':attribute siyahı olmalıdır.',
    'lowercase' => ':attribute kiçik hərf olmalıdır.',
    'lt' => [
        'array' => ':attribute :value elementdən az olmalıdır.',
        'file' => ':attribute :value kilobaytdan kiçik olmalıdır.',
        'numeric' => ':attribute :value-dan kiçik olmalıdır.',
        'string' => ':attribute :value simvoldan qısa olmalıdır.',
    ],
    'lte' => [
        'array' => ':attribute :value elementdən çox olmamalıdır.',
        'file' => ':attribute :value kilobayt və ya daha kiçik olmalıdır.',
        'numeric' => ':attribute :value və ya daha kiçik olmalıdır.',
        'string' => ':attribute :value simvol və ya daha qısa olmalıdır.',
    ],
    'mac_address' => ':attribute etibarlı MAC ünvanı olmalıdır.',
    'max' => [
        'array' => ':attribute :max elementdən çox olmamalıdır.',
        'file' => ':attribute :max kilobaytdan böyük olmamalıdır.',
        'numeric' => ':attribute :max-dan böyük olmamalıdır.',
        'string' => ':attribute :max simvoldan uzun olmamalıdır.',
    ],
    'max_digits' => ':attribute :max rəqəmdən çox olmamalıdır.',
    'mimes' => ':attribute aşağıdakı növdə fayl olmalıdır: :values.',
    'mimetypes' => ':attribute aşağıdakı növdə fayl olmalıdır: :values.',
    'min' => [
        'array' => ':attribute ən azı :min element olmalıdır.',
        'file' => ':attribute ən azı :min kilobayt olmalıdır.',
        'numeric' => ':attribute ən azı :min olmalıdır.',
        'string' => ':attribute ən azı :min simvol olmalıdır.',
    ],
    'min_digits' => ':attribute ən azı :min rəqəm olmalıdır.',
    'missing' => ':attribute sahəsi yox olmalıdır.',
    'missing_if' => ':other :value olduqda :attribute sahəsi yox olmalıdır.',
    'missing_unless' => ':other :value olmadıqda :attribute sahəsi yox olmalıdır.',
    'missing_with' => ':values mövcud olduqda :attribute sahəsi yox olmalıdır.',
    'missing_with_all' => ':values mövcud olduqda :attribute sahəsi yox olmalıdır.',
    'multiple_of' => ':attribute :value-nin çoxluğu olmalıdır.',
    'not_in' => 'Seçilən :attribute etibarsızdır.',
    'not_regex' => ':attribute formatı etibarsızdır.',
    'numeric' => ':attribute rəqəm olmalıdır.',
    'password' => [
        'letters' => ':attribute ən azı bir hərf ehtiva etməlidir.',
        'mixed' => ':attribute ən azı bir böyük və bir kiçik hərf ehtiva etməlidir.',
        'numbers' => ':attribute ən azı bir rəqəm ehtiva etməlidir.',
        'symbols' => ':attribute ən azı bir simvol ehtiva etməlidir.',
        'uncompromised' => 'Verilən :attribute məlumat sızıntısında görünüb. Zəhmət olmasa fərqli :attribute seçin.',
    ],
    'present' => ':attribute sahəsi mövcud olmalıdır.',
    'present_if' => ':other :value olduqda :attribute sahəsi mövcud olmalıdır.',
    'present_unless' => ':other :value olmadıqda :attribute sahəsi mövcud olmalıdır.',
    'present_with' => ':values mövcud olduqda :attribute sahəsi mövcud olmalıdır.',
    'present_with_all' => ':values mövcud olduqda :attribute sahəsi mövcud olmalıdır.',
    'prohibited' => ':attribute sahəsi qadağandır.',
    'prohibited_if' => ':other :value olduqda :attribute sahəsi qadağandır.',
    'prohibited_unless' => ':other :values-də olmadıqda :attribute sahəsi qadağandır.',
    'prohibits' => ':attribute sahəsi :other-in mövcud olmasını qadağan edir.',
    'regex' => ':attribute formatı etibarsızdır.',
    'required' => ':attribute sahəsi tələb olunur.',
    'required_array_keys' => ':attribute sahəsi aşağıdakı üçün girişlər ehtiva etməlidir: :values.',
    'required_if' => ':other :value olduqda :attribute sahəsi tələb olunur.',
    'required_if_accepted' => ':other qəbul edildikdə :attribute sahəsi tələb olunur.',
    'required_if_declined' => ':other rədd edildikdə :attribute sahəsi tələb olunur.',
    'required_unless' => ':other :values-də olmadıqda :attribute sahəsi tələb olunur.',
    'required_with' => ':values mövcud olduqda :attribute sahəsi tələb olunur.',
    'required_with_all' => ':values mövcud olduqda :attribute sahəsi tələb olunur.',
    'required_without' => ':values mövcud olmadıqda :attribute sahəsi tələb olunur.',
    'required_without_all' => ':values-ın heç biri mövcud olmadıqda :attribute sahəsi tələb olunur.',
    'same' => ':attribute və :other uyğun olmalıdır.',
    'size' => [
        'array' => ':attribute :size element ehtiva etməlidir.',
        'file' => ':attribute :size kilobayt olmalıdır.',
        'numeric' => ':attribute :size olmalıdır.',
        'string' => ':attribute :size simvol olmalıdır.',
    ],
    'starts_with' => ':attribute aşağıdakılardan biri ilə başlamalıdır: :values.',
    'string' => ':attribute mətn olmalıdır.',
    'timezone' => ':attribute etibarlı vaxt zonası olmalıdır.',
    'unique' => ':attribute artıq götürülüb.',
    'uploaded' => ':attribute yüklənmədi.',
    'uppercase' => ':attribute böyük hərf olmalıdır.',
    'url' => ':attribute etibarlı URL olmalıdır.',
    'ulid' => ':attribute etibarlı ULID olmalıdır.',
    'uuid' => ':attribute etibarlı UUID olmalıdır.',

    /*
    |--------------------------------------------------------------------------
    | Custom Validation Language Lines
    |--------------------------------------------------------------------------
    |
    | Here you may specify custom validation messages for attributes using the
    | convention "rule.attribute" to name the lines. This makes it quick to
    | specify a specific custom language line for a given attribute rule.
    |
    */

    'custom' => [
        'attribute-name' => [
            'rule-name' => 'custom-message',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Custom Validation Attributes
    |--------------------------------------------------------------------------
    |
    | The following language lines are used to swap our attribute placeholder
    | with something more reader friendly such as "E-Mail Address" instead
    | of "email". This simply helps us make our message more expressive.
    |
    */

    'attributes' => [
        'name' => 'ad',
        'email' => 'e-poçt',
        'password' => 'şifrə',
        'password_confirmation' => 'şifrə təsdiqi',
        'company_name' => 'şirkət adı',
        'phone' => 'telefon',
        'address' => 'ünvan',
        'tax_number' => 'vergi nömrəsi',
        'description' => 'təsvir',
        'price' => 'qiymət',
        'purchase_price' => 'alış qiyməti',
        'sale_price' => 'satış qiyməti',
        'quantity' => 'miqdar',
        'category' => 'kateqoriya',
        'barcode' => 'barkod',
        'sku' => 'məhsul kodu',
        'branch' => 'filial',
        'warehouse' => 'anbar',
        'supplier' => 'təchizatçı',
        'customer' => 'müştəri',
        'vehicle' => 'avtomobil',
        'plate_number' => 'dövlət nömrəsi',
        'brand' => 'marka',
        'model' => 'model',
        'year' => 'il',
        'vin' => 'VIN kod',
        'engine_type' => 'mühərrik növü',
        'position' => 'vəzifə',
        'hire_date' => 'işə başlama tarixi',
        'hourly_rate' => 'saatlıq məvacib',
        
        // Printer Config specific
        'branch_id' => 'filial',
        'printer_type' => 'printer növü',
        'connection_type' => 'bağlantı növü',
        'paper_size' => 'kağız ölçüsü',
        'ip_address' => 'IP ünvan',
        'port' => 'port',
        'is_default' => 'varsayılan',
        'is_active' => 'aktiv',
    ],
];