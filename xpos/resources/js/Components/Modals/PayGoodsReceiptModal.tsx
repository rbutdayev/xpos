import { useState, FormEvent, ChangeEvent } from 'react';
import { router } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { GoodsReceipt } from '@/types';

interface PayGoodsReceiptModalProps {
    show: boolean;
    onClose: () => void;
    goodsReceipt: GoodsReceipt;
    categories: Array<{ category_id: number; name: string; }>;
    branches: Array<{ id: number; name: string; }>;
    paymentMethods: Record<string, string>;
}

export default function PayGoodsReceiptModal({
    show,
    onClose,
    goodsReceipt,
    categories,
    branches,
    paymentMethods
}: PayGoodsReceiptModalProps) {
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const remainingAmount = parseFloat(String(goodsReceipt.supplier_credit?.remaining_amount || goodsReceipt.total_cost || 0));

    const [formData, setFormData] = useState({
        goods_receipt_id: goodsReceipt.id,
        payment_amount: remainingAmount,
        category_id: '',
        branch_id: '',
        payment_method: 'nağd',
        notes: ''
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        router.post(route('expenses.pay-goods-receipt'), formData, {
            preserveState: true,
            onSuccess: (page) => {
                onClose();
                // Reload the page to show updated data
                router.reload({ only: ['receipts'] });
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

    const setPaymentToFull = () => {
        setFormData(prev => ({
            ...prev,
            payment_amount: remainingAmount
        }));
    };

    return (
        <Modal show={show} onClose={handleClose} maxWidth="2xl">
            <form onSubmit={handleSubmit} className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                    Mal Qəbulu Ödəməsi
                </h2>

                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-600">Qəbul №:</span>
                            <span className="ml-2 font-medium">{goodsReceipt.receipt_number}</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Təchizatçı:</span>
                            <span className="ml-2 font-medium">{goodsReceipt.supplier?.name || '-'}</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Ümumi məbləğ:</span>
                            <span className="ml-2 font-medium">{parseFloat(String(goodsReceipt.total_cost || 0)).toFixed(2)} AZN</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Qalıq borc:</span>
                            <span className="ml-2 font-semibold text-red-600">{remainingAmount.toFixed(2)} AZN</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <InputLabel htmlFor="payment_amount" value="Ödəniş məbləği *" />
                        <div className="flex gap-2">
                            <TextInput
                                id="payment_amount"
                                type="number"
                                step="0.01"
                                min="0.01"
                                max={remainingAmount}
                                value={formData.payment_amount}
                                onChange={(e) => setFormData({ ...formData, payment_amount: parseFloat(e.target.value) || 0 })}
                                className="mt-1 block w-full"
                                required
                            />
                            <SecondaryButton
                                type="button"
                                onClick={setPaymentToFull}
                                className="mt-1 whitespace-nowrap"
                            >
                                Tam ödə
                            </SecondaryButton>
                        </div>
                        <InputError message={errors.payment_amount} className="mt-2" />
                        <p className="mt-1 text-xs text-gray-500">
                            {formData.payment_amount < remainingAmount
                                ? `Qismən ödəniş. Qalacaq: ${(remainingAmount - formData.payment_amount).toFixed(2)} AZN`
                                : 'Tam ödəniş'}
                        </p>
                    </div>

                    <div>
                        <InputLabel htmlFor="category_id" value="Xerc kateqoriyası *" />
                        <select
                            id="category_id"
                            value={formData.category_id}
                            onChange={(e: ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, category_id: e.target.value })}
                            className="mt-1 block w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md shadow-sm"
                            required
                        >
                            <option value="">Kateqoriya seçin</option>
                            {categories.map((category) => (
                                <option key={category.category_id} value={category.category_id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                        <InputError message={errors.category_id} className="mt-2" />
                    </div>

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

                    <div>
                        <InputLabel htmlFor="payment_method" value="Ödəniş metodu *" />
                        <select
                            id="payment_method"
                            value={formData.payment_method}
                            onChange={(e: ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, payment_method: e.target.value })}
                            className="mt-1 block w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md shadow-sm"
                            required
                        >
                            {Object.entries(paymentMethods).map(([key, label]) => (
                                <option key={key} value={key}>
                                    {label}
                                </option>
                            ))}
                        </select>
                        <InputError message={errors.payment_method} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="notes" value="Qeydlər" />
                        <textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, notes: e.target.value })}
                            className="mt-1 block w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md shadow-sm"
                            rows={3}
                            maxLength={1000}
                        />
                        <InputError message={errors.notes} className="mt-2" />
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
                        {processing ? 'Ödənir...' : 'Ödə'}
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
