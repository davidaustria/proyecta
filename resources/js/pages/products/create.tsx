import { store } from '@/actions/App/Http/Controllers/ProductController';
import {
    ProductForm,
    type ProductFormData,
} from '@/components/products/ProductForm';
import { PageHeader } from '@/components/ui/page-header';
import { useInertiaForm } from '@/hooks/use-inertia-form';
import { useToast } from '@/hooks/use-toast';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { index as productsIndex } from '@/routes/products';
import { Head, router } from '@inertiajs/react';
import { FormEvent } from 'react';

export default function CreateProduct() {
    const { success, error } = useToast();

    const { data, setData, submit, processing, errors } =
        useInertiaForm<ProductFormData>({
            initialValues: {
                name: '',
                code: '',
                description: '',
                unit_price: '',
                is_active: true,
            },
            onSuccess: () => {
                success('Producto creado exitosamente');
                router.visit(productsIndex.url());
            },
            onError: () => {
                error('Ocurrió un error al crear el producto');
            },
        });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        submit(store());
    };

    const handleSetData = (
        field: Extract<keyof ProductFormData, string>,
        value: string | boolean,
    ) => {
        setData(field, value);
    };

    return (
        <AppSidebarLayout>
            <Head title="Crear Producto" />

            <div className="space-y-6">
                <PageHeader
                    title="Crear Producto"
                    subtitle="Agrega un nuevo producto al sistema"
                    breadcrumbs={[
                        { label: 'Productos', href: productsIndex.url() },
                        { label: 'Crear' },
                    ]}
                />

                <ProductForm
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
