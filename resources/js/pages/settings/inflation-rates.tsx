import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/ui/page-header';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useConfirm } from '@/hooks/use-confirm';
import { useToast } from '@/hooks/use-toast';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { formatPercentage } from '@/lib/formatters';
import type { InflationRate } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Edit2, Plus, Save, Trash2, X } from 'lucide-react';
import { useState } from 'react';

interface Props {
    inflationRates: InflationRate[];
}

interface EditingRate {
    id?: number;
    year: number;
    rate: number;
    is_estimated: boolean;
    notes: string;
}

export default function InflationRatesPage({ inflationRates }: Props) {
    const [editingId, setEditingId] = useState<number | 'new' | null>(null);
    const [editForm, setEditForm] = useState<EditingRate>({
        year: new Date().getFullYear() + 1,
        rate: 0,
        is_estimated: true,
        notes: '',
    });
    const { confirm, ConfirmDialog } = useConfirm();
    const toast = useToast();

    const currentYear = new Date().getFullYear();

    const handleEdit = (rate: InflationRate) => {
        setEditingId(rate.id);
        setEditForm({
            id: rate.id,
            year: rate.year,
            rate: rate.rate,
            is_estimated: rate.is_estimated,
            notes: rate.notes || '',
        });
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditForm({
            year: new Date().getFullYear() + 1,
            rate: 0,
            is_estimated: true,
            notes: '',
        });
    };

    const handleSave = () => {
        // Validate
        if (!editForm.year || editForm.year < 2000 || editForm.year > 2100) {
            toast.error('Por favor ingresa un año válido (2000-2100)');
            return;
        }

        // Check for duplicate year (excluding current editing item)
        const isDuplicate = inflationRates.some(
            (r) => r.year === editForm.year && r.id !== editForm.id,
        );
        if (isDuplicate) {
            toast.error('Ya existe una tasa para este año');
            return;
        }

        router.post(
            '/api/inflation-rates',
            {
                year: editForm.year,
                rate: editForm.rate,
                is_estimated: editForm.is_estimated,
                notes: editForm.notes || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Tasa de inflación guardada exitosamente');
                    handleCancel();
                    router.reload({ only: ['inflationRates'] });
                },
                onError: (errors) => {
                    const errorMsg =
                        Object.values(errors)[0]?.toString() ||
                        'Error al guardar la tasa';
                    toast.error(errorMsg);
                },
            },
        );
    };

    const handleDelete = async (rate: InflationRate) => {
        const confirmed = await confirm({
            title: '¿Eliminar tasa de inflación?',
            description: `¿Estás seguro de que deseas eliminar la tasa del año ${rate.year}? Esta acción no se puede deshacer.`,
            confirmText: 'Eliminar',
            confirmVariant: 'destructive',
        });

        if (confirmed) {
            router.delete(`/api/inflation-rates/${rate.year}`, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Tasa eliminada exitosamente');
                    router.reload({ only: ['inflationRates'] });
                },
                onError: () => {
                    toast.error('No se pudo eliminar la tasa');
                },
            });
        }
    };

    const handleAddNew = () => {
        setEditingId('new');
        setEditForm({
            year: new Date().getFullYear() + 1,
            rate: 0,
            is_estimated: true,
            notes: '',
        });
    };

    const sortedRates = [...inflationRates].sort((a, b) => b.year - a.year);

    return (
        <AppSidebarLayout>
            <Head title="Tasas de Inflación" />

            <PageHeader
                title="Tasas de Inflación"
                subtitle="Gestiona las tasas de inflación por año"
                actions={
                    <Button
                        onClick={handleAddNew}
                        disabled={editingId !== null}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Agregar Año
                    </Button>
                }
            />

            <div className="space-y-4">
                <div className="rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-32">Año</TableHead>
                                <TableHead className="w-40">
                                    Tasa de Inflación
                                </TableHead>
                                <TableHead className="w-32">Estado</TableHead>
                                <TableHead>Notas</TableHead>
                                <TableHead className="w-32 text-right">
                                    Acciones
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {editingId === 'new' && (
                                <TableRow className="bg-muted/50">
                                    <TableCell>
                                        <Input
                                            type="number"
                                            value={editForm.year}
                                            onChange={(e) =>
                                                setEditForm({
                                                    ...editForm,
                                                    year: parseInt(
                                                        e.target.value,
                                                    ),
                                                })
                                            }
                                            min={2000}
                                            max={2100}
                                            className="w-28"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                value={editForm.rate}
                                                onChange={(e) =>
                                                    setEditForm({
                                                        ...editForm,
                                                        rate: parseFloat(
                                                            e.target.value,
                                                        ),
                                                    })
                                                }
                                                step={0.01}
                                                min={-100}
                                                max={1000}
                                                className="w-24"
                                            />
                                            <span className="text-sm text-muted-foreground">
                                                %
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id="new-estimated"
                                                checked={editForm.is_estimated}
                                                onCheckedChange={(checked) =>
                                                    setEditForm({
                                                        ...editForm,
                                                        is_estimated:
                                                            checked === true,
                                                    })
                                                }
                                            />
                                            <Label
                                                htmlFor="new-estimated"
                                                className="text-sm font-normal"
                                            >
                                                Estimado
                                            </Label>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Textarea
                                            value={editForm.notes}
                                            onChange={(e) =>
                                                setEditForm({
                                                    ...editForm,
                                                    notes: e.target.value,
                                                })
                                            }
                                            placeholder="Notas opcionales..."
                                            className="min-h-[60px]"
                                        />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                size="sm"
                                                onClick={handleSave}
                                                variant="default"
                                            >
                                                <Save className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={handleCancel}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}

                            {sortedRates.map((rate) => {
                                const isEditing = editingId === rate.id;
                                const isCurrentYear = rate.year === currentYear;

                                return (
                                    <TableRow
                                        key={rate.id}
                                        className={
                                            isEditing
                                                ? 'bg-muted/50'
                                                : isCurrentYear
                                                  ? 'bg-primary/5 dark:bg-primary/10'
                                                  : ''
                                        }
                                    >
                                        <TableCell>
                                            {isEditing ? (
                                                <Input
                                                    type="number"
                                                    value={editForm.year}
                                                    onChange={(e) =>
                                                        setEditForm({
                                                            ...editForm,
                                                            year: parseInt(
                                                                e.target.value,
                                                            ),
                                                        })
                                                    }
                                                    min={2000}
                                                    max={2100}
                                                    className="w-28"
                                                />
                                            ) : (
                                                <span
                                                    className={`font-semibold ${isCurrentYear ? 'text-primary' : ''}`}
                                                >
                                                    {rate.year}
                                                    {isCurrentYear && (
                                                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                                                            (Actual)
                                                        </span>
                                                    )}
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {isEditing ? (
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="number"
                                                        value={editForm.rate}
                                                        onChange={(e) =>
                                                            setEditForm({
                                                                ...editForm,
                                                                rate: parseFloat(
                                                                    e.target
                                                                        .value,
                                                                ),
                                                            })
                                                        }
                                                        step={0.01}
                                                        min={-100}
                                                        max={1000}
                                                        className="w-24"
                                                    />
                                                    <span className="text-sm text-muted-foreground">
                                                        %
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="font-mono">
                                                    {formatPercentage(
                                                        rate.rate / 100,
                                                    )}
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {isEditing ? (
                                                <div className="flex items-center gap-2">
                                                    <Checkbox
                                                        id={`edit-estimated-${rate.id}`}
                                                        checked={
                                                            editForm.is_estimated
                                                        }
                                                        onCheckedChange={(
                                                            checked,
                                                        ) =>
                                                            setEditForm({
                                                                ...editForm,
                                                                is_estimated:
                                                                    checked ===
                                                                    true,
                                                            })
                                                        }
                                                    />
                                                    <Label
                                                        htmlFor={`edit-estimated-${rate.id}`}
                                                        className="text-sm font-normal"
                                                    >
                                                        Estimado
                                                    </Label>
                                                </div>
                                            ) : (
                                                <Badge
                                                    variant={
                                                        rate.is_estimated
                                                            ? 'secondary'
                                                            : 'default'
                                                    }
                                                >
                                                    {rate.is_estimated
                                                        ? 'Estimado'
                                                        : 'Real'}
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {isEditing ? (
                                                <Textarea
                                                    value={editForm.notes}
                                                    onChange={(e) =>
                                                        setEditForm({
                                                            ...editForm,
                                                            notes: e.target
                                                                .value,
                                                        })
                                                    }
                                                    placeholder="Notas opcionales..."
                                                    className="min-h-[60px]"
                                                />
                                            ) : (
                                                <span className="text-sm text-muted-foreground">
                                                    {rate.notes || '-'}
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {isEditing ? (
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        onClick={handleSave}
                                                        variant="default"
                                                    >
                                                        <Save className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={handleCancel}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() =>
                                                            handleEdit(rate)
                                                        }
                                                        disabled={
                                                            editingId !== null
                                                        }
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() =>
                                                            handleDelete(rate)
                                                        }
                                                        disabled={
                                                            editingId !== null
                                                        }
                                                        className="text-red-600 hover:text-red-700 dark:text-red-400"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}

                            {sortedRates.length === 0 &&
                                editingId !== 'new' && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={5}
                                            className="h-24 text-center"
                                        >
                                            <p className="text-muted-foreground">
                                                No hay tasas de inflación
                                                registradas.
                                            </p>
                                            <p className="mt-2 text-sm text-muted-foreground">
                                                Haz clic en "Agregar Año" para
                                                comenzar.
                                            </p>
                                        </TableCell>
                                    </TableRow>
                                )}
                        </TableBody>
                    </Table>
                </div>

                <div className="rounded-lg border bg-muted/50 p-4">
                    <h3 className="mb-2 font-medium">Información</h3>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>
                            • Las tasas se guardan como porcentajes (ej: 3.5 =
                            3.5%)
                        </li>
                        <li>
                            • El año actual ({currentYear}) se resalta para
                            identificación rápida
                        </li>
                        <li>
                            • Marca "Estimado" para tasas proyectadas y desmarca
                            para tasas reales publicadas
                        </li>
                        <li>
                            • Solo puedes editar una tasa a la vez para evitar
                            conflictos
                        </li>
                    </ul>
                </div>
            </div>

            <ConfirmDialog />
        </AppSidebarLayout>
    );
}
