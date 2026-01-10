import { Link } from '@inertiajs/react';
import {
    ArrowDownTrayIcon,
    ArrowsRightLeftIcon,
    ClipboardDocumentListIcon,
    TruckIcon,
    ArrowUturnLeftIcon,
    BuildingStorefrontIcon,
    CubeIcon,
    ExclamationTriangleIcon,
    ClockIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

export default function WarehouseTopbar() {
    const { t } = useTranslation('common');

    const isActive = (routeName: string) => {
        const activeRoute = route().current() || '';
        return activeRoute.includes(routeName);
    };

    const navItems = [
        {
            href: route('goods-receipts.index'),
            icon: ArrowDownTrayIcon,
            label: t('navigation.goods_receipt'),
            isActive: isActive('goods-receipts')
        },
        {
            href: route('stock-movements.index'),
            icon: ArrowsRightLeftIcon,
            label: t('navigation.stock_movements'),
            isActive: isActive('stock-movements')
        },
        {
            href: route('inventory.index'),
            icon: ClipboardDocumentListIcon,
            label: t('navigation.inventory'),
            isActive: isActive('inventory') && !isActive('rental-inventory')
        },
        {
            href: route('suppliers.index'),
            icon: TruckIcon,
            label: t('navigation.suppliers'),
            isActive: isActive('suppliers')
        },
        {
            href: route('product-returns.index'),
            icon: ArrowUturnLeftIcon,
            label: t('navigation.product_returns'),
            isActive: isActive('product-returns')
        },
        {
            href: route('warehouses.index'),
            icon: BuildingStorefrontIcon,
            label: t('navigation.warehouses'),
            isActive: isActive('warehouses')
        },
        {
            href: route('product-stock.index'),
            icon: CubeIcon,
            label: t('navigation.product_stock'),
            isActive: isActive('product-stock')
        },
        {
            href: route('warehouse-transfers.index'),
            icon: ArrowsRightLeftIcon,
            label: t('navigation.transfers'),
            isActive: isActive('warehouse-transfers')
        },
        {
            href: route('alerts.index'),
            icon: ExclamationTriangleIcon,
            label: t('navigation.alerts'),
            isActive: isActive('alerts')
        },
        {
            href: route('product-activity.timeline'),
            icon: ClockIcon,
            label: t('navigation.product_history'),
            isActive: isActive('product-activity.timeline')
        },
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
