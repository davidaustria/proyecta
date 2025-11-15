import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useConfirm } from '@/hooks/use-confirm';
import { useToast } from '@/hooks/use-toast';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { formatDateTime } from '@/lib/formatters';
import type { ImportBatch, PaginatedData } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Download, FileText, RefreshCw, Search, Upload } from 'lucide-react';
import { useState } from 'react';

interface Props {
    batches: PaginatedData<ImportBatch>;
    filters: {
        search?: string;
        status?: string;
        date_from?: string;
        date_to?: string;
    };
}

export default function ImportHistory({ batches, filters }: Props) {
    const toast = useToast();
    const confirm = useConfirm();
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'all');

    const handleFilter = () => {
        router.get(
            '/import/history',
            {
                search: search || undefined,
                status: status !== 'all' ? status : undefined,
            },
            { preserveState: true },
        );
    };

    const handleReset = () => {
        setSearch('');
        setStatus('all');
        router.get('/import/history', {}, { preserveState: true });
    };

    const handleViewDetails = (batch: ImportBatch) => {
        router.visit(`/import/history/${batch.id}`);
    };

    const handleDownloadErrorLog = async (batch: ImportBatch) => {
        if (!batch.error_log) {
            toast.error('No hay log de errores disponible');
            return;
        }

        try {
            const blob = new Blob([batch.error_log], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `import-errors-${batch.id}.txt`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success('Log de errores descargado');
        } catch (error) {
            toast.error('Error al descargar el log');
            console.error(error);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return <Badge variant="default">Completado</Badge>;
            case 'failed':
                return <Badge variant="destructive">Fallido</Badge>;
            case 'processing':
                return (
                    <Badge variant="outline" className="gap-1">
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        Procesando
                    </Badge>
                );
            case 'pending':
                return <Badge variant="outline">Pendiente</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const columns = [
        {
            key: 'filename',
            label: 'Archivo',
            sortable: true,
            render: (batch: ImportBatch) => (
                <div>
                    <p className="font-medium">{batch.filename}</p>
                    {batch.source_system && (
                        <p className="text-xs text-muted-foreground">
                            Origen: {batch.source_system}
                        </p>
                    )}
                </div>
            ),
        },
        {
            key: 'imported_at',
            label: 'Fecha de Importación',
            sortable: true,
            render: (batch: ImportBatch) => formatDateTime(batch.imported_at),
        },
        {
            key: 'status',
            label: 'Estado',
            render: (batch: ImportBatch) => getStatusBadge(batch.status),
        },
        {
            key: 'total_records',
            label: 'Registros',
            render: (batch: ImportBatch) => (
                <div className="space-y-1 text-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Total:</span>
                        <span className="font-medium">
                            {batch.total_records}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-green-600 dark:text-green-500">
                            Exitosos:
                        </span>
                        <span className="font-medium text-green-600 dark:text-green-500">
                            {batch.successful_records}
                        </span>
                    </div>
                    {batch.failed_records > 0 && (
                        <div className="flex items-center justify-between">
                            <span className="text-destructive">Fallidos:</span>
                            <span className="font-medium text-destructive">
                                {batch.failed_records}
                            </span>
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: 'success_rate',
            label: 'Tasa de Éxito',
            render: (batch: ImportBatch) => {
                const rate =
                    batch.total_records > 0
                        ? Math.round(
                              (batch.successful_records / batch.total_records) *
                                  100,
                          )
                        : 0;
                return (
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                            <div
                                className="h-full bg-green-500 transition-all"
                                style={{ width: `${rate}%` }}
                            />
                        </div>
                        <span className="text-sm font-medium">{rate}%</span>
                    </div>
                );
            },
        },
        {
            key: 'user',
            label: 'Importado por',
            render: (batch: ImportBatch) => batch.user?.name || 'Desconocido',
        },
    ];

    const actions = [
        {
            label: 'Ver detalles',
            icon: FileText,
            onClick: handleViewDetails,
        },
        {
            label: 'Descargar errores',
            icon: Download,
            onClick: handleDownloadErrorLog,
            show: (batch: ImportBatch) =>
                batch.failed_records > 0 && !!batch.error_log,
        },
    ];

    return (
        <AppSidebarLayout>
            <Head title="Historial de Importaciones" />

            <div className="space-y-6">
                <PageHeader
                    title="Historial de Importaciones"
                    subtitle="Consulta todas tus importaciones de facturas"
                    actions={
                        <Button
                            onClick={() => router.visit('/import/invoices')}
                        >
                            <Upload className="mr-2 h-4 w-4" />
                            Nueva Importación
                        </Button>
                    }
                />

                {/* Filters */}
                <div className="flex flex-wrap gap-4">
                    <div className="flex-1">
                        <Input
                            placeholder="Buscar por nombre de archivo..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleFilter();
                            }}
                            className="max-w-sm"
                        />
                    </div>
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">
                                Todos los estados
                            </SelectItem>
                            <SelectItem value="completed">
                                Completado
                            </SelectItem>
                            <SelectItem value="failed">Fallido</SelectItem>
                            <SelectItem value="processing">
                                Procesando
                            </SelectItem>
                            <SelectItem value="pending">Pendiente</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={handleFilter}>
                        <Search className="mr-2 h-4 w-4" />
                        Filtrar
                    </Button>
                    <Button variant="ghost" onClick={handleReset}>
                        Limpiar
                    </Button>
                </div>

                {/* Data Table */}
                <DataTable
                    data={batches.data}
                    columns={columns}
                    actions={actions}
                    pagination={{
                        currentPage: batches.current_page,
                        totalPages: batches.last_page,
                        pageSize: batches.per_page,
                        total: batches.total,
                        onPageChange: (page) => {
                            router.visit(`/import/history?page=${page}`, {
                                preserveState: true,
                                preserveScroll: true,
                            });
                        },
                    }}
                />
            </div>
        </AppSidebarLayout>
    );
}
