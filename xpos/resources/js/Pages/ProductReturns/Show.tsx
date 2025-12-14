import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ProductReturn } from '@/types';
import { PrinterIcon } from '@heroicons/react/24/outline';

interface Props {
    productReturn: ProductReturn;
}

export default function Show({ productReturn }: Props) {
    const getStatusBadge = (status: string) => {
        const statusConfig = {
            'gozlemede': { label: 'Gözləmədə', color: 'bg-yellow-100 text-yellow-800' },
            'tesdiq_edilib': { label: 'Təsdiq edilib', color: 'bg-blue-100 text-blue-800' },
            'gonderildi': { label: 'Göndərildi', color: 'bg-purple-100 text-purple-800' },
            'tamamlanib': { label: 'Tamamlanıb', color: 'bg-green-100 text-green-800' },
            'ləğv_edildi': { label: 'Ləğv edildi', color: 'bg-red-100 text-red-800' },
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['gozlemede'];

        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
                {config.label}
            </span>
        );
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('az-AZ', {
            style: 'currency',
            currency: 'AZN'
        }).format(amount);
    };

    return (
        <AuthenticatedLayout>
            <Head title={`İadə #${productReturn.return_id}`} />

            <div className="mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <div className="md:flex md:items-center md:justify-between mb-6">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-xl sm:text-2xl font-bold leading-7 text-gray-900">
                            İadə #{productReturn.return_id}
                        </h2>
                        <p className="mt-1 text-sm sm:text-base text-gray-500">
                            Təchizatçıya iadə detalları
                        </p>
                    </div>
                    <div className="mt-4 flex space-x-2 md:mt-0 md:ml-4">
                        <a
                            href={route('product-returns.print', productReturn.return_id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <PrinterIcon className="w-4 h-4 mr-2" />
                            Çap et
                        </a>
                        <Link
                            href={route('product-returns.index')}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Geri
                        </Link>
                    </div>
                </div>

                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                İadə məlumatları
                            </h3>
                            {getStatusBadge(productReturn.status)}
                        </div>
                    </div>

                    <div className="px-4 py-5 sm:p-6">
                        <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                            <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-gray-500">
                                    Təchizatçı
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {productReturn.supplier?.name || '-'}
                                </dd>
                            </div>

                            <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-gray-500">
                                    Anbar
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {productReturn.warehouse?.name || '-'}
                                </dd>
                            </div>

                            <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-gray-500">
                                    Məhsul
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {productReturn.product?.name || '-'}
                                </dd>
                            </div>

                            {productReturn.variant && (
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-gray-500">
                                        Variant
                                    </dt>
                                    <dd className="mt-1 text-sm text-gray-900">
                                        {productReturn.variant.size && `Ölçü: ${productReturn.variant.size}`}
                                        {productReturn.variant.size && productReturn.variant.color && ' | '}
                                        {productReturn.variant.color && `Rəng: ${productReturn.variant.color}`}
                                    </dd>
                                </div>
                            )}

                            <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-gray-500">
                                    Miqdar
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {productReturn.quantity}
                                </dd>
                            </div>

                            <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-gray-500">
                                    Vahid qiymət
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {formatCurrency(productReturn.unit_cost)}
                                </dd>
                            </div>

                            <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-gray-500">
                                    Ümumi məbləğ
                                </dt>
                                <dd className="mt-1 text-sm font-semibold text-gray-900">
                                    {formatCurrency(productReturn.total_cost)}
                                </dd>
                            </div>

                            <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-gray-500">
                                    İadə tarixi
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {new Date(productReturn.return_date).toLocaleDateString('az-AZ')}
                                </dd>
                            </div>

                            <div className="sm:col-span-2">
                                <dt className="text-sm font-medium text-gray-500">
                                    İadə səbəbi
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                                    {productReturn.reason}
                                </dd>
                            </div>

                            {productReturn.requested_by && (
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-gray-500">
                                        Sorğu edən
                                    </dt>
                                    <dd className="mt-1 text-sm text-gray-900">
                                        {productReturn.requestedBy?.name || '-'}
                                    </dd>
                                </div>
                            )}

                            {productReturn.approved_by && (
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-gray-500">
                                        Təsdiq edən
                                    </dt>
                                    <dd className="mt-1 text-sm text-gray-900">
                                        {productReturn.approvedBy?.name || '-'}
                                    </dd>
                                </div>
                            )}

                            {productReturn.refund_amount && (
                                <>
                                    <div className="sm:col-span-1">
                                        <dt className="text-sm font-medium text-gray-500">
                                            Geri qaytarılan məbləğ
                                        </dt>
                                        <dd className="mt-1 text-sm text-gray-900">
                                            {formatCurrency(productReturn.refund_amount)}
                                        </dd>
                                    </div>

                                    <div className="sm:col-span-1">
                                        <dt className="text-sm font-medium text-gray-500">
                                            Geri qaytarma tarixi
                                        </dt>
                                        <dd className="mt-1 text-sm text-gray-900">
                                            {productReturn.refund_date ? new Date(productReturn.refund_date).toLocaleDateString('az-AZ') : '-'}
                                        </dd>
                                    </div>
                                </>
                            )}

                            {productReturn.supplier_response && (
                                <div className="sm:col-span-2">
                                    <dt className="text-sm font-medium text-gray-500">
                                        Təchizatçının cavabı
                                    </dt>
                                    <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                                        {productReturn.supplier_response}
                                    </dd>
                                </div>
                            )}

                            <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-gray-500">
                                    Yaradılma tarixi
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {new Date(productReturn.created_at).toLocaleString('az-AZ')}
                                </dd>
                            </div>

                            <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-gray-500">
                                    Son yenilənmə
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {productReturn.updated_at ? new Date(productReturn.updated_at).toLocaleString('az-AZ') : '-'}
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
