<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\Projection;
use App\Models\Scenario;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Facades\Excel;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ReportGeneratorService
{
    /**
     * Export projections to Excel file
     */
    public function exportProjectionsToExcel(Scenario $scenario, array $filters = []): string
    {
        $fileName = 'proyecciones_'.str_replace(' ', '_', $scenario->name).'_'.now()->format('Y-m-d_His').'.xlsx';
        $filePath = storage_path('app/exports/'.$fileName);

        // Ensure the exports directory exists
        if (! file_exists(storage_path('app/exports'))) {
            mkdir(storage_path('app/exports'), 0755, true);
        }

        $sheets = [
            new ProjectionSummarySheet($scenario, $filters),
            new ProjectionMonthlyDetailSheet($scenario, $filters),
            new ProjectionAssumptionsSheet($scenario),
        ];

        Excel::store(new ProjectionExport($sheets), 'exports/'.$fileName);

        return $filePath;
    }

    /**
     * Export scenario comparison to Excel file
     */
    public function exportComparisonToExcel(array $scenarioIds, array $filters = []): string
    {
        $scenarios = Scenario::with('assumptions')->whereIn('id', $scenarioIds)->get();
        $fileName = 'comparacion_escenarios_'.now()->format('Y-m-d_His').'.xlsx';
        $filePath = storage_path('app/exports/'.$fileName);

        // Ensure the exports directory exists
        if (! file_exists(storage_path('app/exports'))) {
            mkdir(storage_path('app/exports'), 0755, true);
        }

        $sheets = [
            new ScenarioComparisonSheet($scenarios, $filters),
        ];

        Excel::store(new ProjectionExport($sheets), 'exports/'.$fileName);

        return $filePath;
    }

    /**
     * Export invoices to Excel file
     */
    public function exportInvoicesToExcel(array $filters = []): string
    {
        $fileName = 'facturas_'.now()->format('Y-m-d_His').'.xlsx';
        $filePath = storage_path('app/exports/'.$fileName);

        // Ensure the exports directory exists
        if (! file_exists(storage_path('app/exports'))) {
            mkdir(storage_path('app/exports'), 0755, true);
        }

        $sheet = new InvoicesSheet($filters);

        Excel::store(new ProjectionExport([$sheet]), 'exports/'.$fileName);

        return $filePath;
    }
}

/**
 * Multi-sheet Excel export wrapper
 */
class ProjectionExport implements WithMultipleSheets
{
    public function __construct(protected array $sheets) {}

    public function sheets(): array
    {
        return $this->sheets;
    }
}

/**
 * Projection Summary Sheet
 */
class ProjectionSummarySheet implements FromCollection, ShouldAutoSize, WithHeadings, WithStyles, WithTitle
{
    public function __construct(protected Scenario $scenario, protected array $filters = []) {}

    public function collection(): Collection
    {
        $query = $this->scenario->projections()->with([
            'customerType',
            'businessGroup',
            'customer',
            'product',
        ]);

        // Apply filters
        if (! empty($this->filters['year'])) {
            $query->where('year', $this->filters['year']);
        }

        if (! empty($this->filters['customer_type_id'])) {
            $query->where('customer_type_id', $this->filters['customer_type_id']);
        }

        if (! empty($this->filters['business_group_id'])) {
            $query->where('business_group_id', $this->filters['business_group_id']);
        }

        $projections = $query->get();

        return $projections->map(function (Projection $projection) {
            return [
                'Año' => $projection->year,
                'Tipo de Cliente' => $projection->customerType?->name ?? 'Global',
                'Grupo Empresarial' => $projection->businessGroup?->name ?? 'N/A',
                'Cliente' => $projection->customer?->name ?? 'N/A',
                'Producto' => $projection->product?->name ?? 'N/A',
                'Monto Base' => number_format($projection->base_amount, 2),
                'Subtotal' => number_format($projection->total_subtotal, 2),
                'IVA' => number_format($projection->total_tax, 2),
                'Total' => number_format($projection->total_amount, 2),
                'Moneda' => $projection->currency,
            ];
        });
    }

    public function headings(): array
    {
        return [
            'Año',
            'Tipo de Cliente',
            'Grupo Empresarial',
            'Cliente',
            'Producto',
            'Monto Base',
            'Subtotal',
            'IVA',
            'Total',
            'Moneda',
        ];
    }

