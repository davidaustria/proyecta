import type { ScenarioFormData } from '@/components/scenarios/ScenarioForm';
import { ScenarioForm } from '@/components/scenarios/ScenarioForm';
import { PageHeader } from '@/components/ui/page-header';
import { useToast } from '@/hooks/use-toast';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import type { Scenario } from '@/types';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

interface Props {
    scenario: Scenario;
}

export default function EditScenario({ scenario }: Props) {
    const toast = useToast();
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSubmit = (data: ScenarioFormData) => {
        setProcessing(true);

        router.put(`/api/v1/scenarios/${scenario.id}`, data, {
            onSuccess: () => {
                toast.success('El escenario ha sido actualizado exitosamente.', {
                    title: 'Escenario actualizado',
                });
                router.visit('/scenarios');
            },
            onError: (errors) => {
                setErrors(errors as Record<string, string>);
                toast.error(
                    'Hubo un error al actualizar el escenario. Verifica los campos.',
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

    return (
        <AppSidebarLayout>
            <Head title={`Editar: ${scenario.name}`} />

            <PageHeader
                title={`Editar Escenario: ${scenario.name}`}
                subtitle="Modifica la configuración del escenario"
            />

            <div className="mx-auto max-w-3xl">
                <ScenarioForm
                    scenario={scenario}
                    onSubmit={handleSubmit}
                    processing={processing}
                    errors={errors}
                />
            </div>
        </AppSidebarLayout>
    );
}
