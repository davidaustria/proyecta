<?php

use App\Models\BusinessGroup;
use App\Models\Customer;
use App\Models\CustomerType;
use App\Models\Organization;
use App\Models\Product;
use App\Models\Scenario;
use App\Models\User;

test('organization can be created with required fields', function () {
    $organization = Organization::factory()->create([
        'name' => 'Test Organization',
        'slug' => 'test-org',
    ]);

    expect($organization)->toBeInstanceOf(Organization::class)
        ->and($organization->name)->toBe('Test Organization')
        ->and($organization->slug)->toBe('test-org')
        ->and($organization->is_active)->toBeTrue();
});

test('organization has many business groups relationship', function () {
    $organization = Organization::factory()->create();
    $businessGroups = BusinessGroup::factory()->count(3)->forOrganization($organization)->create();

    expect($organization->businessGroups)->toHaveCount(3)
        ->and($organization->businessGroups->first())->toBeInstanceOf(BusinessGroup::class);
});

test('organization has many customer types relationship', function () {
    $organization = Organization::factory()->create();
    $customerTypes = CustomerType::factory()->count(3)->forOrganization($organization)->create();

    expect($organization->customerTypes)->toHaveCount(3)
        ->and($organization->customerTypes->first())->toBeInstanceOf(CustomerType::class);
});

test('organization has many customers relationship', function () {
    $organization = Organization::factory()->create();
    $customers = Customer::factory()->count(5)->forOrganization($organization)->create();

    expect($organization->customers)->toHaveCount(5)
        ->and($organization->customers->first())->toBeInstanceOf(Customer::class);
});

test('organization has many products relationship', function () {
    $organization = Organization::factory()->create();
    $products = Product::factory()->count(4)->forOrganization($organization)->create();

    expect($organization->products)->toHaveCount(4)
        ->and($organization->products->first())->toBeInstanceOf(Product::class);
});

test('organization has many scenarios relationship', function () {
    $organization = Organization::factory()->create();
    $scenarios = Scenario::factory()->count(3)->forOrganization($organization)->create();

    expect($organization->scenarios)->toHaveCount(3)
        ->and($organization->scenarios->first())->toBeInstanceOf(Scenario::class);
});

test('organization belongs to many users relationship', function () {
    $organization = Organization::factory()->create();
    $users = User::factory()->count(3)->create();

    $organization->users()->attach($users->pluck('id'));

    expect($organization->users)->toHaveCount(3)
        ->and($organization->users->first())->toBeInstanceOf(User::class);
});

test('organization slug must be unique', function () {
    Organization::factory()->create(['slug' => 'unique-slug']);

    expect(fn () => Organization::factory()->create(['slug' => 'unique-slug']))
        ->toThrow(\Illuminate\Database\QueryException::class);
});

test('organization domain must be unique when provided', function () {
    Organization::factory()->create(['domain' => 'example.com']);

    expect(fn () => Organization::factory()->create(['domain' => 'example.com']))
        ->toThrow(\Illuminate\Database\QueryException::class);
});

test('organization can have null domain', function () {
    $org1 = Organization::factory()->create(['domain' => null]);
    $org2 = Organization::factory()->create(['domain' => null]);

    expect($org1->domain)->toBeNull()
        ->and($org2->domain)->toBeNull();
});

test('organization settings are cast to array', function () {
    $organization = Organization::factory()->create([
        'settings' => ['timezone' => 'America/Mexico_City', 'currency' => 'MXN'],
    ]);

    expect($organization->settings)->toBeArray()
        ->and($organization->settings['timezone'])->toBe('America/Mexico_City')
        ->and($organization->settings['currency'])->toBe('MXN');
});

test('organization uses soft deletes', function () {
    $organization = Organization::factory()->create();
    $organizationId = $organization->id;

    $organization->delete();

    expect(Organization::find($organizationId))->toBeNull()
        ->and(Organization::withTrashed()->find($organizationId))->not->toBeNull()
        ->and(Organization::withTrashed()->find($organizationId)->deleted_at)->not->toBeNull();
});
