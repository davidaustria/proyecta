<?php

namespace Database\Factories;

use App\Models\BusinessGroup;
use App\Models\Customer;
use App\Models\CustomerType;
use App\Models\Product;
use App\Models\Scenario;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ScenarioAssumption>
 */
class ScenarioAssumptionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'scenario_id' => Scenario::factory(),
            'year' => fake()->numberBetween(2024, 2030),
            'business_group_id' => fake()->optional(0.3)->passthrough(BusinessGroup::factory()),
            'customer_type_id' => fake()->optional(0.4)->passthrough(CustomerType::factory()),
            'customer_id' => fake()->optional(0.2)->passthrough(Customer::factory()),
            'product_id' => fake()->optional(0.3)->passthrough(Product::factory()),
            'growth_rate' => fake()->randomFloat(2, -10, 25),
            'inflation_rate' => fake()->optional(0.5)->randomFloat(2, 2, 8),
            'adjustment_type' => fake()->randomElement(['percentage', 'fixed_amount']),
            'fixed_amount' => fake()->optional(0.3)->randomFloat(2, 1000, 100000),
            'notes' => fake()->optional(0.5)->sentence(),
        ];
    }

    /**
     * Indicate that the assumption is a global assumption (no specific filters).
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

    /**
     * Indicate that the assumption is for a specific customer type.
     */
    public function forCustomerType(CustomerType $customerType): static
    {
        return $this->state(fn (array $attributes) => [
            'customer_type_id' => $customerType->id,
            'customer_id' => null,
            'business_group_id' => null,
        ]);
    }

    /**
     * Indicate that the assumption is for a specific customer.
     */
    public function forCustomer(Customer $customer): static
    {
        return $this->state(fn (array $attributes) => [
            'customer_id' => $customer->id,
        ]);
    }

    /**
     * Indicate that the assumption is for a specific business group.
     */
    public function forBusinessGroup(BusinessGroup $businessGroup): static
    {
        return $this->state(fn (array $attributes) => [
            'business_group_id' => $businessGroup->id,
            'customer_id' => null,
        ]);
    }

    /**
     * Indicate that the assumption is for a specific product.
     */
    public function forProduct(Product $product): static
    {
        return $this->state(fn (array $attributes) => [
            'product_id' => $product->id,
        ]);
    }

    /**
     * Indicate that the assumption uses percentage adjustment.
     */
    public function percentage(): static
    {
        return $this->state(fn (array $attributes) => [
            'adjustment_type' => 'percentage',
            'fixed_amount' => null,
        ]);
    }

    /**
     * Indicate that the assumption uses fixed amount adjustment.
     */
    public function fixedAmount(float $amount): static
    {
        return $this->state(fn (array $attributes) => [
            'adjustment_type' => 'fixed_amount',
            'fixed_amount' => $amount,
        ]);
    }
}
