import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import type { BusinessGroup, Customer, CustomerType } from '@/types';
import { FormEvent } from 'react';

export interface CustomerFormData {
    name: string;
    code: string;
    tax_id: string;
    customer_type_id: string;
    business_group_id: string;
    is_active: boolean;
}

export interface CustomerFormProps {
    customer?: Customer;
    customerTypes: CustomerType[];
    businessGroups: BusinessGroup[];
    onSubmit: (e: FormEvent) => void;
    isSubmitting: boolean;
    errors: Partial<Record<Extract<keyof CustomerFormData, string>, string>>;
    data: CustomerFormData;
    setData: (
        field: Extract<keyof CustomerFormData, string>,
        value: string | boolean,
    ) => void;
}

export function CustomerForm({
    customer,
    customerTypes,
    businessGroups,
    onSubmit,
    isSubmitting,
    errors,
    data,
    setData,
}: CustomerFormProps) {
    return (
        <form onSubmit={onSubmit} className="space-y-6">
            <Card>
                <CardContent>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">
                                Nombre{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="name"
                                name="name"
                                value={data.name}
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                                placeholder="Nombre del cliente"
                                required
                                aria-invalid={!!errors.name}
                                disabled={isSubmitting}
                            />
                            {errors.name && (
                                <p className="text-sm text-destructive">
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="code">
                                Código{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="code"
                                name="code"
                                value={data.code}
                                onChange={(e) =>
                                    setData('code', e.target.value)
                                }
                                placeholder="Código único del cliente"
                                required
                                aria-invalid={!!errors.code}
                                disabled={isSubmitting}
                                className="font-mono"
                            />
                            {errors.code && (
                                <p className="text-sm text-destructive">
                                    {errors.code}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="tax_id">RFC</Label>
                            <Input
                                id="tax_id"
                                name="tax_id"
                                value={data.tax_id}
                                onChange={(e) =>
                                    setData('tax_id', e.target.value)
                                }
                                placeholder="RFC del cliente (opcional)"
                                aria-invalid={!!errors.tax_id}
                                disabled={isSubmitting}
                                className="font-mono"
                            />
                            {errors.tax_id && (
                                <p className="text-sm text-destructive">
                                    {errors.tax_id}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="customer_type_id">
                                Tipo de Cliente
                            </Label>
                            <Select
                                value={data.customer_type_id}
                                onValueChange={(value) =>
                                    setData('customer_type_id', value)
                                }
                                disabled={isSubmitting}
                            >
                                <SelectTrigger
                                    id="customer_type_id"
                                    aria-invalid={!!errors.customer_type_id}
                                >
                                    <SelectValue placeholder="Selecciona un tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">Sin tipo</SelectItem>
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

                        <div className="space-y-2">
                            <Label htmlFor="business_group_id">
                                Grupo Empresarial
                            </Label>
                            <Select
                                value={data.business_group_id}
                                onValueChange={(value) =>
                                    setData('business_group_id', value)
                                }
                                disabled={isSubmitting}
                            >
                                <SelectTrigger
                                    id="business_group_id"
                                    aria-invalid={!!errors.business_group_id}
                                >
                                    <SelectValue placeholder="Selecciona un grupo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">Sin grupo</SelectItem>
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

                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="is_active"
                                name="is_active"
                                checked={data.is_active}
                                onCheckedChange={(checked) =>
                                    setData('is_active', checked === true)
                                }
                                disabled={isSubmitting}
                                aria-invalid={!!errors.is_active}
                            />
                            <Label
                                htmlFor="is_active"
                                className="cursor-pointer"
                            >
                                Cliente activo
                            </Label>
                        </div>
                        {errors.is_active && (
                            <p className="text-sm text-destructive">
                                {errors.is_active}
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="flex items-center justify-end gap-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.history.back()}
                    disabled={isSubmitting}
                >
                    Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting
                        ? customer
                            ? 'Actualizando...'
                            : 'Creando...'
                        : customer
                          ? 'Actualizar Cliente'
                          : 'Crear Cliente'}
                </Button>
            </div>
        </form>
    );
}
