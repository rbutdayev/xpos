import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SharedDataTable, { Filter, Column, Action } from '@/Components/SharedDataTable';
import PrimaryButton from '@/Components/PrimaryButton';
import { ServiceRecord, PageProps } from '@/types';

interface ServiceRecordsIndexProps extends PageProps {
    serviceRecords: {
        data: ServiceRecord[];
        links: any[];
        meta: any;
    };
    filters: {
        search?: string;
        status?: string;
        customer_id?: string;
        vehicle_id?: string;
        date_from?: string;
        date_to?: string;
    };
    branches: Array<{
        id: number;
        name: string;
    }>;
}

export default function Index({ auth, serviceRecords, filters, branches }: ServiceRecordsIndexProps) {
    const [localFilters, setLocalFilters] = useState(filters);

    const handleSearch = (search: string) => {
        const newFilters = { ...localFilters, search };
        setLocalFilters(newFilters);
        router.get('/service-records', newFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleFilter = (key: string, value: any) => {
        const newFilters = { ...localFilters, [key]: value };
        setLocalFilters(newFilters);
        router.get('/service-records', newFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSort = (field: string, direction: 'asc' | 'desc') => {
        router.get('/service-records', { ...localFilters, sort: field, direction }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const columns: Column[] = [
        {
            key: 'service_number',
            label: 'Servis nömrəsi',
            sortable: true,
            render: (serviceRecord: ServiceRecord) => (
                <div>
                    <Link 
                        href={`/service-records/${serviceRecord.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                        {serviceRecord.service_number}
                    </Link>
                    <div className="text-xs text-gray-500 mt-1">
                        {new Date(serviceRecord.service_date).toLocaleDateString('az-AZ')}
                    </div>
                </div>
            ),
        },
        {
            key: 'customer_info',
            label: 'Müştəri və avtomobil',
            render: (serviceRecord: ServiceRecord) => (
                <div className="space-y-1">
                    <div className="font-medium text-sm">
                        {serviceRecord.customer?.name || 'Müştəri seçilməyib'}
                    </div>
                    <div className="text-xs text-gray-500">
                        {serviceRecord.vehicle?.formatted_plate || 'Avtomobil yoxdur'}
                    </div>
                </div>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            render: (serviceRecord: ServiceRecord) => {
                const statusColors = {
                    pending: 'bg-yellow-100 text-yellow-800',
                    in_progress: 'bg-blue-100 text-blue-800',
                    completed: 'bg-green-100 text-green-800',
                    cancelled: 'bg-red-100 text-red-800',
                };
                return (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[serviceRecord.status as keyof typeof statusColors]}`}>
                        {serviceRecord.status_text}
                    </span>
                );
            },
        },
        {
            key: 'financial_info',
            label: 'Ödəniş',
            sortable: true,
            render: (serviceRecord: ServiceRecord) => (
                <div className="text-right space-y-1">
                    <div className="font-semibold text-sm">
                        {serviceRecord.formatted_total_cost}
                    </div>
                    <div>
                        {serviceRecord.payment_status === 'credit' || serviceRecord.payment_status === 'partial' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                {serviceRecord.payment_status === 'credit' ? 'Borc' : 'Qismən'}
                            </span>
                        ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Ödənilib
                            </span>
                        )}
                    </div>
                    {serviceRecord.customer_credit && serviceRecord.customer_credit.remaining_amount > 0 && (
                        <div className="text-xs text-red-600">
                            {Number(serviceRecord.customer_credit.remaining_amount || 0).toFixed(2)} AZN qalır
                        </div>
                    )}
                </div>
            ),
        },
    ];

    const filters_config: Filter[] = [
        {
            key: 'status',
            label: 'Status',
            type: 'dropdown',
            options: [
                { value: '', label: 'Hamısı' },
                { value: 'pending', label: 'Gözləyir' },
                { value: 'in_progress', label: 'Davam edir' },
                { value: 'completed', label: 'Tamamlandı' },
                { value: 'cancelled', label: 'Ləğv edildi' },
            ],
            value: localFilters.status || '',
            onChange: (value: string) => handleFilter('status', value),
        },
        {
            key: 'date_from',
            label: 'Başlanğıc tarixi',
            type: 'date',
            value: localFilters.date_from || '',
            onChange: (value: string) => handleFilter('date_from', value),
        },
        {
            key: 'date_to',
            label: 'Son tarix',
            type: 'date',
            value: localFilters.date_to || '',
            onChange: (value: string) => handleFilter('date_to', value),
        },
    ];

    const actions: Action[] = [
        {
            label: '',
            icon: (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
            ),
            href: (serviceRecord: ServiceRecord) => `/service-records/${serviceRecord.id}`,
            variant: 'primary',
        },
        {
            label: '',
            icon: (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
            ),
            href: (serviceRecord: ServiceRecord) => `/service-records/${serviceRecord.id}/edit`,
            variant: 'secondary',
        },
    ];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Servis qeydləri
                    </h2>
                    <Link href={route('pos.index', { mode: 'service' })}>
                        <PrimaryButton>
                            POS-da Xidmət Et
                        </PrimaryButton>
                    </Link>
                </div>
            }
        >
            <Head title="Servis qeydləri" />

            <div className="py-12">
                <div className="w-full">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <SharedDataTable
                            data={{
                                data: serviceRecords.data,
                                links: serviceRecords.links,
                                current_page: serviceRecords.meta?.current_page || 1,
                                last_page: serviceRecords.meta?.last_page || 1,
                                total: serviceRecords.meta?.total || 0,
                                per_page: serviceRecords.meta?.per_page || 15,
                                from: serviceRecords.meta?.from || 0,
                                to: serviceRecords.meta?.to || 0
                            }}
                            columns={columns}
                            filters={filters_config}
                            actions={actions}
                            searchPlaceholder="Servis nömrəsi, təsvir və ya müştəri adı ilə axtar..."
                            emptyState={{
                                title: "Heç bir servis qeydi tapılmadı",
                                description: "Hələ ki heç bir servis qeydi əlavə edilməyib."
                            }}
                            onSearchChange={(search: string) => handleSearch(search)}
                            onSort={(field: string) => handleSort(field, 'asc')}
                            fullWidth={true}
                        />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}