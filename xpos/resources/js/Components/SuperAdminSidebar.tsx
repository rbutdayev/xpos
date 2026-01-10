import { Link, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import {
    HomeIcon,
    BuildingOffice2Icon,
    BuildingStorefrontIcon,
    CreditCardIcon,
    UsersIcon,
    CurrencyDollarIcon,
    ShoppingBagIcon,
    GiftIcon,
    PrinterIcon,
    Cog6ToothIcon,
    BookOpenIcon,
    HeartIcon,
    ShieldCheckIcon,
    ServerIcon,
    ChevronDownIcon,
    ChevronLeftIcon,
    Bars3Icon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';

interface NavItem {
    path: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    exact?: boolean;
}

interface NavCategory {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    items: NavItem[];
}

interface Props {
    collapsed: boolean;
    onToggle: () => void;
    sidebarOpen?: boolean;
    setSidebarOpen?: (open: boolean) => void;
}

const STORAGE_KEYS = {
    categoryStates: 'superadmin_category_states',
};

export default function SuperAdminSidebar({ collapsed, onToggle, sidebarOpen, setSidebarOpen }: Props) {
    const { url } = usePage();
    const user = usePage().props.auth.user;

    const categories: NavCategory[] = [
        {
            id: 'biznes',
            label: 'Biznes',
            icon: BuildingOffice2Icon,
            items: [
                { path: '/admin/accounts', label: 'Hesablar', icon: BuildingStorefrontIcon },
                { path: '/admin/payments', label: 'Ödənişlər', icon: CreditCardIcon },
                { path: '/admin/users', label: 'İstifadəçilər', icon: UsersIcon },
                { path: '/admin/module-pricing', label: 'Modul Qiymətləri', icon: CurrencyDollarIcon },
            ]
        },
        {
            id: 'xidmetler',
            label: 'Xidmətlər',
            icon: ShoppingBagIcon,
            items: [
                { path: '/admin/loyalty-cards', label: 'Loaylıq Kartları', icon: CreditCardIcon },
                { path: '/admin/gift-cards', label: 'Hədiyyə Kartları', icon: GiftIcon },
                { path: '/admin/fiscal-printer-providers', label: 'Fiskal Printerlər', icon: PrinterIcon },
            ]
        },
        {
            id: 'sistem',
            label: 'Sistem',
            icon: Cog6ToothIcon,
            items: [
                { path: '/admin', label: 'Dashboard', icon: HomeIcon, exact: true },
                { path: '/admin/knowledge', label: 'Bilik Bazası', icon: BookOpenIcon },
                { path: '/admin/system-health', label: 'Sistem Statusu', icon: HeartIcon },
                { path: '/admin/security', label: 'Təhlükəsizlik', icon: ShieldCheckIcon },
                { path: '/admin/storage-settings', label: 'Object Store', icon: ServerIcon },
            ]
        }
    ];

    // Initialize category states from localStorage
    const [categoryStates, setCategoryStates] = useState<Record<string, boolean>>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(STORAGE_KEYS.categoryStates);
            if (saved) {
                return JSON.parse(saved);
            }
        }
        // Default: all categories expanded
        return {
            biznes: true,
            xidmetler: true,
            sistem: true,
        };
    });

    // Persist category states to localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEYS.categoryStates, JSON.stringify(categoryStates));
        }
    }, [categoryStates]);

    const toggleCategory = (categoryId: string) => {
        setCategoryStates(prev => ({
            ...prev,
            [categoryId]: !prev[categoryId]
        }));
    };

    const isActive = (path: string, exact?: boolean) => {
        if (exact) {
            return url === path;
        }
        return url.startsWith(path);
    };

    const isCategoryActive = (category: NavCategory) => {
        return category.items.some(item => isActive(item.path, item.exact));
    };

    const showExpanded = sidebarOpen || !collapsed;

    return (
        <div className={`
            fixed inset-y-0 left-0 z-50 flex flex-col bg-gradient-to-b from-slate-50 to-white shadow-2xl transform transition-all duration-300 ease-in-out border-r-2 border-purple-200
            ${sidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'}
            ${collapsed ? 'lg:w-20' : 'lg:w-72'}
        `}>
            {/* Sidebar header */}
            <div className="flex h-16 flex-shrink-0 items-center border-b-2 border-purple-100 px-4 justify-between bg-gradient-to-r from-white to-purple-50">
                {/* Mobile close button */}
                {sidebarOpen && (
                    <button
                        onClick={() => setSidebarOpen?.(false)}
                        className="lg:hidden p-2 rounded-lg hover:bg-purple-100 text-slate-500 hover:text-purple-700 transition-all duration-200"
                    >
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                )}

                {/* Logo (when expanded) */}
                {showExpanded && (
                    <Link href="/admin" className="flex items-center group">
                        <ApplicationLogo className="h-10 w-10" />
                        <span className="ml-2 text-lg font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                            Super Admin
                        </span>
                    </Link>
                )}

                {/* Collapse button (desktop) */}
                <button
                    onClick={onToggle}
                    className="hidden lg:flex items-center justify-center p-2 rounded-lg hover:bg-purple-100 text-slate-500 hover:text-purple-700 transition-all duration-200"
                    title={collapsed ? 'Genişləndir' : 'Daralt'}
                >
                    {collapsed ? <Bars3Icon className="w-5 h-5" /> : <ChevronLeftIcon className="w-5 h-5" />}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
                {categories.map((category) => {
                    const CategoryIcon = category.icon;
                    const categoryActive = isCategoryActive(category);
                    const isExpanded = categoryStates[category.id];

                    return (
                        <div key={category.id} className="space-y-1">
                            {/* Category Header */}
                            <button
                                onClick={() => showExpanded && toggleCategory(category.id)}
                                className={`
                                    w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200
                                    ${showExpanded ? '' : 'lg:justify-center'}
                                    ${categoryActive
                                        ? 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700'
                                        : 'text-slate-600 hover:bg-purple-50 hover:text-purple-600'
                                    }
                                `}
                                title={!showExpanded ? category.label : ''}
                            >
                                <div className="flex items-center">
                                    <CategoryIcon className={`h-5 w-5 flex-shrink-0 ${showExpanded ? 'mr-3' : ''} ${categoryActive ? 'text-purple-600' : 'text-slate-400'}`} />
                                    {showExpanded && <span>{category.label}</span>}
                                </div>
                                {showExpanded && (
                                    <ChevronDownIcon
                                        className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                                    />
                                )}
                            </button>

                            {/* Category Items */}
                            {isExpanded && showExpanded && (
                                <div className="ml-2 space-y-1 border-l-2 border-purple-100 pl-2">
                                    {category.items.map((item, index) => {
                                        const ItemIcon = item.icon;
                                        const active = isActive(item.path, item.exact);
                                        const isLast = index === category.items.length - 1;

                                        return (
                                            <div key={item.path}>
                                                <Link
                                                    href={item.path}
                                                    className={`
                                                        group flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                                                        ${active
                                                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/30'
                                                            : 'text-slate-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 hover:text-purple-700'
                                                        }
                                                    `}
                                                >
                                                    <ItemIcon className={`h-5 w-5 mr-3 flex-shrink-0 ${active ? 'text-white' : 'text-purple-500'}`} />
                                                    <span className="whitespace-nowrap">{item.label}</span>
                                                </Link>
                                                {!isLast && (
                                                    <div className="my-1 border-t border-purple-100/50" />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* User menu */}
            <div className="flex-shrink-0 border-t-2 border-purple-100 p-3 bg-gradient-to-r from-white to-purple-50">
                <Dropdown>
                    <Dropdown.Trigger>
                        {showExpanded ? (
                            <button className="group block w-full rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 px-3 py-2.5 text-left transition-all duration-200 shadow-sm hover:shadow-md border border-purple-200">
                                <div className="flex items-center">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 text-sm font-bold text-white shadow-md shadow-purple-500/30 ring-2 ring-purple-400/20">
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
                            <button
                                className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 text-base font-bold text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 transition-all duration-200 mx-auto ring-2 ring-purple-400/20"
                                title={`${user.name}\n${user.email}`}
                            >
                                {user.name?.charAt(0).toUpperCase() || '?'}
                            </button>
                        )}
                    </Dropdown.Trigger>

                    <Dropdown.Content align="right" direction="up" contentClasses="py-1 bg-white border border-purple-200 shadow-xl" width="48">
                        <div className="px-4 py-3 border-b border-purple-100 bg-purple-50">
                            <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                            <p className="text-xs text-purple-600 font-medium mt-1">Super Admin</p>
                        </div>
                        <Dropdown.Link href="/profile">Profil</Dropdown.Link>
                        <Dropdown.Link
                            href="/logout"
                            method="post"
                            as="button"
                        >
                            Çıxış
                        </Dropdown.Link>
                    </Dropdown.Content>
                </Dropdown>
            </div>
        </div>
    );
}
