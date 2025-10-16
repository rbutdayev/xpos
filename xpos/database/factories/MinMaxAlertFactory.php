<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\MinMaxAlert>
 */
class MinMaxAlertFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $minLevel = $this->faker->numberBetween(5, 20);
        $currentStock = $this->faker->numberBetween(0, $minLevel - 1);
        
        return [
            'account_id' => \App\Models\Account::factory(),
            'warehouse_id' => \App\Models\Warehouse::factory(),
            'product_id' => \App\Models\Product::factory(),
            'current_stock' => $currentStock,
            'min_level' => $minLevel,
            'max_level' => $this->faker->optional()->numberBetween($minLevel + 10, 100),
            'alert_type' => $this->faker->randomElement(['min_level', 'max_level', 'zero_stock']),
            'status' => $this->faker->randomElement(['aktiv', 'baxildi', 'helli_edildi']),
            'alert_date' => $this->faker->dateTimeThisMonth(),
            'resolved_at' => $this->faker->optional()->dateTimeThisMonth(),
            'resolved_by' => $this->faker->optional()->randomElement([\App\Models\User::factory()]),
            'resolution_notes' => $this->faker->optional()->sentence(),
        ];
    }
}
