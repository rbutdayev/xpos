import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SalesNavigation from '@/Components/SalesNavigation';
import SharedDataTable, { Filter, Column, Action } from '@/Components/SharedDataTable';
import { Customer, PageProps } from '@/types';
import { PlusCircleIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

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
    discountsEnabled?: boolean;
    giftCardsEnabled?: boolean;
}

export default function Index({ auth, customers, filters, discountsEnabled, giftCardsEnabled }: CustomersIndexProps) {
    const { t } = useTranslation('customers');
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
            label: t('fields.customer'),
            mobileLabel: t('fields.name'),
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
            label: t('fields.contactInfo'),
            mobileLabel: t('fields.phoneEmail'),
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
            label: t('fields.bonusPoints'),
            mobileLabel: t('fields.points'),
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
                                    {t('fields.totalPoints', { points: customer.lifetime_points })}
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
            label: t('fields.creditStatus'),
            hideOnMobile: true, // Hide on mobile - less critical information
            render: (customer: Customer) => (
                <div className="space-y-1">
                    {customer.has_pending_credits ? (
                        <div>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                {t('status.hasDebt')}
                            </span>
                            {customer.total_credit_amount && customer.total_credit_amount > 0 && (
                                <div className="text-xs text-gray-600 mt-1">
                                    {customer.total_credit_amount.toFixed(2)} AZN
                                </div>
                            )}
                        </div>
                    ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {t('status.noDebt')}
                        </span>
                    )}
                </div>
            ),
        },
        {
            key: 'is_active',
            label: t('fields.status'),
            sortable: true,
            render: (customer: Customer) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    customer.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                }`}>
                    {customer.is_active ? t('status.active') : t('status.inactive')}
                </span>
            ),
        },
    ];

    const filters_config: Filter[] = [
        {
            key: 'type',
            label: t('fields.customerType'),
            type: 'dropdown',
            options: [
                { value: '', label: t('types.allTypes') },
                { value: 'individual', label: t('types.individual') },
                { value: 'corporate', label: t('types.corporate') },
            ],
            value: localFilters.type || '',
            onChange: (value: string) => handleFilter('type', value),
        },
        {
            key: 'status',
            label: t('fields.status'),
            type: 'dropdown',
            options: [
                { value: '', label: t('status.allStatuses') },
                { value: 'active', label: t('status.active') },
                { value: 'inactive', label: t('status.inactive') },
            ],
            value: localFilters.status || '',
            onChange: (value: string) => handleFilter('status', value),
        },
        {
            key: 'credit_status',
            label: t('creditStatus.label'),
            type: 'dropdown',
            options: [
                { value: '', label: t('creditStatus.all') },
                { value: 'with_debt', label: t('creditStatus.withDebt') },
                { value: 'no_debt', label: t('creditStatus.noDebt') },
            ],
            value: localFilters.credit_status || '',
            onChange: (value: string) => handleFilter('credit_status', value),
        },
        {
            key: 'has_services',
            label: t('serviceHistory.label'),
            type: 'dropdown',
            options: [
                { value: '', label: t('serviceHistory.all') },
                { value: 'yes', label: t('serviceHistory.withServices') },
                { value: 'no', label: t('serviceHistory.withoutServices') },
            ],
            value: localFilters.has_services || '',
            onChange: (value: string) => handleFilter('has_services', value),
        },
        {
            key: 'birthday_month',
            label: t('birthMonth.label'),
            type: 'dropdown',
            options: [
                { value: '', label: t('birthMonth.allMonths') },
                { value: '1', label: t('birthMonth.january') },
                { value: '2', label: t('birthMonth.february') },
                { value: '3', label: t('birthMonth.march') },
                { value: '4', label: t('birthMonth.april') },
                { value: '5', label: t('birthMonth.may') },
                { value: '6', label: t('birthMonth.june') },
                { value: '7', label: t('birthMonth.july') },
                { value: '8', label: t('birthMonth.august') },
                { value: '9', label: t('birthMonth.september') },
                { value: '10', label: t('birthMonth.october') },
                { value: '11', label: t('birthMonth.november') },
                { value: '12', label: t('birthMonth.december') },
            ],
            value: localFilters.birthday_month || '',
            onChange: (value: string) => handleFilter('birthday_month', value),
        },
    ];

    const actions: Action[] = [
        {
            label: t('actions.view'),
            href: (customer: Customer) => route('customers.show', customer.id),
            variant: 'primary',
        },
        {
            label: t('actions.edit'),
            href: (customer: Customer) => route('customers.edit', customer.id),
            variant: 'secondary',
        },
        {
            label: t('actions.delete'),
            onClick: (customer: Customer) => {
                if (confirm(t('messages.confirmDelete'))) {
                    router.delete(route('customers.destroy', customer.id));
                }
            },
            variant: 'danger',
        },
    ];

    return (
        <AuthenticatedLayout>
            <Head title={t('title')} />
            <div className="mx-auto sm:px-6 lg:px-8 mb-6">
                <SalesNavigation currentRoute="customers" showDiscounts={discountsEnabled} showGiftCards={giftCardsEnabled}>
                    <Link
                        href={route('customers.create')}
                        className="relative flex items-center gap-2.5 px-4 py-3 rounded-md font-medium text-sm transition-all duration-200 ease-in-out bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md shadow-green-500/30 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
                    >
                        <PlusCircleIcon className="w-5 h-5 text-white" />
                        <span className="font-semibold">{t('addCustomer')}</span>
                    </Link>
                </SalesNavigation>
            </div>
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
                            searchPlaceholder={t('placeholders.search')}
                            emptyState={{
                                title: t('emptyState.title'),
                                description: t('emptyState.description')
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