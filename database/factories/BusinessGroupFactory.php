<?php

namespace Database\Factories;

use App\Models\Organization;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\BusinessGroup>
 */
class BusinessGroupFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->randomElement([
            'Grupo Financiero '.fake()->company(),
            fake()->company().' Holdings',
            'Corporativo '.fake()->company(),
            fake()->company().' Group',
        ]);

        return [
            'organization_id' => Organization::factory(),
            'name' => $name,
            'code' => strtoupper(fake()->unique()->bothify('BG-###??')),
            'description' => fake()->optional(0.7)->sentence(),
            'is_active' => fake()->boolean(95),
            'metadata' => fake()->optional(0.5)->passthrough([
                'industry' => fake()->randomElement(['Financial Services', 'Banking', 'Insurance', 'Investment']),
                'country' => fake()->randomElement(['Mexico', 'USA', 'Spain']),
            ]),
        ];
    }

    /**
     * Indicate that the business group is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }

    /**
     * Indicate that the business group belongs to a specific organization.
     */
    public function forOrganization(Organization $organization): static
    {
        return $this->state(fn (array $attributes) => [
            'organization_id' => $organization->id,
        ]);
    }
}
