<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\StockMovement>
 */
class StockMovementFactory extends Factory
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
            'warehouse_id' => \App\Models\Warehouse::factory(),
            'product_id' => \App\Models\Product::factory(),
            'movement_type' => $this->faker->randomElement(['daxil_olma', 'xaric_olma', 'transfer', 'qaytarma', 'itki_zerer']),
            'quantity' => $this->faker->numberBetween(1, 100),
            'unit_cost' => $this->faker->randomFloat(2, 5, 100),
            'reference_type' => $this->faker->randomElement(['sale', 'service', 'transfer', 'return', 'adjustment']),
            'reference_id' => $this->faker->optional()->numberBetween(1, 1000),
            'employee_id' => \App\Models\User::factory(),
            'notes' => $this->faker->optional()->sentence(),
        ];
    }
}
