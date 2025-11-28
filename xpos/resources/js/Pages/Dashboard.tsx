import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { PageProps, User } from '@/types';
import { formatChartDate } from '@/utils/dateFormatters';
import { useState } from 'react';
import {
    CubeIcon,
    UserIcon,
    BuildingOfficeIcon,
    WrenchScrewdriverIcon,
    CurrencyDollarIcon,
    ChartBarIcon,
    HomeModernIcon,
    ExclamationTriangleIcon,
    DocumentTextIcon,
    TruckIcon,
    ShoppingCartIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    BanknotesIcon,
    BeakerIcon,
    CalendarDaysIcon,
    ClockIcon,
} from '@heroicons/react/24/outline';
import {
    InformationCircleIcon,
} from '@heroicons/react/20/solid';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { CompactKPICard } from '@/Components/Dashboard/KPICard';
import { QuickActionButton, QuickActionGrid } from '@/Components/Dashboard/QuickActionButton';
import { SectionGroup, CompactSectionHeader } from '@/Components/Dashboard/SectionGroup';
import { usePermissions } from '@/Hooks/usePermissions';
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

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface DashboardStats {
    products_count: number;
    customers_count: number;
    suppliers_count: number;
    warehouses_count: number;
    branches_count: number;
    vehicles_count: number;
    service_records_count: number;
    service_records_this_month: number;
    total_products_value: number;
    active_customers: number;
    pending_services: number;
    completed_services_this_month: number;
    total_stock_value_cost?: number;
    total_stock_value_sale?: number;
    potential_profit?: number;
    total_stock_items?: number;
    low_stock_count?: number;
    out_of_stock_count?: number;
    negative_stock_count?: number;
    stock_by_unit?: Array<{
        unit: string;
        total_quantity: number;
        products_count: number;
        total_value: number;
    }>;
}

interface SalesData {
    date: string;
    sales: number;
    revenue: number;
}

interface TopProduct {
    id: number;
    name: string;
    category_name: string | null;
    total_sold: number;
    total_revenue: number;
    stock_quantity: number;
    unit?: string;
    avg_price?: number;
    type?: string;
}

interface RecentSale {
    id: number;
    customer_name: string | null;
    total_amount: number;
    sale_date: string;
    status: string;
    items_count: number;
}

interface LowStockProduct {
    id: number;
    name: string;
    sku: string | null;
    stock_quantity: number;
    min_stock_level: number;
    max_stock_level?: number;
    stock_percentage?: number;
    unit?: string;
    category_name: string | null;
    price: number;
    warehouse_name?: string | null;
    warehouse_id?: number;
    type?: string;
}

interface FinancialData {
    total_revenue: number;
    total_expenses: number;
    total_profit: number;
    pending_payments: number;
    monthly_revenue: number;
    monthly_expenses: number;
    revenue_growth: number;
    expense_growth: number;
}

interface PaymentMethodsData {
    nağd: number;
    kart: number;
    köçürmə: number;
}

interface CreditsData {
    total_outstanding: number;
    total_credits_this_month: number;
    total_paid_this_month: number;
    active_credit_customers_count: number;
}

interface RentalData {
    active_rentals_count: number;
    monthly_rental_revenue: number;
    pending_returns_count: number;
    overdue_rentals_count: number;
    total_rentals_this_month: number;
}

interface DashboardProps extends PageProps {
    stats?: DashboardStats;
    sales_chart_data?: SalesData[];
    top_products?: TopProduct[];
    recent_sales?: RecentSale[];
    low_stock_products?: LowStockProduct[];
    financial_data?: FinancialData;
    payment_methods_data?: PaymentMethodsData;
    credits_data?: CreditsData;
    rental_data?: RentalData;
    selectedWarehouse?: { id: number; name: string; type: string } | null;
    warehouseContext?: 'all' | 'specific';
    pending_online_orders?: number;
}

