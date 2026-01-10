import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';

interface ProductStock {
    id: number;
    min_level: number | null;
    max_level: number | null;
    reorder_point: number | null;
    reorder_quantity: number | null;
    location: string | null;
    quantity: number;
    product: {
        id: number;
        name: string;
        sku: string;
        unit: string;
    };
    warehouse: {
        id: number;
        name: string;
    };
}

interface Props {
    productStock: ProductStock;
}

export default function Edit({ productStock }: Props) {
    const { data, setData, patch, processing, errors } = useForm({
        min_level: productStock.min_level || '',
        max_level: productStock.max_level || '',
        reorder_point: productStock.reorder_point || '',
        reorder_quantity: productStock.reorder_quantity || '',
        location: productStock.location || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(route('product-stock.update', productStock.id));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Stok Məlumatlarını Redaktə Et" />
            
            <div className="py-12 px-4 sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        Stok Məlumatlarını Redaktə Et
                                    </h2>
                                    <p className="mt-1 text-sm text-gray-600">
                                        {productStock.product.name} - {productStock.warehouse.name}
                                    </p>
                                </div>
                                <Link
                                    href={route('product-stock.index')}
                                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                                >
                                    <ArrowLeftIcon className="w-4 h-4 mr-2" />
                                    Geri
                                </Link>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="text-sm font-medium text-gray-900 mb-2">Məhsul Məlumatları</h3>
                                    <div className="space-y-1">
                                        <p className="text-sm text-gray-600">
                                            <span className="font-medium">Ad:</span> {productStock.product.name}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            <span className="font-medium">SKU:</span> {productStock.product.sku}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            <span className="font-medium">Vahid:</span> {productStock.product.unit}
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="text-sm font-medium text-gray-900 mb-2">Cari Stok</h3>
                                    <div className="space-y-1">
                                        <p className="text-sm text-gray-600">
                                            <span className="font-medium">Anbar:</span> {productStock.warehouse.name}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            <span className="font-medium">Miqdar:</span> {productStock.quantity} {productStock.product.unit}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <InputLabel htmlFor="min_level" value="Minimum Səviyyə" />
                                        <TextInput
                                            id="min_level"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            className="mt-1 block w-full"
                                            value={data.min_level}
                                            onChange={(e) => setData('min_level', e.target.value)}
                                            placeholder="0"
                                        />
                                        <InputError message={errors.min_level} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="max_level" value="Maksimum Səviyyə" />
                                        <TextInput
                                            id="max_level"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            className="mt-1 block w-full"
                                            value={data.max_level}
                                            onChange={(e) => setData('max_level', e.target.value)}
                                            placeholder="0"
                                        />
                                        <InputError message={errors.max_level} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="reorder_point" value="Yenidən Sifariş Nöqtəsi" />
                                        <TextInput
                                            id="reorder_point"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            className="mt-1 block w-full"
                                            value={data.reorder_point}
                                            onChange={(e) => setData('reorder_point', e.target.value)}
                                            placeholder="0"
                                        />
                                        <InputError message={errors.reorder_point} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="reorder_quantity" value="Yenidən Sifariş Miqdarı" />
                                        <TextInput
                                            id="reorder_quantity"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            className="mt-1 block w-full"
                                            value={data.reorder_quantity}
                                            onChange={(e) => setData('reorder_quantity', e.target.value)}
                                            placeholder="0"
                                        />
                                        <InputError message={errors.reorder_quantity} className="mt-2" />
                                    </div>
                                </div>

                                <div>
                                    <InputLabel htmlFor="location" value="Anbardakı Yeri" />
                                    <TextInput
                                        id="location"
                                        type="text"
                                        className="mt-1 block w-full"
                                        value={data.location}
                                        onChange={(e) => setData('location', e.target.value)}
                                        placeholder="Məsələn: Rəf A-12"
                                    />
                                    <InputError message={errors.location} className="mt-2" />
                                </div>

                                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                                    <Link href={route('product-stock.index')}>
                                        <SecondaryButton type="button">
                                            Ləğv et
                                        </SecondaryButton>
                                    </Link>
                                    <PrimaryButton type="submit" disabled={processing}>
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