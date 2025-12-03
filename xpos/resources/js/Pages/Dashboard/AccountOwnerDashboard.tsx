import { useState } from 'react';
import { Link } from '@inertiajs/react';
import {
    BanknotesIcon,
    CubeIcon,
    UserIcon,
    ShoppingCartIcon,
    WrenchScrewdriverIcon,
    TruckIcon,
    ExclamationTriangleIcon,
    CurrencyDollarIcon,
    ChartBarIcon,
    HomeModernIcon,
    DocumentTextIcon,
    ClockIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';
import { Line, Doughnut } from 'react-chartjs-2';
import { CompactKPICard } from '@/Components/Dashboard/KPICard';
import { QuickActionButton } from '@/Components/Dashboard/QuickActionButton';
import { SectionGroup } from '@/Components/Dashboard/SectionGroup';
import { formatChartDate } from '@/utils/dateFormatters';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('az-AZ', {
        style: 'currency',
        currency: 'AZN',
        minimumFractionDigits: 2,
    }).format(amount);
};

const formatNumber = (num: number, decimals: number = 0): string => {
    return new Intl.NumberFormat('az-AZ', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(num);
};

interface Props {
    financial: {
        revenue: { value: number; growth: number };
        expenses: { value: number; growth: number };
        profit: { value: number; growth: number; margin: number };
        pending_payments: { value: number; count: number };
    };
    operational: {
        active_customers: number;
        new_customers: number;
        products_in_stock: number;
        products_count: number;
        stock_value: {
            cost: number;
            sale: number;
            potential_profit: number;
        };
        stock_turnover: number;
    };
    services?: {
        pending: number;
        in_progress: number;
        completed_this_month: number;
        completed_growth: number;
        revenue: number;
        revenue_growth: number;
    };
    rentals?: {
        active: number;
        monthly_revenue: number;
        pending_returns: number;
        overdue: number;
    };
    alerts: {
        low_stock: number;
        out_of_stock: number;
        negative_stock: number;
        pending_goods_receipts: number;
    };
    online_orders: {
        pending: number;
    };
    credits: {
        total_outstanding: number;
        credits_given_this_month: number;
        payments_received_this_month: number;
        active_credit_customers: number;
    };
    stock_by_unit: Array<{
        unit: string;
        quantity: number;
        sku_count: number;
        value: number;
    }>;
    charts: {
        sales_trend: Array<{ date: string; sales_count: number; revenue: number }>;
        payment_methods: { labels: string[]; values: number[] };
        top_products: Array<{ id: number; name: string; total_sold: number; revenue: number }>;
        expense_breakdown: Array<{ category: string; amount: number }>;
    };
    tables: {
        recent_sales: Array<{
            id: number;
            customer: string;
            amount: number;
            date: string;
            time: string;
            status: string;
            items_count: number;
        }>;
        low_stock_products: Array<{
            id: number;
            name: string;
            current: number;
            min: number;
            unit: string;
            warehouse: string | null;
        }>;
    };
    account: {
        name: string;
        modules: {
            services_enabled: boolean;
            rentals_enabled: boolean;
            shop_enabled: boolean;
        };
    };
    payment_alert?: {
        amount: number;
        due_date: string;
        days_overdue: number;
    } | null;
}

export default function AccountOwnerDashboard({
    financial,
    operational,
    services,
    rentals,
    alerts,
    online_orders,
    credits,
    stock_by_unit,
    charts,
    tables,
    account,
    payment_alert,
}: Props) {
    const [showPaymentAlert, setShowPaymentAlert] = useState(!!payment_alert);

    // Sales trend chart
    const salesChartData = {
        labels: charts.sales_trend.map(d => formatChartDate(d.date)),
        datasets: [{
            label: 'Gəlir',
            data: charts.sales_trend.map(d => d.revenue),
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4,
        }],
    };

    // Payment methods chart
    const paymentMethodsData = {
        labels: charts.payment_methods.labels,
        datasets: [{
            data: charts.payment_methods.values,
            backgroundColor: [
                'rgba(34, 197, 94, 0.8)',
                'rgba(59, 130, 246, 0.8)',
                'rgba(168, 85, 247, 0.8)',
            ],
        }],
    };

    return (
        <div className="space-y-3 sm:space-y-4">
            {/* Payment Alert Modal */}
            {showPaymentAlert && payment_alert && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
                        <div className="text-center">
                            <div className="bg-red-100 rounded-full p-3 inline-block mb-4">
                                <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Ödəniş Gecikib</h3>
                            <p className="text-gray-700 mb-4">Aylıq ödənişiniz gecikib.</p>
                            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                                <p className="text-sm text-gray-600">Məbləğ:</p>
                                <p className="text-2xl font-bold text-red-600">{payment_alert.amount} ₼</p>
                                <p className="text-sm text-gray-600 mt-2">Son tarix:</p>
                                <p className="text-lg font-semibold">{payment_alert.due_date}</p>
                                <p className="text-sm text-red-600 mt-1">{payment_alert.days_overdue} gün gecikib</p>
                            </div>
                            <button
                                onClick={() => setShowPaymentAlert(false)}
                                className="w-full bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700"
                            >
                                Başa Düşdüm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Online Orders Alert */}
            {account.modules.shop_enabled && online_orders.pending > 0 && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div className="flex items-center">
                        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-3" />
                        <p className="text-sm font-medium text-yellow-800">
                            <span className="font-bold">{online_orders.pending}</span> gözləyən online sifariş.{' '}
                            <Link href="/online-orders" className="underline hover:text-yellow-900">
                                Baxın
                            </Link>
                        </p>
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
                <QuickActionButton
                    href={route('pos.index')}
                    icon={<ShoppingCartIcon />}
                    title="Yeni Satış"
                    variant="primary"
                />
                {account.modules.services_enabled && (
                    <QuickActionButton
                        href={route('pos.index', { mode: 'service' })}
                        icon={<WrenchScrewdriverIcon />}
                        title="Yeni Servis"
                        variant="success"
                    />
                )}
                <QuickActionButton
                    href="/customers/create"
                    icon={<UserIcon />}
                    title="Yeni Müştəri"
                    variant="primary"
                />
                <QuickActionButton
                    href="/products/create"
                    icon={<CubeIcon />}
                    title="Yeni Məhsul"
                    variant="primary"
                />
                <QuickActionButton
                    href="/goods-receipts/create"
                    icon={<TruckIcon />}
                    title="Mal Qəbulu"
                    variant="success"
                />
            </div>

            {/* Financial KPIs */}
            <SectionGroup title="Maliyyə İcmalı" icon={<BanknotesIcon />} variant="highlight">
                <CompactKPICard
                    title="Bu Ay Gəlir"
                    value={formatCurrency(financial.revenue.value)}
                    icon={<BanknotesIcon />}
                    variant="success"
                    trend={{ value: Math.abs(financial.revenue.growth), isPositive: financial.revenue.growth >= 0 }}
                />
                <CompactKPICard
                    title="Bu Ay Xərclər"
                    value={formatCurrency(financial.expenses.value)}
                    icon={<DocumentTextIcon />}
                    variant="warning"
                    trend={{ value: Math.abs(financial.expenses.growth), isPositive: financial.expenses.growth < 0 }}
                />
                <CompactKPICard
                    title="Mənfəət"
                    value={formatCurrency(financial.profit.value)}
                    icon={<ArrowTrendingUpIcon />}
                    variant="success"
                    subtitle={`${financial.profit.margin}% margin`}
                />
                <CompactKPICard
                    title="Gözləyən Ödəniş"
                    value={formatCurrency(financial.pending_payments.value)}
                    icon={<ClockIcon />}
                    variant="warning"
                    subtitle={`${financial.pending_payments.count} müştəri`}
                />
            </SectionGroup>

            {/* Operational Metrics */}
            <SectionGroup title="Əməliyyat Göstəriciləri" icon={<ChartBarIcon />}>
                <CompactKPICard
                    title="Aktiv Müştərilər"
                    value={operational.active_customers}
                    icon={<UserIcon />}
                    variant="primary"
                    subtitle={`+${operational.new_customers} bu ay`}
                />
                <CompactKPICard
                    title="Stokda Məhsul"
                    value={operational.products_in_stock}
                    icon={<CubeIcon />}
                    variant="primary"
                    subtitle={`${operational.products_count} ümumi`}
                />
                <CompactKPICard
                    title="Stok Dəyəri"
                    value={formatCurrency(operational.stock_value.cost)}
                    icon={<BanknotesIcon />}
                    variant="primary"
                    subtitle="Maya dəyəri"
                />
            </SectionGroup>

            {/* Services (if enabled) */}
            {account.modules.services_enabled && services && (
                <SectionGroup title="Servis Statistikası" icon={<WrenchScrewdriverIcon />}>
                    <CompactKPICard
                        title="Gözləyən"
                        value={services.pending}
                        icon={<ClockIcon />}
                        variant="warning"
                    />
                    <CompactKPICard
                        title="İcrada"
                        value={services.in_progress}
                        icon={<WrenchScrewdriverIcon />}
                        variant="primary"
                    />
                    <CompactKPICard
                        title="Tamamlanan"
                        value={services.completed_this_month}
                        icon={<ArrowTrendingUpIcon />}
                        variant="success"
                        trend={{ value: Math.abs(services.completed_growth), isPositive: services.completed_growth >= 0 }}
                    />
                    <CompactKPICard
                        title="Gəlir"
                        value={formatCurrency(services.revenue)}
                        icon={<BanknotesIcon />}
                        variant="success"
                        trend={{ value: Math.abs(services.revenue_growth), isPositive: services.revenue_growth >= 0 }}
                    />
                </SectionGroup>
            )}

            {/* Rentals (if enabled) */}
            {account.modules.rentals_enabled && rentals && (
                <SectionGroup title="İcarə Statistikası" icon={<HomeModernIcon />}>
                    <CompactKPICard
                        title="Aktiv İcarələr"
                        value={rentals.active}
                        icon={<CubeIcon />}
                        variant="primary"
                    />
                    <CompactKPICard
                        title="Bu Ay Gəlir"
                        value={formatCurrency(rentals.monthly_revenue)}
                        icon={<CurrencyDollarIcon />}
                        variant="success"
                    />
                    <CompactKPICard
                        title="Gözlənilən Qaytarmalar"
                        value={rentals.pending_returns}
                        icon={<ClockIcon />}
                        variant="warning"
                    />
                    <CompactKPICard
                        title="Gecikmiş"
                        value={rentals.overdue}
                        icon={<ExclamationTriangleIcon />}
                        variant="danger"
                    />
                </SectionGroup>
            )}

            {/* Stock Alerts */}
            {(alerts.low_stock > 0 || alerts.out_of_stock > 0 || alerts.negative_stock > 0) && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {alerts.low_stock > 0 && (
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-3">
                            <div className="flex items-center">
                                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2" />
                                <div>
                                    <p className="text-xs font-medium text-yellow-800">Az Stok</p>
                                    <p className="text-xl font-bold text-yellow-900">{alerts.low_stock}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    {alerts.out_of_stock > 0 && (
                        <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-3">
                            <div className="flex items-center">
                                <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
                                <div>
                                    <p className="text-xs font-medium text-red-800">Tükənmiş</p>
                                    <p className="text-xl font-bold text-red-900">{alerts.out_of_stock}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    {alerts.negative_stock > 0 && (
                        <div className="bg-purple-50 border-l-4 border-purple-400 rounded-lg p-3">
                            <div className="flex items-center">
                                <ExclamationTriangleIcon className="h-5 w-5 text-purple-600 mr-2" />
                                <div>
                                    <p className="text-xs font-medium text-purple-800">Mənfi Stok</p>
                                    <p className="text-xl font-bold text-purple-900">{alerts.negative_stock}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-4">
                    <h3 className="text-lg font-semibold mb-4">Satış Statistikası</h3>
                    <div className="h-64">
                        <Line
                            data={salesChartData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: { y: { beginAtZero: true } },
                            }}
                        />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-4">
                    <h3 className="text-lg font-semibold mb-4">Ödəniş Üsulları</h3>
                    <div className="h-64 flex items-center justify-center">
                        <Doughnut
                            data={paymentMethodsData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { position: 'bottom' } },
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Top Products */}
                <div className="bg-white rounded-lg shadow-sm p-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Ən Çox Satılan</h3>
                        <Link href="/products" className="text-sm text-blue-600 hover:text-blue-700">
                            Hamısını gör
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {charts.top_products.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">Məlumat yoxdur</p>
                        ) : (
                            charts.top_products.map((product, index) => (
                                <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                            {index + 1}
                                        </div>
                                        <span className="font-medium">{product.name}</span>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold">{formatNumber(product.total_sold, 2)}</p>
                                        <p className="text-xs text-gray-500">{formatCurrency(product.revenue)}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Low Stock */}
                <div className="bg-white rounded-lg shadow-sm p-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Az Stoklu Məhsullar</h3>
                        <Link href="/alerts" className="text-sm text-blue-600 hover:text-blue-700">
                            Hamısını gör
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {tables.low_stock_products.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">Hamısı yaxşıdır</p>
                        ) : (
                            tables.low_stock_products.map(product => (
                                <div key={product.id} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
                                        <div>
                                            <p className="font-medium text-sm">{product.name}</p>
                                            <p className="text-xs text-gray-500">{product.warehouse || 'Bütün anbarlar'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-yellow-700">
                                            {formatNumber(product.current, 2)} {product.unit}
                                        </p>
                                        <p className="text-xs text-gray-500">Min: {formatNumber(product.min, 2)}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Sales */}
            <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Son Satışlar</h3>
                    <Link href="/sales" className="text-sm text-blue-600 hover:text-blue-700">
                        Hamısını gör
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Müştəri</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Tarix</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Məbləğ</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {tables.recent_sales.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-4 py-4 text-center text-gray-500">Satış yoxdur</td>
                                </tr>
                            ) : (
                                tables.recent_sales.map(sale => (
                                    <tr key={sale.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm">{sale.customer}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500 hidden sm:table-cell">
                                            {new Date(sale.date).toLocaleDateString('az-AZ')} {sale.time}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-medium">{formatCurrency(sale.amount)}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                sale.status === 'Ödənilib' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {sale.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Credit Statistics */}
            <SectionGroup title="Borc Statistikaları" icon={<DocumentTextIcon />}>
                <CompactKPICard
                    title="Ümumi Borc"
                    value={formatCurrency(credits.total_outstanding)}
                    icon={<BanknotesIcon />}
                    variant="warning"
                    subtitle={`${credits.active_credit_customers} müştəri`}
                />
                <CompactKPICard
                    title="Bu Ay Verilən"
                    value={formatCurrency(credits.credits_given_this_month)}
                    icon={<ArrowTrendingDownIcon />}
                    variant="danger"
                />
                <CompactKPICard
                    title="Bu Ay Ödənilən"
                    value={formatCurrency(credits.payments_received_this_month)}
                    icon={<ArrowTrendingUpIcon />}
                    variant="success"
                />
            </SectionGroup>
        </div>
    );
}
