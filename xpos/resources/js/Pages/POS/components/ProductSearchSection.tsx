import React from 'react';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import { Product } from '@/types';
import { CameraIcon } from '@heroicons/react/24/outline';
import BarcodeScanner from '@/Components/BarcodeScanner';

interface Props {
  query: string;
  setQuery: (q: string) => void;
  loading: boolean;
  results: Product[];
  onSelect: (item: Product) => void;
  mode?: 'sale';
  branchId?: string;
  searchImmediate?: (query: string) => void;
}

function ProductSearchSection({ query, setQuery, loading, results, onSelect, mode = 'sale', branchId, searchImmediate }: Props) {
  const isBranchSelected = branchId && branchId.trim() !== '';
  const [waitingForEnter, setWaitingForEnter] = React.useState(false);
  const [showScanner, setShowScanner] = React.useState(false);

  // Auto-select when results arrive after pressing Enter
  React.useEffect(() => {
    if (waitingForEnter && !loading && results.length === 1) {
      const product = results[0];
      const stockQuantity = 'filtered_stock' in product ? (product as any).filtered_stock : product?.total_stock;
      const hasStockIssue = product && stockQuantity !== undefined && stockQuantity <= 0 && !product.allow_negative_stock;

      if (!hasStockIssue) {
        onSelect(product);
        setQuery('');
      }
      setWaitingForEnter(false);
    }
  }, [waitingForEnter, loading, results, onSelect, setQuery]);

  // Handle barcode scan from camera
  const handleScan = (code: string) => {
    if (searchImmediate && isBranchSelected) {
      setQuery(code);
      searchImmediate(code);
      setWaitingForEnter(true);
    }
  };

  return (
    <div className="bg-white shadow-sm sm:rounded-lg mb-6">
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Məhsul Axtarışı</h3>

        {!isBranchSelected && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-amber-700 text-sm">
              <strong>Filial seçin:</strong> Məhsul axtarmaq üçün əvvəlcə filial seçməlisiniz.
            </p>
          </div>
        )}

        <div className="relative">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <InputLabel htmlFor="itemSearch" value="Axtarış (Barkod və ya ad)" />
            </div>
            {isBranchSelected && (
              <button
                type="button"
                onClick={() => setShowScanner(true)}
                className="mt-5 rounded-md bg-slate-700 p-2 text-white hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                title="Kamera ilə skan et"
              >
                <CameraIcon className="h-5 w-5" />
              </button>
            )}
          </div>
          <TextInput
            id="itemSearch"
            value={query}
            onChange={(e) => isBranchSelected ? setQuery(e.target.value) : null}
            onPaste={(e) => {
              // When barcode is pasted, trigger immediate search
              if (isBranchSelected && searchImmediate) {
                const pastedText = e.clipboardData.getData('text');
                if (pastedText.trim()) {
                  // Small delay to let the onChange update the query
                  setTimeout(() => {
                    searchImmediate(pastedText.trim());
                    setWaitingForEnter(true);
                  }, 10);
                }
              }
            }}
            onKeyDown={(e) => {
              // Prevent Enter key from submitting the form when scanning barcodes
              if (e.key === 'Enter') {
                e.preventDefault();

                // If already have 1 result, select it immediately
                if (results.length === 1) {
                  const product = results[0];
                  const stockQuantity = 'filtered_stock' in product ? (product as any).filtered_stock : product?.total_stock;
                  const hasStockIssue = product && stockQuantity !== undefined && stockQuantity <= 0 && !product.allow_negative_stock;

                  if (!hasStockIssue) {
                    onSelect(product);
                    setQuery('');
                  }
                } else if (query.trim() && searchImmediate && isBranchSelected) {
                  // Trigger immediate search and wait for results
                  searchImmediate(query);
                  setWaitingForEnter(true);
                }
              }
            }}
            className={`mt-1 block w-full ${!isBranchSelected ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            placeholder={isBranchSelected ? "Məhsul adı, kodu və ya barkod..." : "Əvvəlcə filial seçin"}
            disabled={!isBranchSelected}
          />
          {loading && isBranchSelected && (
            <div className="absolute right-3 top-8 text-xs text-gray-400">Axtarılır...</div>
          )}

          {/* Search Results */}
          {results.length > 0 && isBranchSelected && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
              {results.map((product) => {
                // Use filtered_stock if available (from search API), otherwise fall back to total_stock
                const stockQuantity = 'filtered_stock' in product ? (product as any).filtered_stock : product?.total_stock;
                const hasStockIssue = product && stockQuantity !== undefined && stockQuantity <= 0 && !product.allow_negative_stock;
                const isDisabled = hasStockIssue;

                return (
                <div
                  key={`product-${product.id}`}
                  onClick={isDisabled ? undefined : () => onSelect(product)}
                  className={`p-3 border-b border-gray-100 ${
                    isDisabled
                      ? 'bg-red-50 border-red-200 cursor-not-allowed opacity-60'
                      : 'cursor-pointer hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">{product.name}</span>
                      {product.sku && (
                        <span className="ml-2 text-sm text-gray-500">({product.sku})</span>
                      )}
                      {product.has_variants && (
                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Variantlı</span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {(Math.round((Number(product.sale_price || 0)) * 100) / 100).toFixed(2)} AZN
                        {product.packaging_size && ` (${product.packaging_size})`}
                      </div>
                      {product.base_unit && (
                        <div className="text-sm text-gray-500">Vahid: {product.base_unit}</div>
                      )}
                      {stockQuantity !== undefined && (
                        <div className={`text-sm ${
                          hasStockIssue
                            ? 'text-red-600 font-medium'
                            : 'text-gray-500'
                        }`}>
                          Stok: {stockQuantity || 0}
                          {stockQuantity <= 0 && !product.allow_negative_stock && (
                            <span className="ml-2 text-red-500">(Kifayət etmir)</span>
                          )}
                          {stockQuantity <= 0 && product.allow_negative_stock && (
                            <span className="ml-2 text-orange-500">(Mənfi stoka icazə var)</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleScan}
      />
    </div>
  );
}

export default React.memo(ProductSearchSection);

