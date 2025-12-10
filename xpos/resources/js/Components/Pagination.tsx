import { Link } from '@inertiajs/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import { useTranslation } from 'react-i18next';

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Props {
    links: PaginationLink[];
    currentPage: number;
    lastPage: number;
}

export default function Pagination({ links, currentPage, lastPage }: Props) {
    const { t } = useTranslation();

    if (lastPage <= 1) return null;

    return (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
                {links[0]?.url ? (
                    <Link
                        href={links[0].url!}
                        className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        {t('pagination.previous')}
                    </Link>
                ) : (
                    <span className="relative inline-flex items-center rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-400 cursor-not-allowed">
                        {t('pagination.previous')}
                    </span>
                )}

                {links[links.length - 1]?.url ? (
                    <Link
                        href={links[links.length - 1].url!}
                        className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        {t('pagination.next')}
                    </Link>
                ) : (
                    <span className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-400 cursor-not-allowed">
                        {t('pagination.next')}
                    </span>
                )}
            </div>
            
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm text-gray-700">
                        {t('pagination.page')} <span className="font-medium">{currentPage}</span> {t('pagination.of')} <span className="font-medium">{lastPage}</span>
                    </p>
                </div>
                
                <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                        {/* Previous button */}
                        {links[0]?.url ? (
                            <Link
                                href={links[0].url!}
                                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <span className="sr-only">{t('pagination.previous')}</span>
                                <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                            </Link>
                        ) : (
                            <span className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-300 ring-1 ring-inset ring-gray-300 cursor-not-allowed">
                                <span className="sr-only">{t('pagination.previous')}</span>
                                <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                            </span>
                        )}

                        {/* Page numbers */}
                        {links.slice(1, -1).map((link, index) => {
                            if (link.label.includes('...')) {
                                return (
                                    <span
                                        key={index}
                                        className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300"
                                    >
                                        ...
                                    </span>
                                );
                            }

                            return link.url ? (
                                <Link
                                    key={index}
                                    href={link.url!}
                                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                        link.active
                                            ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                                            : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    }`}
                                    aria-current={link.active ? 'page' : undefined}
                                >
                                    {link.label}
                                </Link>
                            ) : (
                                <span
                                    key={index}
                                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                        link.active
                                            ? 'z-10 bg-blue-600 text-white'
                                            : 'text-gray-400 ring-1 ring-inset ring-gray-300 cursor-not-allowed'
                                    }`}
                                >
                                    {link.label}
                                </span>
                            );
                        })}

                        {/* Next button */}
                        {links[links.length - 1]?.url ? (
                            <Link
                                href={links[links.length - 1].url!}
                                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <span className="sr-only">{t('pagination.next')}</span>
                                <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                            </Link>
                        ) : (
                            <span className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-300 ring-1 ring-inset ring-gray-300 cursor-not-allowed">
                                <span className="sr-only">{t('pagination.next')}</span>
                                <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                            </span>
                        )}
                    </nav>
                </div>
            </div>
        </div>
    );
}