<?php

namespace App\Observers;

use App\Models\ScenarioAssumption;

class ScenarioAssumptionObserver
{
    /**
     * Handle the ScenarioAssumption "created" event.
     */
    public function created(ScenarioAssumption $scenarioAssumption): void
    {
        //
    }

    /**
     * Handle the ScenarioAssumption "updated" event.
     *
     * When an assumption is updated, we invalidate (soft delete) all projections
     * for the affected scenario to ensure they are recalculated with the new assumptions.
     */
    public function updated(ScenarioAssumption $scenarioAssumption): void
    {
        $this->invalidateProjections($scenarioAssumption);
    }

    /**
     * Handle the ScenarioAssumption "deleted" event.
     *
     * When an assumption is deleted, we invalidate (soft delete) all projections
     * for the affected scenario.
     */
    public function deleted(ScenarioAssumption $scenarioAssumption): void
    {
        $this->invalidateProjections($scenarioAssumption);
    }

    /**
     * Invalidate projections affected by assumption changes.
     *
     * @param  ScenarioAssumption  $scenarioAssumption  The changed assumption
     */
    protected function invalidateProjections(ScenarioAssumption $scenarioAssumption): void
    {
        // Soft delete all projections for this scenario
        // This ensures they will be recalculated with the new assumptions
        $scenarioAssumption->scenario->projections()->delete();
    }

    /**
     * Handle the ScenarioAssumption "restored" event.
     */
    public function restored(ScenarioAssumption $scenarioAssumption): void
    {
        //
    }

    /**
     * Handle the ScenarioAssumption "force deleted" event.
     */
    public function forceDeleted(ScenarioAssumption $scenarioAssumption): void
    {
        //
    }
}
