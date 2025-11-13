<?php

namespace Database\Factories;

use App\Models\BusinessGroup;
use App\Models\Customer;
use App\Models\CustomerType;
use App\Models\Product;
use App\Models\Scenario;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Projection>
 */
class ProjectionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $baseAmount = fake()->randomFloat(2, 100000, 5000000);
        $growthRate = fake()->randomFloat(2, -5, 15);
        $inflationRate = fake()->randomFloat(2, 3, 6);

        $subtotal = round($baseAmount * (1 + ($growthRate / 100)), 2);
        $tax = round($subtotal * 0.16, 2);
        $totalAmount = $subtotal + $tax;
        $totalWithInflation = round($totalAmount * (1 + ($inflationRate / 100)), 2);

        return [
            'scenario_id' => Scenario::factory(),
            'year' => fake()->numberBetween(2024, 2030),
            'business_group_id' => fake()->optional(0.3)->passthrough(BusinessGroup::factory()),
            'customer_type_id' => fake()->optional(0.4)->passthrough(CustomerType::factory()),
            'customer_id' => fake()->optional(0.5)->passthrough(Customer::factory()),
            'product_id' => fake()->optional(0.4)->passthrough(Product::factory()),
            'total_subtotal' => $subtotal,
            'total_tax' => $tax,
            'total_amount' => $totalAmount,
            'total_with_inflation' => $totalWithInflation,
            'base_amount' => $baseAmount,
            'growth_applied' => $growthRate,
            'inflation_applied' => $inflationRate,
            'calculation_method' => fake()->randomElement(['simple_average', 'weighted_average', 'trend']),
            'calculated_at' => now(),
        ];
    }

    /**
     * Indicate that the projection belongs to a specific scenario.
     */
    public function forScenario(Scenario $scenario): static
    {
        return $this->state(fn (array $attributes) => [
            'scenario_id' => $scenario->id,
        ]);
    }

    /**
     * Indicate that the projection is for a specific year.
     */
    public function forYear(int $year): static
    {
        return $this->state(fn (array $attributes) => [
            'year' => $year,
        ]);
    }

    /**
     * Indicate that the projection is for a specific customer.
     */
    public function forCustomer(Customer $customer): static
    {
        return $this->state(fn (array $attributes) => [
            'customer_id' => $customer->id,
        ]);
    }

    /**
     * Indicate that the projection is for a specific product.
     */
    public function forProduct(Product $product): static
    {
        return $this->state(fn (array $attributes) => [
            'product_id' => $product->id,
        ]);
    }

    /**
     * Indicate that the projection is a global projection (no filters).
     */
    public function global(): static
    {
        return $this->state(fn (array $attributes) => [
            'business_group_id' => null,
            'customer_type_id' => null,
            'customer_id' => null,
            'product_id' => null,
        ]);
    }
}
