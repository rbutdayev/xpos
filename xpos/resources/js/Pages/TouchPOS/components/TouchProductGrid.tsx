import React from 'react';
import { Product } from '@/types';
import { CartItem } from '../../POS/hooks/useCart';
import { MagnifyingGlassIcon, MinusIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Props {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: Product[];
  loading: boolean;
  onAddProduct: (product: Product) => void;
  branchId: string;
  cart: CartItem[];
  updateCartItem: (id: string, field: keyof CartItem, value: any) => void;
  removeFromCart: (id: string) => void;
  changeItemUnit?: (itemId: string, newUnit: string) => void;
}

export default function TouchProductGrid({
  searchQuery,
  setSearchQuery,
  searchResults,
  loading,
  onAddProduct,
  branchId,
  cart,
  updateCartItem,
  removeFromCart,
  changeItemUnit,
}: Props) {
  const isBranchSelected = branchId && branchId.trim() !== '';

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Search Bar */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => isBranchSelected ? setSearchQuery(e.target.value) : null}
            className="w-full pl-12 pr-4 py-4 text-xl border-2 border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            placeholder={isBranchSelected ? "Məhsul adı və ya kodu..." : "Əvvəlcə filial seçin"}
            disabled={!isBranchSelected}
          />
          {loading && isBranchSelected && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          )}
          
          {/* Search Results Dropdown */}
          {searchQuery.length > 2 && isBranchSelected && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg mt-1 shadow-lg z-50 max-h-96 overflow-y-auto">
              {searchResults.map((product) => {
                const hasStockIssue = product.total_stock !== undefined && 
                                     product.total_stock <= 0 && 
                                     !product.allow_negative_stock;
                
                return (
                  <div
                    key={product.id}
                    onClick={hasStockIssue ? undefined : () => {
                      onAddProduct(product);
                      setSearchQuery('');
                    }}
                    className={`p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 cursor-pointer flex items-center justify-between ${
                      hasStockIssue ? 'opacity-50 cursor-not-allowed bg-red-50' : ''
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900">{product.name}</div>
                      {product.sku && (
                        <div className="text-sm text-gray-500">Kod: {product.sku}</div>
                      )}
                      {product.total_stock !== undefined && (
                        <div className={`text-sm ${hasStockIssue ? 'text-red-600' : 'text-gray-500'}`}>
                          Stok: {product.total_stock}
                          {hasStockIssue && <span> (Bitib)</span>}
                        </div>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <div className="font-bold text-lg text-blue-600">
                        {Number(product.sale_price || 0).toFixed(2)} ₼
                      </div>
                      {product.base_unit && (
                        <div className="text-sm text-gray-500">/{product.base_unit}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Branch Not Selected Warning */}
      {!isBranchSelected && (
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 max-w-md text-center">
            <div className="text-yellow-600 text-lg font-medium mb-2">Filial Seçin</div>
            <p className="text-yellow-700">
              Məhsul axtarmaq və satış aparmaq üçün əvvəlcə filial seçməlisiniz.
            </p>
          </div>
        </div>
      )}

      {/* Search Instructions */}
      {isBranchSelected && searchQuery.length <= 2 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <MagnifyingGlassIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <div className="text-lg font-medium mb-2">Məhsul Axtarışı</div>
            <p>Məhsul tapmaq üçün ən azı 3 hərf daxil edin</p>
          </div>
        </div>
      )}

      {/* No Results */}
      {isBranchSelected && searchQuery.length > 2 && searchResults.length === 0 && !loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-lg font-medium mb-2">Məhsul tapılmadı</div>
            <p>"{searchQuery}" sorğusu üçün heç bir nəticə tapılmadı</p>
          </div>
        </div>
      )}

      {/* Selected Products */}
      {cart.length > 0 && (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Seçilən Məhsullar ({cart.length})</h2>
          </div>
          <div className="space-y-4">
            {cart.map((item) => {
              const adjustQuantity = (adjustment: number) => {
                const newQty = Math.max(0.1, item.quantity + adjustment);
                updateCartItem(item.id, 'quantity', newQty);
              };

              return (
                <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  {/* Product Name */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 text-base">
                        {item.product?.name || item.item_name}
                      </div>
                      {item.product?.sku && (
                        <div className="text-sm text-gray-500 mt-1">Kod: {item.product.sku}</div>
                      )}
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="ml-2 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Unit Selection for Products */}
                  {item.type === 'product' && item.product && changeItemUnit && 
                   (item.product.packaging_quantity && item.product.unit_price) && (
                    <div className="mb-3">
                      <select
                        value={item.selling_unit || item.product.base_unit}
                        onChange={(e) => changeItemUnit(item.id, e.target.value)}
                        className="text-sm border border-gray-300 rounded-md px-3 py-2 w-full focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value={item.product.base_unit || 'L'}>
                          {item.product.base_unit || 'L'} - {Number(item.product.unit_price || 0).toFixed(2)} ₼
                        </option>
                        <option value="qab">
                          Qab ({item.product.packaging_size}) - {(Number(item.product.unit_price || 0) * Number(item.product.packaging_quantity || 1)).toFixed(2)} ₼
                        </option>
                      </select>
                      {item.is_packaging && item.product.packaging_quantity && (
                        <div className="text-xs text-blue-600 mt-1">
                          1 qab = {item.product.packaging_quantity} {item.product.base_unit}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Quantity Controls */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => adjustQuantity(-1)}
                        className="w-12 h-12 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                      >
                        <MinusIcon className="w-5 h-5 text-gray-700" />
                      </button>
                      
                      <input
                        type="number"
                        step={item.selling_unit?.toLowerCase().includes('l') ? '0.1' : '1'}
                        value={item.quantity}
                        onChange={(e) => updateCartItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-20 text-center text-lg font-medium border border-gray-300 rounded-lg py-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                      />
                      
                      <button
                        onClick={() => adjustQuantity(1)}
                        className="w-12 h-12 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                      >
                        <PlusIcon className="w-5 h-5 text-gray-700" />
                      </button>
                    </div>

                    <div className="text-right">
                      <div className="text-sm text-gray-600">
                        {item.quantity} × {Number(item.unit_price || 0).toFixed(2)} ₼
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        {Number(item.total || 0).toFixed(2)} ₼
                      </div>
                    </div>
                  </div>

                  {/* Base Quantity Display */}
                  {item.base_quantity !== undefined && item.base_quantity !== item.quantity && (
                    <div className="text-xs text-gray-500 mb-3 text-center">
                      Bazis: {Number(item.base_quantity || 0).toFixed(2)} {item.product?.base_unit}
                    </div>
                  )}

                  {/* Price Edit */}
                  <div className="mb-3">
                    <label className="block text-sm text-gray-600 mb-1">Vahid qiyməti:</label>
                    <input
                      type="number"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => updateCartItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                      className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <input
                      type="text"
                      value={item.notes || ''}
                      onChange={(e) => updateCartItem(item.id, 'notes', e.target.value)}
                      className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Qeydlər (ixtiyari)"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}