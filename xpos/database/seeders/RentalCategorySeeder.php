<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\RentalCategory;
use App\Models\Account;

class RentalCategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all accounts to create categories for each
        $accounts = Account::all();

        foreach ($accounts as $account) {
            $this->createCategoriesForAccount($account->id);
        }

        $this->command->info('Rental categories created successfully!');
    }

    private function createCategoriesForAccount(int $accountId): void
    {
        $categories = [
            [
                'name_az' => 'Ümumi',
                'name_en' => 'General',
                'slug' => 'general',
                'color' => '#3B82F6',
                'description_az' => 'Ümumi məqsədli icarə kateqoriyası',
                'description_en' => 'General purpose rental category',
                'sort_order' => 1,
            ],
            [
                'name_az' => 'Paltar',
                'name_en' => 'Clothing',
                'slug' => 'clothing',
                'color' => '#8B5CF6',
                'description_az' => 'Geyim və kostyumların icarəsi üçün',
                'description_en' => 'For clothing and costume rentals',
                'sort_order' => 2,
            ],
            [
                'name_az' => 'Elektronika',
                'name_en' => 'Electronics',
                'slug' => 'electronics',
                'color' => '#F59E0B',
                'description_az' => 'Elektron cihazların icarəsi üçün',
                'description_en' => 'For electronic device rentals',
                'sort_order' => 3,
            ],
            [
                'name_az' => 'Ev Texnikası',
                'name_en' => 'Home Appliances',
                'slug' => 'home_appliances',
                'color' => '#10B981',
                'description_az' => 'Ev təchizatı və texnikasının icarəsi üçün',
                'description_en' => 'For home appliance rentals',
                'sort_order' => 4,
            ],
            [
                'name_az' => 'Zərgərlik',
                'name_en' => 'Jewelry',
                'slug' => 'jewelry',
                'color' => '#EF4444',
                'description_az' => 'Zərgərlik məmulatlarının icarəsi üçün',
                'description_en' => 'For jewelry rentals',
                'sort_order' => 5,
            ],
            [
                'name_az' => 'Avtomobil',
                'name_en' => 'Automobile',
                'slug' => 'automobile',
                'color' => '#6366F1',
                'description_az' => 'Avtomobil və nəqliyyat vasitələrinin icarəsi üçün',
                'description_en' => 'For automobile and vehicle rentals',
                'sort_order' => 6,
            ],
        ];

        foreach ($categories as $categoryData) {
            RentalCategory::updateOrCreate(
                [
                    'account_id' => $accountId,
                    'slug' => $categoryData['slug'],
                ],
                array_merge($categoryData, [
                    'account_id' => $accountId,
                    'is_active' => true,
                ])
            );
        }
    }
}
