<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Custom resource for scenario comparisons.
 * This is used by the ProjectionComparisonController to return comparison data.
 */
class ScenarioComparisonResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'scenarios' => $this->resource['scenarios'] ?? [],
            'comparison_data' => $this->resource['comparison_data'] ?? [],
            'summary' => $this->resource['summary'] ?? [],
        ];
    }

    /**
     * Create a comparison resource from scenarios and projections.
     */
    public static function make(array $scenarios, array $comparisonData): self
    {
        return new self([
            'scenarios' => ScenarioResource::collection($scenarios),
            'comparison_data' => $comparisonData,
            'summary' => self::calculateSummary($comparisonData),
        ]);
    }

    /**
     * Calculate summary statistics for the comparison.
     */
    protected static function calculateSummary(array $comparisonData): array
    {
        if (empty($comparisonData)) {
            return [];
        }

        $summary = [];

        foreach ($comparisonData as $year => $data) {
            $totals = array_column($data, 'total_amount');
            $min = min($totals);
            $max = max($totals);

            $summary[$year] = [
                'min' => $min,
                'max' => $max,
                'range' => $max - $min,
                'range_percentage' => $min > 0 ? (($max - $min) / $min) * 100 : 0,
            ];
        }

        return $summary;
    }
}
