import React from 'react';
import { useCartStore } from '../../stores/cart-store';

interface ShoppingCartProps {
  onCheckout: () => void;
}

export default function ShoppingCart({ onCheckout }: ShoppingCartProps) {
  const { items, customer, subtotal, taxAmount, discountAmount, total, updateQuantity, removeItem, clearCart } = useCartStore();

  const handleQuantityChange = (productId: number, variantId: number | null, delta: number) => {
    const item = items.find((i) => i.product_id === productId && i.variant_id === variantId);
    if (item) {
      updateQuantity(productId, variantId, item.quantity + delta);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full flex flex-col">
      {/* Cart Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Shopping Cart</h2>
          {items.length > 0 && (
            <button
              onClick={clearCart}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Clear All
            </button>
          )}
        </div>
        {customer && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900">{customer.name}</p>
                <p className="text-xs text-blue-700">{customer.phone}</p>
              </div>
              {customer.current_points > 0 && (
                <div className="bg-blue-100 px-3 py-1 rounded-full">
                  <p className="text-xs font-medium text-blue-900">{customer.current_points} pts</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-4">
        {items.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <p className="text-gray-500">Cart is empty</p>
            <p className="text-sm text-gray-400 mt-1">Add products to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={`${item.product_id}-${item.variant_id || 'no-variant'}-${index}`}
                className="bg-gray-50 rounded-lg p-4 border border-gray-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{item.product_name}</h3>
                    <p className="text-sm text-gray-600">${item.unit_price.toFixed(2)} each</p>
                  </div>
                  <button
                    onClick={() => removeItem(item.product_id, item.variant_id)}
                    className="text-red-600 hover:text-red-700 ml-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  {/* Quantity Controls */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleQuantityChange(item.product_id, item.variant_id, -1)}
                      className="w-10 h-10 rounded-lg bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-700 font-bold text-xl active:scale-95 transition-transform"
                    >
                      -
                    </button>
                    <span className="w-12 text-center text-lg font-semibold text-gray-900">{item.quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(item.product_id, item.variant_id, 1)}
                      className="w-10 h-10 rounded-lg bg-primary-600 hover:bg-primary-700 flex items-center justify-center text-white font-bold text-xl active:scale-95 transition-transform"
                    >
                      +
                    </button>
                  </div>

                  {/* Subtotal */}
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">${item.subtotal.toFixed(2)}</p>
                  </div>
                </div>

                {/* Discount Display */}
                {item.discount_amount > 0 && (
                  <div className="mt-2 text-sm text-green-600">
                    Discount: -${item.discount_amount.toFixed(2)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cart Summary */}
      <div className="border-t border-gray-200 p-6 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-semibold text-gray-900">${subtotal.toFixed(2)}</span>
        </div>

        {discountAmount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Discount</span>
            <span className="font-semibold text-green-600">-${discountAmount.toFixed(2)}</span>
          </div>
        )}

        {taxAmount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tax</span>
            <span className="font-semibold text-gray-900">${taxAmount.toFixed(2)}</span>
          </div>
        )}

        <div className="border-t border-gray-200 pt-3 flex justify-between">
          <span className="text-lg font-bold text-gray-900">Total</span>
          <span className="text-2xl font-bold text-primary-600">${total.toFixed(2)}</span>
        </div>

        <button
          onClick={onCheckout}
          disabled={items.length === 0}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-lg active:scale-98 transform"
        >
          Checkout
        </button>
      </div>
    </div>
  );
}
