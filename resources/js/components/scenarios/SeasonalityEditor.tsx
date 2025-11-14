import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DEFAULT_SEASONALITY_FACTORS, MONTH_NAMES } from '@/lib/constants';
import { useState } from 'react';

interface SeasonalityEditorProps {
    value?: number[];
    onChange: (factors: number[]) => void;
    disabled?: boolean;
}

export function SeasonalityEditor({
    value = DEFAULT_SEASONALITY_FACTORS,
    onChange,
    disabled = false,
}: SeasonalityEditorProps) {
    const [factors, setFactors] = useState<number[]>(
        value.length === 12 ? value : DEFAULT_SEASONALITY_FACTORS,
    );

    const handleChange = (index: number, newValue: string) => {
        const parsedValue = parseFloat(newValue) || 0;
        const newFactors = [...factors];
        newFactors[index] = parsedValue;
        setFactors(newFactors);
        onChange(newFactors);
    };

    const handleSetUniform = () => {
        const uniformFactors = Array(12).fill(1.0);
        setFactors(uniformFactors);
        onChange(uniformFactors);
    };

    const handleSetCustomPreset = (preset: 'high_season' | 'low_season') => {
        let customFactors: number[];

        if (preset === 'high_season') {
            // Mayor actividad en Nov-Dic (Q4)
            customFactors = [
                0.9, 0.9, 0.95, 0.95, 1.0, 1.0,
                1.05, 1.05, 1.1, 1.1, 1.15, 1.2,
            ];
        } else {
            // Mayor actividad en Ene-Mar (Q1)
            customFactors = [
                1.2, 1.15, 1.1, 1.05, 1.0, 0.95,
                0.95, 0.9, 0.9, 0.95, 1.0, 1.05,
            ];
        }

        setFactors(customFactors);
        onChange(customFactors);
    };

    const sum = factors.reduce((acc, val) => acc + val, 0);
    const average = sum / 12;
    const isValid = sum >= 11.5 && sum <= 12.5;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Label className="text-base">Factores de Estacionalidad</Label>
                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleSetUniform}
                        disabled={disabled}
                    >
                        Uniforme
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetCustomPreset('high_season')}
                        disabled={disabled}
                    >
                        Q4 Alto
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetCustomPreset('low_season')}
                        disabled={disabled}
                    >
                        Q1 Alto
                    </Button>
                </div>
            </div>

            <p className="text-sm text-muted-foreground">
                Define cómo se distribuyen los ingresos a lo largo del año. Un
                valor de 1.0 = promedio, mayor a 1.0 = mes con más actividad,
                menor a 1.0 = mes con menos actividad.
            </p>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {factors.map((factor, index) => (
                    <div key={index} className="space-y-1">
                        <Label htmlFor={`month-${index}`} className="text-xs">
                            {MONTH_NAMES[index]}
                        </Label>
                        <Input
                            id={`month-${index}`}
                            type="number"
                            step="0.01"
                            min="0"
                            max="10"
                            value={factor.toFixed(2)}
                            onChange={(e) => handleChange(index, e.target.value)}
                            disabled={disabled}
                            className="text-center"
                        />
                    </div>
                ))}
            </div>

            <div className="rounded-lg border p-3">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                        Suma total (debe ser ≈ 12.0):
                    </span>
                    <span
                        className={`font-medium ${
                            isValid
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-destructive'
                        }`}
                    >
                        {sum.toFixed(2)}
                    </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                        Promedio mensual:
                    </span>
                    <span className="font-medium">{average.toFixed(2)}</span>
                </div>
                {!isValid && (
                    <p className="mt-2 text-xs text-destructive">
                        La suma debe estar entre 11.5 y 12.5 para ser válida.
                    </p>
                )}
            </div>
        </div>
    );
}
