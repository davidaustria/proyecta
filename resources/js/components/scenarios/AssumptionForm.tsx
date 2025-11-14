import { SeasonalityEditor } from '@/components/scenarios/SeasonalityEditor';
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
    ADJUSTMENT_TYPE,
    ADJUSTMENT_TYPE_LABELS,
    DEFAULT_SEASONALITY_FACTORS,
} from '@/lib/constants';
import type {
    BusinessGroup,
    Customer,
    CustomerType,
    Product,
    ScenarioAssumption,
} from '@/types';
import { useState } from 'react';

interface AssumptionFormProps {
    assumption?: ScenarioAssumption;
    scenarioId: number;
    availableYears: number[];
    customerTypes: CustomerType[];
    businessGroups: BusinessGroup[];
    customers: Customer[];
    products: Product[];
    onSubmit: (data: AssumptionFormData) => void;
    onCancel: () => void;
    processing?: boolean;
    errors?: Record<string, string>;
}

export interface AssumptionFormData {
    scenario_id: number;
    year: number;
    hierarchy_level: 'global' | 'customer_type' | 'business_group' | 'customer' | 'product';
    business_group_id?: number;
    customer_type_id?: number;
    customer_id?: number;
    product_id?: number;
    growth_rate?: number;
    inflation_rate?: number;
    adjustment_type: 'percentage' | 'fixed_amount';
    fixed_amount?: number;
    use_seasonality: boolean;
    seasonality_factors?: number[];
    notes?: string;
}

