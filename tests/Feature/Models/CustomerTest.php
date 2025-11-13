<?php

use App\Models\BusinessGroup;
use App\Models\Customer;
use App\Models\CustomerType;
use App\Models\Invoice;
use App\Models\Organization;

test('customer belongs to organization', function () {
    $organization = Organization::factory()->create();
    $customer = Customer::factory()->forOrganization($organization)->create();

    expect($customer->organization)->toBeInstanceOf(Organization::class)
        ->and($customer->organization->id)->toBe($organization->id);
});

test('customer belongs to customer type', function () {
    $customerType = CustomerType::factory()->create();
    $customer = Customer::factory()->ofType($customerType)->create();

    expect($customer->customerType)->toBeInstanceOf(CustomerType::class)
        ->and($customer->customerType->id)->toBe($customerType->id);
});

test('customer can belong to business group', function () {
    $businessGroup = BusinessGroup::factory()->create();
    $customer = Customer::factory()->forBusinessGroup($businessGroup)->create();

    expect($customer->businessGroup)->toBeInstanceOf(BusinessGroup::class)
        ->and($customer->businessGroup->id)->toBe($businessGroup->id);
});

test('customer business group is nullable', function () {
    $customer = Customer::factory()->create(['business_group_id' => null]);

    expect($customer->business_group_id)->toBeNull()
        ->and($customer->businessGroup)->toBeNull();
});

test('customer has many invoices', function () {
    $customer = Customer::factory()->create();
    Invoice::factory()->count(10)->forCustomer($customer)->create();

    expect($customer->invoices)->toHaveCount(10)
        ->and($customer->invoices->first())->toBeInstanceOf(Invoice::class);
});

test('customer code must be unique per organization', function () {
    $organization = Organization::factory()->create();

    Customer::factory()->forOrganization($organization)->create(['code' => 'CUST-001']);

    expect(fn () => Customer::factory()->forOrganization($organization)->create(['code' => 'CUST-001']))
        ->toThrow(\Illuminate\Database\QueryException::class);
});

test('customer code can be duplicated across organizations', function () {
    $org1 = Organization::factory()->create();
    $org2 = Organization::factory()->create();

    $customer1 = Customer::factory()->forOrganization($org1)->create(['code' => 'CUST-001']);
    $customer2 = Customer::factory()->forOrganization($org2)->create(['code' => 'CUST-001']);

    expect($customer1->code)->toBe('CUST-001')
        ->and($customer2->code)->toBe('CUST-001')
        ->and($customer1->organization_id)->not->toBe($customer2->organization_id);
});

test('customer uses soft deletes', function () {
    $customer = Customer::factory()->create();
    $id = $customer->id;

    $customer->delete();

    expect(Customer::find($id))->toBeNull()
        ->and(Customer::withTrashed()->find($id))->not->toBeNull();
});

test('deleting business group sets customer business_group_id to null', function () {
    $businessGroup = BusinessGroup::factory()->create();
    $customer = Customer::factory()->forBusinessGroup($businessGroup)->create();

    $businessGroup->delete();

    $customer->refresh();

    expect($customer->business_group_id)->toBeNull();
});

test('customer type cannot be deleted if customers exist', function () {
    $customerType = CustomerType::factory()->create();
    Customer::factory()->ofType($customerType)->create();

    expect(fn () => $customerType->delete())
        ->toThrow(\Illuminate\Database\QueryException::class);
});
