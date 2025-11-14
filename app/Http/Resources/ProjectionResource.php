<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProjectionResource extends JsonResource
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
            'base_amount' => (float) $this->base_amount,
            'total_subtotal' => (float) $this->total_subtotal,
            'total_tax' => (float) $this->total_tax,
            'total_amount' => (float) $this->total_amount,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            // Dimension identifiers
            'business_group_id' => $this->business_group_id,
            'customer_type_id' => $this->customer_type_id,
            'customer_id' => $this->customer_id,
            'product_id' => $this->product_id,

            // Calculated fields
            'variance_amount' => $this->total_amount - $this->base_amount,
            'variance_percentage' => $this->base_amount > 0
                ? (($this->total_amount - $this->base_amount) / $this->base_amount) * 100
                : 0,

            // Relationships
            'scenario' => new ScenarioResource($this->whenLoaded('scenario')),
            'business_group' => new BusinessGroupResource($this->whenLoaded('businessGroup')),
            'customer_type' => new CustomerTypeResource($this->whenLoaded('customerType')),
            'customer' => new CustomerResource($this->whenLoaded('customer')),
            'product' => new ProductResource($this->whenLoaded('product')),
            'details' => ProjectionDetailResource::collection($this->whenLoaded('details')),
        ];
    }
}
