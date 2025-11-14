<?php

namespace App\Http\Controllers;

use App\Http\Resources\ScenarioComparisonResource;
use App\Models\Projection;
use App\Models\Scenario;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ProjectionComparisonController extends Controller
{
    /**
     * Compare multiple scenarios.
     */
    public function compare(Request $request): JsonResponse
    {
        $request->validate([
            'scenario_ids' => ['required', 'array', 'min:2', 'max:4'],
            'scenario_ids.*' => ['integer', 'exists:scenarios,id'],
            'year' => ['nullable', 'integer', 'min:2000', 'max:2100'],
            'customer_type_id' => ['nullable', 'integer', 'exists:customer_types,id'],
            'business_group_id' => ['nullable', 'integer', 'exists:business_groups,id'],
            'customer_id' => ['nullable', 'integer', 'exists:customers,id'],
        ]);

        $scenarioIds = $request->scenario_ids;
        $year = $request->year;

        // Load scenarios
        $scenarios = Scenario::whereIn('id', $scenarioIds)
            ->with('user')
            ->get();

        // Build comparison data
        $comparisonData = [];

        foreach ($scenarios as $scenario) {
            $query = Projection::where('scenario_id', $scenario->id);

            // Apply filters
            if ($year) {
                $query->where('year', $year);
            }

            if ($request->has('customer_type_id')) {
                $query->where('customer_type_id', $request->customer_type_id);
            }

            if ($request->has('business_group_id')) {
                $query->where('business_group_id', $request->business_group_id);
            }

            if ($request->has('customer_id')) {
                $query->where('customer_id', $request->customer_id);
            }

            $projections = $query->get();

            // Group by year for comparison
            foreach ($projections as $projection) {
                $yearKey = $projection->year;

                if (!isset($comparisonData[$yearKey])) {
                    $comparisonData[$yearKey] = [];
                }

                $comparisonData[$yearKey][] = [
                    'scenario_id' => $scenario->id,
                    'scenario_name' => $scenario->name,
                    'year' => $projection->year,
                    'base_amount' => (float) $projection->base_amount,
                    'total_amount' => (float) $projection->total_amount,
                    'total_subtotal' => (float) $projection->total_subtotal,
                    'total_tax' => (float) $projection->total_tax,
                    'variance_amount' => $projection->total_amount - $projection->base_amount,
                    'variance_percentage' => $projection->base_amount > 0
                        ? (($projection->total_amount - $projection->base_amount) / $projection->base_amount) * 100
                        : 0,
                ];
            }
        }

        // Calculate differences between scenarios
        $differences = $this->calculateDifferences($comparisonData);

        return response()->json([
            'scenarios' => $scenarios,
            'comparison_data' => $comparisonData,
            'differences' => $differences,
            'summary' => $this->calculateSummary($comparisonData),
        ]);
    }

    /**
     * Calculate differences between scenarios.
     */
    protected function calculateDifferences(array $comparisonData): array
    {
        $differences = [];

        foreach ($comparisonData as $year => $scenarios) {
            if (count($scenarios) < 2) {
                continue;
            }

            $differences[$year] = [];

            for ($i = 0; $i < count($scenarios) - 1; $i++) {
                for ($j = $i + 1; $j < count($scenarios); $j++) {
                    $scenario1 = $scenarios[$i];
                    $scenario2 = $scenarios[$j];

                    $diff = [
                        'scenario_1' => $scenario1['scenario_name'],
                        'scenario_2' => $scenario2['scenario_name'],
                        'absolute_difference' => $scenario2['total_amount'] - $scenario1['total_amount'],
                        'percentage_difference' => $scenario1['total_amount'] > 0
                            ? (($scenario2['total_amount'] - $scenario1['total_amount']) / $scenario1['total_amount']) * 100
                            : 0,
                    ];

                    $differences[$year][] = $diff;
                }
            }
        }

        return $differences;
    }

    /**
     * Calculate summary statistics.
     */
    protected function calculateSummary(array $comparisonData): array
    {
        $summary = [];

        foreach ($comparisonData as $year => $scenarios) {
            $totals = array_column($scenarios, 'total_amount');
            $min = min($totals);
            $max = max($totals);
            $avg = array_sum($totals) / count($totals);

            $summary[$year] = [
                'min' => $min,
                'max' => $max,
                'avg' => $avg,
                'range' => $max - $min,
                'range_percentage' => $min > 0 ? (($max - $min) / $min) * 100 : 0,
            ];
        }

        return $summary;
    }
}
