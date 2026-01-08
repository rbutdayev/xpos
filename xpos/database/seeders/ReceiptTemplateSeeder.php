<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Services\ThermalPrintingService;
use App\Models\Account;

class ReceiptTemplateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $printingService = new ThermalPrintingService();

        // Get all accounts
        $accounts = Account::all();

        if ($accounts->isEmpty()) {
            $this->command->warn('No accounts found. Please create accounts first.');
            return;
        }

        $templateTypes = ['sale', 'service', 'customer_item', 'return', 'payment'];

        foreach ($accounts as $account) {
            // Skip accounts without a valid id
            if (!$account->id) {
                $this->command->warn("Skipping account without id: {$account->company_name}");
                continue;
            }

            $this->command->info("Creating receipt templates for account: {$account->company_name}");

            foreach ($templateTypes as $type) {
                // Check if template already exists
                $existingTemplate = \App\Models\ReceiptTemplate::where('account_id', $account->id)
                    ->where('type', $type)
                    ->where('is_default', true)
                    ->first();

                if ($existingTemplate) {
                    $this->command->warn("  - Template '{$type}' already exists. Skipping.");
                    continue;
                }

                // Create the template
                $printingService->createDefaultTemplate($account->id, $type);
                $this->command->info("  ✓ Created '{$type}' template");
            }
        }

        $this->command->info('Receipt templates seeding completed!');
    }
}
