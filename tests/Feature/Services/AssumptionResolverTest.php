<?php

use App\Models\BusinessGroup;
use App\Models\Customer;
use App\Models\CustomerType;
use App\Models\Product;
use App\Models\Scenario;
use App\Models\ScenarioAssumption;
use App\Services\AssumptionResolver;

beforeEach(function () {
    $this->resolver = new AssumptionResolver;
    $this->scenario = Scenario::factory()->create(['base_year' => 2024]);
    $this->customerType = CustomerType::factory()->create();
    $this->businessGroup = BusinessGroup::factory()->create();
    $this->customer = Customer::factory()->create([
        'customer_type_id' => $this->customerType->id,
        'business_group_id' => $this->businessGroup->id,
    ]);
    $this->product = Product::factory()->create();
    $this->year = 2025;
});

test('resolves global assumption when no specific assumptions exist', function () {
    $globalAssumption = ScenarioAssumption::factory()->create([
        'scenario_id' => $this->scenario->id,
        'year' => $this->year,
        'growth_rate' => 5.0,
    ]);

    $result = $this->resolver->resolve($this->scenario, $this->year, [
        'customer_id' => $this->customer->id,
        'customer_type_id' => $this->customerType->id,
        'business_group_id' => $this->businessGroup->id,
    ]);

    expect($result)->not->toBeNull();
    expect($result->id)->toBe($globalAssumption->id);
    expect((float) $result->growth_rate)->toBe(5.0);
});

test('resolves customer type assumption over global', function () {
    ScenarioAssumption::factory()->create([
        'scenario_id' => $this->scenario->id,
        'year' => $this->year,
        'growth_rate' => 5.0,
    ]);

    $typeAssumption = ScenarioAssumption::factory()->create([
        'scenario_id' => $this->scenario->id,
        'year' => $this->year,
        'customer_type_id' => $this->customerType->id,
        'growth_rate' => 7.0,
    ]);

    $result = $this->resolver->resolve($this->scenario, $this->year, [
        'customer_id' => $this->customer->id,
        'customer_type_id' => $this->customerType->id,
        'business_group_id' => $this->businessGroup->id,
    ]);

    expect($result)->not->toBeNull();
    expect($result->id)->toBe($typeAssumption->id);
    expect((float) $result->growth_rate)->toBe(7.0);
});

test('resolves business group assumption over customer type', function () {
    ScenarioAssumption::factory()->create([
        'scenario_id' => $this->scenario->id,
        'year' => $this->year,
        'growth_rate' => 5.0,
    ]);

    ScenarioAssumption::factory()->create([
        'scenario_id' => $this->scenario->id,
        'year' => $this->year,
        'customer_type_id' => $this->customerType->id,
        'growth_rate' => 7.0,
    ]);

    $groupAssumption = ScenarioAssumption::factory()->create([
        'scenario_id' => $this->scenario->id,
        'year' => $this->year,
        'business_group_id' => $this->businessGroup->id,
        'growth_rate' => 8.0,
    ]);

    $result = $this->resolver->resolve($this->scenario, $this->year, [
        'customer_id' => $this->customer->id,
        'customer_type_id' => $this->customerType->id,
        'business_group_id' => $this->businessGroup->id,
    ]);

    expect($result)->not->toBeNull();
    expect($result->id)->toBe($groupAssumption->id);
    expect((float) $result->growth_rate)->toBe(8.0);
});

test('resolves customer specific assumption over all others', function () {
    ScenarioAssumption::factory()->create([
        'scenario_id' => $this->scenario->id,
        'year' => $this->year,
        'growth_rate' => 5.0,
    ]);

    ScenarioAssumption::factory()->create([
        'scenario_id' => $this->scenario->id,
        'year' => $this->year,
        'customer_type_id' => $this->customerType->id,
        'growth_rate' => 7.0,
    ]);

    ScenarioAssumption::factory()->create([
        'scenario_id' => $this->scenario->id,
        'year' => $this->year,
        'business_group_id' => $this->businessGroup->id,
        'growth_rate' => 8.0,
    ]);

    $customerAssumption = ScenarioAssumption::factory()->create([
        'scenario_id' => $this->scenario->id,
        'year' => $this->year,
        'customer_id' => $this->customer->id,
        'growth_rate' => 10.0,
    ]);

    $result = $this->resolver->resolve($this->scenario, $this->year, [
        'customer_id' => $this->customer->id,
        'customer_type_id' => $this->customerType->id,
        'business_group_id' => $this->businessGroup->id,
    ]);

    expect($result)->not->toBeNull();
    expect($result->id)->toBe($customerAssumption->id);
    expect((float) $result->growth_rate)->toBe(10.0);
});

