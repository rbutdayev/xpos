import { Head, useForm, Link } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { TruckIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { GoodsReceipt, SupplierCredit } from '@/types';

interface Supplier {
    id: number;
    name: string;
    company: string | null;
}

interface Branch {
    id: number;
    name: string;
}

interface ExpenseCategory {
    category_id: number;
    name: string;
}

interface Props {
    suppliers: Supplier[];
    paymentMethods: Record<string, string>;
    unpaidGoodsReceipts: GoodsReceipt[];
    branches: Branch[];
    categories: ExpenseCategory[];
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
    branch_id: string;
    category_id: string;
}

export default function Create({ suppliers, paymentMethods, unpaidGoodsReceipts, branches, categories }: Props) {
    const { t } = useTranslation(['suppliers', 'common']);
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
        branch_id: branches.length > 0 ? branches[0].id.toString() : '',
        category_id: '',
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
            description: t('payments.goodsReceipt.paymentFor', { reference: receipt.receipt_number }),
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
        >
            <Head title={t('payments.newPayment')} />

            <div className="py-12">
                <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <form onSubmit={submit} className="p-4 sm:p-6 space-y-6">
                            {/* Goods Receipt Selector */}
                            {unpaidGoodsReceipts && unpaidGoodsReceipts.length > 0 && (
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                    <InputLabel htmlFor="goods_receipt" value={t('payments.goodsReceipt.label')} className="text-blue-900" />
                                    <p className="text-sm text-blue-700 mt-1 mb-3">
                                        {t('payments.goodsReceipt.helpText')}
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
                                            <option value="">{t('payments.goodsReceipt.select')}</option>
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
                                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                                                <input
                                                    type="text"
                                                    value={goodsReceiptSearch}
                                                    onChange={(e) => {
                                                        setGoodsReceiptSearch(e.target.value);
                                                        setShowGoodsReceiptDropdown(true);
                                                    }}
                                                    onFocus={() => setShowGoodsReceiptDropdown(true)}
                                                    placeholder={t('payments.goodsReceipt.search')}
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
                                                                    {t('payments.goodsReceipt.remaining')}: {remaining.toFixed(2)} AZN
                                                                    {receipt.payment_status === 'partial' && (
                                                                        <span className="ml-2 text-xs text-yellow-600">{t('payments.goodsReceipt.partiallyPaid')}</span>
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
                                                        {t('payments.goodsReceipt.selected', { number: selectedGoodsReceipt.receipt_number })}
                                                    </div>
                                                    <div className="text-sm text-gray-600 mt-1">
                                                        {t('payments.fields.supplier')}: {selectedGoodsReceipt.supplier?.name}
                                                    </div>
                                                    <div className="text-sm text-gray-600">
                                                        {t('labels.product')}: {selectedGoodsReceipt.product?.name}
                                                    </div>
                                                    <div className="text-sm font-semibold text-red-600 mt-1">
                                                        {t('payments.goodsReceipt.debt', { amount: getRemainingAmount(selectedGoodsReceipt).toFixed(2) })}
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setData({ ...data, goods_receipt_id: '', payment_amount: '' })}
                                                    className="text-red-600 hover:text-red-800 text-sm"
                                                >
                                                    {t('payments.goodsReceipt.cancel')}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Supplier Selection */}
                            <div>
                                <InputLabel htmlFor="supplier_id" value={t('payments.fields.supplier') + ' *'} />
                                <select
                                    id="supplier_id"
                                    name="supplier_id"
                                    value={data.supplier_id}
                                    onChange={(e) => setData('supplier_id', e.target.value)}
                                    className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                    required
                                >
                                    <option value="">{t('payments.placeholders.selectSupplier')}</option>
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
                                <InputLabel htmlFor="amount" value={t('payments.fields.amount') + ' *'} />
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
                                    placeholder={t('payments.placeholders.amount')}
                                    required
                                />
                                <InputError message={errors.amount} className="mt-2" />
                            </div>

                            {/* Description */}
                            <div>
                                <InputLabel htmlFor="description" value={t('payments.fields.description') + ' *'} />
                                <TextInput
                                    id="description"
                                    type="text"
                                    name="description"
                                    value={data.description}
                                    className="mt-1 block w-full"
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder={t('payments.placeholders.description')}
                                    required
                                />
                                <InputError message={errors.description} className="mt-2" />
                            </div>

                            {/* Payment Date */}
                            <div>
                                <InputLabel htmlFor="payment_date" value={t('payments.fields.paymentDate') + ' *'} />
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
                                <InputLabel htmlFor="payment_method" value={t('payments.fields.paymentMethod') + ' *'} />
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

                            {/* Branch Selection */}
                            <div>
                                <InputLabel htmlFor="branch_id" value={t('payments.fields.branch') + ' *'} />
                                <select
                                    id="branch_id"
                                    name="branch_id"
                                    value={data.branch_id}
                                    onChange={(e) => setData('branch_id', e.target.value)}
                                    className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                    required
                                >
                                    <option value="">{t('payments.placeholders.selectBranch')}</option>
                                    {branches.map((branch) => (
                                        <option key={branch.id} value={branch.id}>
                                            {branch.name}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.branch_id} className="mt-2" />
                            </div>

                            {/* Category Selection */}
                            <div>
                                <InputLabel htmlFor="category_id" value={t('payments.fields.category')} />
                                <select
                                    id="category_id"
                                    name="category_id"
                                    value={data.category_id}
                                    onChange={(e) => setData('category_id', e.target.value)}
                                    className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                >
                                    <option value="">{t('payments.placeholders.selectCategory')}</option>
                                    {categories.map((category) => (
                                        <option key={category.category_id} value={category.category_id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.category_id} className="mt-2" />
                            </div>

                            {/* Invoice Number */}
                            <div>
                                <InputLabel htmlFor="invoice_number" value={t('payments.fields.invoiceNumber')} />
                                <TextInput
                                    id="invoice_number"
                                    type="text"
                                    name="invoice_number"
                                    value={data.invoice_number}
                                    className="mt-1 block w-full"
                                    onChange={(e) => setData('invoice_number', e.target.value)}
                                    placeholder={t('payments.placeholders.invoiceNumber')}
                                />
                                <InputError message={errors.invoice_number} className="mt-2" />
                            </div>

                            {/* Notes */}
                            <div>
                                <InputLabel htmlFor="notes" value={t('payments.fields.notes')} />
                                <textarea
                                    id="notes"
                                    name="notes"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    rows={3}
                                    className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                    placeholder={t('payments.placeholders.notes')}
                                />
                                <InputError message={errors.notes} className="mt-2" />
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4 pt-4">
                                <SecondaryButton className="w-full sm:w-auto">
                                    <Link href="/supplier-payments">
                                        {t('payments.actions.cancel')}
                                    </Link>
                                </SecondaryButton>

                                <PrimaryButton
                                    className="w-full sm:w-auto"
                                    disabled={processing}
                                >
                                    {processing ? t('payments.actions.saving') : t('payments.actions.save')}
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}