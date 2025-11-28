import { Link } from '@inertiajs/react';
import {
    FolderIcon,
    ArrowUpTrayIcon,
    DocumentPlusIcon,
    PlusCircleIcon
} from '@heroicons/react/24/outline';

interface ProductsNavigationProps {
    currentRoute?: string;
    onImportClick?: () => void;
}

export default function ProductsNavigation({ currentRoute, onImportClick }: ProductsNavigationProps) {
    const isActive = (routeName: string) => {
        if (!currentRoute) {
            currentRoute = route().current() || '';
        }
        return currentRoute.includes(routeName);
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1 mb-6">
            <nav className="flex flex-wrap gap-1">
                {/* New Product Button - PRIORITY 1 */}
                <Link
                    href={route('products.create')}
                    className="relative flex items-center gap-2.5 px-4 py-3 rounded-md font-medium text-sm transition-all duration-200 ease-in-out text-gray-600 hover:bg-blue-50 hover:text-blue-700 active:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                >
                    <PlusCircleIcon className="w-5 h-5 text-gray-400" />
                    <span className="font-semibold">Yeni Məhsul</span>
                </Link>

                {/* Categories Link */}
                <Link
                    href={route('categories.index')}
                    className={`
                        relative flex items-center gap-2.5 px-4 py-3 rounded-md
                        font-medium text-sm transition-all duration-200 ease-in-out
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                        ${isActive('categories')
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/30 transform scale-[1.02]'
                            : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700 active:bg-blue-100'
                        }
                    `}
                >
                    <FolderIcon className={`w-5 h-5 ${isActive('categories') ? 'text-white' : 'text-gray-400'}`} />
                    <span className="font-semibold">Kateqoriyalar</span>
                    {isActive('categories') && (
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full" />
                    )}
                </Link>

                {/* Import Button */}
                <button
                    type="button"
                    onClick={onImportClick}
                    className="relative flex items-center gap-2.5 px-4 py-3 rounded-md font-medium text-sm transition-all duration-200 ease-in-out text-gray-600 hover:bg-blue-50 hover:text-blue-700 active:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                >
                    <ArrowUpTrayIcon className="w-5 h-5 text-gray-400" />
                    <span className="font-semibold">Import</span>
                </button>

                {/* Bulk Create Button */}
                <Link
                    href={route('products.bulk-create')}
                    className="relative flex items-center gap-2.5 px-4 py-3 rounded-md font-medium text-sm transition-all duration-200 ease-in-out text-gray-600 hover:bg-blue-50 hover:text-blue-700 active:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                >
                    <DocumentPlusIcon className="w-5 h-5 text-gray-400" />
                    <span className="font-semibold">Toplu Məhsul Yaratma</span>
                </Link>
            </nav>
        </div>
    );
}
