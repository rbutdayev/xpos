import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useCartStore } from '../../stores/cart-store';
import { useConfigStore } from '../../stores/config-store';
import toast from 'react-hot-toast';
import Numpad from './Numpad';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type PaymentMethod = 'cash' | 'card' | 'giftCard' | 'other';

interface Payment {
  method: PaymentMethod;
  amount: number;
}

export default function PaymentModal({ isOpen, onClose }: PaymentModalProps) {
  const { t } = useTranslation();
  const { items, total, clearCart } = useCartStore();
  const { config } = useConfigStore();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showNumpad, setShowNumpad] = useState(false);
  const [enableFiscalPrint, setEnableFiscalPrint] = useState(false); // Default to disabled for faster payments

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = total - totalPaid;
  const change = totalPaid > total ? totalPaid - total : 0;

  useEffect(() => {
    if (isOpen) {
      setPayments([]);
      setSelectedMethod('cash');
      setEnableFiscalPrint(false); // Reset to disabled for faster payments
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('az-AZ', {
      style: 'currency',
      currency: 'AZN',
    }).format(price);
  };

  const paymentMethods: { id: PaymentMethod; label: string; icon: JSX.Element; color: string }[] = [
    {
      id: 'cash',
      label: t('payment.cash'),
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: 'bg-green-500',
    },
    {
      id: 'card',
      label: t('payment.card'),
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      color: 'bg-blue-500',
    },
    {
      id: 'giftCard',
      label: t('payment.giftCard'),
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
        </svg>
      ),
      color: 'bg-purple-500',
    },
    {
      id: 'other',
      label: t('payment.other'),
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      color: 'bg-gray-500',
    },
  ];

  const quickAmounts = [5, 10, 20, 50, 100, 200];

  const handleQuickAmount = (amount: number) => {
    addPayment(amount);
  };

  const handleCustomAmount = () => {
    setShowNumpad(true);
  };

  const handleNumpadSubmit = (amount: number) => {
    addPayment(amount);
    setShowNumpad(false);
  };

  const addPayment = (amount: number) => {
    if (amount <= 0) return;

    setPayments([
      ...payments,
      {
        method: selectedMethod,
        amount,
      },
    ]);
  };

  const removePayment = (index: number) => {
    setPayments(payments.filter((_, i) => i !== index));
  };

  const handleCompletePayment = async () => {
    if (remaining > 0) {
      toast.error(t('payment.insufficientAmount'));
      return;
    }

    // Debug: Check config
    console.log('💳 Processing payment with config:', {
      account_id: config?.account_id,
      branch_id: config?.branch_id,
      has_config: !!config,
    });

    if (!config || !config.account_id || !config.branch_id || !config.user_id) {
      console.error('❌ Invalid config:', config);
      toast.error('Configuration error. Please login again.');
      return;
    }

    setIsProcessing(true);

    try {
      // Prepare sale data
      const sale = {
        account_id: config.account_id,
        branch_id: config.branch_id,
        user_id: config.user_id, // Kiosk user who made the sale
        customer_id: null, // TODO: Get from customer store
        items: items.map((item) => ({
          product_id: item.product_id,
          variant_id: item.variant_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_amount: item.discount_amount,
          subtotal: item.subtotal,
        })),
        payments: payments.map((p) => ({
          method: p.method,
          amount: p.amount,
        })),
        subtotal: items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0),
        tax_amount: 0, // TODO: Calculate tax
        discount_amount: items.reduce((sum, item) => sum + item.discount_amount, 0),
        total,
        payment_status: 'paid',
        created_at: new Date().toISOString(),
        enable_fiscal_print: enableFiscalPrint, // Pass fiscal printing flag
      };

      // Debug: Log sale data
      console.log('💾 Creating sale:', {
        account_id: sale.account_id,
        branch_id: sale.branch_id,
        items_count: sale.items.length,
        total: sale.total,
      });

      // Create sale (adds to queue, prints fiscal receipt)
      const localId = await window.ipc.createSale(sale);

      toast.success(t('payment.success'));

      // Clear cart and close modal
      clearCart();
      onClose();
    } catch (error) {
      console.error('Payment failed:', error);
      toast.error(t('payment.failed'));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="gradient-success px-8 py-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">{t('payment.title')}</h2>
                <p className="text-white text-opacity-90">{t('payment.totalDue')}: {formatPrice(total)}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8">
            <div className="grid grid-cols-2 gap-8">
              {/* Left: Payment Methods & Amount Entry */}
              <div className="space-y-6">
                {/* Payment Method Selection */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    {t('payment.method')}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {paymentMethods.map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setSelectedMethod(method.id)}
                        className={`p-4 rounded-xl border-2 transition-all active:scale-95 ${
                          selectedMethod === method.id
                            ? `${method.color} text-white border-transparent shadow-lg`
                            : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-2">
                          {method.icon}
                          <span className="font-semibold text-sm">{method.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fiscal Printing Toggle - VISIBLE LOCATION */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={enableFiscalPrint}
                        onChange={(e) => setEnableFiscalPrint(e.target.checked)}
                        disabled={isProcessing}
                        className="sr-only"
                      />
                      <div className={`w-14 h-8 rounded-full transition-all ${
                        enableFiscalPrint ? 'bg-green-500' : 'bg-gray-400'
                      }`}>
                        <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                          enableFiscalPrint ? 'transform translate-x-6' : ''
                        }`} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className={`w-7 h-7 ${enableFiscalPrint ? 'text-green-600' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      <div>
                        <span className={`font-bold text-base ${enableFiscalPrint ? 'text-gray-900' : 'text-gray-600'}`}>
                          {t('payment.enableFiscalPrint')}
                        </span>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {enableFiscalPrint ? 'Will print receipt (may take 3-5s)' : 'Disabled for faster checkout'}
                        </p>
                      </div>
                    </div>
                  </label>
                </div>

                {/* Pay Full Amount Button - Quick Payment */}
                {remaining > 0 && (
                  <div>
                    <button
                      onClick={() => {
                        addPayment(remaining);
                        // Auto-complete if this covers the full amount
                        if (totalPaid + remaining >= total) {
                          setTimeout(() => handleCompletePayment(), 300);
                        }
                      }}
                      disabled={isProcessing}
                      className="btn btn-success w-full text-xl py-8 font-bold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all"
                    >
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {t('payment.payFullAmount')} {formatPrice(remaining)}
                    </button>
                  </div>
                )}

                {/* Split Payment - Quick Amount Buttons */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    {t('payment.splitPayment')} {t('payment.enterAmount')}
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {quickAmounts.map((amount) => (
                      <button
                        key={amount}
                        onClick={() => handleQuickAmount(amount)}
                        className="btn btn-outline py-6 text-lg font-bold"
                      >
                        {amount} ₼
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleCustomAmount}
                    className="btn btn-primary w-full mt-3 text-lg py-6"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    {t('payment.enterAmount')}
                  </button>
                </div>
              </div>

              {/* Right: Payment Summary */}
              <div className="space-y-6">
                {/* Payments List */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    {t('payment.amountPaid')}
                  </label>
                  <div className="bg-gray-50 rounded-xl p-4 min-h-[200px] max-h-[300px] overflow-y-auto">
                    {payments.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-gray-400">
                        <p className="text-sm">{t('payment.enterAmount')}</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {payments.map((payment, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm"
                          >
                            <div className="flex items-center gap-3">
                              <span className={`w-3 h-3 rounded-full ${
                                paymentMethods.find((m) => m.id === payment.method)?.color
                              }`} />
                              <span className="font-medium text-gray-700">
                                {paymentMethods.find((m) => m.id === payment.method)?.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-gray-900">
                                {formatPrice(payment.amount)}
                              </span>
                              <button
                                onClick={() => removePayment(index)}
                                className="text-red-600 hover:text-red-700 p-1 rounded active:scale-95 transition-all"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Summary */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between text-gray-700">
                    <span className="font-semibold">{t('common.total')}:</span>
                    <span className="text-2xl font-bold">{formatPrice(total)}</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-700">
                    <span className="font-semibold">{t('payment.amountPaid')}:</span>
                    <span className="text-2xl font-bold text-blue-600">{formatPrice(totalPaid)}</span>
                  </div>
                  <div className="h-px bg-gray-300" />
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900 text-lg">
                      {remaining > 0 ? t('payment.totalDue') : t('payment.change')}:
                    </span>
                    <span className={`text-3xl font-bold ${remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {remaining > 0 ? formatPrice(remaining) : formatPrice(change)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-6 bg-gray-50 border-t-2 border-gray-200">
            {/* Fiscal Printing Checkbox */}
            <div className="mb-4">
              <label className="flex items-center gap-3 cursor-pointer select-none group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={enableFiscalPrint}
                    onChange={(e) => setEnableFiscalPrint(e.target.checked)}
                    disabled={isProcessing}
                    className="sr-only"
                  />
                  <div className={`w-12 h-7 rounded-full transition-all ${
                    enableFiscalPrint ? 'bg-green-500' : 'bg-gray-300'
                  }`}>
                    <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      enableFiscalPrint ? 'transform translate-x-5' : ''
                    }`} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <svg className={`w-6 h-6 ${enableFiscalPrint ? 'text-green-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  <span className={`font-semibold ${enableFiscalPrint ? 'text-gray-900' : 'text-gray-500'}`}>
                    {t('payment.enableFiscalPrint')}
                  </span>
                </div>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={onClose}
                disabled={isProcessing}
                className="btn btn-secondary text-lg py-4"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleCompletePayment}
                disabled={remaining > 0 || isProcessing}
                className="btn btn-success text-lg py-4"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                    {t('payment.processing')}
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {t('payment.complete')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Numpad Modal */}
      {showNumpad && (
        <Numpad
          isOpen={showNumpad}
          title={t('payment.enterAmount')}
          initialValue={0}
          onSubmit={handleNumpadSubmit}
          onClose={() => setShowNumpad(false)}
        />
      )}
    </>
  );
}
