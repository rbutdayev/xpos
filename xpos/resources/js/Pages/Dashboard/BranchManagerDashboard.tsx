import { ShoppingCartIcon, BanknotesIcon, UserIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { CompactKPICard } from '@/Components/Dashboard/KPICard';
import { SectionGroup } from '@/Components/Dashboard/SectionGroup';
import { useTranslation } from 'react-i18next';

const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('az-AZ', { style: 'currency', currency: 'AZN', minimumFractionDigits: 2 }).format(amount);
};

interface Props {
    branch_performance: {
        revenue: number;
        sales_count: number;
        staff_count: number;
        customers_count: number;
    };
    user: { name: string };
}

export default function BranchManagerDashboard({ branch_performance, user }: Props) {
    const { t } = useTranslation('dashboard');

    return (
        <div className="space-y-4">
            <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
                <h2 className="text-2xl font-bold mb-2">{t('welcomeBack', { name: user.name })}</h2>
                <p className="text-indigo-100">{t('roles.branchManagerPanel')}</p>
            </div>

            <SectionGroup title={t('sections.branchStatistics')} icon={<BuildingOfficeIcon />} variant="highlight">
                <CompactKPICard
                    title={t('branch.thisMonthRevenue')}
                    value={formatCurrency(branch_performance.revenue)}
                    icon={<BanknotesIcon />}
                    variant="success"
                    subtitle={t('branch.branchRevenue')}
                />
                <CompactKPICard
                    title={t('branch.sales')}
                    value={branch_performance.sales_count}
                    icon={<ShoppingCartIcon />}
                    variant="primary"
                    subtitle={t('services.thisMonth')}
                />
                <CompactKPICard
                    title={t('branch.staff')}
                    value={branch_performance.staff_count}
                    icon={<UserIcon />}
                    variant="primary"
                    subtitle={t('branch.active')}
                />
                <CompactKPICard
                    title={t('branch.customers')}
                    value={branch_performance.customers_count}
                    icon={<UserIcon />}
                    variant="primary"
                    subtitle={t('services.thisMonth')}
                />
            </SectionGroup>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                    {t('info.detailedReports')} <a href="/reports" className="underline font-medium">{t('info.reports')}</a> {t('info.section')}.
                </p>
            </div>
        </div>
    );
}
