<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\WarehouseTransfer>
 */
class WarehouseTransferFactory extends Factory
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
            'from_warehouse_id' => \App\Models\Warehouse::factory(),
            'to_warehouse_id' => \App\Models\Warehouse::factory(),
            'product_id' => \App\Models\Product::factory(),
            'quantity' => $this->faker->numberBetween(1, 50),
            'status' => $this->faker->randomElement(['gozlemede', 'tesdiq_edilib', 'leyv_edilib', 'tamamlanib', 'imtina_edilib']),
            'requested_by' => \App\Models\User::factory(),
            'approved_by' => $this->faker->optional()->randomElement([\App\Models\User::factory()]),
            'requested_at' => $this->faker->dateTimeThisMonth(),
            'approved_at' => $this->faker->optional()->dateTimeThisMonth(),
            'completed_at' => $this->faker->optional()->dateTimeThisMonth(),
            'notes' => $this->faker->optional()->sentence(),
            'rejection_reason' => $this->faker->optional()->sentence(),
        ];
    }
}
