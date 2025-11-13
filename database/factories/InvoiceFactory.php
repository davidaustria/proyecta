<?php

namespace Database\Factories;

use App\Models\Customer;
use App\Models\ImportBatch;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Invoice>
 */
class InvoiceFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $invoiceDate = fake()->dateTimeBetween('-2 years', 'now');
        $dueDate = fake()->optional(0.8)->passthrough(
            fake()->dateTimeBetween($invoiceDate, '+60 days')
        );

        $subtotal = fake()->randomFloat(2, 5000, 500000);
        $taxRate = 0.16;
        $tax = round($subtotal * $taxRate, 2);
        $total = $subtotal + $tax;

        return [
            'import_batch_id' => fake()->optional(0.7)->passthrough(ImportBatch::factory()),
            'customer_id' => Customer::factory(),
            'invoice_number' => strtoupper(fake()->unique()->bothify('INV-####-????')),
            'invoice_date' => $invoiceDate,
            'due_date' => $dueDate,
            'subtotal' => $subtotal,
            'tax' => $tax,
            'total' => $total,
            'currency' => fake()->randomElement(['MXN', 'USD', 'EUR']),
            'exchange_rate' => fake()->randomFloat(4, 0.9, 1.1),
            'status' => fake()->randomElement(['draft', 'issued', 'paid', 'cancelled']),
            'source_system' => fake()->randomElement(['SAP', 'Oracle', 'Manual', 'QuickBooks', null]),
            'external_id' => fake()->optional(0.6)->bothify('EXT-#####'),
            'metadata' => fake()->optional(0.3)->passthrough([
                'payment_terms' => fake()->randomElement(['Net 30', 'Net 45', 'Net 60', 'Due on receipt']),
                'purchase_order' => fake()->bothify('PO-####'),
            ]),
        ];
    }

    /**
     * Indicate that the invoice is paid.
     */
    public function paid(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'paid',
        ]);
    }

    /**
     * Indicate that the invoice is cancelled.
     */
    public function cancelled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'cancelled',
        ]);
    }

    /**
     * Indicate that the invoice is a draft.
     */
    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'draft',
        ]);
    }

    /**
     * Indicate that the invoice belongs to a specific customer.
     */
    public function forCustomer(Customer $customer): static
    {
        return $this->state(fn (array $attributes) => [
            'customer_id' => $customer->id,
        ]);
    }

    /**
     * Indicate that the invoice is from a specific date range.
     */
    public function inDateRange(string $startDate, string $endDate): static
    {
        return $this->state(function (array $attributes) use ($startDate, $endDate) {
            $invoiceDate = fake()->dateTimeBetween($startDate, $endDate);

            return [
                'invoice_date' => $invoiceDate,
                'due_date' => fake()->dateTimeBetween($invoiceDate, '+60 days'),
            ];
        });
    }
}
