<?php

/**
 * One-time script to create online shop users for accounts that have shop enabled
 * MULTI-TENANT: Uses shop_slug in email to ensure uniqueness across accounts
 * Creates: online-shop@system-{shop_slug}.local
 */

// Auto-detect the correct paths for both local and production environments
$vendorPath = file_exists(__DIR__ . '/vendor/autoload.php')
    ? __DIR__ . '/vendor/autoload.php'
    : '/var/www/xpos/vendor/autoload.php';

$bootstrapPath = file_exists(__DIR__ . '/bootstrap/app.php')
    ? __DIR__ . '/bootstrap/app.php'
    : '/var/www/xpos/bootstrap/app.php';

require $vendorPath;

$app = require_once $bootstrapPath;
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Account;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

// Find all accounts with shop enabled
$accounts = Account::where('shop_enabled', true)->get();

echo "Found " . $accounts->count() . " accounts with shop enabled\n\n";

foreach ($accounts as $account) {
    echo "Checking account #{$account->id} ({$account->company_name})...\n";

    if (!$account->shop_slug) {
        echo "  ⚠ No shop_slug set, skipping\n";
        continue;
    }

    // MULTI-TENANT: Use shop_slug in email for uniqueness
    $systemEmail = "online-shop@system-{$account->shop_slug}.local";

    // Check if online shop user exists
    $onlineUser = User::where('account_id', $account->id)
        ->where('email', $systemEmail)
        ->first();

    if (!$onlineUser) {
        // Create the user
        User::create([
            'account_id' => $account->id,
            'name' => 'Online Mağaza',
            'email' => $systemEmail,
            'password' => Hash::make(bin2hex(random_bytes(32))),
            'role' => 'sales_staff',
            'status' => 'active',
        ]);

        echo "  ✓ Created online shop user: {$systemEmail}\n";
    } else {
        echo "  - User already exists: {$systemEmail}\n";
    }
}

echo "\nDone!\n";
