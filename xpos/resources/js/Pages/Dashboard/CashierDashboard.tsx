import { ShoppingCartIcon, BanknotesIcon, UserIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import { CompactKPICard } from '@/Components/Dashboard/KPICard';
import { SectionGroup } from '@/Components/Dashboard/SectionGroup';
import { QuickActionButton } from '@/Components/Dashboard/QuickActionButton';
import { useTranslation } from 'react-i18next';

const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('az-AZ', {
        style: 'currency',
        currency: 'AZN',
        minimumFractionDigits: 2,
    }).format(amount);
};

interface Props {
    shift_summary: {
        sales_count: number;
        sales_revenue: number;
        customers_served: number;
        cash_collected: number;
        card_transfers: number;
    };
    user: { name: string };
}

export default function CashierDashboard({ shift_summary, user }: Props) {
    const { t } = useTranslation('dashboard');

    return (
        <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
                <h2 className="text-2xl font-bold mb-2">{t('welcomeBack', { name: user.name })}</h2>
                <p className="text-blue-100">{t('roles.cashierPanel')}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <QuickActionButton
                    href={route('pos.index')}
                    icon={<ShoppingCartIcon />}
                    title={t('quickActions.newSale')}
                    variant="primary"
                />
                <QuickActionButton
                    href="/customers/create"
                    icon={<UserIcon />}
                    title={t('quickActions.newCustomer')}
                    variant="primary"
                />
            </div>

            <SectionGroup title={t('sections.todaySales')} icon={<ShoppingCartIcon />} variant="highlight">
                <CompactKPICard
                    title={t('shift.salesCount')}
                    value={shift_summary.sales_count}
                    icon={<ShoppingCartIcon />}
                    variant="primary"
                />
                <CompactKPICard
                    title={t('shift.salesRevenue')}
                    value={formatCurrency(shift_summary.sales_revenue)}
                    icon={<BanknotesIcon />}
                    variant="success"
                />
                <CompactKPICard
                    title={t('shift.customers')}
                    value={shift_summary.customers_served}
                    icon={<UserIcon />}
                    variant="primary"
                />
            </SectionGroup>

            <SectionGroup title={t('sections.paymentCollection')} icon={<BanknotesIcon />}>
                <CompactKPICard
                    title={t('shift.cash')}
                    value={formatCurrency(shift_summary.cash_collected)}
                    icon={<BanknotesIcon />}
                    variant="success"
                />
                <CompactKPICard
                    title={t('shift.cardTransfer')}
                    value={formatCurrency(shift_summary.card_transfers)}
                    icon={<CreditCardIcon />}
                    variant="primary"
                />
            </SectionGroup>
        </div>
    );
}
