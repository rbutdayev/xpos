<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class FiscalPrinterProviderSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $providers = [
            [
                'code' => 'nba',
                'name' => 'NBA Smart',
                'description' => 'NBA Smart Kassa inteqrasiyası',
                'default_port' => 9898,
                'api_base_path' => '/api',
                'print_endpoint' => 'print',
                'status_endpoint' => 'status',
                'required_fields' => json_encode(['username', 'password', 'bank_port']),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'caspos',
                'name' => 'Caspos',
                'description' => 'Caspos Smart Kassa inteqrasiyası',
                'default_port' => 5544,
                'api_base_path' => '/api',
                'print_endpoint' => 'print',
                'status_endpoint' => 'status',
                'required_fields' => json_encode(['username', 'password', 'device_serial']),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'oneclick',
                'name' => 'OneClick',
                'description' => 'OneClick Kassa inteqrasiyası (eKASSAM)',
                'default_port' => 9876,
                'api_base_path' => '/api',
                'print_endpoint' => 'print',
                'status_endpoint' => 'status',
                'required_fields' => json_encode(['security_key']),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'omnitech',
                'name' => 'Omnitech',
                'description' => 'Omnitech Smart Kassa inteqrasiyası (API v2)',
                'default_port' => 8989,
                'api_base_path' => '/api/v2',
                'print_endpoint' => 'print',
                'status_endpoint' => 'status',
                'required_fields' => json_encode([]),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'azsmart',
                'name' => 'AzSmart',
                'description' => 'AzSmart Smart Kassa inteqrasiyası',
                'default_port' => 8008,
                'api_base_path' => '/api',
                'print_endpoint' => 'print',
                'status_endpoint' => 'status',
                'required_fields' => json_encode(['merchant_id']),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('fiscal_printer_providers')->insert($providers);
    }
}
