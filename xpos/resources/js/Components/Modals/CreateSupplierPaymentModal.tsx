import { useState, FormEvent, ChangeEvent, useEffect, useMemo } from 'react';
import { router } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { GoodsReceipt } from '@/types';

interface Supplier {
    id: number;
    name: string;
    company?: string | null;
}

interface Branch {
    id: number;
    name: string;
}

interface ExpenseCategory {
    category_id: number;
    name: string;
}

interface CreateSupplierPaymentModalProps {
    show: boolean;
    onClose: () => void;
    suppliers: Supplier[];
    paymentMethods: Record<string, string>;
    unpaidGoodsReceipts: GoodsReceipt[];
    branches: Branch[];
    categories: ExpenseCategory[];
}

export default function CreateSupplierPaymentModal({
    show,
    onClose,
    suppliers,
    paymentMethods,
    unpaidGoodsReceipts,
    branches,
    categories
}: CreateSupplierPaymentModalProps) {
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [goodsReceiptSearch, setGoodsReceiptSearch] = useState('');
    const [showGoodsReceiptDropdown, setShowGoodsReceiptDropdown] = useState(false);

    const [formData, setFormData] = useState({
        supplier_id: '',
        amount: '',
        description: '',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'cash',
        invoice_number: '',
        notes: '',
        goods_receipt_id: '',
        payment_amount: '',
        branch_id: branches.length > 0 ? branches[0].id.toString() : '',
        category_id: '',
    });

    // Reset form when modal opens
    useEffect(() => {
        if (show) {
            setFormData({
                supplier_id: '',
                amount: '',
                description: '',
                payment_date: new Date().toISOString().split('T')[0],
                payment_method: 'cash',
                invoice_number: '',
                notes: '',
                goods_receipt_id: '',
                payment_amount: '',
                branch_id: branches.length > 0 ? branches[0].id.toString() : '',
                category_id: '',
            });
            setGoodsReceiptSearch('');
            setShowGoodsReceiptDropdown(false);
            setErrors({});
        }
    }, [show, branches]);

    const filteredGoodsReceipts = useMemo(() => {
        if (!goodsReceiptSearch) return unpaidGoodsReceipts;
        const search = goodsReceiptSearch.toLowerCase();
        return unpaidGoodsReceipts.filter(gr =>
            gr.receipt_number.toLowerCase().includes(search) ||
            gr.supplier?.name.toLowerCase().includes(search) ||
            gr.product?.name.toLowerCase().includes(search)
        );
    }, [goodsReceiptSearch, unpaidGoodsReceipts]);

    const selectedGoodsReceipt = unpaidGoodsReceipts.find(gr => gr.id === Number(formData.goods_receipt_id));

    // Helper function to safely get numeric value
    const getRemainingAmount = (receipt: GoodsReceipt): number => {
        const remaining = receipt.supplier_credit?.remaining_amount ?? receipt.total_cost ?? 0;
        return typeof remaining === 'number' ? remaining : Number(remaining) || 0;
    };

    const handleGoodsReceiptSelect = (receipt: GoodsReceipt) => {
        const remainingAmount = getRemainingAmount(receipt);
        setFormData({
            ...formData,
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

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        router.post(route('expenses.pay-goods-receipt'), formData, {
            preserveState: true,
            onSuccess: () => {
                onClose();
            },
            onError: (errors: any) => {
                setErrors(errors);
            },
            onFinish: () => {
                setProcessing(false);
            }
        });
    };

    const handleClose = () => {
        if (!processing) {
            setErrors({});
            onClose();
        }
    };

    return (
        <Modal show={show} onClose={handleClose} maxWidth="5xl">
            <form onSubmit={handleSubmit} className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                    Yeni Təchizatçı Ödənişi
                </h2>

                <div className="space-y-4">
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
                                    value={formData.goods_receipt_id}
                                    onChange={(e: ChangeEvent<HTMLSelectElement>) => {
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
                                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
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
                                            onClick={() => setFormData({ ...formData, goods_receipt_id: '', payment_amount: '' })}
                                            className="text-red-600 hover:text-red-800 text-sm"
                                        >
                                            Ləğv et
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Two-column grid layout for form fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Left Column */}
                        <div className="space-y-4">
                            {/* Supplier Selection */}
                            <div>
                                <InputLabel htmlFor="supplier_id" value="Təchizatçı *" />
                                <select
                                    id="supplier_id"
                                    value={formData.supplier_id}
                                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, supplier_id: e.target.value })}
                                    className="mt-1 block w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md shadow-sm"
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
                                    step="0.01"
                                    min="0"
                                    value={formData.amount}
                                    onChange={(e) => {
                                        setFormData({
                                            ...formData,
                                            amount: e.target.value,
                                            payment_amount: formData.goods_receipt_id ? e.target.value : formData.payment_amount
                                        });
                                    }}
                                    className="mt-1 block w-full"
                                    placeholder="0.00"
                                    required
                                />
                                <InputError message={errors.amount} className="mt-2" />
                            </div>

                            {/* Payment Date */}
                            <div>
                                <InputLabel htmlFor="payment_date" value="Ödəniş tarixi *" />
                                <TextInput
                                    id="payment_date"
                                    type="date"
                                    value={formData.payment_date}
                                    onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                                    className="mt-1 block w-full"
                                    required
                                />
                                <InputError message={errors.payment_date} className="mt-2" />
                            </div>

                            {/* Payment Method */}
                            <div>
                                <InputLabel htmlFor="payment_method" value="Ödəniş üsulu *" />
                                <select
                                    id="payment_method"
                                    value={formData.payment_method}
                                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, payment_method: e.target.value })}
                                    className="mt-1 block w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md shadow-sm"
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
                                    value={formData.invoice_number}
                                    onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                                    className="mt-1 block w-full"
                                    placeholder="Ödənilən invoys nömrəsi"
                                />
                                <InputError message={errors.invoice_number} className="mt-2" />
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-4">
                            {/* Description */}
                            <div>
                                <InputLabel htmlFor="description" value="Təsvir *" />
                                <TextInput
                                    id="description"
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="mt-1 block w-full"
                                    placeholder="Ödəniş məqsədi və ya açıqlaması"
                                    required
                                />
                                <InputError message={errors.description} className="mt-2" />
                            </div>

                            {/* Branch Selection */}
                            <div>
                                <InputLabel htmlFor="branch_id" value="Filial *" />
                                <select
                                    id="branch_id"
                                    value={formData.branch_id}
                                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, branch_id: e.target.value })}
                                    className="mt-1 block w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md shadow-sm"
                                    required
                                >
                                    <option value="">Filial seçin</option>
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
                                <InputLabel htmlFor="category_id" value="Xərc kateqoriyası" />
                                <select
                                    id="category_id"
                                    value={formData.category_id}
                                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, category_id: e.target.value })}
                                    className="mt-1 block w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md shadow-sm"
                                >
                                    <option value="">Kateqoriya seçin (istəyə bağlı)</option>
                                    {categories.map((category) => (
                                        <option key={category.category_id} value={category.category_id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.category_id} className="mt-2" />
                            </div>

                            {/* Notes */}
                            <div>
                                <InputLabel htmlFor="notes" value="Qeydlər" />
                                <textarea
                                    id="notes"
                                    value={formData.notes}
                                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, notes: e.target.value })}
                                    rows={5}
                                    className="mt-1 block w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md shadow-sm"
                                    placeholder="Əlavə qeydlər (istəyə bağlı)"
                                />
                                <InputError message={errors.notes} className="mt-2" />
                            </div>
                        </div>
                    </div>

                    {errors.message && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                            {errors.message}
                        </div>
                    )}
                </div>

                <div className="mt-6 flex items-center justify-end gap-3">
                    <SecondaryButton type="button" onClick={handleClose} disabled={processing}>
                        Ləğv et
                    </SecondaryButton>
                    <PrimaryButton type="submit" disabled={processing}>
                        {processing ? 'Yadda saxlanılır...' : 'Yadda saxla'}
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
