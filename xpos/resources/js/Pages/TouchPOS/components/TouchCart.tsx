import React from 'react';
import { CartItem } from '../../POS/hooks/useCart';
import { TrashIcon, MinusIcon, PlusIcon } from '@heroicons/react/24/outline';

interface Props {
  cart: CartItem[];
  updateCartItem: (id: string, field: keyof CartItem, value: any) => void;
  removeFromCart: (id: string) => void;
  changeItemUnit?: (itemId: string, newUnit: string) => void;
}

export default function TouchCart({
  cart,
  updateCartItem,
  removeFromCart,
  changeItemUnit,
}: Props) {
  const adjustQuantity = (itemId: string, currentQty: number, adjustment: number) => {
    const newQty = Math.max(0.1, currentQty + adjustment);
    updateCartItem(itemId, 'quantity', newQty);
  };

  if (cart.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center text-gray-500">
          <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.1 5a2 2 0 002 2h9.2a2 2 0 002-2L18 8H7" />
            </svg>
          </div>
          <div className="font-medium text-lg mb-1">Səbət boşdur</div>
          <p className="text-sm">Məhsul əlavə etmək üçün sol tərəfdən seçin</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Səbət ({cart.length})</h2>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-2 p-4">
          {cart.map((item) => (
            <div key={item.id} className="bg-gray-50 rounded-lg p-4">
              {/* Product Name */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 text-sm leading-tight">
                    {item.type === 'service' ? item.service?.name : item.product?.name || item.item_name}
                  </div>
                  {item.type === 'product' && item.product?.sku && (
                    <div className="text-xs text-gray-500 mt-1">Kod: {item.product.sku}</div>
                  )}
                </div>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="ml-2 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
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
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => adjustQuantity(item.id, item.quantity, -1)}
                    className="w-10 h-10 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                  >
                    <MinusIcon className="w-4 h-4 text-gray-700" />
                  </button>
                  
                  <input
                    type="number"
                    step={item.selling_unit?.toLowerCase().includes('l') ? '0.1' : '1'}
                    value={item.quantity}
                    onChange={(e) => updateCartItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                    className="w-16 text-center text-lg font-medium border border-gray-300 rounded-lg py-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                  />
                  
                  <button
                    onClick={() => adjustQuantity(item.id, item.quantity, 1)}
                    className="w-10 h-10 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                  >
                    <PlusIcon className="w-4 h-4 text-gray-700" />
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
                <div className="text-xs text-gray-500 mt-2 text-center">
                  Bazis: {(item.base_quantity || 0).toFixed(2)} {item.product?.base_unit}
                </div>
              )}

              {/* Price Edit */}
              <div className="mt-3">
                <label className="block text-xs text-gray-600 mb-1">Vahid qiyməti:</label>
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
              <div className="mt-3">
                <input
                  type="text"
                  value={item.notes || ''}
                  onChange={(e) => updateCartItem(item.id, 'notes', e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Qeydlər (ixtiyari)"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}