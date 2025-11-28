import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import { PageProps, Sale, Customer } from '@/types';

interface SalesEditProps extends PageProps {
    sale: Sale & {
        customer?: Customer;
        customer_credit?: {
            id: number;
            amount: number;
            remaining_amount: number;
            due_date: string;
            status: string;
            description?: string;
        };
        payments: Array<{
            payment_id: number;
            method: string;
            amount: number;
            created_at: string;
        }>;
    };
    customers: Customer[];
}

export default function Edit({ auth, sale, customers }: SalesEditProps) {
    const [showAddPayment, setShowAddPayment] = useState(false);

    const { data, setData, put, processing, errors } = useForm({
        customer_id: sale.customer_id || '',
        notes: sale.notes || '',
        status: sale.status as 'pending' | 'completed' | 'cancelled' | 'refunded',
        credit_due_date: sale.customer_credit?.due_date ? sale.customer_credit.due_date.split('T')[0] : '',
    });

    const { data: paymentData, setData: setPaymentData, patch: patchPayment, processing: paymentProcessing, errors: paymentErrors, reset: resetPayment } = useForm({
        amount: '',
        description: '',
        method: 'nağd',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('sales.update', sale.sale_id));
    };

    const handleAddPayment = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Client-side validation to prevent overpayment
        const paymentAmount = Number(paymentData.amount);
        if (paymentAmount > maxPayableAmount) {
            alert(`Ödəniş məbləği maksimum ${formatCurrency(maxPayableAmount)} ola bilər.`);
            return;
        }
        
        patchPayment(route('sales.pay-credit', sale.sale_id), {
            onSuccess: () => {
                resetPayment();
                setShowAddPayment(false);
            }
        });
    };

    const formatCurrency = (amount: number | null | undefined) => {
        return `${(Number(amount) || 0).toFixed(2)} ₼`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('az-AZ');
    };

    const totalPaid = sale.payments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0) || 0;
    const remainingBalance = sale.customer_credit_id && sale.customer_credit?.remaining_amount !== undefined
        ? Number(sale.customer_credit.remaining_amount)
        : (Number(sale.total) || 0) - totalPaid;
    
    // For credit sales, the maximum payable amount should be limited to credit amount
    const maxPayableAmount = remainingBalance;

    return (
        <AuthenticatedLayout>
            <Head title={`Satış düzəliş et - #${sale.sale_number}`} />

            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    {/* Sale Summary (Read-only) */}
                    <div className="bg-gray-50 overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Satış məlumatları (dəyişdirilə bilməz)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-2">Satış nömrəsi</h4>
                                <p className="font-medium">{sale.sale_number}</p>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-2">Ümumi məbləğ</h4>
                                <p className="font-medium text-lg">{formatCurrency(sale.total)}</p>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-2">Satış tarixi</h4>
                                <p className="font-medium">{formatDate(sale.sale_date)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Payment Status */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-900">Ödəniş statusu</h3>
                            {(remainingBalance > 0 || (sale.customer_credit_id && sale.credit_amount && sale.credit_amount > 0)) && (
                                <PrimaryButton 
                                    onClick={() => setShowAddPayment(!showAddPayment)}
                                    disabled={paymentProcessing}
                                >
                                    {showAddPayment ? 'Ləğv et' : 'Ödəniş əlavə et'}
                                </PrimaryButton>
                            )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-2">Ödənilmiş</h4>
                                <p className="text-lg font-semibold text-green-600">{formatCurrency(totalPaid)}</p>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-2">Qalan</h4>
                                <p className={`text-lg font-semibold ${remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {formatCurrency(remainingBalance)}
                                </p>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-2">Status</h4>
                                <div>
                                    {remainingBalance <= 0 ? (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            ✅ Tam ödənilmiş
                                        </span>
                                    ) : sale.customer_credit_id ? (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                            ❌ Kredit (Borclu)
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                            ⏳ Qismən ödənilmiş
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Add Payment Form */}
                        {showAddPayment && (
                            <div className="border-t pt-6">
                                <form onSubmit={handleAddPayment} className="bg-blue-50 p-4 rounded-lg">
                                    <h4 className="text-lg font-medium text-gray-900 mb-4">Yeni ödəniş əlavə et</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <InputLabel htmlFor="payment_method" value="Ödəniş üsulu" />
                                            <select
                                                id="payment_method"
                                                value={paymentData.method}
                                                onChange={(e) => setPaymentData('method', e.target.value)}
                                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                required
                                            >
                                                <option value="nağd">Nağd</option>
                                                <option value="kart">Kart</option>
                                                <option value="köçürmə">Bank köçürməsi</option>
                                            </select>
                                            <InputError message={paymentErrors.method} className="mt-2" />
                                        </div>
                                        <div>
                                            <InputLabel htmlFor="amount" value="Ödəniş məbləği" />
                                            <TextInput
                                                id="amount"
                                                type="number"
                                                step="0.01"
                                                max={maxPayableAmount}
                                                value={paymentData.amount}
                                                onChange={(e) => setPaymentData('amount', e.target.value)}
                                                placeholder={`Maksimum: ${formatCurrency(maxPayableAmount)}`}
                                                className="mt-1 block w-full"
                                                required
                                            />
                                            <InputError message={paymentErrors.amount} className="mt-2" />
                                        </div>
                                        <div>
                                            <InputLabel htmlFor="description" value="Qeyd" />
                                            <TextInput
                                                id="description"
                                                value={paymentData.description}
                                                onChange={(e) => setPaymentData('description', e.target.value)}
                                                placeholder="Ödəniş haqqında qeyd..."
                                                className="mt-1 block w-full"
                                            />
                                            <InputError message={paymentErrors.description} className="mt-2" />
                                        </div>
                                    </div>
                                    <div className="mt-4 flex gap-2">
                                        <PrimaryButton type="submit" disabled={paymentProcessing}>
                                            {paymentProcessing ? 'Əlavə edilir...' : 'Ödəniş əlavə et'}
                                        </PrimaryButton>
                                        <SecondaryButton type="button" onClick={() => setShowAddPayment(false)}>
                                            Ləğv et
                                        </SecondaryButton>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Payment History */}
                        {sale.payments.length > 0 && (
                            <div className="border-t pt-6">
                                <h4 className="text-lg font-medium text-gray-900 mb-4">Ödəniş tarixçəsi</h4>
                                <div className="space-y-2">
                                    {sale.payments.map((payment) => (
                                        <div key={payment.payment_id} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                                            <div>
                                                <span className="font-medium">{payment.method}</span>
                                                <span className="text-sm text-gray-500 ml-2">{formatDate(payment.created_at || '')}</span>
                                            </div>
                                            <span className="font-semibold">{formatCurrency(payment.amount)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Editable Fields */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <h3 className="text-lg font-medium text-gray-900">Düzəliş edilə bilən sahələr</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <InputLabel htmlFor="customer_id" value="Müştəri" />
                                    <select
                                        id="customer_id"
                                        value={data.customer_id}
                                        onChange={(e) => setData('customer_id', e.target.value)}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        <option value="">Müştəri seçin</option>
                                        {customers.map((customer) => (
                                            <option key={customer.id} value={customer.id}>
                                                {customer.name} {customer.phone && `(${customer.phone})`}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.customer_id} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="status" value="Status" />
                                    <select
                                        id="status"
                                        value={data.status}
                                        onChange={(e) => setData('status', e.target.value as 'pending' | 'completed' | 'cancelled' | 'refunded')}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        required
                                    >
                                        <option value="pending">Gözləyir</option>
                                        <option value="completed">Tamamlandı</option>
                                        <option value="cancelled">Ləğv edildi</option>
                                    </select>
                                    <InputError message={errors.status} className="mt-2" />
                                </div>
                            </div>

                            {sale.customer_credit_id && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <InputLabel htmlFor="credit_due_date" value="Kredit son tarixi" />
                                        <TextInput
                                            id="credit_due_date"
                                            type="date"
                                            value={data.credit_due_date}
                                            onChange={(e) => setData('credit_due_date', e.target.value)}
                                            className="mt-1 block w-full"
                                        />
                                        <InputError message={errors.credit_due_date} className="mt-2" />
                                    </div>

                                </div>
                            )}

                            <div>
                                <InputLabel htmlFor="notes" value="Qeydlər" />
                                <textarea
                                    id="notes"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    rows={4}
                                    placeholder="Satış haqqında əlavə qeydlər..."
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                                <InputError message={errors.notes} className="mt-2" />
                            </div>

                            <div className="flex items-center gap-4">
                                <PrimaryButton type="submit" disabled={processing}>
                                    {processing ? 'Yenilənir...' : 'Məlumatları yenilə'}
                                </PrimaryButton>

                                <Link href={route('sales.show', sale.sale_id)}>
                                    <SecondaryButton>
                                        Ləğv et
                                    </SecondaryButton>
                                </Link>
                            </div>
                        </form>
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}