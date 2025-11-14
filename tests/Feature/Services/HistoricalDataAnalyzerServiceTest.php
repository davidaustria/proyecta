<?php

use App\Models\Customer;
use App\Models\CustomerType;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Product;
use App\Services\HistoricalDataAnalyzerService;
use Carbon\Carbon;

beforeEach(function () {
    $this->service = new HistoricalDataAnalyzerService;
});

test('calculates average monthly revenue correctly', function () {
    $customer = Customer::factory()->create();

    $startDate = Carbon::parse('2024-01-01');
    $endDate = Carbon::parse('2024-06-30');

    // Create 6 invoices, one per month
    Invoice::factory()->create([
        'customer_id' => $customer->id,
        'invoice_date' => '2024-01-15',
        'total' => 11600,
        'status' => 'paid',
    ]);

    Invoice::factory()->create([
        'customer_id' => $customer->id,
        'invoice_date' => '2024-02-15',
        'total' => 13920,
        'status' => 'issued',
    ]);

    Invoice::factory()->create([
        'customer_id' => $customer->id,
        'invoice_date' => '2024-03-15',
        'total' => 9280,
        'status' => 'paid',
    ]);

    Invoice::factory()->create([
        'customer_id' => $customer->id,
        'invoice_date' => '2024-04-15',
        'total' => 17400,
        'status' => 'paid',
    ]);

    Invoice::factory()->create([
        'customer_id' => $customer->id,
        'invoice_date' => '2024-05-15',
        'total' => 10440,
        'status' => 'issued',
    ]);

    Invoice::factory()->create([
        'customer_id' => $customer->id,
        'invoice_date' => '2024-06-15',
        'total' => 12760,
        'status' => 'paid',
    ]);

    // Total: 75400 / 6 months = 12566.67
    $average = $this->service->getAverageMonthlyRevenue($customer, $startDate, $endDate);

    expect($average)->toBe(12566.67);
});

test('excludes invoices outside date range', function () {
    $customer = Customer::factory()->create();

    $startDate = Carbon::parse('2024-03-01');
    $endDate = Carbon::parse('2024-05-31');

    // Invoices within range
    Invoice::factory()->create([
        'customer_id' => $customer->id,
        'invoice_date' => '2024-03-15',
        'total' => 12000,
        'status' => 'paid',
    ]);

    Invoice::factory()->create([
        'customer_id' => $customer->id,
        'invoice_date' => '2024-04-15',
        'total' => 15000,
        'status' => 'issued',
    ]);

    Invoice::factory()->create([
        'customer_id' => $customer->id,
        'invoice_date' => '2024-05-15',
        'total' => 18000,
        'status' => 'paid',
    ]);

    // Total: 45000 / 3 months = 15000
    $average = $this->service->getAverageMonthlyRevenue($customer, $startDate, $endDate);

    expect($average)->toBe(15000.0);
});

test('excludes cancelled and draft invoices from average', function () {
    $customer = Customer::factory()->create();

    $startDate = Carbon::parse('2024-01-01');
    $endDate = Carbon::parse('2024-03-31');

    // Valid invoices
    Invoice::factory()->create([
        'customer_id' => $customer->id,
        'invoice_date' => '2024-01-15',
        'total' => 10000,
        'status' => 'paid',
    ]);

    Invoice::factory()->create([
        'customer_id' => $customer->id,
        'invoice_date' => '2024-02-15',
        'total' => 12000,
        'status' => 'issued',
    ]);

    // Should be excluded
    Invoice::factory()->create([
        'customer_id' => $customer->id,
        'invoice_date' => '2024-03-15',
        'total' => 50000,
        'status' => 'cancelled',
    ]);

    // Total: 22000 / 3 months = 7333.33
    $average = $this->service->getAverageMonthlyRevenue($customer, $startDate, $endDate);

    expect($average)->toBe(7333.33);
});

test('returns 0 for customer with no invoices', function () {
    $customer = Customer::factory()->create();

    $startDate = Carbon::parse('2024-01-01');
    $endDate = Carbon::parse('2024-12-31');

    $average = $this->service->getAverageMonthlyRevenue($customer, $startDate, $endDate);

    expect($average)->toBe(0.0);
});

test('calculates revenue for specific customer and product', function () {
    $customer = Customer::factory()->create();
    $product = Product::factory()->create();

    $invoice1 = Invoice::factory()->create([
        'customer_id' => $customer->id,
        'invoice_date' => '2024-01-15',
        'status' => 'paid',
    ]);

    $invoice2 = Invoice::factory()->create([
        'customer_id' => $customer->id,
        'invoice_date' => '2024-02-15',
        'status' => 'issued',
    ]);

    InvoiceItem::factory()->create([
        'invoice_id' => $invoice1->id,
        'product_id' => $product->id,
        'total' => 1160,
    ]);

    InvoiceItem::factory()->create([
        'invoice_id' => $invoice2->id,
        'product_id' => $product->id,
        'total' => 1160,
    ]);

    $period = [
        'start' => Carbon::parse('2024-01-01'),
        'end' => Carbon::parse('2024-02-28'),
    ];

    $revenue = $this->service->getRevenueByProduct($customer, $product, $period);

    expect($revenue)->toBe(2320.0);
});

