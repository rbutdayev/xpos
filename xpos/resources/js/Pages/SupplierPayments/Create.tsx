import { Head, useForm, Link } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { __ } from '@/utils/translations';
import { TruckIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { GoodsReceipt, SupplierCredit } from '@/types';

interface Supplier {
    id: number;
    name: string;
    company: string | null;
}

interface Props {
    suppliers: Supplier[];
    paymentMethods: Record<string, string>;
    unpaidGoodsReceipts: GoodsReceipt[];
}

interface PaymentFormData {
    supplier_id: string;
    amount: string;
    description: string;
    payment_date: string;
    payment_method: string;
    invoice_number: string;
    notes: string;
    goods_receipt_id: string;
    payment_amount: string;
}

export default function Create({ suppliers, paymentMethods, unpaidGoodsReceipts }: Props) {
    const [goodsReceiptSearch, setGoodsReceiptSearch] = useState('');
    const [showGoodsReceiptDropdown, setShowGoodsReceiptDropdown] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm<PaymentFormData>({
        supplier_id: '',
        amount: '',
        description: '',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'nağd',
        invoice_number: '',
        notes: '',
        goods_receipt_id: '',
        payment_amount: '',
    });

    const filteredGoodsReceipts = useMemo(() => {
        if (!goodsReceiptSearch) return unpaidGoodsReceipts;
        const search = goodsReceiptSearch.toLowerCase();
        return unpaidGoodsReceipts.filter(gr =>
            gr.receipt_number.toLowerCase().includes(search) ||
            gr.supplier?.name.toLowerCase().includes(search) ||
            gr.product?.name.toLowerCase().includes(search)
        );
    }, [goodsReceiptSearch, unpaidGoodsReceipts]);

    const selectedGoodsReceipt = unpaidGoodsReceipts.find(gr => gr.id === Number(data.goods_receipt_id));

    // Helper function to safely get numeric value
    const getRemainingAmount = (receipt: GoodsReceipt): number => {
        const remaining = receipt.supplier_credit?.remaining_amount ?? receipt.total_cost ?? 0;
        return typeof remaining === 'number' ? remaining : Number(remaining) || 0;
    };

    const handleGoodsReceiptSelect = (receipt: GoodsReceipt) => {
        const remainingAmount = getRemainingAmount(receipt);
        setData({
            ...data,
            goods_receipt_id: String(receipt.id),
            supplier_id: String(receipt.supplier_id),
            amount: remainingAmount.toFixed(2),
            payment_amount: remainingAmount.toFixed(2),
            description: `Mal qəbulu ödəməsi - ${receipt.receipt_number}`,
            invoice_number: receipt.receipt_number,
        });
        setGoodsReceiptSearch('');
        setShowGoodsReceiptDropdown(false);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('supplier-payments.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Yeni Təchizatçı Ödənişi
                    </h2>
                    <Link
                        href="/supplier-payments"
                        className="text-gray-600 hover:text-gray-900"
                    >
                        ← Ödənişlərə qayıt
                    </Link>
                </div>
            }
        >
            <Head title="Yeni Təchizatçı Ödənişi" />

            <div className="py-12">
                <div className="mx-auto max-w-2xl sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <form onSubmit={submit} className="p-6 space-y-6">
                            {/* Goods Receipt Selector */}
                            {unpaidGoodsReceipts && unpaidGoodsReceipts.length > 0 && (
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                    <InputLabel htmlFor="goods_receipt" value="Ödənilməmiş Mal Qəbulu Seçin (İstəyə bağlı)" className="text-blue-900" />
                                    <p className="text-sm text-blue-700 mt-1 mb-3">
                                        Mal qəbulu seçsəniz, məlumatlar avtomatik doldurulacaq
                                    </p>

                                    {/* Show dropdown if 20 or fewer items, otherwise show searchable */}
                                    {unpaidGoodsReceipts.length <= 20 ? (
                                        <select
                                            id="goods_receipt"
                                            value={data.goods_receipt_id}
                                            onChange={(e) => {
                                                const receipt = unpaidGoodsReceipts.find(gr => gr.id === Number(e.target.value));
                                                if (receipt) handleGoodsReceiptSelect(receipt);
                                            }}
                                            className="mt-1 block w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md shadow-sm"
                                        >
                                            <option value="">Mal qəbulu seçin</option>
                                            {unpaidGoodsReceipts.map((receipt) => {
                                                const remaining = getRemainingAmount(receipt);
                                                return (
                                                    <option key={receipt.id} value={receipt.id}>
                                                        {receipt.receipt_number} - {receipt.supplier?.name} - {remaining.toFixed(2)} AZN
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    ) : (
                                        <div className="relative">
                                            <div className="relative">
                                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <input
                                                    type="text"
                                                    value={goodsReceiptSearch}
                                                    onChange={(e) => {
                                                        setGoodsReceiptSearch(e.target.value);
                                                        setShowGoodsReceiptDropdown(true);
                                                    }}
                                                    onFocus={() => setShowGoodsReceiptDropdown(true)}
                                                    placeholder="Mal qəbulu axtar (№, təchizatçı, məhsul)"
                                                    className="mt-1 block w-full pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md shadow-sm"
                                                />
                                            </div>
                                            {showGoodsReceiptDropdown && filteredGoodsReceipts.length > 0 && (
                                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                                    {filteredGoodsReceipts.map((receipt) => {
                                                        const remaining = getRemainingAmount(receipt);
                                                        return (
                                                            <button
                                                                key={receipt.id}
                                                                type="button"
                                                                onClick={() => handleGoodsReceiptSelect(receipt)}
                                                                className="w-full text-left px-4 py-2 hover:bg-blue-50 border-b border-gray-200 last:border-b-0"
                                                            >
                                                                <div className="font-medium text-gray-900">{receipt.receipt_number}</div>
                                                                <div className="text-sm text-gray-600">
                                                                    {receipt.supplier?.name} - {receipt.product?.name}
                                                                </div>
                                                                <div className="text-sm font-semibold text-red-600">
                                                                    Qalıq: {remaining.toFixed(2)} AZN
                                                                    {receipt.payment_status === 'partial' && (
                                                                        <span className="ml-2 text-xs text-yellow-600">(Qismən ödənilib)</span>
                                                                    )}
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Show selected goods receipt info */}
                                    {selectedGoodsReceipt && (
                                        <div className="mt-3 p-3 bg-white rounded border border-blue-300">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="font-medium text-gray-900">
                                                        Seçilmiş: {selectedGoodsReceipt.receipt_number}
                                                    </div>
                                                    <div className="text-sm text-gray-600 mt-1">
                                                        Təchizatçı: {selectedGoodsReceipt.supplier?.name}
                                                    </div>
                                                    <div className="text-sm text-gray-600">
                                                        Məhsul: {selectedGoodsReceipt.product?.name}
                                                    </div>
                                                    <div className="text-sm font-semibold text-red-600 mt-1">
                                                        Qalıq borc: {getRemainingAmount(selectedGoodsReceipt).toFixed(2)} AZN
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setData({ ...data, goods_receipt_id: '', payment_amount: '' })}
                                                    className="text-red-600 hover:text-red-800 text-sm"
                                                >
                                                    Ləğv et
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Supplier Selection */}
                            <div>
                                <InputLabel htmlFor="supplier_id" value="Təchizatçı *" />
                                <select
                                    id="supplier_id"
                                    name="supplier_id"
                                    value={data.supplier_id}
                                    onChange={(e) => setData('supplier_id', e.target.value)}
                                    className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                    required
                                >
                                    <option value="">Təchizatçı seçin</option>
                                    {suppliers.map((supplier) => (
                                        <option key={supplier.id} value={supplier.id}>
                                            {supplier.name}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.supplier_id} className="mt-2" />
                            </div>

                            {/* Amount */}
                            <div>
                                <InputLabel htmlFor="amount" value="Məbləğ (AZN) *" />
                                <TextInput
                                    id="amount"
                                    type="number"
                                    name="amount"
                                    value={data.amount}
                                    className="mt-1 block w-full"
                                    step="0.01"
                                    min="0"
                                    onChange={(e) => {
                                        // Update both amount and payment_amount to stay in sync
                                        setData({
                                            ...data,
                                            amount: e.target.value,
                                            payment_amount: data.goods_receipt_id ? e.target.value : data.payment_amount
                                        });
                                    }}
                                    placeholder="0.00"
                                    required
                                />
                                <InputError message={errors.amount} className="mt-2" />
                            </div>

                            {/* Description */}
                            <div>
                                <InputLabel htmlFor="description" value="Təsvir *" />
                                <TextInput
                                    id="description"
                                    type="text"
                                    name="description"
                                    value={data.description}
                                    className="mt-1 block w-full"
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Ödəniş məqsədi və ya açıqlaması"
                                    required
                                />
                                <InputError message={errors.description} className="mt-2" />
                            </div>

                            {/* Payment Date */}
                            <div>
                                <InputLabel htmlFor="payment_date" value="Ödəniş tarixi *" />
                                <TextInput
                                    id="payment_date"
                                    type="date"
                                    name="payment_date"
                                    value={data.payment_date}
                                    className="mt-1 block w-full"
                                    onChange={(e) => setData('payment_date', e.target.value)}
                                    required
                                />
                                <InputError message={errors.payment_date} className="mt-2" />
                            </div>

                            {/* Payment Method */}
                            <div>
                                <InputLabel htmlFor="payment_method" value="Ödəniş üsulu *" />
                                <select
                                    id="payment_method"
                                    name="payment_method"
                                    value={data.payment_method}
                                    onChange={(e) => setData('payment_method', e.target.value)}
                                    className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                    required
                                >
                                    {Object.entries(paymentMethods).map(([key, value]) => (
                                        <option key={key} value={key}>
                                            {value}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.payment_method} className="mt-2" />
                            </div>


                            {/* Invoice Number */}
                            <div>
                                <InputLabel htmlFor="invoice_number" value="İnvoys nömrəsi" />
                                <TextInput
                                    id="invoice_number"
                                    type="text"
                                    name="invoice_number"
                                    value={data.invoice_number}
                                    className="mt-1 block w-full"
                                    onChange={(e) => setData('invoice_number', e.target.value)}
                                    placeholder="Ödənilən invoys nömrəsi"
                                />
                                <InputError message={errors.invoice_number} className="mt-2" />
                            </div>

                            {/* Notes */}
                            <div>
                                <InputLabel htmlFor="notes" value="Qeydlər" />
                                <textarea
                                    id="notes"
                                    name="notes"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    rows={3}
                                    className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                    placeholder="Əlavə qeydlər (istəyə bağlı)"
                                />
                                <InputError message={errors.notes} className="mt-2" />
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex items-center justify-between pt-4">
                                <SecondaryButton>
                                    <Link href="/supplier-payments">
                                        Ləğv et
                                    </Link>
                                </SecondaryButton>

                                <PrimaryButton
                                    className="ms-4"
                                    disabled={processing}
                                >
                                    {processing ? 'Yadda saxlanılır...' : 'Yadda saxla'}
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}