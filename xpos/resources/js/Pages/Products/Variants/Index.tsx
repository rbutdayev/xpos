import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Product, ProductVariant } from '@/types';
import { ArrowLeftIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import SecondaryButton from '@/Components/SecondaryButton';
import PrimaryButton from '@/Components/PrimaryButton';
import DangerButton from '@/Components/DangerButton';
import Modal from '@/Components/Modal';

interface Props {
  product: Product;
  variants: ProductVariant[];
}

export default function Index({ product, variants }: Props) {
  const [deletingVariant, setDeletingVariant] = useState<ProductVariant | null>(null);
  const [generatingBarcodes, setGeneratingBarcodes] = useState(false);

  const handleDelete = (variant: ProductVariant) => {
    if (!deletingVariant) return;

    router.delete(route('variants.destroy', variant.id), {
      onSuccess: () => {
        setDeletingVariant(null);
      },
    });
  };

  const handleToggleStatus = (variant: ProductVariant) => {
    router.post(route('variants.toggle-status', variant.id), {}, {
      preserveScroll: true,
    });
  };

  const handleGenerateBarcodes = async () => {
    setGeneratingBarcodes(true);
    try {
      await (window as any).axios.post(route('products.variants.generate-barcodes', product.id));
      router.reload({ only: ['variants'] });
    } catch (error) {
      console.error('Error generating barcodes:', error);
    } finally {
      setGeneratingBarcodes(false);
    }
  };

  const variantsWithoutBarcodes = variants.filter(v => !v.barcode).length;

  return (
    <AuthenticatedLayout>
      <Head title={`${product.name} - Variantlar`} />

      <div className="px-4 sm:px-6 lg:px-8">
        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
          {/* Header */}
          <div className="p-6 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Link href={route('products.show', product.id)} className="mr-4 text-gray-600 hover:text-gray-900">
                  <ArrowLeftIcon className="w-5 h-5" />
                </Link>
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">{product.name}</h2>
                  <p className="text-sm text-gray-500 mt-1">Məhsul Variantları</p>
                </div>
              </div>
              <div className="flex gap-2">
                {variantsWithoutBarcodes > 0 && (
                  <SecondaryButton
                    onClick={handleGenerateBarcodes}
                    disabled={generatingBarcodes}
                  >
                    {generatingBarcodes
                      ? 'Yaradılır...'
                      : `Barkod Yarat (${variantsWithoutBarcodes})`}
                  </SecondaryButton>
                )}
                <Link href={route('products.edit', product.id)}>
                  <PrimaryButton>Variant Əlavə Et</PrimaryButton>
                </Link>
              </div>
            </div>
          </div>

          {/* Variants Table */}
          <div className="overflow-x-auto">
            {variants.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500 mb-4">Heç bir variant tapılmadı</p>
                <Link href={route('products.edit', product.id)}>
                  <PrimaryButton>İlk Variantı Yarat</PrimaryButton>
                </Link>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ölçü
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rəng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Barkod
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stok
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Qiymət
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Əməliyyatlar
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {variants.map((variant) => (
                    <tr key={variant.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        #{variant.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {variant.size || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          {variant.color_code && (
                            <div
                              className="w-6 h-6 rounded border border-gray-300"
                              style={{ backgroundColor: variant.color_code }}
                              title={variant.color || ''}
                            />
                          )}
                          <span className="text-gray-900">{variant.color || '-'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {variant.sku || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {variant.barcode || (
                          <span className="text-orange-600">Barkod yoxdur</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <span
                          className={`font-medium ${
                            (variant.total_stock || 0) > 10
                              ? 'text-green-600'
                              : (variant.total_stock || 0) > 0
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          }`}
                        >
                          {variant.total_stock || 0} ədəd
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                        {variant.final_price?.toFixed(2) || '0.00'} ₼
                        {variant.price_adjustment !== 0 && (
                          <span className="text-xs text-gray-500 ml-1">
                            ({variant.price_adjustment > 0 ? '+' : ''}{variant.price_adjustment.toFixed(2)})
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleToggleStatus(variant)}
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            variant.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {variant.is_active ? 'Aktiv' : 'Deaktiv'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={route('variants.edit', variant.id)}
                            className="text-slate-600 hover:text-slate-900"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </Link>
                          <button
                            onClick={() => setDeletingVariant(variant)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Summary */}
          {variants.length > 0 && (
            <div className="p-4 bg-gray-50 border-t border-gray-200">
              <div className="flex justify-between text-sm">
                <div className="text-gray-600">
                  <span className="font-medium">{variants.length}</span> variant
                </div>
                <div className="text-gray-600">
                  <span className="font-medium">
                    {variants.filter(v => v.is_active).length}
                  </span>{' '}
                  aktiv
                </div>
                <div className="text-gray-600">
                  <span className="font-medium">
                    {variants.reduce((sum, v) => sum + (v.total_stock || 0), 0)}
                  </span>{' '}
                  ümumi stok
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal show={!!deletingVariant} onClose={() => setDeletingVariant(null)}>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Variantı Sil</h3>
          <p className="text-gray-600 mb-6">
            Bu variantı silmək istədiyinizdən əminsiniz?{' '}
            {deletingVariant?.size && deletingVariant?.color && (
              <span className="font-medium">
                ({deletingVariant.size} / {deletingVariant.color})
              </span>
            )}
          </p>
          {(deletingVariant?.total_stock || 0) > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
              <p className="text-sm text-yellow-800">
                <strong>Diqqət:</strong> Bu variantın {deletingVariant?.total_stock} ədəd stoku var.
              </p>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <SecondaryButton onClick={() => setDeletingVariant(null)}>
              Ləğv et
            </SecondaryButton>
            <DangerButton onClick={() => deletingVariant && handleDelete(deletingVariant)}>
              Sil
            </DangerButton>
          </div>
        </div>
      </Modal>
    </AuthenticatedLayout>
  );
}
