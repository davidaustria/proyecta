import { DuplicateScenarioDialog } from '@/components/scenarios/DuplicateScenarioDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
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
import {
    CALCULATION_METHOD_LABELS,
    SCENARIO_STATUS_COLORS,
    SCENARIO_STATUS_LABELS,
} from '@/lib/constants';
import { formatDate } from '@/lib/formatters';
import type { PaginatedData, Scenario, User } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    Calculator,
    Copy,
    GitCompare,
    MoreHorizontal,
    Pencil,
    Plus,
    Settings,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';

interface Props {
    scenarios: PaginatedData<Scenario>;
    users: User[];
    filters: {
        search?: string;
        status?: string;
        baseline?: string;
        user?: string;
    };
}

export default function ScenariosIndex({ scenarios, users, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [baselineFilter, setBaselineFilter] = useState(
        filters.baseline || 'all',
    );
    const [userFilter, setUserFilter] = useState(filters.user || 'all');
    const [duplicatingScenario, setDuplicatingScenario] =
        useState<Scenario | null>(null);
    const { confirm, ConfirmDialog } = useConfirm();
    const toast = useToast();

    const handleFilter = () => {
        router.get(
            '/scenarios',
            {
                search: search || undefined,
                status: statusFilter !== 'all' ? statusFilter : undefined,
                baseline: baselineFilter !== 'all' ? baselineFilter : undefined,
                user: userFilter !== 'all' ? userFilter : undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleDuplicate = (scenario: Scenario) => {
        setDuplicatingScenario(scenario);
    };

    const handleCalculate = async (scenario: Scenario) => {
        const hasProjections = (scenario.projections_count ?? 0) > 0;

        const confirmed = await confirm({
            title: '¿Calcular proyecciones?',
            description: hasProjections
                ? `Este escenario ya tiene ${scenario.projections_count} proyecciones calculadas. Si continúas, se recalcularán todas las proyecciones. ¿Deseas continuar?`
                : `Se calcularán las proyecciones para "${scenario.name}" basadas en los supuestos configurados. Este proceso puede tardar varios segundos.`,
            confirmText: 'Calcular',
        });

        if (confirmed) {
            router.post(
                `/api/v1/scenarios/${scenario.id}/calculate`,
                {},
                {
                    onSuccess: () => {
                        toast.success(
                            'Las proyecciones han sido calculadas exitosamente.',
                            {
                                title: 'Cálculo completado',
                            },
                        );
                    },
                    onError: () => {
                        toast.error(
                            'No se pudieron calcular las proyecciones.',
                            {
                                title: 'Error',
                            },
                        );
                    },
                },
            );
        }
    };

    const handleDelete = async (scenario: Scenario) => {
        const confirmed = await confirm({
            title: '¿Eliminar escenario?',
            description: `¿Estás seguro de que deseas eliminar "${scenario.name}"? Se eliminarán también todos los supuestos y proyecciones asociadas. Esta acción no se puede deshacer.`,
            confirmText: 'Eliminar',
            confirmVariant: 'destructive',
        });

        if (confirmed) {
            router.delete(`/api/v1/scenarios/${scenario.id}`, {
                onSuccess: () => {
                    toast.success(
                        'El escenario ha sido eliminado exitosamente.',
                        {
                            title: 'Escenario eliminado',
                        },
                    );
                },
                onError: () => {
                    toast.error('No se pudo eliminar el escenario.', {
                        title: 'Error',
                    });
                },
            });
        }
    };

    const columns = [
        {
            key: 'name',
            label: 'Nombre',
            sortable: true,
            render: (_value: unknown, scenario: Scenario) => (
                <div className="flex flex-col gap-1">
                    <span className="font-medium">{scenario.name}</span>
                    {scenario.description && (
                        <span className="text-xs text-muted-foreground">
                            {scenario.description}
                        </span>
                    )}
                </div>
            ),
        },
        {
            key: 'status',
            label: 'Estado',
            render: (_value: unknown, scenario: Scenario) => (
                <div className="flex items-center gap-2">
                    <Badge variant={SCENARIO_STATUS_COLORS[scenario.status]}>
                        {SCENARIO_STATUS_LABELS[scenario.status]}
                    </Badge>
                    {scenario.is_baseline && (
                        <Badge variant="outline" className="text-xs">
                            Línea Base
                        </Badge>
                    )}
                </div>
            ),
        },
        {
            key: 'base_year',
            label: 'Año Base',
            sortable: true,
            render: (_value: unknown, scenario: Scenario) => (
                <span className="font-mono text-sm">{scenario.base_year}</span>
            ),
        },
        {
            key: 'projection_years',
            label: 'Años de Proyección',
            render: (_value: unknown, scenario: Scenario) => (
                <span className="text-sm">
                    {scenario.projection_years}{' '}
                    {scenario.projection_years === 1 ? 'año' : 'años'}
                </span>
            ),
        },
        {
            key: 'calculation_method',
            label: 'Método de Cálculo',
            render: (_value: unknown, scenario: Scenario) => (
                <span className="text-sm">
                    {CALCULATION_METHOD_LABELS[scenario.calculation_method]}
                </span>
            ),
        },
        {
            key: 'user',
            label: 'Creado por',
            render: (_value: unknown, scenario: Scenario) => (
                <span className="text-sm">{scenario.user.name || '-'}</span>
            ),
        },
        {
            key: 'stats',
            label: 'Estadísticas',
            render: (_value: unknown, scenario: Scenario) => (
                <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                    <span>
                        {scenario.assumptions_count ?? 0} supuesto
                        {scenario.assumptions_count !== 1 ? 's' : ''}
                    </span>
                    <span>
                        {scenario.projections_count ?? 0} proyección
                        {scenario.projections_count !== 1 ? 'es' : ''}
                    </span>
                </div>
            ),
        },
        {
            key: 'created_at',
            label: 'Fecha de Creación',
            sortable: true,
            render: (_value: unknown, scenario: Scenario) => (
                <span className="text-sm">
                    {formatDate(scenario.created_at, 'short')}
                </span>
            ),
        },
        {
            key: 'actions',
            label: '',
            render: (_value: unknown, scenario: Scenario) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <Link
                                href={`/scenarios/${scenario.id}/assumptions`}
                            >
                                <Settings className="mr-2 h-4 w-4" />
                                Gestionar supuestos
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href={`/scenarios/${scenario.id}/edit`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => handleDuplicate(scenario)}
                        >
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => handleCalculate(scenario)}
                        >
                            <Calculator className="mr-2 h-4 w-4" />
                            Calcular proyecciones
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link
                                href={`/scenarios/compare?ids=${scenario.id}`}
                            >
                                <GitCompare className="mr-2 h-4 w-4" />
                                Comparar con otros
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => handleDelete(scenario)}
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
            <Head title="Escenarios de Proyección" />

            <PageHeader
                title="Escenarios de Proyección"
                subtitle="Gestiona los escenarios y proyecciones de ingresos"
                actions={
                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <Link href="/scenarios/compare">
                                <GitCompare className="mr-2 h-4 w-4" />
                                Comparar escenarios
                            </Link>
                        </Button>
                        <Button asChild>
                            <Link href="/scenarios/create">
                                <Plus className="mr-2 h-4 w-4" />
                                Nuevo Escenario
                            </Link>
                        </Button>
                    </div>
                }
            />

            <div className="space-y-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-end">
                    <div className="flex-1">
                        <Input
                            placeholder="Buscar por nombre..."
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
                        value={statusFilter}
                        onValueChange={setStatusFilter}
                    >
                        <SelectTrigger className="w-full md:w-48">
                            <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">
                                Todos los estados
                            </SelectItem>
                            <SelectItem value="draft">Borrador</SelectItem>
                            <SelectItem value="active">Activo</SelectItem>
                            <SelectItem value="archived">Archivado</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        value={baselineFilter}
                        onValueChange={setBaselineFilter}
                    >
                        <SelectTrigger className="w-full md:w-48">
                            <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="1">Solo línea base</SelectItem>
                            <SelectItem value="0">Solo alternativas</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={userFilter} onValueChange={setUserFilter}>
                        <SelectTrigger className="w-full md:w-48">
                            <SelectValue placeholder="Usuario" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">
                                Todos los usuarios
                            </SelectItem>
                            {users.map((user) => (
                                <SelectItem
                                    key={user.id}
                                    value={user.id.toString()}
                                >
                                    {user.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button onClick={handleFilter}>Filtrar</Button>
                </div>

                <DataTable columns={columns} data={scenarios.data} />
            </div>

            <ConfirmDialog />

            {duplicatingScenario && (
                <DuplicateScenarioDialog
                    scenario={duplicatingScenario}
                    open={true}
                    onOpenChange={(open) => {
                        if (!open) setDuplicatingScenario(null);
                    }}
                    onDuplicationComplete={() => {
                        router.reload({ only: ['scenarios'] });
                    }}
                />
            )}
        </AppSidebarLayout>
    );
}
