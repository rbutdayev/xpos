import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SharedDataTable, { Filter, Column, Action } from '@/Components/SharedDataTable';
import PrimaryButton from '@/Components/PrimaryButton';
import { EyeIcon, ArrowUturnLeftIcon, XCircleIcon, PlusCircleIcon } from '@heroicons/react/24/outline';
import { PageProps } from '@/types';
import SalesNavigation from '@/Components/SalesNavigation';
import ReturnModal from '@/Components/ReturnModal';
import { useTranslation } from 'react-i18next';

interface SaleReturn {
    return_id: number;
    return_number: string;
    sale_id: number;
    sale?: {
        sale_number: string;
    };
    customer?: {
        name: string;
    };
    user?: {
        name: string;
    };
    subtotal: string;
    tax_amount: string;
    total: string;
    status: 'pending' | 'completed' | 'cancelled';
    reason?: string;
    notes?: string;
    fiscal_number?: string;
    return_date: string;
    items?: Array<{
        product: {
            name: string;
        };
        quantity: string;
    }>;
}

interface ReturnsIndexProps extends PageProps {
    returns: {
        data: SaleReturn[];
        links: any[];
        meta: any;
    };
    filters: {
        search?: string;
        status?: string;
        start_date?: string;
        end_date?: string;
    };
    statistics: {
        total_returns: number;
        total_amount: number;
        today_returns: number;
        today_amount: number;
    };
    discountsEnabled?: boolean;
    giftCardsEnabled?: boolean;
}

