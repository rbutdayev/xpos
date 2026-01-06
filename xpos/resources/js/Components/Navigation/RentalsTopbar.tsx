import { Link } from '@inertiajs/react';
import {
    CalendarIcon,
    ClipboardDocumentListIcon,
    PlusCircleIcon,
    CubeIcon,
    TagIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

export default function RentalsTopbar() {
    const { t } = useTranslation('common');

    const activeRoute = route().current() || '';
    const isActive = (routeName: string) => {
        return activeRoute.includes(routeName);
    };

    const navItems = [
        {
            href: route('rentals.create'),
            icon: PlusCircleIcon,
            label: 'Yeni İcarə',
            isActive: false,
            isPrimary: true
        },
        {
            href: route('rentals.index'),
            icon: ClipboardDocumentListIcon,
            label: 'İcarələr',
            isActive: isActive('rentals.index') || isActive('rentals.show') || isActive('rentals.edit')
        },
        {
            href: route('rentals.calendar'),
            icon: CalendarIcon,
            label: 'Təqvim',
            isActive: isActive('rentals.calendar')
        },
        {
            href: route('rental-inventory.index'),
            icon: CubeIcon,
            label: 'İcarə İnventarı',
            isActive: isActive('rental-inventory')
        },
        {
            href: route('rental-templates.index'),
            icon: TagIcon,
            label: 'Müqavilə Şablonları',
            isActive: isActive('rental-templates')
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
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
}
