import { Head, useForm, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';

interface Expense {
    expense_id: number;
    description: string;
    amount: number;
    expense_date: string;
    category_id: number | null;
    branch_id: number | null;
    payment_method: string | null;
    receipt_file_path: string | null;
    notes: string | null;
}

interface ExpenseCategory {
    id: number;
    name: string;
}

interface Branch {
    id: number;
    name: string;
}

interface Props {
    expense: Expense;
    categories: ExpenseCategory[];
    branches: Branch[];
    paymentMethods: Record<string, string>;
}

interface ExpenseFormData {
    description: string;
    amount: string;
    expense_date: string;
    category_id: string;
    branch_id: string;
    payment_method: string;
    receipt_file?: File | null;
    notes: string;
}

export default function Edit({ expense, categories, branches, paymentMethods }: Props) {
    const { data, setData, put, processing, errors } = useForm<ExpenseFormData>({
        description: expense.description || '',
        amount: expense.amount.toString() || '',
        expense_date: expense.expense_date ? expense.expense_date.split('T')[0] : '',
        category_id: expense.category_id?.toString() || '',
        branch_id: expense.branch_id?.toString() || '',
        payment_method: expense.payment_method || '',
        receipt_file: null,
        notes: expense.notes || '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // For file uploads with PUT, use post with _method override
        if (data.receipt_file) {
            const formData = new FormData();
            formData.append('description', data.description);
            formData.append('amount', data.amount);
            formData.append('expense_date', data.expense_date);
            formData.append('category_id', data.category_id);
            formData.append('branch_id', data.branch_id);
            formData.append('payment_method', data.payment_method);
            formData.append('notes', data.notes);
            formData.append('receipt_file', data.receipt_file);
            formData.append('_method', 'PUT');
            
            router.post(`/expenses/${expense.expense_id}`, formData);
        } else {
            put(`/expenses/${expense.expense_id}`);
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Xərci Düzəliş Et
                    </h2>
                    <Link
                        href="/expenses"
                        className="text-gray-600 hover:text-gray-900"
                    >
                        ← Xərclərə qayıt
                    </Link>
                </div>
            }
        >
            <Head title="Xərci Düzəliş Et" />

            <div className="py-12">
                <div className="mx-auto max-w-2xl sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <form onSubmit={submit} className="p-6 space-y-6">
                            {/* Description */}
                            <div>
                                <InputLabel htmlFor="description" value="Təsvir *" />
                                <TextInput
                                    id="description"
                                    type="text"
                                    name="description"
                                    value={data.description}
                                    className="mt-1 block w-full"
                                    isFocused={true}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Xərcin təsvirini daxil edin"
                                />
                                <InputError message={errors.description} className="mt-2" />
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
                                    onChange={(e) => setData('amount', e.target.value)}
                                    placeholder="0.00"
                                />
                                <InputError message={errors.amount} className="mt-2" />
                            </div>

                            {/* Expense Date */}
                            <div>
                                <InputLabel htmlFor="expense_date" value="Xərc tarixi *" />
                                <TextInput
                                    id="expense_date"
                                    type="date"
                                    name="expense_date"
                                    value={data.expense_date}
                                    className="mt-1 block w-full"
                                    onChange={(e) => setData('expense_date', e.target.value)}
                                />
                                <InputError message={errors.expense_date} className="mt-2" />
                            </div>

                            {/* Category */}
                            <div>
                                <InputLabel htmlFor="category_id" value="Kateqoriya *" />
                                <select
                                    id="category_id"
                                    name="category_id"
                                    value={data.category_id}
                                    onChange={(e) => setData('category_id', e.target.value)}
                                    className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                >
                                    <option value="">Kateqoriya seçin</option>
                                    {(categories || []).map((category) => (
                                        <option key={category.id} value={category.id?.toString() || ''}>
                                            {category.name}
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
                                    name="branch_id"
                                    value={data.branch_id}
                                    onChange={(e) => setData('branch_id', e.target.value)}
                                    className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                >
                                    <option value="">Filial seçin</option>
                                    {(branches || []).map((branch) => (
                                        <option key={branch.id} value={branch.id?.toString() || ''}>
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
                                    name="payment_method"
                                    value={data.payment_method}
                                    onChange={(e) => setData('payment_method', e.target.value)}
                                    className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                >
                                    <option value="">Ödəniş üsulu seçin</option>
                                    {Object.entries(paymentMethods || {}).map(([key, value]) => (
                                        <option key={key} value={key}>
                                            {value}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.payment_method} className="mt-2" />
                            </div>

                            {/* Current Receipt */}
                            {expense.receipt_file_path && (
                                <div>
                                    <InputLabel value="Cari qəbz" />
                                    <div className="mt-1 p-3 bg-gray-50 rounded-md">
                                        <a 
                                            href={`/storage/${expense.receipt_file_path}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800 text-sm"
                                        >
                                            Qəbzi görüntülə
                                        </a>
                                    </div>
                                </div>
                            )}

                            {/* Receipt File */}
                            <div>
                                <InputLabel htmlFor="receipt_file" value="Yeni qəbz (şəkil)" />
                                <input
                                    id="receipt_file"
                                    type="file"
                                    name="receipt_file"
                                    accept="image/*,.pdf"
                                    onChange={(e) => setData('receipt_file', e.target.files?.[0] || null)}
                                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />
                                <p className="mt-1 text-sm text-gray-500">
                                    Yeni qəbz yükləmək istəyirsinizsə seçin (Köhnəsini əvəz edəcək)
                                </p>
                                <InputError message={errors.receipt_file} className="mt-2" />
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
                                    <Link href="/expenses">
                                        Ləğv et
                                    </Link>
                                </SecondaryButton>

                                <PrimaryButton
                                    className="ms-4"
                                    disabled={processing}
                                >
                                    {processing ? 'Yenilənir...' : 'Yenilə'}
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}