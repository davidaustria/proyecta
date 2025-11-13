<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\InflationRate>
 */
class InflationRateFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'year' => fake()->unique()->numberBetween(2020, 2030),
            'rate' => fake()->randomFloat(2, 2.5, 7.5),
            'source' => fake()->randomElement(['INEGI', 'Banco de México', 'World Bank', 'IMF', null]),
            'is_estimated' => fake()->boolean(30),
        ];
    }

    /**
     * Indicate that the inflation rate is estimated.
     */
    public function estimated(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_estimated' => true,
            'source' => 'Estimated',
        ]);
    }

    /**
     * Indicate that the inflation rate is actual/historical.
     */
    public function actual(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_estimated' => false,
            'source' => fake()->randomElement(['INEGI', 'Banco de México']),
        ]);
    }

    /**
     * Set a specific year for the inflation rate.
     */
    public function forYear(int $year): static
    {
        return $this->state(fn (array $attributes) => [
            'year' => $year,
        ]);
    }
}
