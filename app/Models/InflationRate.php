<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InflationRate extends Model
{
    use HasFactory;

    protected $fillable = [
        'year',
        'rate',
        'source',
        'is_estimated',
    ];

    protected function casts(): array
    {
        return [
            'year' => 'integer',
            'rate' => 'decimal:2',
            'is_estimated' => 'boolean',
        ];
    }
}
