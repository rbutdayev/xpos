<?php

namespace App\Console\Commands;

use App\Models\Account;
use App\Models\Company;
use App\Models\Currency;
use Illuminate\Console\Command;

class MigrateAccountDataToCompanies extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'migrate:account-to-companies {--force : Force migration without confirmation}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Migrate account company data to companies table';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $accounts = Account::whereDoesntHave('companies')
            ->where('company_name', '!=', '')
            ->whereNotNull('company_name')
            ->get();

        if ($accounts->isEmpty()) {
            $this->info('No accounts need migration. All accounts already have Company records.');
            return 0;
        }

        $this->info("Found {$accounts->count()} account(s) without Company records:");

        foreach ($accounts as $account) {
            $this->line("  - Account #{$account->id}: {$account->company_name}");
        }

        if (!$this->option('force') && !$this->confirm('Do you want to create Company records for these accounts?')) {
            $this->info('Migration cancelled.');
            return 0;
        }

        $this->newLine();
        $this->info('Migrating accounts to companies table...');

        $bar = $this->output->createProgressBar($accounts->count());
        $bar->start();

        $created = 0;
        foreach ($accounts as $account) {
            // Determine currency based on language
            $language = $account->language ?? 'az';
            $currencyCode = ($language === 'az') ? 'AZN' : 'USD';

            // Get currency details
            $currency = Currency::find($currencyCode);
            if (!$currency) {
                $currency = Currency::find('USD');
            }

            Company::create([
                'account_id' => $account->id,
                'name' => $account->company_name,
                'address' => $account->address,
                'tax_number' => $account->tax_number,
                'phone' => $account->phone,
                'email' => $account->email,
                'default_language' => $language,
                'currency_code' => $currency->code,
                'currency_symbol' => $currency->symbol,
                'currency_decimal_places' => $currency->decimal_places,
                'currency_symbol_position' => $currency->symbol_position,
                'is_active' => true,
            ]);

            $created++;
            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);
        $this->info("Successfully created {$created} Company record(s)!");

        return 0;
    }
}