    public function title(): string
    {
        return 'Resumen';
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font' => ['bold' => true, 'size' => 12],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => 'E2E8F0'],
                ],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ],
        ];
    }
}

/**
 * Projection Monthly Detail Sheet
 */
class ProjectionMonthlyDetailSheet implements FromCollection, ShouldAutoSize, WithHeadings, WithStyles, WithTitle
{
    public function __construct(protected Scenario $scenario, protected array $filters = []) {}

    public function collection(): Collection
    {
        $query = $this->scenario->projections()->with([
            'details',
            'customerType',
            'businessGroup',
            'customer',
            'product',
        ]);

        // Apply filters
        if (! empty($this->filters['year'])) {
            $query->where('year', $this->filters['year']);
        }

        if (! empty($this->filters['customer_type_id'])) {
            $query->where('customer_type_id', $this->filters['customer_type_id']);
        }

        if (! empty($this->filters['business_group_id'])) {
            $query->where('business_group_id', $this->filters['business_group_id']);
        }

        $projections = $query->get();

        $rows = collect();

        foreach ($projections as $projection) {
            foreach ($projection->details as $detail) {
                $rows->push([
                    'Año' => $projection->year,
                    'Mes' => $detail->month,
                    'Tipo de Cliente' => $projection->customerType?->name ?? 'Global',
                    'Grupo Empresarial' => $projection->businessGroup?->name ?? 'N/A',
                    'Cliente' => $projection->customer?->name ?? 'N/A',
                    'Producto' => $projection->product?->name ?? 'N/A',
                    'Subtotal' => number_format($detail->subtotal, 2),
                    'IVA' => number_format($detail->tax, 2),
                    'Total' => number_format($detail->amount, 2),
                    'Moneda' => $projection->currency,
                ]);
            }
        }

        return $rows;
    }

    public function headings(): array
    {
        return [
            'Año',
            'Mes',
            'Tipo de Cliente',
            'Grupo Empresarial',
            'Cliente',
            'Producto',
            'Subtotal',
            'IVA',
            'Total',
            'Moneda',
        ];
    }

    public function title(): string
    {
        return 'Detalle Mensual';
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font' => ['bold' => true, 'size' => 12],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => 'E2E8F0'],
                ],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ],
        ];
    }
}

/**
 * Projection Assumptions Sheet
 */
class ProjectionAssumptionsSheet implements FromCollection, ShouldAutoSize, WithHeadings, WithStyles, WithTitle
{
    public function __construct(protected Scenario $scenario) {}

    public function collection(): Collection
    {
        $assumptions = $this->scenario->assumptions()->with([
            'customerType',
            'businessGroup',
            'customer',
            'product',
        ])->get();

        return $assumptions->map(function ($assumption) {
            $dimension = 'Global';

            if ($assumption->customer_id) {
                $dimension = 'Cliente: '.$assumption->customer?->name;
            } elseif ($assumption->business_group_id) {
                $dimension = 'Grupo: '.$assumption->businessGroup?->name;
            } elseif ($assumption->customer_type_id) {
                $dimension = 'Tipo: '.$assumption->customerType?->name;
            }

            if ($assumption->product_id) {
                $dimension .= ' / Producto: '.$assumption->product?->name;
            }

            return [
                'Año' => $assumption->year,
                'Dimensión' => $dimension,
                'Crecimiento (%)' => $assumption->growth_rate ? number_format($assumption->growth_rate, 2).'%' : 'N/A',
                'Inflación (%)' => $assumption->inflation_rate ? number_format($assumption->inflation_rate, 2).'%' : 'Global',
                'Tipo de Ajuste' => match ($assumption->adjustment_type) {
                    'percentage' => 'Porcentaje',
                    'fixed_amount' => 'Monto Fijo',
                    default => 'N/A',
                },
                'Monto Fijo' => $assumption->fixed_amount ? number_format($assumption->fixed_amount, 2) : 'N/A',
                'Estacionalidad' => $assumption->seasonality_factors ? 'Sí' : 'No',
                'Notas' => $assumption->notes ?? '',
            ];
        });
    }

    public function headings(): array
    {
        return [
            'Año',
            'Dimensión',
            'Crecimiento (%)',
            'Inflación (%)',
            'Tipo de Ajuste',
            'Monto Fijo',
            'Estacionalidad',
            'Notas',
        ];
    }

