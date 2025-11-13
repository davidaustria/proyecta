<?php

namespace App\Models;

use App\Models\Scopes\OrganizationScope;
use Illuminate\Database\Eloquent\Attributes\ScopedBy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[ScopedBy([OrganizationScope::class])]
class Scenario extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'organization_id',
        'user_id',
        'name',
        'description',
        'base_year',
        'historical_months',
        'projection_years',
        'status',
        'is_baseline',
        'calculation_method',
        'include_inflation',
    ];

    protected function casts(): array
    {
        return [
            'base_year' => 'integer',
            'historical_months' => 'integer',
            'projection_years' => 'integer',
            'is_baseline' => 'boolean',
            'include_inflation' => 'boolean',
        ];
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function assumptions(): HasMany
    {
        return $this->hasMany(ScenarioAssumption::class);
    }

    public function projections(): HasMany
    {
        return $this->hasMany(Projection::class);
    }
}
