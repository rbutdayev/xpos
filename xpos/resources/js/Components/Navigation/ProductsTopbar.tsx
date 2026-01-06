import { Link } from '@inertiajs/react';
import {
    CubeIcon,
    TagIcon,
    PlusCircleIcon,
    DocumentPlusIcon,
    ReceiptPercentIcon,
    GiftIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

export default function ProductsTopbar() {
    const { t } = useTranslation('common');

    const activeRoute = route().current() || '';
    const isActive = (routeName: string) => {
        return activeRoute.includes(routeName);
    };

    const navItems = [
        {
            href: route('products.create'),
            icon: PlusCircleIcon,
            label: t('navigation.new_product'),
            isActive: false,
            isPrimary: true
        },
        {
            href: route('products.index'),
            icon: CubeIcon,
            label: t('navigation.products'),
            isActive: isActive('products.') && !isActive('products.discounts') && !isActive('products.create') && !isActive('products.bulk-create')
        },
        {
            href: route('categories.index'),
            icon: TagIcon,
            label: t('navigation.categories'),
            isActive: isActive('categories.') && !isActive('expense-categories')
        },
        {
            href: route('products.bulk-create'),
            icon: DocumentPlusIcon,
            label: t('navigation.bulk_create'),
            isActive: isActive('products.bulk-create')
        },
        {
            href: route('products.discounts'),
            icon: ReceiptPercentIcon,
            label: t('navigation.discounts'),
            isActive: isActive('products.discounts')
        },
        {
            href: route('gift-cards.index'),
            icon: GiftIcon,
            label: t('navigation.gift_cards'),
            isActive: isActive('gift-cards')
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
