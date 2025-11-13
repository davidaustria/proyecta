<?php

namespace Database\Factories;

use App\Models\Projection;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ProjectionDetail>
 */
class ProjectionDetailFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $baseAmount = fake()->randomFloat(2, 10000, 500000);
        $seasonalityFactor = fake()->randomFloat(4, 0.7, 1.3);

        $subtotal = round($baseAmount * $seasonalityFactor, 2);
        $tax = round($subtotal * 0.16, 2);
        $amount = $subtotal + $tax;

        return [
            'projection_id' => Projection::factory(),
            'month' => fake()->numberBetween(1, 12),
            'subtotal' => $subtotal,
            'tax' => $tax,
            'amount' => $amount,
            'base_amount' => $baseAmount,
            'seasonality_factor' => $seasonalityFactor,
        ];
    }

    /**
     * Indicate that the detail belongs to a specific projection.
     */
    public function forProjection(Projection $projection): static
    {
        return $this->state(fn (array $attributes) => [
            'projection_id' => $projection->id,
        ]);
    }

    /**
     * Indicate that the detail is for a specific month.
     */
    public function forMonth(int $month): static
    {
        return $this->state(fn (array $attributes) => [
            'month' => $month,
        ]);
    }

    /**
     * Indicate that the detail has no seasonality.
     */
    public function noSeasonality(): static
    {
        return $this->state(fn (array $attributes) => [
            'seasonality_factor' => 1.0000,
        ]);
    }

    /**
     * Indicate that the detail has high seasonality (summer/winter peaks).
     */
    public function highSeasonality(): static
    {
        return $this->state(fn (array $attributes) => [
            'seasonality_factor' => fake()->randomFloat(4, 1.2, 1.5),
        ]);
    }

    /**
     * Indicate that the detail has low seasonality (off-season).
     */
    public function lowSeasonality(): static
    {
        return $this->state(fn (array $attributes) => [
            'seasonality_factor' => fake()->randomFloat(4, 0.6, 0.8),
        ]);
    }
}
