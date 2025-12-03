import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { PageProps } from '@/types';
import {
    BanknotesIcon,
    DocumentTextIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    ClockIcon,
    UserIcon,
    CubeIcon,
    WrenchScrewdriverIcon,
    HomeModernIcon,
    CalendarDaysIcon,
    ShoppingCartIcon,
    TruckIcon,
    ExclamationTriangleIcon,
    ChartBarIcon,
    PlusIcon,
} from '@heroicons/react/24/outline';
import { Line, Doughnut, Bar, Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { AlertBanner, AlertBannerStack } from '@/Components/Dashboard/AlertBanner';

// Helper functions
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

const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString('az-AZ');
};

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

/**
 * Main KPI Card - Cuba Style (4 main financial metrics)
 */
const MainKPICard = ({
    icon: Icon,
    iconBg,
    label,
    value,
    change,
    isPositive,
    subtitle,
}: {
    icon: any;
    iconBg: string;
    label: string;
    value: string | number;
    change?: number;
    isPositive?: boolean;
    subtitle?: string;
}) => (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-lg ${iconBg}`}>
                <Icon className="w-7 h-7 text-white" />
            </div>
            {change !== undefined && (
                <div className={`flex items-center gap-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                    {isPositive ? <ArrowTrendingUpIcon className="w-4 h-4" /> : <ArrowTrendingDownIcon className="w-4 h-4" />}
                    <span className="text-sm font-semibold">{change}%</span>
                </div>
            )}
        </div>
        <h3 className="text-3xl font-bold text-gray-800 mb-1">{value}</h3>
        <p className="text-sm text-gray-600 font-medium mb-1">{label}</p>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
    </div>
);

/**
 * Section Card Wrapper - Groups multiple mini cards inside
 */
const SectionCard = ({
    title,
    subtitle,
    children
}: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
}) => (
    <div className="bg-white rounded-lg shadow">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
            <h3 className="text-sm sm:text-base font-semibold text-gray-800">{title}</h3>
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className="p-4 sm:p-6">
            {children}
        </div>
    </div>
);

/**
 * Mini Stat Card - Small cards inside SectionCard
 */
const MiniStatCard = ({
    label,
    value,
    icon: Icon,
    subtitle,
    color = 'blue',
}: {
    label: string;
    value: string | number;
    icon: any;
    subtitle?: string;
    color?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
}) => {
    const colors = {
        blue: 'bg-blue-100 text-blue-600',
        green: 'bg-green-100 text-green-600',
        orange: 'bg-orange-100 text-orange-600',
        red: 'bg-red-100 text-red-600',
        purple: 'bg-purple-100 text-purple-600',
    };

    return (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
            <div className={`p-2.5 rounded-lg flex-shrink-0 ${colors[color]}`}>
                <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                <p className="text-lg font-bold text-gray-900">{value}</p>
                {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
            </div>
        </div>
    );
};


/**
 * Chart Card
 */
const ChartCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-3 sm:mb-4">{title}</h3>
        {children}
    </div>
);

/**
 * Quick Action Button
 */
const QuickActionBtn = ({
    label,
    icon: Icon,
    href,
    variant = 'primary',
}: {
    label: string;
    icon: any;
    href: string;
    variant?: 'primary' | 'success' | 'warning';
}) => {
    const variants = {
        primary: 'bg-blue-600 hover:bg-blue-700',
        success: 'bg-green-600 hover:bg-green-700',
        warning: 'bg-orange-600 hover:bg-orange-700',
    };

    return (
        <Link
            href={href}
            className={`${variants[variant]} text-white px-5 py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2 shadow hover:shadow-md transition-all`}
        >
            <Icon className="w-5 h-5" />
            {label}
        </Link>
    );
};

/**
 * Account Owner Dashboard - Real Data from Controller
 */
interface DashboardNewProps extends PageProps {
    user: {
        id: number;
        name: string;
        role: string;
    };
    account: {
        name: string;
        modules: {
            services_enabled: boolean;
            rentals_enabled: boolean;
            shop_enabled: boolean;
        };
    };
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
        revenue: number;
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
            status: string;
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
}

