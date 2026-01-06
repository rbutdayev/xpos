import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useState, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
    MagnifyingGlassIcon,
    FunnelIcon,
    XMarkIcon,
    PhoneIcon,
    ClockIcon,
    CheckCircleIcon,
    TruckIcon,
    XCircleIcon,
    PencilIcon,
    EyeIcon,
    TrashIcon
} from '@heroicons/react/24/outline';
import SharedDataTable, { BulkAction } from '@/Components/SharedDataTable';

interface Sale {
    sale_id: number;
    sale_number: string;
    customer_name: string | null;
    customer_phone: string | null;
    total: number | string;
    status: 'pending' | 'completed' | 'cancelled' | 'refunded';
    sale_date: string;
    notes: string | null;
    created_at: string;
    items: SaleItem[];
    source?: 'shop' | 'wolt' | 'yango' | 'bolt';
    platform_order_id?: string | null;
}

interface SaleItem {
    item_id: number;
    product_id: number;
    variant_id?: number | null;
    quantity: number | string;
    unit_price: number | string;
    total: number | string;
    product: {
        id: number;
        name: string;
        sku?: string;
        barcode?: string;
    };
    variant?: {
        id: number;
        size?: string | null;
        color?: string | null;
    } | null;
}

interface PaginatedSales {
    data: Sale[];
    links: any[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface FiscalConfig {
    id: number;
    provider: string;
    name: string;
    shift_open: boolean;
    shift_opened_at: string | null;
    last_z_report_at: string | null;
    credit_contract_number?: string;
}

interface Props {
    orders: PaginatedSales;
    filters: {
        search?: string;
        status?: string;
        source?: string;
        date_from?: string;
        date_to?: string;
    };
    statusCounts: {
        pending?: number;
        completed?: number;
        cancelled?: number;
    };
    fiscalPrinterEnabled?: boolean;
    fiscalConfig?: FiscalConfig | null;
}

export default function Index({ orders, filters, statusCounts, fiscalPrinterEnabled = false, fiscalConfig }: Props) {
    const { t } = useTranslation('orders') as { t: (key: string) => string };
    const [search, setSearch] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState<string>(filters.status || '');
    const [selectedSource, setSelectedSource] = useState<string>(filters.source || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');
    const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
    const [statusModalOrder, setStatusModalOrder] = useState<Sale | null>(null);
    const [newStatus, setNewStatus] = useState<string>('');
    const [statusNotes, setStatusNotes] = useState('');
    const [useFiscalPrinter, setUseFiscalPrinter] = useState(true);

    const handleSearch = () => {
        router.get('/online-orders', {
            search,
            status: selectedStatus,
            source: selectedSource,
            date_from: dateFrom,
            date_to: dateTo,
        }, {
            preserveState: true,
        });
    };

    const handleReset = () => {
        setSearch('');
        setSelectedStatus('');
        setSelectedSource('');
        setDateFrom('');
        setDateTo('');
        router.get('/online-orders', {}, {
            preserveState: true,
        });
    };

    const handleStatusFilter = (status: string) => {
        router.get('/online-orders', {
            search,
            status: status === selectedStatus ? '' : status,
            source: selectedSource,
            date_from: dateFrom,
            date_to: dateTo,
        }, {
            preserveState: true,
        });
    };

    const handleSourceFilter = (source: string) => {
        setSelectedSource(source);
        router.get('/online-orders', {
            search,
            status: selectedStatus,
            source: source,
            date_from: dateFrom,
            date_to: dateTo,
        }, {
            preserveState: true,
        });
    };

    const handleStatusUpdate = () => {
        if (!statusModalOrder || !newStatus) return;

        router.patch(`/online-orders/${statusModalOrder.sale_id}/status`, {
            status: newStatus,
            notes: statusNotes,
            use_fiscal_printer: useFiscalPrinter,
        }, {
            onSuccess: () => {
                setStatusModalOrder(null);
                setNewStatus('');
                setStatusNotes('');
                setUseFiscalPrinter(true);
            },
        });
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            pending: { color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon, label: 'Gözləyir' },
            completed: { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon, label: 'Tamamlandı' },
            cancelled: { color: 'bg-red-100 text-red-800', icon: XCircleIcon, label: 'Ləğv edilib' },
        };

        const badge = badges[status as keyof typeof badges] || badges.pending;
        const Icon = badge.icon;

        return (
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
                <Icon className="w-4 h-4" />
                {badge.label}
            </span>
        );
    };

    const getSourceBadge = (source?: string) => {
        if (!source) return null;

        const badges = {
            shop: {
                color: 'bg-green-100 text-green-800 border-green-200',
                label: t('source.shop')
            },
            wolt: {
                color: 'bg-purple-100 text-purple-800 border-purple-200',
                label: t('source.wolt')
            },
            yango: {
                color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                label: t('source.yango')
            },
            bolt: {
                color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                label: t('source.bolt')
            },
        };

        const badge = badges[source as keyof typeof badges];
        if (!badge) return null;

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badge.color}`}>
                {badge.label}
            </span>
        );
    };

    // Handle double-click to view order
    const handleRowDoubleClick = (order: Sale) => {
        router.visit(`/sales/${order.sale_id}`);
    };

    // Handle bulk actions
    const handleBulkStatusUpdate = (selectedIds: (string | number)[], status: string) => {
        const statusLabels = {
            pending: 'Gözləyir',
            completed: 'Tamamlandı',
            cancelled: 'Ləğv edilib'
        };
        const statusLabel = statusLabels[status as keyof typeof statusLabels];
        const confirmMessage = `${selectedIds.length} sifarişin statusunu "${statusLabel}" olaraq dəyişmək istədiyinizdən əminsiniz?`;

        if (confirm(confirmMessage)) {
            router.patch('/online-orders/bulk-status', {
                ids: selectedIds,
                status: status
            }, {
                onError: (errors) => {
                    alert('Xəta baş verdi: Status dəyişdirilə bilmədi');
                },
                preserveScroll: true
            });
        }
    };

    const handleBulkCancel = (selectedIds: (string | number)[]) => {
        const confirmMessage = `${selectedIds.length} sifarişi ləğv etmək istədiyinizdən əminsiniz?`;

        if (confirm(confirmMessage)) {
            router.delete('/online-orders/bulk-cancel', {
                data: { ids: selectedIds },
                onError: (errors) => {
                    alert('Xəta baş verdi: Sifarişlər ləğv edilə bilmədi');
                },
                preserveScroll: true
            });
        }
    };

    // Get bulk actions - dynamic based on selection
    const getBulkActions = (selectedIds: (string | number)[], selectedOrders: Sale[]): BulkAction[] => {
        // If only ONE order is selected, show individual actions
        if (selectedIds.length === 1 && selectedOrders.length === 1) {
            const order = selectedOrders[0];

            return [
                {
                    label: 'Ətraflı',
                    icon: <EyeIcon className="w-4 h-4" />,
                    variant: 'view' as const,
                    onClick: () => router.visit(`/sales/${order.sale_id}`)
                },
                {
                    label: 'Status Dəyiş',
                    icon: <PencilIcon className="w-4 h-4" />,
                    variant: 'edit' as const,
                    onClick: () => {
                        setStatusModalOrder(order);
                        setNewStatus(order.status);
                    }
                },
                {
                    label: 'Ləğv et',
                    icon: <XCircleIcon className="w-4 h-4" />,
                    variant: 'danger' as const,
                    onClick: () => handleBulkCancel([order.sale_id])
                }
            ];
        }

        // Multiple orders selected - show bulk actions
        return [
            {
                label: 'Gözləyir',
                icon: <ClockIcon className="w-4 h-4" />,
                variant: 'secondary' as const,
                onClick: (selectedIds: (string | number)[]) => handleBulkStatusUpdate(selectedIds, 'pending')
            },
            {
                label: 'Tamamlandı',
                icon: <CheckCircleIcon className="w-4 h-4" />,
                variant: 'success' as const,
                onClick: (selectedIds: (string | number)[]) => handleBulkStatusUpdate(selectedIds, 'completed')
            },
            {
                label: 'Ləğv et',
                icon: <XCircleIcon className="w-4 h-4" />,
                variant: 'danger' as const,
                onClick: handleBulkCancel
            }
        ];
    };

    // Table columns configuration
    const columns = [
        {
            key: 'sale_number',
            label: 'Sifariş №',
            render: (order: Sale) => (
                <div className="font-medium text-gray-900">
                    #{order.sale_number}
                </div>
            )
        },
        {
            key: 'customer_info',
            label: 'Müştəri',
            render: (order: Sale) => (
                <div>
                    <div className="font-medium text-gray-900">{order.customer_name || 'N/A'}</div>
                    {order.customer_phone && (
                        <a
                            href={`tel:${order.customer_phone}`}
                            className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <PhoneIcon className="w-3 h-3" />
                            {order.customer_phone}
                        </a>
                    )}
                </div>
            )
        },
        {
            key: 'source',
            label: 'Mənbə',
            render: (order: Sale) => getSourceBadge(order.source)
        },
        {
            key: 'items_count',
            label: 'Məhsul',
            align: 'center' as const,
            render: (order: Sale) => (
                <div className="text-sm text-gray-600">
                    {order.items.length} məhsul
                </div>
            )
        },
        {
            key: 'total',
            label: 'Məbləğ',
            align: 'right' as const,
            render: (order: Sale) => (
                <div className="font-bold text-gray-900">
                    {Number(order.total).toFixed(2)} ₼
                </div>
            )
        },
        {
            key: 'status',
            label: 'Status',
            align: 'center' as const,
            render: (order: Sale) => getStatusBadge(order.status)
        },
        {
            key: 'sale_date',
            label: 'Tarix',
            render: (order: Sale) => (
                <div className="text-sm text-gray-600">
                    {new Date(order.sale_date).toLocaleDateString('az-AZ', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </div>
            )
        }
    ];

    // Table filters configuration
    const tableFilters = [
        {
            key: 'source',
            type: 'dropdown' as const,
            label: 'Mənbə',
            value: selectedSource,
            onChange: setSelectedSource,
            options: [
                { value: '', label: t('source.all') },
                { value: 'shop', label: t('source.shop') },
                { value: 'wolt', label: t('source.wolt') },
                { value: 'yango', label: t('source.yango') },
                { value: 'bolt', label: t('source.bolt') }
            ]
        },
        {
            key: 'date_from',
            type: 'date' as const,
            label: 'Tarixdən',
            value: dateFrom,
            onChange: setDateFrom
        },
        {
            key: 'date_to',
            type: 'date' as const,
            label: 'Tarixə',
            value: dateTo,
            onChange: setDateTo
        }
    ];

    return (
        <AuthenticatedLayout
        >
            <Head title="Online Sifarişlər" />

            <div className="py-6">
                <div className="px-4 sm:px-6 lg:px-8">
                    {/* Status Tabs */}
                    <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-200">
                            <button
                                onClick={() => handleStatusFilter('')}
                                className={`px-6 py-4 text-center hover:bg-gray-50 transition-colors ${
                                    !selectedStatus ? 'bg-indigo-50 border-b-2 border-indigo-600' : ''
                                }`}
                            >
                                <div className="text-2xl font-bold text-gray-900">{orders.total}</div>
                                <div className="text-sm text-gray-600 mt-1">Hamısı</div>
                            </button>
                            <button
                                onClick={() => handleStatusFilter('pending')}
                                className={`px-6 py-4 text-center hover:bg-gray-50 transition-colors ${
                                    selectedStatus === 'pending' ? 'bg-yellow-50 border-b-2 border-yellow-600' : ''
                                }`}
                            >
                                <div className="text-2xl font-bold text-yellow-600">{statusCounts.pending || 0}</div>
                                <div className="text-sm text-gray-600 mt-1">Gözləyir</div>
                            </button>
                            <button
                                onClick={() => handleStatusFilter('completed')}
                                className={`px-6 py-4 text-center hover:bg-gray-50 transition-colors ${
                                    selectedStatus === 'completed' ? 'bg-green-50 border-b-2 border-green-600' : ''
                                }`}
                            >
                                <div className="text-2xl font-bold text-green-600">{statusCounts.completed || 0}</div>
                                <div className="text-sm text-gray-600 mt-1">Tamamlandı</div>
                            </button>
                            <button
                                onClick={() => handleStatusFilter('cancelled')}
                                className={`px-6 py-4 text-center hover:bg-gray-50 transition-colors ${
                                    selectedStatus === 'cancelled' ? 'bg-red-50 border-b-2 border-red-600' : ''
                                }`}
                            >
                                <div className="text-2xl font-bold text-red-600">{statusCounts.cancelled || 0}</div>
                                <div className="text-sm text-gray-600 mt-1">Ləğv edilib</div>
                            </button>
                        </div>
                    </div>

                    {/* Orders Table */}
                    <SharedDataTable
                        data={orders}
                        columns={columns}
                        selectable={true}
                        bulkActions={getBulkActions}
                        searchValue={search}
                        onSearchChange={setSearch}
                        searchPlaceholder="Sifariş №, müştəri adı, telefon..."
                        filters={tableFilters}
                        onSearch={handleSearch}
                        onReset={handleReset}
                        emptyState={{
                            icon: <XCircleIcon className="w-12 h-12" />,
                            title: 'Sifariş tapılmadı',
                            description: 'Heç bir sifariş mövcud deyil'
                        }}
                        fullWidth={true}
                        dense={false}
                        idField="sale_id"
                        onRowDoubleClick={handleRowDoubleClick}
                        rowClassName={(order: Sale) =>
                            `cursor-pointer hover:bg-blue-50 transition-all duration-200`
                        }
                    />
                </div>
            </div>

            {/* Status Update Modal */}
            {statusModalOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <h3 className="text-xl font-bold mb-4">Status Yenilə</h3>
                        <div className="mb-4">
                            <p className="text-sm text-gray-600 mb-2">Sifariş: #{statusModalOrder.sale_number}</p>
                            <select
                                value={newStatus}
                                onChange={(e) => setNewStatus(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            >
                                <option value="pending">Gözləyir</option>
                                <option value="completed">Tamamlandı (Stok çıxılacaq)</option>
                                <option value="cancelled">Ləğv edilib</option>
                            </select>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Qeyd (məcburi deyil)
                            </label>
                            <textarea
                                value={statusNotes}
                                onChange={(e) => setStatusNotes(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="Status dəyişikliyi haqqında qeyd..."
                            />
                        </div>

                        {/* Fiscal Printer Option - Show only when changing to 'completed' */}
                        {fiscalPrinterEnabled && newStatus === 'completed' && (
                            <div className="mb-4">
                                <div className="flex items-center">
                                    <input
                                        id="use_fiscal_printer_modal"
                                        type="checkbox"
                                        checked={useFiscalPrinter}
                                        onChange={(e) => setUseFiscalPrinter(e.target.checked)}
                                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                                    />
                                    <label htmlFor="use_fiscal_printer_modal" className="ml-2 text-sm text-gray-700">
                                        Fiskal çap
                                    </label>
                                </div>
                                <p className="text-xs text-gray-500 mt-1 ml-6">
                                    Sifariş tamamlandıqda fiskal printer vasitəsilə çek çap ediləcək
                                </p>
                            </div>
                        )}

                        <div className="flex gap-2">
                            <button
                                onClick={handleStatusUpdate}
                                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                Yadda saxla
                            </button>
                            <button
                                onClick={() => {
                                    setStatusModalOrder(null);
                                    setNewStatus('');
                                    setStatusNotes('');
                                    setUseFiscalPrinter(true);
                                }}
                                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Ləğv et
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
