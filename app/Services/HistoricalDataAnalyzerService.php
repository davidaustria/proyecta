<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Product;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Service responsible for analyzing historical invoice data.
 *
 * This service provides methods to:
 * - Calculate average monthly revenue for customers
 * - Analyze revenue by product
 * - Validate if sufficient historical data exists
 * - Aggregate invoice data by various dimensions
 */
class HistoricalDataAnalyzerService
{
    /**
     * Get the average monthly revenue for a customer within a date range.
     *
     * @param  Customer  $customer  The customer
     * @param  Carbon  $startDate  Start date of the period
     * @param  Carbon  $endDate  End date of the period
     * @return float Average monthly revenue
     */
    public function getAverageMonthlyRevenue(Customer $customer, Carbon $startDate, Carbon $endDate): float
    {
        $totalRevenue = Invoice::query()
            ->where('customer_id', $customer->id)
            ->whereBetween('invoice_date', [$startDate, $endDate])
            ->whereIn('status', ['issued', 'paid'])
            ->sum('total');

        $monthsDiff = max(1, $startDate->diffInMonths($endDate));

        return round($totalRevenue / $monthsDiff, 2);
    }

    /**
     * Get revenue for a specific customer and product combination.
     *
     * @param  Customer  $customer  The customer
     * @param  Product  $product  The product
     * @param  array  $period  Array with 'start' and 'end' Carbon dates
     * @return float Total revenue for the product
     */
    public function getRevenueByProduct(Customer $customer, Product $product, array $period): float
    {
        return (float) DB::table('invoices')
            ->join('invoice_items', 'invoices.id', '=', 'invoice_items.invoice_id')
            ->where('invoices.customer_id', $customer->id)
            ->where('invoice_items.product_id', $product->id)
            ->whereBetween('invoices.invoice_date', [$period['start'], $period['end']])
            ->whereIn('invoices.status', ['issued', 'paid'])
            ->sum('invoice_items.total');
    }

    /**
     * Validate if a customer has sufficient historical data.
     *
     * @param  Customer  $customer  The customer
     * @param  int  $requiredMonths  Minimum number of months required
     * @return bool True if customer has enough data
     */
    public function validateSufficientData(Customer $customer, int $requiredMonths): bool
    {
        $firstInvoice = Invoice::query()
            ->where('customer_id', $customer->id)
            ->whereIn('status', ['issued', 'paid'])
            ->orderBy('invoice_date')
            ->first();

        if (! $firstInvoice) {
            return false;
        }

        $monthsOfData = Carbon::parse($firstInvoice->invoice_date)->diffInMonths(now());

        return $monthsOfData >= $requiredMonths;
    }

    /**
     * Aggregate invoice data by various dimensions and periods.
     *
     * @param  array  $filters  Filters to apply: customer_id, customer_type_id, business_group_id, start_date, end_date
     * @return Collection Collection of aggregated results
     */
    public function aggregateInvoicesByPeriod(array $filters = []): Collection
    {
        $query = DB::table('invoices')
            ->join('customers', 'invoices.customer_id', '=', 'customers.id')
            ->select([
                DB::raw('YEAR(invoices.invoice_date) as year'),
                DB::raw('MONTH(invoices.invoice_date) as month'),
                'customers.customer_type_id',
                'customers.business_group_id',
                DB::raw('SUM(invoices.subtotal) as total_subtotal'),
                DB::raw('SUM(invoices.tax) as total_tax'),
                DB::raw('SUM(invoices.total) as total_amount'),
                DB::raw('COUNT(invoices.id) as invoice_count'),
            ])
            ->whereIn('invoices.status', ['issued', 'paid']);

        // Apply filters
        if (isset($filters['customer_id'])) {
            $query->where('invoices.customer_id', $filters['customer_id']);
        }

        if (isset($filters['customer_type_id'])) {
            $query->where('customers.customer_type_id', $filters['customer_type_id']);
        }

        if (isset($filters['business_group_id'])) {
            $query->where('customers.business_group_id', $filters['business_group_id']);
        }

        if (isset($filters['start_date'])) {
            $query->where('invoices.invoice_date', '>=', $filters['start_date']);
        }

        if (isset($filters['end_date'])) {
            $query->where('invoices.invoice_date', '<=', $filters['end_date']);
        }

        return $query
            ->groupBy(['year', 'month', 'customers.customer_type_id', 'customers.business_group_id'])
            ->orderBy('year')
            ->orderBy('month')
            ->get();
    }

    /**
     * Get monthly revenue trend for a customer.
     *
     * @param  Customer  $customer  The customer
     * @param  int  $months  Number of months to analyze
     * @return Collection Collection of monthly revenue data
     */
    public function getMonthlyRevenueTrend(Customer $customer, int $months = 12): Collection
    {
        $startDate = now()->subMonths($months);

        return Invoice::query()
            ->where('customer_id', $customer->id)
            ->whereBetween('invoice_date', [$startDate, now()])
            ->whereIn('status', ['issued', 'paid'])
            ->select([
                DB::raw('YEAR(invoice_date) as year'),
                DB::raw('MONTH(invoice_date) as month'),
                DB::raw('SUM(total) as revenue'),
                DB::raw('COUNT(id) as invoice_count'),
            ])
            ->groupBy(['year', 'month'])
            ->orderBy('year')
            ->orderBy('month')
            ->get();
    }

    /**
     * Calculate growth rate between two periods.
     *
     * @param  float  $previousAmount  Amount from previous period
     * @param  float  $currentAmount  Amount from current period
     * @return float Growth rate as percentage
     */
    public function calculateGrowthRate(float $previousAmount, float $currentAmount): float
    {
        if ($previousAmount == 0) {
            return 0;
        }

        return round((($currentAmount - $previousAmount) / $previousAmount) * 100, 2);
    }
}
