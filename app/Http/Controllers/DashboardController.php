<?php

namespace App\Http\Controllers;

use App\Models\BusinessGroup;
use App\Models\Customer;
use App\Models\CustomerType;
use App\Models\Projection;
use App\Models\Scenario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display the dashboard with projections overview.
     */
    public function index(Request $request): Response
    {
        // Get filter parameters
        $scenarioId = $request->get('scenario_id');
        $years = $request->get('years', []);
        $customerTypeId = $request->get('customer_type_id');
        $businessGroupId = $request->get('business_group_id');

        // Get baseline scenario if no scenario is selected
        if (! $scenarioId) {
            $baselineScenario = Scenario::where('is_baseline', true)
                ->where('status', 'active')
                ->first();
            $scenarioId = $baselineScenario?->id;
        }

        // Get the selected scenario
        $scenario = $scenarioId ? Scenario::find($scenarioId) : null;

        // If years not specified, use all projection years from scenario
        if (empty($years) && $scenario) {
            $years = range(
                $scenario->base_year + 1,
                $scenario->base_year + $scenario->projection_years
            );
        }

        // Build projection query
        $projectionsQuery = Projection::query()
            ->with(['customerType', 'businessGroup', 'customer', 'product', 'details']);

        if ($scenarioId) {
            $projectionsQuery->where('scenario_id', $scenarioId);
        }

        if (! empty($years)) {
            $projectionsQuery->whereIn('year', $years);
        }

        if ($customerTypeId) {
            $projectionsQuery->where('customer_type_id', $customerTypeId);
        }

        if ($businessGroupId) {
            $projectionsQuery->where('business_group_id', $businessGroupId);
        }

        $projections = $projectionsQuery->get();

        // Calculate KPIs
        $kpis = $this->calculateKPIs($projections, $scenario);

        // Get data for year comparison chart
        $yearComparisonData = $this->getYearComparisonData($projections);

        // Get data for monthly evolution chart
        $monthlyEvolutionData = $this->getMonthlyEvolutionData($projections);

        // Get data for customer type distribution
        $customerTypeDistribution = $this->getCustomerTypeDistribution($projections);

        // Get summary table data
        $summaryTableData = $this->getSummaryTableData($projections, $years);

        // Get all scenarios for selector
        $scenarios = Scenario::select('id', 'name', 'is_baseline', 'status')
            ->orderBy('is_baseline', 'desc')
            ->orderBy('name')
            ->get();

        // Get customer types for filter
        $customerTypes = CustomerType::select('id', 'name', 'code')
            ->orderBy('name')
            ->get();

        // Get business groups for filter
        $businessGroups = BusinessGroup::select('id', 'name', 'code')
            ->orderBy('name')
            ->get();

        return Inertia::render('dashboard', [
            'scenario' => $scenario,
            'scenarios' => $scenarios,
            'customerTypes' => $customerTypes,
            'businessGroups' => $businessGroups,
            'filters' => [
                'scenario_id' => $scenarioId,
                'years' => $years,
                'customer_type_id' => $customerTypeId,
                'business_group_id' => $businessGroupId,
            ],
            'kpis' => $kpis,
            'yearComparisonData' => $yearComparisonData,
            'monthlyEvolutionData' => $monthlyEvolutionData,
            'customerTypeDistribution' => $customerTypeDistribution,
            'summaryTableData' => $summaryTableData,
        ]);
    }

    /**
     * Calculate dashboard KPIs.
     */
    protected function calculateKPIs($projections, $scenario): array
    {
        $totalProjected = $projections->sum('total_amount');
        $avgGrowthRate = $projections->avg('growth_rate') ?? 0;
        $avgInflationRate = $projections->avg('inflation_rate') ?? 0;

        // Calculate vs historical (simplified - would need actual historical data)
        // For now, use base_amount as proxy for historical
        $totalBase = $projections->sum('base_amount');
        $vsHistorical = $totalBase > 0
            ? (($totalProjected - $totalBase) / $totalBase) * 100
            : 0;

        return [
            'total_projected' => round($totalProjected, 2),
            'vs_historical' => round($vsHistorical, 2),
            'annual_growth' => round($avgGrowthRate, 2),
            'inflation_applied' => round($avgInflationRate, 2),
        ];
    }

    /**
     * Get year comparison data for bar chart.
     */
    protected function getYearComparisonData($projections): array
    {
        return $projections->groupBy('year')
            ->map(function ($yearProjections) {
                return [
                    'year' => $yearProjections->first()->year,
                    'subtotal' => round($yearProjections->sum('total_subtotal'), 2),
                    'tax' => round($yearProjections->sum('total_tax'), 2),
                    'total' => round($yearProjections->sum('total_amount'), 2),
                ];
            })
            ->values()
            ->sortBy('year')
            ->values()
            ->toArray();
    }

    /**
     * Get monthly evolution data for line chart.
     */
    protected function getMonthlyEvolutionData($projections): array
    {
        $data = [];

        // Group by year and month
        foreach ($projections as $projection) {
            if (! $projection->details) {
                continue;
            }

            foreach ($projection->details as $detail) {
                $monthKey = $detail->month;

                if (! isset($data[$monthKey])) {
                    $data[$monthKey] = [
                        'month' => $monthKey,
                        'monthName' => $this->getMonthName($monthKey),
                    ];
                }

                $yearKey = "year_{$projection->year}";
                if (! isset($data[$monthKey][$yearKey])) {
                    $data[$monthKey][$yearKey] = 0;
                }

                $data[$monthKey][$yearKey] += $detail->total;
            }
        }

        // Sort by month
        ksort($data);

        // Round values
        foreach ($data as &$monthData) {
            foreach ($monthData as $key => &$value) {
                if (str_starts_with($key, 'year_') && is_numeric($value)) {
                    $value = round($value, 2);
                }
            }
        }

        return array_values($data);
    }

    /**
     * Get customer type distribution for area/stacked chart.
     */
    protected function getCustomerTypeDistribution($projections): array
    {
        $data = [];

        // Group by year and customer type
        $grouped = $projections->groupBy(function ($projection) {
            return $projection->year.'_'.$projection->customer_type_id;
        });

        foreach ($projections as $projection) {
            $year = $projection->year;

            if (! isset($data[$year])) {
                $data[$year] = ['year' => $year];
            }

            $typeKey = $projection->customerType
                ? $projection->customerType->name
                : 'Sin tipo';

            if (! isset($data[$year][$typeKey])) {
                $data[$year][$typeKey] = 0;
            }

            $data[$year][$typeKey] += $projection->total_amount;
        }

        // Sort by year and round values
        ksort($data);
        foreach ($data as &$yearData) {
            foreach ($yearData as $key => &$value) {
                if ($key !== 'year' && is_numeric($value)) {
                    $value = round($value, 2);
                }
            }
        }

        return array_values($data);
    }

    /**
     * Get summary table data grouped by customer type or business group.
     */
    protected function getSummaryTableData($projections, $years): array
    {
        $data = [];

        // Group by customer type
        $grouped = $projections->groupBy('customer_type_id');

        foreach ($grouped as $typeId => $typeProjections) {
            $customerType = $typeProjections->first()->customerType;
            $label = $customerType ? $customerType->name : 'Sin tipo';

            $yearsData = [];
            foreach ($years as $year) {
                $yearProjections = $typeProjections->where('year', $year);
                $yearsData[$year] = round($yearProjections->sum('total_amount'), 2);
            }

            $data[] = [
                'id' => $typeId ?? 'none',
                'label' => $label,
                'years' => $yearsData,
            ];
        }

        return $data;
    }

    /**
     * Get month name in Spanish.
     */
    protected function getMonthName(int $month): string
    {
        $months = [
            1 => 'Ene', 2 => 'Feb', 3 => 'Mar', 4 => 'Abr',
            5 => 'May', 6 => 'Jun', 7 => 'Jul', 8 => 'Ago',
            9 => 'Sep', 10 => 'Oct', 11 => 'Nov', 12 => 'Dic',
        ];

        return $months[$month] ?? '';
    }
}
