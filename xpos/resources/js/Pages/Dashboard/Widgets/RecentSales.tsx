import { memo } from 'react';
import { Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { CalendarIcon, CurrencyDollarIcon, UserIcon } from '@heroicons/react/24/outline';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '../Utils/dashboardCalculations';

interface RecentSale {
    id: number;
    customer_name: string | null;
    total_amount: number;
    sale_date: string;
    status: string;
    items_count: number;
}

interface RecentSalesProps {
    sales: RecentSale[];
}

const RecentSales = memo(function RecentSales({ sales }: RecentSalesProps) {
    const { t } = useTranslation('dashboard');

    return (
        <div className="-m-6 p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{t('widgets.recentSales.title')}</h3>
                <Link
                    href="/sales"
                    className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                    {t('widgets.recentSales.viewAll')}
                </Link>
            </div>

            {sales.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                    {sales.map((sale) => (
                        <div key={sale.id} className="border-l-4 border-blue-500 pl-4 py-2 hover:bg-gray-50 transition-colors rounded-r-md">
                            <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center text-sm">
                                        <UserIcon className="h-4 w-4 text-gray-400 mr-1 flex-shrink-0" />
                                        <span className="font-medium text-gray-900 truncate" title={sale.customer_name || t('widgets.recentSales.anonymousCustomer')}>
                                            {sale.customer_name || t('widgets.recentSales.anonymousCustomer')}
                                        </span>
                                        <span className={`ml-2 px-2 py-1 text-xs rounded-full flex-shrink-0 ${getStatusColor(sale.status)}`}>
                                            {getStatusLabel(sale.status)}
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center mt-1 text-xs text-gray-500">
                                        <CalendarIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                                        <span>{formatDate(sale.sale_date)}</span>
                                        <span className="mx-2">•</span>
                                        <span>{sale.items_count} {t('widgets.recentSales.products')}</span>
                                    </div>
                                </div>
                                
                                <div className="text-right ml-2 flex-shrink-0">
                                    <div className="flex items-center text-sm font-semibold text-green-600">
                                        <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                                        {formatCurrency(sale.total_amount)}
                                    </div>
                                    <Link
                                        href={`/sales/${sale.id}`}
                                        className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                                    >
                                        {t('widgets.recentSales.details')}
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8">
                    <div className="mx-auto h-12 w-12 text-gray-400">
                        <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                    </div>
                    <p className="text-gray-500 mt-2">{t('widgets.recentSales.noSales')}</p>
                </div>
            )}
        </div>
    );
});

export default RecentSales;