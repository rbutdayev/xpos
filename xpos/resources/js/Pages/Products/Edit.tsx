import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Product, Category, Warehouse } from '@/types';
import ImageUploadSection from './Components/ImageUploadSection';
import { ArrowLeftIcon, EyeIcon } from '@heroicons/react/24/outline';
import ProductForm from './Components/ProductForm';
import { ProductFormState } from './Hooks/useProductForm';

interface DocumentData {
  id: number;
  original_name: string;
  file_type: string;
  file_size: number;
  document_type: string;
  description?: string;
  uploaded_at: string;
  uploaded_by?: string;
  download_url: string;
  thumbnail_url?: string;
}

interface Props {
  product: Product & { stock?: any[] };
  categories: Category[];
  warehouses: Warehouse[];
  documents?: DocumentData[];
}

export default function Edit({ product, categories, warehouses, documents = [] }: Props) {
  const initialData: Partial<ProductFormState> = {
    name: product.name || '',
    sku: product.sku || '',
    barcode: product.barcode || '',
    barcode_type: product.barcode_type || 'EAN-13',
    has_custom_barcode: product.has_custom_barcode || false,
    category_id: product.category_id ? String(product.category_id) : '',
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
    is_active: product.is_active,
  };

  return (
    <AuthenticatedLayout>
      <Head title={`${product.name} - Düzəlt`} />
      <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
          <div className="p-6 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Link href={`/products/${product.id}`} className="mr-4 text-gray-600 hover:text-gray-900">
                  <ArrowLeftIcon className="w-5 h-5" />
                </Link>
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Məhsulu Düzəlt</h2>
                  <p className="text-gray-600">{product.name}</p>
                </div>
              </div>
              <Link href={`/products/${product.id}`} className="inline-flex items-center px-4 py-2 bg-gray-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-gray-700">
                <EyeIcon className="w-4 h-4 mr-2" />
                Bax
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
                  is_active: form.is_active,
                } as any;
              }}
            />
            <ImageUploadSection productId={product.id} documents={documents} />
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
