import React, { useState } from 'react';
import { useCartStore } from '../../stores/cart-store';
import { useConfigStore } from '../../stores/config-store';
import type { Payment, Sale } from '../../types';
import toast from 'react-hot-toast';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PaymentModal({ isOpen, onClose }: PaymentModalProps) {
  const { items, customer, total, payments, addPayment, removePayment, clearCart, notes } = useCartStore();
  const { config } = useConfigStore();

  const [selectedMethod, setSelectedMethod] = useState<'cash' | 'card' | 'gift_card'>('cash');
  const [paymentAmount, setPaymentAmount] = useState(total.toFixed(2));
  const [isProcessing, setIsProcessing] = useState(false);

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = total - totalPaid;

  const handleAddPayment = () => {
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Invalid payment amount');
      return;
    }

    if (amount > remaining) {
      toast.error('Payment amount exceeds remaining balance');
      return;
    }

    addPayment({
      method: selectedMethod,
      amount,
    });

    setPaymentAmount(remaining - amount > 0 ? (remaining - amount).toFixed(2) : '0.00');
    toast.success('Payment added');
  };

  const handleCompleteSale = async () => {
    if (remaining > 0.01) {
      toast.error('Please complete payment before finalizing sale');
      return;
    }

    if (!config) {
      toast.error('Device not configured');
      return;
    }

    setIsProcessing(true);

    try {
      // Prepare sale data
      const sale: Sale = {
        account_id: config.account_id,
        branch_id: config.branch_id,
        customer_id: customer?.id || null,
        items: items.map((item) => ({
          product_id: item.product_id,
          variant_id: item.variant_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_amount: item.discount_amount,
          subtotal: item.subtotal,
        })),
        payments,
        subtotal: items.reduce((sum, item) => sum + item.subtotal, 0),
        tax_amount: 0, // TODO: Calculate tax
        discount_amount: items.reduce((sum, item) => sum + item.discount_amount, 0),
        total,
        payment_status: 'paid',
        notes,
        created_at: new Date().toISOString(),
      };

      // Print fiscal receipt if configured
      try {
        const fiscalConfig = await window.ipc.getFiscalConfig();
        if (fiscalConfig && fiscalConfig.is_active) {
          const fiscalResult = await window.ipc.printFiscalReceipt(sale);
          sale.fiscal_number = fiscalResult.fiscalNumber;
          sale.fiscal_document_id = fiscalResult.fiscalDocumentId;
        }
      } catch (fiscalError) {
        console.error('Fiscal printer error:', fiscalError);
        // Continue with sale even if fiscal print fails
        toast.error('Fiscal receipt failed, but sale will be saved');
      }

      // Save sale locally (will be synced later)
      const localSaleId = await window.ipc.createSale(sale);

      toast.success(`Sale #${localSaleId} completed successfully!`);

      // Clear cart and close modal
      clearCart();
      onClose();
    } catch (error: any) {
      console.error('Sale failed:', error);
      toast.error(error.message || 'Failed to complete sale');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuickAmount = (amount: number) => {
    setPaymentAmount(amount.toFixed(2));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-primary-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Payment</h2>
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="text-white hover:text-gray-200 disabled:opacity-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-lg">Total Due:</span>
            <span className="text-4xl font-bold">${total.toFixed(2)}</span>
          </div>
        </div>

        <div className="p-6">
          {/* Payment Status */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-700 font-medium">Total Paid:</span>
              <span className="text-xl font-bold text-green-600">${totalPaid.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-medium">Remaining:</span>
              <span className={`text-xl font-bold ${remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                ${remaining.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Existing Payments */}
          {payments.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Payments:</h3>
              <div className="space-y-2">
                {payments.map((payment, index) => (
                  <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <span className="font-medium text-green-900 capitalize">{payment.method.replace('_', ' ')}</span>
                      <span className="text-green-700 ml-2">${payment.amount.toFixed(2)}</span>
                    </div>
                    <button
                      onClick={() => removePayment(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {remaining > 0.01 && (
            <>
              {/* Payment Method Selection */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Payment Method:</h3>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setSelectedMethod('cash')}
                    className={`py-4 px-6 rounded-lg border-2 font-semibold transition-all ${
                      selectedMethod === 'cash'
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400'
                    }`}
                  >
                    Cash
                  </button>
                  <button
                    onClick={() => setSelectedMethod('card')}
                    className={`py-4 px-6 rounded-lg border-2 font-semibold transition-all ${
                      selectedMethod === 'card'
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400'
                    }`}
                  >
                    Card
                  </button>
                  <button
                    onClick={() => setSelectedMethod('gift_card')}
                    className={`py-4 px-6 rounded-lg border-2 font-semibold transition-all ${
                      selectedMethod === 'gift_card'
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400'
                    }`}
                  >
                    Gift Card
                  </button>
                </div>
              </div>

              {/* Quick Amount Buttons */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Amount:</h3>
                <div className="grid grid-cols-4 gap-2">
                  {[10, 20, 50, 100].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => handleQuickAmount(amount)}
                      className="py-3 px-4 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold text-gray-700 transition-colors"
                    >
                      ${amount}
                    </button>
                  ))}
                  <button
                    onClick={() => handleQuickAmount(remaining)}
                    className="py-3 px-4 bg-primary-100 hover:bg-primary-200 rounded-lg font-semibold text-primary-700 transition-colors col-span-2"
                  >
                    Exact (${remaining.toFixed(2)})
                  </button>
                </div>
              </div>

              {/* Payment Amount Input */}
              <div className="mb-6">
                <label htmlFor="paymentAmount" className="block text-sm font-semibold text-gray-700 mb-2">
                  Amount:
                </label>
                <input
                  type="number"
                  id="paymentAmount"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-4 text-2xl font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-center"
                />
              </div>

              <button
                onClick={handleAddPayment}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 mb-4"
              >
                Add Payment
              </button>
            </>
          )}

          {/* Complete Sale Button */}
          <button
            onClick={handleCompleteSale}
            disabled={remaining > 0.01 || isProcessing}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-lg flex items-center justify-center space-x-2"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Complete Sale</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
