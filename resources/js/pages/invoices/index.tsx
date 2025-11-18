import { ExportButton } from '@/components/reports/ExportButton';
import { DataTable } from '@/components/ui/data-table';
import { PageHeader } from '@/components/ui/page-header';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import {
    INVOICE_STATUS,
    INVOICE_STATUS_COLORS,
    INVOICE_STATUS_LABELS,
} from '@/lib/constants';
import { formatCurrency, formatDate } from '@/lib/formatters';
import {
    type BreadcrumbItem,
    type Customer,
    type Invoice,
    type PaginatedData,
} from '@/types';
import { Head, router } from '@inertiajs/react';
import { FileText } from 'lucide-react';
import * as React from 'react';

interface InvoicesIndexProps {
    invoices: PaginatedData<Invoice>;
    customers: Customer[];
    filters: {
        customer_id?: number;
        status?: string;
        search?: string;
        date_from?: string;
        date_to?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Facturas',
        href: '/invoices',
    },
];

export default function InvoicesIndex({
    invoices,
    customers,
    filters,
}: InvoicesIndexProps) {
    const [search, setSearch] = React.useState(filters.search ?? '');
    const [selectedCustomer, setSelectedCustomer] = React.useState<string>(
        filters.customer_id?.toString() ?? 'all',
    );
    const [selectedStatus, setSelectedStatus] = React.useState<string>(
        filters.status ?? 'all',
    );

    const handleFilterChange = () => {
        const params: Record<string, string | number> = {};

        if (search) params.search = search;
        if (selectedCustomer !== 'all')
            params.customer_id = Number(selectedCustomer);
        if (selectedStatus !== 'all') params.status = selectedStatus;

        router.visit('/invoices', {
            data: params as any,
            preserveState: true,
        });
    };

    const clearFilters = () => {
        setSearch('');
        setSelectedCustomer('all');
        setSelectedStatus('all');

        router.visit('/invoices', {
            preserveState: true,
        });
    };

    const columns = [
        {
            key: 'invoice_number',
            label: 'Número de Factura',
            render: (invoice: Invoice) => (
                <span className="font-medium">{invoice.invoice_number}</span>
            ),
        },
        {
            key: 'customer',
            label: 'Cliente',
            render: (invoice: Invoice) => invoice.customer?.name ?? 'N/A',
        },
        {
            key: 'invoice_date',
            label: 'Fecha',
            render: (invoice: Invoice) => formatDate(invoice.invoice_date),
        },
        {
            key: 'total',
            label: 'Total',
            render: (invoice: Invoice) =>
                formatCurrency(invoice.total, invoice.currency),
        },
        {
            key: 'status',
            label: 'Estado',
            render: (invoice: Invoice) => {
                const colorVariant = INVOICE_STATUS_COLORS[invoice.status];
                const colorClasses: Record<string, string> = {
                    default: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
                    secondary: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
                    destructive: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
                    outline: 'border bg-background text-foreground',
                };

                return (
                    <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            colorClasses[colorVariant] || 'bg-gray-100 text-gray-800'
                        }`}
                    >
                        {INVOICE_STATUS_LABELS[invoice.status]}
                    </span>
                );
            },
        },
    ];

    // Prepare export params
    const exportParams = React.useMemo(() => {
        const params: Record<string, unknown> = {};
        if (search) params.search = search;
        if (selectedCustomer !== 'all')
            params.customer_id = Number(selectedCustomer);
        if (selectedStatus !== 'all') params.status = selectedStatus;
        if (filters.date_from) params.date_from = filters.date_from;
        if (filters.date_to) params.date_to = filters.date_to;
        return params;
    }, [search, selectedCustomer, selectedStatus, filters]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Facturas" />

            <div className="flex flex-col gap-6 p-6">
                {/* Header */}
                <PageHeader
                    title="Facturas"
                    subtitle="Gestione y exporte las facturas del sistema"
                    actions={
                        <ExportButton
                            endpoint="/api/v1/reports/invoices"
                            params={exportParams}
                            filename={`facturas_${new Date().toISOString().split('T')[0]}.xlsx`}
                        />
                    }
                />

                {/* Filters */}
                <div className="flex flex-wrap items-end gap-4 rounded-lg border bg-card p-4">
                    <div className="flex-1 space-y-2">
                        <label className="text-sm font-medium">Búsqueda</label>
                        <input
                            type="text"
                            placeholder="Buscar por número o cliente..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-md border px-3 py-2"
                        />
                    </div>

                    <div className="w-full space-y-2 sm:w-48">
                        <label className="text-sm font-medium">Cliente</label>
                        <Select
                            value={selectedCustomer}
                            onValueChange={setSelectedCustomer}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                {customers.map((customer) => (
                                    <SelectItem
                                        key={customer.id}
                                        value={customer.id.toString()}
                                    >
                                        {customer.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="w-full space-y-2 sm:w-48">
                        <label className="text-sm font-medium">Estado</label>
                        <Select
                            value={selectedStatus}
                            onValueChange={setSelectedStatus}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                {Object.entries(INVOICE_STATUS_LABELS).map(
                                    ([value, label]) => (
                                        <SelectItem key={value} value={value}>
                                            {label}
                                        </SelectItem>
                                    ),
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={handleFilterChange}
                            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
                        >
                            Aplicar Filtros
                        </button>
                        <button
                            onClick={clearFilters}
                            className="rounded-md border px-4 py-2 text-sm hover:bg-accent"
                        >
                            Limpiar
                        </button>
                    </div>
                </div>

                {/* Table */}
                <DataTable
                    columns={columns}
                    data={invoices.data}
                    emptyState={{
                        icon: FileText,
                        title: 'No hay facturas',
                        description: 'No se encontraron facturas con los filtros seleccionados.',
                    }}
                />
            </div>
        </AppLayout>
    );
}
