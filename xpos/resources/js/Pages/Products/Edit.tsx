import { Head, Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Product, Category, Warehouse } from '@/types';
import ImageUploadSection from './Components/ImageUploadSection';
import { ArrowLeftIcon, EyeIcon } from '@heroicons/react/24/outline';
import ProductForm from './Components/ProductForm';
import { ProductFormState } from './Hooks/useProductForm';

interface PhotoData {
  id: number;
  original_url: string;
  medium_url: string;
  thumbnail_url: string;
  is_primary: boolean;
  alt_text?: string;
  sort_order: number;
}

interface ParentProduct {
  id: number;
  name: string;
  sku: string;
}

interface Props {
  product: Product & { stock?: any[] };
  parentProduct?: ParentProduct | null;
  categories: Category[];
  warehouses: Warehouse[];
  photos?: PhotoData[];
}

export default function Edit({ product, parentProduct, categories, warehouses, photos = [] }: Props) {
  const { t } = useTranslation('products');

  const initialData: Partial<ProductFormState> = {
    name: product.name || '',
    sku: product.sku || '',
    barcode: product.barcode || '',
    barcode_type: product.barcode_type || 'EAN-13',
    has_custom_barcode: product.has_custom_barcode || false,
    category_id: product.category_id ? String(product.category_id) : '',
    parent_product_id: product.parent_product_id ? String(product.parent_product_id) : null,
    type: (product.type as any) || 'product',
    description: product.description || '',
    purchase_price: product.purchase_price != null ? String(product.purchase_price) : '',
    sale_price: product.sale_price != null ? String(product.sale_price) : '',
    unit: product.unit || 'ədəd',
    packaging_size: product.packaging_size || '',
    base_unit: product.base_unit || '',
    packaging_quantity: product.packaging_quantity != null ? String(product.packaging_quantity) : '',
    allow_negative_stock: product.allow_negative_stock || false,
    brand: product.brand || '',
    model: product.model || '',
    attributes: product.attributes || {},
    is_active: product.is_active,
  };

  return (
    <AuthenticatedLayout>
      <Head title={`${product.name}${t('editSuffix')}`} />
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
          <div className="p-6 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Link href={`/products/${product.id}`} className="mr-4 text-gray-600 hover:text-gray-900">
                  <ArrowLeftIcon className="w-5 h-5" />
                </Link>
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">{t('editProductTitle')}</h2>
                  <p className="text-gray-600">{product.name}</p>
                  {parentProduct && (
                    <p className="text-sm text-indigo-600 mt-1">
                      {t('variant')} {parentProduct.name} ({parentProduct.sku})
                    </p>
                  )}
                </div>
              </div>
              <Link href={`/products/${product.id}`} className="inline-flex items-center px-4 py-2 bg-gray-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-gray-700">
                <EyeIcon className="w-4 h-4 mr-2" />
                {t('actions.view')}
              </Link>
            </div>

            <ProductForm
              mode="edit"
              initialData={initialData}
              categories={categories}
              warehouses={warehouses}
              submitUrl={route('products.update', product.id)}
              cancelUrl={`/products/${product.id}`}
              method="put"
              onSubmitTransform={(form: ProductFormState) => {
                // On update, send main fields only; stock updates are handled by dedicated flows
                return {
                  name: form.name,
                  sku: form.sku,
                  barcode: form.barcode,
                  barcode_type: form.barcode_type,
                  has_custom_barcode: form.has_custom_barcode,
                  category_id: form.category_id,
                  parent_product_id: form.parent_product_id,
                  type: form.type,
                  description: form.description,
                  purchase_price: form.purchase_price,
                  sale_price: form.sale_price,
                  unit: form.unit,
                  packaging_size: form.packaging_size,
                  base_unit: form.base_unit,
                  packaging_quantity: form.packaging_quantity,
                  allow_negative_stock: form.allow_negative_stock,
                  brand: form.brand,
                  model: form.model,
                  attributes: form.attributes,
                  is_active: form.is_active,
                } as any;
              }}
            />
            <ImageUploadSection productId={product.id} photos={photos} />
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
