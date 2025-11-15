import { Head, router } from '@inertiajs/react';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    ArrowLeft,
    Download,
    FileText,
    CheckCircle2,
    XCircle,
    Clock,
    User,
    Calendar,
} from 'lucide-react';
import type { ImportBatch, Invoice, PaginatedData } from '@/types';
import { formatDateTime, formatCurrency } from '@/lib/formatters';
import { useToast } from '@/hooks/use-toast';

interface Props {
    batch: ImportBatch;
    invoices: PaginatedData<Invoice>;
}

export default function ImportDetail({ batch, invoices }: Props) {
    const toast = useToast();

    const handleDownloadErrorLog = () => {
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
                return (
                    <Badge variant="default" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Completado
                    </Badge>
                );
            case 'failed':
                return (
                    <Badge variant="destructive" className="gap-1">
                        <XCircle className="h-3 w-3" />
                        Fallido
                    </Badge>
                );
            case 'processing':
                return (
                    <Badge variant="outline" className="gap-1">
                        <Clock className="h-3 w-3" />
                        Procesando
                    </Badge>
                );
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const successRate =
        batch.total_records > 0
            ? Math.round(
                  (batch.successful_records / batch.total_records) * 100,
              )
            : 0;

    const columns = [
        {
            key: 'invoice_number',
            label: 'Número de Factura',
            sortable: true,
            render: (invoice: Invoice) => (
                <span className="font-mono">{invoice.invoice_number}</span>
            ),
        },
        {
            key: 'customer',
            label: 'Cliente',
            render: (invoice: Invoice) => (
                <div>
                    <p className="font-medium">
                        {invoice.customer?.name || 'Desconocido'}
                    </p>
                    {invoice.customer?.code && (
                        <p className="text-xs text-muted-foreground">
                            {invoice.customer.code}
                        </p>
                    )}
                </div>
            ),
        },
        {
            key: 'invoice_date',
            label: 'Fecha',
            sortable: true,
            render: (invoice: Invoice) =>
                new Date(invoice.invoice_date).toLocaleDateString('es-MX'),
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
                const statusMap: Record<string, string> = {
                    draft: 'Borrador',
                    issued: 'Emitida',
                    paid: 'Pagada',
                    cancelled: 'Cancelada',
                };
                return (
                    <Badge variant="outline">
                        {statusMap[invoice.status] || invoice.status}
                    </Badge>
                );
            },
        },
    ];

    return (
        <AppSidebarLayout>
            <Head title={`Importación: ${batch.filename}`} />

            <div className="space-y-6">
                <PageHeader
                    title="Detalle de Importación"
                    subtitle={batch.filename}
                    actions={
                        <div className="flex gap-2">
                            {batch.failed_records > 0 && batch.error_log && (
                                <Button
                                    variant="outline"
                                    onClick={handleDownloadErrorLog}
                                >
                                    <Download className="mr-2 h-4 w-4" />
                                    Descargar Errores
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                onClick={() => router.visit('/import/history')}
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Volver al Historial
                            </Button>
                        </div>
                    }
                />

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total de Registros
                            </CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {batch.total_records}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Exitosos
                            </CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600 dark:text-green-500">
                                {batch.successful_records}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Fallidos
                            </CardTitle>
                            <XCircle className="h-4 w-4 text-destructive" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-destructive">
                                {batch.failed_records}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Tasa de Éxito
                            </CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {successRate}%
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Import Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Información de la Importación</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <dt className="text-sm font-medium text-muted-foreground">
                                    Estado
                                </dt>
                                <dd className="mt-1">
                                    {getStatusBadge(batch.status)}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-muted-foreground">
                                    Fecha de Importación
                                </dt>
                                <dd className="mt-1 flex items-center gap-2 text-sm">
                                    <Calendar className="h-4 w-4" />
                                    {formatDateTime(batch.imported_at)}
                                </dd>
                            </div>
                            {batch.source_system && (
                                <div>
                                    <dt className="text-sm font-medium text-muted-foreground">
                                        Sistema Origen
                                    </dt>
                                    <dd className="mt-1 text-sm">
                                        {batch.source_system}
                                    </dd>
                                </div>
                            )}
                            <div>
                                <dt className="text-sm font-medium text-muted-foreground">
                                    Importado por
                                </dt>
                                <dd className="mt-1 flex items-center gap-2 text-sm">
                                    <User className="h-4 w-4" />
                                    {batch.user?.name || 'Desconocido'}
                                </dd>
                            </div>
                        </dl>
                    </CardContent>
                </Card>

                {/* Error Log */}
                {batch.failed_records > 0 && batch.error_log && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Log de Errores</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="max-h-64 overflow-y-auto rounded-lg bg-muted p-4 font-mono text-xs">
                                <pre className="whitespace-pre-wrap text-destructive">
                                    {batch.error_log}
                                </pre>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Imported Invoices */}
                <Card>
                    <CardHeader>
                        <CardTitle>
                            Facturas Importadas ({invoices.total})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <DataTable
                            data={invoices.data}
                            columns={columns}
                            pagination={{
                                currentPage: invoices.current_page,
                                totalPages: invoices.last_page,
                                pageSize: invoices.per_page,
                                total: invoices.total,
                                onPageChange: (page) => {
                                    router.visit(`/import/history/${batch.id}?page=${page}`, {
                                        preserveState: true,
                                        preserveScroll: true,
                                    });
                                },
                            }}
                        />
                    </CardContent>
                </Card>
            </div>
        </AppSidebarLayout>
    );
}
