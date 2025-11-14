<?php

namespace App\Http\Controllers;

use App\Http\Resources\InvoiceResource;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\JsonResponse;

class InvoiceController extends Controller
{
    /**
     * Display a listing of invoices.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Invoice::query()->with(['customer', 'importBatch'])->withCount('items');

        // Filters
        if ($request->has('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('date_from')) {
            $query->whereDate('invoice_date', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->whereDate('invoice_date', '<=', $request->date_to);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
                    ->orWhere('external_id', 'like', "%{$search}%");
            });
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'invoice_date');
        $sortDir = $request->get('sort_dir', 'desc');
        $query->orderBy($sortBy, $sortDir);

        // Pagination
        $perPage = $request->get('per_page', 15);
        $invoices = $query->paginate($perPage);

        return InvoiceResource::collection($invoices);
    }

    /**
     * Display the specified invoice.
     */
    public function show(Invoice $invoice): InvoiceResource
    {
        $invoice->load(['customer', 'importBatch', 'items']);

        return new InvoiceResource($invoice);
    }

    /**
     * Get invoice statistics.
     */
    public function stats(Request $request): JsonResponse
    {
        $query = Invoice::query();

        // Apply filters if provided
        if ($request->has('date_from')) {
            $query->whereDate('invoice_date', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->whereDate('invoice_date', '<=', $request->date_to);
        }

        if ($request->has('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $stats = [
            'total_invoices' => $query->count(),
            'total_revenue' => (float) $query->sum('total'),
            'total_subtotal' => (float) $query->sum('subtotal'),
            'total_tax' => (float) $query->sum('tax'),
            'average_invoice_amount' => (float) $query->avg('total'),
        ];

        // Count by status
        $stats['by_status'] = Invoice::query()
            ->when($request->has('date_from'), fn ($q) => $q->whereDate('invoice_date', '>=', $request->date_from))
            ->when($request->has('date_to'), fn ($q) => $q->whereDate('invoice_date', '<=', $request->date_to))
            ->when($request->has('customer_id'), fn ($q) => $q->where('customer_id', $request->customer_id))
            ->selectRaw('status, COUNT(*) as count, SUM(total) as total')
            ->groupBy('status')
            ->get()
            ->mapWithKeys(fn ($item) => [$item->status => [
                'count' => $item->count,
                'total' => (float) $item->total,
            ]]);

        // Revenue by month (last 12 months)
        $stats['by_month'] = Invoice::query()
            ->when($request->has('customer_id'), fn ($q) => $q->where('customer_id', $request->customer_id))
            ->where('invoice_date', '>=', now()->subMonths(12))
            ->selectRaw('YEAR(invoice_date) as year, MONTH(invoice_date) as month, SUM(total) as total, COUNT(*) as count')
            ->groupBy('year', 'month')
            ->orderBy('year')
            ->orderBy('month')
            ->get()
            ->map(fn ($item) => [
                'period' => sprintf('%04d-%02d', $item->year, $item->month),
                'total' => (float) $item->total,
                'count' => $item->count,
            ]);

        return response()->json($stats);
    }
}
