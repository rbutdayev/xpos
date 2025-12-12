<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Company>
 */
class CompanyFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $languages = ['az', 'en'];
        $defaultLanguage = fake()->randomElement($languages);

        // Map language to currency
        $currencyMap = [
            'az' => ['code' => 'AZN', 'symbol' => '₼', 'position' => 'after'],
            'en' => ['code' => 'USD', 'symbol' => '$', 'position' => 'before'],
        ];

        $currency = $currencyMap[$defaultLanguage];

        return [
            'account_id' => \App\Models\Account::factory(),
            'name' => fake()->company(),
            'address' => fake()->address(),
            'tax_number' => fake()->numerify('##########'),
            'phone' => fake()->phoneNumber(),
            'email' => fake()->companyEmail(),
            'default_language' => $defaultLanguage,
            'currency_code' => $currency['code'],
            'currency_symbol' => $currency['symbol'],
            'currency_decimal_places' => 2,
            'currency_symbol_position' => $currency['position'],
            'is_active' => true,
        ];
    }
}