test('resolves customer + product assumption over customer only', function () {
    ScenarioAssumption::factory()->create([
        'scenario_id' => $this->scenario->id,
        'year' => $this->year,
        'customer_id' => $this->customer->id,
        'growth_rate' => 10.0,
    ]);

    $customerProductAssumption = ScenarioAssumption::factory()->create([
        'scenario_id' => $this->scenario->id,
        'year' => $this->year,
        'customer_id' => $this->customer->id,
        'product_id' => $this->product->id,
        'growth_rate' => 12.0,
    ]);

    $result = $this->resolver->resolve($this->scenario, $this->year, [
        'customer_id' => $this->customer->id,
        'customer_type_id' => $this->customerType->id,
        'business_group_id' => $this->businessGroup->id,
        'product_id' => $this->product->id,
    ]);

    expect($result)->not->toBeNull();
    expect($result->id)->toBe($customerProductAssumption->id);
    expect((float) $result->growth_rate)->toBe(12.0);
});

test('returns null when no assumptions exist for the year', function () {
    ScenarioAssumption::factory()->create([
        'scenario_id' => $this->scenario->id,
        'year' => 2026,
        'growth_rate' => 5.0,
    ]);

    $result = $this->resolver->resolve($this->scenario, $this->year, [
        'customer_id' => $this->customer->id,
    ]);

    expect($result)->toBeNull();
});

test('validates complete hierarchy priority', function () {
    $global = ScenarioAssumption::factory()->create([
        'scenario_id' => $this->scenario->id,
        'year' => $this->year,
        'growth_rate' => 1.0,
    ]);

    $product = ScenarioAssumption::factory()->create([
        'scenario_id' => $this->scenario->id,
        'year' => $this->year,
        'product_id' => $this->product->id,
        'growth_rate' => 2.0,
    ]);

    $customerType = ScenarioAssumption::factory()->create([
        'scenario_id' => $this->scenario->id,
        'year' => $this->year,
        'customer_type_id' => $this->customerType->id,
        'growth_rate' => 3.0,
    ]);

    $businessGroup = ScenarioAssumption::factory()->create([
        'scenario_id' => $this->scenario->id,
        'year' => $this->year,
        'business_group_id' => $this->businessGroup->id,
        'growth_rate' => 5.0,
    ]);

    $customer = ScenarioAssumption::factory()->create([
        'scenario_id' => $this->scenario->id,
        'year' => $this->year,
        'customer_id' => $this->customer->id,
        'growth_rate' => 7.0,
    ]);

    $customerProduct = ScenarioAssumption::factory()->create([
        'scenario_id' => $this->scenario->id,
        'year' => $this->year,
        'customer_id' => $this->customer->id,
        'product_id' => $this->product->id,
        'growth_rate' => 8.0,
    ]);

    // With all dimensions, customer + product should win (highest priority)
    $result = $this->resolver->resolve($this->scenario, $this->year, [
        'customer_id' => $this->customer->id,
        'customer_type_id' => $this->customerType->id,
        'business_group_id' => $this->businessGroup->id,
        'product_id' => $this->product->id,
    ]);

    expect($result->id)->toBe($customerProduct->id);
    expect((float) $result->growth_rate)->toBe(8.0);
});

test('returns all applicable assumptions in priority order', function () {
    $global = ScenarioAssumption::factory()->create([
        'scenario_id' => $this->scenario->id,
        'year' => $this->year,
        'growth_rate' => 5.0,
    ]);

    $customerType = ScenarioAssumption::factory()->create([
        'scenario_id' => $this->scenario->id,
        'year' => $this->year,
        'customer_type_id' => $this->customerType->id,
        'growth_rate' => 7.0,
    ]);

    $customer = ScenarioAssumption::factory()->create([
        'scenario_id' => $this->scenario->id,
        'year' => $this->year,
        'customer_id' => $this->customer->id,
        'growth_rate' => 10.0,
    ]);

    $result = $this->resolver->getAllApplicable($this->scenario, $this->year, [
        'customer_id' => $this->customer->id,
        'customer_type_id' => $this->customerType->id,
        'business_group_id' => $this->businessGroup->id,
    ]);

    expect($result)->toHaveCount(3);
    expect($result[0]->id)->toBe($customer->id);
    expect($result[1]->id)->toBe($customerType->id);
    expect($result[2]->id)->toBe($global->id);
});
