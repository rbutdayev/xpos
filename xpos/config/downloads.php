<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Fiscal Printer Bridge Downloads
    |--------------------------------------------------------------------------
    |
    | Download links for the XPOS Fiscal Printer Bridge application.
    | These are hosted on Google Drive for easy distribution.
    |
    */

    'fiscal_bridge' => [
        'version' => '2.0.0',
        'release_date' => '2025-11-26',

        'installers' => [
            'windows' => [
                'name' => 'XPOS-Printer-2.0.0.exe',
                'platform' => 'Windows',
                'url' => 'https://www.dropbox.com/scl/fi/95t91c8fzcx67seaggmup/XPOS-Printer-Bridge-Setup-2.0.0.exe?rlkey=iiqqtbxxvemqmjtufiwh7o4ir&st=bdbxek8f&dl=0',
                'size' => '80 MB',
                'icon' => '🪟',
            ],
            'macos_intel' => [
                'name' => 'XPOS-Printer-Bridge-2.0.0.dmg',
                'platform' => 'macOS Intel',
                'url' => 'https://www.dropbox.com/scl/fi/grub7992hnuc32yv2cvh0/XPOS-Printer-Bridge-2.0.0.dmg?rlkey=yo49pkkif67wrtxzj6h4t6tx8&st=zphqgrqg&dl=0',
                'size' => '112 MB',
                'icon' => '🍎',
            ],
            'macos_arm' => [
                'name' => 'XPOS-Printer-Bridge-2.0.0-arm64.dmg',
                'platform' => 'macOS Apple Silicon (M1/M2/M3)',
                'url' => 'https://www.dropbox.com/scl/fi/flaoaxysn3sklrq0djzmv/XPOS-Printer-Bridge-2.0.0-arm64.dmg?rlkey=akvgopdvivgxkvuq5rleuy7lj&st=don9a1dc&dl=0',
                'size' => '96 MB',
                'icon' => '🍎',
            ],
        ],

        'documentation' => [
            'quick_start' => 'https://github.com/yourusername/xpos-bridge/blob/main/QUICKSTART.md',
            'full_guide' => 'https://github.com/yourusername/xpos-bridge/blob/main/README.md',
        ],

        'system_requirements' => [
            'windows' => 'Windows 10 və ya daha yüksək',
            'macos' => 'macOS 10.15 (Catalina) və ya daha yüksək',
        ],
    ],
];