export default function Index({ auth, returns, filters, statistics, discountsEnabled, giftCardsEnabled }: ReturnsIndexProps) {
    const { t } = useTranslation(['inventory', 'common']);
    const [localFilters, setLocalFilters] = useState(filters);
    const [searchInput, setSearchInput] = useState(filters.search || '');
    const [returnModalOpen, setReturnModalOpen] = useState(false);

    // Debounced search effect
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            const newFilters = { ...localFilters, search: searchInput };
            setLocalFilters(newFilters);
            router.get(route('returns.index'), newFilters, {
                preserveState: true,
                preserveScroll: true,
            });
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchInput]);

    const handleSearchInput = (search: string) => {
        setSearchInput(search);
    };

    const handleFilter = (key: string, value: any) => {
        const newFilters = { ...localFilters, [key]: value };
        setLocalFilters(newFilters);
        router.get(route('returns.index'), newFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleTodayFilter = () => {
        const today = new Date().toISOString().split('T')[0];
        const newFilters = { ...localFilters, start_date: today, end_date: today };
        setLocalFilters(newFilters);
        router.get(route('returns.index'), newFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const isTodaySelected = () => {
        const today = new Date().toISOString().split('T')[0];
        return localFilters.start_date === today && localFilters.end_date === today;
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            completed: { color: 'bg-green-100 text-green-800', text: t('returns.statuses.completed') },
            pending: { color: 'bg-yellow-100 text-yellow-800', text: t('returns.statuses.pending') },
            cancelled: { color: 'bg-red-100 text-red-800', text: t('returns.statuses.cancelled') },
        };
        const badge = badges[status as keyof typeof badges] || badges.completed;
        return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
                {badge.text}
            </span>
        );
    };

    const columns: Column[] = [
        {
            key: 'return_number',
            label: t('returns.returnNumber'),
            sortable: true,
            render: (returnItem: SaleReturn) => (
                <Link
                    href={route('returns.show', returnItem.return_id)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                >
                    {returnItem.return_number}
                </Link>
            ),
        },
        {
            key: 'sale.sale_number',
            label: t('returns.saleNumber'),
            sortable: true,
            render: (returnItem: SaleReturn) => (
                returnItem.sale ? (
                    <Link
                        href={route('sales.show', returnItem.sale_id)}
                        className="text-blue-600 hover:text-blue-800"
                    >
                        {returnItem.sale.sale_number}
                    </Link>
                ) : '-'
            ),
        },
        {
            key: 'customer.name',
            label: t('returns.customer'),
            sortable: true,
            render: (returnItem: SaleReturn) => returnItem.customer?.name || t('anonymous'),
        },
        {
            key: 'total',
            label: t('returns.total'),
            sortable: true,
            render: (returnItem: SaleReturn) => `${returnItem.total} ₼`,
            className: 'text-right font-semibold',
        },
        {
            key: 'status',
            label: t('returns.status'),
            sortable: true,
            render: (returnItem: SaleReturn) => getStatusBadge(returnItem.status),
        },
        {
            key: 'return_date',
            label: t('returns.returnDate'),
            sortable: true,
            render: (returnItem: SaleReturn) => new Date(returnItem.return_date).toLocaleString('az-AZ'),
        },
        {
            key: 'user.name',
            label: t('returns.processedBy'),
            sortable: true,
            render: (returnItem: SaleReturn) => returnItem.user?.name || '-',
        },
    ];

    const tableFilters: Filter[] = [
        {
            key: 'status',
            label: t('returns.status'),
            type: 'dropdown',
            value: localFilters.status || '',
            options: [
                { value: '', label: t('returns.statuses.allStatuses') },
                { value: 'completed', label: t('returns.statuses.completed') },
                { value: 'pending', label: t('returns.statuses.pending') },
                { value: 'cancelled', label: t('returns.statuses.cancelled') },
            ],
            onChange: (value) => handleFilter('status', value),
        },
        {
            key: 'start_date',
            label: t('startDate'),
            type: 'date',
            value: localFilters.start_date || '',
            onChange: (value) => handleFilter('start_date', value),
        },
        {
            key: 'end_date',
            label: t('endDate'),
            type: 'date',
            value: localFilters.end_date || '',
            onChange: (value) => handleFilter('end_date', value),
        },
    ];

    const actions: Action[] = [
        {
            label: t('view'),
            onClick: (returnItem: SaleReturn) => router.visit(route('returns.show', returnItem.return_id)),
            className: 'text-blue-600 hover:text-blue-800',
        },
    ];

    return (
        <AuthenticatedLayout>
            <Head title={t('returns.title')} />
            <div className="mx-auto sm:px-6 lg:px-8 mb-6">
                <SalesNavigation currentRoute="returns" showDiscounts={discountsEnabled} showGiftCards={giftCardsEnabled}>
                    <button
                        onClick={() => setReturnModalOpen(true)}
                        className="relative flex items-center gap-2.5 px-4 py-3 rounded-md font-medium text-sm transition-all duration-200 ease-in-out bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md shadow-green-500/30 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
                    >
                        <ArrowUturnLeftIcon className="w-5 h-5 text-white" />
                        <span className="font-semibold">{t('returns.newReturn')}</span>
                    </button>
                </SalesNavigation>
            </div>
            <div className="py-6">
                <div className="px-4 sm:px-6 lg:px-8">
                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="text-sm text-gray-600">{t('returns.statistics.todayReturns')}</div>
                            <div className="text-2xl font-bold text-gray-900 mt-1">
                                {statistics.today_returns}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                                {parseFloat(statistics.today_amount.toString()).toFixed(2)} ₼
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="text-sm text-gray-600">{t('returns.statistics.totalReturns')}</div>
                            <div className="text-2xl font-bold text-gray-900 mt-1">
                                {statistics.total_returns}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                                {parseFloat(statistics.total_amount.toString()).toFixed(2)} ₼
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="text-sm text-gray-600">{t('average')}</div>
                            <div className="text-2xl font-bold text-gray-900 mt-1">
                                {statistics.total_returns > 0
                                    ? (parseFloat(statistics.total_amount.toString()) / statistics.total_returns).toFixed(2)
                                    : '0.00'
                                } ₼
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 flex items-center justify-center">
                            <button
                                onClick={handleTodayFilter}
                                className={`w-full px-4 py-2 text-sm font-medium rounded-md ${
                                    isTodaySelected()
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                {t('returns.filters.todayReturns')}
                            </button>
                        </div>
                    </div>

                    {/* Data Table */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <SharedDataTable
                            columns={columns}
                            data={{
                                data: returns.data,
                                links: returns.links,
                                current_page: returns.meta?.current_page || 1,
                                last_page: returns.meta?.last_page || 1,
                                total: returns.meta?.total || 0,
                                per_page: returns.meta?.per_page || 20,
                                from: returns.meta?.from || 0,
                                to: returns.meta?.to || 0,
                            }}
                            filters={tableFilters}
                            actions={actions}
                            searchValue={searchInput}
                            onSearch={() => {}}
                            onSearchChange={handleSearchInput}
                            searchPlaceholder={t('returns.searchPlaceholder')}
                            fullWidth={true}
                        />
                    </div>
                </div>
            </div>

            {/* Return Modal */}
            <ReturnModal
                show={returnModalOpen}
                onClose={() => setReturnModalOpen(false)}
            />
        </AuthenticatedLayout>
    );
}
