import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { SupplierFormData } from '@/types';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';

export default function Create() {
    const { data, setData, post, processing, errors, reset } = useForm<SupplierFormData>({
        name: '',
        contact_person: '',
        phone: '',
        email: '',
        address: '',
        tax_number: '',
        bank_account: '',
        bank_name: '',
        payment_terms_days: 0,
        notes: '',
        is_active: true,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('suppliers.store'));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Yeni Təchizatçı" />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                    <div className="p-4 sm:p-6 bg-white border-b border-gray-200">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                            <div className="flex items-center">
                                <Link
                                    href={route('suppliers.index')}
                                    className="mr-4 text-gray-600 hover:text-gray-900"
                                >
                                    <ArrowLeftIcon className="w-5 h-5" />
                                </Link>
                                <div>
                                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
                                        Yeni Təchizatçı
                                    </h2>
                                    <p className="text-sm sm:text-base text-gray-600">Təchizatçı məlumatlarını daxil edin</p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={submit} className="space-y-6">
                            {/* Basic Information */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    Əsas Məlumatlar
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <InputLabel htmlFor="name" value="Təchizatçı Adı *" />
                                        <TextInput
                                            id="name"
                                            type="text"
                                            name="name"
                                            value={data.name}
                                            className="mt-1 block w-full"
                                            onChange={(e) => setData('name', e.target.value)}
                                            required
                                        />
                                        <InputError message={errors.name} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="contact_person" value="Əlaqə Şəxsi" />
                                        <TextInput
                                            id="contact_person"
                                            type="text"
                                            name="contact_person"
                                            value={data.contact_person}
                                            className="mt-1 block w-full"
                                            onChange={(e) => setData('contact_person', e.target.value)}
                                        />
                                        <InputError message={errors.contact_person} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="phone" value="Telefon" />
                                        <TextInput
                                            id="phone"
                                            type="tel"
                                            name="phone"
                                            value={data.phone}
                                            className="mt-1 block w-full"
                                            placeholder="+994 XX XXX XX XX"
                                            onChange={(e) => setData('phone', e.target.value)}
                                        />
                                        <InputError message={errors.phone} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="email" value="E-poçt" />
                                        <TextInput
                                            id="email"
                                            type="email"
                                            name="email"
                                            value={data.email}
                                            className="mt-1 block w-full"
                                            onChange={(e) => setData('email', e.target.value)}
                                        />
                                        <InputError message={errors.email} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="tax_number" value="Vergi Nömrəsi" />
                                        <TextInput
                                            id="tax_number"
                                            type="text"
                                            name="tax_number"
                                            value={data.tax_number}
                                            className="mt-1 block w-full"
                                            onChange={(e) => setData('tax_number', e.target.value)}
                                        />
                                        <InputError message={errors.tax_number} className="mt-2" />
                                    </div>

                                    <div className="md:col-span-2">
                                        <InputLabel htmlFor="address" value="Ünvan" />
                                        <textarea
                                            id="address"
                                            name="address"
                                            value={data.address}
                                            onChange={(e) => setData('address', e.target.value)}
                                            rows={3}
                                            className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                        />
                                        <InputError message={errors.address} className="mt-2" />
                                    </div>
                                </div>
                            </div>

                            {/* Bank Information */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    Bank Məlumatları
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <InputLabel htmlFor="bank_name" value="Bank Adı" />
                                        <TextInput
                                            id="bank_name"
                                            type="text"
                                            name="bank_name"
                                            value={data.bank_name}
                                            className="mt-1 block w-full"
                                            onChange={(e) => setData('bank_name', e.target.value)}
                                        />
                                        <InputError message={errors.bank_name} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="bank_account" value="Hesab Nömrəsi" />
                                        <TextInput
                                            id="bank_account"
                                            type="text"
                                            name="bank_account"
                                            value={data.bank_account}
                                            className="mt-1 block w-full"
                                            onChange={(e) => setData('bank_account', e.target.value)}
                                        />
                                        <InputError message={errors.bank_account} className="mt-2" />
                                    </div>
                                </div>
                            </div>

                            {/* Payment Terms */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    Ödəniş Şərtləri
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <InputLabel htmlFor="payment_terms_days" value="Ödəniş Müddəti (gün)" />
                                        <TextInput
                                            id="payment_terms_days"
                                            type="number"
                                            name="payment_terms_days"
                                            value={data.payment_terms_days.toString()}
                                            className="mt-1 block w-full"
                                            min="0"
                                            max="365"
                                            onChange={(e) => setData('payment_terms_days', parseInt(e.target.value) || 0)}
                                        />
                                        <InputError message={errors.payment_terms_days} className="mt-2" />
                                        <p className="mt-1 text-sm text-gray-500">
                                            0 = nağd ödəniş, digər rəqəmlər kredit günləri
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    Əlavə Məlumatlar
                                </h3>
                                <div>
                                    <InputLabel htmlFor="notes" value="Qeydlər" />
                                    <textarea
                                        id="notes"
                                        name="notes"
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        rows={4}
                                        className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                        placeholder="Təchizatçı haqqında əlavə qeydlər..."
                                    />
                                    <InputError message={errors.notes} className="mt-2" />
                                </div>
                            </div>

                            {/* Status */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    Status
                                </h3>
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={data.is_active}
                                        onChange={(e) => setData('is_active', e.target.checked)}
                                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                    />
                                    <span className="ml-2 text-sm text-gray-600">
                                        Təchizatçı aktiv
                                    </span>
                                </label>
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4 pt-6 border-t border-gray-200">
                                <Link
                                    href={route('suppliers.index')}
                                    className="w-full sm:w-auto bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-center"
                                >
                                    Ləğv et
                                </Link>
                                <PrimaryButton className="w-full sm:w-auto" disabled={processing}>
                                    {processing ? 'Yadda saxlanır...' : 'Təchizatçını Yarad'}
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}