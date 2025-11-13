<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ImportBatch>
 */
class ImportBatchFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $totalRecords = fake()->numberBetween(10, 1000);
        $successfulRecords = fake()->numberBetween(0, $totalRecords);
        $failedRecords = $totalRecords - $successfulRecords;

        return [
            'user_id' => User::factory(),
            'filename' => fake()->word().'_invoices_'.fake()->date().'.csv',
            'source_system' => fake()->randomElement(['SAP', 'Oracle', 'Excel', 'QuickBooks', 'Manual']),
            'import_type' => fake()->randomElement(['invoices', 'customers', 'products']),
            'total_records' => $totalRecords,
            'successful_records' => $successfulRecords,
            'failed_records' => $failedRecords,
            'status' => fake()->randomElement(['pending', 'processing', 'completed', 'failed']),
            'started_at' => fake()->optional(0.8)->dateTimeBetween('-1 month', 'now'),
            'completed_at' => fake()->optional(0.7)->dateTimeBetween('-1 month', 'now'),
            'error_log' => $failedRecords > 0 ? fake()->optional(0.5)->passthrough([
                'errors' => [
                    ['line' => fake()->numberBetween(1, $totalRecords), 'message' => 'Invalid customer ID'],
                    ['line' => fake()->numberBetween(1, $totalRecords), 'message' => 'Missing required field: invoice_date'],
                ],
            ]) : null,
            'metadata' => fake()->optional(0.3)->passthrough([
                'file_size' => fake()->numberBetween(1024, 5242880),
                'encoding' => 'UTF-8',
            ]),
        ];
    }

    /**
     * Indicate that the import batch is completed.
     */
    public function completed(): static
    {
        return $this->state(function (array $attributes) {
            $startedAt = fake()->dateTimeBetween('-1 month', '-1 day');
            $completedAt = fake()->dateTimeBetween($startedAt, 'now');

            return [
                'status' => 'completed',
                'started_at' => $startedAt,
                'completed_at' => $completedAt,
            ];
        });
    }

    /**
     * Indicate that the import batch is pending.
     */
    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'pending',
            'started_at' => null,
            'completed_at' => null,
            'successful_records' => 0,
            'failed_records' => 0,
        ]);
    }

    /**
     * Indicate that the import batch failed.
     */
    public function failed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'failed',
            'failed_records' => $attributes['total_records'],
            'successful_records' => 0,
            'error_log' => [
                'error' => fake()->sentence(),
            ],
        ]);
    }
}
