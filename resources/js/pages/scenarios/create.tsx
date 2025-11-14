import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/ui/page-header';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
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
import { Head, router } from '@inertiajs/react';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface ScenarioFormData {
    name: string;
    description: string;
    base_year: number;
    historical_months: number;
    projection_years: number;
    status: 'draft' | 'active' | 'archived';
    is_baseline: boolean;
    calculation_method: 'simple_average' | 'weighted_average' | 'trend';
    include_inflation: boolean;
}

export default function CreateScenario() {
    const currentYear = new Date().getFullYear();
    const toast = useToast();
    const [currentStep, setCurrentStep] = useState(0);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [formData, setFormData] = useState<ScenarioFormData>({
        name: '',
        description: '',
        base_year: currentYear,
        historical_months: DEFAULT_HISTORICAL_MONTHS,
        projection_years: DEFAULT_PROJECTION_YEARS,
        status: SCENARIO_STATUS.DRAFT,
        is_baseline: false,
        calculation_method: CALCULATION_METHOD.SIMPLE_AVERAGE,
        include_inflation: true,
    });

    const handleChange = (
        field: keyof ScenarioFormData,
        value: string | number | boolean,
    ) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
        // Clear error for this field
        if (errors[field]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const validateStep = (step: number): boolean => {
        const newErrors: Record<string, string> = {};

        if (step === 0) {
            // Step 1: Basic Information
            if (!formData.name.trim()) {
                newErrors.name = 'El nombre del escenario es requerido.';
            }
            if (formData.base_year < 2000 || formData.base_year > 2100) {
                newErrors.base_year =
                    'El año base debe estar entre 2000 y 2100.';
            }
        } else if (step === 1) {
            // Step 2: Configuration
            if (
                formData.historical_months < MIN_HISTORICAL_MONTHS ||
                formData.historical_months > 60
            ) {
                newErrors.historical_months = `Los meses históricos deben estar entre ${MIN_HISTORICAL_MONTHS} y 60.`;
            }
            if (
                formData.projection_years < 1 ||
                formData.projection_years > MAX_PROJECTION_YEARS
            ) {
                newErrors.projection_years = `Los años de proyección deben estar entre 1 y ${MAX_PROJECTION_YEARS}.`;
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep((prev) => Math.min(prev + 1, 2));
        }
    };

    const handleBack = () => {
        setCurrentStep((prev) => Math.max(prev - 1, 0));
    };

    const handleSubmit = () => {
        if (!validateStep(currentStep)) {
            return;
        }

        setProcessing(true);

        router.post('/api/v1/scenarios', formData, {
            onSuccess: () => {
                toast.success('El escenario ha sido creado exitosamente.', {
                    title: 'Escenario creado',
                });
                router.visit('/scenarios');
            },
            onError: (errors) => {
                setErrors(errors as Record<string, string>);
                toast.error(
                    'Hubo un error al crear el escenario. Verifica los campos.',
                    {
                        title: 'Error',
                    },
                );
                setProcessing(false);
            },
            onFinish: () => {
                setProcessing(false);
            },
        });
    };

    const steps = [
        {
            title: 'Información Básica',
            description: 'Nombre y año base del escenario',
        },
        {
            title: 'Configuración',
            description: 'Parámetros de cálculo',
        },
        {
            title: 'Revisión',
            description: 'Revisa y confirma los datos',
        },
    ];

    return (
        <AppSidebarLayout>
            <Head title="Nuevo Escenario" />

            <PageHeader
                title="Nuevo Escenario de Proyección"
                subtitle="Crea un nuevo escenario con un asistente paso a paso"
            />

            <div className="mx-auto max-w-3xl">
                {/* Progress Steps */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        {steps.map((step, index) => (
                            <div
                                key={index}
                                className="flex flex-1 flex-col items-center"
                            >
                                <div className="flex w-full items-center">
                                    {index > 0 && (
                                        <div
                                            className={`h-1 flex-1 ${
                                                index <= currentStep
                                                    ? 'bg-primary'
                                                    : 'bg-muted'
                                            }`}
                                        />
                                    )}
                                    <div
                                        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                                            index < currentStep
                                                ? 'border-primary bg-primary text-primary-foreground'
                                                : index === currentStep
                                                  ? 'border-primary bg-background text-primary'
                                                  : 'border-muted bg-muted text-muted-foreground'
                                        }`}
                                    >
                                        {index < currentStep ? (
                                            <Check className="h-5 w-5" />
                                        ) : (
                                            <span>{index + 1}</span>
                                        )}
                                    </div>
                                    {index < steps.length - 1 && (
                                        <div
                                            className={`h-1 flex-1 ${
                                                index < currentStep
                                                    ? 'bg-primary'
                                                    : 'bg-muted'
                                            }`}
                                        />
                                    )}
                                </div>
                                <div className="mt-2 text-center">
                                    <p
                                        className={`text-sm font-medium ${
                                            index <= currentStep
                                                ? 'text-foreground'
                                                : 'text-muted-foreground'
                                        }`}
                                    >
                                        {step.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {step.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>{steps[currentStep].title}</CardTitle>
                        <CardDescription>
                            {steps[currentStep].description}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Step 1: Basic Information */}
                        {currentStep === 0 && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">
                                        Nombre del Escenario{' '}
                                        <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) =>
                                            handleChange('name', e.target.value)
                                        }
                                        placeholder="Ej: Escenario Base 2025"
                                        maxLength={255}
                                        autoFocus
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-destructive">
                                            {errors.name}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">
                                        Descripción
                                    </Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) =>
                                            handleChange(
                                                'description',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Breve descripción del escenario..."
                                        maxLength={1000}
                                        rows={4}
                                    />
                                    {errors.description && (
                                        <p className="text-sm text-destructive">
                                            {errors.description}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="base_year">
                                        Año Base{' '}
                                        <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="base_year"
                                        type="number"
                                        value={formData.base_year}
                                        onChange={(e) =>
                                            handleChange(
                                                'base_year',
                                                parseInt(e.target.value),
                                            )
                                        }
                                        min={2000}
                                        max={2100}
                                    />
                                    {errors.base_year && (
                                        <p className="text-sm text-destructive">
                                            {errors.base_year}
                                        </p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        Año de referencia para el cálculo de
                                        proyecciones.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Configuration */}
                        {currentStep === 1 && (
                            <div className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="historical_months">
                                            Meses Históricos{' '}
                                            <span className="text-destructive">
                                                *
                                            </span>
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
                                        />
                                        {errors.historical_months && (
                                            <p className="text-sm text-destructive">
                                                {errors.historical_months}
                                            </p>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            Número de meses históricos a
                                            considerar (mínimo{' '}
                                            {MIN_HISTORICAL_MONTHS}, máximo 60).
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="projection_years">
                                            Años de Proyección{' '}
                                            <span className="text-destructive">
                                                *
                                            </span>
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
                                            <SelectItem
                                                value={
                                                    CALCULATION_METHOD.SIMPLE_AVERAGE
                                                }
                                            >
                                                {
                                                    CALCULATION_METHOD_LABELS[
                                                        CALCULATION_METHOD
                                                            .SIMPLE_AVERAGE
                                                    ]
                                                }
                                            </SelectItem>
                                            <SelectItem
                                                value={
                                                    CALCULATION_METHOD.WEIGHTED_AVERAGE
                                                }
                                            >
                                                {
                                                    CALCULATION_METHOD_LABELS[
                                                        CALCULATION_METHOD
                                                            .WEIGHTED_AVERAGE
                                                    ]
                                                }
                                            </SelectItem>
                                            <SelectItem
                                                value={CALCULATION_METHOD.TREND}
                                            >
                                                {
                                                    CALCULATION_METHOD_LABELS[
                                                        CALCULATION_METHOD.TREND
                                                    ]
                                                }
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">
                                        {
                                            CALCULATION_METHOD_DESCRIPTIONS[
                                                formData.calculation_method
                                            ]
                                        }
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="include_inflation"
                                        checked={formData.include_inflation}
                                        onCheckedChange={(checked) =>
                                            handleChange(
                                                'include_inflation',
                                                checked === true,
                                            )
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
                        )}

                        {/* Step 3: Review */}
                        {currentStep === 2 && (
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="status">
                                            Estado{' '}
                                            <span className="text-destructive">
                                                *
                                            </span>
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
                                                <SelectItem
                                                    value={SCENARIO_STATUS.DRAFT}
                                                >
                                                    {
                                                        SCENARIO_STATUS_LABELS[
                                                            SCENARIO_STATUS.DRAFT
                                                        ]
                                                    }
                                                </SelectItem>
                                                <SelectItem
                                                    value={SCENARIO_STATUS.ACTIVE}
                                                >
                                                    {
                                                        SCENARIO_STATUS_LABELS[
                                                            SCENARIO_STATUS.ACTIVE
                                                        ]
                                                    }
                                                </SelectItem>
                                                <SelectItem
                                                    value={
                                                        SCENARIO_STATUS.ARCHIVED
                                                    }
                                                >
                                                    {
                                                        SCENARIO_STATUS_LABELS[
                                                            SCENARIO_STATUS
                                                                .ARCHIVED
                                                        ]
                                                    }
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id="is_baseline"
                                            checked={formData.is_baseline}
                                            onCheckedChange={(checked) =>
                                                handleChange(
                                                    'is_baseline',
                                                    checked === true,
                                                )
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
                                        El escenario de línea base se usa como
                                        referencia para comparaciones.
                                    </p>
                                </div>

                                <div className="rounded-lg border p-4">
                                    <h4 className="mb-3 font-medium">
                                        Resumen del Escenario
                                    </h4>
                                    <dl className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <dt className="text-muted-foreground">
                                                Nombre:
                                            </dt>
                                            <dd className="font-medium">
                                                {formData.name}
                                            </dd>
                                        </div>
                                        {formData.description && (
                                            <div className="flex justify-between">
                                                <dt className="text-muted-foreground">
                                                    Descripción:
                                                </dt>
                                                <dd className="max-w-xs text-right">
                                                    {formData.description}
                                                </dd>
                                            </div>
                                        )}
                                        <div className="flex justify-between">
                                            <dt className="text-muted-foreground">
                                                Año Base:
                                            </dt>
                                            <dd className="font-medium">
                                                {formData.base_year}
                                            </dd>
                                        </div>
                                        <div className="flex justify-between">
                                            <dt className="text-muted-foreground">
                                                Meses Históricos:
                                            </dt>
                                            <dd className="font-medium">
                                                {formData.historical_months}
                                            </dd>
                                        </div>
                                        <div className="flex justify-between">
                                            <dt className="text-muted-foreground">
                                                Años de Proyección:
                                            </dt>
                                            <dd className="font-medium">
                                                {formData.projection_years}
                                            </dd>
                                        </div>
                                        <div className="flex justify-between">
                                            <dt className="text-muted-foreground">
                                                Método de Cálculo:
                                            </dt>
                                            <dd className="font-medium">
                                                {
                                                    CALCULATION_METHOD_LABELS[
                                                        formData
                                                            .calculation_method
                                                    ]
                                                }
                                            </dd>
                                        </div>
                                        <div className="flex justify-between">
                                            <dt className="text-muted-foreground">
                                                Incluir Inflación:
                                            </dt>
                                            <dd className="font-medium">
                                                {formData.include_inflation
                                                    ? 'Sí'
                                                    : 'No'}
                                            </dd>
                                        </div>
                                        <div className="flex justify-between">
                                            <dt className="text-muted-foreground">
                                                Estado:
                                            </dt>
                                            <dd className="font-medium">
                                                {
                                                    SCENARIO_STATUS_LABELS[
                                                        formData.status
                                                    ]
                                                }
                                            </dd>
                                        </div>
                                        <div className="flex justify-between">
                                            <dt className="text-muted-foreground">
                                                Línea Base:
                                            </dt>
                                            <dd className="font-medium">
                                                {formData.is_baseline
                                                    ? 'Sí'
                                                    : 'No'}
                                            </dd>
                                        </div>
                                    </dl>
                                </div>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex justify-between pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleBack}
                                disabled={currentStep === 0 || processing}
                            >
                                <ChevronLeft className="mr-2 h-4 w-4" />
                                Atrás
                            </Button>

                            {currentStep < 2 ? (
                                <Button type="button" onClick={handleNext}>
                                    Siguiente
                                    <ChevronRight className="ml-2 h-4 w-4" />
                                </Button>
                            ) : (
                                <Button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={processing}
                                >
                                    {processing
                                        ? 'Creando...'
                                        : 'Crear Escenario'}
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppSidebarLayout>
    );
}
