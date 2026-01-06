import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCartStore } from '../../stores/cart-store';
import toast from 'react-hot-toast';
import Numpad from './Numpad';

interface ShoppingCartProps {
  onCheckout: () => void;
}

export default function ShoppingCart({ onCheckout }: ShoppingCartProps) {
  const { t } = useTranslation();
  const { items, total, subtotal, taxAmount, removeItem, updateQuantity, clearCart } = useCartStore();
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [showNumpad, setShowNumpad] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('az-AZ', {
      style: 'currency',
      currency: 'AZN',
    }).format(price);
  };

  const handleClearCart = () => {
    if (items.length === 0) return;

    if (confirm(t('pos.clearCart') + '?')) {
      clearCart();
      toast.success(t('pos.cartCleared'));
    }
  };

  const handleRemoveItem = (productId: number, variantId: number | null) => {
    removeItem(productId, variantId);
    toast.success(t('pos.productRemoved'));
  };

  const handleEditQuantity = (index: number) => {
    setEditingItemIndex(index);
    setShowNumpad(true);
  };

  const handleNumpadSubmit = (value: number) => {
    if (editingItemIndex !== null && value > 0) {
      const item = items[editingItemIndex];
      updateQuantity(item.product_id, item.variant_id, value);
      toast.success(t('pos.editQuantity'));
    }
    setShowNumpad(false);
    setEditingItemIndex(null);
  };

  return (
    <>
      <div className="card h-full flex flex-col">
        {/* Cart Header */}
        <div className="card-header flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h2 className="text-xl font-bold text-gray-900">{t('pos.cart')}</h2>
            {items.length > 0 && (
              <span className="badge badge-info text-sm px-3 py-1">
                {t('pos.itemsInCart', { count: items.length })}
              </span>
            )}
          </div>

          {items.length > 0 && (
            <button
              onClick={handleClearCart}
              className="text-sm text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 active:scale-95 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {t('pos.clearCart')}
            </button>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto border-b border-gray-200">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 p-8">
              <svg className="w-24 h-24 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-lg font-semibold">{t('pos.emptyCart')}</p>
              <p className="text-sm mt-1">{t('pos.addProducts')}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {items.map((item, index) => {
                const itemTotal = item.quantity * item.unit_price - item.discount_amount;

                return (
                  <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                    {/* Item Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 mr-2">
                        <h3 className="font-bold text-gray-900 text-base leading-tight">
                          {item.product_name}
                        </h3>
                        {item.variant_id && (
                          <p className="text-xs text-gray-500 mt-0.5">Variant #{item.variant_id}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveItem(item.product_id, item.variant_id)}
                        className="text-red-600 hover:text-red-700 p-1 rounded active:scale-95 transition-all"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {/* Item Details */}
                    <div className="flex items-center justify-between">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.product_id, item.variant_id, Math.max(1, item.quantity - 1))}
                          className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center justify-center active:scale-95 transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                        </button>

                        <button
                          onClick={() => handleEditQuantity(index)}
                          className="min-w-[60px] px-3 py-2 bg-blue-50 border-2 border-blue-200 rounded-lg font-bold text-blue-900 hover:bg-blue-100 active:scale-95 transition-all"
                        >
                          {item.quantity}
                        </button>

                        <button
                          onClick={() => updateQuantity(item.product_id, item.variant_id, item.quantity + 1)}
                          className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center justify-center active:scale-95 transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <div className="text-xs text-gray-500">
                          {formatPrice(item.unit_price)} × {item.quantity}
                        </div>
                        <div className="font-bold text-gray-900 text-lg">
                          {formatPrice(itemTotal)}
                        </div>
                      </div>
                    </div>

                    {/* Discount */}
                    {item.discount_amount > 0 && (
                      <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        {t('common.discount')}: -{formatPrice(item.discount_amount)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Cart Summary */}
        <div className="p-6 bg-gray-50 space-y-3">
          {/* Subtotal */}
          <div className="flex items-center justify-between text-gray-700">
            <span className="font-medium">{t('common.subtotal')}:</span>
            <span className="font-semibold text-lg">{formatPrice(subtotal)}</span>
          </div>

          {/* Tax */}
          <div className="flex items-center justify-between text-gray-700">
            <span className="font-medium">{t('common.tax')}:</span>
            <span className="font-semibold text-lg">{formatPrice(taxAmount)}</span>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between pt-3 border-t-2 border-gray-300">
            <span className="text-xl font-bold text-gray-900">{t('common.total')}:</span>
            <span className="text-3xl font-bold text-blue-600">{formatPrice(total)}</span>
          </div>

          {/* Checkout Button */}
          <button
            onClick={onCheckout}
            disabled={items.length === 0}
            className="btn btn-success w-full text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {t('pos.checkout')}
          </button>
        </div>
      </div>

      {/* Numpad Modal */}
      {showNumpad && editingItemIndex !== null && (
        <Numpad
          isOpen={showNumpad}
          title={t('pos.editQuantity')}
          initialValue={items[editingItemIndex].quantity}
          onSubmit={handleNumpadSubmit}
          onClose={() => {
            setShowNumpad(false);
            setEditingItemIndex(null);
          }}
        />
      )}
    </>
  );
}
