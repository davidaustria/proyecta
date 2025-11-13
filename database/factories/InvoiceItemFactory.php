<?php

namespace Database\Factories;

use App\Models\Invoice;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\InvoiceItem>
 */
class InvoiceItemFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $quantity = fake()->randomFloat(2, 1, 100);
        $unitPrice = fake()->randomFloat(2, 100, 50000);
        $subtotal = round($quantity * $unitPrice, 2);
        $taxRate = 0.16;
        $tax = round($subtotal * $taxRate, 2);
        $total = $subtotal + $tax;

        return [
            'invoice_id' => Invoice::factory(),
            'product_id' => Product::factory(),
            'description' => fake()->sentence(6),
            'quantity' => $quantity,
            'unit_price' => $unitPrice,
            'subtotal' => $subtotal,
            'tax' => $tax,
            'total' => $total,
            'metadata' => fake()->optional(0.2)->passthrough([
                'discount_percentage' => fake()->randomFloat(2, 0, 20),
                'notes' => fake()->optional()->sentence(),
            ]),
        ];
    }

    /**
     * Indicate that the invoice item belongs to a specific invoice.
     */
    public function forInvoice(Invoice $invoice): static
    {
        return $this->state(fn (array $attributes) => [
            'invoice_id' => $invoice->id,
        ]);
    }

    /**
     * Indicate that the invoice item is for a specific product.
     */
    public function forProduct(Product $product): static
    {
        return $this->state(fn (array $attributes) => [
            'product_id' => $product->id,
        ]);
    }
}
