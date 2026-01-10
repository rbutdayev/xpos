import { useState, useEffect } from 'react';
import { Product, ProductVariant, ProductStock } from '@/types';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';

interface Props {
  product: Product;
  warehouseId?: number;
  selectedVariantId?: number;
  onSelect: (variant: ProductVariant | null) => void;
  error?: string;
  className?: string;
  required?: boolean;
  showStock?: boolean;
}

export default function VariantSelector({
  product,
  warehouseId,
  selectedVariantId,
  onSelect,
  error,
  className = '',
  required = false,
  showStock = true,
}: Props) {
  const [variants, setVariants] = useState<ProductVariant[]>(product.variants || []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If product has variants but they're not loaded, fetch them
    if (product.has_variants && (!product.variants || product.variants.length === 0)) {
      fetchVariants();
    }
  }, [product.id]);

  const fetchVariants = async () => {
    setLoading(true);
    try {
      const response = await (window as any).axios.get(route('products.variants.index', product.id), {
        params: warehouseId ? { warehouse_id: warehouseId } : {},
      });
      setVariants(response.data.variants || response.data);
    } catch (error) {
      console.error('Error fetching variants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const variantId = parseInt(e.target.value);
    if (isNaN(variantId)) {
      onSelect(null);
    } else {
      const variant = variants.find(v => v.id === variantId);
      onSelect(variant || null);
    }
  };

  const getStockForVariant = (variant: ProductVariant): number => {
    if (!showStock) return 0;

    // If warehouse is specified, get stock for that warehouse
    if (warehouseId && variant.stock) {
      const warehouseStock = variant.stock.find(s => s.warehouse_id === warehouseId);
      return warehouseStock?.available_quantity || 0;
    }

    // Otherwise return total stock
    return variant.total_stock || 0;
  };

  const getStockClass = (stock: number): string => {
    if (stock > 10) return 'text-green-600';
    if (stock > 0) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!product.has_variants) {
    return null;
  }

  if (loading) {
    return (
      <div className={className}>
        <InputLabel value="Variant" />
        <div className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-500">
          Yüklənir...
        </div>
      </div>
    );
  }

  if (variants.length === 0) {
    return (
      <div className={className}>
        <InputLabel value="Variant" />
        <div className="mt-1 block w-full border border-yellow-300 bg-yellow-50 rounded-md shadow-sm py-2 px-3 text-yellow-800 text-sm">
          Bu məhsulun heç bir aktiv variantı yoxdur
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <InputLabel htmlFor="variant_id" value={`Variant${required ? ' *' : ''}`} />
      <select
        id="variant_id"
        value={selectedVariantId || ''}
        onChange={handleChange}
        required={required}
        className="mt-1 block w-full border-gray-300 focus:border-slate-500 focus:ring-slate-500 rounded-md shadow-sm"
      >
        <option value="">Variant seçin</option>
        {variants.filter(v => v.is_active).map((variant) => {
          const stock = getStockForVariant(variant);
          const stockClass = getStockClass(stock);

          return (
            <option key={variant.id} value={variant.id}>
              {variant.short_display || `${variant.size || ''} / ${variant.color || ''}`}
              {showStock && ` (Stok: ${stock})`}
              {variant.final_price && ` - ${variant.final_price.toFixed(2)} ₼`}
            </option>
          );
        })}
      </select>

      {selectedVariantId && showStock && (
        <div className="mt-2 text-sm">
          {(() => {
            const selectedVariant = variants.find(v => v.id === selectedVariantId);
            if (!selectedVariant) return null;

            const stock = getStockForVariant(selectedVariant);
            const stockClass = getStockClass(stock);

            return (
              <div className="flex items-center gap-4">
                {selectedVariant.color_code && (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded border border-gray-300"
                      style={{ backgroundColor: selectedVariant.color_code }}
                    />
                    <span className="text-gray-600">{selectedVariant.color}</span>
                  </div>
                )}
                <span className={`font-medium ${stockClass}`}>
                  Stok: {stock} ədəd
                </span>
                {selectedVariant.barcode && (
                  <span className="text-gray-500 font-mono text-xs">
                    {selectedVariant.barcode}
                  </span>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {error && <InputError message={error} className="mt-2" />}
    </div>
  );
}
