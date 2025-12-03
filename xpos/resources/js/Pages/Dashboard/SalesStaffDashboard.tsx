import { ShoppingCartIcon, BanknotesIcon, UserIcon, ExclamationTriangleIcon, WrenchScrewdriverIcon, ClockIcon } from '@heroicons/react/24/outline';
import { CompactKPICard } from '@/Components/Dashboard/KPICard';
import { SectionGroup } from '@/Components/Dashboard/SectionGroup';
import { QuickActionButton } from '@/Components/Dashboard/QuickActionButton';

const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('az-AZ', { style: 'currency', currency: 'AZN', minimumFractionDigits: 2 }).format(amount);
};

interface Props {
    performance: {
        my_sales_count: number;
        my_sales_revenue: number;
        my_customers_served: number;
        avg_ticket_size: number;
    };
    services?: {
        pending: number;
        in_progress: number;
        completed_this_month: number;
    };
    alerts: {
        low_stock: number;
        out_of_stock: number;
    };
    account: { modules: { services_enabled: boolean } };
    user: { name: string };
}

export default function SalesStaffDashboard({ performance, services, alerts, account, user }: Props) {
    return (
        <div className="space-y-4">
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
                <h2 className="text-2xl font-bold mb-2">Salam, {user.name}!</h2>
                <p className="text-green-100">Sizin bu ay göstəriciləriniz</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <QuickActionButton href={route('pos.index')} icon={<ShoppingCartIcon />} title="Yeni Satış" variant="primary" />
                <QuickActionButton href="/customers/create" icon={<UserIcon />} title="Yeni Müştəri" variant="primary" />
                {account.modules.services_enabled && (
                    <QuickActionButton href={route('pos.index', { mode: 'service' })} icon={<WrenchScrewdriverIcon />} title="Yeni Servis" variant="success" />
                )}
            </div>

            <SectionGroup title="Mənim Performansım" icon={<ShoppingCartIcon />} variant="highlight">
                <CompactKPICard title="Satışlarım" value={performance.my_sales_count} icon={<ShoppingCartIcon />} variant="primary" />
                <CompactKPICard title="Gəlirim" value={formatCurrency(performance.my_sales_revenue)} icon={<BanknotesIcon />} variant="success" />
                <CompactKPICard title="Müştərilərim" value={performance.my_customers_served} icon={<UserIcon />} variant="primary" />
                <CompactKPICard title="Orta Çek" value={formatCurrency(performance.avg_ticket_size)} icon={<BanknotesIcon />} variant="primary" />
            </SectionGroup>

            {account.modules.services_enabled && services && (
                <SectionGroup title="Servis Növbəm" icon={<WrenchScrewdriverIcon />}>
                    <CompactKPICard title="Gözləyən" value={services.pending} icon={<ClockIcon />} variant="warning" />
                    <CompactKPICard title="İcrada" value={services.in_progress} icon={<WrenchScrewdriverIcon />} variant="primary" />
                    <CompactKPICard title="Tamamlanan" value={services.completed_this_month} icon={<ShoppingCartIcon />} variant="success" />
                </SectionGroup>
            )}

            {(alerts.low_stock > 0 || alerts.out_of_stock > 0) && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
                    <div className="flex items-center">
                        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-3" />
                        <div>
                            <p className="text-sm font-medium text-yellow-800">Stok Xəbərdarlığı</p>
                            <p className="text-xs text-yellow-700">
                                {alerts.low_stock} məhsul az stokludur, {alerts.out_of_stock} məhsul tükənib
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
