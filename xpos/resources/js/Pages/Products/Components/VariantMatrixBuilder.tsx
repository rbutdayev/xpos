import { useState, useMemo } from 'react';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Checkbox from '@/Components/Checkbox';
import { ProductVariant } from '@/types';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface Props {
  productId?: number;
  basePrice?: number;
  onVariantsGenerated?: (variants: Partial<ProductVariant>[]) => void;
  className?: string;
}

interface ColorOption {
  name: string;
  code: string;
}

const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

export default function VariantMatrixBuilder({ productId, basePrice = 0, onVariantsGenerated, className = '' }: Props) {
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [colors, setColors] = useState<ColorOption[]>([]);
  const [newColorName, setNewColorName] = useState('');
  const [newColorCode, setNewColorCode] = useState('#000000');
  const [priceAdjustments, setPriceAdjustments] = useState<Record<string, number>>({});
  const [showPreview, setShowPreview] = useState(false);

  const toggleSize = (size: string) => {
    setSelectedSizes(prev =>
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  const addColor = () => {
    if (!newColorName.trim()) return;

    setColors(prev => [...prev, { name: newColorName.trim(), code: newColorCode }]);
    setNewColorName('');
    setNewColorCode('#000000');
  };

  const removeColor = (index: number) => {
    setColors(prev => prev.filter((_, i) => i !== index));
  };

  const handlePriceAdjustment = (size: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setPriceAdjustments(prev => ({ ...prev, [size]: numValue }));
  };

  const generatedVariants = useMemo(() => {
    const variants: Partial<ProductVariant>[] = [];

    selectedSizes.forEach(size => {
      colors.forEach(color => {
        variants.push({
          size,
          color: color.name,
          color_code: color.code,
          price_adjustment: priceAdjustments[size] || 0,
          is_active: true,
        });
      });
    });

    return variants;
  }, [selectedSizes, colors, priceAdjustments]);

  const handleGenerate = () => {
    if (onVariantsGenerated) {
      onVariantsGenerated(generatedVariants);
    }
  };

  const canGenerate = selectedSizes.length > 0 && colors.length > 0;

  return (
    <div className={`bg-white shadow-sm rounded-lg overflow-hidden ${className}`}>
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Variant Matrisi Qurucusu</h3>
        <p className="text-sm text-gray-500 mt-1">Ölçü və rəngləri seçərək avtomatik variantlar yaradın</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Size Selection */}
        <div>
          <InputLabel value="Ölçülər" className="mb-2" />
          <div className="flex flex-wrap gap-2">
            {DEFAULT_SIZES.map(size => (
              <button
                key={size}
                type="button"
                onClick={() => toggleSize(size)}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  selectedSizes.includes(size)
                    ? 'bg-slate-700 text-white hover:bg-slate-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
          {selectedSizes.length > 0 && (
            <p className="text-sm text-gray-600 mt-2">
              Seçilmiş: {selectedSizes.join(', ')}
            </p>
          )}
        </div>

        {/* Price Adjustments */}
        {selectedSizes.length > 0 && (
          <div>
            <InputLabel value="Ölçü üzrə qiymət fərqi" className="mb-2" />
            <p className="text-sm text-gray-500 mb-3">
              Bəzi ölçülər üçün əlavə qiymət tətbiq edin (məs. XL və daha böyük ölçülər)
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {selectedSizes.map(size => (
                <div key={size} className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700 w-10">{size}:</span>
                  <TextInput
                    type="number"
                    step="0.01"
                    value={priceAdjustments[size] || ''}
                    onChange={(e) => handlePriceAdjustment(size, e.target.value)}
                    placeholder="0.00"
                    className="flex-1"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Color Picker */}
        <div>
          <InputLabel value="Rənglər" className="mb-2" />
          <div className="flex gap-2 mb-3">
            <TextInput
              type="text"
              value={newColorName}
              onChange={(e) => setNewColorName(e.target.value)}
              placeholder="Rəng adı (məs. Qırmızı)"
              className="flex-1"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addColor();
                }
              }}
            />
            <input
              type="color"
              value={newColorCode}
              onChange={(e) => setNewColorCode(e.target.value)}
              className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
            />
            <SecondaryButton type="button" onClick={addColor} disabled={!newColorName.trim()}>
              Əlavə et
            </SecondaryButton>
          </div>

          {/* Colors List */}
          {colors.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {colors.map((color, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-md border border-gray-200"
                >
                  <div
                    className="w-6 h-6 rounded border border-gray-300"
                    style={{ backgroundColor: color.code }}
                  />
                  <span className="text-sm font-medium text-gray-700">{color.name}</span>
                  <button
                    type="button"
                    onClick={() => removeColor(index)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Preview */}
        {canGenerate && (
          <div>
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="text-sm font-medium text-slate-600 hover:text-slate-700"
            >
              {showPreview ? 'Önizləməni gizlət' : 'Önizləmə göstər'}
            </button>

            {showPreview && (
              <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-700">
                    {generatedVariants.length} variant yaradılacaq
                  </p>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ölçü</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rəng</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qiymət fərqi</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Son qiymət</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {generatedVariants.map((variant, index) => {
                        const finalPrice = basePrice + (variant.price_adjustment || 0);
                        return (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-sm text-gray-900">{variant.size}</td>
                            <td className="px-4 py-2 text-sm">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-4 h-4 rounded border border-gray-300"
                                  style={{ backgroundColor: variant.color_code }}
                                />
                                <span className="text-gray-900">{variant.color}</span>
                              </div>
                            </td>
                            <td className="px-4 py-2 text-sm text-right text-gray-900">
                              {variant.price_adjustment ? `+${variant.price_adjustment.toFixed(2)} ₼` : '-'}
                            </td>
                            <td className="px-4 py-2 text-sm text-right font-medium text-gray-900">
                              {finalPrice.toFixed(2)} ₼
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Generate Button */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <PrimaryButton
            type="button"
            onClick={handleGenerate}
            disabled={!canGenerate}
          >
            {generatedVariants.length} Variant Yarat
          </PrimaryButton>
        </div>

        {!canGenerate && (
          <p className="text-sm text-gray-500 text-center">
            Variant yaratmaq üçün ən azı 1 ölçü və 1 rəng seçin
          </p>
        )}
      </div>
    </div>
  );
}
