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
        $query = \App\Models\Scenario::query()
            ->with('user')
            ->withCount(['assumptions', 'projections'])
            ->orderBy('created_at', 'desc');

        // Search filter
        if (request('search')) {
            $search = request('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Status filter
        if (request('status')) {
            $query->where('status', request('status'));
        }

        // Baseline filter
        if (request('baseline') !== null && request('baseline') !== 'all') {
            $query->where('is_baseline', request('baseline'));
        }

        // User filter
        if (request('user')) {
            $query->where('user_id', request('user'));
        }

        return Inertia::render('scenarios/index', [
            'scenarios' => $query->paginate(15),
            'users' => \App\Models\User::orderBy('name')->get(['id', 'name']),
            'filters' => [
                'search' => request('search'),
                'status' => request('status'),
                'baseline' => request('baseline'),
                'user' => request('user'),
            ],
        ]);
    })->name('web.scenarios.index');

    Route::get('scenarios/create', function () {
        return Inertia::render('scenarios/create');
    })->name('web.scenarios.create');

    Route::get('scenarios/{scenario}/edit', function (\App\Models\Scenario $scenario) {
        return Inertia::render('scenarios/[id]/edit', [
            'scenario' => $scenario,
        ]);
    })->name('web.scenarios.edit');

    // Master Data
    Route::get('customers', function () {
        $query = \App\Models\Customer::query()
            ->with(['customerType', 'businessGroup'])
            ->orderBy('name');

        // Search filter
        if (request('search')) {
            $search = request('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('tax_id', 'like', "%{$search}%");
            });
        }

        // Type filter
        if (request('type')) {
            $query->where('customer_type_id', request('type'));
        }

        // Business group filter
        if (request('group')) {
            $query->where('business_group_id', request('group'));
        }

        // Active status filter
        if (request('active') !== null && request('active') !== 'all') {
            $query->where('is_active', request('active'));
        }

        return Inertia::render('customers/index', [
            'customers' => $query->paginate(15),
            'customerTypes' => \App\Models\CustomerType::orderBy('name')->get(),
            'businessGroups' => \App\Models\BusinessGroup::orderBy('name')->get(),
            'filters' => [
                'search' => request('search'),
                'type' => request('type'),
                'group' => request('group'),
                'active' => request('active'),
            ],
        ]);
    })->name('web.customers.index');

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
    })->name('web.customer-types.index');

    Route::get('customer-types/create', function () {
        return Inertia::render('customer-types/create');
    })->name('web.customer-types.create');

    Route::get('customer-types/{customerType}/edit', function (CustomerType $customerType) {
        return Inertia::render('customer-types/[id]/edit', [
            'customerType' => $customerType,
        ]);
    })->name('web.customer-types.edit');

    Route::get('business-groups', function () {
        $query = \App\Models\BusinessGroup::query()->orderBy('name');

        if (request('search')) {
            $search = request('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            });
        }

        return Inertia::render('business-groups/index', [
            'businessGroups' => $query->paginate(15),
            'filters' => [
                'search' => request('search'),
            ],
        ]);
    })->name('web.business-groups.index');

    Route::get('products', function () {
        $query = \App\Models\Product::query()->orderBy('name');

        if (request('search')) {
            $search = request('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            });
        }

        if (request('active') !== null && request('active') !== 'all') {
            $query->where('is_active', request('active'));
        }

        return Inertia::render('products/index', [
            'products' => $query->paginate(15),
            'filters' => [
                'search' => request('search'),
                'active' => request('active'),
            ],
        ]);
    })->name('web.products.index');

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
    })->name('web.inflation-rates.index');

    // Inflation Rates Management (Session-authenticated endpoints for Inertia)
    Route::post('api/inflation-rates', [\App\Http\Controllers\InflationRateController::class, 'store']);
    Route::delete('api/inflation-rates/{year}', [\App\Http\Controllers\InflationRateController::class, 'destroy']);
});

require __DIR__.'/settings.php';
