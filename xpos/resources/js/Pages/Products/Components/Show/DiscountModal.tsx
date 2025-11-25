import { useState, FormEvent } from 'react';
import { router } from '@inertiajs/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ProductPrice {
  id: number;
  branch_id?: number;
  discount_percentage: number;
  min_sale_price?: number;
  effective_from: string;
  effective_until?: string;
}

interface Product {
  id: number;
  name: string;
  sale_price?: number;
}

interface Branch {
  id: number;
  name: string;
}

interface Props {
  product: Product;
  branches: Branch[];
  editingPrice: ProductPrice | null;
  onClose: () => void;
}

export default function DiscountModal({ product, branches, editingPrice, onClose }: Props) {
  const [formData, setFormData] = useState({
    branch_id: editingPrice?.branch_id?.toString() || '',
    discount_percentage: editingPrice?.discount_percentage?.toString() || '',
    min_sale_price: editingPrice?.min_sale_price?.toString() || '',
    effective_from: editingPrice?.effective_from || new Date().toISOString().split('T')[0],
    effective_until: editingPrice?.effective_until || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);

  const salePrice = Number(product.sale_price) || 0;
  const discountPercentage = parseFloat(formData.discount_percentage) || 0;
  const discountedPrice = discountPercentage > 0
    ? salePrice * (1 - discountPercentage / 100)
    : salePrice;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    const data = {
      branch_id: formData.branch_id || null,
      discount_percentage: parseFloat(formData.discount_percentage),
      min_sale_price: formData.min_sale_price ? parseFloat(formData.min_sale_price) : null,
      effective_from: formData.effective_from,
      effective_until: formData.effective_until || null,
    };

    const url = editingPrice
      ? route('product-prices.update', editingPrice.id)
      : route('products.prices.store', product.id);

    const method = editingPrice ? 'put' : 'post';

    router[method](url, data, {
      preserveScroll: true,
      onSuccess: () => {
        onClose();
      },
      onError: (errors: any) => {
        setErrors(errors);
        setProcessing(false);
      },
      onFinish: () => {
        setProcessing(false);
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingPrice ? 'Endirimi Düzəlt' : 'Yeni Endirim'}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Product Info */}
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-sm font-medium text-gray-700">{product.name}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    Cari satış qiyməti: <span className="font-semibold">{salePrice.toFixed(2)} AZN</span>
                  </div>
                </div>

                {/* Branch Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Filial
                  </label>
                  <select
                    value={formData.branch_id}
                    onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                  >
                    <option value="">Bütün filiallar</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                  {errors.branch_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.branch_id}</p>
                  )}
                </div>

                {/* Discount Percentage */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Endirim Faizi (%) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    required
                    value={formData.discount_percentage}
                    onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                    placeholder="Məs: 20"
                  />
                  {errors.discount_percentage && (
                    <p className="mt-1 text-sm text-red-600">{errors.discount_percentage}</p>
                  )}
                </div>

                {/* Discounted Price Preview */}
                {formData.discount_percentage && (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Endirimli qiymət:</span>
                      <span className="text-lg font-bold text-green-600">
                        {discountedPrice.toFixed(2)} AZN
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      Qənaət: {(salePrice - discountedPrice).toFixed(2)} AZN
                    </div>
                  </div>
                )}

                {/* Effective From */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Başlanğıc Tarixi *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.effective_from}
                    onChange={(e) => setFormData({ ...formData, effective_from: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                  />
                  {errors.effective_from && (
                    <p className="mt-1 text-sm text-red-600">{errors.effective_from}</p>
                  )}
                </div>

                {/* Effective Until */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bitmə Tarixi (boş qoyun - müddətsiz)
                  </label>
                  <input
                    type="date"
                    value={formData.effective_until}
                    onChange={(e) => setFormData({ ...formData, effective_until: e.target.value })}
                    min={formData.effective_from}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                  />
                  {errors.effective_until && (
                    <p className="mt-1 text-sm text-red-600">{errors.effective_until}</p>
                  )}
                </div>

                {/* Min Sale Price (optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Satış Qiyməti (ixtiyari)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.min_sale_price}
                    onChange={(e) => setFormData({ ...formData, min_sale_price: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                    placeholder="Məs: 50.00"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Qiymət bu məbləğdən aşağı düşməyəcək
                  </p>
                  {errors.min_sale_price && (
                    <p className="mt-1 text-sm text-red-600">{errors.min_sale_price}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
              <button
                type="submit"
                disabled={processing}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {processing ? 'Saxlanılır...' : editingPrice ? 'Yenilə' : 'Əlavə et'}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={processing}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                Ləğv et
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
