<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomerResource extends JsonResource
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
            'code' => $this->code,
            'tax_id' => $this->tax_id,
            'is_active' => $this->is_active,
            'metadata' => $this->metadata,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            // Relationships
            'customer_type' => new CustomerTypeResource($this->whenLoaded('customerType')),
            'business_group' => new BusinessGroupResource($this->whenLoaded('businessGroup')),

            // Counts
            'invoices_count' => $this->whenCounted('invoices'),
            'projections_count' => $this->whenCounted('projections'),
        ];
    }
}
