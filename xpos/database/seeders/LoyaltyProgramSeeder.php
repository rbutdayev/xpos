<?php

namespace Database\Seeders;

use App\Models\Account;
use App\Models\LoyaltyProgram;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class LoyaltyProgramSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create default loyalty program for each account that doesn't have one
        $accounts = Account::all();

        foreach ($accounts as $account) {
            // Check if account already has a loyalty program
            if (LoyaltyProgram::where('account_id', $account->id)->exists()) {
                continue;
            }

            // Create default loyalty program (disabled by default)
            LoyaltyProgram::create([
                'account_id' => $account->id,
                'points_per_currency_unit' => 1.00,  // 1 point per ₼1
                'redemption_rate' => 100.00,          // 100 points = ₼1 discount
                'min_redemption_points' => 100,       // Minimum 100 points to redeem
                'points_expiry_days' => 365,          // Points expire after 1 year
                'max_points_per_transaction' => null, // No limit
                'earn_on_discounted_items' => true,   // Can earn on discounted items
                'is_active' => false,                 // Disabled by default
            ]);

            $this->command->info("Created loyalty program for account: {$account->name}");
        }

        $this->command->info('Loyalty program seeder completed!');
    }
}
