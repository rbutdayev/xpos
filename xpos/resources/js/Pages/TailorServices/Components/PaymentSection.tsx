import { memo } from 'react';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import { ServiceTotals } from '../Utils/serviceCalculations';

interface PaymentSectionProps {
    paymentStatus: string;
    paidAmount: number;
    creditAmount: number;
    totals: ServiceTotals;
    onPaymentStatusChange: (status: string) => void;
    onPaidAmountChange: (amount: number) => void;
    onCreditAmountChange: (amount: number) => void;
    errors: Record<string, string>;
    processing?: boolean;
}

export const PaymentSection = memo(({
    paymentStatus,
    paidAmount,
    creditAmount,
    totals,
    onPaymentStatusChange,
    onPaidAmountChange,
    onCreditAmountChange,
    errors,
    processing = false
}: PaymentSectionProps) => {
    return (
        <div className="space-y-6">
            <div>
                <InputLabel htmlFor="payment_status" value="Ödəniş statusu" />
                <select
                    id="payment_status"
                    value={paymentStatus}
                    onChange={(e) => onPaymentStatusChange(e.target.value)}
                    disabled={processing}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                    <option value="paid">Ödənilib</option>
                    <option value="partial">Qismən ödənilib</option>
                    <option value="credit">Borc</option>
                    <option value="unpaid">Ödənilməyib</option>
                </select>
                <InputError message={errors.payment_status} className="mt-2" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <InputLabel htmlFor="paid_amount" value="Ödənilən məbləğ" />
                    <input
                        id="paid_amount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={paidAmount || ''}
                        onChange={(e) => onPaidAmountChange(Number(e.target.value) || 0)}
                        disabled={processing}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        placeholder="0.00"
                    />
                    <div className="text-sm text-gray-500 mt-1">AZN</div>
                    <InputError message={errors.paid_amount} className="mt-2" />
                </div>

                <div>
                    <InputLabel htmlFor="credit_amount" value="Borc məbləği" />
                    <input
                        id="credit_amount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={creditAmount || ''}
                        onChange={(e) => onCreditAmountChange(Number(e.target.value) || 0)}
                        disabled={processing}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        placeholder="0.00"
                    />
                    <div className="text-sm text-gray-500 mt-1">AZN</div>
                    <InputError message={errors.credit_amount} className="mt-2" />
                </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-3">Ödəniş Məlumatları</h4>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-blue-700">Ümumi məbləğ:</span>
                        <span className="font-medium text-blue-900">{totals.formattedTotalCost}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-blue-700">Ödənilən:</span>
                        <span className="font-medium text-blue-900">{paidAmount.toFixed(2)} AZN</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-blue-700">Borc:</span>
                        <span className="font-medium text-blue-900">{creditAmount.toFixed(2)} AZN</span>
                    </div>
                    <div className="border-t border-blue-300 pt-2 flex justify-between">
                        <span className="font-semibold text-blue-900">Yoxlanış:</span>
                        <span className={`font-bold ${Math.abs((paidAmount + creditAmount) - totals.totalCost) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                            {Math.abs((paidAmount + creditAmount) - totals.totalCost) < 0.01 ? '✓ Düzgün' : '✗ Nəticə uyğun deyil'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
});