    public function title(): string
    {
        return 'Supuestos';
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font' => ['bold' => true, 'size' => 12],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => 'E2E8F0'],
                ],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ],
        ];
    }
}

/**
 * Scenario Comparison Sheet
 */
class ScenarioComparisonSheet implements FromCollection, ShouldAutoSize, WithHeadings, WithStyles, WithTitle
{
    public function __construct(protected Collection $scenarios, protected array $filters = []) {}

    public function collection(): Collection
    {
        $rows = collect();

        // Get all unique years across scenarios
        $years = $this->scenarios->flatMap(function ($scenario) {
            $query = $scenario->projections();

            if (! empty($this->filters['year'])) {
                $query->where('year', $this->filters['year']);
            }

            return $query->pluck('year');
        })->unique()->sort()->values();

        foreach ($years as $year) {
            $row = ['Año' => $year];

            foreach ($this->scenarios as $scenario) {
                $query = $scenario->projections()->where('year', $year);

                if (! empty($this->filters['customer_type_id'])) {
                    $query->where('customer_type_id', $this->filters['customer_type_id']);
                }

                if (! empty($this->filters['business_group_id'])) {
                    $query->where('business_group_id', $this->filters['business_group_id']);
                }

                $total = $query->sum('total_amount');
                $row[$scenario->name] = number_format($total, 2);
            }

            $rows->push($row);
        }

        return $rows;
    }

    public function headings(): array
    {
        $headings = ['Año'];

        foreach ($this->scenarios as $scenario) {
            $headings[] = $scenario->name;
        }

        return $headings;
    }

    public function title(): string
    {
        return 'Comparación de Escenarios';
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font' => ['bold' => true, 'size' => 12],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => 'E2E8F0'],
                ],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ],
        ];
    }
}

/**
 * Invoices Sheet
 */
class InvoicesSheet implements FromCollection, ShouldAutoSize, WithHeadings, WithStyles, WithTitle
{
    public function __construct(protected array $filters = []) {}

    public function collection(): Collection
    {
        $query = Invoice::query()->with(['customer.customerType', 'customer.businessGroup']);

        // Apply filters
        if (! empty($this->filters['customer_id'])) {
            $query->where('customer_id', $this->filters['customer_id']);
        }

        if (! empty($this->filters['status'])) {
            $query->where('status', $this->filters['status']);
        }

        if (! empty($this->filters['date_from'])) {
            $query->where('invoice_date', '>=', $this->filters['date_from']);
        }

        if (! empty($this->filters['date_to'])) {
            $query->where('invoice_date', '<=', $this->filters['date_to']);
        }

        if (! empty($this->filters['search'])) {
            $search = $this->filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $invoices = $query->latest('invoice_date')->get();

        return $invoices->map(function (Invoice $invoice) {
            return [
                'Número de Factura' => $invoice->invoice_number,
                'Cliente' => $invoice->customer->name,
                'Tipo de Cliente' => $invoice->customer->customerType?->name ?? 'N/A',
                'Grupo Empresarial' => $invoice->customer->businessGroup?->name ?? 'N/A',
                'Fecha de Factura' => $invoice->invoice_date->format('Y-m-d'),
                'Fecha de Vencimiento' => $invoice->due_date?->format('Y-m-d') ?? 'N/A',
                'Subtotal' => number_format($invoice->subtotal, 2),
                'IVA' => number_format($invoice->tax, 2),
                'Total' => number_format($invoice->total, 2),
                'Moneda' => $invoice->currency,
                'Estado' => match ($invoice->status) {
                    'draft' => 'Borrador',
                    'issued' => 'Emitida',
                    'paid' => 'Pagada',
                    'cancelled' => 'Cancelada',
                    default => $invoice->status,
                },
            ];
        });
    }

    public function headings(): array
    {
        return [
            'Número de Factura',
            'Cliente',
            'Tipo de Cliente',
            'Grupo Empresarial',
            'Fecha de Factura',
            'Fecha de Vencimiento',
            'Subtotal',
            'IVA',
            'Total',
            'Moneda',
            'Estado',
        ];
    }

    public function title(): string
    {
        return 'Facturas';
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font' => ['bold' => true, 'size' => 12],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => 'E2E8F0'],
                ],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ],
        ];
    }
}
