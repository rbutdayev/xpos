import { Link } from '@inertiajs/react';
import {
    BuildingStorefrontIcon,
    CubeIcon,
    ExclamationTriangleIcon,
    MagnifyingGlassCircleIcon,
    ClockIcon
} from '@heroicons/react/24/outline';

interface InventoryNavigationProps {
    currentRoute?: string;
}

export default function InventoryNavigation({ currentRoute }: InventoryNavigationProps) {
    const isActive = (routeName: string) => {
        if (!currentRoute) {
            currentRoute = route().current() || '';
        }
        return currentRoute.includes(routeName);
    };

    const navItems = [
        {
            href: route('warehouses.index'),
            icon: BuildingStorefrontIcon,
            label: 'Anbarlar',
            isActive: isActive('warehouses')
        },
        {
            href: route('product-stock.index'),
            icon: CubeIcon,
            label: 'Məhsul stoku',
            isActive: isActive('product-stock')
        },
        {
            href: route('warehouse-transfers.index'),
            icon: CubeIcon,
            label: 'Transferlər',
            isActive: isActive('warehouse-transfers')
        },
        {
            href: route('alerts.index'),
            icon: ExclamationTriangleIcon,
            label: 'Xəbərdarlıqlar',
            isActive: isActive('alerts'),
            special: 'warning'
        },
        {
            href: route('product-activity.timeline'),
            icon: ClockIcon,
            label: 'Məhsul tarixi',
            isActive: isActive('product-activity.timeline')
        }
    ];

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1 mb-6">
            <nav className="flex flex-wrap gap-1">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const baseClasses = "relative flex items-center gap-2.5 px-4 py-3 rounded-md font-medium text-sm transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1";

                    let activeClasses = '';
                    let inactiveClasses = '';
                    let iconActiveColor = '';
                    let iconInactiveColor = 'text-gray-400';

                    if (item.special === 'warning') {
                        activeClasses = 'bg-yellow-50 text-yellow-700 border border-yellow-200 shadow-sm';
                        inactiveClasses = 'text-yellow-700 bg-yellow-50 hover:bg-yellow-100 active:bg-yellow-200 border border-yellow-200';
                        iconActiveColor = 'text-yellow-600';
                        iconInactiveColor = 'text-yellow-600';
                    } else if (item.special === 'info') {
                        activeClasses = 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm';
                        inactiveClasses = 'text-blue-700 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 border border-blue-200';
                        iconActiveColor = 'text-blue-600';
                        iconInactiveColor = 'text-blue-600';
                    } else {
                        activeClasses = 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/30 transform scale-[1.02]';
                        inactiveClasses = 'text-gray-600 hover:bg-blue-50 hover:text-blue-700 active:bg-blue-100';
                        iconActiveColor = 'text-white';
                    }

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`${baseClasses} ${item.isActive ? activeClasses : inactiveClasses} focus:ring-blue-500`}
                        >
                            <Icon className={`w-5 h-5 ${item.isActive ? iconActiveColor : iconInactiveColor}`} />
                            <span className="font-semibold">{item.label}</span>
                            {item.isActive && !item.special && (
                                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full" />
                            )}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
