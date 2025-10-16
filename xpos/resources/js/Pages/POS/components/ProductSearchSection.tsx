import React from 'react';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import { Product, Service } from '@/types';

interface Props {
  query: string;
  setQuery: (q: string) => void;
  loading: boolean;
  results: (Product | (Service & { type?: 'service' }))[];
  onSelect: (item: Product | Service) => void;
  mode?: 'sale' | 'service';
  branchId?: string;
}

function ProductSearchSection({ query, setQuery, loading, results, onSelect, mode = 'sale', branchId }: Props) {
  const isProduct = (item: Product | Service): item is Product => {
    return 'total_stock' in item || (item as any).type !== 'service';
  };

  const isBranchSelected = branchId && branchId.trim() !== '';

  return (
    <div className="bg-white shadow-sm sm:rounded-lg mb-6">
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Məhsul/Xidmət Axtarışı</h3>
        
        {!isBranchSelected && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-amber-700 text-sm">
              <strong>Filial seçin:</strong> Məhsul və ya xidmət axtarmaq üçün əvvəlcə filial seçməlisiniz.
            </p>
          </div>
        )}
        
        <div className="relative">
          <InputLabel htmlFor="itemSearch" value="Axtarış" />
          <TextInput
            id="itemSearch"
            value={query}
            onChange={(e) => isBranchSelected ? setQuery(e.target.value) : null}
            onKeyDown={(e) => {
              // Prevent Enter key from submitting the form when scanning barcodes
              if (e.key === 'Enter') {
                e.preventDefault();
                
                // If there's exactly one search result, select it automatically
                if (results.length === 1) {
                  const item = results[0];
                  const isProduct = 'total_stock' in item || (item as any).type !== 'service';
                  const isServiceItem = (item as any).type === 'service';
                  
                  // Check if item can be selected (same logic as in render)
                  const product = isProduct ? item as Product : null;
                  const stockQuantity = product && 'filtered_stock' in product ? (product as any).filtered_stock : product?.total_stock;
                  const hasStockIssue = !isServiceItem && product && stockQuantity !== undefined && stockQuantity <= 0 && !product.allow_negative_stock;
                  const canSelectInServiceMode = mode === 'service' && (isServiceItem || (product && product.allow_negative_stock));
                  const isDisabled = hasStockIssue && !canSelectInServiceMode;
                  
                  if (!isDisabled) {
                    onSelect(item);
                    setQuery('');
                  }
                }
              }
            }}
            className={`mt-1 block w-full ${!isBranchSelected ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            placeholder={isBranchSelected ? "Məhsul və ya xidmət adı, kodu..." : "Əvvəlcə filial seçin"}
            disabled={!isBranchSelected}
          />
          {loading && isBranchSelected && (
            <div className="absolute right-3 top-8 text-xs text-gray-400">Axtarılır...</div>
          )}

          {/* Search Results */}
          {results.length > 0 && isBranchSelected && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
              {results.map((item) => {
                const product = isProduct(item) ? item : null;
                const isServiceItem = (item as any).type === 'service';
                
                // Services never have stock issues
                // Use filtered_stock if available (from search API), otherwise fall back to total_stock
                const stockQuantity = product && 'filtered_stock' in product ? (product as any).filtered_stock : product?.total_stock;
                const hasStockIssue = !isServiceItem && product && stockQuantity !== undefined && stockQuantity <= 0 && !product.allow_negative_stock;
                
                // In service mode, allow products with negative stock allowance or actual services
                const canSelectInServiceMode = mode === 'service' && (isServiceItem || (product && product.allow_negative_stock));
                const isDisabled = hasStockIssue && !canSelectInServiceMode;
                
                return (
                <div
                  key={`${(item as any).type || 'product'}-${item.id}`}
                  onClick={isDisabled ? undefined : () => onSelect(item)}
                  className={`p-3 border-b border-gray-100 ${
                    isDisabled
                      ? 'bg-red-50 border-red-200 cursor-not-allowed opacity-60'
                      : 'cursor-pointer hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">{item.name}</span>
                      {(item as Product).sku && (
                        <span className="ml-2 text-sm text-gray-500">({(item as Product).sku})</span>
                      )}
                      {(item as any).type === 'service' && (
                        <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Xidmət</span>
                      )}
                      {(item as Product).has_variants && (
                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Variantlı</span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {(Math.round((Number((item as Product).sale_price || (item as Service).price || 0)) * 100) / 100).toFixed(2)} AZN
                        {(item as Product).packaging_size && ` (${(item as Product).packaging_size})`}
                      </div>
                      {(item as Product).base_unit && (
                        <div className="text-sm text-gray-500">Vahid: {(item as Product).base_unit}</div>
                      )}
                      {product && stockQuantity !== undefined && !isServiceItem && (
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
                      {(item as any).type === 'service' && (item as Service).code && (
                        <div className="text-sm text-gray-500">Kod: {(item as Service).code}</div>
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
    </div>
  );
}

export default React.memo(ProductSearchSection);

