<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\CustomerType>
 */
class CustomerTypeFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        static $types = [
            ['name' => 'Fondos', 'code' => 'FONDOS', 'description' => 'Fondos de inversión y patrimoniales'],
            ['name' => 'Afores', 'code' => 'AFORES', 'description' => 'Administradoras de Fondos para el Retiro'],
            ['name' => 'Otros', 'code' => 'OTROS', 'description' => 'Otros tipos de clientes'],
            ['name' => 'Bancos', 'code' => 'BANCOS', 'description' => 'Instituciones bancarias'],
            ['name' => 'Seguros', 'code' => 'SEGUROS', 'description' => 'Compañías de seguros'],
        ];

        static $counter = 0;
        $type = $types[$counter % count($types)];
        $counter++;

        return [
            'organization_id' => \App\Models\Organization::factory(),
            'name' => $type['name'],
            'code' => $type['code'],
            'description' => $type['description'],
            'is_active' => fake()->boolean(95),
            'sort_order' => $counter,
        ];
    }

    /**
     * Indicate that the customer type is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }

    /**
     * Indicate that the customer type belongs to a specific organization.
     */
    public function forOrganization(\App\Models\Organization $organization): static
    {
        return $this->state(fn (array $attributes) => [
            'organization_id' => $organization->id,
        ]);
    }
}
