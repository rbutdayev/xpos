import React from 'react';
import { useTranslation } from 'react-i18next';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';

export interface Payment {
    method: 'nağd' | 'kart' | 'köçürmə';
    amount: number;
    transaction_id?: string;
    card_type?: string;
    reference_number?: string;
    notes?: string;
}

interface PaymentFormProps {
    // For sale mode - multiple payments
    mode?: 'sale' | 'service';
    
    // Sale mode props
    payments?: Payment[];
    onAddPayment?: (payment: Payment) => void;
    onRemovePayment?: (index: number) => void;
    isCredit?: boolean;
    onCreditToggle?: (isCredit: boolean) => void;
    
    // Service mode props  
    paymentStatus?: 'paid' | 'credit' | 'partial';
    onPaymentStatusChange?: (status: 'paid' | 'credit' | 'partial') => void;
    paidAmount?: number;
    onPaidAmountChange?: (amount: number) => void;
    creditAmount?: number;
    onCreditAmountChange?: (amount: number) => void;
    creditDueDate?: string;
    onCreditDueDateChange?: (date: string) => void;
    
    // Common props
    totalAmount: number;
    errors?: Record<string, string>;
    disabled?: boolean;
}

export default function PaymentForm({
    mode = 'sale',
    payments = [],
    onAddPayment,
    onRemovePayment,
    isCredit = false,
    onCreditToggle,
    paymentStatus = 'paid',
    onPaymentStatusChange,
    paidAmount = 0,
    onPaidAmountChange,
    creditAmount = 0,
    onCreditAmountChange,
    creditDueDate = '',
    onCreditDueDateChange,
    totalAmount,
    errors = {},
    disabled = false
}: PaymentFormProps) {
    const { t } = useTranslation();
    const [showAddPaymentForm, setShowAddPaymentForm] = React.useState(false);
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const remainingAmount = totalAmount - totalPaid;
    
    const [newPayment, setNewPayment] = React.useState<Payment>({
        method: 'nağd',
        amount: 0,
    });

    // Update amount when showing payment form
    React.useEffect(() => {
        if (showAddPaymentForm && remainingAmount > 0) {
            setNewPayment(prev => ({ ...prev, amount: remainingAmount }));
        }
    }, [showAddPaymentForm, remainingAmount]);

    // Auto-add full cash payment if no payments exist and not credit sale
    React.useEffect(() => {
        if (mode === 'sale' && !isCredit && payments.length === 0 && totalAmount > 0 && onAddPayment) {
            onAddPayment({
                method: 'nağd',
                amount: totalAmount,
            });
        }
    }, [mode, isCredit, payments.length, totalAmount, onAddPayment]);

    const handleAddPayment = () => {
        if (newPayment.amount <= 0 || !onAddPayment) return;
        
        onAddPayment({ ...newPayment });
        setNewPayment({ method: 'nağd', amount: 0 });
        setShowAddPaymentForm(false);
    };

    if (mode === 'sale') {
        return (
            <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-900">{t('payment.title')}</h4>
                
                {/* Credit Sale Toggle */}
                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        id="is_credit_sale"
                        checked={isCredit}
                        onChange={(e) => onCreditToggle?.(e.target.checked)}
                        disabled={disabled}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-slate-500"
                    />
                    <label htmlFor="is_credit_sale" className="text-sm font-medium text-gray-700">
                        {t('payment.creditSale')}
                    </label>
                </div>
                
                {!isCredit && (
                    <div className="space-y-3">
                        {/* Add Payment Button */}
                        <button
                            type="button"
                            onClick={() => setShowAddPaymentForm(true)}
                            disabled={disabled || remainingAmount <= 0}
                            className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            {t('actions.addPayment')}
                        </button>
                        
                        {/* Payment List */}
                        {payments.length > 0 && (
                            <div className="bg-gray-50 rounded-md p-3 space-y-2">
                                <div className="text-sm font-medium text-gray-900">{t('payment.addedPayments')}</div>
                                {payments.map((payment, index) => (
                                    <div key={index} className="flex items-center justify-between text-xs">
                                        <span className="flex items-center space-x-2">
                                            <span className="capitalize">{payment.method}</span>
                                            {payment.transaction_id && (
                                                <span className="text-gray-500">({payment.transaction_id})</span>
                                            )}
                                        </span>
                                        <div className="flex items-center space-x-2">
                                            <span className="font-medium">{payment.amount.toFixed(2)} AZN</span>
                                            {onRemovePayment && (
                                                <button
                                                    type="button"
                                                    onClick={() => onRemovePayment(index)}
                                                    className="text-red-600 hover:text-red-800"
                                                    disabled={disabled}
                                                >
                                                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                
                                {/* Payment Summary */}
                                <div className="pt-2 border-t border-gray-300 space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span>{t('payment.paid')}:</span>
                                        <span className="font-medium">{totalPaid.toFixed(2)} AZN</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span>{t('payment.remaining')}:</span>
                                        <span className={`font-medium ${remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                            {remainingAmount.toFixed(2)} AZN
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Add Payment Modal */}
                        {showAddPaymentForm && (
                            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                                <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">{t('actions.addPayment')}</h3>
                                    
                                    <div className="space-y-4">
                                        <div>
                                            <InputLabel htmlFor="payment_method" value={t('payment.method')} />
                                            <select
                                                id="payment_method"
                                                value={newPayment.method}
                                                onChange={(e) => setNewPayment(prev => ({ ...prev, method: e.target.value as any }))}
                                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500"
                                            >
                                                <option value="nağd">{t('payment.cash')}</option>
                                                <option value="kart">{t('payment.card')}</option>
                                                <option value="köçürmə">{t('payment.transfer')}</option>
                                            </select>
                                        </div>

                                        <div>
                                            <InputLabel htmlFor="payment_amount" value={t('labels.amount')} />
                                            <TextInput
                                                id="payment_amount"
                                                type="number"
                                                step="0.01"
                                                value={newPayment.amount}
                                                onChange={(e) => setNewPayment(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                                                className="mt-1 block w-full"
                                                min="0"
                                                max={remainingAmount}
                                                placeholder={t('payment.maxAmount', { amount: remainingAmount.toFixed(2) })}
                                            />
                                        </div>

                                        {newPayment.method === 'kart' && (
                                            <div>
                                                <InputLabel htmlFor="card_type" value={t('payment.cardType')} />
                                                <TextInput
                                                    id="card_type"
                                                    type="text"
                                                    value={newPayment.card_type || ''}
                                                    onChange={(e) => setNewPayment(prev => ({ ...prev, card_type: e.target.value }))}
                                                    className="mt-1 block w-full"
                                                    placeholder={t('payment.cardTypePlaceholder')}
                                                />
                                            </div>
                                        )}

                                        {(newPayment.method === 'kart' || newPayment.method === 'köçürmə') && (
                                            <div>
                                                <InputLabel htmlFor="transaction_id" value={t('payment.transactionId')} />
                                                <TextInput
                                                    id="transaction_id"
                                                    type="text"
                                                    value={newPayment.transaction_id || ''}
                                                    onChange={(e) => setNewPayment(prev => ({ ...prev, transaction_id: e.target.value }))}
                                                    className="mt-1 block w-full"
                                                    placeholder={t('payment.transactionPlaceholder')}
                                                />
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex items-center space-x-2 mt-6">
                                        <button
                                            type="button"
                                            onClick={handleAddPayment}
                                            disabled={newPayment.amount <= 0}
                                            className="flex-1 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {t('actions.add')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowAddPaymentForm(false)}
                                            className="flex-1 inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                                        >
                                            {t('actions.cancel')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                <InputError message={errors.payments} />
            </div>
        );
    }

    // Service mode
    return (
        <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900">{t('payment.title')}</h4>

            <div>
                <select
                    value={paymentStatus}
                    onChange={(e) => onPaymentStatusChange?.(e.target.value as any)}
                    disabled={disabled}
                    className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500"
                >
                    <option value="paid">{t('payment.status.paid')}</option>
                    <option value="credit">{t('payment.status.credit')}</option>
                    <option value="partial">{t('payment.status.partial')}</option>
                </select>
                <InputError message={errors.payment_status} />
            </div>

            {paymentStatus === 'partial' && (
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <InputLabel value={t('payment.paidAmount')} className="text-xs text-gray-600" />
                        <TextInput
                            type="number"
                            step="0.01"
                            value={paidAmount}
                            onChange={(e) => {
                                const paid = parseFloat(e.target.value) || 0;
                                onPaidAmountChange?.(paid);
                                onCreditAmountChange?.(totalAmount - paid);
                            }}
                            className="w-full text-sm"
                            min="0"
                            max={totalAmount}
                            disabled={disabled}
                        />
                        <InputError message={errors.paid_amount} />
                    </div>
                    <div>
                        <InputLabel value={t('payment.creditAmount')} className="text-xs text-gray-600" />
                        <TextInput
                            type="number"
                            step="0.01"
                            value={creditAmount}
                            onChange={(e) => {
                                const credit = parseFloat(e.target.value) || 0;
                                onCreditAmountChange?.(credit);
                                onPaidAmountChange?.(totalAmount - credit);
                            }}
                            className="w-full text-sm"
                            min="0"
                            max={totalAmount}
                            disabled={disabled}
                        />
                        <InputError message={errors.credit_amount} />
                    </div>
                </div>
            )}

            {(paymentStatus === 'credit' || paymentStatus === 'partial') && (
                <div>
                    <InputLabel value={t('payment.creditDueDate')} className="text-xs text-gray-600" />
                    <TextInput
                        type="date"
                        value={creditDueDate}
                        onChange={(e) => onCreditDueDateChange?.(e.target.value)}
                        className="w-full text-sm"
                        min={new Date().toISOString().split('T')[0]}
                        disabled={disabled}
                    />
                    <InputError message={errors.credit_due_date} />
                </div>
            )}
        </div>
    );
}