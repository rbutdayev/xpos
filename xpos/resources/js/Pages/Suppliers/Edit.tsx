import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Supplier, SupplierFormData } from '@/types';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import { useTranslation } from 'react-i18next';

interface Props {
    supplier: Supplier;
}

export default function Edit({ supplier }: Props) {
    const { t } = useTranslation(['suppliers', 'common']);
    const { data, setData, put, processing, errors, reset } = useForm<SupplierFormData>({
        name: supplier.name || '',
        contact_person: supplier.contact_person || '',
        phone: supplier.phone || '',
        email: supplier.email || '',
        address: supplier.address || '',
        tax_number: supplier.tax_number || '',
        bank_account: supplier.bank_account || '',
        bank_name: supplier.bank_name || '',
        payment_terms_days: supplier.payment_terms_days || 0,
        notes: supplier.notes || '',
        is_active: supplier.is_active !== undefined ? supplier.is_active : true,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('suppliers.update', supplier.id));
    };

    return (
        <AuthenticatedLayout>
            <Head title={t('editSupplierTitle', { name: supplier.name })} />

            <div className="px-4 sm:px-6 lg:px-8">
                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                    <div className="p-6 bg-white border-b border-gray-200">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center">
                                <Link
                                    href={route('suppliers.show', supplier.id)}
                                    className="mr-4 text-gray-600 hover:text-gray-900"
                                >
                                    <ArrowLeftIcon className="w-5 h-5" />
                                </Link>
                                <div>
                                    <h2 className="text-2xl font-semibold text-gray-900">
                                        {t('editSupplier')}
                                    </h2>
                                    <p className="text-gray-600">{supplier.name}</p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={submit} className="space-y-6">
                            {/* Basic Information */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    {t('sections.basicInfo')}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <InputLabel htmlFor="name" value={t('fields.supplierName')} />
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
                                        <InputLabel htmlFor="contact_person" value={t('fields.contactPerson')} />
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
                                        <InputLabel htmlFor="phone" value={t('fields.phone')} />
                                        <TextInput
                                            id="phone"
                                            type="tel"
                                            name="phone"
                                            value={data.phone}
                                            className="mt-1 block w-full"
                                            placeholder={t('placeholders.phone')}
                                            onChange={(e) => setData('phone', e.target.value)}
                                        />
                                        <InputError message={errors.phone} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="email" value={t('fields.email')} />
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
                                        <InputLabel htmlFor="tax_number" value={t('fields.taxNumber')} />
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
                                        <InputLabel htmlFor="address" value={t('fields.address')} />
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
                                    {t('sections.bankInfo')}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <InputLabel htmlFor="bank_name" value={t('fields.bankName')} />
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
                                        <InputLabel htmlFor="bank_account" value={t('fields.accountNumber')} />
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
                                    {t('sections.paymentTerms')}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <InputLabel htmlFor="payment_terms_days" value={t('fields.paymentTerms')} />
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
                                            {t('placeholders.paymentTermsHint')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    {t('sections.additionalInfo')}
                                </h3>
                                <div>
                                    <InputLabel htmlFor="notes" value={t('fields.notes')} />
                                    <textarea
                                        id="notes"
                                        name="notes"
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        rows={4}
                                        className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                        placeholder={t('placeholders.notes')}
                                    />
                                    <InputError message={errors.notes} className="mt-2" />
                                </div>
                            </div>

                            {/* Status */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    {t('fields.status')}
                                </h3>
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={data.is_active}
                                        onChange={(e) => setData('is_active', e.target.checked)}
                                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                    />
                                    <span className="ml-2 text-sm text-gray-600">
                                        {t('status.supplierActive')}
                                    </span>
                                </label>
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex items-center justify-end space-x-2 pt-6 border-t border-gray-200">
                                <Link
                                    href={route('suppliers.show', supplier.id)}
                                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    {t('actions.cancel', { ns: 'common' })}
                                </Link>
                                <PrimaryButton className="ml-4" disabled={processing}>
                                    {processing ? t('actions.saving') : t('actions.saveChanges')}
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}