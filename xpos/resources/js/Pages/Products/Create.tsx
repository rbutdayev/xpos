import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Category, Warehouse } from '@/types';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import ProductForm from './Components/ProductForm';
import { ProductFormState } from './Hooks/useProductForm';

interface Props {
  categories: Category[];
  warehouses: Warehouse[];
}

export default function Create({ categories, warehouses }: Props) {
  return (
    <AuthenticatedLayout>
      <Head title="Yeni Məhsul" />

      <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
          <div className="p-6 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Link href="/products" className="mr-4 text-gray-600 hover:text-gray-900">
                  <ArrowLeftIcon className="w-5 h-5" />
                </Link>
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Yeni Məhsul</h2>
                </div>
              </div>
            </div>

            <ProductForm
              mode="create"
              categories={categories}
              warehouses={warehouses}
              submitUrl={route('products.store')}
              cancelUrl={'/products'}
              method="post"
              onSubmitTransform={(form: ProductFormState) => {
                if (form.type === 'product') {
                  const transformed: any = {
                    ...form,
                    initial_stock: Object.entries(form.initial_stock || {})
                      .filter(([, qty]) => qty && qty !== '0')
                      .map(([warehouseId, quantity]) => ({
                        warehouse_id: parseInt(warehouseId, 10),
                        quantity: parseFloat(String(quantity)),
                        min_level: parseFloat(String((form.min_levels || {})[warehouseId] || '0')),
                      })),
                  };
                  const { min_levels, ...submission } = transformed;
                  return submission;
                }
                return {
                  name: form.name,
                  category_id: form.category_id,
                  parent_product_id: form.parent_product_id,
                  type: form.type,
                  description: form.description,
                  sale_price: form.sale_price,
                  unit: form.unit,
                };
              }}
            />
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

