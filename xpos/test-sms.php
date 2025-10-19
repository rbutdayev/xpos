<?php

require __DIR__.'/vendor/autoload.php';

use Illuminate\Support\Facades\Facade;

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Get the first account ID
$accountId = DB::table('accounts')->first()->id ?? 1;

echo "Testing SMS Service for Account ID: {$accountId}\n";
echo "-------------------------------------------\n\n";

// Step 1: Create SMS credentials
echo "Step 1: Creating SMS credentials...\n";
DB::table('sms_credentials')->updateOrInsert(
    ['account_id' => $accountId],
    [
        'gateway_url' => 'https://apps.lsim.az/quicksms/v1/smssender',
        'login' => 'ithelpuser',
        'password' => encrypt('W%(P*1!KbPuiD'),
        'sender_name' => 'ITHelp',
        'is_active' => true,
        'created_at' => now(),
        'updated_at' => now(),
    ]
);
echo "✓ Credentials created successfully\n\n";

// Step 2: Test sending SMS
echo "Step 2: Testing SMS sending...\n";
echo "Enter phone number (e.g., +994501234567): ";
$handle = fopen("php://stdin", "r");
$phoneNumber = trim(fgets($handle));

if (empty($phoneNumber)) {
    echo "❌ Phone number is required\n";
    exit(1);
}

$smsService = app(\App\Services\SmsService::class);

echo "Sending test SMS to {$phoneNumber}...\n";
$result = $smsService->send(
    $accountId,
    $phoneNumber,
    'This is a test message from XPOS SMS Service. Testing multi-tenant SMS functionality.'
);

echo "\n";
if ($result['success']) {
    echo "✓ SMS sent successfully!\n";
    echo "Log ID: {$result['log_id']}\n";
} else {
    echo "❌ Failed to send SMS\n";
    echo "Error: {$result['error']}\n";
    if (isset($result['log_id'])) {
        echo "Log ID: {$result['log_id']}\n";
    }
}

// Step 3: Display statistics
echo "\nStep 3: SMS Statistics\n";
echo "-------------------------------------------\n";
$stats = $smsService->getStatistics($accountId);
echo "Total SMS: {$stats['total']}\n";
echo "Sent: {$stats['sent']}\n";
echo "Failed: {$stats['failed']}\n";
echo "Pending: {$stats['pending']}\n";

// Step 4: Display recent logs
echo "\nStep 4: Recent SMS Logs (Last 5)\n";
echo "-------------------------------------------\n";
$logs = $smsService->getLogs($accountId, 5);
foreach ($logs as $log) {
    echo "ID: {$log->id} | Phone: {$log->phone_number} | Status: {$log->status} | Sent: {$log->created_at}\n";
    if ($log->status === 'failed') {
        echo "  Error: {$log->error_message}\n";
    }
}

echo "\n✓ Test completed!\n";
