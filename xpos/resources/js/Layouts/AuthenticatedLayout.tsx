import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import SearchableWarehouseSelect from '@/Components/SearchableWarehouseSelect';
import { Link, usePage, router } from '@inertiajs/react';
import { PropsWithChildren, ReactNode, useState, useEffect } from 'react';
import { getAppVersion } from '@/utils/version';
import { Toaster } from 'react-hot-toast';
import {
    HomeIcon,
    CubeIcon,
    TruckIcon,
    TagIcon,
    UserGroupIcon,
    WrenchScrewdriverIcon,
    UsersIcon,
    ArrowsRightLeftIcon,
    ShoppingCartIcon,
    PrinterIcon,
    ChartBarIcon,
    CurrencyDollarIcon,
    CogIcon,
    BuildingOffice2Icon,
    HomeModernIcon,
    ExclamationTriangleIcon,
    Bars3Icon,
    XMarkIcon,
    ChevronDownIcon,
    ChevronRightIcon,
    ClipboardDocumentListIcon,
    ArrowDownTrayIcon,
    ArrowUturnLeftIcon,
    InboxIcon,
    ChevronLeftIcon,
    DeviceTabletIcon
} from '@heroicons/react/24/outline';

interface SidebarItem {
    name: string;
    href?: string;
    icon: React.ComponentType<{ className?: string }>;
    current?: boolean;
    children?: SidebarItem[];
}

