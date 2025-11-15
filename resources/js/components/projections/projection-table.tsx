import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, Download } from 'lucide-react';
import * as React from 'react';

export type GroupBy = 'customer_type' | 'business_group' | 'customer' | 'year';

export interface ProjectionTableRow {
    id: string | number;
    label: string;
    /**
     * Year columns (dynamic, e.g., { 2025: 1000000, 2026: 1200000 })
     */
    years: Record<number, number>;
    /**
     * Optional child rows for drill-down
     */
    children?: ProjectionTableRow[];
    /**
     * Metadata for additional info
     */
    metadata?: Record<string, any>;
}

export interface ProjectionTableProps {
    /**
     * Table data with hierarchical structure
     */
    data: ProjectionTableRow[];
    /**
     * Years to display as columns
     */
    years: number[];
    /**
     * How data is grouped
     */
    groupBy: GroupBy;
    /**
     * Currency code for formatting
     */
    currency?: string;
    /**
     * Whether to show totals row
     */
    showTotals?: boolean;
    /**
     * Whether rows are expandable
     */
    expandable?: boolean;
    /**
     * Handler for export action
     */
    onExport?: () => void;
    /**
     * Additional className
     */
    className?: string;
    /**
     * Handler when a row is clicked (drill-down navigation)
     */
    onRowClick?: (row: ProjectionTableRow) => void;
}

/**
 * Projection table with grouping, drill-down, and export functionality
 */
function ProjectionTable({
    data,
    years,
    groupBy,
    currency = 'MXN',
    showTotals = true,
    expandable = true,
    onExport,
    className,
    onRowClick,
}: ProjectionTableProps) {
    const [expandedRows, setExpandedRows] = React.useState<
        Set<string | number>
    >(new Set());

    const toggleRow = (id: string | number) => {
        setExpandedRows((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const calculateTotals = () => {
        const totals: Record<number, number> = {};
        years.forEach((year) => {
            totals[year] = data.reduce(
                (sum, row) => sum + (row.years[year] || 0),
                0,
            );
        });
        return totals;
    };

    const totals = showTotals ? calculateTotals() : null;

    const groupByLabels: Record<GroupBy, string> = {
        customer_type: 'Tipo de Cliente',
        business_group: 'Grupo Empresarial',
        customer: 'Cliente',
        year: 'Año',
    };

    const renderRow = (
        row: ProjectionTableRow,
        level: number = 0,
        parentExpanded: boolean = true,
    ) => {
        const isExpanded = expandedRows.has(row.id);
        const hasChildren = row.children && row.children.length > 0;
        const isClickable = onRowClick || (expandable && hasChildren);

        if (!parentExpanded) return null;

        return (
            <React.Fragment key={row.id}>
                <TableRow
                    className={cn(
                        isClickable && 'cursor-pointer hover:bg-muted/50',
                        level > 0 && 'bg-muted/20',
                    )}
                    onClick={() => {
                        if (hasChildren && expandable) {
                            toggleRow(row.id);
                        }
                        if (onRowClick) {
                            onRowClick(row);
                        }
                    }}
                >
                    <TableCell
                        className="font-medium"
                        style={{ paddingLeft: `${level * 2 + 1}rem` }}
                    >
                        <div className="flex items-center gap-2">
                            {hasChildren && expandable && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleRow(row.id);
                                    }}
                                    className="text-muted-foreground hover:text-foreground"
                                >
                                    {isExpanded ? (
                                        <ChevronDown className="size-4" />
                                    ) : (
                                        <ChevronRight className="size-4" />
                                    )}
                                </button>
                            )}
                            {row.label}
                        </div>
                    </TableCell>
                    {years.map((year) => (
                        <TableCell key={year} className="text-right">
                            {formatCurrency(row.years[year] || 0, currency)}
                        </TableCell>
                    ))}
                </TableRow>

                {/* Render children if expanded */}
                {hasChildren &&
                    row.children!.map((child) =>
                        renderRow(child, level + 1, isExpanded),
                    )}
            </React.Fragment>
        );
    };

    return (
        <div className={cn('w-full', className)}>
            {/* Header with export button */}
            {onExport && (
                <div className="mb-4 flex justify-end">
                    <Button variant="outline" size="sm" onClick={onExport}>
                        <Download className="mr-2 size-4" />
                        Exportar a Excel
                    </Button>
                </div>
            )}

            {/* Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-1/3">
                                {groupByLabels[groupBy]}
                            </TableHead>
                            {years.map((year) => (
                                <TableHead key={year} className="text-right">
                                    {year}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={years.length + 1}
                                    className="h-24 text-center"
                                >
                                    <p className="text-muted-foreground">
                                        No hay datos para mostrar
                                    </p>
                                </TableCell>
                            </TableRow>
                        ) : (
                            <>
                                {data.map((row) => renderRow(row, 0, true))}

                                {/* Totals row */}
                                {totals && (
                                    <TableRow className="border-t-2 bg-muted/50 font-semibold">
                                        <TableCell>Total</TableCell>
                                        {years.map((year) => (
                                            <TableCell
                                                key={year}
                                                className="text-right"
                                            >
                                                {formatCurrency(
                                                    totals[year] || 0,
                                                    currency,
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                )}
                            </>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

export { ProjectionTable };
