import { usePage } from '@inertiajs/react';
import { useState, useRef, useEffect } from 'react';

interface Props {
    activePage?: string;
}

interface NavItem {
    path: string;
    label: string;
    exact?: boolean;
}

interface NavCategory {
    label: string;
    icon: JSX.Element;
    items: NavItem[];
}

export default function SuperAdminNav({ activePage }: Props) {
    const { url } = usePage();
    const currentPath = activePage || url;
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const isActive = (path: string, exact?: boolean) => {
        if (exact) {
            return currentPath === path;
        }
        return currentPath.startsWith(path);
    };

    const categories: NavCategory[] = [
        {
            label: 'Biznes',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
            ),
            items: [
                { path: '/admin/accounts', label: 'Hesablar' },
                { path: '/admin/payments', label: 'Ödənişlər' },
                { path: '/admin/users', label: 'İstifadəçilər' },
            ]
        },
        {
            label: 'Xidmətlər',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
            ),
            items: [
                { path: '/admin/loyalty-cards', label: 'Loaylıq Kartları' },
                { path: '/admin/gift-cards', label: 'Hədiyyə Kartları' },
                { path: '/admin/fiscal-printer-providers', label: 'Fiskal Printerlər' },
            ]
        },
        {
            label: 'Sistem',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
            ),
            items: [
                { path: '/admin', label: 'Dashboard', exact: true },
                { path: '/admin/system-health', label: 'Sistem Statusu' },
                { path: '/admin/security', label: 'Təhlükəsizlik' },
                { path: '/admin/storage-settings', label: 'Object Store' },
            ]
        }
    ];

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpenDropdown(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleDropdown = (categoryLabel: string) => {
        setOpenDropdown(openDropdown === categoryLabel ? null : categoryLabel);
    };

    const getCategoryActiveState = (category: NavCategory) => {
        return category.items.some(item => isActive(item.path, item.exact));
    };

    return (
        <div className="mb-6" ref={dropdownRef}>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1">
                <nav className="flex space-x-1">
                    {categories.map((category) => {
                        const isCategoryActive = getCategoryActiveState(category);
                        const isOpen = openDropdown === category.label;

                        return (
                            <div key={category.label} className="relative flex-1">
                                <button
                                    onClick={() => toggleDropdown(category.label)}
                                    className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                                        isCategoryActive
                                            ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md'
                                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                                >
                                    <span className={isCategoryActive ? 'text-white' : 'text-gray-400'}>
                                        {category.icon}
                                    </span>
                                    <span className="font-semibold">{category.label}</span>
                                    <svg
                                        className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {isOpen && (
                                    <div className="absolute left-0 right-0 mt-2 bg-white rounded-lg shadow-xl z-50 border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="py-2">
                                            {category.items.map((item) => {
                                                const active = isActive(item.path, item.exact);
                                                return (
                                                    <a
                                                        key={item.path}
                                                        href={item.path}
                                                        className={`block px-4 py-2.5 text-sm transition-colors ${
                                                            active
                                                                ? 'bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600'
                                                                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent'
                                                        }`}
                                                        onClick={() => setOpenDropdown(null)}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <span>{item.label}</span>
                                                            {active && (
                                                                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                    </a>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
}
