import { Link } from '@inertiajs/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface PaginationData {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
}

interface Props {
    data: PaginationData;
    onPerPageChange?: (perPage: number) => void;
    showPerPageSelector?: boolean;
}

export default function AdvancedPagination({ 
    data, 
    onPerPageChange,
    showPerPageSelector = true 
}: Props) {
    const { current_page, last_page, per_page, total, from, to, links } = data;

    const handlePerPageChange = (newPerPage: number) => {
        if (onPerPageChange) {
            onPerPageChange(newPerPage);
        }
    };

    if (total === 0 || !links || links.length === 0) {
        return null;
    }

    // Remove "Previous" and "Next" links as we'll create our own
    const pageLinks = links.slice(1, -1);
    
    // Safety check for first and last links
    const firstLink = links[0] || { url: null, label: '', active: false };
    const lastLink = links[links.length - 1] || { url: null, label: '', active: false };

    return (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
                {/* Mobile pagination */}
                <Link
                    href={firstLink.url || '#'}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                        firstLink.url 
                            ? 'text-gray-700 bg-white hover:bg-gray-50' 
                            : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                    }`}
                    preserveState
                    disabled={!firstLink.url}
                >
                    Əvvəlki
                </Link>
                <Link
                    href={lastLink.url || '#'}
                    className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                        lastLink.url 
                            ? 'text-gray-700 bg-white hover:bg-gray-50' 
                            : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                    }`}
                    preserveState
                    disabled={!lastLink.url}
                >
                    Növbəti
                </Link>
            </div>

            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div className="flex items-center space-x-6">
                    {/* Results info */}
                    <div>
                        <p className="text-sm text-gray-700">
                            <span className="font-medium">{from}</span>
                            {' - '}
                            <span className="font-medium">{to}</span>
                            {' / '}
                            <span className="font-medium">{total}</span>
                            {' nəticə'}
                        </p>
                    </div>

                    {/* Per page selector */}
                    {showPerPageSelector && onPerPageChange && (
                        <div className="flex items-center space-x-2">
                            <label className="text-sm text-gray-700">Səhifədə:</label>
                            <select
                                value={per_page}
                                onChange={(e) => handlePerPageChange(parseInt(e.target.value))}
                                className="border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>
                    )}
                </div>

                <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        {/* Previous button */}
                        <Link
                            href={firstLink.url || '#'}
                            className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                                firstLink.url 
                                    ? 'text-gray-500 bg-white hover:bg-gray-50' 
                                    : 'text-gray-300 bg-gray-100 cursor-not-allowed'
                            }`}
                            preserveState
                            disabled={!firstLink.url}
                        >
                            <span className="sr-only">Əvvəlki</span>
                            <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                        </Link>

                        {/* Current page and Last page info */}
                        <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-blue-50 text-sm font-medium text-blue-600">
                            {current_page}
                        </span>
                        {current_page < last_page && (
                            <>
                                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                    /
                                </span>
                                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500">
                                    {last_page}
                                </span>
                            </>
                        )}

                        {/* Next button */}
                        <Link
                            href={lastLink.url || '#'}
                            className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                                lastLink.url 
                                    ? 'text-gray-500 bg-white hover:bg-gray-50' 
                                    : 'text-gray-300 bg-gray-100 cursor-not-allowed'
                            }`}
                            preserveState
                            disabled={!lastLink.url}
                        >
                            <span className="sr-only">Növbəti</span>
                            <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                        </Link>
                    </nav>
                </div>
            </div>
        </div>
    );
}