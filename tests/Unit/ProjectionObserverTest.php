<?php

use App\Models\Organization;
use App\Models\Projection;
use App\Models\Scenario;
use App\Models\User;

beforeEach(function () {
    // Create organization and user for testing
    $this->organization = Organization::factory()->create();
    $this->user = User::factory()->create(['organization_id' => $this->organization->id]);

    // Set current organization context
    $this->actingAs($this->user);

    // Create a scenario for projections
    $this->scenario = Scenario::factory()
        ->forOrganization($this->organization)
        ->create();
});

test('creating projection automatically calculates total_amount from subtotal and tax', function () {
    $projection = Projection::factory()->make([
        'scenario_id' => $this->scenario->id,
        'total_subtotal' => 10000.00,
        'total_tax' => 1600.00,
        'total_amount' => null, // Should be auto-calculated
    ]);

    $projection->save();

    expect($projection->total_amount)->toBe(11600.00);
});

test('creating projection with manually set total_amount gets recalculated correctly', function () {
    $projection = Projection::factory()->make([
        'scenario_id' => $this->scenario->id,
        'total_subtotal' => 5000.00,
        'total_tax' => 800.00,
        'total_amount' => 999.99, // Wrong value, should be corrected
    ]);

    $projection->save();

    expect($projection->total_amount)->toBe(5800.00);
});

test('saving projection validates that total_amount matches subtotal plus tax', function () {
    $projection = Projection::factory()->create([
        'scenario_id' => $this->scenario->id,
        'total_subtotal' => 10000.00,
        'total_tax' => 1600.00,
        'total_amount' => 11600.00,
    ]);

    // Try to update with mismatched totals
    $projection->total_amount = 15000.00;

    expect(fn () => $projection->save())
        ->toThrow(
            InvalidArgumentException::class,
            'Projection total_amount (15000.00) does not match subtotal + tax (11600.00)'
        );
});

test('saving projection recalculates total_amount when subtotal changes', function () {
    $projection = Projection::factory()->create([
        'scenario_id' => $this->scenario->id,
        'total_subtotal' => 10000.00,
        'total_tax' => 1600.00,
        'total_amount' => 11600.00,
    ]);

    expect($projection->total_amount)->toBe(11600.00);

    // Update subtotal
    $projection->total_subtotal = 20000.00;
    $projection->save();

    // Total should be recalculated
    expect($projection->total_amount)->toBe(21600.00);
});

test('saving projection recalculates total_amount when tax changes', function () {
    $projection = Projection::factory()->create([
        'scenario_id' => $this->scenario->id,
        'total_subtotal' => 10000.00,
        'total_tax' => 1600.00,
        'total_amount' => 11600.00,
    ]);

    // Update tax
    $projection->total_tax = 2000.00;
    $projection->save();

    // Total should be recalculated
    expect($projection->total_amount)->toBe(12000.00);
});

test('projection with null subtotal or tax does not calculate total', function () {
    $projection = Projection::factory()->make([
        'scenario_id' => $this->scenario->id,
        'total_subtotal' => null,
        'total_tax' => 1600.00,
        'total_amount' => 5000.00,
    ]);

    $projection->save();

    // total_amount should remain as provided since subtotal is null
    expect($projection->total_amount)->toBe(5000.00);
});

test('projection calculation handles decimal precision correctly', function () {
    $projection = Projection::factory()->make([
        'scenario_id' => $this->scenario->id,
        'total_subtotal' => 10000.33,
        'total_tax' => 1600.05,
        'total_amount' => null,
    ]);

    $projection->save();

    expect($projection->total_amount)->toBe(11600.38);
});

test('projection validation allows small rounding differences', function () {
    // Create projection with values that might have small rounding errors
    $projection = Projection::factory()->create([
        'scenario_id' => $this->scenario->id,
        'total_subtotal' => 10000.00,
        'total_tax' => 1600.00,
        'total_amount' => 11600.00,
    ]);

    // Introduce a very small difference (0.005 which is within tolerance)
    $projection->total_amount = 11600.005;

    // Should not throw exception due to tolerance
    $projection->save();

    expect($projection->total_amount)->toBe(11600.01); // Rounded to 2 decimals
});

test('projection validation rejects differences larger than tolerance', function () {
    $projection = Projection::factory()->create([
        'scenario_id' => $this->scenario->id,
        'total_subtotal' => 10000.00,
        'total_tax' => 1600.00,
        'total_amount' => 11600.00,
    ]);

    // Introduce a difference larger than tolerance (0.01)
    $projection->total_amount = 11600.50;

    expect(fn () => $projection->save())
        ->toThrow(InvalidArgumentException::class);
});

test('updating projection with both subtotal and tax recalculates correctly', function () {
    $projection = Projection::factory()->create([
        'scenario_id' => $this->scenario->id,
        'total_subtotal' => 10000.00,
        'total_tax' => 1600.00,
        'total_amount' => 11600.00,
    ]);

    // Update both values
    $projection->update([
        'total_subtotal' => 25000.00,
        'total_tax' => 4000.00,
    ]);

    expect($projection->fresh()->total_amount)->toBe(29000.00);
});

test('creating projection without amounts does not fail', function () {
    $projection = Projection::factory()->make([
        'scenario_id' => $this->scenario->id,
        'total_subtotal' => null,
        'total_tax' => null,
        'total_amount' => null,
    ]);

    // Should not throw exception
    $projection->save();

    expect($projection->exists)->toBeTrue();
    expect($projection->total_amount)->toBeNull();
});

test('zero values are handled correctly in calculation', function () {
    $projection = Projection::factory()->make([
        'scenario_id' => $this->scenario->id,
        'total_subtotal' => 0.00,
        'total_tax' => 0.00,
        'total_amount' => null,
    ]);

    $projection->save();

    expect($projection->total_amount)->toBe(0.00);
});

test('negative values are calculated correctly', function () {
    $projection = Projection::factory()->make([
        'scenario_id' => $this->scenario->id,
        'total_subtotal' => -5000.00,
        'total_tax' => -800.00,
        'total_amount' => null,
    ]);

    $projection->save();

    expect($projection->total_amount)->toBe(-5800.00);
});
