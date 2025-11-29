import { useState, FormEvent, ChangeEvent, useEffect } from 'react';
import { router } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';

interface ExpenseCategory {
    category_id: number;
    name: string;
    parent?: {
        category_id: number;
        name: string;
    };
}

interface Branch {
    id: number;
    name: string;
}

interface SupplierCredit {
    supplier_credit_id: number;
    reference_number: string;
    description: string;
    amount: number;
    remaining_amount: number;
    supplier: {
        id: number;
        name: string;
    };
}

interface PaySupplierCreditModalProps {
    show: boolean;
    onClose: () => void;
    supplierCredit: SupplierCredit | null;
    categories: ExpenseCategory[];
    branches: Branch[];
    paymentMethods: Record<string, string>;
}

export default function PaySupplierCreditModal({
    show,
    onClose,
    supplierCredit,
    categories,
    branches,
    paymentMethods
}: PaySupplierCreditModalProps) {
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Extract receipt number from description (e.g., "Mal qəbulu üçün borc - MQ-2025-000004")
    const extractReceiptNumber = (description: string): string => {
        const match = description.match(/MQ-\d{4}-\d{6}/);
        return match ? match[0] : '';
    };

    const receiptNumber = supplierCredit ? extractReceiptNumber(supplierCredit.description) : '';
    const remainingAmount = supplierCredit?.remaining_amount || 0;

    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        expense_date: new Date().toISOString().split('T')[0],
        category_id: '',
        branch_id: branches.length > 0 ? branches[0].id.toString() : '',
        payment_method: 'nağd',
        receipt_file: null as File | null,
        notes: '',
        supplier_credit_id: null as number | null,
        credit_payment_amount: ''
    });

    // Reset form when modal opens with a new supplier credit
    useEffect(() => {
        if (show && supplierCredit) {
            const receiptNum = extractReceiptNumber(supplierCredit.description);
            setFormData({
                description: `${receiptNum} üçün ödəniş`,
                amount: supplierCredit.remaining_amount.toString(),
                expense_date: new Date().toISOString().split('T')[0],
                category_id: '',
                branch_id: branches.length > 0 ? branches[0].id.toString() : '',
                payment_method: 'nağd',
                receipt_file: null,
                notes: `Təchizatçı krediti: ${supplierCredit.reference_number}`,
                supplier_credit_id: supplierCredit.supplier_credit_id,
                credit_payment_amount: supplierCredit.remaining_amount.toString()
            });
            setErrors({});
        }
    }, [show, supplierCredit, branches]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        const submitData = new FormData();
        submitData.append('description', formData.description);
        submitData.append('amount', formData.amount);
        submitData.append('expense_date', formData.expense_date);
        submitData.append('category_id', formData.category_id);
        submitData.append('branch_id', formData.branch_id);
        submitData.append('payment_method', formData.payment_method);
        submitData.append('notes', formData.notes);

        if (formData.supplier_credit_id) {
            submitData.append('supplier_credit_id', formData.supplier_credit_id.toString());
        }
        if (formData.credit_payment_amount) {
            submitData.append('credit_payment_amount', formData.credit_payment_amount);
        }
        if (formData.receipt_file) {
            submitData.append('receipt_file', formData.receipt_file);
        }

        router.post(route('expenses.store'), submitData, {
            preserveState: true,
            onSuccess: () => {
                onClose();
                router.reload({ only: ['expenses'] });
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
        if (supplierCredit) {
            const fullAmount = supplierCredit.remaining_amount.toString();
            setFormData(prev => ({
                ...prev,
                amount: fullAmount,
                credit_payment_amount: fullAmount
            }));
        }
    };

    if (!supplierCredit) {
        return null;
    }

    return (
        <Modal show={show} onClose={handleClose} maxWidth="2xl">
            <form onSubmit={handleSubmit} className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                    Təchizatçı Kreditinə Ödəniş
                </h2>

                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-600">Qəbul №:</span>
                            <span className="ml-2 font-medium">{receiptNumber || '-'}</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Təchizatçı:</span>
                            <span className="ml-2 font-medium">{supplierCredit.supplier.name}</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Ümumi məbləğ:</span>
                            <span className="ml-2 font-medium">{supplierCredit.amount.toLocaleString('az-AZ')} AZN</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Qalıq borc:</span>
                            <span className="ml-2 font-semibold text-red-600">{remainingAmount.toLocaleString('az-AZ')} AZN</span>
                        </div>
                    </div>
                </div>

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
                            placeholder="Xərcin təsvirini daxil edin"
                            required
                        />
                        <InputError message={errors.description} className="mt-2" />
                    </div>

                    {/* Amount */}
                    <div>
                        <InputLabel htmlFor="amount" value="Məbləğ (AZN) *" />
                        <div className="flex gap-2">
                            <TextInput
                                id="amount"
                                type="number"
                                step="0.01"
                                min="0.01"
                                max={remainingAmount}
                                value={formData.amount}
                                onChange={(e) => {
                                    const newAmount = e.target.value;
                                    setFormData({
                                        ...formData,
                                        amount: newAmount,
                                        credit_payment_amount: newAmount
                                    });
                                }}
                                className="mt-1 block w-full"
                                placeholder="0.00"
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
                        <InputError message={errors.amount} className="mt-2" />
                        {parseFloat(formData.amount) > 0 && (
                            <p className="mt-1 text-xs text-gray-500">
                                {parseFloat(formData.amount) < remainingAmount
                                    ? `Qismən ödəniş. Qalacaq: ${(remainingAmount - parseFloat(formData.amount)).toFixed(2)} AZN`
                                    : 'Tam ödəniş'}
                            </p>
                        )}
                    </div>

                    {/* Expense Date */}
                    <div>
                        <InputLabel htmlFor="expense_date" value="Xərc tarixi *" />
                        <TextInput
                            id="expense_date"
                            type="date"
                            value={formData.expense_date}
                            onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                            className="mt-1 block w-full"
                            required
                        />
                        <InputError message={errors.expense_date} className="mt-2" />
                    </div>

                    {/* Category */}
                    <div>
                        <InputLabel htmlFor="category_id" value="Kateqoriya *" />
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
                                    {category.parent ? `${category.parent.name} > ${category.name}` : category.name}
                                </option>
                            ))}
                        </select>
                        <InputError message={errors.category_id} className="mt-2" />
                    </div>

                    {/* Branch */}
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
                            <option value="">Ödəniş üsulu seçin</option>
                            {Object.entries(paymentMethods).map(([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                        <InputError message={errors.payment_method} className="mt-2" />
                    </div>

                    {/* Receipt File */}
                    <div>
                        <InputLabel htmlFor="receipt_file" value="Qəbz (şəkil)" />
                        <input
                            id="receipt_file"
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => setFormData({ ...formData, receipt_file: e.target.files?.[0] || null })}
                            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        <p className="mt-1 text-sm text-gray-500">
                            Qəbz şəklini və ya PDF faylını yükləyin (İstəyə bağlı)
                        </p>
                        <InputError message={errors.receipt_file} className="mt-2" />
                    </div>

                    {/* Notes */}
                    <div>
                        <InputLabel htmlFor="notes" value="Qeydlər" />
                        <textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, notes: e.target.value })}
                            rows={3}
                            className="mt-1 block w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md shadow-sm"
                            placeholder="Əlavə qeydlər (istəyə bağlı)"
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
