<?php

namespace App\Http\Controllers;

use App\Models\InflationRate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

class InflationRateController extends Controller
{
    /**
     * Display a listing of inflation rates.
     */
    public function index(Request $request): JsonResponse
    {
        $query = InflationRate::query();

        // Filter by year range
        if ($request->has('year_from')) {
            $query->where('year', '>=', $request->year_from);
        }

        if ($request->has('year_to')) {
            $query->where('year', '<=', $request->year_to);
        }

        // Filter by estimated flag
        if ($request->has('is_estimated')) {
            $query->where('is_estimated', $request->boolean('is_estimated'));
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'year');
        $sortDir = $request->get('sort_dir', 'asc');
        $query->orderBy($sortBy, $sortDir);

        $rates = $query->get();

        return response()->json([
            'data' => $rates->map(fn ($rate) => [
                'id' => $rate->id,
                'year' => $rate->year,
                'rate' => (float) $rate->rate,
                'is_estimated' => $rate->is_estimated,
                'source' => $rate->source,
                'notes' => $rate->notes,
                'created_at' => $rate->created_at,
                'updated_at' => $rate->updated_at,
            ]),
        ]);
    }

    /**
     * Store or update an inflation rate.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'year' => ['required', 'integer', 'min:2000', 'max:2100'],
            'rate' => ['required', 'numeric', 'min:-100', 'max:1000'],
            'is_estimated' => ['boolean'],
            'source' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $rate = InflationRate::updateOrCreate(
            ['year' => $validated['year']],
            $validated
        );

        return response()->json([
            'message' => 'Tasa de inflación guardada exitosamente',
            'data' => [
                'id' => $rate->id,
                'year' => $rate->year,
                'rate' => (float) $rate->rate,
                'is_estimated' => $rate->is_estimated,
                'source' => $rate->source,
                'notes' => $rate->notes,
                'created_at' => $rate->created_at,
                'updated_at' => $rate->updated_at,
            ],
        ]);
    }

    /**
     * Bulk store or update multiple inflation rates.
     */
    public function bulkStore(Request $request): JsonResponse
    {
        $request->validate([
            'rates' => ['required', 'array', 'min:1'],
            'rates.*.year' => ['required', 'integer', 'min:2000', 'max:2100'],
            'rates.*.rate' => ['required', 'numeric', 'min:-100', 'max:1000'],
            'rates.*.is_estimated' => ['boolean'],
            'rates.*.source' => ['nullable', 'string', 'max:255'],
            'rates.*.notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $savedRates = [];

        DB::transaction(function () use ($request, &$savedRates) {
            foreach ($request->rates as $rateData) {
                $savedRates[] = InflationRate::updateOrCreate(
                    ['year' => $rateData['year']],
                    $rateData
                );
            }
        });

        return response()->json([
            'message' => 'Tasas de inflación guardadas exitosamente',
            'count' => count($savedRates),
            'data' => collect($savedRates)->map(fn ($rate) => [
                'id' => $rate->id,
                'year' => $rate->year,
                'rate' => (float) $rate->rate,
                'is_estimated' => $rate->is_estimated,
                'source' => $rate->source,
                'notes' => $rate->notes,
            ]),
        ]);
    }

    /**
     * Remove an inflation rate.
     */
    public function destroy(int $year): Response
    {
        InflationRate::where('year', $year)->delete();

        return response()->noContent();
    }
}
