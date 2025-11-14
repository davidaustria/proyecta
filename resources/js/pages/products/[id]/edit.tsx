import { update } from '@/actions/App/Http/Controllers/ProductController';
import {
    ProductForm,
    type ProductFormData,
} from '@/components/products/ProductForm';
import { PageHeader } from '@/components/ui/page-header';
import { useInertiaForm } from '@/hooks/use-inertia-form';
import { useToast } from '@/hooks/use-toast';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { index as productsIndex } from '@/routes/products';
import type { Product } from '@/types';
import { Head, router } from '@inertiajs/react';
import { FormEvent } from 'react';

interface Props {
    product: Product;
}

export default function EditProduct({ product }: Props) {
    const { success, error } = useToast();

    const { data, setData, submit, processing, errors } =
        useInertiaForm<ProductFormData>({
            initialValues: {
                name: product.name,
                code: product.code,
                description: product.description || '',
                unit_price: product.unit_price?.toString() || '',
                is_active: product.is_active,
            },
            onSuccess: () => {
                success('Producto actualizado exitosamente');
                router.visit(productsIndex.url());
            },
            onError: () => {
                error('Ocurrió un error al actualizar el producto');
            },
        });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        submit(update(product.id));
    };

    const handleSetData = (
        field: Extract<keyof ProductFormData, string>,
        value: string | boolean,
    ) => {
        setData(field, value);
    };

    return (
        <AppSidebarLayout>
            <Head title={`Editar Producto: ${product.name}`} />

            <div className="space-y-6">
                <PageHeader
                    title="Editar Producto"
                    subtitle={`Modificar información de ${product.name}`}
                    breadcrumbs={[
                        { label: 'Productos', href: productsIndex.url() },
                        {
                            label: product.name,
                            href: `/products/${product.id}`,
                        },
                        { label: 'Editar' },
                    ]}
                />

                <ProductForm
                    product={product}
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
