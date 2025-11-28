import { Link } from '@inertiajs/react';
import {
    ShoppingCartIcon,
    ArrowUturnLeftIcon,
    ClockIcon,
    ShoppingBagIcon,
    UserGroupIcon,
    PlusCircleIcon,
    PaperAirplaneIcon
} from '@heroicons/react/24/outline';

interface SalesNavigationProps {
    currentRoute?: string;
}

export default function SalesNavigation({ currentRoute }: SalesNavigationProps) {
    const isActive = (routeName: string) => {
        if (!currentRoute) {
            currentRoute = route().current() || '';
        }
        return currentRoute.includes(routeName);
    };

    const navItems = [
        {
            href: route('sales.index'),
            icon: ShoppingCartIcon,
            label: 'Satışlar',
            isActive: isActive('sales.') && !isActive('online-orders')
        },
        {
            href: route('returns.index'),
            icon: ArrowUturnLeftIcon,
            label: 'Mal Qaytarma',
            isActive: isActive('returns')
        },
        {
            href: route('shift-management.index'),
            icon: ClockIcon,
            label: 'Növbə İdarəetməsi',
            isActive: isActive('shift-management')
        },
        {
            href: route('online-orders.index'),
            icon: ShoppingBagIcon,
            label: 'Online Sifarişlər',
            isActive: isActive('online-orders'),
            conditional: true // Will check if shop is enabled
        },
        {
            href: route('customers.index'),
            icon: UserGroupIcon,
            label: 'Müştərilər',
            isActive: isActive('customers')
        }
    ];

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1 mb-6">
            <nav className="flex flex-wrap gap-1">
                <Link
                    href={route('pos.index')}
                    className="relative flex items-center gap-2.5 px-4 py-3 rounded-md font-medium text-sm transition-all duration-200 ease-in-out bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md shadow-green-500/30 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
                >
                    <PlusCircleIcon className="w-5 h-5 text-white" />
                    <span className="font-semibold">POS-da Satış et</span>
                </Link>
                {navItems.filter(item => !item.conditional).map((item) => {
                    const Icon = item.icon;
                    const baseClasses = "relative flex items-center gap-2.5 px-4 py-3 rounded-md font-medium text-sm transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1";

                    const activeClasses = 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/30 transform scale-[1.02]';
                    const inactiveClasses = 'text-gray-600 hover:bg-blue-50 hover:text-blue-700 active:bg-blue-100';

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`${baseClasses} ${item.isActive ? activeClasses : inactiveClasses} focus:ring-blue-500`}
                        >
                            <Icon className={`w-5 h-5 ${item.isActive ? 'text-white' : 'text-gray-400'}`} />
                            <span className="font-semibold">{item.label}</span>
                            {item.isActive && (
                                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full" />
                            )}
                        </Link>
                    );
                })}
                <Link
                    href={route('sms.send-page')}
                    className={`relative flex items-center gap-2.5 px-4 py-3 rounded-md font-medium text-sm transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                        isActive('sms')
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/30 transform scale-[1.02] focus:ring-blue-500'
                            : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700 active:bg-blue-100 focus:ring-blue-500'
                    }`}
                >
                    <PaperAirplaneIcon className={`w-5 h-5 ${isActive('sms') ? 'text-white' : 'text-gray-400'}`} />
                    <span className="font-semibold">SMS Göndər</span>
                    {isActive('sms') && (
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full" />
                    )}
                </Link>
            </nav>
        </div>
    );
}
