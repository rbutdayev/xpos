import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { WarehouseTransfer } from '@/types';
// Using hardcoded Azerbaijani strings like other pages in the application
import { 
    ArrowLeftIcon,
    CheckIcon
} from '@heroicons/react/24/outline';

interface Props {
    transfer: WarehouseTransfer;
}

export default function Show({ transfer }: Props) {
    const getStatusBadge = () => {
        return (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <CheckIcon className="w-4 h-4" />
                <span className="ml-2">Tamamlanıb</span>
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
            <Head title={`Transfer #${transfer.transfer_id}`} />

            <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                    {/* Header */}
                    <div className="px-6 py-4 bg-white border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <Link
                                    href={route('warehouse-transfers.index')}
                                    className="mr-4 text-gray-600 hover:text-gray-900"
                                >
                                    <ArrowLeftIcon className="w-5 h-5" />
                                </Link>
                                <div>
                                    <h2 className="text-2xl font-semibold text-gray-900">
                                        Transfer #{transfer.transfer_id}
                                    </h2>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {transfer.requested_at
                                            ? new Date(transfer.requested_at).toLocaleDateString('az-AZ')
                                            : transfer.created_at
                                                ? new Date(transfer.created_at).toLocaleDateString('az-AZ')
                                                : '-'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                {getStatusBadge()}
                            </div>
                        </div>
                    </div>

                    {/* Transfer Details */}
                    <div className="px-6 py-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Transfer Information */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Transfer Məlumatları</h3>
                                <dl className="space-y-3">
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Mənbə Anbar</dt>
                                        <dd className="text-sm text-gray-900">{transfer.from_warehouse?.name || '-'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Təyinat Anbarı</dt>
                                        <dd className="text-sm text-gray-900">{transfer.to_warehouse?.name || '-'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Transfer Tarixi</dt>
                                        <dd className="text-sm text-gray-900">
                                            {(transfer.requested_at || transfer.created_at)
                                                ? new Date((transfer.requested_at || transfer.created_at)!).toLocaleDateString('az-AZ', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })
                                                : '-'}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Status</dt>
                                        <dd className="text-sm text-gray-900">
                                            {getStatusBadge()}
                                        </dd>
                                    </div>
                                </dl>
                            </div>

                            {/* Product Information */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Məhsul Məlumatları</h3>
                                <dl className="space-y-3">
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Məhsul Adı</dt>
                                        <dd className="text-sm text-gray-900">{transfer.product?.name || '-'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">SKU</dt>
                                        <dd className="text-sm text-gray-900">{transfer.product?.sku || '-'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Miqdar</dt>
                                        <dd className="text-sm text-gray-900">
                                            {transfer.quantity} {transfer.product?.unit || ''}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Ümumi Dəyər</dt>
                                        <dd className="text-sm text-gray-900">
                                            {formatCurrency(transfer.total_cost)}
                                        </dd>
                                    </div>
                                </dl>
                            </div>

                            {/* Employee Information */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">İşçi Məlumatları</h3>
                                <dl className="space-y-3">
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Tələb edən</dt>
                                        <dd className="text-sm text-gray-900">{transfer.requestedBy?.name || '-'}</dd>
                                    </div>
                                    {transfer.approvedBy && (
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Təsdiq edən</dt>
                                            <dd className="text-sm text-gray-900">{transfer.approvedBy.name}</dd>
                                        </div>
                                    )}
                                </dl>
                            </div>

                            {/* Notes */}
                            {transfer.notes && (
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Qeydlər</h3>
                                    <p className="text-sm text-gray-900">{transfer.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
