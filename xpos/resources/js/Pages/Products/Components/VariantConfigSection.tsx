import { useState } from 'react';
import ParentProductSelect from '@/Components/ParentProductSelect';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

interface Props {
  data: any;
  errors: Record<string, string>;
  onChange: (field: string, value: any) => void;
}

export default function VariantConfigSection({ data, errors, onChange }: Props) {
  const [isVariant, setIsVariant] = useState(!!data.parent_product_id);

  const handleToggleVariant = (enabled: boolean) => {
    setIsVariant(enabled);
    if (!enabled) {
      onChange('parent_product_id', null);
    }
  };

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Variant Konfiqurasiyası (E-Mağaza)</h3>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex gap-3">
            <InformationCircleIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Məhsul Variantları Haqqında</p>
              <p>
                Əgər bu məhsul bir variantdırsa (məsələn, "Gödəkçə M Qırmızı"), aşağıdan ana məhsulu seçin.
                E-mağaza variantları birləşdirəcək, POS isə hər birini ayrı məhsul kimi öz barkodu ilə qəbul edəcək.
              </p>
            </div>
          </div>
        </div>

        {/* Is Variant Checkbox */}
        <div className="mb-6">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isVariant}
              onChange={(e) => handleToggleVariant(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
            <span className="ml-2 text-sm font-medium text-gray-700">
              Bu məhsul başqa bir məhsulun variantıdır (ana məhsul)
            </span>
          </label>
        </div>

        {isVariant && (
          <div className="space-y-6 border-t border-gray-200 pt-6">
            {/* Parent Product Selector */}
            <div>
              <ParentProductSelect
                value={data.parent_product_id ? parseInt(data.parent_product_id) : null}
                onChange={(productId) => onChange('parent_product_id', productId ? productId.toString() : null)}
                label="Ana Məhsul"
                error={errors.parent_product_id}
                placeholder="Ana məhsulu ID, ad və ya SKU ilə axtarın..."
                required
              />
            </div>

            {/* How it works */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-700 font-medium mb-2">
                Necə işləyir:
              </p>
              <ul className="mt-2 text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>Hər bir variant öz SKU və barkodu ilə POS-da ayrıca görünür</li>
                <li>E-mağaza variantları ana məhsul altında qruplaşdırır</li>
                <li>Müştərilər məhsul səhifəsində ölçü/rəng seçimlərini görür</li>
                <li>Stok hər variant üçün ayrıca izlənilir</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
