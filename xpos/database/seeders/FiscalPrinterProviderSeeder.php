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
                'name' => 'NBA Tech',
                'description' => 'NBA Tech Kassa inteqrasiyası',
                'default_port' => 9898,
                'api_base_path' => '/api',
                'print_endpoint' => 'print',
                'status_endpoint' => 'status',
                'required_fields' => json_encode(['username', 'password', 'bank_port']),
                'is_active' => false,
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
                    'supports_credit_contract' => true, // Supports bank credit sales
                    'operations' => [
                        'login' => 'toLogin',
                        'logout' => 'toLogout',
                        'info' => 'getInfo',
                        'shift_status' => 'getShiftStatus',
                        'open_shift' => 'openShift',
                        'close_shift' => 'closeShift',
                        'x_report' => 'getShiftStatus',
                        'sale' => 'sale',
                        'money_back' => 'moneyBack',
                        'credit_pay' => 'credit',
                        'advance_sale' => 'prepayment',
                        'deposit' => 'deposit',
                        'withdraw' => 'withDraw',
                        'open_cashbox' => 'openCashbox',
                        'correction' => 'correction',
                        'rollback' => 'rollBack',
                        'print_last' => 'printLastCheque',
                        'periodic_report' => 'getPeriodicZReport',
                        'control_tape' => 'getControlTape',
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
                'is_active' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'omnitech',
                'name' => 'Omnitech',
                'description' => 'Omnitech Smart Kassa inteqrasiyası (API v2 - check_type based)',
                'default_port' => 8989,
                'api_base_path' => '/v2',
                'print_endpoint' => '', // Not used - uses requestData structure
                'status_endpoint' => '', // Not used - check_type: 14
                'required_fields' => json_encode(['username', 'password']),
                'endpoint_config' => json_encode([
                    'uses_check_type' => true,
                    'content_type' => 'application/json',
                    'supports_credit_contract' => true, // Supports bank credit sales
                    'operations' => [
                        'login' => 40,
                        'info' => 41,
                        'shift_status' => 14,
                        'open_shift' => 15,
                        'close_shift' => 13,
                        'x_report' => 12,
                        'sale' => 1,
                        'money_back' => 100,
                        'rollback' => 10,
                        'credit_pay' => 31,
                        'credit_rollback' => 32,
                        'prepay' => 34,
                        'deposit' => 7,
                        'withdraw' => 8,
                        'open_cashbox' => 28,
                        'close_cashbox' => 29,
                        'correction' => 19,
                        'receipt_copy' => 11,
                        'reprint_error' => 16,
                        'transaction_history' => 17,
                    ],
                    'doc_types' => [
                        'sale' => 'sale',
                        'money_back' => 'money_back',
                        'rollback' => 'rollback',
                        'creditpay' => 'creditpay',
                        'prepay' => 'prepay',
                        'deposit' => 'deposit',
                        'withdraw' => 'withdraw',
                        'correction' => 'correction',
                    ]
                ]),
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
                'is_active' => false,
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
