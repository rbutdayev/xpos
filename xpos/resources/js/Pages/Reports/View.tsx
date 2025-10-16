import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SharedDataTable from '@/Components/SharedDataTable';
import { reportViewConfig } from '@/Components/TableConfigurations';
import { __ } from '@/utils/translations';
import {
    ArrowLeftIcon,
    PrinterIcon,
    DocumentArrowDownIcon,
    ChartBarIcon
} from '@heroicons/react/24/outline';

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
    const getReportTitle = (type: string) => {
        const titles: { [key: string]: string } = {
            'sales': __('app.sales_report'),
            'inventory': __('app.inventory_report'),
            'financial': __('app.financial_report'),
            'customer': __('app.customer_report'),
            'service': 'Servis Hesabatı'
        };
        return titles[type] || 'Hesabat';
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
            case 'sales':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-blue-50 rounded-lg p-6">
                            <h3 className="text-sm font-medium text-blue-600">Cəmi Satışlar</h3>
                            <p className="text-2xl font-bold text-blue-900">{formatNumber(data.summary.total_sales)}</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-6">
                            <h3 className="text-sm font-medium text-green-600">Cəmi Gəlir</h3>
                            <p className="text-2xl font-bold text-green-900">{formatCurrency(data.summary.total_revenue)}</p>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-6">
                            <h3 className="text-sm font-medium text-purple-600">Ortalama Satış</h3>
                            <p className="text-2xl font-bold text-purple-900">{formatCurrency(data.summary.average_sale)}</p>
                        </div>
                        <div className="bg-indigo-50 rounded-lg p-6">
                            <h3 className="text-sm font-medium text-indigo-600">Ən Çox Alış-veriş Edən</h3>
                            <p className="text-lg font-bold text-indigo-900">{data.summary.top_customer?.name || 'N/A'}</p>
                            <p className="text-sm text-indigo-600">{data.summary.top_customer?.total ? formatCurrency(data.summary.top_customer.total) : ''}</p>
                        </div>
                    </div>
                );
            case 'inventory':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-blue-50 rounded-lg p-6">
                            <h3 className="text-sm font-medium text-blue-600">Cəmi Məhsullar</h3>
                            <p className="text-2xl font-bold text-blue-900">{formatNumber(data.summary.total_products)}</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-6">
                            <h3 className="text-sm font-medium text-green-600">Stok Dəyəri</h3>
                            <p className="text-2xl font-bold text-green-900">{formatCurrency(data.summary.total_stock_value)}</p>
                        </div>
                        <div className="bg-yellow-50 rounded-lg p-6">
                            <h3 className="text-sm font-medium text-yellow-600">Az Stok</h3>
                            <p className="text-2xl font-bold text-yellow-900">{formatNumber(data.summary.low_stock_items)}</p>
                        </div>
                        <div className="bg-red-50 rounded-lg p-6">
                            <h3 className="text-sm font-medium text-red-600">Tükənmiş</h3>
                            <p className="text-2xl font-bold text-red-900">{formatNumber(data.summary.out_of_stock_items)}</p>
                        </div>
                    </div>
                );
            case 'financial':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-green-50 rounded-lg p-6">
                            <h3 className="text-sm font-medium text-green-600">Cəmi Gəlir</h3>
                            <p className="text-2xl font-bold text-green-900">{formatCurrency(data.summary.total_revenue)}</p>
                        </div>
                        <div className="bg-red-50 rounded-lg p-6">
                            <h3 className="text-sm font-medium text-red-600">Cəmi Xərclər</h3>
                            <p className="text-2xl font-bold text-red-900">{formatCurrency(data.summary.total_expenses)}</p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-6">
                            <h3 className="text-sm font-medium text-blue-600">Xalis Mənfəət</h3>
                            <p className="text-2xl font-bold text-blue-900">{formatCurrency(data.summary.net_profit)}</p>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-6">
                            <h3 className="text-sm font-medium text-purple-600">Mənfəət Marjası</h3>
                            <p className="text-2xl font-bold text-purple-900">{data.summary.profit_margin.toFixed(1)}%</p>
                        </div>
                    </div>
                );
            case 'customer':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-blue-50 rounded-lg p-6">
                            <h3 className="text-sm font-medium text-blue-600">Cəmi Müştərilər</h3>
                            <p className="text-2xl font-bold text-blue-900">{formatNumber(data.summary.total_customers)}</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-6">
                            <h3 className="text-sm font-medium text-green-600">Aktiv Müştərilər</h3>
                            <p className="text-2xl font-bold text-green-900">{formatNumber(data.summary.active_customers)}</p>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-6">
                            <h3 className="text-sm font-medium text-purple-600">Ortalama Dəyər</h3>
                            <p className="text-2xl font-bold text-purple-900">{formatCurrency(data.summary.average_customer_value || 0)}</p>
                        </div>
                        <div className="bg-indigo-50 rounded-lg p-6">
                            <h3 className="text-sm font-medium text-indigo-600">Ən Çox Alış-veriş</h3>
                            <p className="text-lg font-bold text-indigo-900">{data.summary.top_customer?.name || 'N/A'}</p>
                        </div>
                    </div>
                );
            case 'service':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-blue-50 rounded-lg p-6">
                            <h3 className="text-sm font-medium text-blue-600">Cəmi Servislər</h3>
                            <p className="text-2xl font-bold text-blue-900">{formatNumber(data.summary.total_services)}</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-6">
                            <h3 className="text-sm font-medium text-green-600">Tamamlanmış</h3>
                            <p className="text-2xl font-bold text-green-900">{formatNumber(data.summary.completed_services)}</p>
                        </div>
                        <div className="bg-yellow-50 rounded-lg p-6">
                            <h3 className="text-sm font-medium text-yellow-600">Gözləyən</h3>
                            <p className="text-2xl font-bold text-yellow-900">{formatNumber(data.summary.pending_services)}</p>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-6">
                            <h3 className="text-sm font-medium text-purple-600">Ortalama Dəyər</h3>
                            <p className="text-2xl font-bold text-purple-900">{formatCurrency(data.summary.average_service_cost || 0)}</p>
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
            default:
                return [];
        }
    };

    const tableData = getTableData();
    const config = reportViewConfig[reportType as keyof typeof reportViewConfig];
    const columns = config?.columns || [];

    return (
        <AuthenticatedLayout>
            <Head title={`${getReportTitle(reportType)} - Hesabat`} />

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
                                        Çap Et
                                    </button>
                                    <a
                                        href={route('reports.download', reportId)}
                                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                                        CSV Yüklə
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    {getSummaryCards()}

                    {/* Data Table */}
                    <div className="bg-white rounded-lg shadow">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">Təfərrüatlı Məlumatlar</h3>
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
                            />
                        ) : (
                            <div className="p-6 text-center py-8">
                                <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">Məlumat yoxdur</h3>
                                <p className="mt-1 text-sm text-gray-500">Bu hesabat növü üçün məlumat tapılmadı.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}