import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Configuración',
        href: '#',
    },
    {
        title: 'Tasas de Inflación',
        href: '/inflation-rates',
    },
];

export default function InflationRatesIndex() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tasas de Inflación" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">
                            Tasas de Inflación
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Configuración de tasas de inflación por año
                        </p>
                    </div>
                </div>
                <div className="relative min-h-[50vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                    <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <p className="text-muted-foreground">
                            Próximamente - Fase 4
                        </p>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
