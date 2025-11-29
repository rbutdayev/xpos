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
import { accountOwnerDashboardMock, formatCurrency, formatNumber, formatDate } from '@/mockData/dashboardMockData';

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
 * Account Owner Dashboard - Specification Structure + Cuba Design
 */
export default function DashboardNew({ auth }: PageProps) {
    const data = accountOwnerDashboardMock;
    const { user, account, financial, operational, services, rentals, alerts, onlineOrders } = data;

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
                        {(onlineOrders.pending > 0 || alerts.lowStock > 0 || rentals.overdue > 0) && (
                            <AlertBannerStack>
                                {onlineOrders.pending > 0 && (
                                    <AlertBanner type="warning" message={`Sizdə ${onlineOrders.pending} gözləyən online sifariş var`} actionLabel="Sifarişlərə baxın" actionHref="/online-orders" />
                                )}
                                {alerts.lowStock > 0 && (
                                    <AlertBanner type="warning" message={`${alerts.lowStock} məhsulun stoku azaldı`} actionLabel="Stoku yoxlayın" actionHref="/alerts" />
                                )}
                                {rentals.overdue > 0 && (
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
                                    value={formatCurrency(financial.pendingPayments.value)}
                                    subtitle={`${financial.pendingPayments.count} müştəri`}
                                />
                            </div>
                        </div>

                        {/* OPERATIONAL METRICS */}
                        <SectionCard title="Əməliyyat Göstəriciləri" subtitle="Müştəri və stok statistikası">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                <MiniStatCard
                                    icon={UserIcon}
                                    label="Aktiv Müştərilər"
                                    value={operational.activeCustomers.toLocaleString()}
                                    subtitle={`+${operational.newCustomers} yeni`}
                                    color="blue"
                                />
                                <MiniStatCard
                                    icon={CubeIcon}
                                    label="Stokda Məhsullar"
                                    value={operational.productsInStock.toLocaleString()}
                                    subtitle={`${operational.productsCount} ümumi`}
                                    color="purple"
                                />
                                <MiniStatCard
                                    icon={BanknotesIcon}
                                    label="Stok Dəyəri"
                                    value={formatCurrency(operational.stockValue.sale)}
                                    subtitle="Satış qiyməti"
                                    color="green"
                                />
                                <MiniStatCard
                                    icon={ChartBarIcon}
                                    label="Dövriyyə Nisbəti"
                                    value={`${operational.stockTurnover}x`}
                                    subtitle="İllik dövriyyə"
                                    color="blue"
                                />
                            </div>
                        </SectionCard>

                        {/* SERVICE METRICS (conditional) */}
                        {account.modules.servicesEnabled && (
                            <SectionCard title="Servis Göstəriciləri" subtitle="Servis əməliyyatları və gəlir">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                    <MiniStatCard icon={ClockIcon} label="Gözləyən Servislər" value={services.pending} subtitle="Növbədə" color="orange" />
                                    <MiniStatCard icon={WrenchScrewdriverIcon} label="Davam Edən" value={services.inProgress} subtitle="İşləniyor" color="blue" />
                                    <MiniStatCard icon={ChartBarIcon} label="Bu Ay Tamamlanan" value={services.completedThisMonth} subtitle={`+${services.completedGrowth} vs keçən ay`} color="green" />
                                    <MiniStatCard icon={BanknotesIcon} label="Servis Gəliri" value={formatCurrency(services.revenue)} subtitle={`+${services.revenueGrowth}%`} color="green" />
                                </div>
                            </SectionCard>
                        )}

                        {/* RENTAL METRICS (conditional) */}
                        {account.modules.rentalsEnabled && (
                            <SectionCard title="İcarə Göstəriciləri" subtitle="İcarə əməliyyatları və gəlir">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                    <MiniStatCard icon={HomeModernIcon} label="Aktiv İcarələr" value={rentals.active} subtitle="Hazırda icarədə" color="blue" />
                                    <MiniStatCard icon={BanknotesIcon} label="Aylıq Gəlir" value={formatCurrency(rentals.monthlyRevenue)} subtitle="İcarə gəliri" color="green" />
                                    <MiniStatCard icon={CalendarDaysIcon} label="Gözlənilən Qaytarma" value={rentals.pendingReturns} subtitle="3 gün ərzində" color="orange" />
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
                                <p className="text-2xl font-bold text-yellow-900">{alerts.lowStock} məhsul</p>
                            </div>
                            <div className="bg-red-50 border-l-4 border-red-500 rounded-r p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                                    <span className="text-xs font-medium text-red-800">Tükənmiş</span>
                                </div>
                                <p className="text-2xl font-bold text-red-900">{alerts.outOfStock} məhsul</p>
                            </div>
                            <div className="bg-purple-50 border-l-4 border-purple-500 rounded-r p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <ExclamationTriangleIcon className="w-5 h-5 text-purple-600" />
                                    <span className="text-xs font-medium text-purple-800">Mənfi Stok</span>
                                </div>
                                <p className="text-2xl font-bold text-purple-900">{alerts.negativeStock} məhsul</p>
                            </div>
                            <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <TruckIcon className="w-5 h-5 text-blue-600" />
                                    <span className="text-xs font-medium text-blue-800">Gözləyən MQ</span>
                                </div>
                                <p className="text-2xl font-bold text-blue-900">{alerts.pendingGoodsReceipts} qəbul</p>
                            </div>
                        </div>

                        {/* CHARTS & ANALYTICS */}
                        <div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                                <ChartCard title="Gəlir Trendi (10 gün)">
                                    <div className="h-64 sm:h-72">
                                        <Line
                                            data={{
                                                labels: data.salesTrend.map(d => formatDate(d.date).split(' ')[0]),
                                                datasets: [{
                                                    data: data.salesTrend.map(d => d.revenue),
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
                                </ChartCard>

                                <ChartCard title="Ödəniş Üsulları">
                                    <div className="h-64 sm:h-72 flex items-center justify-center">
                                        <Doughnut
                                            data={{
                                                labels: data.paymentMethods.labels,
                                                datasets: [{
                                                    data: data.paymentMethods.values,
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
                                </ChartCard>

                                <ChartCard title="Top 5 Məhsullar">
                                    <div className="h-64 sm:h-72">
                                        <Bar
                                            data={{
                                                labels: data.topProducts.map(p => p.name.substring(0, 15)),
                                                datasets: [{
                                                    data: data.topProducts.map(p => p.revenue),
                                                    backgroundColor: '#6366f1',
                                                }],
                                            }}
                                            options={{ ...chartConfig, indexAxis: 'y' as const }}
                                        />
                                    </div>
                                </ChartCard>

                                <ChartCard title="Xərc Bölgüsü">
                                    <div className="h-64 sm:h-72 flex items-center justify-center">
                                        <Pie
                                            data={{
                                                labels: data.expenseBreakdown.map(e => e.category),
                                                datasets: [{
                                                    data: data.expenseBreakdown.map(e => e.amount),
                                                    backgroundColor: ['#ef4444', '#fb923c', '#eab308', '#a855f7'],
                                                }],
                                            }}
                                            options={{
                                                ...chartConfig,
                                                plugins: { legend: { display: true, position: 'bottom' } },
                                            }}
                                        />
                                    </div>
                                </ChartCard>
                            </div>
                        </div>

                        {/* CREDIT STATISTICS */}
                        <SectionCard title="Borc Statistikaları" subtitle="Müştəri borcları və ödənişlər">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                <MiniStatCard icon={BanknotesIcon} label="Ümumi Borc" value={formatCurrency(data.credits.totalOutstanding)} color="red" />
                                <MiniStatCard icon={ArrowTrendingUpIcon} label="Bu Ay Verilən" value={formatCurrency(data.credits.creditsGivenThisMonth)} color="orange" />
                                <MiniStatCard icon={ArrowTrendingDownIcon} label="Bu Ay Ödənilən" value={formatCurrency(data.credits.paymentsReceivedThisMonth)} color="green" />
                                <MiniStatCard icon={UserIcon} label="Borclu Müştərilər" value={data.credits.activeCreditCustomers} color="orange" />
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
                                    {data.recentSales.slice(0, 5).map((sale) => (
                                        <div key={sale.id} className="px-4 sm:px-6 py-3 sm:py-4 hover:bg-gray-50">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-900">{sale.customer}</p>
                                                    <p className="text-xs text-gray-500">{formatDate(sale.date)} {sale.time}</p>
                                                </div>
                                                <div className="text-right ml-4">
                                                    <p className="font-bold text-gray-900">{formatCurrency(sale.amount)}</p>
                                                    <span className={`text-xs ${sale.status === 'Ödənilib' ? 'text-green-600' : 'text-orange-600'}`}>
                                                        {sale.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Low Stock Alerts */}
                            <div className="bg-white rounded-lg shadow">
                                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                                    <h3 className="text-sm sm:text-base font-semibold text-gray-800">Az Stoklu Məhsullar (Təcili)</h3>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {data.lowStockProducts.slice(0, 5).map((product) => (
                                        <div key={product.id} className="px-4 sm:px-6 py-3 sm:py-4 hover:bg-gray-50">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-900 text-sm">{product.name}</p>
                                                    <p className="text-xs text-gray-500">{product.warehouse}</p>
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
                                    ))}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
