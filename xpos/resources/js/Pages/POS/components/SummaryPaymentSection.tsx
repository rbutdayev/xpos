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
                  <p className="text-xs text-gray-500 mt-1">Tam ödəniş - məbləğ avtomatik hesablanır (Nağd)</p>
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

