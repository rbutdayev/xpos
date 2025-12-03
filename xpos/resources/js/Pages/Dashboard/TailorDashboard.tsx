import { WrenchScrewdriverIcon, ClockIcon, ArrowTrendingUpIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import { CompactKPICard } from '@/Components/Dashboard/KPICard';
import { SectionGroup } from '@/Components/Dashboard/SectionGroup';

const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('az-AZ', { style: 'currency', currency: 'AZN', minimumFractionDigits: 2 }).format(amount);
};

interface Props {
    services: {
        pending: number;
        in_progress: number;
        completed_this_month: number;
        completed_growth: number;
        revenue: number;
        revenue_growth: number;
    };
    user: { name: string };
}

export default function TailorDashboard({ services, user }: Props) {
    return (
        <div className="space-y-4">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
                <h2 className="text-2xl font-bold mb-2">Salam, {user.name}!</h2>
                <p className="text-purple-100">Sizin servis növbəniz</p>
            </div>

            <SectionGroup title="Servis Statistikası" icon={<WrenchScrewdriverIcon />} variant="highlight">
                <CompactKPICard title="Gözləyən Servislər" value={services.pending} icon={<ClockIcon />} variant="warning" subtitle="Başlanmayıb" />
                <CompactKPICard title="İcrada" value={services.in_progress} icon={<WrenchScrewdriverIcon />} variant="primary" subtitle="Hal-hazırda" />
                <CompactKPICard
                    title="Tamamlanan"
                    value={services.completed_this_month}
                    icon={<ArrowTrendingUpIcon />}
                    variant="success"
                    subtitle="Bu ay"
                    trend={{ value: Math.abs(services.completed_growth), isPositive: services.completed_growth >= 0 }}
                />
                <CompactKPICard
                    title="Gəlir"
                    value={formatCurrency(services.revenue)}
                    icon={<BanknotesIcon />}
                    variant="success"
                    subtitle="Bu ay"
                    trend={{ value: Math.abs(services.revenue_growth), isPositive: services.revenue_growth >= 0 }}
                />
            </SectionGroup>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                    Gözləyən servislərinizi görmək üçün <a href="/tailor-services" className="underline font-medium">Servis Siyahısı</a> səhifəsinə daxil olun.
                </p>
            </div>
        </div>
    );
}
