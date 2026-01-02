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
                'url' => 'https://www.dropbox.com/scl/fi/ypj7vpufzf2ini72yxxxs/XPOS-Printer-Bridge-Setup-2.0.0.exe?rlkey=0z4bda7kjval2it7giwitl164&st=ta6hrom6&dl=0',
                'size' => '80 MB',
                'icon' => '🪟',
            ],
            'macos_intel' => [
                'name' => 'XPOS-Printer-Bridge-2.0.0.dmg',
                'platform' => 'macOS Intel',
                'url' => 'https://www.dropbox.com/scl/fi/kk1gf2k8us4vu3pfylrmy/XPOS-Printer-Bridge-2.0.0.dmg?rlkey=wmntczlpli6m926fnwm8vf4hn&st=f3d4rx5r&dl=0',
                'size' => '112 MB',
                'icon' => '🍎',
            ],
            'macos_arm' => [
                'name' => 'XPOS-Printer-Bridge-2.0.0-arm64.dmg',
                'platform' => 'macOS Apple Silicon (M1/M2/M3)',
                'url' => 'https://www.dropbox.com/scl/fi/czr0q2xomqrsd4ni5cijt/XPOS-Printer-Bridge-2.0.0-arm64.dmg?rlkey=zuyoqej82e1c3t1olc0c9l714&st=4oqjwiak&dl=0',
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

    /*
    |--------------------------------------------------------------------------
    | Kiosk App Downloads
    |--------------------------------------------------------------------------
    |
    | Download links for the XPOS Kiosk application.
    | Offline-capable POS system for retail locations.
    |
    */

    'kiosk_app' => [
        'version' => '1.0.0',
        'release_date' => '2026-01-03',

        'installers' => [
            'windows' => [
                'name' => 'Windows x64',
                'platform' => 'Windows',
                'url' => '/downloads/kiosk/XPOS-Kiosk-Setup-1.0.0.exe',
                'size' => '120 MB',
                'icon' => '🪟',
            ],
            'macos_intel' => [
                'name' => 'macOS Intel',
                'platform' => 'macOS (Intel)',
                'url' => '/downloads/kiosk/XPOS-Kiosk-1.0.0-x64.dmg',
                'size' => '150 MB',
                'icon' => '🍎',
            ],
            'macos_arm' => [
                'name' => 'macOS ARM',
                'platform' => 'macOS (M1/M2/M3)',
                'url' => '/downloads/kiosk/XPOS-Kiosk-1.0.0-arm64.dmg',
                'size' => '150 MB',
                'icon' => '🍎',
            ],
        ],

        'system_requirements' => [
            'windows' => 'Windows 7 SP1 / 10 / 11 (64-bit)',
            'macos' => 'macOS 10.13+ (High Sierra və ya daha yeni)',
        ],
    ],
];
