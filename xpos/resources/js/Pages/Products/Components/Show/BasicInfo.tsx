import { Product } from '@/types';

export default function BasicInfo({ product }: { product: Product }) {
  return (
    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Əsas Məlumatlar</h2>
      </div>
      <div className="p-6">
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <dt className="text-sm font-medium text-gray-500">Məhsul Adı</dt>
            <dd className="mt-1 text-sm text-gray-900">{product.name}</dd>
          </div>
          {product.sku && (
            <div>
              <dt className="text-sm font-medium text-gray-500">SKU</dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono">{product.sku}</dd>
            </div>
          )}
          {product.barcode && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Barkod</dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono">{product.barcode}</dd>
            </div>
          )}
          {product.barcode_type && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Barkod Növü</dt>
              <dd className="mt-1 text-sm text-gray-900">{product.barcode_type}</dd>
            </div>
          )}
          {product.category && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Kateqoriya</dt>
              <dd className="mt-1 text-sm text-gray-900">{product.category.name}</dd>
            </div>
          )}
          <div>
            <dt className="text-sm font-medium text-gray-500">Ölçü Vahidi</dt>
            <dd className="mt-1 text-sm text-gray-900">{product.unit}</dd>
          </div>
          {product.brand && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Marka</dt>
              <dd className="mt-1 text-sm text-gray-900">{product.brand}</dd>
            </div>
          )}
          {product.model && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Model</dt>
              <dd className="mt-1 text-sm text-gray-900">{product.model}</dd>
            </div>
          )}
          {product.packaging_size && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Say/Həcm</dt>
              <dd className="mt-1 text-sm text-gray-900">{product.packaging_size}</dd>
            </div>
          )}
          {product.unit_price && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Vahid Qiyməti</dt>
              <dd className="mt-1 text-sm text-gray-900">{product.unit_price} AZN/{product.base_unit || product.unit}</dd>
            </div>
          )}
          {(product as any).service_type && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Xidmət Növü</dt>
              <dd className="mt-1 text-sm text-gray-900">{(product as any).service_type}</dd>
            </div>
          )}
          {(product as any).weight && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Çəki</dt>
              <dd className="mt-1 text-sm text-gray-900">{(product as any).weight} kq</dd>
            </div>
          )}
          {(product as any).dimensions && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Ölçülər</dt>
              <dd className="mt-1 text-sm text-gray-900">{(product as any).dimensions}</dd>
            </div>
          )}
          {(() => {
            const clothingAttributes = ['size', 'color', 'color_code', 'style', 'gender', 'season', 'material', 'collection', 'additional_notes', 'care_instructions', 'country_of_origin'];
            const attributes = (product as any).attributes;
            return attributes && Object.keys(attributes).some(key => !clothingAttributes.includes(key));
          })() && (
            <div className="md:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Digər Xüsusiyyətlər</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    const clothingAttributes = ['size', 'color', 'color_code', 'style', 'gender', 'season', 'material', 'collection', 'additional_notes', 'care_instructions', 'country_of_origin'];
                    const attributes = (product as any).attributes;
                    return Object.entries(attributes)
                      .filter(([key, value]) => !clothingAttributes.includes(key) && value)
                      .map(([key, value]) => (
                        <span key={key} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {key}: {typeof value === 'string' ? value : JSON.stringify(value)}
                        </span>
                      ));
                  })()}
                </div>
              </dd>
            </div>
          )}
        </dl>
        {product.description && (
          <div className="mt-6">
            <dt className="text-sm font-medium text-gray-500">Təsvir</dt>
            <dd className="mt-2 text-sm text-gray-900">{product.description}</dd>
          </div>
        )}
      </div>
    </div>
  );
}

