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
        current_page: number;
        last_page: number;
        total: number;
        per_page: number;
        from: number;
        to: number;
    };
    filters: {
        search?: string;
        type?: string;
        status?: string;
        credit_status?: string;
        has_services?: string;
        birthday_month?: string;
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

    const handlePerPageChange = (perPage: number) => {
        router.get(route('customers.index'), { ...localFilters, per_page: perPage }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const columns: Column[] = [
        {
            key: 'name',
            label: 'Müştəri',
            mobileLabel: 'Ad',
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
            mobileLabel: 'Telefon / Email',
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
            key: 'loyalty_points',
            label: 'Bonus Ballar',
            mobileLabel: 'Ballar',
            hideOnMobile: true,
            render: (customer: Customer) => (
                <div>
                    {(customer.current_points || 0) > 0 ? (
                        <div className="space-y-1">
                            <div className="flex items-center space-x-1">
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                </svg>
                                <span className="text-sm font-semibold text-blue-900">
                                    {customer.current_points}
                                </span>
                            </div>
                            {customer.lifetime_points && customer.lifetime_points > 0 && (
                                <div className="text-xs text-gray-500">
                                    Ümumi: {customer.lifetime_points}
                                </div>
                            )}
                        </div>
                    ) : (
                        <span className="text-gray-400 text-sm">-</span>
                    )}
                </div>
            ),
        },
        {
            key: 'credit_status',
            label: 'Borc vəziyyəti',
            hideOnMobile: true, // Hide on mobile - less critical information
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
        {
            key: 'credit_status',
            label: 'Borc vəziyyəti',
            type: 'dropdown',
            options: [
                { value: '', label: 'Hamısı' },
                { value: 'with_debt', label: 'Borclu müştərilər' },
                { value: 'no_debt', label: 'Borcu olmayan' },
            ],
            value: localFilters.credit_status || '',
            onChange: (value: string) => handleFilter('credit_status', value),
        },
        {
            key: 'has_services',
            label: 'Servis tarixçəsi',
            type: 'dropdown',
            options: [
                { value: '', label: 'Hamısı' },
                { value: 'yes', label: 'Servisi olan' },
                { value: 'no', label: 'Servisi olmayan' },
            ],
            value: localFilters.has_services || '',
            onChange: (value: string) => handleFilter('has_services', value),
        },
        {
            key: 'birthday_month',
            label: 'Doğum ayı',
            type: 'dropdown',
            options: [
                { value: '', label: 'Bütün aylar' },
                { value: '1', label: 'Yanvar' },
                { value: '2', label: 'Fevral' },
                { value: '3', label: 'Mart' },
                { value: '4', label: 'Aprel' },
                { value: '5', label: 'May' },
                { value: '6', label: 'İyun' },
                { value: '7', label: 'İyul' },
                { value: '8', label: 'Avqust' },
                { value: '9', label: 'Sentyabr' },
                { value: '10', label: 'Oktyabr' },
                { value: '11', label: 'Noyabr' },
                { value: '12', label: 'Dekabr' },
            ],
            value: localFilters.birthday_month || '',
            onChange: (value: string) => handleFilter('birthday_month', value),
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
                                current_page: customers.current_page,
                                last_page: customers.last_page,
                                total: customers.total,
                                per_page: customers.per_page,
                                from: customers.from,
                                to: customers.to
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
                            onPerPageChange={handlePerPageChange}
                            fullWidth={true}
                            mobileClickable={true}
                            hideMobileActions={true}
                        />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}