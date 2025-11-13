<?php

namespace Database\Factories;

use App\Models\Organization;
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
        $products = [
            ['name' => 'Consultoría Financiera', 'category' => 'Consulting', 'desc' => 'Servicios de asesoría financiera estratégica'],
            ['name' => 'Auditoría Externa', 'category' => 'Audit', 'desc' => 'Servicios de auditoría y revisión de estados financieros'],
            ['name' => 'Valuación de Activos', 'category' => 'Valuation', 'desc' => 'Servicios de valuación y análisis de activos'],
            ['name' => 'Gestión de Riesgos', 'category' => 'Risk Management', 'desc' => 'Análisis y gestión de riesgos financieros'],
            ['name' => 'Compliance y Normativa', 'category' => 'Compliance', 'desc' => 'Asesoría en cumplimiento normativo y regulatorio'],
            ['name' => 'Due Diligence', 'category' => 'M&A', 'desc' => 'Servicios de debida diligencia para fusiones y adquisiciones'],
            ['name' => 'Planeación Fiscal', 'category' => 'Tax', 'desc' => 'Servicios de planeación y optimización fiscal'],
            ['name' => 'Análisis de Inversiones', 'category' => 'Investment', 'desc' => 'Análisis y evaluación de oportunidades de inversión'],
        ];

        $product = fake()->randomElement($products);

        return [
            'organization_id' => Organization::factory(),
            'name' => $product['name'],
            'code' => strtoupper(fake()->unique()->bothify('PROD-###')),
            'description' => $product['desc'],
            'category' => $product['category'],
            'is_active' => fake()->boolean(95),
            'metadata' => fake()->optional(0.4)->passthrough([
                'billing_unit' => fake()->randomElement(['Hour', 'Project', 'Monthly']),
                'default_rate' => fake()->randomFloat(2, 1000, 50000),
            ]),
        ];
    }

    /**
     * Indicate that the product is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }

    /**
     * Indicate that the product belongs to a specific organization.
     */
    public function forOrganization(Organization $organization): static
    {
        return $this->state(fn (array $attributes) => [
            'organization_id' => $organization->id,
        ]);
    }

    /**
     * Indicate that the product has a specific category.
     */
    public function withCategory(string $category): static
    {
        return $this->state(fn (array $attributes) => [
            'category' => $category,
        ]);
    }
}
