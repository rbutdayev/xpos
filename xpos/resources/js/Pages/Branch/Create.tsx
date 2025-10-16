import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Checkbox from '@/Components/Checkbox';
import { BuildingOffice2Icon } from '@heroicons/react/24/outline';
import { Link } from '@inertiajs/react';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        address: '',
        phone: '',
        email: '',
        is_main: false,
        latitude: '',
        longitude: '',
        description: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('branches.store'));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Yeni Filial" />

            <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center mb-2">
                        <BuildingOffice2Icon className="w-8 h-8 text-blue-600 mr-3" />
                        <h1 className="text-3xl font-bold text-gray-900">Yeni Filial</h1>
                    </div>
                    <p className="text-gray-600">Yeni filial yaradın və məlumatları doldurUN</p>
                </div>

                {/* Form */}
                <div className="bg-white shadow-sm sm:rounded-lg">
                    <form onSubmit={submit} className="p-6 space-y-6">
                        {/* Basic Information */}
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 mb-4">
                                Əsas Məlumatlar
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <InputLabel htmlFor="name" value="Filial Adı *" />
                                    <TextInput
                                        id="name"
                                        type="text"
                                        className="mt-1 block w-full"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        required
                                        autoFocus
                                        placeholder="Məsələn: Mərkəzi Filial"
                                    />
                                    <InputError message={errors.name} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="phone" value="Telefon" />
                                    <TextInput
                                        id="phone"
                                        type="tel"
                                        className="mt-1 block w-full"
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        placeholder="+994 XX XXX XX XX"
                                    />
                                    <InputError message={errors.phone} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="email" value="E-poçt" />
                                    <TextInput
                                        id="email"
                                        type="email"
                                        className="mt-1 block w-full"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="filial@sirket.az"
                                    />
                                    <InputError message={errors.email} className="mt-2" />
                                </div>

                                <div className="flex items-center">
                                    <Checkbox
                                        id="is_main"
                                        checked={data.is_main}
                                        onChange={(e) => setData('is_main', e.target.checked)}
                                    />
                                    <InputLabel htmlFor="is_main" value="Əsas Filial" className="ml-2" />
                                    <InputError message={errors.is_main} className="mt-2" />
                                </div>
                            </div>
                        </div>

                        {/* Address Information */}
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 mb-4">
                                Ünvan Məlumatları
                            </h3>
                            
                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <InputLabel htmlFor="address" value="Ünvan" />
                                    <textarea
                                        id="address"
                                        className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                        value={data.address}
                                        onChange={(e) => setData('address', e.target.value)}
                                        rows={3}
                                        placeholder="Filialın tam ünvanını daxil edin"
                                    />
                                    <InputError message={errors.address} className="mt-2" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <InputLabel htmlFor="latitude" value="Enlik (Latitude)" />
                                        <TextInput
                                            id="latitude"
                                            type="number"
                                            step="any"
                                            className="mt-1 block w-full"
                                            value={data.latitude}
                                            onChange={(e) => setData('latitude', e.target.value)}
                                            placeholder="40.4093"
                                        />
                                        <InputError message={errors.latitude} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="longitude" value="Uzunluq (Longitude)" />
                                        <TextInput
                                            id="longitude"
                                            type="number"
                                            step="any"
                                            className="mt-1 block w-full"
                                            value={data.longitude}
                                            onChange={(e) => setData('longitude', e.target.value)}
                                            placeholder="49.8671"
                                        />
                                        <InputError message={errors.longitude} className="mt-2" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Additional Information */}
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 mb-4">
                                Əlavə Məlumatlar
                            </h3>
                            
                            <div>
                                <InputLabel htmlFor="description" value="Təsvir" />
                                <textarea
                                    id="description"
                                    className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={4}
                                    placeholder="Filial haqqında əlavə məlumatlar"
                                />
                                <InputError message={errors.description} className="mt-2" />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                            <Link
                                href={route('branches.index')}
                            >
                                <SecondaryButton type="button">
                                    Ləğv et
                                </SecondaryButton>
                            </Link>
                            
                            <PrimaryButton disabled={processing}>
                                {processing ? 'Saxlanılır...' : 'Filialı Saxla'}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}