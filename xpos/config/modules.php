<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Available Modules Configuration
    |--------------------------------------------------------------------------
    |
    | This file defines all available modules in the system with their default
    | pricing. When a new module is added, simply add it here with its default
    | price and it will automatically appear in the SuperAdmin pricing panel.
    |
    | The system will auto-sync these modules to the database on each access.
    |
    */

    'modules' => [
        'services' => [
            'name' => 'Xidmətlər',
            'default_price' => 15.00,
            'description' => 'Tailor and service management module',
            'field' => 'services_module_enabled',
        ],
        'rent' => [
            'name' => 'İcarə',
            'default_price' => 15.00,
            'description' => 'Rental management module',
            'field' => 'rent_module_enabled',
        ],
        'loyalty' => [
            'name' => 'Loyalty Proqramı',
            'default_price' => 10.00,
            'description' => 'Loyalty program and points management',
            'field' => 'loyalty_module_enabled',
        ],
        'shop' => [
            'name' => 'Online Mağaza',
            'default_price' => 25.00,
            'description' => 'Online shop and e-commerce module',
            'field' => 'shop_enabled',
        ],
        'discounts' => [
            'name' => 'Endirimlər',
            'default_price' => 10.00,
            'description' => 'Advanced discounts and promotions',
            'field' => 'discounts_module_enabled',
        ],
        'gift_cards' => [
            'name' => 'Hədiyyə Kartları',
            'default_price' => 10.00,
            'description' => 'Gift cards management',
            'field' => 'gift_cards_module_enabled',
        ],
        'expeditor' => [
            'name' => 'Mətbəx Ekspeditor',
            'default_price' => 20.00,
            'description' => 'Kitchen expeditor and order management',
            'field' => 'expeditor_module_enabled',
        ],
        'wolt' => [
            'name' => 'Wolt İnteqrasiyası',
            'default_price' => 30.00,
            'description' => 'Wolt delivery platform integration',
            'field' => 'wolt_enabled',
        ],
        'yango' => [
            'name' => 'Yango İnteqrasiyası',
            'default_price' => 30.00,
            'description' => 'Yango delivery platform integration',
            'field' => 'yango_enabled',
        ],
        'bolt' => [
            'name' => 'Bolt İnteqrasiyası',
            'default_price' => 30.00,
            'description' => 'Bolt delivery platform integration',
            'field' => 'bolt_enabled',
        ],
        'fiscal-printer' => [
            'name' => 'Fiskal Printer',
            'default_price' => 0.00,
            'description' => 'Fiscal printer integration (free)',
            'field' => 'fiscal_printer_enabled',
        ],
        'sms' => [
            'name' => 'SMS Xidməti',
            'default_price' => 0.00,
            'description' => 'SMS service integration (free)',
            'field' => 'sms_telegram_module_enabled',
        ],
        'telegram' => [
            'name' => 'Telegram Bot',
            'default_price' => 0.00,
            'description' => 'Telegram bot integration (free)',
            'field' => 'sms_telegram_module_enabled',
        ],
        'attendance' => [
            'name' => 'İşçi Davamiyyəti',
            'default_price' => 15.00,
            'description' => 'Employee attendance tracking with GPS validation',
            'field' => 'attendance_module_enabled',
        ],
    ],
];
