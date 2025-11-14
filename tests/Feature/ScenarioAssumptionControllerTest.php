<?php

use App\Models\Customer;
use App\Models\CustomerType;
use App\Models\Organization;
use App\Models\Scenario;
use App\Models\ScenarioAssumption;
use App\Models\User;
use function Pest\Laravel\{actingAs, assertDatabaseHas, deleteJson, getJson, postJson, putJson};

beforeEach(function () {
    $this->organization = Organization::factory()->create();
    $this->user = User::factory()->create(['organization_id' => $this->organization->id]);
    $this->scenario = Scenario::factory()->create([
        'organization_id' => $this->organization->id,
        'user_id' => $this->user->id,
    ]);

    actingAs($this->user);
});

it('can list scenario assumptions', function () {
    ScenarioAssumption::factory()->count(5)->create([
        'scenario_id' => $this->scenario->id,
    ]);

    $response = getJson('/api/v1/scenario-assumptions?scenario_id='.$this->scenario->id);

    $response->assertSuccessful();
    $response->assertJsonCount(5, 'data');
});

it('can filter assumptions by year', function () {
    ScenarioAssumption::factory()->count(3)->create([
        'scenario_id' => $this->scenario->id,
        'year' => 2025,
    ]);

    ScenarioAssumption::factory()->count(2)->create([
        'scenario_id' => $this->scenario->id,
        'year' => 2026,
    ]);

    $response = getJson('/api/v1/scenario-assumptions?scenario_id='.$this->scenario->id.'&year=2025');

    $response->assertSuccessful();
    $response->assertJsonCount(3, 'data');
});

it('can create a scenario assumption', function () {
    $assumptionData = [
        'scenario_id' => $this->scenario->id,
        'year' => 2025,
        'growth_rate' => 10.5,
        'inflation_rate' => 3.5,
        'adjustment_type' => 'percentage',
    ];

    $response = postJson('/api/v1/scenario-assumptions', $assumptionData);

    $response->assertCreated();
    $response->assertJsonPath('data.year', 2025);
    $response->assertJsonPath('data.growth_rate', 10.5);

    assertDatabaseHas('scenario_assumptions', [
        'scenario_id' => $this->scenario->id,
        'year' => 2025,
        'growth_rate' => 10.5,
    ]);
});

it('validates required fields when creating assumption', function () {
    $response = postJson('/api/v1/scenario-assumptions', []);

    $response->assertUnprocessable();
    $response->assertJsonValidationErrors(['scenario_id', 'year', 'adjustment_type']);
});

it('validates seasonality factors must have 12 values', function () {
    $response = postJson('/api/v1/scenario-assumptions', [
        'scenario_id' => $this->scenario->id,
        'year' => 2025,
        'adjustment_type' => 'percentage',
        'seasonality_factors' => [1.0, 1.0, 1.0], // Only 3 values instead of 12
    ]);

    $response->assertUnprocessable();
    $response->assertJsonValidationErrors(['seasonality_factors']);
});

it('validates seasonality factors sum approximately to 12', function () {
    $response = postJson('/api/v1/scenario-assumptions', [
        'scenario_id' => $this->scenario->id,
        'year' => 2025,
        'adjustment_type' => 'percentage',
        'seasonality_factors' => array_fill(0, 12, 2.0), // Sum = 24, should fail
    ]);

    $response->assertUnprocessable();
    $response->assertJsonValidationErrors(['seasonality_factors']);
});

it('accepts valid seasonality factors', function () {
    $response = postJson('/api/v1/scenario-assumptions', [
        'scenario_id' => $this->scenario->id,
        'year' => 2025,
        'adjustment_type' => 'percentage',
        'seasonality_factors' => array_fill(0, 12, 1.0), // Sum = 12.0
    ]);

    $response->assertCreated();
});

it('prevents duplicate assumptions with same dimensions', function () {
    $customerType = CustomerType::factory()->create(['organization_id' => $this->organization->id]);

    ScenarioAssumption::factory()->create([
        'scenario_id' => $this->scenario->id,
        'year' => 2025,
        'customer_type_id' => $customerType->id,
        'business_group_id' => null,
        'customer_id' => null,
        'product_id' => null,
    ]);

    $response = postJson('/api/v1/scenario-assumptions', [
        'scenario_id' => $this->scenario->id,
        'year' => 2025,
        'customer_type_id' => $customerType->id,
        'adjustment_type' => 'percentage',
    ]);

    $response->assertUnprocessable();
    $response->assertJsonValidationErrors(['scenario_id']);
});

it('can update an assumption', function () {
    $assumption = ScenarioAssumption::factory()->create([
        'scenario_id' => $this->scenario->id,
        'growth_rate' => 5.0,
    ]);

    $response = putJson('/api/v1/scenario-assumptions/'.$assumption->id, [
        'growth_rate' => 15.0,
    ]);

    $response->assertSuccessful();
    $response->assertJsonPath('data.growth_rate', 15.0);

    assertDatabaseHas('scenario_assumptions', [
        'id' => $assumption->id,
        'growth_rate' => 15.0,
    ]);
});

it('can delete an assumption', function () {
    $assumption = ScenarioAssumption::factory()->create([
        'scenario_id' => $this->scenario->id,
    ]);

    $response = deleteJson('/api/v1/scenario-assumptions/'.$assumption->id);

    $response->assertNoContent();

    $this->assertDatabaseMissing('scenario_assumptions', [
        'id' => $assumption->id,
    ]);
});

it('can bulk create assumptions', function () {
    $customerType1 = CustomerType::factory()->create(['organization_id' => $this->organization->id]);
    $customerType2 = CustomerType::factory()->create(['organization_id' => $this->organization->id]);

    $response = postJson('/api/v1/scenario-assumptions/bulk', [
        'assumptions' => [
            [
                'scenario_id' => $this->scenario->id,
                'year' => 2025,
                'customer_type_id' => $customerType1->id,
                'growth_rate' => 10.0,
                'adjustment_type' => 'percentage',
            ],
            [
                'scenario_id' => $this->scenario->id,
                'year' => 2025,
                'customer_type_id' => $customerType2->id,
                'growth_rate' => 12.0,
                'adjustment_type' => 'percentage',
            ],
        ],
    ]);

    $response->assertCreated();
    $response->assertJsonPath('count', 2);

    assertDatabaseHas('scenario_assumptions', [
        'scenario_id' => $this->scenario->id,
        'customer_type_id' => $customerType1->id,
        'growth_rate' => 10.0,
    ]);

    assertDatabaseHas('scenario_assumptions', [
        'scenario_id' => $this->scenario->id,
        'customer_type_id' => $customerType2->id,
        'growth_rate' => 12.0,
    ]);
});
