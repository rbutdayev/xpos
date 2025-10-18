import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SharedDataTable, { Filter, Column, Action } from '@/Components/SharedDataTable';
import PrimaryButton from '@/Components/PrimaryButton';
import { Customer, PageProps } from '@/types';

interface CustomersIndexProps extends PageProps {
    customers: {
        data: Customer[];
        links: any[];
        meta: any;
    };
    filters: {
        search?: string;
        type?: string;
        status?: string;
    };
}

export default function Index({ auth, customers, filters }: CustomersIndexProps) {
    const [localFilters, setLocalFilters] = useState(filters);

    const handleSearch = (search: string) => {
        const newFilters = { ...localFilters, search };
        setLocalFilters(newFilters);
        router.get(route('customers.index'), newFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleFilter = (key: string, value: any) => {
        const newFilters = { ...localFilters, [key]: value };
        setLocalFilters(newFilters);
        router.get(route('customers.index'), newFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSort = (field: string, direction: 'asc' | 'desc') => {
        router.get(route('customers.index'), { ...localFilters, sort: field, direction }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const columns: Column[] = [
        {
            key: 'name',
            label: 'Müştəri',
            sortable: true,
            render: (customer: Customer) => (
                <div className="flex items-center">
                    <div>
                        <Link 
                            href={route('customers.show', customer.id)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                            {customer.name}
                        </Link>
                        <div className="text-sm text-gray-500">
                            {customer.customer_type_text}
                        </div>
                        {customer.tax_number && (
                            <div className="text-xs text-gray-400">
                                VÖEN: {customer.tax_number}
                            </div>
                        )}
                    </div>
                </div>
            ),
        },
        {
            key: 'contact',
            label: 'Əlaqə məlumatları',
            render: (customer: Customer) => (
                <div>
                    {customer.phone && (
                        <div className="text-sm text-gray-900">
                            {customer.formatted_phone}
                        </div>
                    )}
                    {customer.email && (
                        <div className="text-sm text-gray-500">
                            {customer.email}
                        </div>
                    )}
                    {!customer.phone && !customer.email && (
                        <span className="text-gray-500">-</span>
                    )}
                </div>
            ),
        },
        {
            key: 'credit_status',
            label: 'Borc vəziyyəti',
            render: (customer: Customer) => (
                <div className="space-y-1">
                    {customer.has_pending_credits ? (
                        <div>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Borcludur
                            </span>
                            {customer.total_credit_amount && customer.total_credit_amount > 0 && (
                                <div className="text-xs text-gray-600 mt-1">
                                    {customer.total_credit_amount.toFixed(2)} AZN
                                </div>
                            )}
                        </div>
                    ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Borcu yox
                        </span>
                    )}
                </div>
            ),
        },
        {
            key: 'is_active',
            label: 'Status',
            sortable: true,
            render: (customer: Customer) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    customer.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                }`}>
                    {customer.is_active ? 'Aktiv' : 'Qeyri-aktiv'}
                </span>
            ),
        },
    ];

    const filters_config: Filter[] = [
        {
            key: 'type',
            label: 'Müştəri növü',
            type: 'dropdown',
            options: [
                { value: '', label: 'Bütün növlər' },
                { value: 'individual', label: 'Fiziki şəxs' },
                { value: 'corporate', label: 'Hüquqi şəxs' },
            ],
            value: localFilters.type || '',
            onChange: (value: string) => handleFilter('type', value),
        },
        {
            key: 'status',
            label: 'Status',
            type: 'dropdown',
            options: [
                { value: '', label: 'Bütün statuslar' },
                { value: 'active', label: 'Aktiv' },
                { value: 'inactive', label: 'Qeyri-aktiv' },
            ],
            value: localFilters.status || '',
            onChange: (value: string) => handleFilter('status', value),
        },
    ];

    const actions: Action[] = [
        {
            label: 'Bax',
            href: (customer: Customer) => route('customers.show', customer.id),
            variant: 'primary',
        },
        {
            label: 'Düzəliş et',
            href: (customer: Customer) => route('customers.edit', customer.id),
            variant: 'secondary',
        },
        {
            label: 'Sil',
            onClick: (customer: Customer) => {
                if (confirm('Bu müştərini silmək istədiyinizə əminsiniz?')) {
                    router.delete(route('customers.destroy', customer.id));
                }
            },
            variant: 'danger',
        },
    ];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Müştərilər
                    </h2>
                    <Link href={route('customers.create')}>
                        <PrimaryButton>
                            Yeni müştəri
                        </PrimaryButton>
                    </Link>
                </div>
            }
        >
            <Head title="Müştərilər" />

            <div className="py-12">
                <div className="w-full">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <SharedDataTable
                            data={{
                                data: customers.data,
                                links: customers.links,
                                current_page: customers.meta?.current_page || 1,
                                last_page: customers.meta?.last_page || 1,
                                total: customers.meta?.total || 0,
                                per_page: customers.meta?.per_page || 10,
                                from: customers.meta?.from || 0,
                                to: customers.meta?.to || 0
                            }}
                            columns={columns}
                            filters={filters_config}
                            actions={actions}
                            searchValue={localFilters.search || ''}
                            searchPlaceholder="Müştəri adı və ya əlaqə məlumatları ilə axtar..."
                            emptyState={{
                                title: "Heç bir müştəri tapılmadı",
                                description: "İlk müştərinizi əlavə etməklə başlayın."
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