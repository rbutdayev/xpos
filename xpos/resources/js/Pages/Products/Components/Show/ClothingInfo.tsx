import { Product } from '@/types';
import { SparklesIcon } from '@heroicons/react/24/outline';

export default function ClothingInfo({ product }: { product: Product }) {
  const attributes = (product as any).attributes;
  
  // Check for any clothing-related attributes
  const clothingAttributes = [
    'size', 'color', 'color_code', 'style', 'gender', 'season', 
    'material', 'collection', 'additional_notes', 'care_instructions', 'country_of_origin'
  ];
  
  if (!attributes || !clothingAttributes.some(attr => attributes[attr])) {
    return null;
  }

  return (
    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
      <div className="p-6 border-b border-gray-200 flex items-center">
        <SparklesIcon className="w-5 h-5 text-purple-500 mr-2" />
        <h2 className="text-lg font-semibold text-gray-900">Geyim Məlumatları</h2>
      </div>
      <div className="p-6">
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {attributes.size && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Ölçü</dt>
              <dd className="mt-1">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                  {attributes.size}
                </span>
              </dd>
            </div>
          )}
          
          {attributes.color && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Rəng</dt>
              <dd className="mt-1 flex items-center space-x-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {attributes.color}
                </span>
                {attributes.color_code && (
                  <div className="flex items-center space-x-1">
                    <div 
                      className="w-6 h-6 rounded-full border-2 border-gray-300" 
                      style={{ backgroundColor: attributes.color_code }}
                      title={`Rəng kodu: ${attributes.color_code}`}
                    />
                    <span className="text-xs text-gray-500 font-mono">
                      {attributes.color_code}
                    </span>
                  </div>
                )}
              </dd>
            </div>
          )}
          
          {attributes.color_code && !attributes.color && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Rəng Kodu</dt>
              <dd className="mt-1 flex items-center space-x-2">
                <div 
                  className="w-6 h-6 rounded-full border-2 border-gray-300" 
                  style={{ backgroundColor: attributes.color_code }}
                  title={`Rəng kodu: ${attributes.color_code}`}
                />
                <span className="text-sm text-gray-900 font-mono">
                  {attributes.color_code}
                </span>
              </dd>
            </div>
          )}

          {attributes.style && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Stil</dt>
              <dd className="mt-1 text-sm text-gray-900">{attributes.style}</dd>
            </div>
          )}

          {attributes.gender && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Cins</dt>
              <dd className="mt-1 text-sm text-gray-900">{attributes.gender}</dd>
            </div>
          )}

          {attributes.season && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Mövsüm</dt>
              <dd className="mt-1 text-sm text-gray-900">{attributes.season}</dd>
            </div>
          )}

          {attributes.material && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Material</dt>
              <dd className="mt-1 text-sm text-gray-900">{attributes.material}</dd>
            </div>
          )}

          {attributes.collection && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Kolleksiya</dt>
              <dd className="mt-1 text-sm text-gray-900">{attributes.collection}</dd>
            </div>
          )}

          {attributes.country_of_origin && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Mənşə ölkəsi</dt>
              <dd className="mt-1 text-sm text-gray-900">{attributes.country_of_origin}</dd>
            </div>
          )}
        </dl>

        {/* Additional Notes Section */}
        {attributes.additional_notes && (
          <div className="mt-6">
            <dt className="text-sm font-medium text-gray-500">Əlavə qeydlər</dt>
            <dd className="mt-2 text-sm text-gray-900 p-3 bg-gray-50 rounded-lg">
              {attributes.additional_notes}
            </dd>
          </div>
        )}

        {/* Care Instructions Section */}
        {attributes.care_instructions && (
          <div className="mt-6">
            <dt className="text-sm font-medium text-gray-500">Baxım təlimatları</dt>
            <dd className="mt-2 text-sm text-gray-900 p-3 bg-blue-50 rounded-lg">
              {attributes.care_instructions}
            </dd>
          </div>
        )}
        
        {/* Show other non-clothing attributes if any exist */}
        {Object.keys(attributes).some(key => !clothingAttributes.includes(key)) && (
          <div className="mt-6">
            <dt className="text-sm font-medium text-gray-500 mb-2">Digər Xüsusiyyətlər</dt>
            <dd className="flex flex-wrap gap-2">
              {Object.entries(attributes)
                .filter(([key, value]) => !clothingAttributes.includes(key) && value)
                .map(([key, value]) => (
                  <span key={key} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {key}: {typeof value === 'string' ? value : JSON.stringify(value)}
                  </span>
                ))
              }
            </dd>
          </div>
        )}
      </div>
    </div>
  );
}