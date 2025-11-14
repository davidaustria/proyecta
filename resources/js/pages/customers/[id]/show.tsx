import { destroy } from '@/actions/App/Http/Controllers/CustomerController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { useConfirm } from '@/hooks/use-confirm';
import { useToast } from '@/hooks/use-toast';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { formatDate } from '@/lib/formatters';
import { index as customersIndex } from '@/routes/customers';
import type { Customer } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Building2,
    Calendar,
    FileText,
    Pencil,
    Trash2,
} from 'lucide-react';

interface Props {
    customer: Customer;
}

export default function ShowCustomer({ customer }: Props) {
    const { confirm, ConfirmDialog } = useConfirm();
    const { success, error } = useToast();

    const handleDelete = async () => {
        const confirmed = await confirm({
            title: '¿Eliminar cliente?',
            description: `¿Estás seguro de que deseas eliminar a "${customer.name}"? Esta acción no se puede deshacer.`,
            confirmText: 'Eliminar',
            confirmVariant: 'destructive',
        });

        if (confirmed) {
            router.delete(destroy.url(customer.id), {
                onSuccess: () => {
                    success('Cliente eliminado exitosamente');
                    router.visit(customersIndex.url());
                },
                onError: () => {
                    error('No se pudo eliminar el cliente');
                },
            });
        }
    };

    return (
        <AppSidebarLayout>
            <Head title={customer.name} />

            <div className="space-y-6">
                <PageHeader
                    title={customer.name}
                    subtitle={`Código: ${customer.code}`}
                    breadcrumbs={[
                        { label: 'Clientes', href: customersIndex.url() },
                        { label: customer.name },
                    ]}
                    actions={
                        <div className="flex items-center gap-2">
                            <Button variant="outline" asChild>
                                <Link href={customersIndex.url()}>
                                    <ArrowLeft className="h-4 w-4" />
                                    Volver
                                </Link>
                            </Button>
                            <Button variant="outline" asChild>
                                <Link href={`/customers/${customer.id}/edit`}>
                                    <Pencil className="h-4 w-4" />
                                    Editar
                                </Link>
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleDelete}
                            >
                                <Trash2 className="h-4 w-4" />
                                Eliminar
                            </Button>
                        </div>
                    }
                />

                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Información General
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <dl className="space-y-4">
                                <div>
                                    <dt className="text-sm font-medium text-muted-foreground">
                                        Nombre
                                    </dt>
                                    <dd className="mt-1 text-sm">
                                        {customer.name}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-muted-foreground">
                                        Código
                                    </dt>
                                    <dd className="mt-1 font-mono text-sm">
                                        {customer.code}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-muted-foreground">
                                        RFC
                                    </dt>
                                    <dd className="mt-1 font-mono text-sm">
                                        {customer.tax_id || '-'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-muted-foreground">
                                        Estado
                                    </dt>
                                    <dd className="mt-1">
                                        <Badge
                                            variant={
                                                customer.is_active
                                                    ? 'default'
                                                    : 'secondary'
                                            }
                                        >
                                            {customer.is_active
                                                ? 'Activo'
                                                : 'Inactivo'}
                                        </Badge>
                                    </dd>
                                </div>
                            </dl>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5" />
                                Clasificación
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <dl className="space-y-4">
                                <div>
                                    <dt className="text-sm font-medium text-muted-foreground">
                                        Tipo de Cliente
                                    </dt>
                                    <dd className="mt-1 text-sm">
                                        {customer.customer_type?.name || '-'}
                                    </dd>
                                    {customer.customer_type?.description && (
                                        <dd className="mt-1 text-xs text-muted-foreground">
                                            {customer.customer_type.description}
                                        </dd>
                                    )}
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-muted-foreground">
                                        Grupo Empresarial
                                    </dt>
                                    <dd className="mt-1 text-sm">
                                        {customer.business_group?.name || '-'}
                                    </dd>
                                    {customer.business_group?.description && (
                                        <dd className="mt-1 text-xs text-muted-foreground">
                                            {
                                                customer.business_group
                                                    .description
                                            }
                                        </dd>
                                    )}
                                </div>
                                {customer.invoices_count !== undefined && (
                                    <div>
                                        <dt className="text-sm font-medium text-muted-foreground">
                                            Facturas
                                        </dt>
                                        <dd className="mt-1 text-sm">
                                            {customer.invoices_count} factura
                                            {customer.invoices_count !== 1
                                                ? 's'
                                                : ''}
                                        </dd>
                                    </div>
                                )}
                            </dl>
                        </CardContent>
                    </Card>

                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Información de Auditoría
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <dl className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <dt className="text-sm font-medium text-muted-foreground">
                                        Fecha de Creación
                                    </dt>
                                    <dd className="mt-1 text-sm">
                                        {formatDate(
                                            customer.created_at,
                                            'long',
                                        )}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-muted-foreground">
                                        Última Actualización
                                    </dt>
                                    <dd className="mt-1 text-sm">
                                        {formatDate(
                                            customer.updated_at,
                                            'long',
                                        )}
                                    </dd>
                                </div>
                            </dl>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <ConfirmDialog />
        </AppSidebarLayout>
    );
}
