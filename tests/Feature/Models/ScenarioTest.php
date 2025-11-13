<?php

use App\Models\Organization;
use App\Models\Projection;
use App\Models\Scenario;
use App\Models\ScenarioAssumption;
use App\Models\User;

test('scenario belongs to organization and user', function () {
    $organization = Organization::factory()->create();
    $user = User::factory()->create();
    $scenario = Scenario::factory()->forOrganization($organization)->createdBy($user)->create();

    expect($scenario->organization)->toBeInstanceOf(Organization::class)
        ->and($scenario->user)->toBeInstanceOf(User::class);
});

test('scenario has many assumptions', function () {
    $scenario = Scenario::factory()->create();
    ScenarioAssumption::factory()->count(5)->create(['scenario_id' => $scenario->id]);

    expect($scenario->assumptions)->toHaveCount(5);
});

test('scenario has many projections', function () {
    $scenario = Scenario::factory()->create();
    Projection::factory()->count(3)->forScenario($scenario)->create();

    expect($scenario->projections)->toHaveCount(3);
});

test('deleting scenario cascades to assumptions and projections', function () {
    $scenario = Scenario::factory()->create();
    $assumption = ScenarioAssumption::factory()->create(['scenario_id' => $scenario->id]);
    $projection = Projection::factory()->forScenario($scenario)->create();

    $assumptionId = $assumption->id;
    $projectionId = $projection->id;

    $scenario->delete();

    expect(ScenarioAssumption::find($assumptionId))->toBeNull()
        ->and(Projection::withTrashed()->find($projectionId))->toBeNull();
});
