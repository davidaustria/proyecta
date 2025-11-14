import { store } from '@/actions/App/Http/Controllers/BusinessGroupController';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/ui/page-header';
import { Textarea } from '@/components/ui/textarea';
import { useInertiaForm } from '@/hooks/use-inertia-form';
import { useToast } from '@/hooks/use-toast';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { index as businessGroupsIndex } from '@/routes/business-groups';
import { Head, router } from '@inertiajs/react';
import { FormEvent } from 'react';

interface BusinessGroupFormData {
    name: string;
    code: string;
    description: string;
}

export default function CreateBusinessGroup() {
    const { success, error } = useToast();

    const { data, setData, submit, processing, errors } =
        useInertiaForm<BusinessGroupFormData>({
            initialValues: {
                name: '',
                code: '',
                description: '',
            },
            onSuccess: () => {
                success('Grupo empresarial creado exitosamente');
                router.visit(businessGroupsIndex.url());
            },
            onError: () => {
                error('Ocurrió un error al crear el grupo empresarial');
            },
        });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        submit(store());
    };

    return (
        <AppSidebarLayout>
            <Head title="Crear Grupo Empresarial" />

            <div className="space-y-6">
                <PageHeader
                    title="Crear Grupo Empresarial"
                    subtitle="Agrega un nuevo grupo empresarial al sistema"
                    breadcrumbs={[
                        {
                            label: 'Grupos Empresariales',
                            href: businessGroupsIndex.url(),
                        },
                        { label: 'Crear' },
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
                            {processing
                                ? 'Creando...'
                                : 'Crear Grupo Empresarial'}
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
