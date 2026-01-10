import { PropsWithChildren, ReactNode, useState, useEffect } from 'react';
import { usePage, Link } from '@inertiajs/react';
import { Toaster } from 'react-hot-toast';
import SuperAdminSidebar from '@/Components/SuperAdminSidebar';
import { Bars3Icon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { getAppVersion } from '@/utils/version';

interface Props extends PropsWithChildren {
    title?: string;
    actions?: ReactNode;
}

const STORAGE_KEY = 'superadmin_sidebar_expanded';

export default function SuperAdminLayout({ children, title, actions }: Props) {
    const { url } = usePage();

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarExpanded, setSidebarExpanded] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved === 'true';
        }
        return true; // Default: expanded
    });

    // Persist sidebar state
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, String(sidebarExpanded));
        }
    }, [sidebarExpanded]);

    // Generate breadcrumbs from current URL
    const getBreadcrumbs = () => {
        const pathMap: Record<string, { category: string; page: string }> = {
            '/admin': { category: 'Sistem', page: 'Dashboard' },
            '/admin/accounts': { category: 'Biznes', page: 'Hesablar' },
            '/admin/payments': { category: 'Biznes', page: 'Ödənişlər' },
            '/admin/users': { category: 'Biznes', page: 'İstifadəçilər' },
            '/admin/module-pricing': { category: 'Biznes', page: 'Modul Qiymətləri' },
            '/admin/loyalty-cards': { category: 'Xidmətlər', page: 'Loaylıq Kartları' },
            '/admin/gift-cards': { category: 'Xidmətlər', page: 'Hədiyyə Kartları' },
            '/admin/fiscal-printer-providers': { category: 'Xidmətlər', page: 'Fiskal Printerlər' },
            '/admin/knowledge': { category: 'Sistem', page: 'Bilik Bazası' },
            '/admin/system-health': { category: 'Sistem', page: 'Sistem Statusu' },
            '/admin/security': { category: 'Sistem', page: 'Təhlükəsizlik' },
            '/admin/storage-settings': { category: 'Sistem', page: 'Object Store' },
        };

        // Find matching path (exact or starts with for detail pages)
        let breadcrumb = pathMap[url];
        if (!breadcrumb) {
            // Try to match detail pages like /admin/accounts/123
            for (const [path, crumb] of Object.entries(pathMap)) {
                if (url.startsWith(path) && path !== '/admin') {
                    breadcrumb = crumb;
                    break;
                }
            }
        }

        return breadcrumb || { category: 'Super Admin', page: '' };
    };

    const breadcrumbs = getBreadcrumbs();

    return (
        <>
            <Toaster position="top-right" />

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

                {/* Sidebar */}
                <SuperAdminSidebar
                    collapsed={!sidebarExpanded}
                    onToggle={() => setSidebarExpanded(!sidebarExpanded)}
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                />

                {/* Main content */}
                <div className={`flex flex-1 flex-col overflow-hidden transition-all duration-300 ${sidebarExpanded ? 'lg:pl-72' : 'lg:pl-20'}`}>
                    {/* Top bar */}
                    <div className="sticky top-0 z-30 flex flex-col border-b-2 border-purple-100 bg-white shadow-sm">
                        {/* Mobile menu button + Title */}
                        <div className="flex h-16 items-center px-4">
                            <button
                                type="button"
                                className="border-r border-gray-200 pr-4 mr-4 text-purple-600 hover:text-purple-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500 lg:hidden"
                                onClick={() => setSidebarOpen(true)}
                            >
                                <Bars3Icon className="h-6 w-6" />
                            </button>

                            <div className="flex flex-1 items-center justify-between">
                                <div className="flex-1">
                                    {title && (
                                        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                                            {title}
                                        </h1>
                                    )}
                                </div>
                                {actions && (
                                    <div className="flex items-center gap-2">
                                        {actions}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Breadcrumbs */}
                        <div className="px-4 pb-3">
                            <nav className="flex items-center space-x-2 text-sm">
                                <Link
                                    href="/admin"
                                    className="text-purple-600 hover:text-purple-700 font-medium transition-colors"
                                >
                                    Super Admin
                                </Link>
                                {breadcrumbs.category && (
                                    <>
                                        <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                                        <span className="text-gray-600">{breadcrumbs.category}</span>
                                    </>
                                )}
                                {breadcrumbs.page && (
                                    <>
                                        <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                                        <span className="text-gray-900 font-medium">{breadcrumbs.page}</span>
                                    </>
                                )}
                            </nav>
                        </div>
                    </div>

                    {/* Page content */}
                    <main className="flex-1 overflow-y-auto pb-16">
                        <div className="w-full px-4 py-6 sm:px-6 lg:px-8">
                            {children}
                        </div>
                    </main>

                    {/* Footer */}
                    <footer className={`fixed bottom-0 right-0 left-0 z-30 bg-gradient-to-r from-purple-800 via-indigo-800 to-purple-800 text-white shadow-lg transition-all duration-300 ${sidebarExpanded ? 'lg:left-72' : 'lg:left-20'}`}>
                        <div className="flex items-center justify-between px-4 py-2 text-xs">
                            <div className="flex items-center space-x-4">
                                <Link
                                    href="/admin/knowledge"
                                    className="flex items-center space-x-1 bg-purple-700 hover:bg-slate-700 px-2 py-1 rounded transition-colors duration-200 text-slate-200 hover:text-white"
                                >
                                    <span>Bilik Bazası</span>
                                </Link>
                            </div>

                            <div className="flex items-center space-x-1 text-purple-200">
                                <span>Versiya:</span>
                                <span className="font-mono bg-purple-700 px-2 py-0.5 rounded text-white">{getAppVersion()}</span>
                            </div>

                            <div className="flex items-center space-x-6">
                                <div className="flex items-center space-x-1 text-purple-200">
                                    <span className="text-indigo-300 font-medium">Onyx Digital</span>
                                </div>

                                <div className="flex items-center space-x-1">
                                    <button
                                        onClick={() => window.open('https://onyx.az/az/contact', '_blank')}
                                        className="flex items-center space-x-1 bg-purple-700 hover:bg-slate-700 px-2 py-1 rounded transition-colors duration-200 text-slate-200 hover:text-white"
                                    >
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
