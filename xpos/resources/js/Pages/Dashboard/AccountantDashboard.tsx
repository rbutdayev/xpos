import { BanknotesIcon, DocumentTextIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, CubeIcon } from '@heroicons/react/24/outline';
import { Doughnut } from 'react-chartjs-2';
import { CompactKPICard } from '@/Components/Dashboard/KPICard';
import { SectionGroup } from '@/Components/Dashboard/SectionGroup';
import { useTranslation } from 'react-i18next';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('az-AZ', { style: 'currency', currency: 'AZN', minimumFractionDigits: 2 }).format(amount);
};

interface Props {
    financial: {
        revenue: { value: number; growth: number };
        expenses: { value: number; growth: number };
        profit: { value: number; growth: number; margin: number };
        pending_payments: { value: number; count: number };
    };
    revenue_breakdown: { sales: number; services?: number; rentals?: number };
    expense_breakdown: Array<{ category: string; amount: number }>;
    credits: {
        total_outstanding: number;
        credits_given_this_month: number;
        payments_received_this_month: number;
        active_credit_customers: number;
    };
    inventory_valuation: {
        cost: number;
        sale: number;
        potential_profit: number;
        items_count: number;
    };
    charts: {
        payment_methods: { labels: string[]; values: number[] };
    };
    user: { name: string };
}

export default function AccountantDashboard({ financial, revenue_breakdown, expense_breakdown, credits, inventory_valuation, charts, user }: Props) {
    const { t } = useTranslation('dashboard');

    const paymentMethodsData = {
        labels: charts.payment_methods.labels,
        datasets: [{
            data: charts.payment_methods.values,
            backgroundColor: ['rgba(34, 197, 94, 0.8)', 'rgba(59, 130, 246, 0.8)', 'rgba(168, 85, 247, 0.8)'],
        }],
    };

    const revenueData = {
        labels: [t('charts.sales'), t('charts.service'), t('charts.rental')].filter((_, i) => [revenue_breakdown.sales, revenue_breakdown.services, revenue_breakdown.rentals][i]),
        datasets: [{
            data: [revenue_breakdown.sales, revenue_breakdown.services || 0, revenue_breakdown.rentals || 0].filter(v => v > 0),
            backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(139, 92, 246, 0.8)', 'rgba(34, 197, 94, 0.8)'],
        }],
    };

    const expenseData = {
        labels: expense_breakdown.map(e => e.category),
        datasets: [{
            data: expense_breakdown.map(e => e.amount),
            backgroundColor: expense_breakdown.map((_, i) => `hsla(${i * 60}, 70%, 60%, 0.8)`),
        }],
    };

    return (
        <div className="space-y-4">
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg shadow-lg p-6 text-white">
                <h2 className="text-2xl font-bold mb-2">{t('welcomeBack', { name: user.name })}</h2>
                <p className="text-emerald-100">{t('roles.accountantPanel')}</p>
            </div>

            <SectionGroup title={t('sections.financialSummary')} icon={<BanknotesIcon />} variant="highlight">
                <CompactKPICard
                    title={t('financial.thisMonthRevenue')}
                    value={formatCurrency(financial.revenue.value)}
                    icon={<BanknotesIcon />}
                    variant="success"
                    trend={{ value: Math.abs(financial.revenue.growth), isPositive: financial.revenue.growth >= 0 }}
                />
                <CompactKPICard
                    title={t('financial.thisMonthExpenses')}
                    value={formatCurrency(financial.expenses.value)}
                    icon={<DocumentTextIcon />}
                    variant="warning"
                    trend={{ value: Math.abs(financial.expenses.growth), isPositive: financial.expenses.growth < 0 }}
                />
                <CompactKPICard
                    title={t('financial.profit')}
                    value={formatCurrency(financial.profit.value)}
                    icon={<ArrowTrendingUpIcon />}
                    variant="success"
                    subtitle={`${financial.profit.margin}% ${t('financial.margin')}`}
                    trend={{ value: Math.abs(financial.profit.growth), isPositive: financial.profit.growth >= 0 }}
                />
                <CompactKPICard
                    title={t('financial.pendingPayment')}
                    value={formatCurrency(financial.pending_payments.value)}
                    icon={<DocumentTextIcon />}
                    variant="warning"
                    subtitle={`${financial.pending_payments.count} ${t('financial.customer')}`}
                />
            </SectionGroup>

            <SectionGroup title={t('sections.creditStatistics')} icon={<DocumentTextIcon />}>
                <CompactKPICard
                    title={t('credits.totalOutstanding')}
                    value={formatCurrency(credits.total_outstanding)}
                    icon={<BanknotesIcon />}
                    variant="warning"
                    subtitle={`${credits.active_credit_customers} ${t('financial.customer')}`}
                />
                <CompactKPICard
                    title={t('credits.givenThisMonth')}
                    value={formatCurrency(credits.credits_given_this_month)}
                    icon={<ArrowTrendingDownIcon />}
                    variant="danger"
                />
                <CompactKPICard
                    title={t('credits.paidThisMonth')}
                    value={formatCurrency(credits.payments_received_this_month)}
                    icon={<ArrowTrendingUpIcon />}
                    variant="success"
                />
            </SectionGroup>

            <SectionGroup title={t('sections.warehouseValuation')} icon={<CubeIcon />}>
                <CompactKPICard
                    title={t('stock.costPrice')}
                    value={formatCurrency(inventory_valuation.cost)}
                    icon={<BanknotesIcon />}
                    variant="primary"
                    subtitle={`${inventory_valuation.items_count} ${t('stock.product')}`}
                />
                <CompactKPICard
                    title={t('stock.saleValue')}
                    value={formatCurrency(inventory_valuation.sale)}
                    icon={<BanknotesIcon />}
                    variant="success"
                />
                <CompactKPICard
                    title={t('stock.potentialProfit')}
                    value={formatCurrency(inventory_valuation.potential_profit)}
                    icon={<ArrowTrendingUpIcon />}
                    variant="success"
                />
            </SectionGroup>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg shadow-sm p-4">
                    <h3 className="text-lg font-semibold mb-4">{t('charts.revenueBreakdown')}</h3>
                    <div className="h-64 flex items-center justify-center">
                        <Doughnut data={revenueData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-4">
                    <h3 className="text-lg font-semibold mb-4">{t('charts.paymentMethods')}</h3>
                    <div className="h-64 flex items-center justify-center">
                        <Doughnut data={paymentMethodsData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-4">
                    <h3 className="text-lg font-semibold mb-4">{t('charts.expenseBreakdown')}</h3>
                    <div className="h-64 flex items-center justify-center">
                        {expense_breakdown.length > 0 ? (
                            <Doughnut data={expenseData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
                        ) : (
                            <p className="text-gray-500 text-sm">{t('charts.noExpenses')}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
