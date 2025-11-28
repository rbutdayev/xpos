import { Head, useForm, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';

interface Supplier {
    id: number;
    name: string;
    company: string | null;
}

interface SupplierPayment {
    payment_id: number;
    supplier_id: number;
    amount: number;
    description: string;
    payment_date: string;
    payment_method: string;
    reference_number: string | null;
    invoice_number: string | null;
    notes: string | null;
    supplier: Supplier;
}

interface Props {
    payment: SupplierPayment;
    suppliers: Supplier[];
    paymentMethods: Record<string, string>;
}

interface PaymentFormData {
    supplier_id: number;
    amount: string;
    description: string;
    payment_date: string;
    payment_method: string;
    invoice_number: string;
    notes: string;
}

export default function Edit({ payment, suppliers, paymentMethods }: Props) {
    // Format the payment date for HTML date input (YYYY-MM-DD)
    const formatDateForInput = (dateString: string) => {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    };

    const { data, setData, put, processing, errors } = useForm<PaymentFormData>({
        supplier_id: payment.supplier_id,
        amount: payment.amount.toString(),
        description: payment.description,
        payment_date: formatDateForInput(payment.payment_date),
        payment_method: payment.payment_method,
        invoice_number: payment.invoice_number || '',
        notes: payment.notes || '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('supplier-payments.update', payment.payment_id));
    };

    return (
        <AuthenticatedLayout
        >
            <Head title={`Redaktə Et - ${payment.supplier.name}`} />

            <div className="py-12">
                <div className="mx-auto max-w-2xl sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <form onSubmit={submit} className="p-6 space-y-6">
                            {/* Supplier Selection */}
                            <div>
                                <InputLabel htmlFor="supplier_id" value="Təchizatçı *" />
                                <select
                                    id="supplier_id"
                                    name="supplier_id"
                                    value={data.supplier_id}
                                    onChange={(e) => setData('supplier_id', parseInt(e.target.value))}
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
                                    onChange={(e) => setData('amount', e.target.value)}
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