<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\Projection;
use App\Models\ProjectionDetail;
use App\Models\Scenario;
use App\Models\ScenarioAssumption;
use Illuminate\Support\Facades\DB;

/**
 * Service responsible for calculating revenue projections based on scenarios and assumptions.
 *
 * This service implements the core projection calculation logic:
 * - Calculates projections for a given scenario
 * - Applies growth rates and inflation to base amounts
 * - Distributes annual amounts into monthly projections using seasonality factors
 * - Resolves applicable assumptions based on dimensional hierarchy
 */
class ProjectionCalculatorService
{
    public function __construct(
        protected HistoricalDataAnalyzerService $historicalAnalyzer,
        protected AssumptionResolver $assumptionResolver
    ) {
    }

    /**
     * Calculate all projections for a given scenario.
     *
     * This method orchestrates the full projection calculation process:
     * 1. Invalidates (soft deletes) existing projections for the scenario
     * 2. Retrieves all customers with sufficient historical data
     * 3. For each projection year, creates aggregated or detailed projections
     * 4. Applies growth rates, inflation, and seasonality factors
     *
     * @param  Scenario  $scenario  The scenario to calculate projections for
     */
    public function calculateForScenario(Scenario $scenario): void
    {
        DB::transaction(function () use ($scenario) {
            // Invalidate existing projections (soft delete)
            $scenario->projections()->delete();

            // Get all active customers for this organization
            $customers = Customer::query()
                ->where('is_active', true)
                ->with(['customerType', 'businessGroup'])
                ->get();

            // Calculate base date range for historical data
            $baseDate = now()->setYear($scenario->base_year)->endOfYear();
            $startDate = (clone $baseDate)->subMonths($scenario->historical_months);

            foreach ($customers as $customer) {
                // Validate customer has sufficient data
                if (! $this->historicalAnalyzer->validateSufficientData($customer, $scenario->historical_months)) {
                    continue;
                }

                // Get average revenue for the customer
                $baseAmount = $this->historicalAnalyzer->getAverageMonthlyRevenue(
                    $customer,
                    $startDate,
                    $baseDate
                );

                // Calculate projections for each year
                for ($year = 1; $year <= $scenario->projection_years; $year++) {
                    $projectionYear = $scenario->base_year + $year;

                    $this->createProjectionForCustomer(
                        $scenario,
                        $customer,
                        $projectionYear,
                        $baseAmount
                    );
                }
            }
        });
    }

    /**
     * Create a projection for a specific customer and year.
     *
     * @param  Scenario  $scenario  The scenario
     * @param  Customer  $customer  The customer
     * @param  int  $projectionYear  The year to project
     * @param  float  $baseAmount  The base monthly amount from historical data
     */
    protected function createProjectionForCustomer(
        Scenario $scenario,
        Customer $customer,
        int $projectionYear,
        float $baseAmount
    ): void {
        // Get applicable assumption for this customer and year
        $assumption = $this->assumptionResolver->resolve($scenario, $projectionYear, [
            'customer_id' => $customer->id,
            'customer_type_id' => $customer->customer_type_id,
            'business_group_id' => $customer->business_group_id,
        ]);

        // Calculate annual amount with growth and inflation
        $annualBaseAmount = $baseAmount * 12;
        $growthRate = $assumption?->growth_rate ?? 0;
        $inflationRate = $scenario->include_inflation ? ($assumption?->inflation_rate ?? 0) : 0;

        $projectedAmount = $this->applyGrowthAndInflation(
            $annualBaseAmount,
            $growthRate,
            $inflationRate
        );

        // Get seasonality factors (default to uniform distribution)
        $seasonalityFactors = $assumption?->seasonality_factors ?? array_fill(0, 12, 1.0);

        // Distribute into monthly projections
        $monthlyDistribution = $this->calculateMonthlyDistribution(
            $projectedAmount,
            $seasonalityFactors
        );

        // Calculate totals
        $totalSubtotal = $projectedAmount * 0.85; // Assuming 15% tax rate
        $totalTax = $projectedAmount * 0.15;
        $totalAmount = $projectedAmount;
        $totalWithInflation = $totalAmount; // Already includes inflation

        // Create projection record
        $projection = Projection::create([
            'scenario_id' => $scenario->id,
            'year' => $projectionYear,
            'customer_id' => $customer->id,
            'customer_type_id' => $customer->customer_type_id,
            'business_group_id' => $customer->business_group_id,
            'product_id' => null, // For now, we aggregate at customer level
            'total_subtotal' => $totalSubtotal,
            'total_tax' => $totalTax,
            'total_amount' => $totalAmount,
            'total_with_inflation' => $totalWithInflation,
            'base_amount' => $annualBaseAmount,
            'growth_applied' => $growthRate,
            'inflation_applied' => $inflationRate,
            'calculation_method' => $scenario->calculation_method,
            'calculated_at' => now(),
        ]);

        // Create monthly detail records
        foreach ($monthlyDistribution as $month => $amount) {
            $monthSubtotal = $amount * 0.85;
            $monthTax = $amount * 0.15;

            ProjectionDetail::create([
                'projection_id' => $projection->id,
                'month' => $month + 1, // 1-based months
                'subtotal' => $monthSubtotal,
                'tax' => $monthTax,
                'amount' => $amount,
                'base_amount' => $annualBaseAmount / 12,
                'seasonality_factor' => $seasonalityFactors[$month],
            ]);
        }
    }

