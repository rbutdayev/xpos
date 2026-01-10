import { Head, Link, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Product } from '@/types';
import { ArrowLeftIcon, PencilIcon, CubeIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import BasicInfo from './Components/Show/BasicInfo';
import StockSection from './Components/Show/StockSection';
import PricingSummary from './Components/Show/PricingSummary';
import SettingsSection from './Components/Show/SettingsSection';
import ClothingInfo from './Components/Show/ClothingInfo';
import DiscountSection from './Components/Show/DiscountSection';
import ImageUploadSection from './Components/ImageUploadSection';

interface PhotoData {
  id: number;
  original_url: string;
  medium_url: string;
  thumbnail_url: string;
  is_primary: boolean;
  alt_text?: string;
  sort_order: number;
}

interface Branch {
  id: number;
  name: string;
}

interface Props {
  product: Product & { stockHistory?: any[] };
  photos: PhotoData[];
  branches: Branch[];
}

export default function Show({ product, photos, branches }: Props) {
  const { t } = useTranslation('products');
  const { auth } = usePage().props as any;
  const currentUser = auth.user;

  const totalStock = (product.stock || []).reduce((s: number, x: any) => s + (x.quantity || 0), 0);
  const hasLowStock = (product.stock || []).some((s: any) => s.min_level && s.quantity <= s.min_level);
  const stockStatus = totalStock <= 0
    ? { text: t('stockStatuses.outOfStock'), color: 'text-red-600 bg-red-100' }
    : hasLowStock
      ? { text: t('stockStatuses.lowStockRemaining'), color: 'text-yellow-600 bg-yellow-100' }
      : { text: t('stockStatuses.inStock'), color: 'text-green-600 bg-green-100' };

  return (
    <AuthenticatedLayout>
      <Head title={`${product.name}${t('detailsSuffix')}`} />

      <div className="mx-auto sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/products" className="mr-4 text-gray-600 hover:text-gray-900">
              <ArrowLeftIcon className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
              <div className="flex items-center mt-1 space-x-3">
                <div className="flex items-center">
                  {product.type === 'service' ? (
                    <WrenchScrewdriverIcon className="w-4 h-4 text-blue-500 mr-1" />
                  ) : (
                    <CubeIcon className="w-4 h-4 text-gray-500 mr-1" />
                  )}
                  <span className="text-sm text-gray-600">
                    {product.type === 'service' ? t('types.service') : t('types.product')}
                  </span>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${stockStatus.color}`}>
                  {stockStatus.text}
                </span>
              </div>
              {product.parentProduct && (
                <div className="mt-2 flex items-center">
                  <Link
                    href={`/products/${product.parentProduct.id}`}
                    className="text-sm text-slate-600 hover:text-slate-800 hover:underline"
                  >
                    <span className="text-gray-500">{t('variant')}</span> {product.parentProduct.name} ({product.parentProduct.sku})
                  </Link>
                </div>
              )}
            </div>
          </div>
          {currentUser?.role !== 'sales_staff' && (
            <Link href={`/products/${product.id}/edit`} className="inline-flex items-center px-4 py-2 bg-slate-700 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-slate-600">
              <PencilIcon className="w-4 h-4 mr-2" />
              {t('actions.edit')}
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <BasicInfo product={product as any} />
            <ClothingInfo product={product as any} />
            {product.type === 'product' && <StockSection product={product as any} />}
          </div>
          <div className="space-y-6">
            <PricingSummary product={product as any} />
            <SettingsSection product={product as any} />
          </div>
        </div>

        {/* Discount Management Section */}
        <div className="mt-6">
          <DiscountSection product={product as any} branches={branches} />
        </div>

        <ImageUploadSection productId={product.id} photos={photos} />
      </div>
    </AuthenticatedLayout>
  );
}

