<?php

use App\Http\Controllers\Api\V1\ReportController;
use App\Http\Controllers\BusinessGroupController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\CustomerTypeController;
use App\Http\Controllers\ImportController;
use App\Http\Controllers\InflationRateController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProjectionComparisonController;
use App\Http\Controllers\ProjectionController;
use App\Http\Controllers\ScenarioAssumptionController;
use App\Http\Controllers\ScenarioController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::prefix('v1')->middleware(['auth:sanctum'])->group(function () {
    // Master Data Routes
    Route::apiResource('customers', CustomerController::class);
    Route::apiResource('customer-types', CustomerTypeController::class);
    Route::apiResource('business-groups', BusinessGroupController::class);
    Route::apiResource('products', ProductController::class);

    // Scenario Routes
    Route::apiResource('scenarios', ScenarioController::class);
    Route::post('scenarios/{scenario}/duplicate', [ScenarioController::class, 'duplicate'])->name('scenarios.duplicate');
    Route::post('scenarios/{scenario}/calculate', [ScenarioController::class, 'calculate'])->name('scenarios.calculate');

    // Scenario Assumption Routes
    Route::apiResource('scenario-assumptions', ScenarioAssumptionController::class);
    Route::post('scenario-assumptions/bulk', [ScenarioAssumptionController::class, 'bulkStore'])->name('scenario-assumptions.bulk-store');

    // Projection Routes
    Route::get('projections', [ProjectionController::class, 'index'])->name('projections.index');
    Route::get('projections/{projection}', [ProjectionController::class, 'show'])->name('projections.show');
    Route::post('projections/{projection}/recalculate', [ProjectionController::class, 'recalculate'])->name('projections.recalculate');

    // Projection Comparison Routes
    Route::post('projections/compare', [ProjectionComparisonController::class, 'compare'])->name('projections.compare');

    // Invoice Routes
    Route::get('invoices', [InvoiceController::class, 'index'])->name('invoices.index');
    Route::get('invoices/{invoice}', [InvoiceController::class, 'show'])->name('invoices.show');
    Route::get('invoices-stats', [InvoiceController::class, 'stats'])->name('invoices.stats');

    // Import Routes
    Route::post('imports/upload', [ImportController::class, 'upload'])->name('imports.upload');
    Route::post('imports/preview', [ImportController::class, 'preview'])->name('imports.preview');
    Route::post('imports/import', [ImportController::class, 'import'])->name('imports.import');
    Route::get('imports/history', [ImportController::class, 'history'])->name('imports.history');
    Route::get('imports/{batch}', [ImportController::class, 'show'])->name('imports.show');

    // Inflation Rate Routes
    Route::get('inflation-rates', [InflationRateController::class, 'index'])->name('inflation-rates.index');
    Route::post('inflation-rates', [InflationRateController::class, 'store'])->name('inflation-rates.store');
    Route::post('inflation-rates/bulk', [InflationRateController::class, 'bulkStore'])->name('inflation-rates.bulk-store');
    Route::delete('inflation-rates/{year}', [InflationRateController::class, 'destroy'])->name('inflation-rates.destroy');

    // Report Export Routes
    Route::get('reports/projections/{scenario}', [ReportController::class, 'exportProjections'])->name('reports.export-projections');
    Route::get('reports/comparison', [ReportController::class, 'exportComparison'])->name('reports.export-comparison');
    Route::get('reports/invoices', [ReportController::class, 'exportInvoices'])->name('reports.export-invoices');
});
