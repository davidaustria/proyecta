<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreScenarioRequest;
use App\Http\Requests\UpdateScenarioRequest;
use App\Http\Resources\ScenarioResource;
use App\Models\Scenario;
use App\Services\ProjectionCalculatorService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

class ScenarioController extends Controller
{
    public function __construct(
        protected ProjectionCalculatorService $projectionCalculator
    ) {}

    /**
     * Display a listing of scenarios.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Scenario::query()
            ->with('user')
            ->withCount(['assumptions', 'projections']);

        // Filters
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('is_baseline')) {
            $query->where('is_baseline', $request->boolean('is_baseline'));
        }

        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'created_at');
        $sortDir = $request->get('sort_dir', 'desc');
        $query->orderBy($sortBy, $sortDir);

        // Pagination
        $perPage = $request->get('per_page', 15);
        $scenarios = $query->paginate($perPage);

        return ScenarioResource::collection($scenarios);
    }

    /**
     * Store a newly created scenario.
     */
    public function store(StoreScenarioRequest $request): ScenarioResource
    {
        $scenario = Scenario::create($request->validated());

        $scenario->load('user')->loadCount(['assumptions', 'projections']);

        return new ScenarioResource($scenario);
    }

    /**
     * Display the specified scenario.
     */
    public function show(Scenario $scenario): ScenarioResource
    {
        $scenario->load([
            'user',
            'assumptions.customerType',
            'assumptions.businessGroup',
            'assumptions.customer',
            'assumptions.product',
        ])->loadCount(['assumptions', 'projections']);

        return new ScenarioResource($scenario);
    }

    /**
     * Update the specified scenario.
     */
    public function update(UpdateScenarioRequest $request, Scenario $scenario): ScenarioResource
    {
        $scenario->update($request->validated());

        $scenario->load('user')->loadCount(['assumptions', 'projections']);

        return new ScenarioResource($scenario);
    }

    /**
     * Remove the specified scenario.
     */
    public function destroy(Scenario $scenario): Response
    {
        $scenario->delete();

        return response()->noContent();
    }

    /**
     * Duplicate a scenario with all its assumptions.
     */
    public function duplicate(Request $request, Scenario $scenario): ScenarioResource
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'copy_assumptions' => ['boolean'],
            'copy_projections' => ['boolean'],
        ]);

        $newScenario = DB::transaction(function () use ($request, $scenario) {
            // Create new scenario
            $newScenario = $scenario->replicate();
            $newScenario->name = $request->name;
            $newScenario->user_id = auth()->id();
            $newScenario->status = 'draft';
            $newScenario->is_baseline = false;
            $newScenario->save();

            // Copy assumptions if requested
            if ($request->boolean('copy_assumptions', true)) {
                foreach ($scenario->assumptions as $assumption) {
                    $newAssumption = $assumption->replicate();
                    $newAssumption->scenario_id = $newScenario->id;
                    $newAssumption->save();
                }
            }

            // Note: Projections are typically NOT copied as they need to be recalculated
            // but we provide the option in case the user wants to preserve them
            if ($request->boolean('copy_projections', false)) {
                foreach ($scenario->projections as $projection) {
                    $newProjection = $projection->replicate();
                    $newProjection->scenario_id = $newScenario->id;
                    $newProjection->save();

                    // Copy projection details
                    foreach ($projection->details as $detail) {
                        $newDetail = $detail->replicate();
                        $newDetail->projection_id = $newProjection->id;
                        $newDetail->save();
                    }
                }
            }

            return $newScenario;
        });

        $newScenario->load('user')->loadCount(['assumptions', 'projections']);

        return new ScenarioResource($newScenario);
    }

    /**
     * Calculate projections for a scenario.
     */
    public function calculate(Scenario $scenario): Response
    {
        try {
            // Delete existing projections
            $scenario->projections()->each(fn ($projection) => $projection->forceDelete());

            // Calculate new projections
            $this->projectionCalculator->calculateForScenario($scenario);

            $scenario->loadCount('projections');

            return response()->json([
                'message' => 'Proyecciones calculadas exitosamente',
                'projections_count' => $scenario->projections_count,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al calcular proyecciones',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
