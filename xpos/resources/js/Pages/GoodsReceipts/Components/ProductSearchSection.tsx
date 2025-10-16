import React from 'react';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';

interface Product {
  id: number;
  name: string;
  sku: string;
  barcode?: string;
  unit: string;
  base_unit?: string;
  packaging_size?: string;
  packaging_quantity?: number;
  unit_price?: number;
}

interface Props {
  query: string;
  setQuery: (q: string) => void;
  loading: boolean;
  results: Product[];
  error?: string | null;
  onSelect: (product: Product) => void;
  selectedProduct?: Product | null;
}

function ProductSearchSection({ query, setQuery, loading, results, error, onSelect, selectedProduct }: Props) {
  return (
    <div className="relative">
      <div className="relative">
        <InputLabel htmlFor="productSearch" value="Məhsul axtarışı *" />
        <TextInput
          id="productSearch"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            // Prevent Enter key from submitting the form when scanning barcodes
            if (e.key === 'Enter') {
              e.preventDefault();
              
              // If there's exactly one search result, select it automatically
              if (results.length === 1) {
                onSelect(results[0]);
                setQuery('');
              }
            }
          }}
          className="mt-2 block w-full"
          placeholder="Məhsul adı, SKU və ya barkod daxil edin..."
        />
        {loading && (
          <div className="absolute right-3 top-10 text-xs text-gray-400">Axtarılır...</div>
        )}

        {/* Selected Product Display */}
        {selectedProduct && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="text-sm font-medium text-green-800">
              Seçilmiş məhsul: {selectedProduct.name}
            </div>
            <div className="text-xs text-green-600">
              SKU: {selectedProduct.sku}
              {selectedProduct.barcode && ` • Barkod: ${selectedProduct.barcode}`}
              {selectedProduct.unit && ` • Vahid: ${selectedProduct.unit}`}
            </div>
          </div>
        )}

        {/* Search Results */}
        {query.length >= 2 && results.length > 0 && (
          <div className="absolute z-[9999] w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            {results.map((product) => (
              <div
                key={product.id}
                onClick={() => onSelect(product)}
                className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-gray-900">{product.name}</div>
                    <div className="text-sm text-gray-500">
                      SKU: {product.sku}
                      {product.barcode && ` • Barkod: ${product.barcode}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">
                      {product.unit && `Vahid: ${product.unit}`}
                    </div>
                    {product.packaging_quantity && (
                      <div className="text-xs text-gray-500">
                        Qablaşdırma: {product.packaging_quantity} {product.base_unit}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error Message */}
        {query.length >= 2 && !loading && error && (
          <div className="absolute z-[9999] w-full mt-1 bg-white border border-red-300 rounded-md shadow-lg">
            <div className="p-3 text-red-600 text-sm">
              ⚠️ {error}
            </div>
          </div>
        )}

        {/* No Results */}
        {query.length >= 2 && !loading && !error && results.length === 0 && (
          <div className="absolute z-[9999] w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
            <div className="p-3 text-gray-500 text-sm">
              "{query}" üzrə heç bir məhsul tapılmadı
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default React.memo(ProductSearchSection);