import React from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

import { ExclamationTriangleIcon, CalendarIcon, CubeIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';

interface Alert {
    alert_id: number;
    warehouse: {
        id: number;
        name: string;
    };
    product: {
        id: number;
        name: string;
        sku: string;
    };
    alert_type: string;
    alert_message: string;
    alert_date: string;
    status: string;
    resolved_by?: {
        id: number;
        name: string;
    };
    resolved_at?: string;
    min_level?: number;
    max_level?: number;
    current_stock?: number;
}

interface Props {
    alert: Alert;
}

export default function Show({ alert }: Props) {
    const getStatusConfig = (status: string) => {
        const configs = {
            active: { color: 'text-red-700 bg-red-50 ring-red-600/20', text: 'Aktiv' },
            acknowledged: { color: 'text-yellow-700 bg-yellow-50 ring-yellow-600/20', text: 'Qəbul edilib' },
            resolved: { color: 'text-green-700 bg-green-50 ring-green-600/20', text: 'Həll edilib' }
        };
        return configs[status as keyof typeof configs] || configs.active;
    };

    const statusConfig = getStatusConfig(alert.status);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">
                            Xəbərdarlıq təfərrüatları
                        </h2>
                </div>
            }
        >
            <Head title={`Xəbərdarlıq #${alert.alert_id}`} />

            <div className="py-12">
                <div className="mx-auto sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            {/* Alert Header */}
                            <div className="mb-6 flex items-start space-x-4">
                                <div className="flex-shrink-0">
                                    <ExclamationTriangleIcon className="h-8 w-8 text-amber-500" />
                                </div>
                                <div className="flex-1">
                                    <h1 className="text-2xl font-bold text-gray-900">
                                        {alert.alert_type === 'min_max' ? 'Min/Max Xəbərdarlığı' : 'Mənfi Stok Xəbərdarlığı'}
                                    </h1>
                                    <p className="mt-1 text-sm text-gray-600">
                                        Xəbərdarlıq #{alert.alert_id}
                                    </p>
                                </div>
                                <div>
                                    <span className={`inline-flex items-center rounded-md px-3 py-1 text-sm font-medium ring-1 ring-inset ${statusConfig.color}`}>
                                        {statusConfig.text}
                                    </span>
                                </div>
                            </div>

                            {/* Alert Message */}
                            <div className="mb-6 rounded-lg bg-amber-50 p-4">
                                <p className="text-amber-800">
                                    {alert.alert_message}
                                </p>
                            </div>

                            {/* Alert Details Grid */}
                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                {/* Product Information */}
                                <div className="rounded-lg border border-gray-200 p-4">
                                    <h3 className="flex items-center text-lg font-medium text-gray-900">
                                        <CubeIcon className="mr-2 h-5 w-5 text-gray-400" />
                                        Məhsul məlumatları
                                    </h3>
                                    <div className="mt-4 space-y-3">
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Məhsul adı</dt>
                                            <dd className="mt-1 text-sm text-gray-900">{alert.product.name}</dd>
                                        </div>
                                        {alert.product.sku && (
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">SKU</dt>
                                                <dd className="mt-1 text-sm text-gray-900">{alert.product.sku}</dd>
                                            </div>
                                        )}
                                        {alert.current_stock !== undefined && (
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">Mövcud stok</dt>
                                                <dd className="mt-1 text-sm text-gray-900">{alert.current_stock}</dd>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Warehouse Information */}
                                <div className="rounded-lg border border-gray-200 p-4">
                                    <h3 className="flex items-center text-lg font-medium text-gray-900">
                                        <BuildingOfficeIcon className="mr-2 h-5 w-5 text-gray-400" />
                                        Anbar məlumatları
                                    </h3>
                                    <div className="mt-4 space-y-3">
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Anbar adı</dt>
                                            <dd className="mt-1 text-sm text-gray-900">{alert.warehouse.name}</dd>
                                        </div>
                                        {alert.min_level !== undefined && (
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">Minimum səviyyə</dt>
                                                <dd className="mt-1 text-sm text-gray-900">{alert.min_level}</dd>
                                            </div>
                                        )}
                                        {alert.max_level !== undefined && (
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">Maksimum səviyyə</dt>
                                                <dd className="mt-1 text-sm text-gray-900">{alert.max_level}</dd>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Alert Timeline */}
                                <div className="rounded-lg border border-gray-200 p-4">
                                    <h3 className="flex items-center text-lg font-medium text-gray-900">
                                        <CalendarIcon className="mr-2 h-5 w-5 text-gray-400" />
                                        Xəbərdarlıq vaxt çizelgesi
                                    </h3>
                                    <div className="mt-4 space-y-3">
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Xəbərdarlıq tarixi</dt>
                                            <dd className="mt-1 text-sm text-gray-900">
                                                {new Date(alert.alert_date).toLocaleString('az-AZ')}
                                            </dd>
                                        </div>
                                        {alert.resolved_at && (
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">Həll edilmə tarixi</dt>
                                                <dd className="mt-1 text-sm text-gray-900">
                                                    {new Date(alert.resolved_at).toLocaleString('az-AZ')}
                                                </dd>
                                            </div>
                                        )}
                                        {alert.resolved_by && (
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">Həll edən</dt>
                                                <dd className="mt-1 text-sm text-gray-900">{alert.resolved_by.name}</dd>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}