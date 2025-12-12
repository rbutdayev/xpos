<?php

return [
    // General errors
    'error' => 'Xəta',
    'unknown' => 'Naməlum',

    // Warehouse and branch errors
    'warehouse_not_found' => 'Anbar tapılmadı',
    'warehouse_not_found_stock_cannot_update' => 'Anbar tapılmadı. Stok yenilənə bilməz.',
    'warehouse_not_found_stock_cannot_restore' => 'Anbar tapılmadı. Stok geri qaytarıla bilməz.',
    'branch_not_found' => 'Filial tapılmadı',

    // Order errors
    'order_not_found' => 'Bu sifariş tapılmadı',
    'order_already_exists' => 'Sifariş artıq mövcuddur',

    // Product errors
    'product_not_found' => 'Məhsul tapılmadı',
    'product_not_found_identifier' => 'Məhsul tapılmadı: :identifier',

    // Module errors
    'shop_module_not_enabled' => 'Online mağaza modulu aktivləşdirilməyib',
    'shop_requires_sms' => 'Online mağazanı aktivləşdirmək üçün əvvəlcə SMS xidmətini konfiqurasiya etməlisiniz',
    'online_orders_not_enabled' => 'Online sifarişlər aktivləşdirilməyib. Zəhmət olmasa online mağaza modulunu və ya çatdırılma platforması inteqrasiyasını (Wolt, Yango və ya Bolt) aktivləşdirin.',

    // Authentication errors
    'authentication_failed' => 'Autentifikasiya uğursuz oldu',
    'platform_integration_not_enabled' => ':platform inteqrasiyası bu hesab üçün aktivləşdirilməyib',
];
