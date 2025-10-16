<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Supplier>
 */
class SupplierFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'account_id' => \App\Models\Account::factory(),
            'name' => fake()->company(),
            'contact_person' => fake()->name(),
            'phone' => fake()->phoneNumber(),
            'email' => fake()->companyEmail(),
            'address' => fake()->address(),
            'tax_number' => fake()->numerify('##########'),
            'bank_account' => 'AZ' . fake()->numerify('##') . 'NABZ' . fake()->numerify('################'),
            'bank_name' => fake()->randomElement(['Kapital Bank', 'Azərbaycan Beynəlxalq Bankı', 'Unibank', 'Paşa Bank']),
            'payment_terms_days' => fake()->randomElement([7, 14, 30, 45, 60]),
            'notes' => fake()->optional()->sentence(),
            'is_active' => true,
        ];
    }
}