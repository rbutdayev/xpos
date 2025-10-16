<?php

namespace Database\Factories;

use App\Models\Employee;
use App\Models\Account;
use App\Models\Branch;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Employee>
 */
class EmployeeFactory extends Factory
{
    protected $model = Employee::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $positions = [
            'Servis texniki',
            'Mexanik',
            'Menecer',
            'Nəzarətçi',
            'Köməkçi',
            'Satış mütəxəssisi',
            'Anbar məsulu',
            'Kassir',
            'Temizlik işçisi',
        ];

        return [
            'account_id' => Account::factory(),
            'name' => $this->faker->name(),
            'phone' => $this->faker->boolean(70) ? '+994' . $this->faker->numerify('##########') : null,
            'email' => $this->faker->boolean(60) ? $this->faker->safeEmail() : null,
            'position' => $this->faker->randomElement($positions),
            'hire_date' => $this->faker->dateTimeBetween('-2 years', 'now')->format('Y-m-d'),
            'hourly_rate' => $this->faker->randomFloat(2, 8, 50),
            'branch_id' => Branch::factory(),
            'is_active' => $this->faker->boolean(85),
            'notes' => $this->faker->boolean(30) ? $this->faker->paragraph() : null,
        ];
    }

    /**
     * Indicate that the employee is active.
     */
    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => true,
        ]);
    }

    /**
     * Indicate that the employee is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }

    /**
     * Set a specific position for the employee.
     */
    public function position(string $position): static
    {
        return $this->state(fn (array $attributes) => [
            'position' => $position,
        ]);
    }

    /**
     * Set a specific hourly rate for the employee.
     */
    public function hourlyRate(float $rate): static
    {
        return $this->state(fn (array $attributes) => [
            'hourly_rate' => $rate,
        ]);
    }

    /**
     * Create a senior employee with higher hourly rate.
     */
    public function senior(): static
    {
        return $this->state(fn (array $attributes) => [
            'position' => $this->faker->randomElement(['Menecer', 'Nəzarətçi', 'Servis texniki']),
            'hourly_rate' => $this->faker->randomFloat(2, 25, 50),
            'hire_date' => $this->faker->dateTimeBetween('-5 years', '-1 year')->format('Y-m-d'),
        ]);
    }

    /**
     * Create a junior employee with lower hourly rate.
     */
    public function junior(): static
    {
        return $this->state(fn (array $attributes) => [
            'position' => $this->faker->randomElement(['Köməkçi', 'Temizlik işçisi']),
            'hourly_rate' => $this->faker->randomFloat(2, 8, 15),
            'hire_date' => $this->faker->dateTimeBetween('-6 months', 'now')->format('Y-m-d'),
        ]);
    }
}