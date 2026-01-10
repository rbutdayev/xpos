import { Link } from '@inertiajs/react';
import {
    BanknotesIcon,
    UsersIcon,
    PlusCircleIcon,
    FolderIcon,
    CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

export default function FinanceTopbar() {
    const { t } = useTranslation('common');

    const isActive = (routeName: string) => {
        const activeRoute = route().current() || '';
        return activeRoute.includes(routeName);
    };

    const navItems = [
        {
            href: route('expenses.create'),
            icon: PlusCircleIcon,
            label: t('navigation.new_expense'),
            isActive: false,
            isPrimary: true
        },
        {
            href: route('expenses.index'),
            icon: BanknotesIcon,
            label: t('navigation.expenses'),
            isActive: isActive('expenses.') && !isActive('expense-categories')
        },
        {
            href: route('expense-categories.index'),
            icon: FolderIcon,
            label: t('navigation.expense_categories'),
            isActive: isActive('expense-categories')
        },
        {
            href: route('employee-salaries.index'),
            icon: UsersIcon,
            label: t('navigation.employee_salaries'),
            isActive: isActive('employee-salaries')
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
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 bg-gradient-to-r from-slate-700 to-slate-800 text-white shadow-md shadow-slate-500/30 hover:from-slate-600 hover:to-slate-700 whitespace-nowrap"
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
