import { destroy } from '@/actions/App/Http/Controllers/ProductController';
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
import { formatCurrency } from '@/lib/formatters';
import { index as productsIndex } from '@/routes/products';
import type { PaginatedData, Product } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface Props {
    products: PaginatedData<Product>;
    filters: {
        search?: string;
        active?: string;
    };
}

export default function ProductsIndex({ products, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [activeFilter, setActiveFilter] = useState(filters.active || 'all');
    const { confirm, ConfirmDialog } = useConfirm();
    const toast = useToast();

    const handleFilter = () => {
        router.get(
            productsIndex.url(),
            {
                search: search || undefined,
                active: activeFilter !== 'all' ? activeFilter : undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handlePageChange = (page: number) => {
        router.get(
            productsIndex.url(),
            {
                search: search || undefined,
                active: activeFilter !== 'all' ? activeFilter : undefined,
                page,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleDelete = async (product: Product) => {
        const confirmed = await confirm({
            title: '¿Eliminar producto?',
            description: `¿Estás seguro de que deseas eliminar "${product.name}"? Esta acción no se puede deshacer.`,
            confirmText: 'Eliminar',
            confirmVariant: 'destructive',
        });

        if (confirmed) {
            router.delete(destroy.url(product.id), {
                onSuccess: () => {
                    toast.success('Producto eliminado exitosamente');
                },
                onError: () => {
                    toast.error('No se pudo eliminar el producto');
                },
            });
        }
    };

    const columns = [
        {
            key: 'code',
            label: 'Código',
            sortable: true,
            render: (product: Product) => (
                <span className="font-mono text-sm">{product.code}</span>
            ),
        },
        {
            key: 'name',
            label: 'Nombre',
            sortable: true,
        },
        {
            key: 'unit_price',
            label: 'Precio Unitario',
            sortable: true,
            render: (product: Product) => (
                <span className="font-mono">
                    {product.unit_price
                        ? formatCurrency(product.unit_price)
                        : '-'}
                </span>
            ),
        },
        {
            key: 'is_active',
            label: 'Estado',
            render: (product: Product) => (
                <Badge variant={product.is_active ? 'default' : 'secondary'}>
                    {product.is_active ? 'Activo' : 'Inactivo'}
                </Badge>
            ),
        },
        {
            key: 'actions',
            label: '',
            render: (product: Product) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <Link href={`/products/${product.id}/edit`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => handleDelete(product)}
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
            <Head title="Productos" />

            <PageHeader
                title="Productos"
                subtitle="Gestiona los productos del sistema"
                actions={
                    <Button asChild>
                        <Link href="/products/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Nuevo Producto
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

                <DataTable
                    columns={columns}
                    data={products.data}
                    pagination={{
                        currentPage: products.current_page,
                        totalPages: products.last_page,
                        pageSize: products.per_page,
                        total: products.total,
                        onPageChange: handlePageChange,
                    }}
                />
            </div>

            <ConfirmDialog />
        </AppSidebarLayout>
    );
}
