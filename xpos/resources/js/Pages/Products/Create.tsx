import { Head, Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('products');

  return (
    <AuthenticatedLayout>
      <Head title={t('newProduct')} />

      <div className="px-4 sm:px-6 lg:px-8">
        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
          <div className="p-4 sm:p-6 bg-white border-b border-gray-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center">
                <Link href="/products" className="mr-4 text-gray-600 hover:text-gray-900">
                  <ArrowLeftIcon className="w-5 h-5" />
                </Link>
                <div>
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">{t('newProduct')}</h2>
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
            />
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

