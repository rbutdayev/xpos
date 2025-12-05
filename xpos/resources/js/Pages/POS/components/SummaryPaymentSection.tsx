import React, { useEffect, useState } from 'react';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import { LoyaltyProgram, Customer } from '@/types';

interface FiscalConfig {
  id: number;
  provider: string;
  name: string;
  shift_open: boolean;
  shift_opened_at: string | null;
  last_z_report_at: string | null;
  credit_contract_number?: string;
}

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
  fiscalConfig?: FiscalConfig | null;
  loyaltyProgram?: LoyaltyProgram | null;
  selectedCustomer?: Customer | null;
  giftCardsEnabled?: boolean;
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
  fiscalConfig,
  loyaltyProgram,
  selectedCustomer,
  giftCardsEnabled = false,
}: Props) {
  const [isGiftCardOpen, setIsGiftCardOpen] = useState(false);
  const [giftCardInfo, setGiftCardInfo] = useState<any>(null);
  const [isLookingUpCard, setIsLookingUpCard] = useState(false);
  const [cardLookupError, setCardLookupError] = useState('');

  const handleGiftCardLookup = async (cardNumber: string) => {
    if (!cardNumber || cardNumber.length < 4) {
      setGiftCardInfo(null);
      setCardLookupError('');
      return;
    }

    setIsLookingUpCard(true);
    setCardLookupError('');

    try {
      const response = await fetch('/pos/gift-card/lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({ card_number: cardNumber.toUpperCase() }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setGiftCardInfo(data.card);
        // Auto-fill amount with min(balance, total)
        const maxAmount = Math.min(data.card.current_balance, grandTotal);
        setFormData((prev: any) => ({ ...prev, gift_card_amount: maxAmount }));
        setCardLookupError('');
      } else {
        setGiftCardInfo(null);
        setCardLookupError(data.error || 'Kart tapılmadı');
      }
    } catch (error) {
      setGiftCardInfo(null);
      setCardLookupError('Xəta baş verdi');
    } finally {
      setIsLookingUpCard(false);
    }
  };
  const [pointsDiscount, setPointsDiscount] = useState(0);
  const [pointsToEarn, setPointsToEarn] = useState(0);

  // Calculate points discount when points_to_redeem changes
  useEffect(() => {
    if (loyaltyProgram && (formData.points_to_redeem || 0) > 0) {
      const discount = (formData.points_to_redeem || 0) / loyaltyProgram.redemption_rate;
      setPointsDiscount(Math.round(discount * 100) / 100);
    } else {
      setPointsDiscount(0);
    }
  }, [formData.points_to_redeem, loyaltyProgram]);

  // Calculate points to earn from this purchase
  useEffect(() => {
    if (loyaltyProgram && loyaltyProgram.is_active && selectedCustomer) {
      let amountForPoints = grandTotal;

      // If program doesn't earn on discounted items, use subtotal - discount
      if (!loyaltyProgram.earn_on_discounted_items && discountAmount > 0) {
        amountForPoints = subtotal - discountAmount;
      }

      const points = Math.floor(Math.max(0, amountForPoints) * loyaltyProgram.points_per_currency_unit);
      const cappedPoints = loyaltyProgram.max_points_per_transaction
        ? Math.min(points, loyaltyProgram.max_points_per_transaction)
        : points;

      setPointsToEarn(cappedPoints);
    } else {
      setPointsToEarn(0);
    }
  }, [grandTotal, subtotal, discountAmount, loyaltyProgram, selectedCustomer]);

  const handlePointsRedeemChange = (value: number) => {
    const points = Math.max(0, Math.floor(value));
    const maxPoints = selectedCustomer?.current_points || 0;
    const cappedPoints = Math.min(points, maxPoints);

    setFormData((prev: any) => ({ ...prev, points_to_redeem: cappedPoints }));
  };

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

          {/* Loyalty Points Section */}
          {loyaltyProgram && loyaltyProgram.is_active && selectedCustomer && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="bg-blue-50 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-blue-900">Bonus Ballar</span>
                  <span className="text-blue-700 font-semibold">
                    {selectedCustomer.current_points || 0} bal
                  </span>
                </div>

                <div className="flex flex-col space-y-2">
                  <div className="flex items-center justify-between">
                    <InputLabel htmlFor="points_to_redeem" value="İstifadə et:" className="text-xs mb-0" />
                    <TextInput
                      id="points_to_redeem"
                      type="number"
                      step="1"
                      value={formData.points_to_redeem || 0}
                      onChange={(e) => handlePointsRedeemChange(parseFloat(e.target.value) || 0)}
                      className="w-20 text-right text-sm"
                      min="0"
                      max={selectedCustomer.current_points || 0}
                      disabled={!selectedCustomer.current_points || processing}
                    />
                  </div>

                  {pointsDiscount > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-green-700">Endirim:</span>
                      <span className="font-semibold text-green-700">-{pointsDiscount.toFixed(2)} AZN</span>
                    </div>
                  )}

                  {(formData.points_to_redeem || 0) > 0 &&
                   (formData.points_to_redeem || 0) < (loyaltyProgram.min_redemption_points || 0) && (
                    <p className="text-xs text-red-600">
                      Minimum {loyaltyProgram.min_redemption_points} bal tələb olunur
                    </p>
                  )}

                  {pointsToEarn > 0 && (
                    <div className="flex justify-between text-xs text-blue-700 pt-2 border-t border-blue-200">
                      <span>Qazanacaq:</span>
                      <span className="font-semibold">+{pointsToEarn} bal</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

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
                  {/* Bank Kredit - Only show if fiscal config has credit contract number */}
                  {fiscalConfig?.credit_contract_number && (
                    <button
                      type="button"
                      onClick={() => setFormData((prev: any) => ({ ...prev, payment_method: 'bank_kredit' }))}
                      className={`flex items-center justify-center px-4 py-3 border rounded-lg transition-colors ${
                        formData.payment_method === 'bank_kredit'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                      disabled={processing}
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      <span className="font-medium">Bank Kredit</span>
                    </button>
                  )}
                </div>
                <InputError message={errors.payment_method} className="mt-2" />
              </div>
            )}

            {/* Gift Card Section (Optional - reduces total) */}
            {giftCardsEnabled && formData.payment_status === 'paid' && (
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => setIsGiftCardOpen(!isGiftCardOpen)}
                  className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg hover:from-emerald-100 hover:to-teal-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-semibold text-emerald-900">Hədiyyə Kartı</span>
                  </div>
                  <svg
                    className={`w-5 h-5 text-emerald-600 transition-transform ${isGiftCardOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isGiftCardOpen && (
                  <div className="mt-2 p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg space-y-3">
                    <div>
                      <InputLabel htmlFor="gift_card_code" value="Kart Nömrəsi" />
                      <div className="flex gap-2 mt-1">
                        <TextInput
                          id="gift_card_code"
                          type="text"
                          value={formData.gift_card_code || ''}
                          onChange={(e) => {
                            const value = e.target.value.toUpperCase();
                            setFormData((prev: any) => ({ ...prev, gift_card_code: value }));
                            setGiftCardInfo(null);
                            setCardLookupError('');
                          }}
                          className="flex-1"
                          placeholder="AZ-CARD-123456"
                          disabled={processing || isLookingUpCard}
                        />
                        <button
                          type="button"
                          onClick={() => handleGiftCardLookup(formData.gift_card_code)}
                          disabled={processing || isLookingUpCard || !formData.gift_card_code}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                          {isLookingUpCard ? 'Yoxlanır...' : 'Yoxla'}
                        </button>
                      </div>
                      {cardLookupError && (
                        <p className="text-xs text-red-600 mt-1">{cardLookupError}</p>
                      )}
                      <InputError message={errors.gift_card_code} className="mt-2" />
                    </div>

                    {giftCardInfo && (
                      <div className="p-3 bg-white border border-emerald-200 rounded-md shadow-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Balans:</span>
                          <span className="text-lg font-bold text-emerald-600">₼{giftCardInfo.current_balance}</span>
                        </div>
                      </div>
                    )}

                    {giftCardInfo && giftCardInfo.status === 'active' && (
                      <div>
                        <InputLabel htmlFor="gift_card_amount" value="İstifadə Ediləcək Məbləğ" />
                        <TextInput
                          id="gift_card_amount"
                          type="number"
                          step="0.01"
                          value={formData.gift_card_amount || ''}
                          onChange={(e) => setFormData((prev: any) => ({ ...prev, gift_card_amount: parseFloat(e.target.value) || 0 }))}
                          className="mt-1 block w-full"
                          placeholder="0.00"
                          min="0"
                          max={Math.min(giftCardInfo.current_balance, grandTotal)}
                          disabled={processing}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Maksimum: ₼{Math.min(giftCardInfo.current_balance, grandTotal).toFixed(2)}
                        </p>
                        <InputError message={errors.gift_card_amount} className="mt-2" />
                        {(formData.gift_card_amount || 0) > 0 && (
                          <p className="text-xs text-green-600 font-medium mt-1">
                            Qalan ödəniş: ₼{Math.max(0, grandTotal - (formData.gift_card_amount || 0)).toFixed(2)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {(formData.payment_status === 'paid' || formData.payment_status === 'partial') && (
              <div>
                {/* Show gift card breakdown if gift card is used */}
                {(formData.gift_card_amount || 0) > 0 && (
                  <div className="mb-3 p-3 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-emerald-700">Cəmi məbləğ:</span>
                      <span className="font-semibold">{grandTotal.toFixed(2)} AZN</span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-emerald-700">Hədiyyə kartı:</span>
                      <span className="font-semibold text-emerald-600">-{(formData.gift_card_amount || 0).toFixed(2)} AZN</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t border-emerald-200">
                      <span className="text-emerald-900 font-medium">Qalan ödəniş:</span>
                      <span className="font-bold">{Math.max(0, grandTotal - (formData.gift_card_amount || 0)).toFixed(2)} AZN</span>
                    </div>
                  </div>
                )}
                <InputLabel htmlFor="paid_amount" value="Ödənən Məbləğ" />
                <TextInput
                  id="paid_amount"
                  type="number"
                  step="0.01"
                  value={
                    formData.payment_status === 'paid'
                      ? Math.max(0, grandTotal - (formData.gift_card_amount || 0)).toFixed(2)
                      : formData.paid_amount
                  }
                  onChange={(e) => {
                    const remainingTotal = grandTotal - (formData.gift_card_amount || 0);
                    const paidAmount = Math.min(parseFloat(e.target.value) || 0, remainingTotal);
                    setFormData((prev: any) => ({
                      ...prev,
                      paid_amount: paidAmount,
                      credit_amount:
                        prev.payment_status === 'partial' ? Math.max(0, remainingTotal - paidAmount) : 0,
                    }));
                  }}
                  onBlur={(e) => {
                    const remainingTotal = grandTotal - (formData.gift_card_amount || 0);
                    const paidAmount = Math.round(Math.min(parseFloat(e.target.value) || 0, remainingTotal) * 100) / 100;
                    setFormData((prev: any) => ({
                      ...prev,
                      paid_amount: paidAmount,
                      credit_amount:
                        prev.payment_status === 'partial' ? Math.round(Math.max(0, remainingTotal - paidAmount) * 100) / 100 : 0,
                    }));
                  }}
                  className={`mt-1 block w-full ${
                    formData.payment_status === 'paid' ? 'bg-gray-50 font-semibold' : ''
                  }`}
                  min="0"
                  max={grandTotal - (formData.gift_card_amount || 0)}
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

