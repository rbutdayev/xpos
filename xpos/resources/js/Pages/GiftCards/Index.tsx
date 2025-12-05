import React, { useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SalesNavigation from '@/Components/SalesNavigation';
import { PageProps } from '@/types';
import {
    GiftIcon,
    MagnifyingGlassIcon,
    AdjustmentsHorizontalIcon,
    Cog6ToothIcon,
} from '@heroicons/react/24/outline';

interface GiftCard {
    id: number;
    card_number: string;
    denomination: number | null;
    current_balance: number | null;
    initial_balance: number | null;
    status: 'free' | 'configured' | 'active' | 'depleted' | 'expired' | 'inactive';
    customer?: {
        id: number;
        name: string;
        phone?: string;
    };
    activated_at?: string;
    expiry_date?: string;
    created_at: string;
}

interface IndexProps extends PageProps {
    cards: {
        data: GiftCard[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    stats: {
        total: number;
        active: number;
        depleted: number;
        expired: number;
        total_balance: number;
    };
    filters: {
        search?: string;
        status?: string;
    };
    giftCardsEnabled?: boolean;
    discountsEnabled?: boolean;
}

export default function Index({ auth, cards, stats, filters, giftCardsEnabled = true, discountsEnabled = false }: IndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/gift-cards', { search, status }, { preserveState: true });
    };

    const handleClearFilters = () => {
        setSearch('');
        setStatus('');
        router.get('/gift-cards', {}, { preserveState: true });
    };

    const getStatusBadge = (card: GiftCard) => {
        const statusConfig: Record<string, { label: string; class: string }> = {
            free: { label: 'Boş', class: 'bg-gray-100 text-gray-800' },
            configured: { label: 'Konfiqurasiya olunub', class: 'bg-blue-100 text-blue-800' },
            active: { label: 'Aktiv', class: 'bg-green-100 text-green-800' },
            depleted: { label: 'İstifadə olunub', class: 'bg-red-100 text-red-800' },
            expired: { label: 'Vaxtı keçib', class: 'bg-orange-100 text-orange-800' },
            inactive: { label: 'Qeyri-aktiv', class: 'bg-gray-100 text-gray-800' },
        };

        const config = statusConfig[card.status] || statusConfig.free;

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.class}`}>
                {config.label}
            </span>
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title="Hədiyyə Kartları" />
            <div className="mx-auto sm:px-6 lg:px-8 mb-6">
                <SalesNavigation currentRoute="gift-cards" showGiftCards={giftCardsEnabled} showDiscounts={discountsEnabled}>
                    <Link
                        href="/gift-cards/configure"
                        className="relative flex items-center gap-2.5 px-4 py-3 rounded-md font-medium text-sm transition-all duration-200 ease-in-out bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-md shadow-pink-500/30 hover:from-pink-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-1"
                    >
                        <Cog6ToothIcon className="w-5 h-5" />
                        <span className="font-semibold">Konfiqurasiya</span>
                    </Link>
                </SalesNavigation>
            </div>
            <div className="py-12">
                <div className="w-full">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900">Hədiyyə Kartları</h1>
                        <p className="mt-1 text-sm text-gray-600">
                            Hədiyyə kartlarınızı idarə edin
                        </p>
                    </div>

                    {/* Statistics */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Cəmi</p>
                                    <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
                                </div>
                                <GiftIcon className="h-8 w-8 text-gray-400" />
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Aktiv</p>
                                    <p className="text-2xl font-semibold text-green-600">{stats.active}</p>
                                </div>
                                <GiftIcon className="h-8 w-8 text-green-400" />
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">İstifadə olunub</p>
                                    <p className="text-2xl font-semibold text-red-600">{stats.depleted}</p>
                                </div>
                                <GiftIcon className="h-8 w-8 text-red-400" />
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Vaxtı keçib</p>
                                    <p className="text-2xl font-semibold text-orange-600">{stats.expired}</p>
                                </div>
                                <GiftIcon className="h-8 w-8 text-orange-400" />
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Ümumi Balans</p>
                                    <p className="text-xl font-semibold text-blue-600">₼{Number(stats.total_balance || 0).toFixed(2)}</p>
                                </div>
                                <GiftIcon className="h-8 w-8 text-blue-400" />
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Kart nömrəsi ilə axtar..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                            <div className="w-full md:w-48">
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Bütün statuslar</option>
                                    <option value="free">Boş</option>
                                    <option value="configured">Konfiqurasiya olunub</option>
                                    <option value="active">Aktiv</option>
                                    <option value="depleted">İstifadə olunub</option>
                                    <option value="expired">Vaxtı keçib</option>
                                    <option value="inactive">Qeyri-aktiv</option>
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                                >
                                    Axtar
                                </button>
                                {(search || status) && (
                                    <button
                                        type="button"
                                        onClick={handleClearFilters}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-medium"
                                    >
                                        Təmizlə
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* Cards Table */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        {cards.data.length > 0 ? (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Kart Nömrəsi
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Nominal
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Cari Balans
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Müştəri
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Bitmə tarixi
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Əməliyyatlar
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {cards.data.map((card) => (
                                                <tr key={card.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-mono font-medium text-gray-900">
                                                            {card.card_number}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {getStatusBadge(card)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">
                                                            {card.denomination ? `₼${card.denomination}` : '-'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-semibold text-gray-900">
                                                            {card.current_balance !== null ? `₼${Number(card.current_balance).toFixed(2)}` : '-'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">
                                                            {card.customer?.name || '-'}
                                                        </div>
                                                        {card.customer?.phone && (
                                                            <div className="text-xs text-gray-500">
                                                                {card.customer.phone}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">
                                                            {card.expiry_date
                                                                ? new Date(card.expiry_date).toLocaleDateString('az-AZ')
                                                                : '-'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <Link
                                                            href={`/gift-cards/${card.id}`}
                                                            className="text-blue-600 hover:text-blue-900"
                                                        >
                                                            Detallar
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {cards.last_page > 1 && (
                                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                                        <div className="flex-1 flex justify-between sm:hidden">
                                            {cards.current_page > 1 && (
                                                <Link
                                                    href={`/gift-cards?page=${cards.current_page - 1}`}
                                                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                                >
                                                    Əvvəlki
                                                </Link>
                                            )}
                                            {cards.current_page < cards.last_page && (
                                                <Link
                                                    href={`/gift-cards?page=${cards.current_page + 1}`}
                                                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                                >
                                                    Növbəti
                                                </Link>
                                            )}
                                        </div>
                                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                            <div>
                                                <p className="text-sm text-gray-700">
                                                    <span className="font-medium">{cards.total}</span> nəticədən{' '}
                                                    <span className="font-medium">
                                                        {(cards.current_page - 1) * cards.per_page + 1}
                                                    </span>{' '}
                                                    -{' '}
                                                    <span className="font-medium">
                                                        {Math.min(cards.current_page * cards.per_page, cards.total)}
                                                    </span>{' '}
                                                    arası göstərilir
                                                </p>
                                            </div>
                                            <div>
                                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                                    {cards.current_page > 1 && (
                                                        <Link
                                                            href={`/gift-cards?page=${cards.current_page - 1}`}
                                                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                                                        >
                                                            Əvvəlki
                                                        </Link>
                                                    )}
                                                    {Array.from({ length: cards.last_page }, (_, i) => i + 1)
                                                        .filter(
                                                            (page) =>
                                                                page === 1 ||
                                                                page === cards.last_page ||
                                                                Math.abs(page - cards.current_page) <= 2
                                                        )
                                                        .map((page, index, array) => (
                                                            <React.Fragment key={page}>
                                                                {index > 0 && array[index - 1] !== page - 1 && (
                                                                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                                                        ...
                                                                    </span>
                                                                )}
                                                                <Link
                                                                    href={`/gift-cards?page=${page}`}
                                                                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                                        page === cards.current_page
                                                                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                                    }`}
                                                                >
                                                                    {page}
                                                                </Link>
                                                            </React.Fragment>
                                                        ))}
                                                    {cards.current_page < cards.last_page && (
                                                        <Link
                                                            href={`/gift-cards?page=${cards.current_page + 1}`}
                                                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                                                        >
                                                            Növbəti
                                                        </Link>
                                                    )}
                                                </nav>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-12">
                                <GiftIcon className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-semibold text-gray-900">Hədiyyə kartı tapılmadı</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Axtarış kriteriyalarınızı dəyişdirin və ya yeni kart konfiqurasiya edin
                                </p>
                                <div className="mt-6">
                                    <Link
                                        href="/gift-cards/configure"
                                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                                    >
                                        <Cog6ToothIcon className="w-5 h-5 mr-2" />
                                        Konfiqurasiya
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
