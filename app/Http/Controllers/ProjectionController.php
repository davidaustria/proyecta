<?php

namespace App\Http\Controllers;

use App\Http\Resources\ProjectionResource;
use App\Models\Projection;
use App\Services\ProjectionCalculatorService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class ProjectionController extends Controller
{
    public function __construct(
        protected ProjectionCalculatorService $projectionCalculator
    ) {}

    /**
     * Display a listing of projections.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Projection::query()
            ->with([
                'scenario',
                'customerType',
                'businessGroup',
                'customer',
                'product',
            ]);

        // Filter by scenario
        if ($request->has('scenario_id')) {
            $query->where('scenario_id', $request->scenario_id);
        }

        // Filter by year
        if ($request->has('year')) {
            $query->where('year', $request->year);
        }

        // Filter by dimensions
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
        $projections = $query->paginate($perPage);

        return ProjectionResource::collection($projections);
    }

    /**
     * Display the specified projection with monthly breakdown.
     */
    public function show(Projection $projection): ProjectionResource
    {
        $projection->load([
            'scenario',
            'customerType',
            'businessGroup',
            'customer',
            'product',
            'details',
        ]);

        return new ProjectionResource($projection);
    }

    /**
     * Recalculate a specific projection.
     */
    public function recalculate(Projection $projection): ProjectionResource
    {
        try {
            // Delete existing projection details
            $projection->details()->delete();

            // Delete the projection itself
            $projection->forceDelete();

            // Recalculate for this specific projection
            // This would require refactoring the calculator service to handle single projections
            // For now, we'll recalculate the entire scenario
            $this->projectionCalculator->calculateForScenario($projection->scenario);

            // Reload the projection (it will have a new ID)
            $newProjection = Projection::where('scenario_id', $projection->scenario_id)
                ->where('year', $projection->year)
                ->where('customer_type_id', $projection->customer_type_id)
                ->where('business_group_id', $projection->business_group_id)
                ->where('customer_id', $projection->customer_id)
                ->where('product_id', $projection->product_id)
                ->with(['scenario', 'customerType', 'businessGroup', 'customer', 'product', 'details'])
                ->firstOrFail();

            return new ProjectionResource($newProjection);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al recalcular proyección',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