export function AssumptionForm({
    assumption,
    scenarioId,
    availableYears,
    customerTypes,
    businessGroups,
    customers,
    products,
    onSubmit,
    onCancel,
    processing = false,
    errors = {},
}: AssumptionFormProps) {
    const [formData, setFormData] = useState<AssumptionFormData>({
        scenario_id: scenarioId,
        year: assumption?.year || availableYears[0] || new Date().getFullYear(),
        hierarchy_level: assumption?.hierarchy_level || 'global',
        business_group_id: assumption?.business_group_id,
        customer_type_id: assumption?.customer_type_id,
        customer_id: assumption?.customer_id,
        product_id: assumption?.product_id,
        growth_rate: assumption?.growth_rate || 0,
        inflation_rate: assumption?.inflation_rate,
        adjustment_type: assumption?.adjustment_type || ADJUSTMENT_TYPE.PERCENTAGE,
        fixed_amount: assumption?.fixed_amount,
        use_seasonality: !!(assumption?.seasonality_factors && assumption.seasonality_factors.length === 12),
        seasonality_factors: assumption?.seasonality_factors || DEFAULT_SEASONALITY_FACTORS,
        notes: assumption?.notes || '',
    });

    const handleChange = (
        field: keyof AssumptionFormData,
        value: string | number | boolean | number[] | undefined,
    ) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleHierarchyChange = (level: AssumptionFormData['hierarchy_level']) => {
        // Reset dimension IDs when changing hierarchy level
        setFormData((prev) => ({
            ...prev,
            hierarchy_level: level,
            business_group_id: undefined,
            customer_type_id: undefined,
            customer_id: undefined,
            product_id: undefined,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const submitData: AssumptionFormData = {
            ...formData,
            seasonality_factors: formData.use_seasonality
                ? formData.seasonality_factors
                : undefined,
        };

        onSubmit(submitData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Year and Dimension Selection */}
            <div className="space-y-4">
                <div className="space-y-2">
                    <h3 className="text-lg font-medium">Dimensión y Alcance</h3>
                    <p className="text-sm text-muted-foreground">
                        Selecciona el año y el nivel al que aplica este supuesto.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="year">
                            Año <span className="text-destructive">*</span>
                        </Label>
                        <Select
                            value={formData.year.toString()}
                            onValueChange={(value) =>
                                handleChange('year', parseInt(value))
                            }
                            disabled={!!assumption} // Can't change year when editing
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {availableYears.map((year) => (
                                    <SelectItem key={year} value={year.toString()}>
                                        {year}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.year && (
                            <p className="text-sm text-destructive">{errors.year}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="hierarchy_level">
                            Nivel de Aplicación{' '}
                            <span className="text-destructive">*</span>
                        </Label>
                        <Select
                            value={formData.hierarchy_level}
                            onValueChange={handleHierarchyChange}
                            disabled={!!assumption} // Can't change hierarchy when editing
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="global">Global (Todos)</SelectItem>
                                <SelectItem value="customer_type">
                                    Por Tipo de Cliente
                                </SelectItem>
                                <SelectItem value="business_group">
                                    Por Grupo Empresarial
                                </SelectItem>
                                <SelectItem value="customer">
                                    Por Cliente Específico
                                </SelectItem>
                                <SelectItem value="product">
                                    Por Producto
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Conditional dimension selectors */}
                {formData.hierarchy_level === 'customer_type' && (
                    <div className="space-y-2">
                        <Label htmlFor="customer_type_id">
                            Tipo de Cliente{' '}
                            <span className="text-destructive">*</span>
                        </Label>
                        <Select
                            value={formData.customer_type_id?.toString() || ''}
                            onValueChange={(value) =>
                                handleChange('customer_type_id', parseInt(value))
                            }
                            disabled={!!assumption}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona un tipo de cliente" />
                            </SelectTrigger>
                            <SelectContent>
                                {customerTypes.map((type) => (
                                    <SelectItem
                                        key={type.id}
                                        value={type.id.toString()}
                                    >
                                        {type.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.customer_type_id && (
                            <p className="text-sm text-destructive">
                                {errors.customer_type_id}
                            </p>
                        )}
                    </div>
                )}

                {formData.hierarchy_level === 'business_group' && (
                    <div className="space-y-2">
                        <Label htmlFor="business_group_id">
                            Grupo Empresarial{' '}
                            <span className="text-destructive">*</span>
                        </Label>
                        <Select
                            value={formData.business_group_id?.toString() || ''}
                            onValueChange={(value) =>
                                handleChange('business_group_id', parseInt(value))
                            }
                            disabled={!!assumption}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona un grupo empresarial" />
                            </SelectTrigger>
                            <SelectContent>
                                {businessGroups.map((group) => (
                                    <SelectItem
                                        key={group.id}
                                        value={group.id.toString()}
                                    >
                                        {group.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.business_group_id && (
                            <p className="text-sm text-destructive">
                                {errors.business_group_id}
                            </p>
                        )}
                    </div>
                )}

                {formData.hierarchy_level === 'customer' && (
                    <div className="space-y-2">
                        <Label htmlFor="customer_id">
                            Cliente <span className="text-destructive">*</span>
                        </Label>
                        <Select
                            value={formData.customer_id?.toString() || ''}
                            onValueChange={(value) =>
                                handleChange('customer_id', parseInt(value))
                            }
                            disabled={!!assumption}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona un cliente" />
                            </SelectTrigger>
                            <SelectContent>
                                {customers.map((customer) => (
                                    <SelectItem
                                        key={customer.id}
                                        value={customer.id.toString()}
                                    >
                                        {customer.name} ({customer.code})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.customer_id && (
                            <p className="text-sm text-destructive">
                                {errors.customer_id}
                            </p>
                        )}
                    </div>
                )}

                {formData.hierarchy_level === 'product' && (
                    <div className="space-y-2">
                        <Label htmlFor="product_id">
                            Producto <span className="text-destructive">*</span>
                        </Label>
                        <Select
                            value={formData.product_id?.toString() || ''}
                            onValueChange={(value) =>
                                handleChange('product_id', parseInt(value))
                            }
                            disabled={!!assumption}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona un producto" />
                            </SelectTrigger>
                            <SelectContent>
                                {products.map((product) => (
                                    <SelectItem
                                        key={product.id}
                                        value={product.id.toString()}
                                    >
                                        {product.name} ({product.code})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.product_id && (
                            <p className="text-sm text-destructive">
                                {errors.product_id}
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Growth and Rates */}
            <div className="space-y-4">
                <div className="space-y-2">
                    <h3 className="text-lg font-medium">Tasas de Crecimiento</h3>
                    <p className="text-sm text-muted-foreground">
                        Define las tasas que se aplicarán en las proyecciones.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="growth_rate">Tasa de Crecimiento (%)</Label>
                        <Input
                            id="growth_rate"
                            type="number"
                            step="0.01"
                            min="-100"
                            max="1000"
                            value={formData.growth_rate ?? ''}
                            onChange={(e) =>
                                handleChange(
                                    'growth_rate',
                                    e.target.value ? parseFloat(e.target.value) : undefined,
                                )
                            }
                            placeholder="Ej: 5.5"
                        />
                        {errors.growth_rate && (
                            <p className="text-sm text-destructive">
                                {errors.growth_rate}
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Porcentaje de crecimiento anual esperado.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="inflation_rate">Tasa de Inflación (%)</Label>
                        <Input
                            id="inflation_rate"
                            type="number"
                            step="0.01"
                            min="-100"
                            max="1000"
                            value={formData.inflation_rate ?? ''}
                            onChange={(e) =>
                                handleChange(
                                    'inflation_rate',
                                    e.target.value ? parseFloat(e.target.value) : undefined,
                                )
                            }
                            placeholder="Usar tasa global"
                        />
                        {errors.inflation_rate && (
                            <p className="text-sm text-destructive">
                                {errors.inflation_rate}
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Dejar vacío para usar la tasa de inflación global del año.
                        </p>
                    </div>
                </div>
            </div>

            {/* Adjustments */}
            <div className="space-y-4">
                <div className="space-y-2">
                    <h3 className="text-lg font-medium">Ajustes Adicionales</h3>
                    <p className="text-sm text-muted-foreground">
                        Aplica ajustes fijos o porcentuales adicionales.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="adjustment_type">
                            Tipo de Ajuste{' '}
                            <span className="text-destructive">*</span>
                        </Label>
                        <Select
                            value={formData.adjustment_type}
                            onValueChange={(value) =>
                                handleChange(
                                    'adjustment_type',
                                    value as AssumptionFormData['adjustment_type'],
                                )
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ADJUSTMENT_TYPE.PERCENTAGE}>
                                    {ADJUSTMENT_TYPE_LABELS[ADJUSTMENT_TYPE.PERCENTAGE]}
                                </SelectItem>
                                <SelectItem value={ADJUSTMENT_TYPE.FIXED_AMOUNT}>
                                    {ADJUSTMENT_TYPE_LABELS[ADJUSTMENT_TYPE.FIXED_AMOUNT]}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {formData.adjustment_type === ADJUSTMENT_TYPE.FIXED_AMOUNT && (
                        <div className="space-y-2">
                            <Label htmlFor="fixed_amount">
                                Monto Fijo{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="fixed_amount"
                                type="number"
                                step="0.01"
                                value={formData.fixed_amount ?? ''}
                                onChange={(e) =>
                                    handleChange(
                                        'fixed_amount',
                                        e.target.value
                                            ? parseFloat(e.target.value)
                                            : undefined,
                                    )
                                }
                                placeholder="Ej: 1000000"
                            />
                            {errors.fixed_amount && (
                                <p className="text-sm text-destructive">
                                    {errors.fixed_amount}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Seasonality */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <Checkbox
                        id="use_seasonality"
                        checked={formData.use_seasonality}
                        onCheckedChange={(checked) =>
                            handleChange('use_seasonality', checked === true)
                        }
                    />
                    <Label
                        htmlFor="use_seasonality"
                        className="cursor-pointer font-normal"
                    >
                        Aplicar factores de estacionalidad
                    </Label>
                </div>

                {formData.use_seasonality && (
                    <SeasonalityEditor
                        value={formData.seasonality_factors}
                        onChange={(factors) =>
                            handleChange('seasonality_factors', factors)
                        }
                        disabled={processing}
                    />
                )}
                {errors.seasonality_factors && (
                    <p className="text-sm text-destructive">
                        {errors.seasonality_factors}
                    </p>
                )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    placeholder="Observaciones o justificación de este supuesto..."
                    maxLength={1000}
                    rows={3}
                />
                {errors.notes && (
                    <p className="text-sm text-destructive">{errors.notes}</p>
                )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
                <Button type="submit" disabled={processing}>
                    {processing
                        ? assumption
                            ? 'Guardando...'
                            : 'Creando...'
                        : assumption
                          ? 'Guardar Cambios'
                          : 'Crear Supuesto'}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={processing}
                >
                    Cancelar
                </Button>
            </div>
        </form>
    );
}
