<?php

use App\Models\Organization;
use App\Models\Scenario;
use App\Models\ScenarioAssumption;
use App\Models\User;
use function Pest\Laravel\{actingAs, assertDatabaseHas, deleteJson, getJson, postJson, putJson};

beforeEach(function () {
    $this->organization = Organization::factory()->create();
    $this->user = User::factory()->create(['organization_id' => $this->organization->id]);

    actingAs($this->user);
});

it('can list scenarios', function () {
    Scenario::factory()->count(5)->create([
        'organization_id' => $this->organization->id,
        'user_id' => $this->user->id,
    ]);

    $response = getJson('/api/v1/scenarios');

    $response->assertSuccessful();
    $response->assertJsonCount(5, 'data');
});

it('can filter scenarios by status', function () {
    Scenario::factory()->count(3)->create([
        'organization_id' => $this->organization->id,
        'user_id' => $this->user->id,
        'status' => 'active',
    ]);

    Scenario::factory()->count(2)->create([
        'organization_id' => $this->organization->id,
        'user_id' => $this->user->id,
        'status' => 'draft',
    ]);

    $response = getJson('/api/v1/scenarios?status=active');

    $response->assertSuccessful();
    $response->assertJsonCount(3, 'data');
});

it('can create a scenario', function () {
    $scenarioData = [
        'name' => 'Test Scenario',
        'description' => 'Test Description',
        'base_year' => 2024,
        'historical_months' => 12,
        'projection_years' => 3,
        'status' => 'draft',
        'is_baseline' => false,
        'calculation_method' => 'simple_average',
        'include_inflation' => true,
    ];

    $response = postJson('/api/v1/scenarios', $scenarioData);

    $response->assertCreated();
    $response->assertJsonPath('data.name', 'Test Scenario');
    $response->assertJsonPath('data.base_year', 2024);

    assertDatabaseHas('scenarios', [
        'name' => 'Test Scenario',
        'organization_id' => $this->organization->id,
        'user_id' => $this->user->id,
    ]);
});

it('validates required fields when creating scenario', function () {
    $response = postJson('/api/v1/scenarios', []);

    $response->assertUnprocessable();
    $response->assertJsonValidationErrors([
        'name',
        'base_year',
        'historical_months',
        'projection_years',
        'status',
        'calculation_method',
    ]);
});

it('validates scenario field constraints', function () {
    $response = postJson('/api/v1/scenarios', [
        'name' => 'Test',
        'base_year' => 1999, // Too old
        'historical_months' => 2, // Too few
        'projection_years' => 11, // Too many
        'status' => 'invalid_status',
        'calculation_method' => 'invalid_method',
    ]);

    $response->assertUnprocessable();
    $response->assertJsonValidationErrors([
        'base_year',
        'historical_months',
        'projection_years',
        'status',
        'calculation_method',
    ]);
});

it('can show a scenario with assumptions', function () {
    $scenario = Scenario::factory()->create([
        'organization_id' => $this->organization->id,
        'user_id' => $this->user->id,
    ]);

    ScenarioAssumption::factory()->count(3)->create([
        'scenario_id' => $scenario->id,
    ]);

    $response = getJson('/api/v1/scenarios/'.$scenario->id);

    $response->assertSuccessful();
    $response->assertJsonPath('data.id', $scenario->id);
    $response->assertJsonPath('data.assumptions_count', 3);
});

it('can update a scenario', function () {
    $scenario = Scenario::factory()->create([
        'organization_id' => $this->organization->id,
        'user_id' => $this->user->id,
    ]);

    $response = putJson('/api/v1/scenarios/'.$scenario->id, [
        'name' => 'Updated Scenario Name',
        'status' => 'active',
    ]);

    $response->assertSuccessful();
    $response->assertJsonPath('data.name', 'Updated Scenario Name');
    $response->assertJsonPath('data.status', 'active');

    assertDatabaseHas('scenarios', [
        'id' => $scenario->id,
        'name' => 'Updated Scenario Name',
        'status' => 'active',
    ]);
});

it('can delete a scenario', function () {
    $scenario = Scenario::factory()->create([
        'organization_id' => $this->organization->id,
        'user_id' => $this->user->id,
    ]);

    $response = deleteJson('/api/v1/scenarios/'.$scenario->id);

    $response->assertNoContent();

    $this->assertSoftDeleted('scenarios', [
        'id' => $scenario->id,
    ]);
});

it('can duplicate a scenario', function () {
    $scenario = Scenario::factory()->create([
        'organization_id' => $this->organization->id,
        'user_id' => $this->user->id,
        'name' => 'Original Scenario',
    ]);

    ScenarioAssumption::factory()->count(3)->create([
        'scenario_id' => $scenario->id,
    ]);

    $response = postJson('/api/v1/scenarios/'.$scenario->id.'/duplicate', [
        'name' => 'Duplicated Scenario',
        'copy_assumptions' => true,
    ]);

    $response->assertCreated();
    $response->assertJsonPath('data.name', 'Duplicated Scenario');
    $response->assertJsonPath('data.status', 'draft');
    $response->assertJsonPath('data.is_baseline', false);
    $response->assertJsonPath('data.assumptions_count', 3);

    assertDatabaseHas('scenarios', [
        'name' => 'Duplicated Scenario',
        'organization_id' => $this->organization->id,
    ]);
});

it('can duplicate scenario without assumptions', function () {
    $scenario = Scenario::factory()->create([
        'organization_id' => $this->organization->id,
        'user_id' => $this->user->id,
    ]);

    ScenarioAssumption::factory()->count(3)->create([
        'scenario_id' => $scenario->id,
    ]);

    $response = postJson('/api/v1/scenarios/'.$scenario->id.'/duplicate', [
        'name' => 'Empty Duplicate',
        'copy_assumptions' => false,
    ]);

    $response->assertCreated();
    $response->assertJsonPath('data.assumptions_count', 0);
});

it('requires name when duplicating scenario', function () {
    $scenario = Scenario::factory()->create([
        'organization_id' => $this->organization->id,
        'user_id' => $this->user->id,
    ]);

    $response = postJson('/api/v1/scenarios/'.$scenario->id.'/duplicate', []);

    $response->assertUnprocessable();
    $response->assertJsonValidationErrors(['name']);
});
