import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
    CALCULATION_METHOD,
    CALCULATION_METHOD_DESCRIPTIONS,
    CALCULATION_METHOD_LABELS,
    DEFAULT_HISTORICAL_MONTHS,
    DEFAULT_PROJECTION_YEARS,
    MAX_PROJECTION_YEARS,
    MIN_HISTORICAL_MONTHS,
    SCENARIO_STATUS,
    SCENARIO_STATUS_LABELS,
} from '@/lib/constants';
import type { Scenario } from '@/types';
import { useState } from 'react';

interface ScenarioFormProps {
    scenario?: Scenario;
    onSubmit: (data: ScenarioFormData) => void;
    processing?: boolean;
    errors?: Record<string, string>;
}

export interface ScenarioFormData extends Record<string, any> {
    name: string;
    description?: string;
    base_year: number;
    historical_months: number;
    projection_years: number;
    status: 'draft' | 'active' | 'archived';
    is_baseline: boolean;
    calculation_method: 'simple_average' | 'weighted_average' | 'trend';
    include_inflation: boolean;
}

export function ScenarioForm({
    scenario,
    onSubmit,
    processing = false,
    errors = {},
}: ScenarioFormProps) {
    const currentYear = new Date().getFullYear();

    const [formData, setFormData] = useState<ScenarioFormData>({
        name: scenario?.name || '',
        description: scenario?.description || '',
        base_year: scenario?.base_year || currentYear,
        historical_months: scenario?.historical_months || DEFAULT_HISTORICAL_MONTHS,
        projection_years: scenario?.projection_years || DEFAULT_PROJECTION_YEARS,
        status: scenario?.status || SCENARIO_STATUS.DRAFT,
        is_baseline: scenario?.is_baseline || false,
        calculation_method: scenario?.calculation_method || CALCULATION_METHOD.SIMPLE_AVERAGE,
        include_inflation: scenario?.include_inflation ?? true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const handleChange = (
        field: keyof ScenarioFormData,
        value: string | number | boolean,
    ) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información Básica */}
            <div className="space-y-4">
                <div className="space-y-2">
                    <h3 className="text-lg font-medium">Información Básica</h3>
                    <p className="text-sm text-muted-foreground">
                        Ingresa la información general del escenario.
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="name">
                        Nombre <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        placeholder="Ej: Escenario Base 2025"
                        maxLength={255}
                        required
                    />
                    {errors.name && (
                        <p className="text-sm text-destructive">{errors.name}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) =>
                            handleChange('description', e.target.value)
                        }
                        placeholder="Breve descripción del escenario..."
                        maxLength={1000}
                        rows={3}
                    />
                    {errors.description && (
                        <p className="text-sm text-destructive">
                            {errors.description}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="base_year">
                        Año Base <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="base_year"
                        type="number"
                        value={formData.base_year}
                        onChange={(e) =>
                            handleChange('base_year', parseInt(e.target.value))
                        }
                        min={2000}
                        max={2100}
                        required
                    />
                    {errors.base_year && (
                        <p className="text-sm text-destructive">
                            {errors.base_year}
                        </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                        Año de referencia para el cálculo de proyecciones.
                    </p>
                </div>
            </div>

            {/* Configuración */}
            <div className="space-y-4">
                <div className="space-y-2">
                    <h3 className="text-lg font-medium">Configuración</h3>
                    <p className="text-sm text-muted-foreground">
                        Define los parámetros de cálculo del escenario.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="historical_months">
                            Meses Históricos{' '}
                            <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="historical_months"
                            type="number"
                            value={formData.historical_months}
                            onChange={(e) =>
                                handleChange(
                                    'historical_months',
                                    parseInt(e.target.value),
                                )
                            }
                            min={MIN_HISTORICAL_MONTHS}
                            max={60}
                            required
                        />
                        {errors.historical_months && (
                            <p className="text-sm text-destructive">
                                {errors.historical_months}
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Número de meses históricos a considerar (mínimo{' '}
                            {MIN_HISTORICAL_MONTHS}, máximo 60).
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="projection_years">
                            Años de Proyección{' '}
                            <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="projection_years"
                            type="number"
                            value={formData.projection_years}
                            onChange={(e) =>
                                handleChange(
                                    'projection_years',
                                    parseInt(e.target.value),
                                )
                            }
                            min={1}
                            max={MAX_PROJECTION_YEARS}
                            required
                        />
                        {errors.projection_years && (
                            <p className="text-sm text-destructive">
                                {errors.projection_years}
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Número de años a proyectar (máximo{' '}
                            {MAX_PROJECTION_YEARS}).
                        </p>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="calculation_method">
                        Método de Cálculo{' '}
                        <span className="text-destructive">*</span>
                    </Label>
                    <Select
                        value={formData.calculation_method}
                        onValueChange={(value) =>
                            handleChange(
                                'calculation_method',
                                value as ScenarioFormData['calculation_method'],
                            )
                        }
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={CALCULATION_METHOD.SIMPLE_AVERAGE}>
                                <div className="flex flex-col gap-1">
                                    <span>
                                        {
                                            CALCULATION_METHOD_LABELS[
                                                CALCULATION_METHOD.SIMPLE_AVERAGE
                                            ]
                                        }
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {
                                            CALCULATION_METHOD_DESCRIPTIONS[
                                                CALCULATION_METHOD.SIMPLE_AVERAGE
                                            ]
                                        }
                                    </span>
                                </div>
                            </SelectItem>
                            <SelectItem
                                value={CALCULATION_METHOD.WEIGHTED_AVERAGE}
                            >
                                <div className="flex flex-col gap-1">
                                    <span>
                                        {
                                            CALCULATION_METHOD_LABELS[
                                                CALCULATION_METHOD.WEIGHTED_AVERAGE
                                            ]
                                        }
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {
                                            CALCULATION_METHOD_DESCRIPTIONS[
                                                CALCULATION_METHOD.WEIGHTED_AVERAGE
                                            ]
                                        }
                                    </span>
                                </div>
                            </SelectItem>
                            <SelectItem value={CALCULATION_METHOD.TREND}>
                                <div className="flex flex-col gap-1">
                                    <span>
                                        {
                                            CALCULATION_METHOD_LABELS[
                                                CALCULATION_METHOD.TREND
                                            ]
                                        }
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {
                                            CALCULATION_METHOD_DESCRIPTIONS[
                                                CALCULATION_METHOD.TREND
                                            ]
                                        }
                                    </span>
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                    {errors.calculation_method && (
                        <p className="text-sm text-destructive">
                            {errors.calculation_method}
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <Checkbox
                        id="include_inflation"
                        checked={formData.include_inflation}
                        onCheckedChange={(checked) =>
                            handleChange('include_inflation', checked === true)
                        }
                    />
                    <Label
                        htmlFor="include_inflation"
                        className="cursor-pointer font-normal"
                    >
                        Incluir inflación en las proyecciones
                    </Label>
                </div>
            </div>

            {/* Estado y Opciones */}
            <div className="space-y-4">
                <div className="space-y-2">
                    <h3 className="text-lg font-medium">Estado y Opciones</h3>
                    <p className="text-sm text-muted-foreground">
                        Configura el estado del escenario.
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="status">
                        Estado <span className="text-destructive">*</span>
                    </Label>
                    <Select
                        value={formData.status}
                        onValueChange={(value) =>
                            handleChange(
                                'status',
                                value as ScenarioFormData['status'],
                            )
                        }
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={SCENARIO_STATUS.DRAFT}>
                                {SCENARIO_STATUS_LABELS[SCENARIO_STATUS.DRAFT]}
                            </SelectItem>
                            <SelectItem value={SCENARIO_STATUS.ACTIVE}>
                                {SCENARIO_STATUS_LABELS[SCENARIO_STATUS.ACTIVE]}
                            </SelectItem>
                            <SelectItem value={SCENARIO_STATUS.ARCHIVED}>
                                {SCENARIO_STATUS_LABELS[SCENARIO_STATUS.ARCHIVED]}
                            </SelectItem>
                        </SelectContent>
                    </Select>
                    {errors.status && (
                        <p className="text-sm text-destructive">{errors.status}</p>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <Checkbox
                        id="is_baseline"
                        checked={formData.is_baseline}
                        onCheckedChange={(checked) =>
                            handleChange('is_baseline', checked === true)
                        }
                    />
                    <Label
                        htmlFor="is_baseline"
                        className="cursor-pointer font-normal"
                    >
                        Marcar como escenario de línea base
                    </Label>
                </div>
                <p className="text-xs text-muted-foreground">
                    El escenario de línea base se usa como referencia para
                    comparaciones.
                </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
                <Button type="submit" disabled={processing}>
                    {processing
                        ? scenario
                            ? 'Guardando...'
                            : 'Creando...'
                        : scenario
                          ? 'Guardar Cambios'
                          : 'Crear Escenario'}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.history.back()}
                    disabled={processing}
                >
                    Cancelar
                </Button>
            </div>
        </form>
    );
}
