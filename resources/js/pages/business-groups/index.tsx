import { destroy } from '@/actions/App/Http/Controllers/BusinessGroupController';
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
import { index as businessGroupsIndex } from '@/routes/business-groups';
import type { BusinessGroup, PaginatedData } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface Props {
    businessGroups: PaginatedData<BusinessGroup>;
    filters: {
        search?: string;
    };
}

export default function BusinessGroupsIndex({
    businessGroups,
    filters,
}: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const { confirm, ConfirmDialog } = useConfirm();
    const toast = useToast();

    const handleFilter = () => {
        router.get(
            businessGroupsIndex.url(),
            {
                search: search || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleDelete = async (businessGroup: BusinessGroup) => {
        const confirmed = await confirm({
            title: '¿Eliminar grupo empresarial?',
            description: `¿Estás seguro de que deseas eliminar "${businessGroup.name}"? Esta acción no se puede deshacer.`,
            confirmText: 'Eliminar',
            confirmVariant: 'destructive',
        });

        if (confirmed) {
            router.delete(destroy.url(businessGroup.id), {
                onSuccess: () => {
                    toast.success(
                        'El grupo empresarial ha sido eliminado exitosamente.',
                        { title: 'Grupo empresarial eliminado' },
                    );
                },
                onError: () => {
                    toast.error('No se pudo eliminar el grupo empresarial.', {
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
            render: (businessGroup: BusinessGroup) => (
                <span className="font-mono text-sm">{businessGroup.code}</span>
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
            render: (businessGroup: BusinessGroup) => (
                <span className="text-sm text-muted-foreground">
                    {businessGroup.description || '-'}
                </span>
            ),
        },
        {
            key: 'actions',
            label: '',
            render: (businessGroup: BusinessGroup) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <Link
                                href={`/business-groups/${businessGroup.id}/edit`}
                            >
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => handleDelete(businessGroup)}
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
            <Head title="Grupos Empresariales" />

            <PageHeader
                title="Grupos Empresariales"
                subtitle="Gestiona los grupos empresariales del sistema"
                actions={
                    <Button asChild>
                        <Link href="/business-groups/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Nuevo Grupo
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

                <DataTable columns={columns} data={businessGroups.data} />
            </div>

            <ConfirmDialog />
        </AppSidebarLayout>
    );
}
