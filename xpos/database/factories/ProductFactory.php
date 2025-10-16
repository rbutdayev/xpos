<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Product>
 */
class ProductFactory extends Factory
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
            'name' => fake()->words(3, true),
            'sku' => fake()->unique()->regexify('[A-Z]{3}-[0-9]{3}'),
            'barcode' => fake()->ean13(),
            'barcode_type' => 'Code-128',
            'has_custom_barcode' => false,
            'category_id' => \App\Models\Category::factory(),
            'type' => fake()->randomElement(['product', 'service']),
            'description' => fake()->sentence(),
            'allow_negative_stock' => fake()->boolean(),
        ];
    }
}