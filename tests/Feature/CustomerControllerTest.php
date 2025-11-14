<?php

use App\Models\BusinessGroup;
use App\Models\Customer;
use App\Models\CustomerType;
use App\Models\Organization;
use App\Models\User;
use function Pest\Laravel\{actingAs, assertDatabaseHas, assertDatabaseMissing, deleteJson, getJson, postJson, putJson};

beforeEach(function () {
    $this->organization = Organization::factory()->create();
    $this->user = User::factory()->create(['organization_id' => $this->organization->id]);
    $this->customerType = CustomerType::factory()->create(['organization_id' => $this->organization->id]);
    $this->businessGroup = BusinessGroup::factory()->create(['organization_id' => $this->organization->id]);

    actingAs($this->user);
});

it('can list customers', function () {
    Customer::factory()->count(5)->create([
        'organization_id' => $this->organization->id,
        'customer_type_id' => $this->customerType->id,
    ]);

    $response = getJson('/api/v1/customers');

    $response->assertSuccessful();
    $response->assertJsonCount(5, 'data');
});

it('can filter customers by customer type', function () {
    $otherCustomerType = CustomerType::factory()->create(['organization_id' => $this->organization->id]);

    Customer::factory()->count(3)->create([
        'organization_id' => $this->organization->id,
        'customer_type_id' => $this->customerType->id,
    ]);

    Customer::factory()->count(2)->create([
        'organization_id' => $this->organization->id,
        'customer_type_id' => $otherCustomerType->id,
    ]);

    $response = getJson('/api/v1/customers?customer_type_id='.$this->customerType->id);

    $response->assertSuccessful();
    $response->assertJsonCount(3, 'data');
});

it('can create a customer', function () {
    $customerData = [
        'name' => 'Test Customer',
        'code' => 'TST001',
        'tax_id' => 'RFC123456',
        'customer_type_id' => $this->customerType->id,
        'business_group_id' => $this->businessGroup->id,
        'is_active' => true,
    ];

    $response = postJson('/api/v1/customers', $customerData);

    $response->assertCreated();
    $response->assertJsonPath('data.name', 'Test Customer');
    $response->assertJsonPath('data.code', 'TST001');

    assertDatabaseHas('customers', [
        'name' => 'Test Customer',
        'code' => 'TST001',
        'organization_id' => $this->organization->id,
    ]);
});

it('validates required fields when creating customer', function () {
    $response = postJson('/api/v1/customers', []);

    $response->assertUnprocessable();
    $response->assertJsonValidationErrors(['name', 'code', 'customer_type_id']);
});

it('validates unique customer code within organization', function () {
    Customer::factory()->create([
        'organization_id' => $this->organization->id,
        'code' => 'DUPLICATE',
        'customer_type_id' => $this->customerType->id,
    ]);

    $response = postJson('/api/v1/customers', [
        'name' => 'Test Customer',
        'code' => 'DUPLICATE',
        'customer_type_id' => $this->customerType->id,
    ]);

    $response->assertUnprocessable();
    $response->assertJsonValidationErrors(['code']);
});

it('can show a customer', function () {
    $customer = Customer::factory()->create([
        'organization_id' => $this->organization->id,
        'customer_type_id' => $this->customerType->id,
    ]);

    $response = getJson('/api/v1/customers/'.$customer->id);

    $response->assertSuccessful();
    $response->assertJsonPath('data.id', $customer->id);
    $response->assertJsonPath('data.name', $customer->name);
});

it('can update a customer', function () {
    $customer = Customer::factory()->create([
        'organization_id' => $this->organization->id,
        'customer_type_id' => $this->customerType->id,
    ]);

    $response = putJson('/api/v1/customers/'.$customer->id, [
        'name' => 'Updated Name',
    ]);

    $response->assertSuccessful();
    $response->assertJsonPath('data.name', 'Updated Name');

    assertDatabaseHas('customers', [
        'id' => $customer->id,
        'name' => 'Updated Name',
    ]);
});

it('can delete a customer', function () {
    $customer = Customer::factory()->create([
        'organization_id' => $this->organization->id,
        'customer_type_id' => $this->customerType->id,
    ]);

    $response = deleteJson('/api/v1/customers/'.$customer->id);

    $response->assertNoContent();

    assertDatabaseMissing('customers', [
        'id' => $customer->id,
        'deleted_at' => null,
    ]);
});

it('can search customers by name or code', function () {
    Customer::factory()->create([
        'organization_id' => $this->organization->id,
        'customer_type_id' => $this->customerType->id,
        'name' => 'Searchable Customer',
        'code' => 'SEARCH01',
    ]);

    Customer::factory()->create([
        'organization_id' => $this->organization->id,
        'customer_type_id' => $this->customerType->id,
        'name' => 'Other Customer',
        'code' => 'OTHER01',
    ]);

    $response = getJson('/api/v1/customers?search=Searchable');

    $response->assertSuccessful();
    $response->assertJsonCount(1, 'data');
    $response->assertJsonPath('data.0.name', 'Searchable Customer');
});
