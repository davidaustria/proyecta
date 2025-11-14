<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ScenarioResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'base_year' => $this->base_year,
            'historical_months' => $this->historical_months,
            'projection_years' => $this->projection_years,
            'status' => $this->status,
            'is_baseline' => $this->is_baseline,
            'calculation_method' => $this->calculation_method,
            'include_inflation' => $this->include_inflation,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            // User info
            'user' => [
                'id' => $this->user_id,
                'name' => $this->whenLoaded('user', fn () => $this->user->name),
            ],

            // Counts
            'assumptions_count' => $this->whenCounted('assumptions'),
            'projections_count' => $this->whenCounted('projections'),

            // Relationships
            'assumptions' => ScenarioAssumptionResource::collection($this->whenLoaded('assumptions')),
            'projections' => ProjectionResource::collection($this->whenLoaded('projections')),
        ];
    }
}
