import { Link } from '@inertiajs/react';
import {
    ChartBarIcon,
    CalendarIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { useModuleAccess } from '@/Hooks/useModuleAccess';

interface NavItem {
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    isActive: boolean;
}

export default function ReportsTopbar() {
    const { t } = useTranslation('common');
    const { canAccessModule } = useModuleAccess();

    const isActive = (routeName: string) => {
        const activeRoute = route().current() || '';
        return activeRoute.includes(routeName);
    };

    const navItems: NavItem[] = [
        {
            href: route('reports.index'),
            icon: ChartBarIcon,
            label: t('navigation.reports'),
            isActive: isActive('reports.') && !isActive('attendance')
        },
        ...(canAccessModule('attendance') ? [{
            href: route('attendance.reports.index'),
            icon: CalendarIcon,
            label: t('navigation.attendance'),
            isActive: isActive('attendance')
        }] : []),
    ];

    return (
        <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
            <div className="px-4 sm:px-6 lg:px-8">
                <nav className="flex gap-1 overflow-x-auto py-3 scrollbar-hide">
                    {navItems.map((item) => {
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`
                                    flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 whitespace-nowrap
                                    ${item.isActive
                                        ? 'bg-slate-50 text-slate-700 border border-slate-200'
                                        : 'text-gray-600 hover:bg-gray-100'
                                    }
                                `}
                            >
                                <Icon className={`w-5 h-5 ${item.isActive ? 'text-slate-600' : 'text-gray-400'}`} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
}
