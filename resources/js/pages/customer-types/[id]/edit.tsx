import { update } from '@/actions/App/Http/Controllers/CustomerTypeController';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/ui/page-header';
import { Textarea } from '@/components/ui/textarea';
import { useInertiaForm } from '@/hooks/use-inertia-form';
import { useToast } from '@/hooks/use-toast';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { index as customerTypesIndex } from '@/routes/customer-types';
import type { CustomerType } from '@/types';
import { Head, router } from '@inertiajs/react';
import { FormEvent } from 'react';

interface CustomerTypeFormData extends Record<string, unknown> {
    name: string;
    code: string;
    description: string;
}

interface Props {
    customerType: CustomerType;
}

export default function EditCustomerType({ customerType }: Props) {
    const { success, error } = useToast();

    const { data, setData, submit, processing, errors } =
        useInertiaForm<CustomerTypeFormData>({
            initialValues: {
                name: customerType.name,
                code: customerType.code,
                description: customerType.description || '',
            },
            onSuccess: () => {
                success('Tipo de cliente actualizado exitosamente');
                router.visit(customerTypesIndex.url());
            },
            onError: () => {
                error('Ocurrió un error al actualizar el tipo de cliente');
            },
        });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        submit(update(customerType.id));
    };

    return (
        <AppSidebarLayout>
            <Head title={`Editar Tipo de Cliente: ${customerType.name}`} />

            <div className="space-y-6">
                <PageHeader
                    title="Editar Tipo de Cliente"
                    subtitle={`Modificar información de ${customerType.name}`}
                    breadcrumbs={[
                        {
                            label: 'Tipos de Cliente',
                            href: customerTypesIndex.url(),
                        },
                        { label: customerType.name },
                        { label: 'Editar' },
                    ]}
                />

                <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre *</Label>
                        <Input
                            id="name"
                            type="text"
                            placeholder="Ej: Minorista, Mayorista, Distribuidor"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            disabled={processing}
                        />
                        {errors.name && (
                            <p className="text-sm text-destructive">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="code">Código *</Label>
                        <Input
                            id="code"
                            type="text"
                            placeholder="Ej: MIN, MAY, DIS"
                            value={data.code}
                            onChange={(e) => setData('code', e.target.value)}
                            disabled={processing}
                        />
                        {errors.code && (
                            <p className="text-sm text-destructive">
                                {errors.code}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Descripción</Label>
                        <Textarea
                            id="description"
                            placeholder="Descripción del tipo de cliente (opcional)"
                            value={data.description}
                            onChange={(e) =>
                                setData('description', e.target.value)
                            }
                            disabled={processing}
                            rows={4}
                        />
                        {errors.description && (
                            <p className="text-sm text-destructive">
                                {errors.description}
                            </p>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                                router.visit(customerTypesIndex.url())
                            }
                            disabled={processing}
                        >
                            Cancelar
                        </Button>
                    </div>
                </form>
            </div>
        </AppSidebarLayout>
    );
}
