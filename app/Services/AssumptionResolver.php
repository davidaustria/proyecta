<?php

namespace App\Services;

use App\Models\Scenario;
use App\Models\ScenarioAssumption;

/**
 * Service responsible for resolving the applicable assumption for a projection.
 *
 * This service implements the hierarchical assumption resolution logic:
 * Priority (highest to lowest):
 * 1. Customer + Product specific
 * 2. Customer specific
 * 3. Business Group + Product specific
 * 4. Business Group specific
 * 5. Customer Type + Product specific
 * 6. Customer Type specific
 * 7. Product specific
 * 8. Global (no dimensional filters)
 */
class AssumptionResolver
{
    /**
     * Resolve the most specific applicable assumption for given dimensions.
     *
     * @param  Scenario  $scenario  The scenario
     * @param  int  $year  The projection year
     * @param  array  $dimensions  Dimensional filters
     * @return ScenarioAssumption|null The most specific assumption, or null if none found
     */
    public function resolve(Scenario $scenario, int $year, array $dimensions): ?ScenarioAssumption
    {
        $customerId = $dimensions['customer_id'] ?? null;
        $customerTypeId = $dimensions['customer_type_id'] ?? null;
        $businessGroupId = $dimensions['business_group_id'] ?? null;
        $productId = $dimensions['product_id'] ?? null;

        // Try each level of specificity in order
        $assumption = null;

        // Level 1: Customer + Product
        if ($customerId && $productId) {
            $assumption = $this->findAssumption($scenario, $year, [
                'customer_id' => $customerId,
                'product_id' => $productId,
            ]);
            if ($assumption) {
                return $assumption;
            }
        }

        // Level 2: Customer specific
        if ($customerId) {
            $assumption = $this->findAssumption($scenario, $year, [
                'customer_id' => $customerId,
                'product_id' => null,
            ]);
            if ($assumption) {
                return $assumption;
            }
        }

        // Level 3: Business Group + Product
        if ($businessGroupId && $productId) {
            $assumption = $this->findAssumption($scenario, $year, [
                'business_group_id' => $businessGroupId,
                'product_id' => $productId,
                'customer_id' => null,
            ]);
            if ($assumption) {
                return $assumption;
            }
        }

        // Level 4: Business Group specific
        if ($businessGroupId) {
            $assumption = $this->findAssumption($scenario, $year, [
                'business_group_id' => $businessGroupId,
                'product_id' => null,
                'customer_id' => null,
            ]);
            if ($assumption) {
                return $assumption;
            }
        }

        // Level 5: Customer Type + Product
        if ($customerTypeId && $productId) {
            $assumption = $this->findAssumption($scenario, $year, [
                'customer_type_id' => $customerTypeId,
                'product_id' => $productId,
                'customer_id' => null,
                'business_group_id' => null,
            ]);
            if ($assumption) {
                return $assumption;
            }
        }

        // Level 6: Customer Type specific
        if ($customerTypeId) {
            $assumption = $this->findAssumption($scenario, $year, [
                'customer_type_id' => $customerTypeId,
                'product_id' => null,
                'customer_id' => null,
                'business_group_id' => null,
            ]);
            if ($assumption) {
                return $assumption;
            }
        }

        // Level 7: Product specific
        if ($productId) {
            $assumption = $this->findAssumption($scenario, $year, [
                'product_id' => $productId,
                'customer_id' => null,
                'business_group_id' => null,
                'customer_type_id' => null,
            ]);
            if ($assumption) {
                return $assumption;
            }
        }

        // Level 8: Global assumption (no dimensional filters)
        return $this->findAssumption($scenario, $year, [
            'customer_id' => null,
            'business_group_id' => null,
            'customer_type_id' => null,
            'product_id' => null,
        ]);
    }

    /**
     * Find a specific assumption matching exact criteria.
     *
     * @param  Scenario  $scenario  The scenario
     * @param  int  $year  The projection year
     * @param  array  $filters  Exact filters to match
     * @return ScenarioAssumption|null The matching assumption
     */
    protected function findAssumption(Scenario $scenario, int $year, array $filters): ?ScenarioAssumption
    {
        $query = ScenarioAssumption::query()
            ->where('scenario_id', $scenario->id)
            ->where('year', $year);

        // Apply exact filters (including null checks)
        foreach ($filters as $column => $value) {
            if ($value === null) {
                $query->whereNull($column);
            } else {
                $query->where($column, $value);
            }
        }

        return $query->first();
    }

    /**
     * Get all applicable assumptions for a given scenario and year.
     *
     * This method returns assumptions in priority order (most specific first).
     *
     * @param  Scenario  $scenario  The scenario
     * @param  int  $year  The projection year
     * @param  array  $dimensions  Dimensional filters
     * @return array Array of assumptions in priority order
     */
    public function getAllApplicable(Scenario $scenario, int $year, array $dimensions): array
    {
        $customerId = $dimensions['customer_id'] ?? null;
        $customerTypeId = $dimensions['customer_type_id'] ?? null;
        $businessGroupId = $dimensions['business_group_id'] ?? null;
        $productId = $dimensions['product_id'] ?? null;

        $assumptions = [];

        // Collect all applicable assumptions in priority order
        if ($customerId && $productId) {
            $assumption = $this->findAssumption($scenario, $year, [
                'customer_id' => $customerId,
                'product_id' => $productId,
            ]);
            if ($assumption) {
                $assumptions[] = $assumption;
            }
        }

        if ($customerId) {
            $assumption = $this->findAssumption($scenario, $year, [
                'customer_id' => $customerId,
                'product_id' => null,
            ]);
            if ($assumption) {
                $assumptions[] = $assumption;
            }
        }

        if ($businessGroupId && $productId) {
            $assumption = $this->findAssumption($scenario, $year, [
                'business_group_id' => $businessGroupId,
                'product_id' => $productId,
                'customer_id' => null,
            ]);
            if ($assumption) {
                $assumptions[] = $assumption;
            }
        }

        if ($businessGroupId) {
            $assumption = $this->findAssumption($scenario, $year, [
                'business_group_id' => $businessGroupId,
                'product_id' => null,
                'customer_id' => null,
            ]);
            if ($assumption) {
                $assumptions[] = $assumption;
            }
        }

        if ($customerTypeId && $productId) {
            $assumption = $this->findAssumption($scenario, $year, [
                'customer_type_id' => $customerTypeId,
                'product_id' => $productId,
                'customer_id' => null,
                'business_group_id' => null,
            ]);
            if ($assumption) {
                $assumptions[] = $assumption;
            }
        }

        if ($customerTypeId) {
            $assumption = $this->findAssumption($scenario, $year, [
                'customer_type_id' => $customerTypeId,
                'product_id' => null,
                'customer_id' => null,
                'business_group_id' => null,
            ]);
            if ($assumption) {
                $assumptions[] = $assumption;
            }
        }

        if ($productId) {
            $assumption = $this->findAssumption($scenario, $year, [
                'product_id' => $productId,
                'customer_id' => null,
                'business_group_id' => null,
                'customer_type_id' => null,
            ]);
            if ($assumption) {
                $assumptions[] = $assumption;
            }
        }

        // Global
        $assumption = $this->findAssumption($scenario, $year, [
            'customer_id' => null,
            'business_group_id' => null,
            'customer_type_id' => null,
            'product_id' => null,
        ]);
        if ($assumption) {
            $assumptions[] = $assumption;
        }

        return $assumptions;
    }
}
