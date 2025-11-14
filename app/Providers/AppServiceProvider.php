<?php

namespace App\Providers;

use App\Models\Projection;
use App\Models\ScenarioAssumption;
use App\Observers\ProjectionObserver;
use App\Observers\ScenarioAssumptionObserver;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Register model observers
        ScenarioAssumption::observe(ScenarioAssumptionObserver::class);
        Projection::observe(ProjectionObserver::class);
    }
}
