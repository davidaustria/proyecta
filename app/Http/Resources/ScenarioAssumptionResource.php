<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ScenarioAssumptionResource extends JsonResource
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
            'scenario_id' => $this->scenario_id,
            'year' => $this->year,
            'growth_rate' => $this->growth_rate ? (float) $this->growth_rate : null,
            'inflation_rate' => $this->inflation_rate ? (float) $this->inflation_rate : null,
            'adjustment_type' => $this->adjustment_type,
            'fixed_amount' => $this->fixed_amount ? (float) $this->fixed_amount : null,
            'seasonality_factors' => $this->seasonality_factors,
            'notes' => $this->notes,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            // Dimension identifiers
            'business_group_id' => $this->business_group_id,
            'customer_type_id' => $this->customer_type_id,
            'customer_id' => $this->customer_id,
            'product_id' => $this->product_id,

            // Relationships (optional)
            'business_group' => new BusinessGroupResource($this->whenLoaded('businessGroup')),
            'customer_type' => new CustomerTypeResource($this->whenLoaded('customerType')),
            'customer' => new CustomerResource($this->whenLoaded('customer')),
            'product' => new ProductResource($this->whenLoaded('product')),

            // Hierarchy level indicator
            'hierarchy_level' => $this->getHierarchyLevel(),
        ];
    }

    /**
     * Determine the hierarchy level of this assumption.
     */
    protected function getHierarchyLevel(): string
    {
        if ($this->customer_id) {
            return 'customer';
        }

        if ($this->business_group_id) {
            return 'business_group';
        }

        if ($this->customer_type_id) {
            return 'customer_type';
        }

        if ($this->product_id) {
            return 'product';
        }

        return 'global';
    }
}
