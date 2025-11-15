import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { CALCULATION_METHOD_LABELS } from '@/lib/constants';
import type { Scenario } from '@/types';
import { router } from '@inertiajs/react';
import { AlertTriangle, Calculator } from 'lucide-react';
import { useState } from 'react';

interface CalculateProjectionsButtonProps {
    scenario: Scenario;
    onCalculationComplete?: () => void;
    variant?: 'default' | 'outline' | 'ghost';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    className?: string;
}

export function CalculateProjectionsButton({
    scenario,
    onCalculationComplete,
    variant = 'default',
    size = 'default',
    className,
}: CalculateProjectionsButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isCalculating, setIsCalculating] = useState(false);
    const { success, error } = useToast();

    const hasExistingProjections = (scenario.projections_count ?? 0) > 0;

    const handleCalculate = () => {
        setIsCalculating(true);

        router.post(
            `/api/v1/scenarios/${scenario.id}/calculate`,
            {},
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: (page: any) => {
                    const response = page.props.flash;
                    const projectionsCount =
                        response?.projections_count ??
                        scenario.projections_count;

                    success(
                        `Se han generado ${projectionsCount} proyecciones exitosamente.`,
                        {
                            title: 'Proyecciones calculadas',
                        },
                    );

                    setIsOpen(false);
                    onCalculationComplete?.();
                },
                onError: (errors: any) => {
                    const errorMessage =
                        errors.error ||
                        'Ocurrió un error al calcular las proyecciones';

                    error(errorMessage, {
                        title: 'Error al calcular proyecciones',
                    });
                },
                onFinish: () => {
                    setIsCalculating(false);
                },
            },
        );
    };

    return (
        <>
            <Button
                variant={variant}
                size={size}
                onClick={() => setIsOpen(true)}
                className={className}
            >
                <Calculator className="mr-2 h-4 w-4" />
                Calcular Proyecciones
            </Button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Calcular Proyecciones</DialogTitle>
                        <DialogDescription>
                            Se generarán las proyecciones para el escenario "
                            {scenario.name}" basándose en los supuestos
                            configurados.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {hasExistingProjections && (
                            <Alert>
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                    Este escenario ya tiene{' '}
                                    {scenario.projections_count} proyección(es)
                                    existente(s). Al calcular nuevamente, se
                                    eliminarán las proyecciones anteriores y se
                                    generarán nuevas.
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2 text-sm">
                            <p className="font-medium">
                                Configuración del escenario:
                            </p>
                            <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                                <li>Año base: {scenario.base_year}</li>
                                <li>
                                    Años de proyección:{' '}
                                    {scenario.projection_years}
                                </li>
                                <li>
                                    Meses históricos:{' '}
                                    {scenario.historical_months}
                                </li>
                                <li>
                                    Método de cálculo:{' '}
                                    {
                                        CALCULATION_METHOD_LABELS[
                                            scenario.calculation_method
                                        ]
                                    }
                                </li>
                                <li>
                                    Incluir inflación:{' '}
                                    {scenario.include_inflation ? 'Sí' : 'No'}
                                </li>
                                <li>
                                    Supuestos configurados:{' '}
                                    {scenario.assumptions_count}
                                </li>
                            </ul>
                        </div>

                        {scenario.assumptions_count === 0 && (
                            <Alert>
                                <AlertDescription>
                                    Este escenario no tiene supuestos
                                    configurados. Se utilizarán los valores
                                    predeterminados para el cálculo.
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsOpen(false)}
                            disabled={isCalculating}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleCalculate}
                            disabled={isCalculating}
                        >
                            {isCalculating ? (
                                <>
                                    <span className="mr-2 animate-spin">
                                        ⏳
                                    </span>
                                    Calculando...
                                </>
                            ) : (
                                <>
                                    <Calculator className="mr-2 h-4 w-4" />
                                    Calcular
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
