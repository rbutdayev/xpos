import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import LanguageSwitcher from '@/Components/LanguageSwitcher';
import SearchableWarehouseSelect from '@/Components/SearchableWarehouseSelect';
import SessionManager from '@/Components/SessionManager';
import CommandPalette from '@/Components/CommandPalette';
import { Link, usePage, router } from '@inertiajs/react';
import { PropsWithChildren, ReactNode, useState, useEffect } from 'react';
import { getAppVersion } from '@/utils/version';
import { Toaster } from 'react-hot-toast';
import { SERVICE_TYPES, getServiceRoute } from '@/config/serviceTypes';
import { useModuleAccess } from '@/Hooks/useModuleAccess';
import { useTranslation } from 'react-i18next';
import {
    HomeIcon,
    CubeIcon,
    ShoppingCartIcon,
    CurrencyDollarIcon,
    CogIcon,
    Bars3Icon,
    XMarkIcon,
    ChevronDownIcon,
    ChevronLeftIcon,
    BuildingStorefrontIcon,
    WrenchScrewdriverIcon,
    ClockIcon,
    MagnifyingGlassIcon,
    DeviceTabletIcon,
    TruckIcon,
} from '@heroicons/react/24/outline';

// Import topbar navigation components
import SalesTopbar from '@/Components/Navigation/SalesTopbar';
import ProductsTopbar from '@/Components/Navigation/ProductsTopbar';
import WarehouseTopbar from '@/Components/Navigation/WarehouseTopbar';
import FinanceTopbar from '@/Components/Navigation/FinanceTopbar';
import AdminTopbar from '@/Components/Navigation/AdminTopbar';
import RentalsTopbar from '@/Components/Navigation/RentalsTopbar';
import ServicesTopbar from '@/Components/Navigation/ServicesTopbar';

interface SidebarItem {
    name: string;
    href?: string;
    icon: React.ComponentType<{ className?: string }>;
    current?: boolean;
    section: 'dashboard' | 'pos' | 'sales' | 'products' | 'warehouse' | 'services' | 'rentals' | 'finance' | 'admin';
}

