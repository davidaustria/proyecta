<?php

namespace Database\Factories;

use App\Models\BusinessGroup;
use App\Models\CustomerType;
use App\Models\Organization;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Customer>
 */
class CustomerFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $companyName = fake()->company();

        return [
            'organization_id' => Organization::factory(),
            'business_group_id' => fake()->optional(0.6)->passthrough(BusinessGroup::factory()),
            'customer_type_id' => CustomerType::factory(),
            'name' => $companyName,
            'code' => strtoupper(fake()->unique()->bothify('CUST-####')),
            'tax_id' => strtoupper(fake()->bothify('???######???')),
            'is_active' => fake()->boolean(90),
            'metadata' => fake()->optional(0.5)->passthrough([
                'contact_name' => fake()->name(),
                'contact_email' => fake()->safeEmail(),
                'contact_phone' => fake()->phoneNumber(),
                'address' => fake()->address(),
            ]),
        ];
    }

    /**
     * Indicate that the customer is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }

    /**
     * Indicate that the customer belongs to a specific organization.
     */
    public function forOrganization(Organization $organization): static
    {
        return $this->state(fn (array $attributes) => [
            'organization_id' => $organization->id,
        ]);
    }

    /**
     * Indicate that the customer belongs to a business group.
     */
    public function forBusinessGroup(BusinessGroup $businessGroup): static
    {
        return $this->state(fn (array $attributes) => [
            'business_group_id' => $businessGroup->id,
        ]);
    }

    /**
     * Indicate that the customer has a specific type.
     */
    public function ofType(CustomerType $customerType): static
    {
        return $this->state(fn (array $attributes) => [
            'customer_type_id' => $customerType->id,
        ]);
    }
}
