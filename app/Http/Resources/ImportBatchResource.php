<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ImportBatchResource extends JsonResource
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
            'filename' => $this->filename,
            'source_system' => $this->source_system,
            'import_type' => $this->import_type,
            'total_records' => $this->total_records,
            'successful_records' => $this->successful_records,
            'failed_records' => $this->failed_records,
            'status' => $this->status,
            'started_at' => $this->started_at,
            'completed_at' => $this->completed_at,
            'error_log' => $this->error_log,
            'metadata' => $this->metadata,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            // Calculated fields
            'success_rate' => $this->total_records > 0
                ? ($this->successful_records / $this->total_records) * 100
                : 0,
            'duration_seconds' => $this->started_at && $this->completed_at
                ? $this->completed_at->diffInSeconds($this->started_at)
                : null,

            // User info
            'user' => [
                'id' => $this->user_id,
                'name' => $this->whenLoaded('user', fn () => $this->user->name),
            ],

            // Counts
            'invoices_count' => $this->whenCounted('invoices'),
        ];
    }
}
