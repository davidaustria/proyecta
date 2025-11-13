<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Projection extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'scenario_id',
        'year',
        'business_group_id',
        'customer_type_id',
        'customer_id',
        'product_id',
        'total_subtotal',
        'total_tax',
        'total_amount',
        'total_with_inflation',
        'base_amount',
        'growth_applied',
        'inflation_applied',
        'calculation_method',
        'calculated_at',
    ];

    protected function casts(): array
    {
        return [
            'year' => 'integer',
            'total_subtotal' => 'decimal:2',
            'total_tax' => 'decimal:2',
            'total_amount' => 'decimal:2',
            'total_with_inflation' => 'decimal:2',
            'base_amount' => 'decimal:2',
            'growth_applied' => 'decimal:2',
            'inflation_applied' => 'decimal:2',
            'calculated_at' => 'datetime',
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

    public function details(): HasMany
    {
        return $this->hasMany(ProjectionDetail::class);
    }
}
