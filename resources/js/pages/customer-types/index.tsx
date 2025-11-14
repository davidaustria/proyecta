import { destroy } from '@/actions/App/Http/Controllers/CustomerTypeController';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { useConfirm } from '@/hooks/use-confirm';
import { useToast } from '@/hooks/use-toast';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { index as customerTypesIndex } from '@/routes/customer-types';
import type { CustomerType, PaginatedData } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface Props {
    customerTypes: PaginatedData<CustomerType>;
    filters: {
        search?: string;
    };
}

export default function CustomerTypesIndex({ customerTypes, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const { confirm, ConfirmDialog } = useConfirm();
    const toast = useToast();

    const handleFilter = () => {
        router.get(
            customerTypesIndex.url(),
            {
                search: search || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleDelete = async (customerType: CustomerType) => {
        const confirmed = await confirm({
            title: '¿Eliminar tipo de cliente?',
            description: `¿Estás seguro de que deseas eliminar "${customerType.name}"? Esta acción no se puede deshacer.`,
            confirmText: 'Eliminar',
            confirmVariant: 'destructive',
        });

        if (confirmed) {
            router.delete(destroy.url(customerType.id), {
                onSuccess: () => {
                    toast.success(
                        'El tipo de cliente ha sido eliminado exitosamente.',
                        { title: 'Tipo de cliente eliminado' },
                    );
                },
                onError: () => {
                    toast.error('No se pudo eliminar el tipo de cliente.', {
                        title: 'Error',
                    });
                },
            });
        }
    };

    const columns = [
        {
            key: 'code',
            label: 'Código',
            sortable: true,
            render: (_value: unknown, customerType: CustomerType) => (
                <span className="font-mono text-sm">{customerType.code}</span>
            ),
        },
        {
            key: 'name',
            label: 'Nombre',
            sortable: true,
        },
        {
            key: 'description',
            label: 'Descripción',
            render: (_value: unknown, customerType: CustomerType) => (
                <span className="text-sm text-muted-foreground">
                    {customerType.description || '-'}
                </span>
            ),
        },
        {
            key: 'actions',
            label: '',
            render: (_value: unknown, customerType: CustomerType) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <Link
                                href={`/customer-types/${customerType.id}/edit`}
                            >
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => handleDelete(customerType)}
                            className="text-red-600 dark:text-red-400"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    return (
        <AppSidebarLayout>
            <Head title="Tipos de Cliente" />

            <PageHeader
                title="Tipos de Cliente"
                subtitle="Gestiona los tipos de cliente del sistema"
                actions={
                    <Button asChild>
                        <Link href="/customer-types/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Nuevo Tipo
                        </Link>
                    </Button>
                }
            />

            <div className="space-y-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-end">
                    <div className="flex-1">
                        <Input
                            placeholder="Buscar por nombre o código..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleFilter();
                                }
                            }}
                        />
                    </div>

                    <Button onClick={handleFilter}>Filtrar</Button>
                </div>

                <DataTable columns={columns} data={customerTypes.data} />
            </div>

            <ConfirmDialog />
        </AppSidebarLayout>
    );
}
