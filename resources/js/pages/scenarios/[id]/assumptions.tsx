import type { AssumptionFormData } from '@/components/scenarios/AssumptionForm';
import { AssumptionForm } from '@/components/scenarios/AssumptionForm';
import { CalculateProjectionsButton } from '@/components/scenarios/CalculateProjectionsButton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useConfirm } from '@/hooks/use-confirm';
import { useToast } from '@/hooks/use-toast';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import type {
    BusinessGroup,
    Customer,
    CustomerType,
    Product,
    Scenario,
    ScenarioAssumption,
} from '@/types';
import { Head, router } from '@inertiajs/react';
import { MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface Props {
    scenario: Scenario;
    assumptions: ScenarioAssumption[];
    customerTypes: CustomerType[];
    businessGroups: BusinessGroup[];
    customers: Customer[];
    products: Product[];
}

const HIERARCHY_LABELS = {
    global: 'Global',
    customer_type: 'Tipo de Cliente',
    business_group: 'Grupo Empresarial',
    customer: 'Cliente',
    product: 'Producto',
};

const HIERARCHY_COLORS: Record<
    ScenarioAssumption['hierarchy_level'],
    'default' | 'secondary' | 'destructive' | 'outline'
> = {
    global: 'default',
    customer_type: 'secondary',
    business_group: 'outline',
    customer: 'outline',
    product: 'outline',
};

export default function ScenarioAssumptions({
    scenario,
    assumptions,
    customerTypes,
    businessGroups,
    customers,
    products,
}: Props) {
    const toast = useToast();
    const { confirm, ConfirmDialog } = useConfirm();

    const [showForm, setShowForm] = useState(false);
    const [editingAssumption, setEditingAssumption] =
        useState<ScenarioAssumption | null>(null);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Generate available years based on scenario configuration
    const availableYears = Array.from(
        { length: scenario.projection_years },
        (_, i) => scenario.base_year + i + 1,
    );

    // Group assumptions by year
    const assumptionsByYear = assumptions.reduce(
        (acc, assumption) => {
            if (!acc[assumption.year]) {
                acc[assumption.year] = [];
            }
            acc[assumption.year].push(assumption);
            return acc;
        },
        {} as Record<number, ScenarioAssumption[]>,
    );

    const [currentYear, setCurrentYear] = useState<number>(
        availableYears[0] || scenario.base_year + 1,
    );

    const handleCreate = () => {
        setEditingAssumption(null);
        setShowForm(true);
        setErrors({});
    };

    const handleEdit = (assumption: ScenarioAssumption) => {
        setEditingAssumption(assumption);
        setShowForm(true);
        setErrors({});
    };

    const handleDelete = async (assumption: ScenarioAssumption) => {
        const dimensionName = getDimensionName(assumption);

        const confirmed = await confirm({
            title: '¿Eliminar supuesto?',
            description: `¿Estás seguro de que deseas eliminar el supuesto para ${dimensionName}? Esta acción invalidará las proyecciones existentes.`,
            confirmText: 'Eliminar',
            confirmVariant: 'destructive',
        });

        if (confirmed) {
            router.delete(`/api/v1/scenario-assumptions/${assumption.id}`, {
                onSuccess: () => {
                    toast.success(
                        'El supuesto ha sido eliminado exitosamente.',
                        {
                            title: 'Supuesto eliminado',
                        },
                    );
                },
                onError: () => {
                    toast.error('No se pudo eliminar el supuesto.', {
                        title: 'Error',
                    });
                },
            });
        }
    };

    const handleSubmit = (data: AssumptionFormData) => {
        setProcessing(true);

        if (editingAssumption) {
            // Update existing assumption
            router.put(
                `/api/v1/scenario-assumptions/${editingAssumption.id}`,
                data,
                {
                    onSuccess: () => {
                        toast.success(
                            'El supuesto ha sido actualizado exitosamente.',
                            {
                                title: 'Supuesto actualizado',
                            },
                        );
                        setShowForm(false);
                        setEditingAssumption(null);
                    },
                    onError: (errors) => {
                        setErrors(errors as Record<string, string>);
                        toast.error(
                            'Hubo un error al actualizar el supuesto. Verifica los campos.',
                            {
                                title: 'Error',
                            },
                        );
                    },
                    onFinish: () => {
                        setProcessing(false);
                    },
                },
            );
        } else {
            // Create new assumption
            router.post('/api/v1/scenario-assumptions', data, {
                onSuccess: () => {
                    toast.success('El supuesto ha sido creado exitosamente.', {
                        title: 'Supuesto creado',
                    });
                    setShowForm(false);
                },
                onError: (errors) => {
                    setErrors(errors as Record<string, string>);
                    toast.error(
                        'Hubo un error al crear el supuesto. Verifica los campos.',
                        {
                            title: 'Error',
                        },
                    );
                },
                onFinish: () => {
                    setProcessing(false);
                },
            });
        }
    };

    const getDimensionName = (assumption: ScenarioAssumption): string => {
        switch (assumption.hierarchy_level) {
            case 'global':
                return 'Todos (Global)';
            case 'customer_type':
                return assumption.customer_type?.name || 'Tipo de Cliente';
            case 'business_group':
                return assumption.business_group?.name || 'Grupo Empresarial';
            case 'customer':
                return assumption.customer?.name || 'Cliente';
            case 'product':
                return assumption.product?.name || 'Producto';
            default:
                return 'Desconocido';
        }
    };

    const formatRate = (rate?: number) => {
        if (rate === null || rate === undefined) return '-';
        return `${rate.toFixed(2)}%`;
    };

    return (
        <AppSidebarLayout>
            <Head title={`Supuestos: ${scenario.name}`} />

            <PageHeader
                title={`Supuestos: ${scenario.name}`}
                subtitle="Gestiona los supuestos de proyección para cada año"
                actions={
                    <div className="flex gap-2">
                        <CalculateProjectionsButton
                            scenario={scenario}
                            variant="outline"
                            onCalculationComplete={() => {
                                router.reload({ only: ['scenario'] });
                            }}
                        />
                        <Button onClick={handleCreate}>
                            <Plus className="mr-2 h-4 w-4" />
                            Nuevo Supuesto
                        </Button>
                    </div>
                }
            />

            <div className="space-y-4">
                <Tabs
                    value={currentYear.toString()}
                    onValueChange={(value: string) =>
                        setCurrentYear(parseInt(value))
                    }
                >
                    <TabsList>
                        {availableYears.map((year) => (
                            <TabsTrigger key={year} value={year.toString()}>
                                {year}
                                {assumptionsByYear[year] && (
                                    <Badge
                                        variant="secondary"
                                        className="ml-2 text-xs"
                                    >
                                        {assumptionsByYear[year].length}
                                    </Badge>
                                )}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {availableYears.map((year) => {
                        const yearAssumptions = assumptionsByYear[year] || [];

                        return (
                            <TabsContent key={year} value={year.toString()}>
                                {yearAssumptions.length === 0 ? (
                                    <EmptyState
                                        icon={Plus}
                                        title="No hay supuestos para este año"
                                        description="Crea el primer supuesto para comenzar a proyectar."
                                        action={{
                                            label: 'Crear Supuesto',
                                            onClick: handleCreate,
                                        }}
                                    />
                                ) : (
                                    <div className="rounded-md border">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b bg-muted/50">
                                                    <th className="p-3 text-left text-sm font-medium">
                                                        Nivel
                                                    </th>
                                                    <th className="p-3 text-left text-sm font-medium">
                                                        Dimensión
                                                    </th>
                                                    <th className="p-3 text-right text-sm font-medium">
                                                        Crecimiento
                                                    </th>
                                                    <th className="p-3 text-right text-sm font-medium">
                                                        Inflación
                                                    </th>
                                                    <th className="p-3 text-center text-sm font-medium">
                                                        Estacionalidad
                                                    </th>
                                                    <th className="p-3 text-right text-sm font-medium">
                                                        Acciones
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {yearAssumptions.map(
                                                    (assumption) => (
                                                        <tr
                                                            key={assumption.id}
                                                            className="hover:bg-muted/50"
                                                        >
                                                            <td className="p-3">
                                                                <Badge
                                                                    variant={
                                                                        HIERARCHY_COLORS[
                                                                            assumption
                                                                                .hierarchy_level
                                                                        ]
                                                                    }
                                                                >
                                                                    {
                                                                        HIERARCHY_LABELS[
                                                                            assumption
                                                                                .hierarchy_level
                                                                        ]
                                                                    }
                                                                </Badge>
                                                            </td>
                                                            <td className="p-3 text-sm">
                                                                {getDimensionName(
                                                                    assumption,
                                                                )}
                                                            </td>
                                                            <td className="p-3 text-right font-mono text-sm">
                                                                {formatRate(
                                                                    assumption.growth_rate,
                                                                )}
                                                            </td>
                                                            <td className="p-3 text-right font-mono text-sm">
                                                                {formatRate(
                                                                    assumption.inflation_rate,
                                                                )}
                                                            </td>
                                                            <td className="p-3 text-center text-sm">
                                                                {assumption.seasonality_factors &&
                                                                assumption
                                                                    .seasonality_factors
                                                                    .length ===
                                                                    12 ? (
                                                                    <Badge variant="outline">
                                                                        Sí
                                                                    </Badge>
                                                                ) : (
                                                                    <span className="text-muted-foreground">
                                                                        No
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="p-3 text-right">
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger
                                                                        asChild
                                                                    >
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                        >
                                                                            <MoreHorizontal className="h-4 w-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end">
                                                                        <DropdownMenuItem
                                                                            onClick={() =>
                                                                                handleEdit(
                                                                                    assumption,
                                                                                )
                                                                            }
                                                                        >
                                                                            <Pencil className="mr-2 h-4 w-4" />
                                                                            Editar
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem
                                                                            onClick={() =>
                                                                                handleDelete(
                                                                                    assumption,
                                                                                )
                                                                            }
                                                                            className="text-red-600 dark:text-red-400"
                                                                        >
                                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                                            Eliminar
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </td>
                                                        </tr>
                                                    ),
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </TabsContent>
                        );
                    })}
                </Tabs>
            </div>

            {/* Create/Edit Dialog */}
            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingAssumption
                                ? 'Editar Supuesto'
                                : 'Nuevo Supuesto'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingAssumption
                                ? 'Modifica los valores del supuesto.'
                                : 'Define los parámetros de proyección para este escenario.'}
                        </DialogDescription>
                    </DialogHeader>
                    <AssumptionForm
                        assumption={editingAssumption || undefined}
                        scenarioId={scenario.id}
                        availableYears={availableYears}
                        customerTypes={customerTypes}
                        businessGroups={businessGroups}
                        customers={customers}
                        products={products}
                        onSubmit={handleSubmit}
                        onCancel={() => {
                            setShowForm(false);
                            setEditingAssumption(null);
                            setErrors({});
                        }}
                        processing={processing}
                        errors={errors}
                    />
                </DialogContent>
            </Dialog>

            <ConfirmDialog />
        </AppSidebarLayout>
    );
}
