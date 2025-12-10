import React, { useState, Fragment } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SalesNavigation from '@/Components/SalesNavigation';
import { PageProps } from '@/types';
import {
    GiftIcon,
    MagnifyingGlassIcon,
    AdjustmentsHorizontalIcon,
    Cog6ToothIcon,
    EllipsisVerticalIcon,
    EyeIcon,
    PencilIcon,
    ArrowPathIcon,
    XMarkIcon,
    ClockIcon,
    UserIcon,
    BanknotesIcon,
} from '@heroicons/react/24/outline';
import { Menu, Transition, Dialog } from '@headlessui/react';

interface GiftCardTransaction {
    id: number;
    transaction_type: 'issue' | 'activate' | 'redeem' | 'refund' | 'adjust' | 'expire' | 'cancel' | 'reset';
    amount: number;
    balance_before: number;
    balance_after: number;
    notes?: string;
    user: {
        id: number;
        name: string;
    };
    created_at: string;
}

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
        email?: string;
    };
    activated_at?: string;
    expiry_date?: string;
    created_at: string;
    transactions?: GiftCardTransaction[];
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
    const [quickViewCard, setQuickViewCard] = useState<GiftCard | null>(null);
    const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/gift-cards', { search, status }, { preserveState: true });
    };

    const handleClearFilters = () => {
        setSearch('');
        setStatus('');
        router.get('/gift-cards', {}, { preserveState: true });
    };

    const handleQuickView = async (cardId: number) => {
        // Fetch full card details including transactions
        try {
            const response = await fetch(`/gift-cards/${cardId}/details`);
            if (response.ok) {
                const cardData = await response.json();
                setQuickViewCard(cardData);
                setIsQuickViewOpen(true);
            } else {
                // Fallback to navigating to the full page
                router.visit(`/gift-cards/${cardId}`);
            }
        } catch (error) {
            // Fallback to navigating to the full page
            router.visit(`/gift-cards/${cardId}`);
        }
    };

    const handleReactivate = (cardId: number) => {
        if (confirm('Bu kartı yenidən satış üçün sıfırlamaq istədiyinizə əminsiniz?')) {
            router.post(`/gift-cards/${cardId}/reactivate`, {}, {
                preserveScroll: true,
            });
        }
    };

    const getTransactionTypeBadge = (type: string) => {
        const typeConfig: Record<string, { label: string; class: string }> = {
            issue: { label: 'Satıldı', class: 'bg-green-100 text-green-800' },
            activate: { label: 'Aktivləşdirildi', class: 'bg-blue-100 text-blue-800' },
            redeem: { label: 'İstifadə edildi', class: 'bg-purple-100 text-purple-800' },
            refund: { label: 'Geri qaytarıldı', class: 'bg-yellow-100 text-yellow-800' },
            adjust: { label: 'Düzəliş', class: 'bg-gray-100 text-gray-800' },
            expire: { label: 'Vaxtı keçdi', class: 'bg-orange-100 text-orange-800' },
            cancel: { label: 'Ləğv edildi', class: 'bg-red-100 text-red-800' },
            reset: { label: 'Sıfırlandı', class: 'bg-indigo-100 text-indigo-800' },
        };

        const config = typeConfig[type] || typeConfig.adjust;

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.class}`}>
                {config.label}
            </span>
        );
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
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => handleQuickView(card.id)}
                                                                className="text-blue-600 hover:text-blue-900 p-1"
                                                                title="Tez baxış"
                                                            >
                                                                <EyeIcon className="w-5 h-5" />
                                                            </button>
                                                            <Menu as="div" className="relative inline-block text-left">
                                                                <Menu.Button className="p-1 text-gray-600 hover:text-gray-900">
                                                                    <EllipsisVerticalIcon className="w-5 h-5" />
                                                                </Menu.Button>
                                                                <Transition
                                                                    as={Fragment}
                                                                    enter="transition ease-out duration-100"
                                                                    enterFrom="transform opacity-0 scale-95"
                                                                    enterTo="transform opacity-100 scale-100"
                                                                    leave="transition ease-in duration-75"
                                                                    leaveFrom="transform opacity-100 scale-100"
                                                                    leaveTo="transform opacity-0 scale-95"
                                                                >
                                                                    <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                                                        <div className="py-1">
                                                                            <Menu.Item>
                                                                                {({ active }) => (
                                                                                    <Link
                                                                                        href={`/gift-cards/${card.id}`}
                                                                                        className={`${
                                                                                            active ? 'bg-gray-100' : ''
                                                                                        } flex items-center gap-2 px-4 py-2 text-sm text-gray-700`}
                                                                                    >
                                                                                        <EyeIcon className="w-4 h-4" />
                                                                                        Tam Detallar
                                                                                    </Link>
                                                                                )}
                                                                            </Menu.Item>
                                                                            {(card.status === 'depleted' || card.status === 'expired') && (
                                                                                <Menu.Item>
                                                                                    {({ active }) => (
                                                                                        <button
                                                                                            onClick={() => handleReactivate(card.id)}
                                                                                            className={`${
                                                                                                active ? 'bg-gray-100' : ''
                                                                                            } flex items-center gap-2 px-4 py-2 text-sm text-gray-700 w-full text-left`}
                                                                                        >
                                                                                            <ArrowPathIcon className="w-4 h-4" />
                                                                                            Yenidən Aktivləşdir
                                                                                        </button>
                                                                                    )}
                                                                                </Menu.Item>
                                                                            )}
                                                                        </div>
                                                                    </Menu.Items>
                                                                </Transition>
                                                            </Menu>
                                                        </div>
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

            {/* Quick View Modal */}
            <Transition appear show={isQuickViewOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setIsQuickViewOpen(false)}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black bg-opacity-25" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                                    {quickViewCard && (
                                        <>
                                            {/* Header */}
                                            <div className="bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-4 text-white">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <Dialog.Title className="text-2xl font-bold font-mono mb-2">
                                                            {quickViewCard.card_number}
                                                        </Dialog.Title>
                                                        <div className="flex items-center gap-2">
                                                            {getStatusBadge(quickViewCard)}
                                                        </div>
                                                        {quickViewCard.current_balance !== null && (
                                                            <div className="mt-4">
                                                                <p className="text-sm opacity-90">Cari Balans</p>
                                                                <p className="text-3xl font-bold mt-1">
                                                                    ₼{Number(quickViewCard.current_balance).toFixed(2)}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => setIsQuickViewOpen(false)}
                                                        className="text-white hover:text-gray-200"
                                                    >
                                                        <XMarkIcon className="w-6 h-6" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="px-6 py-4 max-h-96 overflow-y-auto">
                                                <div className="space-y-4">
                                                    {/* Basic Info */}
                                                    <div>
                                                        <h3 className="text-sm font-semibold text-gray-900 mb-2">Əsas Məlumat</h3>
                                                        <dl className="grid grid-cols-2 gap-3 text-sm">
                                                            {quickViewCard.denomination && (
                                                                <div>
                                                                    <dt className="text-gray-500">Nominal</dt>
                                                                    <dd className="font-semibold text-gray-900">₼{quickViewCard.denomination}</dd>
                                                                </div>
                                                            )}
                                                            {quickViewCard.activated_at && (
                                                                <div>
                                                                    <dt className="text-gray-500">Aktivləşmə</dt>
                                                                    <dd className="text-gray-900">
                                                                        {new Date(quickViewCard.activated_at).toLocaleDateString('az-AZ')}
                                                                    </dd>
                                                                </div>
                                                            )}
                                                            {quickViewCard.expiry_date && (
                                                                <div>
                                                                    <dt className="text-gray-500">Bitmə tarixi</dt>
                                                                    <dd className="text-gray-900">
                                                                        {new Date(quickViewCard.expiry_date).toLocaleDateString('az-AZ')}
                                                                    </dd>
                                                                </div>
                                                            )}
                                                        </dl>
                                                    </div>

                                                    {/* Customer Info */}
                                                    {quickViewCard.customer && (
                                                        <div>
                                                            <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1">
                                                                <UserIcon className="w-4 h-4" />
                                                                Müştəri
                                                            </h3>
                                                            <div className="bg-gray-50 rounded-lg p-3 text-sm">
                                                                <p className="font-semibold text-gray-900">{quickViewCard.customer.name}</p>
                                                                {quickViewCard.customer.phone && (
                                                                    <p className="text-gray-600">{quickViewCard.customer.phone}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Recent Transactions */}
                                                    {quickViewCard.transactions && quickViewCard.transactions.length > 0 && (
                                                        <div>
                                                            <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1">
                                                                <ClockIcon className="w-4 h-4" />
                                                                Son Əməliyyatlar
                                                            </h3>
                                                            <div className="space-y-2">
                                                                {quickViewCard.transactions.slice(0, 5).map((transaction) => (
                                                                    <div
                                                                        key={transaction.id}
                                                                        className="bg-gray-50 rounded-lg p-3 text-sm"
                                                                    >
                                                                        <div className="flex items-center justify-between mb-1">
                                                                            <div className="flex items-center gap-2">
                                                                                {getTransactionTypeBadge(transaction.transaction_type)}
                                                                                <span className="text-xs text-gray-500">
                                                                                    {new Date(transaction.created_at).toLocaleDateString('az-AZ')}
                                                                                </span>
                                                                            </div>
                                                                            <span className={`font-semibold ${
                                                                                transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                                                                            }`}>
                                                                                {transaction.amount > 0 ? '+' : ''}₼{Math.abs(Number(transaction.amount)).toFixed(2)}
                                                                            </span>
                                                                        </div>
                                                                        {transaction.notes && (
                                                                            <p className="text-xs text-gray-600">{transaction.notes}</p>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Footer */}
                                            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
                                                <Link
                                                    href={`/gift-cards/${quickViewCard.id}`}
                                                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                                >
                                                    Tam Detallara Keç →
                                                </Link>
                                                <button
                                                    onClick={() => setIsQuickViewOpen(false)}
                                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm font-medium"
                                                >
                                                    Bağla
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </AuthenticatedLayout>
    );
}
