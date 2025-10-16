import { Product } from '@/types';

export default function SettingsSection({ product }: { product: Product }) {
  return (
    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Ayarlar</h2>
      </div>
      <div className="p-6 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Status</span>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {product.is_active ? 'Aktiv' : 'Qeyri-aktiv'}
          </span>
        </div>
        {product.type === 'product' && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Mənfi stok</span>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${product.allow_negative_stock ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
              {product.allow_negative_stock ? 'İcazə verilir' : 'İcazə verilmir'}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Barkod</span>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${product.has_custom_barcode ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
            {product.has_custom_barcode ? 'Xüsusi' : 'Avtomatik'}
          </span>
        </div>
      </div>
    </div>
  );
}

