import { useState } from 'react';
import { router } from '@inertiajs/react';
import { PlusIcon, PencilIcon, TrashIcon, PlayIcon, PauseIcon } from '@heroicons/react/24/outline';
import DiscountModal from './DiscountModal';

interface ProductPrice {
  id: number;
  branch_id?: number;
  branch?: { id: number; name: string };
  discount_percentage: number;
  min_sale_price?: number;
  effective_from: string;
  effective_until?: string;
  is_active: boolean;
}

interface Product {
  id: number;
  name: string;
  sale_price?: number;
  prices?: ProductPrice[];
}

interface Branch {
  id: number;
  name: string;
}

interface Props {
  product: Product;
  branches: Branch[];
}

export default function DiscountSection({ product, branches }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [editingPrice, setEditingPrice] = useState<ProductPrice | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const prices = product.prices || [];
  const activePrices = prices.filter(p => p.is_active);
  const inactivePrices = prices.filter(p => !p.is_active);

  const handleAdd = () => {
    setEditingPrice(null);
    setShowModal(true);
  };

  const handleEdit = (price: ProductPrice) => {
    setEditingPrice(price);
    setShowModal(true);
  };

  const handleToggleActive = (priceId: number) => {
    router.post(route('product-prices.toggle-active', priceId), {}, {
      preserveScroll: true,
    });
  };

  const handleDelete = (priceId: number) => {
    if (confirm('Endirimi silmək istədiyinizdən əminsiniz?')) {
      setDeletingId(priceId);
      router.delete(route('product-prices.destroy', priceId), {
        preserveScroll: true,
        onFinish: () => setDeletingId(null),
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('az-AZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const calculateDiscountedPrice = (price: ProductPrice) => {
    const salePrice = Number(product.sale_price) || 0;
    return salePrice * (1 - price.discount_percentage / 100);
  };

  const isEffective = (price: ProductPrice) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const from = new Date(price.effective_from);
    from.setHours(0, 0, 0, 0);

    if (from > today) return false;

    if (price.effective_until) {
      const until = new Date(price.effective_until);
      until.setHours(23, 59, 59, 999);
      if (until < today) return false;
    }

    return true;
  };

  const renderPriceCard = (price: ProductPrice) => {
    const effective = isEffective(price);
    const discountedPrice = calculateDiscountedPrice(price);

    return (
      <div
        key={price.id}
        className={`p-4 rounded-lg border-2 ${
          price.is_active && effective
            ? 'border-green-200 bg-green-50'
            : price.is_active
            ? 'border-blue-200 bg-blue-50'
            : 'border-gray-200 bg-gray-50'
        }`}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl font-bold text-red-600">
                {price.discount_percentage}%
              </span>
              {price.is_active && effective && (
                <span className="px-2 py-0.5 text-xs font-medium bg-green-600 text-white rounded-full">
                  Aktiv
                </span>
              )}
              {price.is_active && !effective && (
                <span className="px-2 py-0.5 text-xs font-medium bg-blue-600 text-white rounded-full">
                  Gözləyir
                </span>
              )}
              {!price.is_active && (
                <span className="px-2 py-0.5 text-xs font-medium bg-gray-600 text-white rounded-full">
                  Dayandırılıb
                </span>
              )}
            </div>
            <div className="text-sm text-gray-600">
              {price.branch ? (
                <span className="font-medium">{price.branch.name}</span>
              ) : (
                <span className="font-medium">Bütün filiallar</span>
              )}
            </div>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => handleToggleActive(price.id)}
              className={`p-1.5 rounded hover:bg-white transition-colors ${
                price.is_active ? 'text-orange-600' : 'text-green-600'
              }`}
              title={price.is_active ? 'Dayandır' : 'Aktivləşdir'}
            >
              {price.is_active ? (
                <PauseIcon className="w-4 h-4" />
              ) : (
                <PlayIcon className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => handleEdit(price)}
              className="p-1.5 rounded text-blue-600 hover:bg-white transition-colors"
              title="Düzəlt"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(price.id)}
              disabled={deletingId === price.id}
              className="p-1.5 rounded text-red-600 hover:bg-white transition-colors disabled:opacity-50"
              title="Sil"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Orijinal qiymət:</span>
            <span className="font-medium line-through text-gray-500">
              {(Number(product.sale_price) || 0).toFixed(2)} AZN
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Endirimli qiymət:</span>
            <span className="font-bold text-green-600 text-lg">
              {discountedPrice.toFixed(2)} AZN
            </span>
          </div>
          <div className="pt-2 border-t border-gray-200">
            <div className="text-gray-600">
              📅 {formatDate(price.effective_from)}
              {price.effective_until && ` - ${formatDate(price.effective_until)}`}
              {!price.effective_until && ' - Müddətsiz'}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Endirimlər</h2>
            <p className="text-sm text-gray-600 mt-1">
              Məhsul üçün müddətli endirimlər
            </p>
          </div>
          <button
            onClick={handleAdd}
            className="inline-flex items-center px-4 py-2 bg-green-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-green-700 active:bg-green-900 transition ease-in-out duration-150"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Yeni Endirim
          </button>
        </div>

        <div className="p-6">
          {prices.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Hələ endirim yoxdur</p>
              <button
                onClick={handleAdd}
                className="mt-4 text-green-600 hover:text-green-700 font-medium"
              >
                İlk endirimi əlavə edin
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {activePrices.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                    Aktiv Endirimlər ({activePrices.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activePrices.map(renderPriceCard)}
                  </div>
                </div>
              )}

              {inactivePrices.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                    Dayandırılmış Endirimlər ({inactivePrices.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {inactivePrices.map(renderPriceCard)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <DiscountModal
          product={product}
          branches={branches}
          editingPrice={editingPrice}
          onClose={() => {
            setShowModal(false);
            setEditingPrice(null);
          }}
        />
      )}
    </>
  );
}
