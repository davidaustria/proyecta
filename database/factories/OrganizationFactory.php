<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Organization>
 */
class OrganizationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->company();

        return [
            'name' => $name,
            'slug' => str($name)->slug(),
            'domain' => fake()->optional(0.7)->domainName(),
            'is_active' => fake()->boolean(90),
            'settings' => [
                'timezone' => fake()->timezone(),
                'currency' => fake()->randomElement(['MXN', 'USD', 'EUR']),
                'fiscal_year_start' => fake()->randomElement(['01-01', '04-01', '07-01']),
            ],
        ];
    }

    /**
     * Indicate that the organization is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }

    /**
     * Indicate that the organization has a specific domain.
     */
    public function withDomain(string $domain): static
    {
        return $this->state(fn (array $attributes) => [
            'domain' => $domain,
        ]);
    }
}
