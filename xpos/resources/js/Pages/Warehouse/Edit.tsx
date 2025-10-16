import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Checkbox from '@/Components/Checkbox';
import { BuildingStorefrontIcon } from '@heroicons/react/24/outline';
import { Link } from '@inertiajs/react';
import { Warehouse, Branch } from '@/types';

interface Props {
    warehouse: Warehouse;
    branches: Branch[];
}

export default function Edit({ warehouse, branches }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: warehouse.name || '',
        type: warehouse.type || 'auxiliary' as 'main' | 'auxiliary' | 'mobile',
        location: warehouse.location || '',
        description: warehouse.description || '',
        is_active: warehouse.is_active ?? true,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('warehouses.update', warehouse.id));
    };

    const getWarehouseTypeText = (type: string) => {
        const types: Record<string, string> = {
            'main': 'Əsas Anbar',
            'auxiliary': 'Köməkçi Anbar',
            'mobile': 'Mobil Anbar'
        };
        return types[type] || type;
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Düzəlt: ${warehouse.name}`} />

            <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center mb-2">
                        <BuildingStorefrontIcon className="w-8 h-8 text-blue-600 mr-3" />
                        <h1 className="text-3xl font-bold text-gray-900">Anbarı Düzəlt</h1>
                    </div>
                    <p className="text-gray-600">"{warehouse.name}" anbarının məlumatlarını yeniləyin</p>
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
                                    <InputLabel htmlFor="name" value="Anbar Adı *" />
                                    <TextInput
                                        id="name"
                                        type="text"
                                        className="mt-1 block w-full"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        required
                                        autoFocus
                                        placeholder="Məsələn: Mərkəzi Anbar"
                                    />
                                    <InputError message={errors.name} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="type" value="Anbar Növü *" />
                                    <select
                                        id="type"
                                        className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                        value={data.type}
                                        onChange={(e) => setData('type', e.target.value as 'main' | 'auxiliary' | 'mobile')}
                                        required
                                    >
                                        <option value="main">Əsas Anbar</option>
                                        <option value="auxiliary">Köməkçi Anbar</option>
                                        <option value="mobile">Mobil Anbar</option>
                                    </select>
                                    <InputError message={errors.type} className="mt-2" />
                                </div>

                                <div className="md:col-span-2">
                                    <InputLabel htmlFor="location" value="Yer/Ünvan" />
                                    <TextInput
                                        id="location"
                                        type="text"
                                        className="mt-1 block w-full"
                                        value={data.location}
                                        onChange={(e) => setData('location', e.target.value)}
                                        placeholder="Anbarın yer/ünvanını daxil edin"
                                    />
                                    <InputError message={errors.location} className="mt-2" />
                                </div>

                                <div className="md:col-span-2">
                                    <div className="flex items-center">
                                        <Checkbox
                                            id="is_active"
                                            checked={data.is_active}
                                            onChange={(e) => setData('is_active', e.target.checked)}
                                        />
                                        <InputLabel htmlFor="is_active" value="Aktiv" className="ml-2" />
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Anbar aktiv deyilsə, istifadə oluna bilməz
                                    </p>
                                    <InputError message={errors.is_active} className="mt-2" />
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 mb-4">
                                Təsvir
                            </h3>
                            
                            <div>
                                <InputLabel htmlFor="description" value="Anbar Təsviri" />
                                <textarea
                                    id="description"
                                    className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={4}
                                    placeholder="Anbar haqqında əlavə məlumatlar"
                                />
                                <InputError message={errors.description} className="mt-2" />
                            </div>
                        </div>

                        {/* Current Status */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Hazırkı Status</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                                <div>
                                    <strong>Növ:</strong> {getWarehouseTypeText(warehouse.type)}
                                </div>
                                <div>
                                    <strong>Yaradıldı:</strong> {warehouse.created_at ? new Date(warehouse.created_at).toLocaleDateString('az-AZ') : 'N/A'}
                                </div>
                                {warehouse.updated_at && (
                                    <div>
                                        <strong>Yeniləndi:</strong> {new Date(warehouse.updated_at).toLocaleDateString('az-AZ')}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Current Branch Access */}
                        {warehouse.branch_access && warehouse.branch_access.length > 0 && (
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 mb-4">
                                    Hazırkı Filial İcazələri
                                </h3>
                                
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        {warehouse.branch_access.map((access) => (
                                            <div key={access.id} className="bg-white rounded p-3">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="font-medium text-gray-900">
                                                        {access.branch?.name}
                                                    </h4>
                                                    {access.branch?.is_main && (
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                            Əsas
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                <div className="grid grid-cols-2 gap-1 text-xs">
                                                    <div className="flex justify-between">
                                                        <span>Görüntülə:</span>
                                                        <span className={access.can_view_stock ? 'text-green-600' : 'text-red-600'}>
                                                            {access.can_view_stock ? '✓' : '✗'}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Dəyişdir:</span>
                                                        <span className={access.can_modify_stock ? 'text-green-600' : 'text-red-600'}>
                                                            {access.can_modify_stock ? '✓' : '✗'}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Transfer:</span>
                                                        <span className={access.can_transfer ? 'text-green-600' : 'text-red-600'}>
                                                            {access.can_transfer ? '✓' : '✗'}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Qəbul:</span>
                                                        <span className={access.can_receive_stock ? 'text-green-600' : 'text-red-600'}>
                                                            {access.can_receive_stock ? '✓' : '✗'}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between col-span-2">
                                                        <span>Buraxma:</span>
                                                        <span className={access.can_issue_stock ? 'text-green-600' : 'text-red-600'}>
                                                            {access.can_issue_stock ? '✓' : '✗'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    <div className="mt-4 text-center">
                                        <p className="text-sm text-gray-600 mb-2">
                                            Filial icazələrini dəyişmək üçün ayrıca səhifə var
                                        </p>
                                        <Link
                                            href={route('warehouses.show', warehouse.id)}
                                            className="text-blue-600 hover:underline text-sm"
                                        >
                                            İcazələri İdarə Et
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                            <Link
                                href={route('warehouses.show', warehouse.id)}
                            >
                                <SecondaryButton type="button">
                                    Ləğv et
                                </SecondaryButton>
                            </Link>
                            
                            <PrimaryButton disabled={processing}>
                                {processing ? 'Yenilənir...' : 'Dəyişiklikləri Saxla'}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}