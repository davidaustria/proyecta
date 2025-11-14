<?php

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
        return Inertia::render('customer-types/index');
    })->name('customer-types.index');

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
    Route::get('inflation-rates', function () {
        return Inertia::render('inflation-rates/index');
    })->name('inflation-rates.index');
});

require __DIR__.'/settings.php';
