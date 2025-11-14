<?php

namespace App\Observers;

use App\Models\Projection;

class ProjectionObserver
{
    /**
     * Handle the Projection "creating" event.
     *
     * Automatically calculate total_amount from subtotal and tax before creating.
     */
    public function creating(Projection $projection): void
    {
        $this->calculateTotals($projection);
    }

    /**
     * Handle the Projection "saving" event.
     *
     * Validate that totals are correct before saving.
     */
    public function saving(Projection $projection): void
    {
        $this->calculateTotals($projection);
        $this->validateTotals($projection);
    }

    /**
     * Calculate total_amount from subtotal and tax.
     *
     * @param  Projection  $projection  The projection
     */
    protected function calculateTotals(Projection $projection): void
    {
        if ($projection->total_subtotal !== null && $projection->total_tax !== null) {
            $projection->total_amount = round($projection->total_subtotal + $projection->total_tax, 2);
        }
    }

    /**
     * Validate that totals are consistent.
     *
     * @param  Projection  $projection  The projection
     *
     * @throws \InvalidArgumentException If totals don't match
     */
    protected function validateTotals(Projection $projection): void
    {
        if ($projection->total_subtotal === null || $projection->total_tax === null) {
            return;
        }

        $expectedTotal = round($projection->total_subtotal + $projection->total_tax, 2);
        $actualTotal = $projection->total_amount;

        if (abs($expectedTotal - $actualTotal) > 0.01) {
            throw new \InvalidArgumentException(
                "Projection total_amount ({$actualTotal}) does not match subtotal + tax ({$expectedTotal})"
            );
        }
    }

    /**
     * Handle the Projection "deleted" event.
     */
    public function deleted(Projection $projection): void
    {
        //
    }

    /**
     * Handle the Projection "restored" event.
     */
    public function restored(Projection $projection): void
    {
        //
    }

    /**
     * Handle the Projection "force deleted" event.
     */
    public function forceDeleted(Projection $projection): void
    {
        //
    }
}
