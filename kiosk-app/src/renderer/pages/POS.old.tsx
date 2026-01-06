import React, { useState } from 'react';
import ProductSearch from '../components/ProductSearch';
import ShoppingCart from '../components/ShoppingCart';
import CustomerLookup from '../components/CustomerLookup';
import PaymentModal from '../components/PaymentModal';
import ConnectionStatus from '../components/ConnectionStatus';
import { useCartStore } from '../../stores/cart-store';

export default function POS() {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const { items, total } = useCartStore();

  const handleCheckout = () => {
    if (items.length === 0) {
      return;
    }
    setIsPaymentModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-primary-600 text-white w-10 h-10 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">xPOS Kiosk</h1>
              <p className="text-sm text-gray-600">Point of Sale</p>
            </div>
          </div>
          <ConnectionStatus />
        </div>
      </header>

      {/* Main Content */}
      <div className="grid grid-cols-12 gap-6 p-6 h-[calc(100vh-88px)]">
        {/* Left Panel - Product Search & Customer */}
        <div className="col-span-7 space-y-6">
          <CustomerLookup />
          <ProductSearch />
        </div>

        {/* Right Panel - Shopping Cart */}
        <div className="col-span-5">
          <ShoppingCart onCheckout={handleCheckout} />
        </div>
      </div>

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
        />
      )}
    </div>
  );
}
