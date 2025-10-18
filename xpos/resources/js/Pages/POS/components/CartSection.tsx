import React from 'react';
import TextInput from '@/Components/TextInput';
import DangerButton from '@/Components/DangerButton';
import { TrashIcon } from '@heroicons/react/24/outline';
import { CartItem } from '../hooks/useCart';

interface Props {
  cart: CartItem[];
  updateCartItem: (id: string, field: keyof CartItem, value: any) => void;
  removeFromCart: (id: string) => void;
  changeItemUnit?: (itemId: string, newUnit: string) => void;
}

function CartSection({ cart, updateCartItem, removeFromCart, changeItemUnit }: Props) {
  if (cart.length === 0) return null;
  return (
    <div className="space-y-2">
      {cart.map((item) => (
        <div key={item.id} className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <div className="flex-1">
              <div className="font-medium">
                {item.product?.name || item.item_name}
                {item.product?.sku && (
                  <span className="ml-2 text-xs text-gray-500">({item.product.sku})</span>
                )}
              </div>
              {/* Display variant info if present */}
              {item.variant && (
                <div className="text-xs text-gray-600 mt-1 flex items-center space-x-2">
                  <span className="font-medium">
                    {item.variant.size && <span>{item.variant.size}</span>}
                    {item.variant.size && item.variant.color && <span> / </span>}
                    {item.variant.color && (
                      <span className="inline-flex items-center">
                        <span
                          className="inline-block w-3 h-3 rounded-full border border-gray-300 mr-1"
                          style={{ backgroundColor: item.variant.color_code || '#ccc' }}
                        />
                        {item.variant.color}
                      </span>
                    )}
                  </span>
                  {item.variant.barcode && (
                    <span className="text-gray-400">• {item.variant.barcode}</span>
                  )}
                </div>
              )}
              {item.product && (
                <div className="text-xs text-gray-500 mt-1">
                  {/* Unit seçim dropdown */}
                  {changeItemUnit && (item.product.packaging_quantity && item.product.unit_price) ? (
                    <select
                      value={item.selling_unit || item.product.base_unit}
                      onChange={(e) => changeItemUnit(item.id, e.target.value)}
                      className="text-xs border rounded px-1 py-0.5"
                    >
                      <option value={item.product.base_unit || 'L'}>
                        {item.product.base_unit || 'L'} - {(Math.round((Number(item.product.unit_price || 0)) * 100) / 100).toFixed(2)} AZN
                      </option>
                      <option value="qab">
                        Qab ({item.product.packaging_size}) - {(Math.round((Number(item.product.unit_price || 0) * Number(item.product.packaging_quantity || 1)) * 100) / 100).toFixed(2)} AZN
                      </option>
                    </select>
                  ) : (
                    <span>Vahid: {item.selling_unit || item.product?.base_unit}</span>
                  )}
                  {item.is_packaging && item.product.packaging_quantity && (
                    <div className="text-xs text-blue-600 mt-1">
                      1 qab = {item.product.packaging_quantity} {item.product.base_unit}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex flex-col">
                <TextInput
                  type="number"
                  step={item.selling_unit?.toLowerCase().includes('l') ? '0.1' : '1'}
                  value={item.quantity}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    updateCartItem(item.id, 'quantity', value);
                  }}
                  onBlur={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    const roundedValue = item.selling_unit?.toLowerCase().includes('l') ? Math.round(value * 10) / 10 : Math.round(value);
                    updateCartItem(item.id, 'quantity', roundedValue);
                  }}
                  className="w-20"
                  min="0"
                  placeholder="Miqdar"
                />
                {item.base_quantity !== undefined && item.base_quantity !== item.quantity && (
                  <span className="text-xs text-gray-400 mt-1">Bazis: {Number(item.base_quantity || 0).toFixed(2)}</span>
                )}
              </div>

              <span className="text-sm text-gray-500">×</span>

              <TextInput
                type="number"
                step="0.01"
                value={item.unit_price}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  updateCartItem(item.id, 'unit_price', value);
                }}
                onBlur={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  const roundedValue = Math.round(value * 100) / 100;
                  updateCartItem(item.id, 'unit_price', roundedValue);
                }}
                className="w-24"
                min="0"
                placeholder="Qiymət"
              />

              <span className="text-sm text-gray-500">=</span>

              <div className="w-20 text-right font-medium">{(Math.round((Number(item.total || 0)) * 100) / 100).toFixed(2)} AZN</div>

              <DangerButton type="button" onClick={() => removeFromCart(item.id)} className="p-1">
                <TrashIcon className="h-4 w-4" />
              </DangerButton>
            </div>
          </div>

          <div className="mt-2">
            <TextInput
              type="text"
              value={item.notes || ''}
              onChange={(e) => updateCartItem(item.id, 'notes', e.target.value)}
              className="w-full text-sm"
              placeholder="Qeydlər (ixtiyari)"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default React.memo(CartSection);