test('returns true when customer has sufficient historical data', function () {
    $customer = Customer::factory()->create();

    Invoice::factory()->create([
        'customer_id' => $customer->id,
        'invoice_date' => now()->subMonths(8),
        'status' => 'paid',
    ]);

    $result = $this->service->validateSufficientData($customer, 6);

    expect($result)->toBeTrue();
});

test('returns false when customer does not have sufficient data', function () {
    $customer = Customer::factory()->create();

    Invoice::factory()->create([
        'customer_id' => $customer->id,
        'invoice_date' => now()->subMonths(3),
        'status' => 'paid',
    ]);

    $result = $this->service->validateSufficientData($customer, 6);

    expect($result)->toBeFalse();
});

test('returns false when customer has no invoices', function () {
    $customer = Customer::factory()->create();

    $result = $this->service->validateSufficientData($customer, 6);

    expect($result)->toBeFalse();
});

test('aggregates invoices by year and month', function () {
    $customer = Customer::factory()->create();

    Invoice::factory()->create([
        'customer_id' => $customer->id,
        'invoice_date' => '2024-01-15',
        'subtotal' => 10000,
        'tax' => 1600,
        'total' => 11600,
        'status' => 'paid',
    ]);

    Invoice::factory()->create([
        'customer_id' => $customer->id,
        'invoice_date' => '2024-01-25',
        'subtotal' => 5000,
        'tax' => 800,
        'total' => 5800,
        'status' => 'issued',
    ]);

    Invoice::factory()->create([
        'customer_id' => $customer->id,
        'invoice_date' => '2024-02-10',
        'subtotal' => 8000,
        'tax' => 1280,
        'total' => 9280,
        'status' => 'paid',
    ]);

    $result = $this->service->aggregateInvoicesByPeriod();

    expect($result)->toHaveCount(2);
    expect($result[0]->year)->toBe(2024);
    expect($result[0]->month)->toBe(1);
    expect((float) $result[0]->total_subtotal)->toBe(15000.0);
    expect((float) $result[0]->total_amount)->toBe(17400.0);
    expect($result[0]->invoice_count)->toBe(2);
});

test('aggregates filters by customer type', function () {
    $customerType1 = CustomerType::factory()->create();
    $customerType2 = CustomerType::factory()->create();

    $customer1 = Customer::factory()->create([
        'customer_type_id' => $customerType1->id,
    ]);

    $customer2 = Customer::factory()->create([
        'customer_type_id' => $customerType2->id,
    ]);

    Invoice::factory()->create([
        'customer_id' => $customer1->id,
        'invoice_date' => '2024-01-15',
        'total' => 10000,
        'status' => 'paid',
    ]);

    Invoice::factory()->create([
        'customer_id' => $customer2->id,
        'invoice_date' => '2024-01-20',
        'total' => 20000,
        'status' => 'paid',
    ]);

    $result = $this->service->aggregateInvoicesByPeriod([
        'customer_type_id' => $customerType1->id,
    ]);

    expect($result)->toHaveCount(1);
    expect((float) $result[0]->total_amount)->toBe(10000.0);
});

test('aggregates excludes cancelled invoices', function () {
    $customer = Customer::factory()->create();

    Invoice::factory()->create([
        'customer_id' => $customer->id,
        'invoice_date' => '2024-01-15',
        'total' => 10000,
        'status' => 'paid',
    ]);

    Invoice::factory()->create([
        'customer_id' => $customer->id,
        'invoice_date' => '2024-01-20',
        'total' => 50000,
        'status' => 'cancelled',
    ]);

    $result = $this->service->aggregateInvoicesByPeriod();

    expect($result)->toHaveCount(1);
    expect((float) $result[0]->total_amount)->toBe(10000.0);
});

test('calculates positive growth rate', function () {
    $rate = $this->service->calculateGrowthRate(1000, 1200);
    expect($rate)->toBe(20.0);
});

test('calculates negative growth rate', function () {
    $rate = $this->service->calculateGrowthRate(1000, 800);
    expect($rate)->toBe(-20.0);
});

test('returns 0 growth for no change', function () {
    $rate = $this->service->calculateGrowthRate(1000, 1000);
    expect($rate)->toBe(0.0);
});

test('returns 0 growth when previous amount is 0', function () {
    $rate = $this->service->calculateGrowthRate(0, 1000);
    expect($rate)->toBe(0.0);
});
