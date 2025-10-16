import { 
    CubeIcon, 
    UserGroupIcon, 
    WrenchScrewdriverIcon, 
    HomeModernIcon 
} from '@heroicons/react/24/outline';

interface DashboardStats {
    products_count: number;
    customers_count: number;
    service_records_this_month: number;
    warehouses_count: number;
}

interface QuickStatsProps {
    stats: DashboardStats;
}

export default function QuickStats({ stats }: QuickStatsProps) {
    const statItems = [
        {
            name: 'Məhsullar',
            value: stats.products_count,
            icon: CubeIcon,
        },
        {
            name: 'Müştərilər', 
            value: stats.customers_count,
            icon: UserGroupIcon,
        },
        {
            name: 'Bu ay servislər',
            value: stats.service_records_this_month,
            icon: WrenchScrewdriverIcon,
        },
        {
            name: 'Anbarlar',
            value: stats.warehouses_count,
            icon: HomeModernIcon,
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {statItems.map((item) => {
                const IconComponent = item.icon;
                return (
                    <div key={item.name} className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <IconComponent className="h-6 w-6 text-gray-400" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            {item.name}
                                        </dt>
                                        <dd className="text-lg font-medium text-gray-900">
                                            {item.value.toLocaleString('az-AZ')}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}