<?php

use App\Models\Customer;
use App\Models\ImportBatch;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Product;

test('invoice belongs to customer', function () {
    $customer = Customer::factory()->create();
    $invoice = Invoice::factory()->forCustomer($customer)->create();

    expect($invoice->customer)->toBeInstanceOf(Customer::class)
        ->and($invoice->customer->id)->toBe($customer->id);
});

test('invoice can belong to import batch', function () {
    $importBatch = ImportBatch::factory()->create();
    $invoice = Invoice::factory()->create(['import_batch_id' => $importBatch->id]);

    expect($invoice->importBatch)->toBeInstanceOf(ImportBatch::class)
        ->and($invoice->importBatch->id)->toBe($importBatch->id);
});

test('invoice has many invoice items', function () {
    $invoice = Invoice::factory()->create();
    InvoiceItem::factory()->count(5)->forInvoice($invoice)->create();

    expect($invoice->items)->toHaveCount(5)
        ->and($invoice->items->first())->toBeInstanceOf(InvoiceItem::class);
});

test('invoice number must be unique', function () {
    Invoice::factory()->create(['invoice_number' => 'INV-2024-001']);

    expect(fn () => Invoice::factory()->create(['invoice_number' => 'INV-2024-001']))
        ->toThrow(\Illuminate\Database\QueryException::class);
});

test('deleting invoice cascades to invoice items', function () {
    $invoice = Invoice::factory()->create();
    $item = InvoiceItem::factory()->forInvoice($invoice)->create();
    $itemId = $item->id;

    $invoice->delete();

    expect(InvoiceItem::find($itemId))->toBeNull();
});

test('customer cannot be deleted if invoices exist', function () {
    $customer = Customer::factory()->create();
    Invoice::factory()->forCustomer($customer)->create();

    expect(fn () => $customer->delete())
        ->toThrow(\Illuminate\Database\QueryException::class);
});

test('invoice item belongs to product', function () {
    $product = Product::factory()->create();
    $item = InvoiceItem::factory()->forProduct($product)->create();

    expect($item->product)->toBeInstanceOf(Product::class)
        ->and($item->product->id)->toBe($product->id);
});

test('product cannot be deleted if invoice items exist', function () {
    $product = Product::factory()->create();
    InvoiceItem::factory()->forProduct($product)->create();

    expect(fn () => $product->delete())
        ->toThrow(\Illuminate\Database\QueryException::class);
});
