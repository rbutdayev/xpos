import { usePage } from '@inertiajs/react';

interface Props {
    activePage?: string;
}

export default function SuperAdminNav({ activePage }: Props) {
    const { url } = usePage();

    // Auto-detect active page from URL if not provided
    const currentPath = activePage || url;

    const isActive = (path: string) => {
        return currentPath.startsWith(path);
    };

    const navItems = [
        { path: '/admin', label: 'Dashboard', exact: true },
        { path: '/admin/accounts', label: 'Hesablar' },
        { path: '/admin/payments', label: 'Ödənişlər' },
        { path: '/admin/users', label: 'İstifadəçilər' },
        { path: '/admin/fiscal-printer-providers', label: 'Fiskal Printerlər' },
        { path: '/admin/system-stats', label: 'Sistem Statistikası' },
        { path: '/admin/system-health', label: 'Sistemin statusu' },
        { path: '/admin/security', label: 'Təhlükəsizlik Mərkəzi' },
        { path: '/admin/storage-settings', label: 'Azure Storage' },
    ];

    return (
        <div className="mb-8">
            <nav className="flex space-x-4 overflow-x-auto">
                {navItems.map((item) => {
                    const active = item.exact
                        ? currentPath === item.path
                        : isActive(item.path);

                    return (
                        <a
                            key={item.path}
                            href={item.path}
                            className={`whitespace-nowrap px-3 py-2 rounded-md text-sm font-medium ${
                                active
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            {item.label}
                        </a>
                    );
                })}
            </nav>
        </div>
    );
}
