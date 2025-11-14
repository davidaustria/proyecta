<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreScenarioAssumptionRequest;
use App\Http\Requests\UpdateScenarioAssumptionRequest;
use App\Http\Resources\ScenarioAssumptionResource;
use App\Models\Scenario;
use App\Models\ScenarioAssumption;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

class ScenarioAssumptionController extends Controller
{
    /**
     * Display a listing of assumptions for a scenario.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = ScenarioAssumption::query()
            ->with(['customerType', 'businessGroup', 'customer', 'product']);

        // Filter by scenario
        if ($request->has('scenario_id')) {
            $query->where('scenario_id', $request->scenario_id);
        }

        // Filter by year
        if ($request->has('year')) {
            $query->where('year', $request->year);
        }

        // Filter by dimension
        if ($request->has('customer_type_id')) {
            $query->where('customer_type_id', $request->customer_type_id);
        }

        if ($request->has('business_group_id')) {
            $query->where('business_group_id', $request->business_group_id);
        }

        if ($request->has('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        if ($request->has('product_id')) {
            $query->where('product_id', $request->product_id);
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'year');
        $sortDir = $request->get('sort_dir', 'asc');
        $query->orderBy($sortBy, $sortDir);

        // Pagination
        $perPage = $request->get('per_page', 50);
        $assumptions = $query->paginate($perPage);

        return ScenarioAssumptionResource::collection($assumptions);
    }

    /**
     * Store a newly created assumption.
     */
    public function store(StoreScenarioAssumptionRequest $request): ScenarioAssumptionResource
    {
        $assumption = ScenarioAssumption::create($request->validated());

        $assumption->load(['customerType', 'businessGroup', 'customer', 'product']);

        return new ScenarioAssumptionResource($assumption);
    }

    /**
     * Display the specified assumption.
     */
    public function show(ScenarioAssumption $assumption): ScenarioAssumptionResource
    {
        $assumption->load(['customerType', 'businessGroup', 'customer', 'product']);

        return new ScenarioAssumptionResource($assumption);
    }

    /**
     * Update the specified assumption.
     */
    public function update(UpdateScenarioAssumptionRequest $request, ScenarioAssumption $assumption): ScenarioAssumptionResource
    {
        $assumption->update($request->validated());

        $assumption->load(['customerType', 'businessGroup', 'customer', 'product']);

        return new ScenarioAssumptionResource($assumption);
    }

    /**
     * Remove the specified assumption.
     */
    public function destroy(ScenarioAssumption $assumption): Response
    {
        $assumption->delete();

        return response()->noContent();
    }

    /**
     * Bulk store multiple assumptions at once.
     */
    public function bulkStore(Request $request): Response
    {
        $request->validate([
            'assumptions' => ['required', 'array', 'min:1'],
            'assumptions.*.scenario_id' => ['required', 'integer', 'exists:scenarios,id'],
            'assumptions.*.year' => ['required', 'integer', 'min:2000', 'max:2100'],
            'assumptions.*.growth_rate' => ['nullable', 'numeric', 'min:-100', 'max:1000'],
            'assumptions.*.inflation_rate' => ['nullable', 'numeric', 'min:-100', 'max:1000'],
            'assumptions.*.adjustment_type' => ['required', 'string', 'in:percentage,fixed_amount'],
            'assumptions.*.fixed_amount' => ['nullable', 'numeric'],
            'assumptions.*.seasonality_factors' => ['nullable', 'array', 'size:12'],
        ]);

        $created = [];

        DB::transaction(function () use ($request, &$created) {
            foreach ($request->assumptions as $assumptionData) {
                $created[] = ScenarioAssumption::create($assumptionData);
            }
        });

        return response()->json([
            'message' => 'Supuestos creados exitosamente',
            'count' => count($created),
            'assumptions' => ScenarioAssumptionResource::collection($created),
        ], 201);
    }
}
