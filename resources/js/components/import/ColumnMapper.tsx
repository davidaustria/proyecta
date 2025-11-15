import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { ColumnMapping } from '@/types';

interface ColumnMapperProps {
    excelHeaders: string[];
    systemFields: SystemField[];
    mappings: ColumnMapping[];
    onMappingChange: (mappings: ColumnMapping[]) => void;
}

export interface SystemField {
    key: string;
    label: string;
    required: boolean;
    description?: string;
}

export function ColumnMapper({
    excelHeaders,
    systemFields,
    mappings,
    onMappingChange,
}: ColumnMapperProps) {
    const handleMappingChange = (excelColumn: string, systemField: string) => {
        const newMappings = [...mappings];
        const existingIndex = newMappings.findIndex(
            (m) => m.excel_column === excelColumn,
        );

        if (systemField === 'none') {
            // Remove mapping
            if (existingIndex !== -1) {
                newMappings.splice(existingIndex, 1);
            }
        } else {
            // Add or update mapping
            if (existingIndex !== -1) {
                newMappings[existingIndex].system_field = systemField;
            } else {
                newMappings.push({
                    excel_column: excelColumn,
                    system_field: systemField,
                });
            }
        }

        onMappingChange(newMappings);
    };

    const getSystemFieldForExcelColumn = (
        excelColumn: string,
    ): string | undefined => {
        const mapping = mappings.find((m) => m.excel_column === excelColumn);
        return mapping?.system_field;
    };

    const getUsedSystemFields = (): Set<string> => {
        return new Set(mappings.map((m) => m.system_field));
    };

    const getMissingRequiredFields = (): SystemField[] => {
        const usedFields = getUsedSystemFields();
        return systemFields.filter(
            (field) => field.required && !usedFields.has(field.key),
        );
    };

    const missingRequiredFields = getMissingRequiredFields();
    const usedSystemFields = getUsedSystemFields();

    return (
        <div className="space-y-6">
            {/* Warning for missing required fields */}
            {missingRequiredFields.length > 0 && (
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-900/50 dark:bg-orange-950/30">
                    <p className="mb-2 text-sm font-medium text-orange-900 dark:text-orange-200">
                        Campos requeridos sin mapear:
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {missingRequiredFields.map((field) => (
                            <Badge
                                key={field.key}
                                variant="outline"
                                className="border-orange-300 text-orange-900 dark:border-orange-700 dark:text-orange-200"
                            >
                                {field.label}
                            </Badge>
                        ))}
                    </div>
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Mapeo de Columnas</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Relaciona las columnas de tu archivo Excel con los
                        campos del sistema
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {excelHeaders.map((header) => {
                            const systemFieldValue =
                                getSystemFieldForExcelColumn(header);
                            const selectedField = systemFields.find(
                                (f) => f.key === systemFieldValue,
                            );

                            return (
                                <div
                                    key={header}
                                    className="flex items-start gap-4 rounded-lg border p-4"
                                >
                                    <div className="flex-1 space-y-1">
                                        <Label className="text-sm font-medium">
                                            Columna Excel: {header}
                                        </Label>
                                        {selectedField?.description && (
                                            <p className="text-xs text-muted-foreground">
                                                {selectedField.description}
                                            </p>
                                        )}
                                    </div>
                                    <div className="w-64">
                                        <Select
                                            value={systemFieldValue || 'none'}
                                            onValueChange={(value) =>
                                                handleMappingChange(
                                                    header,
                                                    value,
                                                )
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar campo" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">
                                                    Sin mapear
                                                </SelectItem>
                                                {systemFields.map((field) => {
                                                    const isUsed =
                                                        usedSystemFields.has(
                                                            field.key,
                                                        ) &&
                                                        field.key !==
                                                            systemFieldValue;

                                                    return (
                                                        <SelectItem
                                                            key={field.key}
                                                            value={field.key}
                                                            disabled={isUsed}
                                                        >
                                                            {field.label}
                                                            {field.required && (
                                                                <span className="ml-1 text-destructive">
                                                                    *
                                                                </span>
                                                            )}
                                                            {isUsed && (
                                                                <span className="ml-2 text-xs text-muted-foreground">
                                                                    (ya usado)
                                                                </span>
                                                            )}
                                                        </SelectItem>
                                                    );
                                                })}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Legend */}
            <div className="rounded-lg border bg-muted/50 p-4">
                <p className="text-sm font-medium">Leyenda:</p>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                    <li>
                        • Los campos marcados con{' '}
                        <span className="text-destructive">*</span> son
                        obligatorios
                    </li>
                    <li>• Cada campo del sistema solo puede usarse una vez</li>
                    <li>
                        • Las columnas sin mapear serán ignoradas durante la
                        importación
                    </li>
                </ul>
            </div>
        </div>
    );
}
