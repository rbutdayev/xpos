import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Checkbox from '@/Components/Checkbox';
import { BuildingOffice2Icon, HomeModernIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Link } from '@inertiajs/react';
import { Branch, Warehouse, WarehouseBranchAccess } from '@/types';

interface Props {
    branch: Branch;
    warehouses: Warehouse[];
    currentWarehouseAccess: WarehouseBranchAccess[];
}

export default function Edit({ branch, warehouses, currentWarehouseAccess }: Props) {
    // Convert current warehouse access to form data
    const initialWarehouseAccess = currentWarehouseAccess.map(access => ({
        warehouse_id: access.warehouse_id,
        can_transfer: access.can_transfer || false,
        can_view_stock: access.can_view_stock || true,
        can_modify_stock: access.can_modify_stock || false,
        can_receive_stock: access.can_receive_stock || false,
        can_issue_stock: access.can_issue_stock || false,
    }));

    const { data, setData, put, processing, errors } = useForm({
        name: branch.name || '',
        address: branch.address || '',
        phone: branch.phone || '',
        email: branch.email || '',
        is_main: branch.is_main || false,
        latitude: branch.latitude?.toString() || '',
        longitude: branch.longitude?.toString() || '',
        description: branch.description || '',
        is_active: branch.is_active ?? true,
        warehouse_access: initialWarehouseAccess,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('branches.update', branch.id));
    };

    const addWarehouseAccess = () => {
        const availableWarehouses = warehouses.filter(w => 
            !data.warehouse_access.some(access => access.warehouse_id === w.id)
        );
        
        if (availableWarehouses.length > 0) {
            setData('warehouse_access', [...data.warehouse_access, {
                warehouse_id: availableWarehouses[0].id,
                can_transfer: false,
                can_view_stock: true,
                can_modify_stock: false,
                can_receive_stock: false,
                can_issue_stock: false,
            }]);
        }
    };

    const removeWarehouseAccess = (index: number) => {
        const newAccess = data.warehouse_access.filter((_, i) => i !== index);
        setData('warehouse_access', newAccess);
    };

    const updateWarehouseAccess = (index: number, field: string, value: any) => {
        const newAccess = [...data.warehouse_access];
        newAccess[index] = { ...newAccess[index], [field]: value };
        setData('warehouse_access', newAccess);
    };

    const getWarehouseName = (warehouseId: number) => {
        return warehouses.find(w => w.id === warehouseId)?.name || 'Bilinməyən';
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Düzəlt: ${branch.name}`} />

            <div className="px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center mb-2">
                        <BuildingOffice2Icon className="w-8 h-8 text-blue-600 mr-3" />
                        <h1 className="text-3xl font-bold text-gray-900">Filialı Düzəlt</h1>
                    </div>
                    <p className="text-gray-600">"{branch.name}" filialının məlumatlarını yeniləyin</p>
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

                                <div className="space-y-3">
                                    <div className="flex items-center">
                                        <Checkbox
                                            id="is_main"
                                            checked={data.is_main}
                                            onChange={(e) => setData('is_main', e.target.checked)}
                                        />
                                        <InputLabel htmlFor="is_main" value="Əsas Filial" className="ml-2" />
                                    </div>
                                    <InputError message={errors.is_main} className="mt-2" />

                                    <div className="flex items-center">
                                        <Checkbox
                                            id="is_active"
                                            checked={data.is_active}
                                            onChange={(e) => setData('is_active', e.target.checked)}
                                        />
                                        <InputLabel htmlFor="is_active" value="Aktiv" className="ml-2" />
                                    </div>
                                    <InputError message={errors.is_active} className="mt-2" />
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
                                        className="mt-1 block w-full border-gray-300 focus:border-slate-500 focus:ring-slate-500 rounded-md shadow-sm"
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
                                    className="mt-1 block w-full border-gray-300 focus:border-slate-500 focus:ring-slate-500 rounded-md shadow-sm"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={4}
                                    placeholder="Filial haqqında əlavə məlumatlar"
                                />
                                <InputError message={errors.description} className="mt-2" />
                            </div>
                        </div>

                        {/* Warehouse Access Management */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                                    Anbar Girişi
                                </h3>
                                <button
                                    type="button"
                                    onClick={addWarehouseAccess}
                                    disabled={data.warehouse_access.length >= warehouses.length}
                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <PlusIcon className="h-4 w-4 mr-1" />
                                    Anbar Əlavə Et
                                </button>
                            </div>

                            {data.warehouse_access.length === 0 ? (
                                <div className="bg-gray-50 rounded-lg p-6 text-center">
                                    <HomeModernIcon className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">Anbar girişi yoxdur</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Bu filial üçün anbar girişi təyin edilməyib.
                                    </p>
                                    <div className="mt-6">
                                        <button
                                            type="button"
                                            onClick={addWarehouseAccess}
                                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                                        >
                                            <PlusIcon className="h-4 w-4 mr-2" />
                                            İlk Anbarı Əlavə Et
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {data.warehouse_access.map((access, index) => (
                                        <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex-1">
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Anbar Seçin
                                                    </label>
                                                    <select
                                                        value={access.warehouse_id}
                                                        onChange={(e) => updateWarehouseAccess(index, 'warehouse_id', parseInt(e.target.value))}
                                                        className="block w-full border-gray-300 focus:border-slate-500 focus:ring-slate-500 rounded-md shadow-sm"
                                                    >
                                                        {warehouses.map((warehouse) => (
                                                            <option key={warehouse.id} value={warehouse.id}>
                                                                {warehouse.name} ({warehouse.type === 'main' ? 'Əsas' : warehouse.type === 'auxiliary' ? 'Köməkçi' : 'Mobil'})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeWarehouseAccess(index)}
                                                    className="ml-4 inline-flex items-center p-2 border border-transparent rounded-md text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                                <div className="flex items-center">
                                                    <Checkbox
                                                        id={`can_view_stock_${index}`}
                                                        checked={access.can_view_stock}
                                                        onChange={(e) => updateWarehouseAccess(index, 'can_view_stock', e.target.checked)}
                                                    />
                                                    <label htmlFor={`can_view_stock_${index}`} className="ml-2 text-sm text-gray-700">
                                                        Stok Görüntülə
                                                    </label>
                                                </div>

                                                <div className="flex items-center">
                                                    <Checkbox
                                                        id={`can_modify_stock_${index}`}
                                                        checked={access.can_modify_stock}
                                                        onChange={(e) => updateWarehouseAccess(index, 'can_modify_stock', e.target.checked)}
                                                    />
                                                    <label htmlFor={`can_modify_stock_${index}`} className="ml-2 text-sm text-gray-700">
                                                        Stok Dəyişdir
                                                    </label>
                                                </div>

                                                <div className="flex items-center">
                                                    <Checkbox
                                                        id={`can_receive_stock_${index}`}
                                                        checked={access.can_receive_stock}
                                                        onChange={(e) => updateWarehouseAccess(index, 'can_receive_stock', e.target.checked)}
                                                    />
                                                    <label htmlFor={`can_receive_stock_${index}`} className="ml-2 text-sm text-gray-700">
                                                        Stok Qəbul Et
                                                    </label>
                                                </div>

                                                <div className="flex items-center">
                                                    <Checkbox
                                                        id={`can_issue_stock_${index}`}
                                                        checked={access.can_issue_stock}
                                                        onChange={(e) => updateWarehouseAccess(index, 'can_issue_stock', e.target.checked)}
                                                    />
                                                    <label htmlFor={`can_issue_stock_${index}`} className="ml-2 text-sm text-gray-700">
                                                        Stok Çıxar
                                                    </label>
                                                </div>

                                                <div className="flex items-center">
                                                    <Checkbox
                                                        id={`can_transfer_${index}`}
                                                        checked={access.can_transfer}
                                                        onChange={(e) => updateWarehouseAccess(index, 'can_transfer', e.target.checked)}
                                                    />
                                                    <label htmlFor={`can_transfer_${index}`} className="ml-2 text-sm text-gray-700">
                                                        Transfer Et
                                                    </label>
                                                </div>
                                            </div>

                                            <div className="mt-3 text-sm text-gray-600">
                                                <strong>Anbar:</strong> {getWarehouseName(access.warehouse_id)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Current Status */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Hazırkı Status</h4>
                            <div className="flex space-x-4 text-sm text-gray-600">
                                <span>
                                    <strong>Yaradıldı:</strong> {branch.created_at ? new Date(branch.created_at).toLocaleDateString('az-AZ') : 'N/A'}
                                </span>
                                {branch.updated_at && (
                                    <span>
                                        <strong>Yeniləndi:</strong> {new Date(branch.updated_at).toLocaleDateString('az-AZ')}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                            <Link
                                href={route('branches.show', branch.id)}
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