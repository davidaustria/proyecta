<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScenarioAssumption extends Model
{
    use HasFactory;

    protected $fillable = [
        'scenario_id',
        'year',
        'business_group_id',
        'customer_type_id',
        'customer_id',
        'product_id',
        'growth_rate',
        'inflation_rate',
        'adjustment_type',
        'fixed_amount',
        'seasonality_factors',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'year' => 'integer',
            'growth_rate' => 'decimal:2',
            'inflation_rate' => 'decimal:2',
            'fixed_amount' => 'decimal:2',
            'seasonality_factors' => 'array',
        ];
    }

    public function scenario(): BelongsTo
    {
        return $this->belongsTo(Scenario::class);
    }

    public function businessGroup(): BelongsTo
    {
        return $this->belongsTo(BusinessGroup::class);
    }

    public function customerType(): BelongsTo
    {
        return $this->belongsTo(CustomerType::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
