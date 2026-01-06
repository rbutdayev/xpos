import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import ProductSearch from '../components/ProductSearch';
import ShoppingCart from '../components/ShoppingCart';
import CustomerLookup from '../components/CustomerLookup';
import PaymentModal from '../components/PaymentModal';
import ConnectionStatus from '../components/ConnectionStatus';
import { useCartStore } from '../../stores/cart-store';

export default function POS() {
  const { t } = useTranslation();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isScannerReady, setIsScannerReady] = useState(true);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const { items, total } = useCartStore();

  // Focus barcode input when no other input is active
  useEffect(() => {
    const focusInput = () => {
      // Don't steal focus if a modal is open or user is typing in an input
      const activeElement = document.activeElement;
      const isInputActive = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA';
      const isModalOpen = document.querySelector('[role="dialog"]') !== null;

      // Only focus barcode input if no other input is active and no modal is open
      if (!isInputActive && !isModalOpen && barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
    };

    focusInput();
    const interval = setInterval(focusInput, 500); // Reduced frequency

    return () => clearInterval(interval);
  }, [isPaymentModalOpen]);

  const handleCheckout = () => {
    if (items.length === 0) {
      return;
    }
    setIsPaymentModalOpen(true);
  };

  const handleBarcodeKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && barcodeInput.trim()) {
      const barcode = barcodeInput.trim();
      console.log('🔍 Barcode scanned:', barcode);

      try {
        // Search for product by barcode
        const product = await window.ipc.getProductByBarcode(barcode);
        console.log('🔎 Product lookup result:', product);

        if (product) {
          // Add to cart (quantity +1 each scan)
          const { addItem } = useCartStore.getState();
          addItem({
            product_id: product.id,
            product_name: product.name,
            variant_id: product.variant_id,
            quantity: 1, // Add 1 each scan
            unit_price: product.sale_price,
            discount_amount: 0,
          });

          // Success feedback with sound
          toast.success(`✓ ${product.name} ${t('pos.productAdded')}`, {
            duration: 2000,
            icon: '🛒',
          });

          // Simple beep sound
          try {
            const audioContext = new AudioContext();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800; // Frequency in Hz
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
          } catch (error) {
            // Audio not supported, ignore
          }
        } else {
          // Product not found
          console.warn('⚠️ Product not found for barcode:', barcode);
          toast.error(`${t('pos.noProducts')}: ${barcode}`, {
            duration: 3000,
          });
        }
      } catch (error) {
        console.error('❌ Barcode scan error:', error);
        toast.error(t('errors.unknown'));
      }

      // Clear input for next scan
      setBarcodeInput('');
    }
  };

  // Also listen for barcode input changes (for debugging)
  const handleBarcodeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBarcodeInput(value);
    console.log('📝 Barcode input changed:', value);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Hidden barcode input - always focused for scanner */}
      <input
        ref={barcodeInputRef}
        type="text"
        value={barcodeInput}
        onChange={handleBarcodeInputChange}
        onKeyDown={handleBarcodeKeyDown}
        className="absolute opacity-0 pointer-events-none"
        autoComplete="off"
        placeholder="Barcode scanner input"
      />

      {/* Barcode Scanner Status */}
      <div className="bg-white border-b border-gray-200 px-6 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            </div>
            <span className="text-sm font-semibold text-green-700">{t('pos.scannerReady')}</span>
          </div>
          <div className="text-sm text-gray-600">
            {t('pos.scanBarcodeHint')}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-12 gap-6 p-6 overflow-hidden">
        {/* Left Panel - Search & Products */}
        <div className="col-span-7 flex flex-col gap-6 overflow-hidden">
          {/* Customer Selection */}
          <CustomerLookup />

          {/* Product Search */}
          <ProductSearch />
        </div>

        {/* Right Panel - Shopping Cart */}
        <div className="col-span-5 flex flex-col">
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
