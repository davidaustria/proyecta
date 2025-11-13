<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectionDetail extends Model
{
    use HasFactory;

    protected $fillable = [
        'projection_id',
        'month',
        'subtotal',
        'tax',
        'amount',
        'base_amount',
        'seasonality_factor',
    ];

    protected function casts(): array
    {
        return [
            'month' => 'integer',
            'subtotal' => 'decimal:2',
            'tax' => 'decimal:2',
            'amount' => 'decimal:2',
            'base_amount' => 'decimal:2',
            'seasonality_factor' => 'decimal:4',
        ];
    }

    public function projection(): BelongsTo
    {
        return $this->belongsTo(Projection::class);
    }
}
