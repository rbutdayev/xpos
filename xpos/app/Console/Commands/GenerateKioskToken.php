<?php

namespace App\Console\Commands;

use App\Models\Account;
use App\Models\Branch;
use App\Models\KioskDeviceToken;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class GenerateKioskToken extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'kiosk:generate-token
                            {device_name : The name of the kiosk device}
                            {account_id : The account ID this kiosk belongs to}
                            {branch_id : The branch ID this kiosk belongs to}
                            {--created-by=1 : User ID who is creating this token (default: 1)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate a new kiosk device token for authentication';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $deviceName = $this->argument('device_name');
        $accountId = $this->argument('account_id');
        $branchId = $this->argument('branch_id');
        $createdBy = $this->option('created-by');

        // Validate account exists
        $account = Account::find($accountId);
        if (!$account) {
            $this->error("Account with ID {$accountId} not found!");
            return Command::FAILURE;
        }

        // Validate branch exists and belongs to account
        $branch = Branch::where('id', $branchId)
            ->where('account_id', $accountId)
            ->first();

        if (!$branch) {
            $this->error("Branch with ID {$branchId} not found or does not belong to account {$accountId}!");
            return Command::FAILURE;
        }

        // Validate creator user exists
        $creator = User::find($createdBy);
        if (!$creator) {
            $this->error("User with ID {$createdBy} not found!");
            return Command::FAILURE;
        }

        // Generate unique token (similar to fiscal printer bridge tokens)
        $token = 'ksk_' . Str::random(60);

        // Create kiosk device token
        $kioskToken = KioskDeviceToken::create([
            'account_id' => $accountId,
            'branch_id' => $branchId,
            'device_name' => $deviceName,
            'token' => $token,
            'status' => 'active',
            'created_by' => $createdBy,
        ]);

        // Display success message with token details
        $this->info('');
        $this->info('========================================');
        $this->info('Kiosk Token Generated Successfully!');
        $this->info('========================================');
        $this->info('');
        $this->line("Device Name:  {$kioskToken->device_name}");
        $this->line("Account:      {$account->name} (ID: {$account->id})");
        $this->line("Branch:       {$branch->name} (ID: {$branch->id})");
        $this->line("Created By:   {$creator->name} (ID: {$creator->id})");
        $this->line("Status:       {$kioskToken->status}");
        $this->info('');
        $this->warn('Token (keep this secure):');
        $this->line($token);
        $this->info('');
        $this->comment('Use this token in the kiosk app Authorization header:');
        $this->line("Authorization: Bearer {$token}");
        $this->info('');
        $this->info('========================================');

        return Command::SUCCESS;
    }
}
