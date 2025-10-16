import { Product } from '@/types';
import { formatQuantityWithUnit } from '@/utils/formatters';
import { ArchiveBoxIcon } from '@heroicons/react/24/outline';

export default function StockSection({ product }: { product: Product }) {
  const total = (product.stock || []).reduce((s, st: any) => s + (st.quantity || 0), 0);
  return (
    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
      <div className="p-6 border-b border-gray-200 flex items-center">
        <ArchiveBoxIcon className="w-5 h-5 text-gray-400 mr-2" />
        <h2 className="text-lg font-semibold text-gray-900">Stok Məlumatları</h2>
      </div>
      <div className="p-6">
        <div className="mb-4">
          <div className="text-2xl font-bold text-gray-900">{formatQuantityWithUnit(total, product.unit)}</div>
          <div className="text-sm text-gray-500">Ümumi stok</div>
        </div>
        {(product.stock && product.stock.length > 0) ? (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Anbar üzrə bölgü:</h3>
            {product.stock.map((stock: any) => (
              <div key={stock.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                <div>
                  <div className="font-medium text-gray-900">{stock.warehouse?.name}</div>
                  {stock.min_level && (
                    <div className="text-xs text-gray-500">Minimum: {formatQuantityWithUnit(stock.min_level, product.unit)}</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">{formatQuantityWithUnit(stock.quantity, product.unit)}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-500">Stok məlumatı yoxdur.</div>
        )}
      </div>
    </div>
  );
}