// Helper function to format currency
const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('az-AZ', {
        style: 'currency',
        currency: 'AZN',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};

// Helper function to format number
const formatNumber = (num: number, decimals: number = 0): string => {
    return new Intl.NumberFormat('az-AZ', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(num);
};

// Removed inline components - now using centralized components from @/Components/Dashboard

// Section Header with Tooltip Component
const SectionHeader = ({ title, tooltip }: { title: string; tooltip: string }) => {
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <div className="flex items-center gap-2 mb-0">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <div className="relative group">
                <InformationCircleIcon
                    className="h-5 w-5 text-gray-400 hover:text-blue-600 cursor-help transition-colors"
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                />
                {showTooltip && (
                    <div className="absolute z-50 right-0 top-6 w-72 p-3 bg-white text-gray-700 text-sm rounded-lg shadow-xl border border-gray-200 animate-fadeIn">
                        <div className="absolute -top-2 right-2 w-4 h-4 bg-white border-l border-t border-gray-200 transform rotate-45"></div>
                        {tooltip}
                    </div>
                )}
            </div>
        </div>
    );
};

export default function Dashboard({
    stats = {
        products_count: 0,
        customers_count: 0,
        suppliers_count: 0,
        warehouses_count: 0,
        branches_count: 0,
        vehicles_count: 0,
        service_records_count: 0,
        service_records_this_month: 0,
        total_products_value: 0,
        active_customers: 0,
        pending_services: 0,
        completed_services_this_month: 0,
        total_stock_value_cost: 0,
        total_stock_value_sale: 0,
        potential_profit: 0,
        total_stock_items: 0,
        low_stock_count: 0,
        out_of_stock_count: 0,
        negative_stock_count: 0,
        stock_by_unit: [],
    },
    sales_chart_data = [],
    top_products = [],
    recent_sales = [],
    low_stock_products = [],
    financial_data = {
        total_revenue: 0,
        total_expenses: 0,
        total_profit: 0,
        pending_payments: 0,
        monthly_revenue: 0,
        monthly_expenses: 0,
        revenue_growth: 0,
        expense_growth: 0,
    },
    payment_methods_data = {
        nağd: 0,
        kart: 0,
        köçürmə: 0,
    },
    credits_data = {
        total_outstanding: 0,
        total_credits_this_month: 0,
        total_paid_this_month: 0,
        active_credit_customers_count: 0,
    },
    rental_data = {
        active_rentals_count: 0,
        monthly_rental_revenue: 0,
        pending_returns_count: 0,
        overdue_rentals_count: 0,
        total_rentals_this_month: 0,
    },
    selectedWarehouse,
    warehouseContext = 'all',
    pending_online_orders = 0,
}: DashboardProps) {
    const { auth, shopEnabled, rentEnabled } = usePage<PageProps>().props;
    const user = auth.user as User;

    // Use permission-based access control instead of role checks
    const { can } = usePermissions();

    // Prepare chart data for sales
    const salesChartConfig = {
        labels: sales_chart_data.map((d) => formatChartDate(d.date)),
        datasets: [
            {
                label: 'Gəlir',
                data: sales_chart_data.map((d) => d.revenue),
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4,
            },
        ],
    };

    const salesChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                callbacks: {
                    label: (context: any) => `Gəlir: ${formatCurrency(context.parsed.y)}`,
                },
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: (value: any) => formatCurrency(value),
                },
            },
        },
    };

    // Payment methods breakdown - real data from backend
    const paymentMethodsChartData = {
        labels: ['Nağd', 'Kart', 'Köçürmə'],
        datasets: [
            {
                data: [
                    payment_methods_data.nağd,
                    payment_methods_data.kart,
                    payment_methods_data.köçürmə,
                ],
                backgroundColor: [
                    'rgba(34, 197, 94, 0.8)',
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(168, 85, 247, 0.8)',
                ],
                borderWidth: 0,
            },
        ],
    };

    return (
        <AuthenticatedLayout>
            <Head title="İdarə Paneli" />

            <div className="space-y-2 sm:space-y-3">
                {/* Pending Online Orders Notification - Only show if shop module is enabled */}
                {shopEnabled && pending_online_orders > 0 && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-3" />
                                <p className="text-sm font-medium text-yellow-800">
                                    Sizdə <span className="font-bold">{pending_online_orders}</span> gözləyən online sifariş var.{' '}
                                    <Link href="/online-orders" className="underline hover:text-yellow-900">
                                        Sifarişlərə baxın
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
                    <QuickActionButton
                        href={route('pos.index')}
                        icon={<ShoppingCartIcon />}
                        title="Yeni Satış"
                        variant="primary"
                        description="POS sistemindən satış et"
                    />
                    <QuickActionButton
                        href={route('pos.index', { mode: 'service' })}
                        icon={<WrenchScrewdriverIcon />}
                        title="Yeni Servis"
                        variant="success"
                        description="Servis qeydi yarat"
                    />
                    <QuickActionButton
                        href="/customers/create"
                        icon={<UserIcon />}
                        title="Yeni Müştəri"
                        variant="primary"
                        description="Müştəri əlavə et"
                    />
                    <QuickActionButton
                        href="/products/create"
                        icon={<CubeIcon />}
                        title="Yeni Məhsul"
                        variant="primary"
                        description="Məhsul kataloqa əlavə et"
                    />
                    <QuickActionButton
                        href="/goods-receipts/create"
                        icon={<TruckIcon />}
                        title="Mal Qəbulu"
                        variant="success"
                        description="Yeni mal qəbulu yarat"
                    />
                </div>

                {/* Main KPI Cards */}
                {can('view-financial-reports') ? (
                    <>
                        {/* Financial Overview */}
                        <SectionGroup
                            title="Maliyyə İcmalı"
                            description="Bu ay və ümumi maliyyə göstəriciləri"
                            icon={<BanknotesIcon />}
                            variant="highlight"
                        >
                            <CompactKPICard
                                title="Bu Ay Gəlir"
                                value={formatCurrency(financial_data.monthly_revenue)}
                                icon={<BanknotesIcon />}
                                variant="success"
                                trend={{
                                    value: Math.abs(financial_data.revenue_growth),
                                    isPositive: financial_data.revenue_growth >= 0,
                                }}
                                subtitle="Aylıq gəlir"
                            />
                            <CompactKPICard
                                title="Bu Ay Xərclər"
                                value={formatCurrency(financial_data.monthly_expenses)}
                                icon={<DocumentTextIcon />}
                                variant="warning"
                                trend={{
                                    value: Math.abs(financial_data.expense_growth),
                                    isPositive: financial_data.expense_growth < 0,
                                }}
                                subtitle="Aylıq xərclər"
                            />
                            <CompactKPICard
                                title="Ümumi Mənfəət"
                                value={formatCurrency(financial_data.total_profit)}
                                icon={<ArrowTrendingUpIcon />}
                                variant="success"
                                subtitle="Gəlir - Xərclər"
                            />
                            <CompactKPICard
                                title="Aktiv Müştərilər"
                                value={stats.active_customers}
                                icon={<UserIcon />}
                                variant="primary"
                                subtitle={`${stats.customers_count} ümumi müştəri`}
                            />
                            <CompactKPICard
                                title="Məhsullar"
                                value={stats.products_count}
                                icon={<CubeIcon />}
                                variant="primary"
                                subtitle="Kataloqda"
                            />
                            <CompactKPICard
                                title="Gözləyən Ödəniş"
                                value={formatCurrency(financial_data.pending_payments)}
                                icon={<ClockIcon />}
                                variant="warning"
                                subtitle="Ödənilməmiş"
                            />
                        </SectionGroup>

                        {/* Rental Services Overview - Only show if rent module is enabled */}
                        {rentEnabled && (
                            <SectionGroup
                                title="İcarə Statistikası"
                                description="Aktiv icarələr və gəlir məlumatları"
                                icon={<HomeModernIcon />}
                            >
                                <CompactKPICard
                                    title="Aktiv İcarələr"
                                    value={rental_data.active_rentals_count}
                                    icon={<CubeIcon />}
                                    variant="primary"
                                    subtitle="Hazırda icarədə"
                                />
                                <CompactKPICard
                                    title="Bu Ay İcarə Gəliri"
                                    value={formatCurrency(rental_data.monthly_rental_revenue)}
                                    icon={<CurrencyDollarIcon />}
                                    variant="success"
                                    subtitle={`${rental_data.total_rentals_this_month} icarə`}
                                />
                                <CompactKPICard
                                    title="Gözlənilən Qaytarmalar"
                                    value={rental_data.pending_returns_count}
                                    icon={<CalendarDaysIcon />}
                                    variant="warning"
                                    subtitle="3 gün ərzində"
                                />
                                <CompactKPICard
                                    title="Gecikmiş İcarələr"
                                    value={rental_data.overdue_rentals_count}
                                    icon={<ClockIcon />}
                                    variant="danger"
                                    subtitle="Diqqət tələb edir"
                                />
                            </SectionGroup>
                        )}

                        {/* Stock by Unit Breakdown */}
                        {stats.stock_by_unit && stats.stock_by_unit.length > 0 && (
                            <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4">
                                <SectionHeader
                                    title="Vahid üzrə Stok Bölgüsü"
                                    tooltip="Anbarlarınızdakı məhsulların vahid tiplərinə (ədəd, kq, litr və s.) görə qruplaşdırılmış miqdarları və dəyərləri."
                                />
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                                    {stats.stock_by_unit.map((item, index) => (
                                        <div
                                            key={index}
                                            className="bg-gray-50 hover:bg-gray-100 rounded-lg p-3 border border-gray-200 transition-colors"
                                        >
                                            <div className="flex items-center justify-center mb-1.5">
                                                <BeakerIcon className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div className="text-center">
                                                <div className="text-lg font-bold text-gray-900">
                                                    {formatNumber(item.total_quantity, 2)}
                                                </div>
                                                <div className="text-xs font-medium text-gray-600 mt-0.5">
                                                    {item.unit || 'ədəd'}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-0.5">
                                                    {item.products_count} məhsul
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {formatCurrency(item.total_value)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Credits Statistics */}
                        <SectionGroup
                            title="Borc Statistikaları"
                            description="Müştəri borc və ödəniş məlumatları"
                            icon={<DocumentTextIcon />}
                        >
                            <CompactKPICard
                                title="Ümumi Borc"
                                value={formatCurrency(credits_data.total_outstanding)}
                                icon={<BanknotesIcon />}
                                variant="warning"
                                subtitle="Ödənilməmiş"
                            />
                            <CompactKPICard
                                title="Bu Ay Verilən Borc"
                                value={formatCurrency(credits_data.total_credits_this_month)}
                                icon={<ArrowTrendingDownIcon />}
                                variant="danger"
                                subtitle="Borc məbləği"
                            />
                            <CompactKPICard
                                title="Bu Ay Ödənilən"
                                value={formatCurrency(credits_data.total_paid_this_month)}
                                icon={<ArrowTrendingUpIcon />}
                                variant="success"
                                subtitle="Ödəniş"
                            />
                            <CompactKPICard
                                title="Borclu Müştərilər"
                                value={credits_data.active_credit_customers_count}
                                icon={<UserIcon />}
                                variant="warning"
                                subtitle="Aktiv borc olan"
                            />
                        </SectionGroup>

                        {/* Alerts */}
                        {(stats.low_stock_count! > 0 ||
                            stats.out_of_stock_count! > 0 ||
                            stats.negative_stock_count! > 0 ||
                            stats.pending_services > 0) && (
                            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                {stats.low_stock_count! > 0 && (
                                    <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-3">
                                        <div className="flex items-center">
                                            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2" />
                                            <div>
                                                <p className="text-xs font-medium text-yellow-800">
                                                    Az Stok
                                                </p>
                                                <p className="text-xl font-bold text-yellow-900">
                                                    {stats.low_stock_count}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {stats.out_of_stock_count! > 0 && (
                                    <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-3">
                                        <div className="flex items-center">
                                            <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
                                            <div>
                                                <p className="text-xs font-medium text-red-800">
                                                    Tükənmiş
                                                </p>
                                                <p className="text-xl font-bold text-red-900">
                                                    {stats.out_of_stock_count}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {stats.negative_stock_count! > 0 && (
                                    <div className="bg-purple-50 border-l-4 border-purple-400 rounded-lg p-3">
                                        <div className="flex items-center">
                                            <ExclamationTriangleIcon className="h-5 w-5 text-purple-600 mr-2" />
                                            <div>
                                                <p className="text-xs font-medium text-purple-800">
                                                    Mənfi Stok
                                                </p>
                                                <p className="text-xl font-bold text-purple-900">
                                                    {stats.negative_stock_count}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {stats.pending_services > 0 && (
                                    <div className="bg-blue-50 border-l-4 border-blue-400 rounded-lg p-3">
                                        <div className="flex items-center">
                                            <WrenchScrewdriverIcon className="h-5 w-5 text-blue-600 mr-2" />
                                            <div>
                                                <p className="text-xs font-medium text-blue-800">
                                                    Gözləyən Servislər
                                                </p>
                                                <p className="text-xl font-bold text-blue-900">
                                                    {stats.pending_services}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Charts Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
                            {/* Sales Chart */}
                            <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-3 sm:p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <SectionHeader
                                        title="Son 10 Gün Satış Statistikası"
                                        tooltip="Seçilmiş müddət ərzində günlük və ya saatlıq satış gəlirinizin qrafiki. Bu qrafik satış trendlərini anlamağa kömək edir."
                                    />
                                    <ChartBarIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <div className="h-64 sm:h-72">
                                    <Line data={salesChartConfig} options={salesChartOptions} />
                                </div>
                            </div>

                            {/* Payment Methods */}
                            <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <SectionHeader
                                        title="Ödəniş Üsulları"
                                        tooltip="Bu ay daxil olan satışların ödəniş üsullarına (nağd, kart, köçürmə) görə bölgüsü. Müştərilərin ödəniş üstünlüklərini göstərir."
                                    />
                                    <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <div className="h-64 sm:h-72 flex items-center justify-center">
                                    <Doughnut
                                        data={paymentMethodsChartData}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: {
                                                legend: {
                                                    position: 'bottom',
                                                },
                                                tooltip: {
                                                    callbacks: {
                                                        label: (context: any) => {
                                                            const label = context.label || '';
                                                            const value = formatCurrency(context.parsed);
                                                            return `${label}: ${value}`;
                                                        },
                                                    },
                                                },
                                            },
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Top Products and Low Stock */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                            {/* Top Products */}
                            <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <SectionHeader
                                        title="Ən Çox Satılan Məhsullar"
                                        tooltip="Seçilmiş müddət ərzində ən çox satış miqdarı olan məhsulların siyahısı. Bu məlumat stok planlaması üçün faydalıdır."
                                    />
                                    <Link
                                        href="/products"
                                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                        Hamısını gör
                                    </Link>
                                </div>
                                <div className="space-y-4">
                                    {top_products.length === 0 ? (
                                        <p className="text-gray-500 text-center py-8">
                                            Hələ ki satış məlumatı yoxdur
                                        </p>
                                    ) : (
                                        top_products.map((product, index) => (
                                            <div
                                                key={product.id}
                                                className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                            >
                                                <div className="flex-shrink-0">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                                                        {index + 1}
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        {product.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {product.category_name || 'Kateqoriya yoxdur'}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-semibold text-gray-900">
                                                        {formatNumber(product.total_sold, 2)} {product.unit || 'ədəd'}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {formatCurrency(product.total_revenue)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Low Stock Products */}
                            <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <SectionHeader
                                        title="Az Stoklu Məhsullar"
                                        tooltip="Stok miqdarı minimum səviyyəyə çatmış və ya ondan aşağı düşmüş məhsullar. Bu məhsulları vaxtında sifariş etməyi unutmayın."
                                    />
                                    <Link
                                        href="/alerts"
                                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                        Hamısını gör
                                    </Link>
                                </div>
                                <div className="space-y-4">
                                    {low_stock_products.length === 0 ? (
                                        <p className="text-gray-500 text-center py-8">
                                            Az stoklu məhsul yoxdur
                                        </p>
                                    ) : (
                                        low_stock_products.map((product) => (
                                            <div
                                                key={product.id}
                                                className="flex items-center space-x-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
                                            >
                                                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 flex-shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        {product.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {product.warehouse_name || 'Bütün anbarlar'}
                                                    </p>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <p className="text-sm font-semibold text-yellow-700">
                                                        {formatNumber(product.stock_quantity, 2)} {product.unit || 'ədəd'}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        Min: {formatNumber(product.min_stock_level, 2)}
                                                    </p>
                                                    {product.stock_percentage !== undefined && (
                                                        <div className="mt-1">
                                                            <div className="w-16 bg-gray-200 rounded-full h-2">
                                                                <div
                                                                    className={`h-2 rounded-full ${
                                                                        product.stock_percentage < 50
                                                                            ? 'bg-red-600'
                                                                            : product.stock_percentage < 80
                                                                            ? 'bg-yellow-600'
                                                                            : 'bg-green-600'
                                                                    }`}
                                                                    style={{
                                                                        width: `${Math.min(product.stock_percentage, 100)}%`,
                                                                    }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Recent Sales */}
                        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4">
                            <div className="flex items-center justify-between mb-4">
                                <SectionHeader
                                    title="Son Satışlar"
                                    tooltip="Seçilmiş müddət ərzində edilmiş son satışların siyahısı. Müştəri adı, satış məbləği və statusu haqqında məlumat verir."
                                />
                                <Link
                                    href="/sales"
                                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    Hamısını gör
                                </Link>
                            </div>
                            <div className="overflow-x-auto -mx-4 sm:-mx-6 lg:mx-0">
                                <div className="inline-block min-w-full align-middle px-4 sm:px-6 lg:px-0">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Müştəri
                                                </th>
                                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                                                    Tarix
                                                </th>
                                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                                                    Məhsul Sayı
                                                </th>
                                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Məbləğ
                                                </th>
                                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Status
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {recent_sales.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="px-3 sm:px-6 py-4 text-center text-gray-500">
                                                        Hələ ki satış yoxdur
                                                    </td>
                                                </tr>
                                            ) : (
                                                recent_sales.map((sale) => (
                                                    <tr key={sale.id} className="hover:bg-gray-50">
                                                        <td className="px-3 sm:px-6 py-4 text-sm text-gray-900">
                                                            <div className="flex flex-col">
                                                                <span className="font-medium">{sale.customer_name || 'Anonim'}</span>
                                                                <span className="text-xs text-gray-500 sm:hidden">
                                                                    {new Date(sale.sale_date).toLocaleDateString('az-AZ')}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                                                            {new Date(sale.sale_date).toLocaleDateString('az-AZ')}
                                                        </td>
                                                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                                                            {sale.items_count} məhsul
                                                        </td>
                                                        <td className="px-3 sm:px-6 py-4 text-sm font-medium text-gray-900">
                                                            <div className="flex flex-col">
                                                                <span>{formatCurrency(sale.total_amount)}</span>
                                                                <span className="text-xs text-gray-500 md:hidden">
                                                                    {sale.items_count} məhsul
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                                            <span
                                                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                                    sale.status === 'completed'
                                                                        ? 'bg-green-100 text-green-800'
                                                                        : 'bg-gray-100 text-gray-800'
                                                                }`}
                                                            >
                                                                {sale.status === 'completed' ? 'Tamamlandı' : sale.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                    </>
                ) : (
                    /* Simplified view for sales staff */
                    <>
                        <SectionGroup
                            title="Əsas Göstəricilər"
                            description="Müştəri və servis məlumatları"
                            icon={<ChartBarIcon />}
                        >
                            <CompactKPICard
                                title="Müştərilər"
                                value={stats.customers_count}
                                icon={<UserIcon />}
                                variant="primary"
                                subtitle={`${stats.active_customers} aktiv`}
                            />
                            <CompactKPICard
                                title="Servis Qeydləri"
                                value={stats.service_records_count}
                                icon={<WrenchScrewdriverIcon />}
                                variant="primary"
                                subtitle="Ümumi servislər"
                            />
                            <CompactKPICard
                                title="Bu Ay Servislər"
                                value={stats.service_records_this_month}
                                icon={<DocumentTextIcon />}
                                variant="success"
                                subtitle="Bu ay tamamlanan"
                            />
                            <CompactKPICard
                                title="Gözləyən Servislər"
                                value={stats.pending_services}
                                icon={<ExclamationTriangleIcon />}
                                variant="warning"
                                subtitle="Diqqət tələb edir"
                            />
                        </SectionGroup>

                        {/* Low Stock for Sales Staff */}
                        {low_stock_products.length > 0 && (
                            <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4">
                                <SectionHeader
                                    title="Az Stoklu Məhsullar"
                                    tooltip="Stok miqdarı minimum səviyyəyə çatmış məhsullar. Müştərilərə satış edərkən diqqətli olun."
                                />
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {low_stock_products.map((product) => (
                                        <div
                                            key={product.id}
                                            className="flex items-center space-x-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
                                        >
                                            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 flex-shrink-0" />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {product.name}
                                                </p>
                                                <p className="text-xs text-gray-500">{product.warehouse_name}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-semibold text-yellow-700">
                                                    {formatNumber(product.stock_quantity, 2)} {product.unit || 'ədəd'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
