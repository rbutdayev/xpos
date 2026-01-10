import React, { useState, useMemo } from 'react';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { Product, ProductVariant } from '@/types';

interface Props {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (product: Product, variant: ProductVariant) => void;
}

function VariantSelectorModal({ product, isOpen, onClose, onSelect }: Props) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  // Get unique sizes and colors from variants
  const { sizes, colors } = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return { sizes: [], colors: [] };
    }

    const sizesSet = new Set<string>();
    const colorsMap = new Map<string, string>(); // color name -> color code

    product.variants.forEach((variant) => {
      if (variant.size && variant.is_active) {
        sizesSet.add(variant.size);
      }
      if (variant.color && variant.color_code && variant.is_active) {
        colorsMap.set(variant.color, variant.color_code);
      }
    });

    return {
      sizes: Array.from(sizesSet).sort((a, b) => {
        // Sort sizes: XS, S, M, L, XL, XXL, etc.
        const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
        const indexA = sizeOrder.indexOf(a.toUpperCase());
        const indexB = sizeOrder.indexOf(b.toUpperCase());
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return a.localeCompare(b);
      }),
      colors: Array.from(colorsMap.entries()).map(([name, code]) => ({ name, code })),
    };
  }, [product.variants]);

  // Find the selected variant based on size and color
  const selectedVariant = useMemo(() => {
    if (!selectedSize || !selectedColor || !product.variants) {
      return null;
    }

    return product.variants.find(
      (v) => v.size === selectedSize && v.color === selectedColor && v.is_active
    );
  }, [selectedSize, selectedColor, product.variants]);

  // Get stock for a specific size/color combination
  const getVariantStock = (size: string, color: string): number => {
    const variant = product.variants?.find(
      (v) => v.size === size && v.color === color && v.is_active
    );
    return variant?.total_stock || 0;
  };

  // Check if a variant is available (has stock)
  const isVariantAvailable = (size: string, color: string): boolean => {
    const stock = getVariantStock(size, color);
    return stock > 0 || product.allow_negative_stock;
  };

  // Reset selections when modal closes
  const handleClose = () => {
    setSelectedSize(null);
    setSelectedColor(null);
    onClose();
  };

  // Handle variant selection
  const handleConfirm = () => {
    if (selectedVariant) {
      onSelect(product, selectedVariant);
      handleClose();
    }
  };

  // Auto-select if only one size or color
  React.useEffect(() => {
    if (sizes.length === 1 && !selectedSize) {
      setSelectedSize(sizes[0]);
    }
    if (colors.length === 1 && !selectedColor) {
      setSelectedColor(colors[0].name);
    }
  }, [sizes, colors, selectedSize, selectedColor]);

  return (
    <Modal show={isOpen} onClose={handleClose} maxWidth="2xl">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Ölçü və Rəng Seçin</h2>

        {/* Product Info */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900">{product.name}</h3>
          {product.sku && <p className="text-sm text-gray-500 mt-1">SKU: {product.sku}</p>}
        </div>

        {/* Size Selection */}
        {sizes.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Ölçü</label>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {sizes.map((size) => {
                const hasAnyStock = colors.some((color) => isVariantAvailable(size, color.name));
                const isSelected = selectedSize === size;

                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    disabled={!hasAnyStock}
                    className={`
                      py-3 px-4 rounded-lg font-medium text-sm transition-all
                      ${isSelected
                        ? 'bg-slate-700 text-white ring-2 ring-indigo-600 ring-offset-2'
                        : hasAnyStock
                        ? 'bg-white text-gray-700 border-2 border-gray-300 hover:border-indigo-600'
                        : 'bg-gray-100 text-gray-400 border-2 border-gray-200 cursor-not-allowed'
                      }
                    `}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Color Selection */}
        {colors.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Rəng</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {colors.map((color) => {
                const hasStock = selectedSize ? isVariantAvailable(selectedSize, color.name) : true;
                const isSelected = selectedColor === color.name;

                return (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => setSelectedColor(color.name)}
                    disabled={!hasStock || !selectedSize}
                    className={`
                      py-3 px-4 rounded-lg text-sm font-medium transition-all flex items-center space-x-2
                      ${isSelected
                        ? 'bg-slate-700 text-white ring-2 ring-indigo-600 ring-offset-2'
                        : hasStock && selectedSize
                        ? 'bg-white text-gray-700 border-2 border-gray-300 hover:border-indigo-600'
                        : 'bg-gray-100 text-gray-400 border-2 border-gray-200 cursor-not-allowed'
                      }
                    `}
                  >
                    <div
                      className="w-5 h-5 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: color.code }}
                    />
                    <span>{color.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected Variant Info */}
        {selectedVariant && (
          <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Seçilən Variant</h4>
            <div className="space-y-1 text-sm">
              <p className="text-gray-700">
                <span className="font-medium">Məhsul:</span> {product.name} - {selectedVariant.size} /{' '}
                {selectedVariant.color}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Qiymət:</span>{' '}
                {(Math.round((Number(selectedVariant.final_price || 0)) * 100) / 100).toFixed(2)} AZN
              </p>
              <p className={`${(selectedVariant.total_stock || 0) <= 0 ? 'text-red-600' : 'text-gray-700'}`}>
                <span className="font-medium">Stok:</span> {selectedVariant.total_stock || 0} ədəd
                {(selectedVariant.total_stock || 0) <= 0 && !product.allow_negative_stock && (
                  <span className="ml-2 text-red-500 font-medium">(Stokda yoxdur)</span>
                )}
                {(selectedVariant.total_stock || 0) <= 0 && product.allow_negative_stock && (
                  <span className="ml-2 text-orange-500">(Mənfi stoka icazə var)</span>
                )}
              </p>
              {selectedVariant.barcode && (
                <p className="text-gray-600">
                  <span className="font-medium">Barkod:</span> {selectedVariant.barcode}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <SecondaryButton type="button" onClick={handleClose}>
            Ləğv et
          </SecondaryButton>
          <PrimaryButton
            type="button"
            onClick={handleConfirm}
            disabled={!selectedVariant}
          >
            Səbətə əlavə et
          </PrimaryButton>
        </div>
      </div>
    </Modal>
  );
}

export default React.memo(VariantSelectorModal);
