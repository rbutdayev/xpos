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
                'description' => 'Caspos Smart Kassa inteqrasiyası (Operation-based API)',
                'default_port' => 5544,
                'api_base_path' => '', // Caspos uses base URL, operation sent in request body
                'print_endpoint' => '', // Not used - operation: "sale" in request body
                'status_endpoint' => '', // Not used - operation: "getInfo" in request body
                'required_fields' => json_encode(['username', 'password', 'device_serial']),
                'endpoint_config' => json_encode([
                    'uses_operation_field' => true,
                    'content_type' => 'application/json; charset=utf-8',
                    'operations' => [
                        'login' => 'toLogin',
                        'logout' => 'toLogout',
                        'info' => 'getInfo',
                        'shift_status' => 'getShiftStatus',
                        'open_shift' => 'openShift',
                        'close_shift' => 'closeShift',
                        'sale' => 'sale',
                        'money_back' => 'moneyBack',
                        'deposit' => 'deposit',
                        'withdraw' => 'withDraw',
                    ]
                ]),
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

        // Use updateOrCreate to avoid duplicate errors if seeder runs multiple times
        foreach ($providers as $provider) {
            DB::table('fiscal_printer_providers')
                ->updateOrInsert(
                    ['code' => $provider['code']], // Match on code
                    $provider // Update/insert all fields
                );
        }
    }
}
