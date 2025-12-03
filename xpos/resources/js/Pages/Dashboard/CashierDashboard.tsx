import { ShoppingCartIcon, BanknotesIcon, UserIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import { CompactKPICard } from '@/Components/Dashboard/KPICard';
import { SectionGroup } from '@/Components/Dashboard/SectionGroup';
import { QuickActionButton } from '@/Components/Dashboard/QuickActionButton';

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
    return (
        <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
                <h2 className="text-2xl font-bold mb-2">Xoş gəlmisiniz, {user.name}!</h2>
                <p className="text-blue-100">Bugünkü növbəniz</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <QuickActionButton
                    href={route('pos.index')}
                    icon={<ShoppingCartIcon />}
                    title="Yeni Satış"
                    variant="primary"
                />
                <QuickActionButton
                    href="/customers/create"
                    icon={<UserIcon />}
                    title="Yeni Müştəri"
                    variant="primary"
                />
            </div>

            <SectionGroup title="Bugünkü Satışlar" icon={<ShoppingCartIcon />} variant="highlight">
                <CompactKPICard
                    title="Satış Sayı"
                    value={shift_summary.sales_count}
                    icon={<ShoppingCartIcon />}
                    variant="primary"
                />
                <CompactKPICard
                    title="Satış Gəliri"
                    value={formatCurrency(shift_summary.sales_revenue)}
                    icon={<BanknotesIcon />}
                    variant="success"
                />
                <CompactKPICard
                    title="Müştərilər"
                    value={shift_summary.customers_served}
                    icon={<UserIcon />}
                    variant="primary"
                />
            </SectionGroup>

            <SectionGroup title="Ödəniş Yığımı" icon={<BanknotesIcon />}>
                <CompactKPICard
                    title="Nağd"
                    value={formatCurrency(shift_summary.cash_collected)}
                    icon={<BanknotesIcon />}
                    variant="success"
                />
                <CompactKPICard
                    title="Kart/Köçürmə"
                    value={formatCurrency(shift_summary.card_transfers)}
                    icon={<CreditCardIcon />}
                    variant="primary"
                />
            </SectionGroup>
        </div>
    );
}