export default function SlimSidebarLayout({
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const { t } = useTranslation('common');
    const user = usePage().props.auth.user;
    const warehouses = usePage().props.warehouses as Array<{id: number, name: string, type: string}>;
    const selectedWarehouse = usePage().props.selectedWarehouse as number | null;

    const { canAccessModule, hasAnyOnlineOrdering } = useModuleAccess();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarExpanded, setSidebarExpanded] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('sidebarExpanded');
            return saved === 'true';
        }
        return false;
    });
    const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

    const handleWarehouseChange = (warehouseId: string | number) => {
        const warehouseIdToSend = warehouseId ? (typeof warehouseId === 'string' ? parseInt(warehouseId, 10) : warehouseId) : null;
        router.post('/set-warehouse', { warehouse_id: warehouseIdToSend }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('sidebarExpanded', String(sidebarExpanded));
        }
    }, [sidebarExpanded]);

    // Command palette keyboard shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setCommandPaletteOpen(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Determine active section based on current route
    const getActiveSection = (): string => {
        const currentRoute = route().current() || '';

        if (currentRoute.includes('dashboard')) return 'dashboard';

        // POS routes separate from sales
        if (currentRoute.includes('pos.')) {
            return 'pos';
        }

        if (currentRoute.includes('sales') ||
            currentRoute.includes('expeditor') ||
            (currentRoute.includes('returns.') && !currentRoute.includes('product-returns')) ||
            currentRoute.includes('shift-management') ||
            currentRoute.includes('customers') ||
            (currentRoute.includes('sms') && !currentRoute.includes('sms.logs')) ||
            currentRoute.includes('online-orders')) {
            return 'sales';
        }

        if (currentRoute.includes('products') ||
            (currentRoute.includes('categories') && !currentRoute.includes('expense-categories')) ||
            currentRoute.includes('gift-cards')) {
            return 'products';
        }

        if (currentRoute.includes('goods-receipts') ||
            currentRoute.includes('suppliers') ||
            currentRoute.includes('stock-movements') ||
            currentRoute.includes('inventory') && !currentRoute.includes('rental-inventory') ||
            currentRoute.includes('product-returns') ||
            currentRoute.includes('warehouses') ||
            currentRoute.includes('product-stock') ||
            currentRoute.includes('warehouse-transfers') ||
            currentRoute.includes('alerts') ||
            currentRoute.includes('product-activity')) {
            return 'warehouse';
        }

        if (canAccessModule('services') && (currentRoute.includes('services') ||
            currentRoute.includes('tailor-services') ||
            currentRoute.includes('customer-items'))) {
            return 'services';
        }

        if (canAccessModule('rentals') && (currentRoute.includes('rentals') ||
            currentRoute.includes('rental-inventory') ||
            currentRoute.includes('rental-templates') ||
            currentRoute.includes('rental-categories'))) {
            return 'rentals';
        }

        if (currentRoute.includes('expenses') ||
            currentRoute.includes('expense-categories') ||
            currentRoute.includes('employee-salaries') ||
            currentRoute.includes('supplier-payments') ||
            currentRoute.includes('reports')) {
            return 'finance';
        }

        if (currentRoute.includes('companies') ||
            currentRoute.includes('branches') ||
            (currentRoute.includes('users') && !currentRoute.includes('customers')) ||
            currentRoute.includes('settings') ||
            currentRoute.includes('printer-configs') ||
            currentRoute.includes('receipt-templates') ||
            currentRoute.includes('bridge-tokens') ||
            currentRoute.includes('integrations') ||
            currentRoute.includes('fiscal-printer-jobs') ||
            currentRoute.includes('audit-logs') ||
            currentRoute === 'sms.logs' ||
            currentRoute === 'telegram.logs') {
            return 'admin';
        }

        return 'dashboard';
    };

    const activeSection = getActiveSection();

    // Get navigation based on role (simplified to 6-7 items max)
    const getNavigationForRole = (): SidebarItem[] => {
        const baseNav: SidebarItem[] = [
            {
                name: t('navigation.dashboard'),
                href: '/dashboard',
                icon: HomeIcon,
                current: activeSection === 'dashboard',
                section: 'dashboard'
            },
        ];

        // For cashier - POS access
        if (user.role === 'cashier') {
            return [
                ...baseNav,
                {
                    name: t('navigation.pos_sales'),
                    href: route('pos.index'),
                    icon: ShoppingCartIcon,
                    current: route().current('pos.index'),
                    section: 'pos'
                },
                {
                    name: t('navigation.touch_pos'),
                    href: route('pos.touch'),
                    icon: DeviceTabletIcon,
                    current: route().current('pos.touch'),
                    section: 'pos'
                }
            ];
        }

        // For warehouse manager
        if (user.role === 'warehouse_manager') {
            return [
                ...baseNav,
                {
                    name: t('navigation.products'),
                    href: '/products',
                    icon: CubeIcon,
                    current: activeSection === 'products',
                    section: 'products'
                },
                {
                    name: t('navigation.warehouse'),
                    href: '/goods-receipts',
                    icon: BuildingStorefrontIcon,
                    current: activeSection === 'warehouse',
                    section: 'warehouse'
                }
            ];
        }

        // For accountant
        if (user.role === 'accountant') {
            return [
                ...baseNav,
                {
                    name: t('navigation.sales'),
                    href: '/sales',
                    icon: ShoppingCartIcon,
                    current: activeSection === 'sales',
                    section: 'sales'
                },
                {
                    name: t('navigation.finance'),
                    href: '/expenses',
                    icon: CurrencyDollarIcon,
                    current: activeSection === 'finance',
                    section: 'finance'
                },
                {
                    name: t('navigation.administration'),
                    href: '/settings',
                    icon: CogIcon,
                    current: activeSection === 'admin',
                    section: 'admin'
                }
            ];
        }

        // For tailor
        if (user.role === 'tailor') {
            return [
                ...baseNav,
                ...(canAccessModule('services') ? [{
                    name: t('navigation.services'),
                    href: getServiceRoute('tailor'),
                    icon: WrenchScrewdriverIcon,
                    current: activeSection === 'services',
                    section: 'services' as const
                }] : [])
            ];
        }

        // For branch manager
        if (user.role === 'branch_manager') {
            return [
                ...baseNav,
                {
                    name: t('navigation.finance'),
                    href: '/expenses',
                    icon: CurrencyDollarIcon,
                    current: activeSection === 'finance',
                    section: 'finance'
                },
                {
                    name: t('navigation.administration'),
                    href: '/settings',
                    icon: CogIcon,
                    current: activeSection === 'admin',
                    section: 'admin'
                }
            ];
        }

        // Full navigation for admin, account_owner, sales_staff (6-7 items max)
        const fullNav: SidebarItem[] = [
            ...baseNav,
            {
                name: t('navigation.pos_sales'),
                href: route('pos.index'),
                icon: ShoppingCartIcon,
                current: route().current('pos.index'),
                section: 'pos'
            },
            {
                name: t('navigation.touch_pos'),
                href: route('pos.touch'),
                icon: DeviceTabletIcon,
                current: route().current('pos.touch'),
                section: 'pos'
            },
            {
                name: t('navigation.sales'),
                href: '/sales',
                icon: ShoppingCartIcon,
                current: activeSection === 'sales',
                section: 'sales'
            },
            {
                name: t('navigation.products'),
                href: '/products',
                icon: CubeIcon,
                current: activeSection === 'products',
                section: 'products'
            },
            {
                name: t('navigation.warehouse'),
                href: '/goods-receipts',
                icon: BuildingStorefrontIcon,
                current: activeSection === 'warehouse',
                section: 'warehouse'
            },
            ...(canAccessModule('services') ? [{
                name: t('navigation.services'),
                href: getServiceRoute('tailor'),
                icon: WrenchScrewdriverIcon,
                current: activeSection === 'services',
                section: 'services' as const
            }] : []),
            ...(canAccessModule('rentals') ? [{
                name: t('navigation.rentals'),
                href: '/rentals',
                icon: ClockIcon,
                current: activeSection === 'rentals',
                section: 'rentals' as const
            }] : []),
            {
                name: t('navigation.finance'),
                href: '/expenses',
                icon: CurrencyDollarIcon,
                current: activeSection === 'finance',
                section: 'finance'
            },
            {
                name: t('navigation.administration'),
                href: '/settings',
                icon: CogIcon,
                current: activeSection === 'admin',
                section: 'admin'
            }
        ];

        return fullNav;
    };

    const navigation = getNavigationForRole();

    // Render appropriate topbar based on active section
    const renderTopbar = () => {
        switch (activeSection) {
            case 'pos':
            case 'sales':
                return <SalesTopbar />;
            case 'products':
                return <ProductsTopbar />;
            case 'warehouse':
                return <WarehouseTopbar />;
            case 'finance':
                return <FinanceTopbar />;
            case 'admin':
                return <AdminTopbar />;
            case 'rentals':
                return <RentalsTopbar />;
            case 'services':
                return <ServicesTopbar />;
            default:
                return null;
        }
    };

    const SidebarItem = ({ item }: { item: SidebarItem }) => {
        const IconComponent = item.icon;
        // On mobile (when sidebarOpen is true), always show as expanded
        const showExpanded = sidebarOpen || sidebarExpanded;

        return (
            <Link
                href={item.href!}
                className={`
                    group relative flex items-center rounded-xl px-3 py-3 text-base font-semibold transition-all duration-200
                    ${showExpanded ? '' : 'lg:justify-center'}
                    ${item.current
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30'
                        : 'text-slate-700 hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100 hover:text-slate-900'
                    }
                `}
                title={!showExpanded ? item.name : ''}
            >
                <IconComponent className={`h-6 w-6 flex-shrink-0 transition-all duration-200 ${showExpanded ? 'mr-3' : 'lg:mr-0'} ${item.current ? 'text-white' : 'text-blue-500'}`} />

                {/* Show text when expanded or on mobile */}
                <span className={`whitespace-nowrap ${showExpanded ? '' : 'lg:hidden'}`}>{item.name}</span>

                {/* Tooltip on hover (only when collapsed on desktop) */}
                {!sidebarExpanded && (
                    <span className="hidden lg:block absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none">
                        {item.name}
                    </span>
                )}
            </Link>
        );
    };

    return (
        <>
            <SessionManager />
            <Toaster position="top-right" />
            <CommandPalette
                isOpen={commandPaletteOpen}
                onClose={() => setCommandPaletteOpen(false)}
            />

            <div className="flex h-screen bg-gray-100 overflow-hidden">
                {/* Mobile sidebar overlay */}
                {sidebarOpen && (
                    <div className="fixed inset-0 z-40 lg:hidden">
                        <div
                            className="fixed inset-0 bg-gray-600 bg-opacity-75"
                            onClick={() => setSidebarOpen(false)}
                        />
                    </div>
                )}

                {/* Slim Sidebar */}
                <div className={`
                    fixed inset-y-0 left-0 z-50 flex flex-col bg-white shadow-2xl transform transition-all duration-300 ease-in-out border-r border-slate-200
                    ${sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'}
                    ${sidebarExpanded ? 'lg:w-64' : 'lg:w-20'}
                `}>
                    {/* Sidebar header */}
                    <div className="flex h-16 flex-shrink-0 items-center border-b border-slate-200 px-4 justify-center bg-gradient-to-r from-white to-slate-50 relative">
                        {/* Mobile close button */}
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden absolute top-3 right-3 p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-all duration-200 z-10"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>

                        {/* Logo (when expanded) or Toggle button (when collapsed) */}
                        {sidebarExpanded ? (
                            <>
                                <Link href="/dashboard" className="flex items-center group">
                                    <ApplicationLogo className="h-10 w-10" />
                                </Link>
                                {/* Collapse button */}
                                <button
                                    onClick={() => setSidebarExpanded(false)}
                                    className="hidden lg:flex items-center justify-center p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-all duration-200 ml-auto"
                                    title={t('navigation.collapse')}
                                >
                                    <ChevronLeftIcon className="w-5 h-5" />
                                </button>
                            </>
                        ) : (
                            /* Expand button (centered when collapsed) */
                            <button
                                onClick={() => setSidebarExpanded(true)}
                                className="hidden lg:flex items-center justify-center w-10 h-10 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-all duration-200"
                                title={t('navigation.expand')}
                            >
                                <Bars3Icon className="w-6 h-6" />
                            </button>
                        )}
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
                        {navigation.map((item) => (
                            <SidebarItem key={item.name} item={item} />
                        ))}
                    </nav>

                    {/* User menu */}
                    <div className={`flex-shrink-0 border-t border-slate-200 p-3 relative z-[60] bg-gradient-to-r from-white to-slate-50`}>
                        <Dropdown>
                            <Dropdown.Trigger>
                                {sidebarExpanded ? (
                                    /* Expanded state: Full user card */
                                    <button className="group block w-full rounded-xl bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200 px-3 py-2.5 text-left transition-all duration-200 shadow-sm hover:shadow-md border border-slate-200">
                                        <div className="flex items-center">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-sm font-bold text-white shadow-md shadow-blue-500/30 ring-2 ring-blue-400/20">
                                                {user.name?.charAt(0).toUpperCase() || '?'}
                                            </div>
                                            <div className="ml-3 flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                                                <p className="text-xs text-slate-600 truncate">{user.email}</p>
                                            </div>
                                            <ChevronDownIcon className="h-4 w-4 text-slate-500 group-hover:text-slate-700 transition-colors flex-shrink-0" />
                                        </div>
                                    </button>
                                ) : (
                                    /* Collapsed state: Circle only */
                                    <button
                                        className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-base font-bold text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 transition-all duration-200 mx-auto ring-2 ring-blue-400/20"
                                        title={`${user.name}\n${user.email}`}
                                    >
                                        {user.name?.charAt(0).toUpperCase() || '?'}
                                    </button>
                                )}
                            </Dropdown.Trigger>

                            <Dropdown.Content align="right" direction="up" contentClasses="py-1 bg-white border border-slate-200 shadow-xl" width="48">
                                <div className="px-4 py-3 border-b border-gray-200">
                                    <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                                    <p className="text-xs text-gray-500">{user.email}</p>
                                </div>
                                <Dropdown.Link href="/profile">{t('navigation.profile')}</Dropdown.Link>
                                <Dropdown.Link
                                    href={route('logout')}
                                    method="post"
                                    as="button"
                                >
                                    {t('actions.logout')}
                                </Dropdown.Link>
                            </Dropdown.Content>
                        </Dropdown>
                    </div>
                </div>

                {/* Main content */}
                <div className={`flex flex-1 flex-col overflow-hidden transition-all duration-300 ${sidebarExpanded ? 'lg:pl-64' : 'lg:pl-20'}`}>
                    {/* Top bar */}
                    <div className="sticky top-0 z-30 flex h-16 flex-shrink-0 border-b border-gray-200 bg-white shadow-sm">
                        <button
                            type="button"
                            className="border-r border-gray-200 px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Bars3Icon className="h-6 w-6" />
                        </button>

                        <div className="flex flex-1 justify-between px-4">
                            <div className="flex flex-1 items-center gap-4">
                                {/* Search trigger */}
                                <button
                                    onClick={() => setCommandPaletteOpen(true)}
                                    className="hidden lg:flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    <MagnifyingGlassIcon className="w-4 h-4" />
                                    <span>{t('navigation.search')}</span>
                                    <kbd className="px-2 py-0.5 text-xs bg-white border border-gray-300 rounded">⌘K</kbd>
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <LanguageSwitcher />
                            </div>
                        </div>
                    </div>

                    {/* Topbar Navigation */}
                    {renderTopbar()}

                    {/* Page content */}
                    <main className="flex-1 overflow-y-auto pb-16">
                        <div className="w-full px-4 py-6 sm:px-6 lg:px-8">
                            {children}
                        </div>
                    </main>

                    {/* Bottom Information Bar */}
                    <footer className={`fixed bottom-0 right-0 left-0 z-30 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 text-white shadow-lg transition-all duration-300 ${sidebarExpanded ? 'lg:left-64' : 'lg:left-20'}`}>
                        <div className="flex items-center justify-between px-4 py-2 text-xs">
                            <div className="flex items-center space-x-4">
                                <Link
                                    href="/knowledge"
                                    className="flex items-center space-x-1 bg-slate-600 hover:bg-slate-500 px-2 py-1 rounded transition-colors duration-200 text-slate-200 hover:text-white"
                                >
                                    <span>{t('footer.knowledge_base')}</span>
                                </Link>
                            </div>

                            <div className="flex items-center space-x-1 text-slate-300">
                                <span>{t('footer.version')}:</span>
                                <span className="font-mono bg-slate-600 px-2 py-0.5 rounded text-white">{getAppVersion()}</span>
                            </div>

                            <div className="flex items-center space-x-6">
                                <div className="flex items-center space-x-1 text-slate-300">
                                    <span className="text-blue-300 font-medium">Onyx Digital</span>
                                </div>

                                <div className="flex items-center space-x-1">
                                    <button
                                        onClick={() => window.open('https://onyx.az/az/contact', '_blank')}
                                        className="flex items-center space-x-1 bg-slate-600 hover:bg-slate-500 px-2 py-1 rounded transition-colors duration-200 text-slate-200 hover:text-white"
                                    >
                                        <span className="text-xs">{t('footer.support')}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </footer>
                </div>
            </div>
        </>
    );
}
