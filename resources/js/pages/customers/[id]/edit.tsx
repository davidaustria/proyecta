import { update } from '@/actions/App/Http/Controllers/CustomerController';
import {
    CustomerForm,
    type CustomerFormData,
} from '@/components/customers/CustomerForm';
import { PageHeader } from '@/components/ui/page-header';
import { useInertiaForm } from '@/hooks/use-inertia-form';
import { useToast } from '@/hooks/use-toast';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { index as customersIndex } from '@/routes/customers';
import type { BusinessGroup, Customer, CustomerType } from '@/types';
import { Head, router } from '@inertiajs/react';
import { FormEvent } from 'react';

interface Props {
    customer: Customer;
    customerTypes: CustomerType[];
    businessGroups: BusinessGroup[];
}

export default function EditCustomer({
    customer,
    customerTypes,
    businessGroups,
}: Props) {
    const { success, error } = useToast();

    const { data, setData, submit, processing, errors } =
        useInertiaForm<CustomerFormData>({
            initialValues: {
                name: customer.name,
                code: customer.code,
                tax_id: customer.tax_id || '',
                customer_type_id: customer.customer_type_id?.toString() || '',
                business_group_id: customer.business_group_id?.toString() || '',
                is_active: customer.is_active,
            },
            onSuccess: () => {
                success('Cliente actualizado exitosamente');
                router.visit(customersIndex.url());
            },
            onError: () => {
                error('Ocurrió un error al actualizar el cliente');
            },
        });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        submit(update(customer.id));
    };

    const handleSetData = (
        field: Extract<keyof CustomerFormData, string>,
        value: string | boolean,
    ) => {
        setData(field, value);
    };

    return (
        <AppSidebarLayout>
            <Head title={`Editar Cliente: ${customer.name}`} />

            <div className="space-y-6">
                <PageHeader
                    title="Editar Cliente"
                    subtitle={`Modificar información de ${customer.name}`}
                    breadcrumbs={[
                        { label: 'Clientes', href: customersIndex.url() },
                        {
                            label: customer.name,
                            href: `/customers/${customer.id}`,
                        },
                        { label: 'Editar' },
                    ]}
                />

                <CustomerForm
                    customer={customer}
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
