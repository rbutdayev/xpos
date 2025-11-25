import React, { useState } from 'react';
import { CreditCardIcon, BanknotesIcon, ClockIcon } from '@heroicons/react/24/outline';

interface Props {
  processing: boolean;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  grandTotal: number;
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  onSubmit: () => void;
  errors: Record<string, string>;
  cartCount: number;
}

export default function TouchPayment({
  processing,
  subtotal,
  taxAmount,
  discountAmount,
  grandTotal,
  formData,
  setFormData,
  onSubmit,
  errors,
  cartCount,
}: Props) {
  const [showDiscountInput, setShowDiscountInput] = useState(false);
  const [showTaxInput, setShowTaxInput] = useState(false);

  const paymentButtons = [
    {
      key: 'paid',
      label: 'Nağd Ödəniş',
      icon: BanknotesIcon,
      color: 'bg-green-500 hover:bg-green-600',
      active: formData.payment_status === 'paid',
    },
    {
      key: 'credit',
      label: 'Borc',
      icon: ClockIcon,
      color: 'bg-orange-500 hover:bg-orange-600',
      active: formData.payment_status === 'credit',
    },
    {
      key: 'partial',
      label: 'Qismən',
      icon: CreditCardIcon,
      color: 'bg-blue-500 hover:bg-blue-600',
      active: formData.payment_status === 'partial',
    },
  ];

  return (
    <div className="p-4 bg-white">
      {/* Summary */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Məbləğ</h3>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Ara cəm:</span>
            <span className="font-medium">{subtotal.toFixed(2)} ₼</span>
          </div>

          {/* Tax Control */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => setShowTaxInput(!showTaxInput)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Vergi: {showTaxInput ? 'Gizlət' : 'Əlavə et'}
            </button>
            {showTaxInput ? (
              <input
                type="number"
                step="0.01"
                value={taxAmount}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, tax_amount: parseFloat(e.target.value) || 0 }))}
                className="w-20 text-sm text-right border border-gray-300 rounded px-2 py-1"
                min="0"
              />
            ) : (
              <span className="text-sm font-medium">{taxAmount.toFixed(2)} ₼</span>
            )}
          </div>

          {/* Discount Control */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => setShowDiscountInput(!showDiscountInput)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Endirim: {showDiscountInput ? 'Gizlət' : 'Əlavə et'}
            </button>
            {showDiscountInput ? (
              <input
                type="number"
                step="0.01"
                value={discountAmount}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, discount_amount: parseFloat(e.target.value) || 0 }))}
                className="w-20 text-sm text-right border border-gray-300 rounded px-2 py-1"
                min="0"
              />
            ) : (
              <span className="text-sm font-medium">-{discountAmount.toFixed(2)} ₼</span>
            )}
          </div>

          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between text-xl font-bold text-gray-900">
              <span>Cəmi:</span>
              <span>{grandTotal.toFixed(2)} ₼</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Method Selection */}
      <div className="mb-4">
        <h4 className="text-lg font-semibold text-gray-900 mb-3">Ödəmə Növü</h4>
        <div className="grid grid-cols-1 gap-2">
          {paymentButtons.map((button) => (
            <button
              key={button.key}
              onClick={() => setFormData((prev: any) => ({ 
                ...prev, 
                payment_status: button.key,
                paid_amount: 0,
                credit_amount: 0 
              }))}
              className={`
                w-full p-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-all duration-150
                ${button.active 
                  ? `${button.color} text-white ring-2 ring-offset-2 ring-blue-500` 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              <button.icon className="w-5 h-5" />
              <span>{button.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Payment Method Selection (Cash/Card) */}
      {(formData.payment_status === 'paid' || formData.payment_status === 'partial') && (
        <div className="mb-4">
          <h4 className="text-lg font-semibold text-gray-900 mb-3">Ödəniş Tipi</h4>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormData((prev: any) => ({ ...prev, payment_method: 'nağd' }))}
              className={`
                flex flex-col items-center justify-center p-4 rounded-lg font-semibold transition-all duration-150
                ${formData.payment_method === 'nağd'
                  ? 'bg-indigo-600 text-white ring-2 ring-offset-2 ring-indigo-500'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-lg">Nağd</span>
            </button>
            <button
              type="button"
              onClick={() => setFormData((prev: any) => ({ ...prev, payment_method: 'kart' }))}
              className={`
                flex flex-col items-center justify-center p-4 rounded-lg font-semibold transition-all duration-150
                ${formData.payment_method === 'kart'
                  ? 'bg-indigo-600 text-white ring-2 ring-offset-2 ring-indigo-500'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <span className="text-lg">Kart</span>
            </button>
          </div>
        </div>
      )}

      {/* Payment Amount Inputs */}
      {formData.payment_status === 'partial' && (
        <div className="mb-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ödənən məbləğ:</label>
            <input
              type="number"
              step="0.01"
              value={formData.paid_amount}
              onChange={(e) => {
                const paidAmount = Math.min(parseFloat(e.target.value) || 0, grandTotal);
                setFormData((prev: any) => ({
                  ...prev,
                  paid_amount: paidAmount,
                  credit_amount: Math.max(0, grandTotal - paidAmount),
                }));
              }}
              className="w-full text-lg text-right border-2 border-gray-300 rounded-lg px-4 py-3 focus:ring-blue-500 focus:border-blue-500"
              min="0"
              max={grandTotal}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Borc məbləği:</label>
            <div className="text-lg text-right border-2 border-gray-200 bg-gray-50 rounded-lg px-4 py-3 font-medium">
              {formData.credit_amount.toFixed(2)} ₼
            </div>
          </div>
        </div>
      )}

      {/* Credit Due Date */}
      {(formData.payment_status === 'credit' || 
        (formData.payment_status === 'partial' && formData.credit_amount > 0)) && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Borc ödəmə tarixi:</label>
          <input
            type="date"
            value={formData.credit_due_date}
            onChange={(e) => setFormData((prev: any) => ({ ...prev, credit_due_date: e.target.value }))}
            className="w-full text-lg border-2 border-gray-300 rounded-lg px-4 py-3 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      )}

      {/* Notes */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Qeydlər:</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData((prev: any) => ({ ...prev, notes: e.target.value }))}
          className="w-full text-sm border-2 border-gray-300 rounded-lg px-4 py-3 focus:ring-blue-500 focus:border-blue-500"
          rows={3}
          placeholder="Əlavə qeydlər..."
        />
      </div>

      {/* Submit Button */}
      <button
        onClick={onSubmit}
        disabled={processing || cartCount === 0}
        className={`
          w-full py-4 rounded-lg text-xl font-bold transition-all duration-150
          ${processing || cartCount === 0
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95 shadow-lg hover:shadow-xl'
          }
        `}
      >
        {processing ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            <span>Emal edilir...</span>
          </div>
        ) : (
          `Satışı Tamamla (${grandTotal.toFixed(2)} ₼)`
        )}
      </button>

      {cartCount === 0 && (
        <p className="text-center text-sm text-gray-500 mt-2">
          Satış üçün səbətə məhsul əlavə edin
        </p>
      )}
    </div>
  );
}