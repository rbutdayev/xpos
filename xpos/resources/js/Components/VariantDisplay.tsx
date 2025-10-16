import { ProductVariant } from '@/types';

interface Props {
  variant?: ProductVariant | null;
  showStock?: boolean;
  compact?: boolean;
  className?: string;
}

export default function VariantDisplay({ variant, showStock = false, compact = false, className = '' }: Props) {
  if (!variant) {
    return null;
  }

  const stockColor = (stock?: number) => {
    if (!stock) return 'text-red-600';
    if (stock > 10) return 'text-green-600';
    if (stock > 0) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (compact) {
    // Compact view: "M / Red ●"
    return (
      <span className={`inline-flex items-center gap-1 text-sm ${className}`}>
        {variant.size && <span className="font-medium">{variant.size}</span>}
        {variant.size && variant.color && <span className="text-gray-400">/</span>}
        {variant.color && (
          <>
            <span>{variant.color}</span>
            {variant.color_code && (
              <span
                className="inline-block w-3 h-3 rounded-full border border-gray-300"
                style={{ backgroundColor: variant.color_code }}
                title={variant.color}
              />
            )}
          </>
        )}
        {showStock && variant.total_stock !== undefined && (
          <span className={`text-xs ${stockColor(variant.total_stock)}`}>
            ({variant.total_stock})
          </span>
        )}
      </span>
    );
  }

  // Full view with color swatch and stock
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Color Swatch */}
      {variant.color_code && (
        <div
          className="w-6 h-6 rounded border border-gray-300 flex-shrink-0"
          style={{ backgroundColor: variant.color_code }}
          title={variant.color || 'Color'}
        />
      )}

      {/* Size & Color Text */}
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-2">
          {variant.size && (
            <span className="font-medium text-gray-900">{variant.size}</span>
          )}
          {variant.size && variant.color && (
            <span className="text-gray-400">/</span>
          )}
          {variant.color && (
            <span className="text-gray-700">{variant.color}</span>
          )}
        </div>

        {/* Stock Info */}
        {showStock && variant.total_stock !== undefined && (
          <span className={`text-xs ${stockColor(variant.total_stock)}`}>
            Stok: {variant.total_stock} ədəd
          </span>
        )}
      </div>

      {/* Price (if different from base) */}
      {variant.price_adjustment !== 0 && variant.final_price && (
        <span className="text-sm text-gray-600 ml-auto">
          {variant.final_price.toFixed(2)} ₼
          {variant.price_adjustment > 0 && (
            <span className="text-xs text-green-600 ml-1">
              (+{variant.price_adjustment.toFixed(2)})
            </span>
          )}
        </span>
      )}
    </div>
  );
}

// Export a badge version for tables
export function VariantBadge({ variant, className = '' }: { variant?: ProductVariant | null; className?: string }) {
  if (!variant) return null;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 bg-gray-100 rounded-md text-xs ${className}`}>
      {variant.color_code && (
        <span
          className="inline-block w-3 h-3 rounded-full border border-gray-300"
          style={{ backgroundColor: variant.color_code }}
        />
      )}
      <span className="font-medium">{variant.size}</span>
      {variant.size && variant.color && <span className="text-gray-400">/</span>}
      <span>{variant.color}</span>
    </span>
  );
}
