<?php

use App\Models\BusinessGroup;
use App\Models\Customer;
use App\Models\Organization;
use App\Models\Projection;
use App\Models\ScenarioAssumption;

test('business group belongs to organization', function () {
    $organization = Organization::factory()->create();
    $businessGroup = BusinessGroup::factory()->forOrganization($organization)->create();

    expect($businessGroup->organization)->toBeInstanceOf(Organization::class)
        ->and($businessGroup->organization->id)->toBe($organization->id);
});

test('business group has many customers', function () {
    $businessGroup = BusinessGroup::factory()->create();
    $customers = Customer::factory()->count(5)->forBusinessGroup($businessGroup)->create();

    expect($businessGroup->customers)->toHaveCount(5)
        ->and($businessGroup->customers->first())->toBeInstanceOf(Customer::class);
});

test('business group has many scenario assumptions', function () {
    $businessGroup = BusinessGroup::factory()->create();
    $assumptions = ScenarioAssumption::factory()->count(3)->forBusinessGroup($businessGroup)->create();

    expect($businessGroup->scenarioAssumptions)->toHaveCount(3)
        ->and($businessGroup->scenarioAssumptions->first())->toBeInstanceOf(ScenarioAssumption::class);
});

test('business group has many projections', function () {
    $businessGroup = BusinessGroup::factory()->create();
    $projections = Projection::factory()->count(3)->create(['business_group_id' => $businessGroup->id]);

    expect($businessGroup->projections)->toHaveCount(3)
        ->and($businessGroup->projections->first())->toBeInstanceOf(Projection::class);
});

test('business group code must be unique per organization', function () {
    $organization = Organization::factory()->create();

    BusinessGroup::factory()->forOrganization($organization)->create(['code' => 'BG-001']);

    expect(fn () => BusinessGroup::factory()->forOrganization($organization)->create(['code' => 'BG-001']))
        ->toThrow(\Illuminate\Database\QueryException::class);
});

test('business group code can be duplicated across different organizations', function () {
    $org1 = Organization::factory()->create();
    $org2 = Organization::factory()->create();

    $bg1 = BusinessGroup::factory()->forOrganization($org1)->create(['code' => 'BG-001']);
    $bg2 = BusinessGroup::factory()->forOrganization($org2)->create(['code' => 'BG-001']);

    expect($bg1->code)->toBe('BG-001')
        ->and($bg2->code)->toBe('BG-001')
        ->and($bg1->organization_id)->not->toBe($bg2->organization_id);
});

test('business group metadata is cast to array', function () {
    $businessGroup = BusinessGroup::factory()->create([
        'metadata' => ['industry' => 'Financial Services', 'country' => 'Mexico'],
    ]);

    expect($businessGroup->metadata)->toBeArray()
        ->and($businessGroup->metadata['industry'])->toBe('Financial Services');
});

test('business group uses soft deletes', function () {
    $businessGroup = BusinessGroup::factory()->create();
    $id = $businessGroup->id;

    $businessGroup->delete();

    expect(BusinessGroup::find($id))->toBeNull()
        ->and(BusinessGroup::withTrashed()->find($id))->not->toBeNull();
});

test('deleting organization cascades to business groups', function () {
    $organization = Organization::factory()->create();
    $businessGroup = BusinessGroup::factory()->forOrganization($organization)->create();
    $businessGroupId = $businessGroup->id;

    $organization->delete();

    expect(BusinessGroup::withTrashed()->find($businessGroupId))->toBeNull();
});
