import { store } from '@/actions/App/Http/Controllers/CustomerController';
import {
    CustomerForm,
    type CustomerFormData,
} from '@/components/customers/CustomerForm';
import { PageHeader } from '@/components/ui/page-header';
import { useInertiaForm } from '@/hooks/use-inertia-form';
import { useToast } from '@/hooks/use-toast';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { index as customersIndex } from '@/routes/customers';
import type { BusinessGroup, CustomerType } from '@/types';
import { Head, router } from '@inertiajs/react';
import { FormEvent } from 'react';

interface Props {
    customerTypes: CustomerType[];
    businessGroups: BusinessGroup[];
}

export default function CreateCustomer({
    customerTypes,
    businessGroups,
}: Props) {
    const { success, error } = useToast();

    const { data, setData, submit, processing, errors } =
        useInertiaForm<CustomerFormData>({
            initialValues: {
                name: '',
                code: '',
                tax_id: '',
                customer_type_id: '',
                business_group_id: '',
                is_active: true,
            },
            onSuccess: () => {
                success('Cliente creado exitosamente');
                router.visit(customersIndex.url());
            },
            onError: () => {
                error('Ocurrió un error al crear el cliente');
            },
        });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        submit(store());
    };

    const handleSetData = (
        field: Extract<keyof CustomerFormData, string>,
        value: string | boolean,
    ) => {
        setData(field, value);
    };

    return (
        <AppSidebarLayout>
            <Head title="Crear Cliente" />

            <div className="space-y-6">
                <PageHeader
                    title="Crear Cliente"
                    subtitle="Agrega un nuevo cliente al sistema"
                    breadcrumbs={[
                        { label: 'Clientes', href: customersIndex.url() },
                        { label: 'Crear' },
                    ]}
                />

                <CustomerForm
                    customerTypes={customerTypes}
                    businessGroups={businessGroups}
                    onSubmit={handleSubmit}
                    isSubmitting={processing}
                    errors={errors}
                    data={data}
                    setData={handleSetData}
                />
            </div>
        </AppSidebarLayout>
    );
}
