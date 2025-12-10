import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../Utils/dashboardCalculations';

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

interface FinancialSummaryProps {
    data: FinancialData;
    period: 'today' | 'month' | 'year';
}

const FinancialSummary = memo(function FinancialSummary({ data, period }: FinancialSummaryProps) {
    const { t } = useTranslation('dashboard');

    const getPeriodLabel = () => {
        switch (period) {
            case 'today': return t('widgets.financialSummary.today');
            case 'month': return t('widgets.financialSummary.thisMonth');
            case 'year': return t('widgets.financialSummary.thisYear');
            default: return t('widgets.financialSummary.financial');
        }
    };

    const profitMargin = useMemo(() => {
        return data.total_revenue > 0 ? ((data.total_profit / data.total_revenue) * 100) : 0;
    }, [data.total_revenue, data.total_profit]);

    const financialHealthStatus = useMemo(() => {
        if (profitMargin >= 20) return { status: t('widgets.financialSummary.excellent'), color: 'text-green-600' };
        if (profitMargin >= 10) return { status: t('widgets.financialSummary.good'), color: 'text-yellow-600' };
        if (profitMargin >= 0) return { status: t('widgets.financialSummary.average'), color: 'text-orange-600' };
        return { status: t('widgets.financialSummary.weak'), color: 'text-red-600' };
    }, [profitMargin, t]);

    return (
        <div className="-m-6 p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">{t('widgets.financialSummary.title')}</h3>
                <span className="text-sm text-gray-500">{getPeriodLabel()}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Revenue */}
                <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-green-800">{t('widgets.financialSummary.revenue')}</p>
                            <p className="text-2xl font-bold text-green-900">
                                {formatCurrency(data.total_revenue)}
                            </p>
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full ${
                            data.revenue_growth >= 0 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                        }`}>
                            {data.revenue_growth >= 0 ? '↗' : '↘'} {Math.abs(data.revenue_growth)}%
                        </div>
                    </div>
                </div>

                {/* Expenses */}
                <div className="bg-red-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-red-800">{t('widgets.financialSummary.expenses')}</p>
                            <p className="text-2xl font-bold text-red-900">
                                {formatCurrency(data.total_expenses)}
                            </p>
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full ${
                            data.expense_growth <= 0 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                        }`}>
                            {data.expense_growth >= 0 ? '↗' : '↘'} {Math.abs(data.expense_growth)}%
                        </div>
                    </div>
                </div>
            </div>

            {/* Profit Section */}
            <div className={`p-4 rounded-lg mb-4 ${
                data.total_profit >= 0 ? 'bg-blue-50' : 'bg-red-50'
            }`}>
                <div className="flex items-center justify-between">
                    <div>
                        <p className={`text-sm font-medium ${
                            data.total_profit >= 0 ? 'text-blue-800' : 'text-red-800'
                        }`}>
                            {t('widgets.financialSummary.netProfit')}
                        </p>
                        <p className={`text-3xl font-bold ${
                            data.total_profit >= 0 ? 'text-blue-900' : 'text-red-900'
                        }`}>
                            {formatCurrency(data.total_profit)}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-600">{t('widgets.financialSummary.profitMargin')}</p>
                        <p className={`text-lg font-semibold ${
                            profitMargin >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                            {profitMargin.toFixed(1)}%
                        </p>
                    </div>
                </div>
                
                {/* Profit Margin Bar */}
                <div className="mt-3">
                    <div className="bg-gray-200 rounded-full h-2">
                        <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                                profitMargin >= 0 ? 'bg-green-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(Math.abs(profitMargin), 100)}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Pending Payments */}
            {data.pending_payments > 0 && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-yellow-800">{t('widgets.financialSummary.pendingPayments')}</p>
                            <p className="text-xl font-bold text-yellow-900">
                                {formatCurrency(data.pending_payments)}
                            </p>
                        </div>
                        <div className="text-yellow-600">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>
            )}

            {/* Financial Health Indicator */}
            <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{t('widgets.financialSummary.financialHealth')}:</span>
                    <span className={`font-medium ${financialHealthStatus.color}`}>
                        {financialHealthStatus.status}
                    </span>
                </div>
            </div>
        </div>
    );
});

export default FinancialSummary;