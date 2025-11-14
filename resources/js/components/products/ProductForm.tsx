import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Product } from '@/types';
import React, { FormEvent } from 'react';

export interface ProductFormData {
    name: string;
    code: string;
    description: string;
    unit_price: string;
    is_active: boolean;
}

export interface ProductFormProps {
    product?: Product;
    onSubmit: (e: FormEvent) => void;
    isSubmitting: boolean;
    errors: Partial<Record<Extract<keyof ProductFormData, string>, string>>;
    data: ProductFormData;
    setData: (
        field: Extract<keyof ProductFormData, string>,
        value: string | boolean,
    ) => void;
}

export function ProductForm({
    product,
    onSubmit,
    isSubmitting,
    errors,
    data,
    setData,
}: ProductFormProps) {
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
                                placeholder="Nombre del producto"
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
                                placeholder="Código único del producto"
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
                            <Label htmlFor="unit_price">Precio Unitario</Label>
                            <Input
                                id="unit_price"
                                name="unit_price"
                                type="number"
                                step="0.01"
                                min="0"
                                value={data.unit_price}
                                onChange={(e) =>
                                    setData('unit_price', e.target.value)
                                }
                                placeholder="0.00"
                                aria-invalid={!!errors.unit_price}
                                disabled={isSubmitting}
                            />
                            {errors.unit_price && (
                                <p className="text-sm text-destructive">
                                    {errors.unit_price}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Descripción</Label>
                            <Textarea
                                id="description"
                                name="description"
                                value={data.description}
                                onChange={(
                                    e: React.ChangeEvent<HTMLTextAreaElement>,
                                ) => setData('description', e.target.value)}
                                placeholder="Descripción del producto (opcional)"
                                aria-invalid={!!errors.description}
                                disabled={isSubmitting}
                                className="resize-none"
                                rows={4}
                            />
                            {errors.description && (
                                <p className="text-sm text-destructive">
                                    {errors.description}
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
                                Producto activo
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
                        ? product
                            ? 'Actualizando...'
                            : 'Creando...'
                        : product
                          ? 'Actualizar Producto'
                          : 'Crear Producto'}
                </Button>
            </div>
        </form>
    );
}
