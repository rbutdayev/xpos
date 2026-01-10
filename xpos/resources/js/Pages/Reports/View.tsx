import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SharedDataTable from '@/Components/SharedDataTable';
import { reportViewConfig } from '@/Components/TableConfigurations';
import {
    ArrowLeftIcon,
    PrinterIcon,
    DocumentArrowDownIcon,
    ChartBarIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

interface ReportData {
    summary: any;
    type: string;
    [key: string]: any;
}

interface Props {
    reportId: number;
    reportType: string;
    data: ReportData;
    dateRange: {
        from: string;
        to: string;
    };
}

export default function View({ reportId, reportType, data, dateRange }: Props) {
    const { t } = useTranslation(['reports', 'common']);

    const getReportTitle = (type: string) => {
        const typeKey = type.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
        return t(`types.${typeKey}`, { defaultValue: t('view.title') });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('az-AZ', {
            style: 'currency',
            currency: 'AZN',
            maximumFractionDigits: 2
        }).format(amount);
    };

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('az-AZ').format(num);
    };

    const getSummaryCards = () => {
        if (!data.summary) return null;

        switch (reportType) {
            case 'end_of_day':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-blue-50 rounded-lg p-6">
                            <h3 className="text-sm font-medium text-blue-600">{t('summary.salesCount')}</h3>
                            <p className="text-2xl font-bold text-blue-900">{formatNumber(data.summary.total_sales)}</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-6">
                            <h3 className="text-sm font-medium text-green-600">{t('summary.totalRevenue')}</h3>
                            <p className="text-2xl font-bold text-green-900">{formatCurrency(data.summary.total_revenue)}</p>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-6">
                            <h3 className="text-sm font-medium text-purple-600">{t('summary.averageTransaction')}</h3>
                            <p className="text-2xl font-bold text-purple-900">{formatCurrency(data.summary.average_transaction)}</p>
                        </div>
                        <div className="bg-indigo-50 rounded-lg p-6">
                            <h3 className="text-sm font-medium text-indigo-600">{t('summary.soldProducts')}</h3>
                            <p className="text-2xl font-bold text-indigo-900">{formatNumber(data.summary.total_items_sold)}</p>
                        </div>
                    </div>
                );
            case 'sales':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-blue-50 rounded-lg p-6">
                            <h3 className="text-sm font-medium text-blue-600">{t('summary.totalSales')}</h3>
                            <p className="text-2xl font-bold text-blue-900">{formatNumber(data.summary.total_sales)}</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-6">
                            <h3 className="text-sm font-medium text-green-600">{t('summary.totalIncome')}</h3>
                            <p className="text-2xl font-bold text-green-900">{formatCurrency(data.summary.total_revenue)}</p>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-6">
                            <h3 className="text-sm font-medium text-purple-600">{t('summary.averageSale')}</h3>
                            <p className="text-2xl font-bold text-purple-900">{formatCurrency(data.summary.average_sale)}</p>
                        </div>
                        <div className="bg-indigo-50 rounded-lg p-6">
                            <h3 className="text-sm font-medium text-indigo-600">{t('summary.topCustomer')}</h3>
                            <p className="text-lg font-bold text-indigo-900">{data.summary.top_customer?.name || 'N/A'}</p>
                            <p className="text-sm text-indigo-600">{data.summary.top_customer?.total ? formatCurrency(data.summary.top_customer.total) : ''}</p>
                        </div>
                    </div>
                );
            case 'inventory':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-blue-50 rounded-lg p-6">
                            <h3 className="text-sm font-medium text-blue-600">{t('summary.totalProducts')}</h3>
                            <p className="text-2xl font-bold text-blue-900">{formatNumber(data.summary.total_products)}</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-6">
                            <h3 className="text-sm font-medium text-green-600">{t('summary.stockValue')}</h3>
                            <p className="text-2xl font-bold text-green-900">{formatCurrency(data.summary.total_stock_value)}</p>
                        </div>
                        <div className="bg-yellow-50 rounded-lg p-6">
                            <h3 className="text-sm font-medium text-yellow-600">{t('summary.lowStock')}</h3>
                            <p className="text-2xl font-bold text-yellow-900">{formatNumber(data.summary.low_stock_items)}</p>
                        </div>
                        <div className="bg-red-50 rounded-lg p-6">
                            <h3 className="text-sm font-medium text-red-600">{t('summary.outOfStock')}</h3>
                            <p className="text-2xl font-bold text-red-900">{formatNumber(data.summary.out_of_stock_items)}</p>
                        </div>
                    </div>
                );
            case 'financial':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-green-50 rounded-lg p-6">
                            <h3 className="text-sm font-medium text-green-600">{t('summary.totalIncome')}</h3>
                            <p className="text-2xl font-bold text-green-900">{formatCurrency(data.summary.total_revenue)}</p>
                        </div>
                        <div className="bg-red-50 rounded-lg p-6">
                            <h3 className="text-sm font-medium text-red-600">{t('summary.totalExpenses')}</h3>
                            <p className="text-2xl font-bold text-red-900">{formatCurrency(data.summary.total_expenses)}</p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-6">
                            <h3 className="text-sm font-medium text-blue-600">{t('summary.netProfit')}</h3>
                            <p className="text-2xl font-bold text-blue-900">{formatCurrency(data.summary.net_profit)}</p>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-6">
                            <h3 className="text-sm font-medium text-purple-600">{t('summary.profitMargin')}</h3>
                            <p className="text-2xl font-bold text-purple-900">{data.summary.profit_margin.toFixed(1)}%</p>
                        </div>
                    </div>
                );
            case 'customer':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-blue-50 rounded-lg p-6">
                            <h3 className="text-sm font-medium text-blue-600">{t('summary.totalCustomers')}</h3>
                            <p className="text-2xl font-bold text-blue-900">{formatNumber(data.summary.total_customers)}</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-6">
                            <h3 className="text-sm font-medium text-green-600">{t('summary.activeCustomers')}</h3>
                            <p className="text-2xl font-bold text-green-900">{formatNumber(data.summary.active_customers)}</p>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-6">
                            <h3 className="text-sm font-medium text-purple-600">{t('summary.averageValue')}</h3>
                            <p className="text-2xl font-bold text-purple-900">{formatCurrency(data.summary.average_customer_value || 0)}</p>
                        </div>
                        <div className="bg-indigo-50 rounded-lg p-6">
                            <h3 className="text-sm font-medium text-indigo-600">{t('summary.topShopping')}</h3>
                            <p className="text-lg font-bold text-indigo-900">{data.summary.top_customer?.name || 'N/A'}</p>
                        </div>
                    </div>
                );
            case 'service':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-blue-50 rounded-lg p-6">
                            <h3 className="text-sm font-medium text-blue-600">{t('summary.totalServices')}</h3>
                            <p className="text-2xl font-bold text-blue-900">{formatNumber(data.summary.total_services)}</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-6">
                            <h3 className="text-sm font-medium text-green-600">{t('summary.completed')}</h3>
                            <p className="text-2xl font-bold text-green-900">{formatNumber(data.summary.completed_services)}</p>
                        </div>
                        <div className="bg-yellow-50 rounded-lg p-6">
                            <h3 className="text-sm font-medium text-yellow-600">{t('summary.pending')}</h3>
                            <p className="text-2xl font-bold text-yellow-900">{formatNumber(data.summary.pending_services)}</p>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-6">
                            <h3 className="text-sm font-medium text-purple-600">{t('summary.averageValue')}</h3>
                            <p className="text-2xl font-bold text-purple-900">{formatCurrency(data.summary.average_service_cost || 0)}</p>
                        </div>
                    </div>
                );
            case 'rental':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-blue-50 rounded-lg p-6">
                            <h3 className="text-sm font-medium text-blue-600">{t('summary.totalRentals')}</h3>
                            <p className="text-2xl font-bold text-blue-900">{formatNumber(data.summary.total_rentals)}</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-6">
                            <h3 className="text-sm font-medium text-green-600">{t('summary.activeRentals')}</h3>
                            <p className="text-2xl font-bold text-green-900">{formatNumber(data.summary.active_rentals)}</p>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-6">
                            <h3 className="text-sm font-medium text-purple-600">{t('summary.rentalRevenue')}</h3>
                            <p className="text-2xl font-bold text-purple-900">{formatCurrency(data.summary.total_rental_revenue || 0)}</p>
                        </div>
                        <div className="bg-yellow-50 rounded-lg p-6">
                            <h3 className="text-sm font-medium text-yellow-600">{t('summary.overdue')}</h3>
                            <p className="text-2xl font-bold text-yellow-900">{formatNumber(data.summary.overdue_rentals)}</p>
                        </div>
                    </div>
                );
            case 'cash_drawer':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-green-50 rounded-lg p-6">
                            <h3 className="text-sm font-medium text-green-600">{t('summary.cashSales')}</h3>
                            <p className="text-2xl font-bold text-green-900">{formatCurrency(data.summary.total_cash_sales)}</p>
                        </div>
                        <div className="bg-red-50 rounded-lg p-6">
                            <h3 className="text-sm font-medium text-red-600">{t('summary.cashExpenses')}</h3>
                            <p className="text-2xl font-bold text-red-900">{formatCurrency(data.summary.total_cash_expenses)}</p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-6">
                            <h3 className="text-sm font-medium text-blue-600">{t('summary.netCash')}</h3>
                            <p className="text-2xl font-bold text-blue-900">{formatCurrency(data.summary.net_cash_flow)}</p>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-6">
                            <h3 className="text-sm font-medium text-purple-600">{t('summary.transactionCount')}</h3>
                            <p className="text-2xl font-bold text-purple-900">{formatNumber(data.summary.total_transactions)}</p>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    // Get data and columns for the table
    const getTableData = () => {
        switch (reportType) {
            case 'sales':
                return data.sales || [];
            case 'inventory':
                return data.inventory || [];
            case 'financial':
                return data.daily_data || [];
            case 'customer':
                return data.customers || [];
            case 'service':
                return data.services || [];
            case 'rental':
                return data.rentals || [];
            case 'cash_drawer':
                return data.daily_breakdown || [];
            default:
                return [];
        }
    };

    const tableData = getTableData();
    const config = reportViewConfig[reportType as keyof typeof reportViewConfig];
    const columns = config?.columns || [];

    return (
        <AuthenticatedLayout>
            <Head title={`${getReportTitle(reportType)} - ${t('view.title')}`} />

            <div className="py-6">
                <div className="max-w-full mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* Header */}
                    <div className="bg-white rounded-lg shadow">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <Link
                                        href="/reports"
                                        className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                                    >
                                        <ArrowLeftIcon className="h-5 w-5" />
                                    </Link>
                                    <div>
                                        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                                            <ChartBarIcon className="h-6 w-6 mr-2" />
                                            {getReportTitle(reportType)}
                                        </h1>
                                        <p className="text-sm text-gray-600">
                                            {dateRange.from} - {dateRange.to}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex space-x-3">
                                    <button className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                                        <PrinterIcon className="h-4 w-4 mr-2" />
                                        {t('view.print')}
                                    </button>
                                    <a
                                        href={route('reports.download', reportId)}
                                        className="flex items-center px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
                                    >
                                        <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                                        {t('view.downloadCsv')}
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    {getSummaryCards()}

                    {/* Payment Methods Breakdown - Show for end_of_day, sales, financial reports */}
                    {(reportType === 'end_of_day' || reportType === 'sales' || reportType === 'financial') && (
                        <div className="bg-white rounded-lg shadow">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg font-medium text-gray-900">{t('sections.paymentMethods')}</h3>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    {reportType === 'sales' && data.summary.payment_methods ? (
                                        Object.entries(data.summary.payment_methods).map(([method, methodData]: [string, any]) => (
                                            <div key={method} className="bg-gray-50 rounded-lg p-4">
                                                <h4 className="text-sm font-medium text-gray-600 mb-2">
                                                    {t(`paymentMethods.${method}`, { defaultValue: method })}
                                                </h4>
                                                <p className="text-2xl font-bold text-gray-900">{formatCurrency(methodData.total)}</p>
                                                <p className="text-sm text-gray-600">{methodData.count} {t('table.transactions')}</p>
                                            </div>
                                        ))
                                    ) : reportType === 'financial' && data.summary.revenue_by_payment_method ? (
                                        Object.entries(data.summary.revenue_by_payment_method).map(([method, amount]: [string, any]) => (
                                            <div key={method} className="bg-gray-50 rounded-lg p-4">
                                                <h4 className="text-sm font-medium text-gray-600 mb-2">
                                                    {t(`paymentMethods.${method}`, { defaultValue: method })}
                                                </h4>
                                                <p className="text-2xl font-bold text-gray-900">{formatCurrency(amount)}</p>
                                            </div>
                                        ))
                                    ) : (
                                        Object.entries(data.summary.payment_methods || {}).map(([method, amount]: [string, any]) => (
                                            <div key={method} className="bg-gray-50 rounded-lg p-4">
                                                <h4 className="text-sm font-medium text-gray-600 mb-2">
                                                    {t(`paymentMethods.${method}`, { defaultValue: method })}
                                                </h4>
                                                <p className="text-2xl font-bold text-gray-900">{formatCurrency(amount)}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Special Layouts */}
                    {reportType === 'end_of_day' || reportType === 'cash_drawer' ? (
                        <>

                            {/* Hourly Breakdown */}
                            {data.hourly_breakdown && data.hourly_breakdown.length > 0 && (
                                <div className="bg-white rounded-lg shadow">
                                    <div className="px-6 py-4 border-b border-gray-200">
                                        <h3 className="text-lg font-medium text-gray-900">{t('sections.hourlySales')}</h3>
                                    </div>
                                    <div className="p-6">
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead>
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table.hour')}</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table.salesCount')}</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table.revenue')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {data.hourly_breakdown.map((hour: any, index: number) => (
                                                        <tr key={index}>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{hour.hour}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{hour.transactions}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(hour.revenue)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Employee Sales */}
                            {data.employee_sales && data.employee_sales.length > 0 && (
                                <div className="bg-white rounded-lg shadow">
                                    <div className="px-6 py-4 border-b border-gray-200">
                                        <h3 className="text-lg font-medium text-gray-900">{t('sections.employeeSalesData')}</h3>
                                    </div>
                                    <div className="p-6">
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead>
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table.employeeName')}</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table.salesCount')}</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table.revenue')}</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table.soldProducts')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {data.employee_sales.map((employee: any, index: number) => (
                                                        <tr key={index}>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{employee.name}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{employee.transactions}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(employee.revenue)}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{employee.items_sold}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Top Products */}
                            {data.top_products && data.top_products.length > 0 && (
                                <div className="bg-white rounded-lg shadow">
                                    <div className="px-6 py-4 border-b border-gray-200">
                                        <h3 className="text-lg font-medium text-gray-900">{t('sections.topProducts')}</h3>
                                    </div>
                                    <div className="p-6">
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead>
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table.productName')}</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table.sku')}</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table.quantity')}</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table.revenue')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {data.top_products.map((product: any, index: number) => (
                                                        <tr key={index}>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.name}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.sku}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.quantity}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(product.revenue)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Cash Drawer Report - Daily Breakdown Table */}
                            {reportType === 'cash_drawer' && data.daily_breakdown && data.daily_breakdown.length > 0 && (
                                <div className="bg-white rounded-lg shadow">
                                    <div className="px-6 py-4 border-b border-gray-200">
                                        <h3 className="text-lg font-medium text-gray-900">{t('sections.dailyCashReport')}</h3>
                                    </div>
                                    <div className="p-6">
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead>
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table.date')}</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table.cashSales')}</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table.cashExpenses')}</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table.netCash')}</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table.operations')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {data.daily_breakdown.map((day: any, index: number) => (
                                                        <tr key={index}>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{day.date}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">{formatCurrency(day.cash_sales)}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">{formatCurrency(day.cash_expenses)}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-bold">{formatCurrency(day.net_cash)}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{day.transaction_count}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        /* Data Table for other report types */
                        <div className="bg-white rounded-lg shadow">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg font-medium text-gray-900">{t('view.detailedData')}</h3>
                            </div>

                            {tableData.length > 0 ? (
                                <SharedDataTable
                                    data={{
                                        data: tableData,
                                        current_page: 1,
                                        last_page: 1,
                                        total: tableData.length,
                                        per_page: tableData.length,
                                        from: 1,
                                        to: tableData.length,
                                        links: []
                                    }}
                                    columns={columns}
                                    hideSearch={true}
                                    hidePagination={true}
                                    hideFilters={true}
                                    hidePerPageSelect={true}
                                    className="border-none shadow-none"
                                    fullWidth={true}
                                    mobileClickable={true}
                                    hideMobileActions={true}
                                />
                            ) : (
                                <div className="p-6 text-center py-8">
                                    <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">{t('view.noData')}</h3>
                                    <p className="mt-1 text-sm text-gray-500">{t('view.noDataDescription')}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}