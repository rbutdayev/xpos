import { Head, useForm, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
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
    location?: string;
}

interface Props {
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

export default function Create({ categories, branches, paymentMethods }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm<ExpenseFormData>({
        description: '',
        amount: '',
        expense_date: new Date().toISOString().split('T')[0],
        category_id: '',
        branch_id: '',
        payment_method: '',
        receipt_file: null,
        notes: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/expenses');
    };

    return (
        <AuthenticatedLayout
        >
            <Head title="Yeni Xərc" />

            <div className="py-12">
                <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <form onSubmit={submit} className="p-4 sm:p-6 space-y-6">
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
                                    name="branch_id"
                                    value={data.branch_id}
                                    onChange={(e) => setData('branch_id', e.target.value)}
                                    className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
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
                                    name="payment_method"
                                    value={data.payment_method}
                                    onChange={(e) => setData('payment_method', e.target.value)}
                                    className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
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
                                    name="receipt_file"
                                    accept="image/*,.pdf"
                                    onChange={(e) => setData('receipt_file', e.target.files?.[0] || null)}
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
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 pt-4">
                                <SecondaryButton className="w-full sm:w-auto">
                                    <Link href="/expenses">
                                        Ləğv et
                                    </Link>
                                </SecondaryButton>

                                <PrimaryButton
                                    className="w-full sm:w-auto"
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