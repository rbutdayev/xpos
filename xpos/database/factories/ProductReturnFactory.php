<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ProductReturn>
 */
class ProductReturnFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $quantity = $this->faker->numberBetween(1, 20);
        $unitCost = $this->faker->randomFloat(2, 10, 100);
        
        return [
            'account_id' => \App\Models\Account::factory(),
            'supplier_id' => \App\Models\Supplier::factory(),
            'product_id' => \App\Models\Product::factory(),
            'warehouse_id' => \App\Models\Warehouse::factory(),
            'quantity' => $quantity,
            'unit_cost' => $unitCost,
            'total_cost' => $quantity * $unitCost,
            'reason' => $this->faker->sentence(),
            'status' => $this->faker->randomElement(['gozlemede', 'tesdiq_edilib', 'gonderildi', 'tamamlanib', 'imtina_edilib']),
            'return_date' => $this->faker->date(),
            'requested_by' => \App\Models\User::factory(),
            'approved_by' => $this->faker->optional()->randomElement([\App\Models\User::factory()]),
            'supplier_response' => $this->faker->optional()->sentence(),
            'refund_amount' => $this->faker->optional()->randomFloat(2, 50, 500),
            'refund_date' => $this->faker->optional()->date(),
        ];
    }
}
