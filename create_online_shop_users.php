<?php

/**
 * One-time script to create online shop users for accounts that have shop enabled
 * but don't have the online-shop@system.local user yet
 */

require '/var/www/xpos/vendor/autoload.php';

$app = require_once '/var/www/xpos/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Account;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

// Find all accounts with shop enabled
$accounts = Account::where('shop_enabled', true)->get();

echo "Found " . $accounts->count() . " accounts with shop enabled\n\n";

foreach ($accounts as $account) {
    echo "Checking account #{$account->id} ({$account->company_name})...\n";

    // Check if online shop user exists
    $onlineUser = User::where('account_id', $account->id)
        ->where('email', 'online-shop@system.local')
        ->first();

    if (!$onlineUser) {
        // Create the user
        User::create([
            'account_id' => $account->id,
            'name' => 'Online Mağaza',
            'email' => 'online-shop@system.local',
            'password' => Hash::make(bin2hex(random_bytes(32))),
            'role' => 'sales_staff',
            'is_active' => true,
        ]);

        echo "  ✓ Created online shop user\n";
    } else {
        echo "  - User already exists\n";
    }
}

echo "\nDone!\n";
