import { update } from '@/actions/App/Http/Controllers/BusinessGroupController';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/ui/page-header';
import { Textarea } from '@/components/ui/textarea';
import { useInertiaForm } from '@/hooks/use-inertia-form';
import { useToast } from '@/hooks/use-toast';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { index as businessGroupsIndex } from '@/routes/business-groups';
import type { BusinessGroup } from '@/types';
import { Head, router } from '@inertiajs/react';
import { FormEvent } from 'react';

interface BusinessGroupFormData {
    name: string;
    code: string;
    description: string;
}

interface Props {
    businessGroup: BusinessGroup;
}

export default function EditBusinessGroup({ businessGroup }: Props) {
    const { success, error } = useToast();

    const { data, setData, submit, processing, errors } =
        useInertiaForm<BusinessGroupFormData>({
            initialValues: {
                name: businessGroup.name,
                code: businessGroup.code,
                description: businessGroup.description || '',
            },
            onSuccess: () => {
                success('Grupo empresarial actualizado exitosamente');
                router.visit(businessGroupsIndex.url());
            },
            onError: () => {
                error('Ocurrió un error al actualizar el grupo empresarial');
            },
        });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        submit(update(businessGroup.id));
    };

    return (
        <AppSidebarLayout>
            <Head title={`Editar Grupo Empresarial: ${businessGroup.name}`} />

            <div className="space-y-6">
                <PageHeader
                    title="Editar Grupo Empresarial"
                    subtitle={`Modificar información de ${businessGroup.name}`}
                    breadcrumbs={[
                        {
                            label: 'Grupos Empresariales',
                            href: businessGroupsIndex.url(),
                        },
                        { label: businessGroup.name },
                        { label: 'Editar' },
                    ]}
                />

                <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre *</Label>
                        <Input
                            id="name"
                            type="text"
                            placeholder="Ej: Grupo Corporativo, División Norte"
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
                            placeholder="Ej: GC, DN, DSU"
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
                            placeholder="Descripción del grupo empresarial (opcional)"
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
                                router.visit(businessGroupsIndex.url())
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
