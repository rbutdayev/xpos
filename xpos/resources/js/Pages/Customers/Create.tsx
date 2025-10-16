import { Head, useForm, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { CustomerFormData } from '@/types';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';

export default function Create() {
    const { data, setData, post, processing, errors, reset } = useForm<CustomerFormData>({
        name: '',
        phone: '',
        email: '',
        address: '',
        customer_type: 'individual',
        tax_number: '',
        notes: '',
        is_active: true,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/customers');
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Yeni Müştəri
                    </h2>
                    <Link
                        href="/customers"
                        className="text-gray-600 hover:text-gray-900"
                    >
                        ← Müştərilərə qayıt
                    </Link>
                </div>
            }
        >
            <Head title="Yeni Müştəri" />

            <div className="py-12">
                <div className="mx-auto max-w-2xl sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <form onSubmit={submit} className="p-6 space-y-6">
                            {/* Customer Name */}
                            <div>
                                <InputLabel htmlFor="name" value="Müştəri adı *" />
                                <TextInput
                                    id="name"
                                    type="text"
                                    name="name"
                                    value={data.name}
                                    className="mt-1 block w-full"
                                    autoComplete="name"
                                    isFocused={true}
                                    onChange={(e) => setData('name', e.target.value)}
                                />
                                <InputError message={errors.name} className="mt-2" />
                            </div>

                            {/* Customer Type */}
                            <div>
                                <InputLabel htmlFor="customer_type" value="Müştəri növü *" />
                                <select
                                    id="customer_type"
                                    name="customer_type"
                                    value={data.customer_type}
                                    onChange={(e) => setData('customer_type', e.target.value as 'individual' | 'corporate')}
                                    className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                >
                                    <option value="individual">Fiziki şəxs</option>
                                    <option value="corporate">Hüquqi şəxs</option>
                                </select>
                                <InputError message={errors.customer_type} className="mt-2" />
                            </div>

                            {/* Phone */}
                            <div>
                                <InputLabel htmlFor="phone" value="Telefon" />
                                <TextInput
                                    id="phone"
                                    type="tel"
                                    name="phone"
                                    value={data.phone}
                                    className="mt-1 block w-full"
                                    placeholder="+994501234567"
                                    onChange={(e) => setData('phone', e.target.value)}
                                />
                                <InputError message={errors.phone} className="mt-2" />
                                <p className="mt-1 text-sm text-gray-500">
                                    Məsələn: +994501234567
                                </p>
                            </div>

                            {/* Email */}
                            <div>
                                <InputLabel htmlFor="email" value="E-poçt" />
                                <TextInput
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    className="mt-1 block w-full"
                                    autoComplete="email"
                                    onChange={(e) => setData('email', e.target.value)}
                                />
                                <InputError message={errors.email} className="mt-2" />
                            </div>

                            {/* Tax Number (only for corporate) */}
                            {data.customer_type === 'corporate' && (
                                <div>
                                    <InputLabel htmlFor="tax_number" value="VÖEN" />
                                    <TextInput
                                        id="tax_number"
                                        type="text"
                                        name="tax_number"
                                        value={data.tax_number}
                                        className="mt-1 block w-full"
                                        placeholder="1234567890"
                                        onChange={(e) => setData('tax_number', e.target.value)}
                                    />
                                    <InputError message={errors.tax_number} className="mt-2" />
                                </div>
                            )}

                            {/* Address */}
                            <div>
                                <InputLabel htmlFor="address" value="Ünvan" />
                                <textarea
                                    id="address"
                                    name="address"
                                    value={data.address}
                                    onChange={(e) => setData('address', e.target.value)}
                                    rows={3}
                                    className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                    placeholder="Müştərinin ünvanı..."
                                />
                                <InputError message={errors.address} className="mt-2" />
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
                                    placeholder="Əlavə məlumatlar..."
                                />
                                <InputError message={errors.notes} className="mt-2" />
                            </div>

                            {/* Status */}
                            <div>
                                <div className="flex items-center">
                                    <input
                                        id="is_active"
                                        name="is_active"
                                        type="checkbox"
                                        checked={data.is_active}
                                        onChange={(e) => setData('is_active', e.target.checked)}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                    />
                                    <InputLabel htmlFor="is_active" value="Aktiv müştəri" className="ml-2" />
                                </div>
                                <InputError message={errors.is_active} className="mt-2" />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-end space-x-4 pt-6 border-t">
                                <SecondaryButton type="button" onClick={() => reset()}>
                                    Sıfırla
                                </SecondaryButton>
                                <Link href="/customers">
                                    <SecondaryButton type="button">
                                        Ləğv et
                                    </SecondaryButton>
                                </Link>
                                <PrimaryButton disabled={processing}>
                                    {processing ? 'Yadda saxlanır...' : 'Yadda saxla'}
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>

                    {/* Help Text */}
                    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-blue-900 mb-2">Məlumat</h3>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>• Müştəri adı və növü mütləq sahələrdir</li>
                            <li>• Telefon nömrəsini beynəlxalq formatda daxil edin (+994...)</li>
                            <li>• Hüquqi şəxslər üçün VÖEN məcburidir</li>
                            <li>• Müştəri yaradıldıqdan sonra ona nəqliyyat vasitələri əlavə edə bilərsiniz</li>
                        </ul>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}