    /**
     * Distribute an annual amount into monthly amounts using seasonality factors.
     *
     * Algorithm:
     * 1. Normalize seasonality factors to sum to 12 (average = 1.0)
     * 2. Calculate each month's proportion of the annual total
     * 3. Multiply annual amount by each month's factor
     *
     * @param  float  $annualAmount  The total annual amount to distribute
     * @param  array  $seasonalityFactors  Array of 12 factors (one per month)
     * @return array Array of 12 monthly amounts
     */
    public function calculateMonthlyDistribution(float $annualAmount, array $seasonalityFactors): array
    {
        // Validate we have 12 factors
        if (count($seasonalityFactors) !== 12) {
            $seasonalityFactors = array_fill(0, 12, 1.0);
        }

        // Normalize factors to sum to 12 (average = 1.0)
        $sum = array_sum($seasonalityFactors);
        $normalizedFactors = array_map(
            fn ($factor) => $sum > 0 ? ($factor / $sum) * 12 : 1.0,
            $seasonalityFactors
        );

        // Calculate monthly amounts
        $monthlyAmounts = [];
        foreach ($normalizedFactors as $factor) {
            $monthlyAmounts[] = ($annualAmount / 12) * $factor;
        }

        return $monthlyAmounts;
    }

    /**
     * Apply growth rate and inflation rate to a base amount.
     *
     * Formula: baseAmount * (1 + growthRate/100) * (1 + inflationRate/100)
     *
     * @param  float  $baseAmount  The base amount
     * @param  float  $growthRate  Growth rate as percentage (e.g., 5.0 for 5%)
     * @param  float  $inflationRate  Inflation rate as percentage (e.g., 3.5 for 3.5%)
     * @return float The adjusted amount
     */
    public function applyGrowthAndInflation(float $baseAmount, float $growthRate, float $inflationRate): float
    {
        $withGrowth = $baseAmount * (1 + ($growthRate / 100));
        $withInflation = $withGrowth * (1 + ($inflationRate / 100));

        return round($withInflation, 2);
    }

    /**
     * Get the applicable assumption for a given scenario, year, and dimensions.
     *
     * This method is a convenience wrapper around AssumptionResolver.
     *
     * @param  Scenario  $scenario  The scenario
     * @param  int  $year  The projection year
     * @param  array  $dimensions  Dimensional filters (customer_id, customer_type_id, etc.)
     * @return ScenarioAssumption|null The most specific applicable assumption
     */
    public function getApplicableAssumption(Scenario $scenario, int $year, array $dimensions): ?ScenarioAssumption
    {
        return $this->assumptionResolver->resolve($scenario, $year, $dimensions);
    }
}
