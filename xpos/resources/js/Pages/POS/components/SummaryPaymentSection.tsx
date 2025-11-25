import React from 'react';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';

interface Props {
  processing: boolean;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  grandTotal: number;
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  errors: Record<string, string>;
  cartCount: number;
  fiscalPrinterEnabled?: boolean;
}

function SummaryPaymentSection({
  processing,
  subtotal,
  taxAmount,
  discountAmount,
  grandTotal,
  formData,
  setFormData,
  errors,
  cartCount,
  fiscalPrinterEnabled = false,
}: Props) {
  return (
    <div className="bg-white shadow-sm sm:rounded-lg mb-6 sticky top-6">
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Xülasə</h3>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Ara Cəm:</span>
            <span>{(Math.round(subtotal * 100) / 100).toFixed(2)} AZN</span>
          </div>

          <div className="flex justify-between">
            <span>Vergi:</span>
            <TextInput
              type="number"
              step="0.01"
              value={taxAmount}
              onChange={(e) =>
                setFormData((prev: any) => ({ ...prev, tax_amount: parseFloat(e.target.value) || 0 }))
              }
              onBlur={(e) =>
                setFormData((prev: any) => ({ ...prev, tax_amount: Math.round((parseFloat(e.target.value) || 0) * 100) / 100 }))
              }
              className="w-20 text-right text-sm"
              min="0"
            />
          </div>

          <div className="flex justify-between">
            <span>Endirim:</span>
            <TextInput
              type="number"
              step="0.01"
              value={discountAmount}
              onChange={(e) =>
                setFormData((prev: any) => ({ ...prev, discount_amount: parseFloat(e.target.value) || 0 }))
              }
              onBlur={(e) =>
                setFormData((prev: any) => ({ ...prev, discount_amount: Math.round((parseFloat(e.target.value) || 0) * 100) / 100 }))
              }
              className="w-20 text-right text-sm"
              min="0"
            />
          </div>

          <hr className="my-2" />

          <div className="flex justify-between font-bold text-lg">
            <span>Cəm:</span>
            <span>{(Math.round(grandTotal * 100) / 100).toFixed(2)} AZN</span>
          </div>
        </div>

        {/* Payment Section */}
        <div className="mt-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">Ödəmə</h4>
          <div className="space-y-4">
            <div>
              <InputLabel htmlFor="payment_status" value="Ödəmə Statusu" />
              <select
                id="payment_status"
                value={formData.payment_status}
                onChange={(e) =>
                  setFormData((prev: any) => ({
                    ...prev,
                    payment_status: e.target.value,
                    // reset amounts to ensure consistency on status change
                    paid_amount: 0,
                    credit_amount: 0,
                  }))
                }
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                disabled={processing}
              >
                <option value="paid">Tam ödənilib</option>
                <option value="credit">Borc</option>
                <option value="partial">Qismən ödəniş</option>
              </select>
              <InputError message={errors.payment_status} className="mt-2" />
            </div>

            {/* Payment Method Selection */}
            {(formData.payment_status === 'paid' || formData.payment_status === 'partial') && (
              <div>
                <InputLabel htmlFor="payment_method" value="Ödəniş Tipi" />
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData((prev: any) => ({ ...prev, payment_method: 'nağd' }))}
                    className={`flex items-center justify-center px-4 py-3 border rounded-lg transition-colors ${
                      formData.payment_method === 'nağd'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                    disabled={processing}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="font-medium">Nağd</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData((prev: any) => ({ ...prev, payment_method: 'kart' }))}
                    className={`flex items-center justify-center px-4 py-3 border rounded-lg transition-colors ${
                      formData.payment_method === 'kart'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                    disabled={processing}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <span className="font-medium">Kart</span>
                  </button>
                </div>
                <InputError message={errors.payment_method} className="mt-2" />
              </div>
            )}

            {(formData.payment_status === 'paid' || formData.payment_status === 'partial') && (
              <div>
                <InputLabel htmlFor="paid_amount" value="Ödənən Məbləğ" />
                <TextInput
                  id="paid_amount"
                  type="number"
                  step="0.01"
                  value={formData.paid_amount}
                  onChange={(e) => {
                    const paidAmount = Math.min(parseFloat(e.target.value) || 0, grandTotal);
                    setFormData((prev: any) => ({
                      ...prev,
                      paid_amount: paidAmount,
                      credit_amount:
                        prev.payment_status === 'partial' ? Math.max(0, grandTotal - paidAmount) : 0,
                    }));
                  }}
                  onBlur={(e) => {
                    const paidAmount = Math.round(Math.min(parseFloat(e.target.value) || 0, grandTotal) * 100) / 100;
                    setFormData((prev: any) => ({
                      ...prev,
                      paid_amount: paidAmount,
                      credit_amount:
                        prev.payment_status === 'partial' ? Math.round(Math.max(0, grandTotal - paidAmount) * 100) / 100 : 0,
                    }));
                  }}
                  className="mt-1 block w-full"
                  min="0"
                  max={grandTotal}
                  disabled={processing}
                  readOnly={formData.payment_status === 'paid' || formData.payment_status === 'credit'}
                />
                <InputError message={errors.paid_amount} className="mt-2" />
                {formData.payment_status === 'paid' && (
                  <p className="text-xs text-gray-500 mt-1">Tam ödəniş - məbləğ avtomatik hesablanır</p>
                )}
              </div>
            )}

            {(formData.payment_status === 'credit' || formData.payment_status === 'partial') && (
              <div>
                <InputLabel htmlFor="credit_amount" value="Borc Məbləği" />
                <TextInput
                  id="credit_amount"
                  type="number"
                  step="0.01"
                  value={formData.credit_amount}
                  onChange={(e) => {
                    const creditAmount = Math.min(parseFloat(e.target.value) || 0, grandTotal);
                    setFormData((prev: any) => ({
                      ...prev,
                      credit_amount: creditAmount,
                      paid_amount: Math.max(0, grandTotal - creditAmount),
                    }));
                  }}
                  onBlur={(e) => {
                    const creditAmount = Math.round(Math.min(parseFloat(e.target.value) || 0, grandTotal) * 100) / 100;
                    setFormData((prev: any) => ({
                      ...prev,
                      credit_amount: creditAmount,
                      paid_amount: Math.round(Math.max(0, grandTotal - creditAmount) * 100) / 100,
                    }));
                  }}
                  className="mt-1 block w-full"
                  min="0"
                  max={grandTotal}
                  disabled={processing}
                  readOnly={formData.payment_status === 'credit'}
                />
                <InputError message={errors.credit_amount} className="mt-2" />
                {formData.payment_status === 'credit' && (
                  <p className="text-xs text-gray-500 mt-1">Tam borc - məbləğ avtomatik hesablanır</p>
                )}
                {formData.payment_status === 'partial' && (
                  <p className="text-xs text-gray-500 mt-1">Qalan borc məbləği avtomatik hesablanır</p>
                )}
              </div>
            )}

            {(formData.payment_status === 'credit' || formData.payment_status === 'partial') && formData.credit_amount > 0 && (
              <div>
                <InputLabel htmlFor="credit_due_date" value="Borc Ödəmə Tarixi" />
                <TextInput
                  id="credit_due_date"
                  type="date"
                  value={formData.credit_due_date}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, credit_due_date: e.target.value }))}
                  className="mt-1 block w-full"
                  disabled={processing}
                />
                <InputError message={errors.credit_due_date} className="mt-2" />
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="mt-4">
          <InputLabel htmlFor="notes" value="Qeydlər" />
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData((prev: any) => ({ ...prev, notes: e.target.value }))}
            className="mt-1 block w-full text-sm border-gray-300 rounded-md"
            rows={2}
            placeholder="Əlavə qeydlər"
          />
        </div>

        {/* Fiscal Printer Toggle */}
        {fiscalPrinterEnabled && (
          <div className="mt-4">
            <div className="flex items-center">
              <input
                id="use_fiscal_printer"
                type="checkbox"
                checked={formData.use_fiscal_printer ?? true}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, use_fiscal_printer: e.target.checked }))}
                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                disabled={processing}
              />
              <label htmlFor="use_fiscal_printer" className="ml-2 text-sm text-gray-700">
                Fiskal printerə göndər (E-Kassa)
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1 ml-6">
              Bu satış fiskal printerə göndəriləcək və qanuni çek çap ediləcək
            </p>
          </div>
        )}

        {/* Submit Button */}
        <div className="mt-6">
          <PrimaryButton type="submit" disabled={processing || cartCount === 0} className="w-full">
            {processing ? 'Emal edilir...' : 'Satışı Tamamla'}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}

export default React.memo(SummaryPaymentSection);

