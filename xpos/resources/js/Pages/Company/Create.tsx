import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';

interface CompanyFormData {
    name: string;
    address: string;
    tax_number: string;
    phone: string;
    email: string;
    website: string;
    description: string;
    default_language: string;
}

export default function Create() {
    const { data, setData, post, processing, errors, reset } = useForm<CompanyFormData>({
        name: '',
        address: '',
        tax_number: '',
        phone: '',
        email: '',
        website: '',
        description: '',
        default_language: 'az',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('companies.store'));
    };

    const languageOptions = [
        { value: 'az', label: 'Azərbaycan dili' },
        { value: 'en', label: 'English' },
        { value: 'tr', label: 'Türkçe' }
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Yeni Şirkət" />

            <div className="px-4 sm:px-6 lg:px-8">
                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                    <div className="p-4 sm:p-6 bg-white border-b border-gray-200">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                            <div className="flex items-center">
                                <Link
                                    href={route('companies.index')}
                                    className="mr-4 text-gray-600 hover:text-gray-900"
                                >
                                    <ArrowLeftIcon className="w-5 h-5" />
                                </Link>
                                <div>
                                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
                                        Yeni Şirkət
                                    </h2>
                                    <p className="text-sm sm:text-base text-gray-600">Şirkət məlumatlarını daxil edin</p>
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
                                        <InputLabel htmlFor="name" value="Şirkət Adı *" />
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
                                        <InputLabel htmlFor="tax_number" value="VOEN" />
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

                                    <div>
                                        <InputLabel htmlFor="default_language" value="Varsayılan Dil *" />
                                        <select
                                            id="default_language"
                                            name="default_language"
                                            value={data.default_language}
                                            onChange={(e) => setData('default_language', e.target.value)}
                                            className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                            required
                                        >
                                            {languageOptions.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError message={errors.default_language} className="mt-2" />
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

                            {/* Contact Information */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    Əlaqə Məlumatları
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                                    <div className="md:col-span-2">
                                        <InputLabel htmlFor="website" value="Veb Sayt" />
                                        <TextInput
                                            id="website"
                                            type="url"
                                            name="website"
                                            value={data.website}
                                            className="mt-1 block w-full"
                                            placeholder="https://example.com"
                                            onChange={(e) => setData('website', e.target.value)}
                                        />
                                        <InputError message={errors.website} className="mt-2" />
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    Əlavə Məlumatlar
                                </h3>
                                <div>
                                    <InputLabel htmlFor="description" value="Təsvir" />
                                    <textarea
                                        id="description"
                                        name="description"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        rows={4}
                                        className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                        placeholder="Şirkət haqqında əlavə məlumatlar..."
                                    />
                                    <InputError message={errors.description} className="mt-2" />
                                </div>
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4 pt-6 border-t border-gray-200">
                                <Link
                                    href={route('companies.index')}
                                    className="w-full sm:w-auto bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-center"
                                >
                                    Ləğv et
                                </Link>
                                <PrimaryButton className="w-full sm:w-auto" disabled={processing}>
                                    {processing ? 'Yadda saxlanır...' : 'Şirkəti Yarad'}
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}