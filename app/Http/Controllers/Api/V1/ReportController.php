<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Scenario;
use App\Services\ReportGeneratorService;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ReportController extends Controller
{
    public function __construct(protected ReportGeneratorService $reportGenerator) {}

    /**
     * Export projections to Excel
     */
    public function exportProjections(Request $request, Scenario $scenario): BinaryFileResponse
    {
        $filters = $request->only([
            'year',
            'customer_type_id',
            'business_group_id',
        ]);

        $filePath = $this->reportGenerator->exportProjectionsToExcel($scenario, $filters);

        return response()->download($filePath, basename($filePath))->deleteFileAfterSend();
    }

    /**
     * Export scenario comparison to Excel
     */
    public function exportComparison(Request $request): BinaryFileResponse
    {
        $request->validate([
            'scenario_ids' => 'required|array|min:2|max:4',
            'scenario_ids.*' => 'exists:scenarios,id',
        ]);

        $filters = $request->only([
            'year',
            'customer_type_id',
            'business_group_id',
        ]);

        $filePath = $this->reportGenerator->exportComparisonToExcel(
            $request->input('scenario_ids'),
            $filters
        );

        return response()->download($filePath, basename($filePath))->deleteFileAfterSend();
    }

    /**
     * Export invoices to Excel
     */
    public function exportInvoices(Request $request): BinaryFileResponse
    {
        $filters = $request->only([
            'customer_id',
            'status',
            'date_from',
            'date_to',
            'search',
        ]);

        $filePath = $this->reportGenerator->exportInvoicesToExcel($filters);

        return response()->download($filePath, basename($filePath))->deleteFileAfterSend();
    }
}
