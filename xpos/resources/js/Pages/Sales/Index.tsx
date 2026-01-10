import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SharedDataTable, { Filter, Column, Action, BulkAction } from '@/Components/SharedDataTable';
import PrimaryButton from '@/Components/PrimaryButton';
import DailySalesSummary from '@/Components/DailySalesSummary';
import { EyeIcon, PencilIcon, PlusCircleIcon, PrinterIcon, TrashIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { Sale, PageProps } from '@/types';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

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
        show_deleted?: string | boolean;
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
    discountsEnabled?: boolean;
    giftCardsEnabled?: boolean;
    canDeleteSales: boolean;
}

export default function Index({ auth, sales, filters, branches, dailySummary, summaryDate, discountsEnabled, giftCardsEnabled, canDeleteSales = false }: SalesIndexProps) {
    const { t } = useTranslation('sales');
    const [localFilters, setLocalFilters] = useState(filters);
    const [searchInput, setSearchInput] = useState(filters.search || '');
    const [selectedSummaryDate, setSelectedSummaryDate] = useState(summaryDate);

    console.log('canDeleteSales:', canDeleteSales, 'User role:', auth.user?.role);
    console.log('Show deleted filter:', localFilters.show_deleted);
    console.log('Sales data:', sales.data.map(s => ({
        id: s.sale_id,
        number: s.sale_number,
        deleted: !!s.deleted_at,
        deleted_at: s.deleted_at
    })));

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

    const handleSearch = () => {
        const newFilters = { ...localFilters, search: searchInput };
        setLocalFilters(newFilters);
        router.get(route('sales.index'), newFilters, {
            preserveState: true,
            preserveScroll: true,
        });
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
        // Toggle: if today is already selected, clear the date filters
        const newFilters = isTodaySelected()
            ? { ...localFilters, date_from: undefined, date_to: undefined }
            : { ...localFilters, date_from: today, date_to: today };
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
            label: t('orderNumber'),
            sortable: true,
            render: (sale: Sale) => (
                <div className="flex items-center gap-2">
                    <Link
                        href={route('sales.show', sale.sale_id)}
                        className="text-slate-600 hover:text-slate-800 font-medium"
                    >
                        {sale.sale_number}
                    </Link>
                    {sale.deleted_at && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            Silinib
                        </span>
                    )}
                </div>
            ),
        },
        {
            key: 'branch.name',
            label: t('branch'),
            sortable: true,
            render: (sale: Sale) => sale.branch?.name,
        },
        {
            key: 'customer.name',
            label: t('fields.customer'),
            sortable: true,
            render: (sale: Sale) => sale.customer?.name || t('anonymous'),
        },
        {
            key: 'total',
            label: t('totalAmount'),
            sortable: true,
            render: (sale: Sale) => `${sale.total} ₼`,
            className: 'text-right font-semibold',
        },
        {
            key: 'payment_info',
            label: t('payment'),
            sortable: true,
            render: (sale: Sale) => (
                <div className="text-right space-y-1">
                    <div className="font-semibold text-sm">
                        {sale.total} ₼
                    </div>
                    <div>
                        {sale.payment_status === 'credit' || sale.payment_status === 'partial' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                {sale.payment_status === 'credit' ? t('paymentStatus.credit') : t('paymentStatus.partial')}
                            </span>
                        ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {t('paymentStatus.paid')}
                            </span>
                        )}
                    </div>
                    {sale.customer_credit && sale.customer_credit.remaining_amount > 0 && (
                        <div className="text-xs text-red-600">
                            {Number(sale.customer_credit.remaining_amount || 0).toFixed(2)} ₼ {t('paymentStatus.debt')}
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: 'sale_date',
            label: t('saleDate'),
            sortable: true,
            render: (sale: Sale) => new Date(sale.sale_date).toLocaleDateString('az-AZ'),
        },
        {
            key: 'user.name',
            label: t('employee'),
            render: (sale: Sale) => sale.user?.name,
        },
    ];

    const filters_config: Filter[] = [
        {
            key: 'payment_status',
            label: t('filters.paymentStatus'),
            type: 'dropdown',
            options: [
                { value: '', label: t('filters.all') },
                { value: 'paid', label: t('paymentStatus.paid') },
                { value: 'partial', label: t('paymentStatus.partial') },
                { value: 'credit', label: t('paymentStatus.credit') },
            ],
            value: localFilters.payment_status || '',
            onChange: (value: string) => handleFilter('payment_status', value),
        },
        {
            key: 'branch_id',
            label: t('filters.branch'),
            type: 'dropdown',
            options: [
                { value: '', label: t('filters.all') },
                ...branches.map(branch => ({ value: branch.id.toString(), label: branch.name })),
            ],
            value: localFilters.branch_id || '',
            onChange: (value: string) => handleFilter('branch_id', value),
        },
        {
            key: 'date_from',
            label: t('filters.startDate'),
            type: 'date',
            value: localFilters.date_from || '',
            onChange: (value: string) => handleFilter('date_from', value),
        },
        {
            key: 'date_to',
            label: t('filters.endDate'),
            type: 'date',
            value: localFilters.date_to || '',
            onChange: (value: string) => handleFilter('date_to', value),
        },
    ];

    // Add show deleted filter only for account owners
    console.log('Adding deleted filter?', canDeleteSales);
    if (canDeleteSales) {
        console.log('YES - Adding deleted sales filter');
        filters_config.push({
            key: 'show_deleted',
            label: 'Silinmiş satışlar',
            type: 'dropdown',
            options: [
                { value: '', label: 'Aktiv satışlar' },
                { value: 'true', label: 'Silinmiş satışlar' },
            ],
            value: localFilters.show_deleted?.toString() || '',
            onChange: (value: string) => handleFilter('show_deleted', value),
        });
    }

    console.log('Final filters_config:', filters_config);

    const handleReprintFiscal = async (sale: Sale) => {
        if (!confirm(t('messages.confirmFiscalReprint', { saleNumber: sale.sale_number, fiscalNumber: sale.fiscal_number }))) {
            return;
        }

        try {
            const response = await axios.post('/fiscal-printer/print-last');
            if (response.data.success) {
                toast.success(response.data.message);
            } else {
                toast.error(response.data.message || t('messages.printFailed'));
            }
        } catch (error: any) {
            toast.error(t('messages.error') + (error.response?.data?.message || error.message));
        }
    };

    const handleDeleteSale = (sale: Sale) => {
        if (!confirm('Bu satışı silmək istədiyinizə əminsiniz? Stoklar bərpa ediləcək və məbləğ sistemdən çıxarılacaq.')) {
            return;
        }

        router.delete(route('sales.destroy', sale.sale_id), {
            onSuccess: () => {
                toast.success('Satış uğurla silindi');
            },
            onError: (errors: any) => {
                toast.error(errors[0] || 'Xəta baş verdi');
            },
        });
    };

    const handleRestoreSale = (sale: Sale) => {
        if (!confirm('Bu satışı bərpa etmək istədiyinizə əminsiniz? DIQQƏT: Stoklar avtomatik çıxarılmayacaq!')) {
            return;
        }

        router.post(route('sales.restore', sale.sale_id), {}, {
            onSuccess: () => {
                toast.success('Satış bərpa edildi');
            },
            onError: (errors: any) => {
                toast.error(errors[0] || 'Xəta baş verdi');
            },
        });
    };

    // Handle double-click to view sale
    const handleRowDoubleClick = (sale: Sale) => {
        router.visit(route('sales.show', sale.sale_id));
    };

    // Bulk delete handler
    const handleBulkDelete = (selectedIds: (string | number)[]) => {
        const confirmMessage = `Seçilmiş ${selectedIds.length} satışı silmək istədiyinizə əminsiniz?\n\nStoklar bərpa ediləcək və məbləğlər sistemdən çıxarılacaq.`;

        if (!confirm(confirmMessage)) {
            return;
        }

        router.post(route('sales.bulk-delete'), {
            ids: selectedIds
        }, {
            onSuccess: () => {
                toast.success('Seçilmiş satışlar uğurla silindi');
            },
            onError: (errors: any) => {
                toast.error('Xəta baş verdi');
            },
            preserveScroll: true
        });
    };

    // Bulk restore handler
    const handleBulkRestore = (selectedIds: (string | number)[]) => {
        const confirmMessage = `Seçilmiş ${selectedIds.length} satışı bərpa etmək istədiyinizə əminsiniz?\n\nDİQQƏT: Stoklar avtomatik çıxarılmayacaq!`;

        if (!confirm(confirmMessage)) {
            return;
        }

        router.post(route('sales.bulk-restore'), {
            ids: selectedIds
        }, {
            onSuccess: () => {
                toast.success('Seçilmiş satışlar bərpa edildi');
            },
            onError: (errors: any) => {
                toast.error('Xəta baş verdi');
            },
            preserveScroll: true
        });
    };

    // Determine which bulk actions to show based on the current filter
    const showingDeletedSales = localFilters.show_deleted === 'true' || localFilters.show_deleted === true;

    // Get bulk actions - these work on multiple selected rows
    const getBulkActions = (selectedIds: (string | number)[], selectedSales: Sale[]): BulkAction[] => {
        if (!canDeleteSales) return [];

        // If only ONE sale is selected, show individual actions
        if (selectedIds.length === 1 && selectedSales.length === 1) {
            const sale = selectedSales[0];
            const individualActions: BulkAction[] = [
                {
                    label: t('actions.view'),
                    icon: <EyeIcon className="w-4 h-4" />,
                    variant: 'view' as const,
                    onClick: () => router.visit(route('sales.show', sale.sale_id))
                },
                {
                    label: t('actions.edit'),
                    icon: <PencilIcon className="w-4 h-4" />,
                    variant: 'edit' as const,
                    onClick: () => router.visit(route('sales.edit', sale.sale_id)),
                    condition: () => sale.status !== 'refunded' && !sale.deleted_at
                },
            ];

            // Add fiscal print if available
            if (sale.fiscal_number && !sale.deleted_at) {
                individualActions.push({
                    label: t('fiscalPrint'),
                    icon: <PrinterIcon className="w-4 h-4" />,
                    variant: 'secondary' as const,
                    onClick: () => handleReprintFiscal(sale)
                });
            }

            // Add delete or restore based on sale status
            if (sale.deleted_at) {
                individualActions.push({
                    label: 'Bərpa et',
                    icon: <ArrowPathIcon className="w-4 h-4" />,
                    variant: 'secondary' as const,
                    onClick: () => handleRestoreSale(sale)
                });
            } else {
                individualActions.push({
                    label: 'Sil',
                    icon: <TrashIcon className="w-4 h-4" />,
                    variant: 'danger' as const,
                    onClick: () => handleDeleteSale(sale)
                });
            }

            return individualActions.filter(action => !action.condition || action.condition());
        }

        // Multiple sales selected - show bulk actions
        return showingDeletedSales
            ? [
                {
                    label: 'Bərpa et',
                    icon: <ArrowPathIcon className="w-4 h-4" />,
                    variant: 'secondary' as const,
                    onClick: handleBulkRestore
                }
            ]
            : [
                {
                    label: 'Sil',
                    icon: <TrashIcon className="w-4 h-4" />,
                    variant: 'danger' as const,
                    onClick: handleBulkDelete
                }
            ];
    };

    return (
        <AuthenticatedLayout>
            <Head title={t('title')} />
            <div className="py-12">
                <div className="w-full">
                    {/* Daily Summary Widget */}
                    <DailySalesSummary
                        summary={dailySummary}
                        selectedDate={selectedSummaryDate}
                        onDateChange={handleSummaryDateChange}
                    />

                    {/* Quick Filter Buttons */}
                    <div className="mb-4 flex gap-2">
                        <button
                            onClick={handleTodayFilter}
                            className={`inline-flex items-center px-4 py-2 border rounded-md font-semibold text-xs uppercase tracking-widest transition ease-in-out duration-150 ${
                                isTodaySelected()
                                    ? 'bg-slate-700 text-white border-blue-600 hover:bg-slate-600'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                            {t('todaySales')}
                        </button>

                        {/* Show Deleted Sales Button - Only for Account Owner */}
                        {canDeleteSales && (
                            <button
                                onClick={() => handleFilter('show_deleted', (localFilters.show_deleted === 'true' || localFilters.show_deleted === true) ? '' : 'true')}
                                className={`inline-flex items-center px-4 py-2 border rounded-md font-semibold text-xs uppercase tracking-widest transition ease-in-out duration-150 ${
                                    (localFilters.show_deleted === 'true' || localFilters.show_deleted === true)
                                        ? 'bg-red-600 text-white border-red-600 hover:bg-red-700'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                🗑️ {(localFilters.show_deleted === 'true' || localFilters.show_deleted === true) ? 'Silinmiš Satışlar' : 'Silinmiš Satışları Göstər'}
                            </button>
                        )}
                    </div>

                    {/* Deleted Sales Banner */}
                    {(localFilters.show_deleted === 'true' || localFilters.show_deleted === true) && (
                        <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-red-700 font-medium">
                                        🗑️ Silinmiş satışları görüntüləyirsiniz. Bərpa etmək üçün hər satışın yanındakı "Bərpa et" düyməsini klikləyin.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

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
                        selectable={canDeleteSales}
                        bulkActions={getBulkActions}
                        searchValue={searchInput}
                        searchPlaceholder={t('searchPlaceholder')}
                        emptyState={{
                            title: t('emptyState.title'),
                            description: t('emptyState.description')
                        }}
                        onSearchChange={(search: string) => handleSearchInput(search)}
                        onSearch={handleSearch}
                        onSort={(field: string) => handleSort(field, 'asc')}
                        fullWidth={true}
                        onRowDoubleClick={handleRowDoubleClick}
                        rowClassName={(sale: Sale) =>
                            `cursor-pointer hover:bg-blue-50 transition-all duration-200 ${
                                sale.deleted_at ? 'opacity-60 bg-red-50' : ''
                            }`
                        }
                        idField="sale_id"
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}