<?php

namespace App\Console\Commands;

use App\Models\SmsCredential;
use App\Services\SmsService;
use Illuminate\Console\Command;

class TestSmsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sms:test {account_id} {phone_number}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test SMS sending for a specific account';

    /**
     * Execute the console command.
     */
    public function handle(SmsService $smsService)
    {
        $accountId = $this->argument('account_id');
        $phoneNumber = $this->argument('phone_number');

        $this->info("Testing SMS service for Account ID: {$accountId}");
        $this->newLine();

        // Check if credentials exist
        $credentials = SmsCredential::where('account_id', $accountId)
            ->where('is_active', true)
            ->first();

        if (!$credentials) {
            $this->error('No active SMS credentials found for this account.');
            $this->info('Creating credentials with provided test data...');

            SmsCredential::updateOrCreate(
                ['account_id' => $accountId],
                [
                    'gateway_url' => 'https://apps.lsim.az/quicksms/v1/smssender',
                    'login' => 'ithelpuser',
                    'password' => 'W%(P*1!KbPuiD',
                    'sender_name' => 'ITHelp',
                    'is_active' => true,
                ]
            );

            $this->info('✓ Credentials created successfully');
            $this->newLine();
        } else {
            $this->info('✓ Found active SMS credentials');
            $this->info("Provider: LSIM");
            $this->info("Sender: {$credentials->sender_name}");
            $this->newLine();
        }

        // Send test SMS
        $this->info("Sending test SMS to: {$phoneNumber}");

        $result = $smsService->send(
            $accountId,
            $phoneNumber,
            'This is a test message from XPOS SMS Service. Your multi-tenant SMS system is working!'
        );

        $this->newLine();

        if ($result['success']) {
            $this->info('✓ SMS sent successfully!');
            $this->info("Log ID: {$result['log_id']}");
        } else {
            $this->error('✗ Failed to send SMS');
            $this->error("Error: {$result['error']}");
            if (isset($result['log_id'])) {
                $this->info("Log ID: {$result['log_id']}");
            }
        }

        // Show statistics
        $this->newLine();
        $this->info('SMS Statistics for this account:');
        $stats = $smsService->getStatistics($accountId);
        $this->table(
            ['Metric', 'Count'],
            [
                ['Total', $stats['total']],
                ['Sent', $stats['sent']],
                ['Failed', $stats['failed']],
                ['Pending', $stats['pending']],
            ]
        );

        return Command::SUCCESS;
    }
}
