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
    EyeIcon
} from '@heroicons/react/24/outline';

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
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
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
    const { t } = useTranslation() as { t: (key: string) => string };
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

    const handleSearch = (e: FormEvent) => {
        e.preventDefault();
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
                label: t('orders.source.shop')
            },
            wolt: {
                color: 'bg-purple-100 text-purple-800 border-purple-200',
                label: t('orders.source.wolt')
            },
            yango: {
                color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                label: t('orders.source.yango')
            },
            bolt: {
                color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                label: t('orders.source.bolt')
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

    return (
        <AuthenticatedLayout
        >
            <Head title="Online Sifarişlər" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

                    {/* Search and Filters */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                        <form onSubmit={handleSearch} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                <div className="md:col-span-2">
                                    <div className="relative">
                                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            placeholder="Sifariş №, müştəri adı, telefon..."
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <select
                                        value={selectedSource}
                                        onChange={(e) => handleSourceFilter(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    >
                                        <option value="">{t('orders.source.all')}</option>
                                        <option value="shop">{t('orders.source.shop')}</option>
                                        <option value="wolt">{t('orders.source.wolt')}</option>
                                        <option value="yango">{t('orders.source.yango')}</option>
                                        <option value="bolt">{t('orders.source.bolt')}</option>
                                    </select>
                                </div>
                                <div>
                                    <input
                                        type="date"
                                        value={dateFrom}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <input
                                        type="date"
                                        value={dateTo}
                                        onChange={(e) => setDateTo(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                >
                                    Axtar
                                </button>
                                {(search || dateFrom || dateTo || selectedStatus || selectedSource) && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearch('');
                                            setDateFrom('');
                                            setDateTo('');
                                            setSelectedSource('');
                                            router.get('/online-orders');
                                        }}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                    >
                                        Təmizlə
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* Orders List */}
                    <div className="space-y-4">
                        {orders.data.length === 0 ? (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                                <p className="text-gray-500">Sifariş tapılmadı</p>
                            </div>
                        ) : (
                            orders.data.map((order) => (
                                <div
                                    key={order.sale_id}
                                    className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                                >
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-lg font-semibold text-gray-900">
                                                        Sifariş #{order.sale_number}
                                                    </h3>
                                                    {getStatusBadge(order.status)}
                                                    {getSourceBadge(order.source)}
                                                </div>
                                                {order.platform_order_id && (
                                                    <div className="mb-2 text-xs text-gray-500">
                                                        <span className="font-semibold">{t('orders.source.platformOrderId')}:</span> {order.platform_order_id}
                                                    </div>
                                                )}
                                                <div className="space-y-1 text-sm text-gray-600">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">{order.customer_name}</span>
                                                        {order.customer_phone && (
                                                            <>
                                                                <span>•</span>
                                                                <a
                                                                    href={`tel:${order.customer_phone}`}
                                                                    className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700"
                                                                >
                                                                    <PhoneIcon className="w-4 h-4" />
                                                                    {order.customer_phone}
                                                                </a>
                                                            </>
                                                        )}
                                                    </div>
                                                    <div>
                                                        {new Date(order.sale_date).toLocaleDateString('az-AZ', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-bold text-gray-900">
                                                    {Number(order.total).toFixed(2)} ₼
                                                </div>
                                                <div className="text-sm text-gray-600 mt-1">
                                                    {order.items.length} məhsul
                                                </div>
                                            </div>
                                        </div>

                                        {/* Customer Notes */}
                                        {order.notes && (
                                            <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
                                                <div className="flex items-start gap-2">
                                                    <span className="text-amber-600 font-semibold text-sm">Müştəri qeydi:</span>
                                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{order.notes}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Items Preview */}
                                        <div className="mb-4 bg-gray-50 rounded-lg p-4">
                                            <div className="space-y-2">
                                                {order.items.slice(0, expandedOrder === order.sale_id ? undefined : 2).map((item) => (
                                                    <div key={item.item_id} className="space-y-1">
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-gray-700">
                                                                {item.product.name}
                                                                {item.variant && (
                                                                    <span className="text-gray-500">
                                                                        {' '}({item.variant.size} {item.variant.color})
                                                                    </span>
                                                                )}
                                                                {' '}× {item.quantity}
                                                            </span>
                                                            <span className="font-medium text-gray-900">
                                                                {Number(item.total).toFixed(2)} ₼
                                                            </span>
                                                        </div>
                                                        <div className="flex gap-4 text-xs text-gray-500">
                                                            {item.product.sku && (
                                                                <div className="font-mono">
                                                                    SKU: {item.product.sku}
                                                                </div>
                                                            )}
                                                            {item.product.barcode && (
                                                                <div className="font-mono">
                                                                    Barkod: {item.product.barcode}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            {order.items.length > 2 && expandedOrder !== order.sale_id && (
                                                <button
                                                    onClick={() => setExpandedOrder(order.sale_id)}
                                                    className="text-sm text-indigo-600 hover:text-indigo-700 mt-2"
                                                >
                                                    +{order.items.length - 2} məhsul daha
                                                </button>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    setStatusModalOrder(order);
                                                    setNewStatus(order.status);
                                                }}
                                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                                            >
                                                <PencilIcon className="w-4 h-4" />
                                                Status Dəyiş
                                            </button>
                                            <Link
                                                href={`/sales/${order.sale_id}`}
                                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
                                            >
                                                <EyeIcon className="w-4 h-4" />
                                                Ətraflı
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Pagination */}
                    {orders.last_page > 1 && (
                        <div className="mt-6 flex justify-center">
                            <div className="flex gap-2">
                                {Array.from({ length: orders.last_page }, (_, i) => i + 1).map((page) => (
                                    <Link
                                        key={page}
                                        href={`/online-orders?page=${page}`}
                                        className={`px-4 py-2 rounded-lg ${
                                            page === orders.current_page
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                                        }`}
                                    >
                                        {page}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
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
