<?php

use App\Models\Organization;
use App\Models\Projection;
use App\Models\Scenario;
use App\Models\ScenarioAssumption;
use App\Models\User;

beforeEach(function () {
    // Create organization and user for testing
    $this->organization = Organization::factory()->create();
    $this->user = User::factory()->create(['organization_id' => $this->organization->id]);

    // Set current organization context
    $this->actingAs($this->user);
});

test('updating assumption invalidates all projections for the scenario', function () {
    // Create a scenario with projections
    $scenario = Scenario::factory()
        ->forOrganization($this->organization)
        ->create();

    // Create an assumption
    $assumption = ScenarioAssumption::factory()
        ->create(['scenario_id' => $scenario->id]);

    // Create multiple projections for this scenario
    $projections = Projection::factory()
        ->count(3)
        ->forScenario($scenario)
        ->create();

    // Verify projections exist
    expect($scenario->projections()->count())->toBe(3);
    expect(Projection::withTrashed()->count())->toBe(3);

    // Update the assumption
    $assumption->update(['growth_rate' => 15.5]);

    // Verify all projections were soft deleted
    expect($scenario->projections()->count())->toBe(0);
    expect(Projection::withTrashed()->count())->toBe(3);
    expect(Projection::onlyTrashed()->count())->toBe(3);
});

test('deleting assumption invalidates all projections for the scenario', function () {
    // Create a scenario with projections
    $scenario = Scenario::factory()
        ->forOrganization($this->organization)
        ->create();

    // Create an assumption
    $assumption = ScenarioAssumption::factory()
        ->create(['scenario_id' => $scenario->id]);

    // Create multiple projections for this scenario
    $projections = Projection::factory()
        ->count(5)
        ->forScenario($scenario)
        ->create();

    // Verify projections exist
    expect($scenario->projections()->count())->toBe(5);

    // Delete the assumption
    $assumption->delete();

    // Verify all projections were soft deleted
    expect($scenario->projections()->count())->toBe(0);
    expect(Projection::withTrashed()->count())->toBe(5);
    expect(Projection::onlyTrashed()->count())->toBe(5);
});

test('updating assumption only affects projections from its scenario', function () {
    // Create two different scenarios
    $scenario1 = Scenario::factory()
        ->forOrganization($this->organization)
        ->create(['name' => 'Scenario 1']);

    $scenario2 = Scenario::factory()
        ->forOrganization($this->organization)
        ->create(['name' => 'Scenario 2']);

    // Create assumptions for both scenarios
    $assumption1 = ScenarioAssumption::factory()
        ->create(['scenario_id' => $scenario1->id]);

    $assumption2 = ScenarioAssumption::factory()
        ->create(['scenario_id' => $scenario2->id]);

    // Create projections for both scenarios
    $projections1 = Projection::factory()
        ->count(3)
        ->forScenario($scenario1)
        ->create();

    $projections2 = Projection::factory()
        ->count(2)
        ->forScenario($scenario2)
        ->create();

    // Verify initial state
    expect($scenario1->projections()->count())->toBe(3);
    expect($scenario2->projections()->count())->toBe(2);

    // Update assumption in scenario 1
    $assumption1->update(['growth_rate' => 20.0]);

    // Verify only scenario 1 projections were invalidated
    expect($scenario1->projections()->count())->toBe(0);
    expect($scenario2->projections()->count())->toBe(2);
    expect(Projection::onlyTrashed()->count())->toBe(3);
});

test('multiple assumption updates invalidate projections correctly', function () {
    $scenario = Scenario::factory()
        ->forOrganization($this->organization)
        ->create();

    $assumption = ScenarioAssumption::factory()
        ->create(['scenario_id' => $scenario->id]);

    // Create initial projections
    Projection::factory()
        ->count(3)
        ->forScenario($scenario)
        ->create();

    expect($scenario->projections()->count())->toBe(3);

    // Update assumption - should soft delete projections
    $assumption->update(['growth_rate' => 10.0]);
    expect($scenario->projections()->count())->toBe(0);

    // Create new projections after recalculation
    Projection::factory()
        ->count(4)
        ->forScenario($scenario)
        ->create();

    expect($scenario->projections()->count())->toBe(4);
    expect(Projection::withTrashed()->count())->toBe(7);

    // Update assumption again - should soft delete the new projections
    $assumption->update(['inflation_rate' => 5.0]);

    expect($scenario->projections()->count())->toBe(0);
    expect(Projection::onlyTrashed()->count())->toBe(7);
});

test('assumption deletion does not affect already soft deleted projections', function () {
    $scenario = Scenario::factory()
        ->forOrganization($this->organization)
        ->create();

    $assumption = ScenarioAssumption::factory()
        ->create(['scenario_id' => $scenario->id]);

    // Create projections
    $projections = Projection::factory()
        ->count(3)
        ->forScenario($scenario)
        ->create();

    // Manually soft delete one projection
    $projections[0]->delete();

    expect($scenario->projections()->count())->toBe(2);
    expect(Projection::onlyTrashed()->count())->toBe(1);

    // Delete assumption
    $assumption->delete();

    // All projections should now be soft deleted
    expect($scenario->projections()->count())->toBe(0);
    expect(Projection::onlyTrashed()->count())->toBe(3);
});
