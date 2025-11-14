import { destroy } from '@/actions/App/Http/Controllers/CustomerController';
import { Badge } from '@/components/ui/badge';
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
import { index as customersIndex } from '@/routes/customers';
import type {
    BusinessGroup,
    Customer,
    CustomerType,
    PaginatedData,
} from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Eye, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface Props {
    customers: PaginatedData<Customer>;
    customerTypes: CustomerType[];
    businessGroups: BusinessGroup[];
    filters: {
        search?: string;
        type?: string;
        group?: string;
        active?: string;
    };
}

export default function CustomersIndex({
    customers,
    customerTypes,
    businessGroups,
    filters,
}: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [typeFilter, setTypeFilter] = useState(filters.type || 'all');
    const [groupFilter, setGroupFilter] = useState(filters.group || 'all');
    const [activeFilter, setActiveFilter] = useState(filters.active || 'all');
    const { confirm, ConfirmDialog } = useConfirm();
    const toast = useToast();

    const handleFilter = () => {
        router.get(
            customersIndex.url(),
            {
                search: search || undefined,
                type: typeFilter !== 'all' ? typeFilter : undefined,
                group: groupFilter !== 'all' ? groupFilter : undefined,
                active: activeFilter !== 'all' ? activeFilter : undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleDelete = async (customer: Customer) => {
        const confirmed = await confirm({
            title: '¿Eliminar cliente?',
            description: `¿Estás seguro de que deseas eliminar a "${customer.name}"? Esta acción no se puede deshacer.`,
            confirmText: 'Eliminar',
            confirmVariant: 'destructive',
        });

        if (confirmed) {
            router.delete(destroy.url(customer.id), {
                onSuccess: () => {
                    toast.success(
                        'El cliente ha sido eliminado exitosamente.',
                        {
                            title: 'Cliente eliminado',
                        },
                    );
                },
                onError: () => {
                    toast.error('No se pudo eliminar el cliente.', {
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
            render: (_value: unknown, customer: Customer) => (
                <span className="font-mono text-sm">{customer.code}</span>
            ),
        },
        {
            key: 'name',
            label: 'Nombre',
            sortable: true,
        },
        {
            key: 'tax_id',
            label: 'RFC',
            render: (_value: unknown, customer: Customer) => (
                <span className="font-mono text-sm">
                    {customer.tax_id || '-'}
                </span>
            ),
        },
        {
            key: 'customer_type',
            label: 'Tipo',
            render: (_value: unknown, customer: Customer) => (
                <span className="text-sm">
                    {customer.customer_type?.name || '-'}
                </span>
            ),
        },
        {
            key: 'business_group',
            label: 'Grupo Empresarial',
            render: (_value: unknown, customer: Customer) => (
                <span className="text-sm">
                    {customer.business_group?.name || '-'}
                </span>
            ),
        },
        {
            key: 'is_active',
            label: 'Estado',
            render: (_value: unknown, customer: Customer) => (
                <Badge variant={customer.is_active ? 'default' : 'secondary'}>
                    {customer.is_active ? 'Activo' : 'Inactivo'}
                </Badge>
            ),
        },
        {
            key: 'actions',
            label: '',
            render: (_value: unknown, customer: Customer) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <Link href={`/customers/${customer.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver detalle
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href={`/customers/${customer.id}/edit`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => handleDelete(customer)}
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
            <Head title="Clientes" />

            <PageHeader
                title="Clientes"
                subtitle="Gestiona los clientes del sistema"
                actions={
                    <Button asChild>
                        <Link href="/customers/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Nuevo Cliente
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

                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-full md:w-48">
                            <SelectValue placeholder="Tipo de cliente" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los tipos</SelectItem>
                            {customerTypes.map((type) => (
                                <SelectItem
                                    key={type.id}
                                    value={type.id.toString()}
                                >
                                    {type.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={groupFilter} onValueChange={setGroupFilter}>
                        <SelectTrigger className="w-full md:w-48">
                            <SelectValue placeholder="Grupo empresarial" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">
                                Todos los grupos
                            </SelectItem>
                            {businessGroups.map((group) => (
                                <SelectItem
                                    key={group.id}
                                    value={group.id.toString()}
                                >
                                    {group.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={activeFilter}
                        onValueChange={setActiveFilter}
                    >
                        <SelectTrigger className="w-full md:w-32">
                            <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="1">Activos</SelectItem>
                            <SelectItem value="0">Inactivos</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button onClick={handleFilter}>Filtrar</Button>
                </div>

                <DataTable columns={columns} data={customers.data} />
            </div>

            <ConfirmDialog />
        </AppSidebarLayout>
    );
}