export default function DashboardNew({
    user,
    account,
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
}: DashboardNewProps) {

    const chartConfig = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 12,
                titleFont: { size: 13, weight: 'bold' as const },
                bodyFont: { size: 12 },
                cornerRadius: 6,
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(0, 0, 0, 0.05)', drawBorder: false },
                ticks: { color: '#9ca3af', font: { size: 12 } },
            },
            x: {
                grid: { display: false },
                ticks: { color: '#9ca3af', font: { size: 12 } },
            },
        },
    };

    return (
        <AuthenticatedLayout>
            <Head title="İdarə Paneli" />

            <div className="min-h-screen bg-gray-100">
                <div className="py-4 sm:py-6 lg:py-8">
                    <div className="w-full px-4 sm:px-6 lg:px-8 space-y-6">

                        {/* HEADER */}
                        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <div>
                                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                                        Xoş gəlmisiniz, {user.name}
                                    </h1>
                                    <p className="text-xs sm:text-sm text-gray-500 mt-1">Hesab: {account.name}</p>
                                </div>
                            </div>
                        </div>

                        {/* ALERT BANNERS */}
                        {(online_orders.pending > 0 || alerts.low_stock > 0 || (rentals && rentals.overdue > 0)) && (
                            <AlertBannerStack>
                                {online_orders.pending > 0 && (
                                    <AlertBanner type="warning" message={`Sizdə ${online_orders.pending} gözləyən online sifariş var`} actionLabel="Sifarişlərə baxın" actionHref="/online-orders" />
                                )}
                                {alerts.low_stock > 0 && (
                                    <AlertBanner type="warning" message={`${alerts.low_stock} məhsulun stoku azaldı`} actionLabel="Stoku yoxlayın" actionHref="/alerts" />
                                )}
                                {rentals && rentals.overdue > 0 && (
                                    <AlertBanner type="danger" message={`${rentals.overdue} icarə gecikib`} actionLabel="İcarələrə baxın" actionHref="/rentals" />
                                )}
                            </AlertBannerStack>
                        )}

                        {/* QUICK ACTIONS */}
                        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                            <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-3 sm:mb-4">Sürətli Əməliyyatlar</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
                                <QuickActionBtn label="Yeni Satış" icon={ShoppingCartIcon} href="/pos" variant="primary" />
                                <QuickActionBtn label="Yeni Servis" icon={WrenchScrewdriverIcon} href="/pos?mode=service" variant="success" />
                                <QuickActionBtn label="Yeni Müştəri" icon={UserIcon} href="/customers/create" variant="primary" />
                                <QuickActionBtn label="Yeni Məhsul" icon={CubeIcon} href="/products/create" variant="primary" />
                                <QuickActionBtn label="Mal Qəbulu" icon={TruckIcon} href="/goods-receipts/create" variant="success" />
                                <QuickActionBtn label="Yeni Xərc" icon={DocumentTextIcon} href="/expenses/create" variant="warning" />
                            </div>
                        </div>

                        {/* FINANCIAL OVERVIEW */}
                        <div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                                <MainKPICard
                                    icon={BanknotesIcon}
                                    iconBg="bg-gradient-to-br from-green-400 to-green-600"
                                    label="Gəlir Bu Ay"
                                    value={formatCurrency(financial.revenue.value)}
                                    change={financial.revenue.growth}
                                    isPositive={true}
                                />
                                <MainKPICard
                                    icon={DocumentTextIcon}
                                    iconBg="bg-gradient-to-br from-red-400 to-red-600"
                                    label="Xərclər Bu Ay"
                                    value={formatCurrency(financial.expenses.value)}
                                    change={financial.expenses.growth}
                                    isPositive={false}
                                />
                                <MainKPICard
                                    icon={ArrowTrendingUpIcon}
                                    iconBg="bg-gradient-to-br from-blue-400 to-blue-600"
                                    label="Xalis Mənfəət"
                                    value={formatCurrency(financial.profit.value)}
                                    change={financial.profit.growth}
                                    isPositive={true}
                                    subtitle={`Marja: ${financial.profit.margin}%`}
                                />
                                <MainKPICard
                                    icon={ClockIcon}
                                    iconBg="bg-gradient-to-br from-orange-400 to-orange-600"
                                    label="Gözləyən Ödəniş"
                                    value={formatCurrency(financial.pending_payments.value)}
                                    subtitle={`${financial.pending_payments.count} müştəri`}
                                />
                            </div>
                        </div>

                        {/* OPERATIONAL METRICS */}
                        <SectionCard title="Əməliyyat Göstəriciləri" subtitle="Müştəri və stok statistikası">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                <MiniStatCard
                                    icon={UserIcon}
                                    label="Aktiv Müştərilər"
                                    value={operational.active_customers.toLocaleString()}
                                    subtitle={`+${operational.new_customers} yeni`}
                                    color="blue"
                                />
                                <MiniStatCard
                                    icon={CubeIcon}
                                    label="Stokda Məhsullar"
                                    value={operational.products_in_stock.toLocaleString()}
                                    subtitle={`${operational.products_count} ümumi`}
                                    color="purple"
                                />
                                <MiniStatCard
                                    icon={BanknotesIcon}
                                    label="Stok Dəyəri"
                                    value={formatCurrency(operational.stock_value.sale)}
                                    subtitle="Satış qiyməti"
                                    color="green"
                                />
                                <MiniStatCard
                                    icon={ChartBarIcon}
                                    label="Dövriyyə Nisbəti"
                                    value={`${operational.stock_turnover}x`}
                                    subtitle="İllik dövriyyə"
                                    color="blue"
                                />
                            </div>
                        </SectionCard>

                        {/* SERVICE METRICS (conditional) */}
                        {account.modules.services_enabled && services && (
                            <SectionCard title="Servis Göstəriciləri" subtitle="Servis əməliyyatları və gəlir">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                    <MiniStatCard icon={ClockIcon} label="Gözləyən Servislər" value={services.pending} subtitle="Növbədə" color="orange" />
                                    <MiniStatCard icon={WrenchScrewdriverIcon} label="Davam Edən" value={services.in_progress} subtitle="İşləniyor" color="blue" />
                                    <MiniStatCard icon={ChartBarIcon} label="Bu Ay Tamamlanan" value={services.completed_this_month} subtitle="Bu ay tamamlanan" color="green" />
                                    <MiniStatCard icon={BanknotesIcon} label="Servis Gəliri" value={formatCurrency(services.revenue)} subtitle="Aylıq gəlir" color="green" />
                                </div>
                            </SectionCard>
                        )}

                        {/* RENTAL METRICS (conditional) */}
                        {account.modules.rentals_enabled && rentals && (
                            <SectionCard title="İcarə Göstəriciləri" subtitle="İcarə əməliyyatları və gəlir">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                    <MiniStatCard icon={HomeModernIcon} label="Aktiv İcarələr" value={rentals.active} subtitle="Hazırda icarədə" color="blue" />
                                    <MiniStatCard icon={BanknotesIcon} label="Aylıq Gəlir" value={formatCurrency(rentals.monthly_revenue)} subtitle="İcarə gəliri" color="green" />
                                    <MiniStatCard icon={CalendarDaysIcon} label="Gözlənilən Qaytarma" value={rentals.pending_returns} subtitle="3 gün ərzində" color="orange" />
                                    <MiniStatCard icon={ExclamationTriangleIcon} label="Gecikmiş İcarələr" value={rentals.overdue} subtitle="Təcili!" color="red" />
                                </div>
                            </SectionCard>
                        )}

                        {/* INVENTORY ALERTS */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                            <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-r p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
                                    <span className="text-xs font-medium text-yellow-800">Az Stok</span>
                                </div>
                                <p className="text-2xl font-bold text-yellow-900">{alerts.low_stock} məhsul</p>
                            </div>
                            <div className="bg-red-50 border-l-4 border-red-500 rounded-r p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                                    <span className="text-xs font-medium text-red-800">Tükənmiş</span>
                                </div>
                                <p className="text-2xl font-bold text-red-900">{alerts.out_of_stock} məhsul</p>
                            </div>
                            <div className="bg-purple-50 border-l-4 border-purple-500 rounded-r p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <ExclamationTriangleIcon className="w-5 h-5 text-purple-600" />
                                    <span className="text-xs font-medium text-purple-800">Mənfi Stok</span>
                                </div>
                                <p className="text-2xl font-bold text-purple-900">{alerts.negative_stock} məhsul</p>
                            </div>
                            <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <TruckIcon className="w-5 h-5 text-blue-600" />
                                    <span className="text-xs font-medium text-blue-800">Gözləyən MQ</span>
                                </div>
                                <p className="text-2xl font-bold text-blue-900">{alerts.pending_goods_receipts} qəbul</p>
                            </div>
                        </div>

                        {/* CHARTS & ANALYTICS */}
                        <div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                                <ChartCard title="Gəlir Trendi">
                                    {charts.sales_trend && charts.sales_trend.length > 0 ? (
                                        <div className="h-64 sm:h-72">
                                            <Line
                                                data={{
                                                    labels: charts.sales_trend.map(d => formatDate(d.date).split(' ')[0]),
                                                    datasets: [{
                                                        data: charts.sales_trend.map(d => d.revenue),
                                                        borderColor: '#6366f1',
                                                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                                        borderWidth: 2.5,
                                                        fill: true,
                                                        tension: 0.4,
                                                    }],
                                                }}
                                                options={chartConfig}
                                            />
                                        </div>
                                    ) : (
                                        <div className="h-64 sm:h-72 flex items-center justify-center text-gray-500">
                                            <p className="text-sm">Məlumat yoxdur</p>
                                        </div>
                                    )}
                                </ChartCard>

                                <ChartCard title="Ödəniş Üsulları">
                                    {charts.payment_methods && charts.payment_methods.values.some(v => v > 0) ? (
                                        <div className="h-64 sm:h-72 flex items-center justify-center">
                                            <Doughnut
                                                data={{
                                                    labels: charts.payment_methods.labels,
                                                    datasets: [{
                                                        data: charts.payment_methods.values,
                                                        backgroundColor: ['#10b981', '#6366f1', '#f59e0b'],
                                                    }],
                                                }}
                                                options={{
                                                    ...chartConfig,
                                                    plugins: {
                                                        legend: { display: true, position: 'bottom' },
                                                    },
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="h-64 sm:h-72 flex items-center justify-center text-gray-500">
                                            <p className="text-sm">Məlumat yoxdur</p>
                                        </div>
                                    )}
                                </ChartCard>

                                <ChartCard title="Top 5 Məhsullar">
                                    {charts.top_products && charts.top_products.length > 0 ? (
                                        <div className="h-64 sm:h-72">
                                            <Bar
                                                data={{
                                                    labels: charts.top_products.map(p => p.name.substring(0, 15)),
                                                    datasets: [{
                                                        data: charts.top_products.map(p => p.revenue),
                                                        backgroundColor: '#6366f1',
                                                    }],
                                                }}
                                                options={{ ...chartConfig, indexAxis: 'y' as const }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="h-64 sm:h-72 flex items-center justify-center text-gray-500">
                                            <p className="text-sm">Məlumat yoxdur</p>
                                        </div>
                                    )}
                                </ChartCard>

                                <ChartCard title="Xərc Bölgüsü">
                                    {charts.expense_breakdown && charts.expense_breakdown.length > 0 ? (
                                        <div className="h-64 sm:h-72 flex items-center justify-center">
                                            <Pie
                                                data={{
                                                    labels: charts.expense_breakdown.map(e => e.category),
                                                    datasets: [{
                                                        data: charts.expense_breakdown.map(e => e.amount),
                                                        backgroundColor: ['#ef4444', '#fb923c', '#eab308', '#a855f7'],
                                                    }],
                                                }}
                                                options={{
                                                    ...chartConfig,
                                                    plugins: { legend: { display: true, position: 'bottom' } },
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="h-64 sm:h-72 flex items-center justify-center text-gray-500">
                                            <p className="text-sm">Məlumat yoxdur</p>
                                        </div>
                                    )}
                                </ChartCard>
                            </div>
                        </div>

                        {/* CREDIT STATISTICS */}
                        <SectionCard title="Borc Statistikaları" subtitle="Müştəri borcları və ödənişlər">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                <MiniStatCard icon={BanknotesIcon} label="Ümumi Borc" value={formatCurrency(credits.total_outstanding)} color="red" />
                                <MiniStatCard icon={ArrowTrendingUpIcon} label="Bu Ay Verilən" value={formatCurrency(credits.credits_given_this_month)} color="orange" />
                                <MiniStatCard icon={ArrowTrendingDownIcon} label="Bu Ay Ödənilən" value={formatCurrency(credits.payments_received_this_month)} color="green" />
                                <MiniStatCard icon={UserIcon} label="Borclu Müştərilər" value={credits.active_credit_customers} color="orange" />
                            </div>
                        </SectionCard>

                        {/* DATA TABLES */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                            {/* Recent Sales */}
                            <div className="bg-white rounded-lg shadow">
                                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex items-center justify-between">
                                    <h3 className="text-sm sm:text-base font-semibold text-gray-800">Son Satışlar (Son 10)</h3>
                                    <Link href="/sales" className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium">Hamısı →</Link>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {tables.recent_sales && tables.recent_sales.length > 0 ? (
                                        tables.recent_sales.slice(0, 5).map((sale) => (
                                            <div key={sale.id} className="px-4 sm:px-6 py-3 sm:py-4 hover:bg-gray-50">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <p className="font-medium text-gray-900">{sale.customer}</p>
                                                        <p className="text-xs text-gray-500">{formatDate(sale.date)}</p>
                                                    </div>
                                                    <div className="text-right ml-4">
                                                        <p className="font-bold text-gray-900">{formatCurrency(sale.amount)}</p>
                                                        <span className={`text-xs ${sale.status === 'Ödənilib' ? 'text-green-600' : 'text-orange-600'}`}>
                                                            {sale.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="px-4 sm:px-6 py-8 text-center text-gray-500">
                                            <p className="text-sm">Hələ ki satış yoxdur</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Low Stock Alerts */}
                            <div className="bg-white rounded-lg shadow">
                                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                                    <h3 className="text-sm sm:text-base font-semibold text-gray-800">Az Stoklu Məhsullar (Təcili)</h3>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {tables.low_stock_products && tables.low_stock_products.length > 0 ? (
                                        tables.low_stock_products.slice(0, 5).map((product) => (
                                            <div key={product.id} className="px-4 sm:px-6 py-3 sm:py-4 hover:bg-gray-50">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <p className="font-medium text-gray-900 text-sm">{product.name}</p>
                                                        <p className="text-xs text-gray-500">{product.warehouse || 'Bütün anbarlar'}</p>
                                                    </div>
                                                    <div className="text-right ml-4">
                                                        <p className="text-sm font-semibold text-gray-900">
                                                            {formatNumber(product.current, 2)} / {formatNumber(product.min, 2)} {product.unit}
                                                        </p>
                                                        <div className="w-20 bg-gray-200 rounded-full h-1.5 mt-1">
                                                            <div
                                                                className={`h-1.5 rounded-full ${
                                                                    (product.current / product.min) * 100 < 25 ? 'bg-red-600' :
                                                                    (product.current / product.min) * 100 < 50 ? 'bg-orange-500' : 'bg-yellow-500'
                                                                }`}
                                                                style={{ width: `${Math.min((product.current / product.min) * 100, 100)}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="px-4 sm:px-6 py-8 text-center text-gray-500">
                                            <p className="text-sm">Az stoklu məhsul yoxdur</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
