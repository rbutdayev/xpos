import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SharedDataTable, { Filter, Column, Action } from '@/Components/SharedDataTable';
import PrimaryButton from '@/Components/PrimaryButton';
import DailySalesSummary from '@/Components/DailySalesSummary';
import { EyeIcon, PencilIcon } from '@heroicons/react/24/outline';
import { Sale, PageProps } from '@/types';
import SalesNavigation from '@/Components/SalesNavigation';

interface SalesIndexProps extends PageProps {
    sales: {
        data: Sale[];
        links: any[];
        meta: any;
    };
    filters: {
        search?: string;
        payment_status?: string;
        status?: string;
        branch_id?: string;
        date_from?: string;
        date_to?: string;
        has_negative_stock?: boolean;
    };
    branches: Array<{
        id: number;
        name: string;
    }>;
    dailySummary: {
        today_total: number;
        today_count: number;
        cash_total: number;
        card_total: number;
        transfer_total: number;
        today_credit: number;
        yesterday_total: number;
        percentage_change: number;
        selected_date: string;
        previous_date: string;
    };
    summaryDate: string;
}

export default function Index({ auth, sales, filters, branches, dailySummary, summaryDate }: SalesIndexProps) {
    const [localFilters, setLocalFilters] = useState(filters);
    const [searchInput, setSearchInput] = useState(filters.search || '');
    const [selectedSummaryDate, setSelectedSummaryDate] = useState(summaryDate);

    // Debounced search effect
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            const newFilters = { ...localFilters, search: searchInput };
            setLocalFilters(newFilters);
            router.get(route('sales.index'), newFilters, {
                preserveState: true,
                preserveScroll: true,
            });
        }, 500); // 500ms debounce

        return () => clearTimeout(timeoutId);
    }, [searchInput]);

    const handleSearchInput = (search: string) => {
        setSearchInput(search);
    };

    const handleFilter = (key: string, value: any) => {
        const newFilters = { ...localFilters, [key]: value };
        setLocalFilters(newFilters);
        router.get(route('sales.index'), newFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSort = (field: string, direction: 'asc' | 'desc') => {
        router.get(route('sales.index'), { ...localFilters, sort: field, direction }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleTodayFilter = () => {
        const today = new Date().toISOString().split('T')[0];
        const newFilters = { ...localFilters, date_from: today, date_to: today };
        setLocalFilters(newFilters);
        router.get(route('sales.index'), newFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const isTodaySelected = () => {
        const today = new Date().toISOString().split('T')[0];
        return localFilters.date_from === today && localFilters.date_to === today;
    };

    const handleSummaryDateChange = (date: string) => {
        setSelectedSummaryDate(date);
        router.get(route('sales.index'), { ...localFilters, summary_date: date }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const columns: Column[] = [
        {
            key: 'sale_number',
            label: 'Sifariş №',
            sortable: true,
            render: (sale: Sale) => (
                <Link 
                    href={route('sales.show', sale.sale_id)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                >
                    {sale.sale_number}
                </Link>
            ),
        },
        {
            key: 'branch.name',
            label: 'Filial',
            sortable: true,
            render: (sale: Sale) => sale.branch?.name,
        },
        {
            key: 'customer.name',
            label: 'Müştəri',
            sortable: true,
            render: (sale: Sale) => sale.customer?.name || 'Anonim',
        },
        {
            key: 'total',
            label: 'Cəmi məbləğ',
            sortable: true,
            render: (sale: Sale) => `${sale.total} ₼`,
            className: 'text-right font-semibold',
        },
        {
            key: 'payment_info',
            label: 'Ödəniş',
            sortable: true,
            render: (sale: Sale) => (
                <div className="text-right space-y-1">
                    <div className="font-semibold text-sm">
                        {sale.total} ₼
                    </div>
                    <div>
                        {sale.payment_status === 'credit' || sale.payment_status === 'partial' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                {sale.payment_status === 'credit' ? 'Borc' : 'Qismən'}
                            </span>
                        ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Ödənilib
                            </span>
                        )}
                    </div>
                    {sale.customer_credit && sale.customer_credit.remaining_amount > 0 && (
                        <div className="text-xs text-red-600">
                            {Number(sale.customer_credit.remaining_amount || 0).toFixed(2)} ₼ borc
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: 'has_negative_stock',
            label: 'Stok',
            render: (sale: Sale) => sale.has_negative_stock ? (
                <span className="text-red-600 text-xs">⚠️ Mənfi</span>
            ) : (
                <span className="text-green-600 text-xs">✓ Normal</span>
            ),
        },
        {
            key: 'sale_date',
            label: 'Satış tarixi',
            sortable: true,
            render: (sale: Sale) => new Date(sale.sale_date).toLocaleDateString('az-AZ'),
        },
        {
            key: 'user.name',
            label: 'İşçi',
            render: (sale: Sale) => sale.user?.name,
        },
    ];

    const filters_config: Filter[] = [
        {
            key: 'payment_status',
            label: 'Ödəniş statusu',
            type: 'dropdown',
            options: [
                { value: '', label: 'Hamısı' },
                { value: 'paid', label: 'Ödənilib' },
                { value: 'partial', label: 'Qismən ödənilib' },
                { value: 'credit', label: 'Borc' },
            ],
            value: localFilters.payment_status || '',
            onChange: (value: string) => handleFilter('payment_status', value),
        },
        {
            key: 'branch_id',
            label: 'Filial',
            type: 'dropdown',
            options: [
                { value: '', label: 'Hamısı' },
                ...branches.map(branch => ({ value: branch.id.toString(), label: branch.name })),
            ],
            value: localFilters.branch_id || '',
            onChange: (value: string) => handleFilter('branch_id', value),
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
        {
            key: 'has_negative_stock',
            label: 'Mənfi stok',
            type: 'dropdown',
            options: [
                { value: '', label: 'Hamısı' },
                { value: 'true', label: 'Mənfi stoklu' },
                { value: 'false', label: 'Normal stoklu' },
            ],
            value: localFilters.has_negative_stock?.toString() || '',
            onChange: (value: string) => handleFilter('has_negative_stock', value),
        },
    ];

    const actions: Action[] = [
        {
            label: 'Bax',
            href: (sale: Sale) => route('sales.show', sale.sale_id),
            variant: 'view',
            icon: <EyeIcon className="w-4 h-4" />,
        },
        {
            label: 'Düzəliş et',
            href: (sale: Sale) => route('sales.edit', sale.sale_id),
            variant: 'edit',
            icon: <PencilIcon className="w-4 h-4" />,
            condition: (sale: Sale) => sale.status !== 'refunded', // Allow edit for all except refunded
        },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Satışlar" />
            <div className="mx-auto sm:px-6 lg:px-8 mb-6">
                <SalesNavigation />
            </div>
            <div className="py-12">
                <div className="w-full">
                    {/* Daily Summary Widget */}
                    <DailySalesSummary
                        summary={dailySummary}
                        selectedDate={selectedSummaryDate}
                        onDateChange={handleSummaryDateChange}
                    />

                    {/* Today Quick Filter Button */}
                    <div className="mb-4">
                        <button
                            onClick={handleTodayFilter}
                            className={`inline-flex items-center px-4 py-2 border rounded-md font-semibold text-xs uppercase tracking-widest transition ease-in-out duration-150 ${
                                isTodaySelected()
                                    ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                            Bugünkü Satışlar
                        </button>
                    </div>

                    <SharedDataTable
                        data={{
                            data: sales.data,
                            links: sales.links,
                            current_page: sales.meta?.current_page || 1,
                            last_page: sales.meta?.last_page || 1,
                            total: sales.meta?.total || 0,
                            per_page: sales.meta?.per_page || 15,
                            from: sales.meta?.from || 0,
                            to: sales.meta?.to || 0
                        }}
                        columns={columns}
                        filters={filters_config}
                        actions={actions}
                        searchValue={searchInput}
                        searchPlaceholder="Sifariş nömrəsi, müştəri adı və ya telefonu axtar..."
                        emptyState={{
                            title: "Heç bir satış tapılmadı",
                            description: "Hələ ki heç bir satış edilməyib."
                        }}
                        onSearchChange={(search: string) => handleSearchInput(search)}
                        onSort={(field: string) => handleSort(field, 'asc')}
                        fullWidth={true}

                        mobileClickable={true}

                        hideMobileActions={true}
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}