export default function Authenticated({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const user = usePage().props.auth.user;
    const warehouses = usePage().props.warehouses as Array<{id: number, name: string, type: string}>;
    const selectedWarehouse = usePage().props.selectedWarehouse as number | null;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    const handleWarehouseChange = (warehouseId: string) => {
        const warehouseIdToSend = warehouseId ? parseInt(warehouseId, 10) : null;
        router.post('/set-warehouse', { warehouse_id: warehouseIdToSend }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const getCurrentWarehouse = () => {
        if (!selectedWarehouse) return null;
        return warehouses.find(w => w.id === selectedWarehouse);
    };

    // Determine which menus should be open based on current route
    const getInitialOpenMenus = (): string[] => {
        const currentRoute = route().current();
        const openMenus: string[] = ['dashboard']; // Always show dashboard
        
        // Check which section the current route belongs to and open that menu
        if (currentRoute?.includes('companies') || 
            currentRoute?.includes('branches') || 
            currentRoute?.includes('users') || 
            currentRoute?.includes('warehouses') ||
            currentRoute?.includes('settings')) {
            openMenus.push('Şirkət');
        }
        
        if (currentRoute?.includes('products') || 
            currentRoute?.includes('suppliers') || 
            currentRoute?.includes('categories')) {
            openMenus.push('Anbar İdarəetməsi');
        }
        
        if (currentRoute?.includes('customers') ||
            currentRoute?.includes('customer-items') ||
            currentRoute?.includes('tailor-services')) {
            openMenus.push('Müştəri Xidmətləri');
        }
        
        if (currentRoute?.includes('stock-movements') || 
            currentRoute?.includes('goods-receipts') ||
            currentRoute?.includes('warehouse-transfers') || 
            currentRoute?.includes('product-returns') || 
            currentRoute?.includes('alerts') ||
            currentRoute?.includes('inventory')) {
            openMenus.push('Stok İdarəetməsi');
        }
        
        if (currentRoute?.includes('sales')) {
            openMenus.push('Satış və POS');
        }
        
        if (currentRoute?.includes('pos')) {
            // POS is at root level, no need to open any menu
        }
        
        if (currentRoute?.includes('expenses') || 
            currentRoute?.includes('expense-categories') || 
            currentRoute?.includes('employee-salaries') || 
            currentRoute?.includes('supplier-payments')) {
            openMenus.push('Maliyyə');
        }
        
        if (currentRoute?.includes('reports')) {
            openMenus.push('Hesabatlar');
        }
        
        if (currentRoute?.includes('receipt-templates') || 
            currentRoute?.includes('settings') || 
            currentRoute?.includes('audit-logs')) {
            openMenus.push('Sistem');
        }
        
        return openMenus;
    };

    const [openMenus, setOpenMenus] = useState<string[]>(getInitialOpenMenus());

    // Update open menus when route changes
    useEffect(() => {
        setOpenMenus(getInitialOpenMenus());
    }, [route().current()]);

    // Update time every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const toggleMenu = (menuName: string) => {
        setOpenMenus(prev => 
            prev.includes(menuName) 
                ? prev.filter(name => name !== menuName)
                : [...prev, menuName]
        );
    };

    // Filter navigation based on user role
    const getNavigationForRole = () => {
        const baseNavigation: SidebarItem[] = [
            {
                name: 'Dashboard',
                href: '/dashboard',
                icon: HomeIcon,
                current: route().current('dashboard')
            },
            {
                name: 'POS Satış',
                href: route('pos.index'),
                icon: ShoppingCartIcon,
                current: route().current('pos.index')
            },
            {
                name: 'TouchPOS',
                href: route('pos.touch'),
                icon: DeviceTabletIcon,
                current: route().current('pos.touch')
            },
        ];

        // If user is sales_staff, only show Dashboard, Products (read-only), Sales, and Customer Services
        if (user.role === 'sales_staff') {
            return [
                ...baseNavigation,
                {
                    name: 'Anbar İdarəetməsi',
                    icon: CubeIcon,
                    children: [
                        {
                            name: 'Məhsullar',
                            href: '/products',
                            icon: CubeIcon,
                            current: route().current('products.*')
                        }
                    ]
                },
                {
                    name: 'Müştəri Xidmətləri',
                    icon: UserGroupIcon,
                    children: [
                        {
                            name: 'Müştərilər',
                            href: '/customers',
                            icon: UserGroupIcon,
                            current: route().current('customers.*')
                        },
                        {
                            name: 'Müştəri Məhsulları',
                            href: '/customer-items',
                            icon: TruckIcon,
                            current: route().current('customer-items.*')
                        },
                        {
                            name: 'Dərzi Xidmətləri',
                            href: '/tailor-services',
                            icon: WrenchScrewdriverIcon,
                            current: route().current('tailor-services.*')
                        }
                    ]
                },
                {
                    name: 'Satış və POS',
                    icon: ShoppingCartIcon,
                    children: [
                        {
                            name: 'Satışlar',
                            href: '/sales',
                            icon: ShoppingCartIcon,
                            current: route().current('sales.*')
                        }
                    ]
                }
            ];
        }

        // Full navigation for other roles
        return [
            ...baseNavigation,
        {
            name: 'Şirkət',
            icon: BuildingOffice2Icon,
            children: [
                {
                    name: 'Şirkət Məlumatları',
                    href: '/companies',
                    icon: BuildingOffice2Icon,
                    current: route().current('companies.*') || route().current('settings.*')
                },
                {
                    name: 'Filiallar',
                    href: '/branches',
                    icon: BuildingOffice2Icon,
                    current: route().current('branches.*')
                },
                {
                    name: 'İstifadəçilər',
                    href: '/users',
                    icon: UsersIcon,
                    current: route().current('users.*')
                },
                {
                    name: 'Anbarlar',
                    href: '/warehouses',
                    icon: HomeModernIcon,
                    current: route().current('warehouses.*')
                }
            ]
        },
        {
            name: 'Anbar İdarəetməsi',
            icon: CubeIcon,
            children: [
                {
                    name: 'Məhsullar',
                    href: '/products',
                    icon: CubeIcon,
                    current: route().current('products.*')
                },
                {
                    name: 'Təchizatçılar',
                    href: '/suppliers',
                    icon: TruckIcon,
                    current: route().current('suppliers.*')
                },
                {
                    name: 'Kateqoriyalar',
                    href: '/categories',
                    icon: TagIcon,
                    current: route().current('categories.*')
                }
            ]
        },
        {
            name: 'Müştəri Xidmətləri',
            icon: UserGroupIcon,
            children: [
                {
                    name: 'Müştərilər',
                    href: '/customers',
                    icon: UserGroupIcon,
                    current: route().current('customers.*')
                },
                {
                    name: 'Müştəri Məhsulları',
                    href: '/customer-items',
                    icon: TruckIcon,
                    current: route().current('customer-items.*')
                },
                {
                    name: 'Dərzi Xidmətləri',
                    href: '/tailor-services',
                    icon: WrenchScrewdriverIcon,
                    current: route().current('tailor-services.*')
                }
            ]
        },
        {
            name: 'Stok İdarəetməsi',
            icon: ArrowsRightLeftIcon,
            children: [
                {
                    name: 'İnventar',
                    href: '/inventory',
                    icon: CubeIcon,
                    current: route().current('inventory.*')
                },
                {
                    name: 'Stok Hərəkətləri',
                    href: '/stock-movements',
                    icon: ClipboardDocumentListIcon,
                    current: route().current('stock-movements.*')
                },
                {
                    name: 'Mal Qəbulu',
                    href: '/goods-receipts',
                    icon: ArrowDownTrayIcon,
                    current: route().current('goods-receipts.*')
                },
                {
                    name: 'Anbar Transferləri',
                    href: '/warehouse-transfers',
                    icon: ArrowsRightLeftIcon,
                    current: route().current('warehouse-transfers.*')
                },
                {
                    name: 'Məhsul Qaytarmaları',
                    href: '/product-returns',
                    icon: ArrowUturnLeftIcon,
                    current: route().current('product-returns.*')
                },
                {
                    name: 'Stok Xəbərdarlıqları',
                    href: '/alerts',
                    icon: ExclamationTriangleIcon,
                    current: route().current('alerts.*')
                }
            ]
        },
        {
            name: 'Satış və POS',
            icon: ShoppingCartIcon,
            children: [
                {
                    name: 'Satışlar',
                    href: '/sales',
                    icon: ShoppingCartIcon,
                    current: route().current('sales.*')
                }
            ]
        },
        {
            name: 'Maliyyə',
            icon: CurrencyDollarIcon,
            children: [
                {
                    name: 'Xərclər',
                    href: '/expenses',
                    icon: CurrencyDollarIcon,
                    current: route().current('expenses.*')
                },
                {
                    name: 'Xərc Kateqoriyaları',
                    href: '/expense-categories',
                    icon: TagIcon,
                    current: route().current('expense-categories.*')
                },
                {
                    name: 'İşçi Maaşları',
                    href: '/employee-salaries',
                    icon: UsersIcon,
                    current: route().current('employee-salaries.*')
                },
                {
                    name: 'Təchizatçı Ödənişləri',
                    href: '/supplier-payments',
                    icon: TruckIcon,
                    current: route().current('supplier-payments.*')
                }
            ]
        },
        {
            name: 'Hesabatlar',
            icon: ChartBarIcon,
            children: [
                {
                    name: 'Hesabat Mərkəzi',
                    href: '/reports',
                    icon: ChartBarIcon,
                    current: route().current('reports.*')
                }
            ]
        },
        {
            name: 'Sistem',
            icon: CogIcon,
            children: [
                // Disabled - using standard PC printing instead
                // {
                //     name: 'Printer Konfiqurasiyası',
                //     href: '/printer-configs',
                //     icon: PrinterIcon,
                //     current: route().current('printer-configs.*')
                // },
                {
                    name: 'Qəbz Şablonları',
                    href: '/receipt-templates',
                    icon: PrinterIcon,
                    current: route().current('receipt-templates.*')
                },
                {
                    name: 'Audit Logları',
                    href: '/audit-logs',
                    icon: CogIcon,
                    current: route().current('audit-logs.*')
                }
            ]
        }
        ];
    };

    const navigation = getNavigationForRole();

    const SidebarItem = ({ item, level = 0 }: { item: SidebarItem; level?: number }) => {
        const hasChildren = item.children && item.children.length > 0;
        const isOpen = openMenus.includes(item.name);
        const IconComponent = item.icon;

        if (hasChildren) {
            return (
                <div>
                    <button
                        onClick={() => {
                            if (sidebarCollapsed) {
                                // When collapsed, expand sidebar and open menu
                                setSidebarCollapsed(false);
                                setOpenMenus(prev => [...prev, item.name]);
                            } else {
                                // Normal toggle behavior
                                toggleMenu(item.name);
                            }
                        }}
                        className={`
                            group relative flex w-full items-center rounded-xl px-3 py-3 text-left text-base font-semibold transition-all duration-200
                            ${item.current
                                ? 'bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                                : 'text-slate-700 hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100 hover:text-slate-900 hover:shadow-md'
                            }
                            ${sidebarCollapsed ? 'justify-center' : ''}
                        `}
                        style={{ paddingLeft: sidebarCollapsed ? '12px' : `${12 + level * 16}px` }}
                        title={sidebarCollapsed ? item.name : ''}
                    >
                        <IconComponent className={`h-6 w-6 flex-shrink-0 transition-all duration-200 group-hover:scale-110 ${sidebarCollapsed ? '' : 'mr-3'} ${item.current ? 'text-white' : 'text-blue-500'}`} />
                        {!sidebarCollapsed && (
                            <>
                                <span className="flex-1">{item.name}</span>
                                {isOpen ? (
                                    <ChevronDownIcon className="h-5 w-5 transition-transform duration-200" />
                                ) : (
                                    <ChevronRightIcon className="h-5 w-5 transition-transform duration-200" />
                                )}
                            </>
                        )}
                    </button>
                    
                    {isOpen && !sidebarCollapsed && (
                        <div className="mt-1 space-y-0.5 pl-2">
                            {item.children?.map((child) => (
                                <SidebarItem key={child.name} item={child} level={level + 1} />
                            ))}
                        </div>
                    )}
                </div>
            );
        }

        return (
            <Link
                href={item.href!}
                className={`
                    group relative flex items-center rounded-xl px-3 py-3 text-base font-semibold transition-all duration-200
                    ${item.current
                        ? 'bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                        : 'text-slate-700 hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100 hover:text-slate-900 hover:shadow-md'
                    }
                    ${sidebarCollapsed ? 'justify-center' : ''}
                `}
                style={{ paddingLeft: sidebarCollapsed ? '12px' : `${12 + level * 16}px` }}
                title={sidebarCollapsed ? item.name : ''}
            >
                <IconComponent className={`h-6 w-6 flex-shrink-0 transition-all duration-200 group-hover:scale-110 ${sidebarCollapsed ? '' : 'mr-3'} ${item.current ? 'text-white' : 'text-blue-500'}`} />
                {!sidebarCollapsed && item.name}
            </Link>
        );
    };

    return (
        <>
            <Toaster position="top-right" />
            <div className="flex h-screen bg-gray-100">
                {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-40 lg:hidden">
                    <div 
                        className="fixed inset-0 bg-gray-600 bg-opacity-75"
                        onClick={() => setSidebarOpen(false)}
                    />
                </div>
            )}

            {/* Sidebar - Premium Light Theme */}
            <div className={`
                fixed inset-y-0 left-0 z-50 flex flex-col bg-white shadow-2xl shadow-slate-200/50 transform transition-all duration-300 ease-in-out lg:translate-x-0 border-r border-slate-200
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                ${sidebarCollapsed ? 'w-20' : 'w-72'}
            `}>
                {/* Sidebar header */}
                <div className="flex h-16 flex-shrink-0 items-center border-b border-slate-200 px-4 justify-between bg-gradient-to-r from-white to-slate-50">
                    {sidebarCollapsed ? (
                        <button
                            onClick={() => setSidebarCollapsed(false)}
                            className="flex items-center justify-center w-full group"
                            title="Genişlət"
                        >
                            <div className="flex h-10 w-10 items-center justify-center bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 text-white text-xl font-bold shadow-lg shadow-blue-500/30 group-hover:shadow-cyan-500/50 group-hover:scale-105 transition-all duration-200 rounded-xl">
                                X
                            </div>
                        </button>
                    ) : (
                        <>
                            <Link href="/dashboard" className="flex items-center group">
                                <ApplicationLogo className="h-8 w-auto" />
                            </Link>
                            {/* Collapse button */}
                            <button
                                onClick={() => setSidebarCollapsed(true)}
                                className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-all duration-200"
                                title="Kiçilt"
                            >
                                <ChevronLeftIcon className="w-5 h-5" />
                            </button>
                        </>
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
                            {sidebarCollapsed ? (
                                <button
                                    className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 text-base font-bold text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-105 transition-all duration-200 mx-auto ring-2 ring-cyan-400/20"
                                    title={`${user.name}\n${user.email}`}
                                >
                                    {user.name?.charAt(0).toUpperCase() || '?'}
                                </button>
                            ) : (
                                <button className="group block w-full rounded-xl bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200 px-3 py-2.5 text-left transition-all duration-200 shadow-sm hover:shadow-md border border-slate-200">
                                    <div className="flex items-center">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 text-sm font-bold text-white shadow-md shadow-cyan-500/30 ring-2 ring-cyan-400/20">
                                            {user.name?.charAt(0).toUpperCase() || '?'}
                                        </div>
                                        <div className="ml-3 flex-1 min-w-0">
                                            <p className="text-base font-semibold text-slate-900 truncate">{user.name}</p>
                                            <p className="text-sm text-slate-600 truncate">{user.email}</p>
                                        </div>
                                        <ChevronDownIcon className="h-5 w-5 text-slate-500 group-hover:text-slate-700 transition-colors" />
                                    </div>
                                </button>
                            )}
                        </Dropdown.Trigger>

                        <Dropdown.Content align="right" direction="up" contentClasses="py-1 bg-white border border-slate-200 shadow-xl" width="48">
                            <Dropdown.Link href="/profile">Profil</Dropdown.Link>
                            <Dropdown.Link
                                href={route('logout')}
                                method="post"
                                as="button"
                            >
                                Çıxış
                            </Dropdown.Link>
                        </Dropdown.Content>
                    </Dropdown>
                </div>
            </div>

            {/* Main content */}
            <div className={`flex flex-1 flex-col transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'}`}>
                {/* Mobile header */}
                <div className="sticky top-0 z-10 flex h-16 flex-shrink-0 border-b border-gray-200 bg-white lg:hidden">
                    <button
                        type="button"
                        className="border-r border-gray-200 px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Bars3Icon className="h-6 w-6" />
                    </button>
                    
                    <div className="flex flex-1 justify-between px-4">
                        <div className="flex flex-1 items-center">
                            <h1 className="text-lg font-semibold text-gray-900">XPOS</h1>
                        </div>
                    </div>
                </div>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto pb-16">
                    {header && (
                        <header className="bg-white shadow-sm">
                            <div className="w-full px-4 py-6 sm:px-6 lg:px-8">
                                {header}
                            </div>
                        </header>
                    )}
                    
                    <div className="w-full px-4 py-6 sm:px-6 lg:px-8 text-base">
                        {children}
                    </div>
                </main>

                {/* Bottom Information Bar */}
                <footer className={`fixed bottom-0 left-0 right-0 z-30 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 text-white shadow-lg transition-all duration-300 ${sidebarCollapsed ? 'lg:left-20' : 'lg:left-80'}`}>
                    <div className="flex items-center justify-between px-4 py-2 text-xs">
                        {/* Left section - Only Version */}
                        <div className="flex items-center space-x-6">
                            <div className="flex items-center space-x-1 text-slate-300">
                                <span>Versiya:</span>
                                <span className="font-mono bg-slate-600 px-2 py-0.5 rounded text-white">{getAppVersion()}</span>
                            </div>
                        </div>

                        {/* Center section - Current time */}
                        <div className="hidden md:flex items-center space-x-4">
                            <div className="flex items-center space-x-2 text-slate-300">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span id="current-time" className="font-mono">
                                    {currentTime.toLocaleTimeString('az-AZ', { 
                                        hour: '2-digit', 
                                        minute: '2-digit',
                                        second: '2-digit'
                                    })}
                                </span>
                            </div>
                            
                            <div className="text-slate-400">|</div>
                            
                            <div className="flex items-center space-x-2 text-slate-300">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="font-medium">
                                    {currentTime.toLocaleDateString('az-AZ', { 
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                    })}
                                </span>
                            </div>
                        </div>

                        {/* Right section - Company & Support */}
                        <div className="flex items-center space-x-6">
                            <div className="flex items-center space-x-1 text-slate-300">
                                <svg className="h-4 w-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 109.75 9.75c0-1.856-.5-3.6-1.378-5.206" />
                                </svg>
                                <span className="text-blue-300 font-medium">Onyx Digital</span>
                            </div>

                            <div className="flex items-center space-x-1">
                                <button 
                                    onClick={() => window.open('https://onyx.az/az/contact', '_blank')}
                                    className="flex items-center space-x-1 bg-slate-600 hover:bg-slate-500 px-2 py-1 rounded transition-colors duration-200 text-slate-200 hover:text-white"
                                >
                                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="text-xs">Dəstək</span>
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