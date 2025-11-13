<?php

namespace Database\Factories;

use App\Models\Organization;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Scenario>
 */
class ScenarioFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $scenarioNames = [
            'Conservador',
            'Optimista',
            'Pesimista',
            'Realista',
            'Base',
            'Alto Crecimiento',
            'Estabilidad',
        ];

        $baseYear = fake()->numberBetween(2023, 2025);

        return [
            'organization_id' => Organization::factory(),
            'user_id' => User::factory(),
            'name' => fake()->randomElement($scenarioNames).' '.$baseYear,
            'description' => fake()->optional(0.7)->sentence(10),
            'base_year' => $baseYear,
            'historical_months' => fake()->randomElement([6, 12, 18, 24]),
            'projection_years' => fake()->randomElement([1, 2, 3, 5]),
            'status' => fake()->randomElement(['draft', 'active', 'archived']),
            'is_baseline' => fake()->boolean(20),
            'calculation_method' => fake()->randomElement(['simple_average', 'weighted_average', 'trend']),
            'include_inflation' => fake()->boolean(80),
        ];
    }

    /**
     * Indicate that the scenario is active.
     */
    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'active',
        ]);
    }

    /**
     * Indicate that the scenario is archived.
     */
    public function archived(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'archived',
        ]);
    }

    /**
     * Indicate that the scenario is a baseline.
     */
    public function baseline(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_baseline' => true,
            'name' => 'Baseline '.$attributes['base_year'],
        ]);
    }

    /**
     * Indicate that the scenario belongs to a specific organization.
     */
    public function forOrganization(Organization $organization): static
    {
        return $this->state(fn (array $attributes) => [
            'organization_id' => $organization->id,
        ]);
    }

    /**
     * Indicate that the scenario was created by a specific user.
     */
    public function createdBy(User $user): static
    {
        return $this->state(fn (array $attributes) => [
            'user_id' => $user->id,
        ]);
    }
}
