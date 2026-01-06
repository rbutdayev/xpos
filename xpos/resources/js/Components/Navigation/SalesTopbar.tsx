import { Link } from '@inertiajs/react';
import {
    ShoppingCartIcon,
    ArrowUturnLeftIcon,
    ClockIcon,
    ShoppingBagIcon,
    UserGroupIcon,
    PlusCircleIcon,
    PaperAirplaneIcon,
    TagIcon,
    GiftIcon,
    TruckIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { useModuleAccess } from '@/Hooks/useModuleAccess';

export default function SalesTopbar() {
    const { t } = useTranslation('common');
    const { hasAnyOnlineOrdering, canAccessModule } = useModuleAccess();

    const isActive = (routeName: string) => {
        const activeRoute = route().current() || '';
        return activeRoute.includes(routeName);
    };

    const navItems = [
        {
            href: route('pos.index'),
            icon: PlusCircleIcon,
            label: t('navigation.new_sale'),
            isActive: false,
            isPrimary: true
        },
        {
            href: route('sales.index'),
            icon: ShoppingCartIcon,
            label: t('navigation.sales_list'),
            isActive: isActive('sales.') && !isActive('online-orders')
        },
        ...(canAccessModule('expeditor') ? [{
            href: route('expeditor.index'),
            icon: TruckIcon,
            label: t('navigation.expeditor', 'Expeditor'),
            isActive: isActive('expeditor')
        }] : []),
        {
            href: route('returns.index'),
            icon: ArrowUturnLeftIcon,
            label: t('navigation.returns'),
            isActive: isActive('returns')
        },
        {
            href: route('shift-management.index'),
            icon: ClockIcon,
            label: t('navigation.shift_management'),
            isActive: isActive('shift-management')
        },
        {
            href: route('customers.index'),
            icon: UserGroupIcon,
            label: t('navigation.customers'),
            isActive: isActive('customers')
        },
        ...(hasAnyOnlineOrdering() ? [{
            href: route('online-orders.index'),
            icon: ShoppingBagIcon,
            label: t('navigation.online_orders'),
            isActive: isActive('online-orders')
        }] : []),
        {
            href: route('sms.send-page'),
            icon: PaperAirplaneIcon,
            label: t('navigation.send_sms'),
            isActive: isActive('sms')
        },
    ];

    return (
        <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
            <div className="px-4 sm:px-6 lg:px-8">
                <nav className="flex gap-1 overflow-x-auto py-3 scrollbar-hide">
                    {navItems.map((item) => {
                        const Icon = item.icon;

                        if (item.isPrimary) {
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-500/30 hover:from-blue-700 hover:to-blue-800 whitespace-nowrap"
                                >
                                    <Icon className="w-5 h-5" />
                                    {item.label}
                                </Link>
                            );
                        }

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`
                                    flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 whitespace-nowrap
                                    ${item.isActive
                                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                        : 'text-gray-600 hover:bg-gray-100'
                                    }
                                `}
                            >
                                <Icon className={`w-5 h-5 ${item.isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
}
