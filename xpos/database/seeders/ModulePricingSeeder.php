<?php

namespace Database\Seeders;

use App\Models\ModulePricingSetting;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ModulePricingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $modules = [
            [
                'module_name' => 'services',
                'monthly_price' => 15.00,
                'is_active' => true,
                'description' => 'Tailor and service management module',
            ],
            [
                'module_name' => 'rent',
                'monthly_price' => 15.00,
                'is_active' => true,
                'description' => 'Rental management module',
            ],
            [
                'module_name' => 'loyalty',
                'monthly_price' => 10.00,
                'is_active' => true,
                'description' => 'Loyalty program and points management',
            ],
            [
                'module_name' => 'shop',
                'monthly_price' => 25.00,
                'is_active' => true,
                'description' => 'Online shop and e-commerce module',
            ],
            [
                'module_name' => 'discounts',
                'monthly_price' => 10.00,
                'is_active' => true,
                'description' => 'Advanced discounts and promotions',
            ],
            [
                'module_name' => 'gift_cards',
                'monthly_price' => 10.00,
                'is_active' => true,
                'description' => 'Gift cards management',
            ],
            [
                'module_name' => 'expeditor',
                'monthly_price' => 20.00,
                'is_active' => true,
                'description' => 'Kitchen expeditor and order management',
            ],
            [
                'module_name' => 'wolt',
                'monthly_price' => 30.00,
                'is_active' => true,
                'description' => 'Wolt delivery platform integration',
            ],
            [
                'module_name' => 'yango',
                'monthly_price' => 30.00,
                'is_active' => true,
                'description' => 'Yango delivery platform integration',
            ],
            [
                'module_name' => 'bolt',
                'monthly_price' => 30.00,
                'is_active' => true,
                'description' => 'Bolt delivery platform integration',
            ],
            [
                'module_name' => 'fiscal-printer',
                'monthly_price' => 0.00,
                'is_active' => true,
                'description' => 'Fiscal printer integration (free)',
            ],
            [
                'module_name' => 'sms',
                'monthly_price' => 0.00,
                'is_active' => true,
                'description' => 'SMS service integration (free)',
            ],
            [
                'module_name' => 'telegram',
                'monthly_price' => 0.00,
                'is_active' => true,
                'description' => 'Telegram bot integration (free)',
            ],
            [
                'module_name' => 'attendance',
                'monthly_price' => 15.00,
                'is_active' => true,
                'description' => 'Employee attendance tracking with GPS validation',
            ],
        ];

        foreach ($modules as $module) {
            ModulePricingSetting::updateOrCreate(
                ['module_name' => $module['module_name']],
                $module
            );

            $this->command->info("Seeded pricing for module: {$module['module_name']} - {$module['monthly_price']} AZN/month");
        }

        $this->command->info('Module pricing seeder completed!');
    }
}
