<?php

use App\Models\CustomerType;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    // Scenarios
    Route::get('scenarios', function () {
        return Inertia::render('scenarios/index');
    })->name('scenarios.index');

    // Master Data
    Route::get('customers', function () {
        return Inertia::render('customers/index');
    })->name('customers.index');

    Route::get('customer-types', function () {
        $query = CustomerType::query()->orderBy('name');

        if (request('search')) {
            $search = request('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            });
        }

        return Inertia::render('customer-types/index', [
            'customerTypes' => $query->paginate(15),
            'filters' => [
                'search' => request('search'),
            ],
        ]);
    })->name('customer-types.index');

    Route::get('customer-types/create', function () {
        return Inertia::render('customer-types/create');
    })->name('customer-types.create');

    Route::get('customer-types/{customerType}/edit', function (CustomerType $customerType) {
        return Inertia::render('customer-types/[id]/edit', [
            'customerType' => $customerType,
        ]);
    })->name('customer-types.edit');

    Route::get('business-groups', function () {
        return Inertia::render('business-groups/index');
    })->name('business-groups.index');

    Route::get('products', function () {
        return Inertia::render('products/index');
    })->name('products.index');

    // Import
    Route::get('import', function () {
        return Inertia::render('import/index');
    })->name('import.index');

    // Configuration
    Route::get('settings/inflation-rates', function () {
        $inflationRates = \App\Models\InflationRate::orderBy('year', 'desc')->get();

        return Inertia::render('settings/inflation-rates', [
            'inflationRates' => $inflationRates,
        ]);
    })->name('inflation-rates.index');

    // Inflation Rates Management (Session-authenticated endpoints for Inertia)
    Route::post('api/inflation-rates', [\App\Http\Controllers\InflationRateController::class, 'store']);
    Route::delete('api/inflation-rates/{year}', [\App\Http\Controllers\InflationRateController::class, 'destroy']);
});

require __DIR__.'/settings.php';
