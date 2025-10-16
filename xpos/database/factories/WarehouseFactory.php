<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Warehouse>
 */
class WarehouseFactory extends Factory
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
            'name' => fake()->company() . ' Anbarı',
            'type' => fake()->randomElement(['main', 'auxiliary', 'mobile']),
            'location' => fake()->address(),
            'is_active' => true,
            'allow_negative_stock' => fake()->boolean(),
        ];
    }
}