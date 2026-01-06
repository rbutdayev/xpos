import React, { useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import {
    GiftIcon,
    CreditCardIcon,
    CheckCircleIcon,
    XCircleIcon,
    ListBulletIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    MagnifyingGlassIcon,
    EyeIcon,
    TrashIcon,
    PencilIcon,
} from '@heroicons/react/24/outline';

interface GiftCard {
    id: number;
    card_number: string;
    denomination: number | null;
    current_balance: number | null;
    status: 'free' | 'configured' | 'active' | 'depleted' | 'expired' | 'inactive';
    customer?: {
        id: number;
        name: string;
    };
    activated_at?: string;
}

interface ConfigureProps extends PageProps {
    freeCards: GiftCard[];
    configuredCards: Record<string, GiftCard[]>;
    activeCards: GiftCard[];
    statistics: {
        free_count: number;
        configured_count: number;
        active_count: number;
        depleted_count: number;
    };
    giftCardsEnabled?: boolean;
    discountsEnabled?: boolean;
}

export default function Configure({
    auth,
    freeCards,
    configuredCards,
    activeCards,
    statistics,
    giftCardsEnabled = true,
    discountsEnabled = false,
}: ConfigureProps) {
    const [selectedCards, setSelectedCards] = useState<number[]>([]);
    const [denomination, setDenomination] = useState('');
    const [quantity, setQuantity] = useState('');
    const [selectedDenominations, setSelectedDenominations] = useState<number[]>([]);
    const [editingDenomination, setEditingDenomination] = useState<string | null>(null);
    const [newDenomination, setNewDenomination] = useState('');
    const [expandedDenominations, setExpandedDenominations] = useState<string[]>([]);
    const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});
    const [currentPages, setCurrentPages] = useState<Record<string, number>>({});

    const handleBulkConfigure = (e: React.FormEvent) => {
        e.preventDefault();

        if (!denomination || !quantity || parseFloat(denomination) <= 0 || parseInt(quantity) <= 0) {
            alert('Zəhmət olmasa düzgün məlumat daxil edin');
            return;
        }

        if (parseInt(quantity) > freeCards.length) {
            alert(`Maksimum ${freeCards.length} kart konfiqurasiya edə bilərsiniz`);
            return;
        }

        router.post('/gift-cards/bulk-configure', {
            configurations: [{
                denomination: parseFloat(denomination),
                quantity: parseInt(quantity)
            }]
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setDenomination('');
                setQuantity('');
            }
        });
    };

    const handleCreateProducts = (e: React.FormEvent) => {
        e.preventDefault();

        if (selectedDenominations.length === 0) {
            alert('Zəhmət olmasa ən azı bir nominal seçin');
            return;
        }

        router.post('/gift-cards/create-products', {
            denominations: selectedDenominations
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setSelectedDenominations([]);
            }
        });
    };

    const handleUpdateDenomination = (oldDenomination: string) => {
        if (!newDenomination || parseFloat(newDenomination) <= 0) {
            alert('Zəhmət olmasa düzgün məbləğ daxil edin');
            return;
        }

        if (confirm(`₼${oldDenomination} nominalı olan bütün kartları ₼${newDenomination}-ə dəyişdirmək istədiyinizdən əminsiniz?`)) {
            router.post(route('gift-cards.update-denomination'), {
                old_denomination: parseFloat(oldDenomination),
                new_denomination: parseFloat(newDenomination)
            }, {
                preserveScroll: true,
                onSuccess: () => {
                    setEditingDenomination(null);
                    setNewDenomination('');
                }
            });
        }
    };

    const toggleDenomination = (denomination: number) => {
        setSelectedDenominations(prev =>
            prev.includes(denomination)
                ? prev.filter(d => d !== denomination)
                : [...prev, denomination]
        );
    };

    const toggleExpanded = (denomination: string) => {
        setExpandedDenominations(prev =>
            prev.includes(denomination)
                ? prev.filter(d => d !== denomination)
                : [...prev, denomination]
        );
    };

    const toggleAllExpanded = () => {
        if (expandedDenominations.length === Object.keys(configuredCards).length) {
            setExpandedDenominations([]);
        } else {
            setExpandedDenominations(Object.keys(configuredCards));
        }
    };

    const getFilteredCards = (denomination: string, cards: GiftCard[]) => {
        const searchTerm = searchTerms[denomination]?.toLowerCase() || '';
        if (!searchTerm) return cards;
        return cards.filter(card => card.card_number.toLowerCase().includes(searchTerm));
    };

    const getPaginatedCards = (denomination: string, cards: GiftCard[]) => {
        const itemsPerPage = 10;
        const page = currentPages[denomination] || 1;
        const filteredCards = getFilteredCards(denomination, cards);
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return {
            cards: filteredCards.slice(startIndex, endIndex),
            totalPages: Math.ceil(filteredCards.length / itemsPerPage),
            currentPage: page,
            totalCards: filteredCards.length
        };
    };

    const setPage = (denomination: string, page: number) => {
        setCurrentPages(prev => ({ ...prev, [denomination]: page }));
    };

    const availableDenominations = Object.keys(configuredCards);

    return (
        <AuthenticatedLayout>
            <Head title="Hədiyyə Kartları - Konfiqurasiya" />

            <div className="py-6">
                <div className="w-full px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900">Hədiyyə Kartları - Konfiqurasiya</h1>
                        <p className="mt-1 text-sm text-gray-600">
                            Boş kartları konfiqurasiya edin və satış üçün məhsul yaradın
                        </p>
                    </div>

                    {/* Statistics */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <GiftIcon className="h-8 w-8 text-gray-400" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Boş Kartlar</p>
                                    <p className="text-2xl font-semibold text-gray-900">{statistics.free_count}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <CreditCardIcon className="h-8 w-8 text-blue-400" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Konfiqurasiya Olunmuş</p>
                                    <p className="text-2xl font-semibold text-gray-900">{statistics.configured_count}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <CheckCircleIcon className="h-8 w-8 text-green-400" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Aktiv Kartlar</p>
                                    <p className="text-2xl font-semibold text-gray-900">{statistics.active_count}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <XCircleIcon className="h-8 w-8 text-red-400" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">İstifadə Olunmuş</p>
                                    <p className="text-2xl font-semibold text-gray-900">{statistics.depleted_count}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Configuration Form */}
                    {freeCards.length > 0 && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Kartları Konfiqurasiya Et
                                    </h2>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Bir nominal seçin və konfiqurasiya edin
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-600">Mövcud boş kartlar</p>
                                    <p className="text-2xl font-bold text-blue-600">{freeCards.length}</p>
                                </div>
                            </div>

                            <form onSubmit={handleBulkConfigure} className="max-w-2xl">
                                <div className="flex items-end gap-4">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Nominal (₼) *
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={denomination}
                                            onChange={(e) => setDenomination(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Məsələn: 50"
                                            required
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Kart nominalı (məbləği)</p>
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Say *
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            max={freeCards.length}
                                            value={quantity}
                                            onChange={(e) => setQuantity(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                            placeholder={`Maksimum ${freeCards.length}`}
                                            required
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Maksimum: {freeCards.length} kart</p>
                                    </div>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium whitespace-nowrap"
                                    >
                                        Konfiqurasiya Et
                                    </button>
                                </div>
                            </form>

                            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                                <p className="text-sm text-blue-800">
                                    <strong>Qeyd:</strong> Bir dəfədə yalnız bir nominal konfiqurasiya edə bilərsiniz.
                                    Başqa nominal üçün yenidən konfiqurasiya edin.
                                </p>
                            </div>
                        </div>
                    )}



                    {/* Configured Cards by Denomination */}
                    {Object.keys(configuredCards).length > 0 && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Satış üçün Hazır Kartlar
                                    </h2>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Bu kartlar POS-da satıla bilər. Satılmamış kartların məbləğini istədiyiniz zaman dəyişə bilərsiniz.
                                    </p>
                                </div>
                                <button
                                    onClick={toggleAllExpanded}
                                    className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium border border-blue-600 rounded-md hover:bg-blue-50"
                                >
                                    {expandedDenominations.length === Object.keys(configuredCards).length ? 'Hamısını Bağla' : 'Hamısını Aç'}
                                </button>
                            </div>
                            <div className="space-y-4">
                                {Object.entries(configuredCards).map(([denomination, cards]) => {
                                    const isExpanded = expandedDenominations.includes(denomination);
                                    const paginatedData = getPaginatedCards(denomination, cards);

                                    return (
                                        <div key={denomination} className="border border-gray-200 rounded-lg overflow-hidden">
                                            {/* Header */}
                                            <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                                                <button
                                                    onClick={() => toggleExpanded(denomination)}
                                                    className="flex items-center gap-2 flex-1 text-left"
                                                >
                                                    {isExpanded ? (
                                                        <ChevronUpIcon className="w-5 h-5 text-gray-500" />
                                                    ) : (
                                                        <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                                                    )}
                                                    <div className="flex items-center gap-3">
                                                        <h3 className="text-md font-semibold text-gray-800">
                                                            ₼{denomination}
                                                        </h3>
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                            {cards.length} kart
                                                        </span>
                                                    </div>
                                                </button>
                                                <div className="flex items-center gap-2">
                                                    {editingDenomination === denomination ? (
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                value={newDenomination}
                                                                onChange={(e) => setNewDenomination(e.target.value)}
                                                                placeholder="Yeni məbləğ"
                                                                className="w-32 px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                            />
                                                            <button
                                                                onClick={() => handleUpdateDenomination(denomination)}
                                                                className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 whitespace-nowrap"
                                                            >
                                                                Təsdiqlə
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setEditingDenomination(null);
                                                                    setNewDenomination('');
                                                                }}
                                                                className="px-3 py-1 text-sm bg-gray-400 text-white rounded-md hover:bg-gray-500"
                                                            >
                                                                Ləğv et
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => {
                                                                setEditingDenomination(denomination);
                                                                setNewDenomination(denomination);
                                                            }}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium border border-blue-600 rounded-md hover:bg-blue-50"
                                                        >
                                                            <PencilIcon className="w-4 h-4" />
                                                            Məbləği Dəyiş
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Expanded Content */}
                                            {isExpanded && (
                                                <div className="p-4">
                                                    {/* Search */}
                                                    <div className="mb-4">
                                                        <div className="relative">
                                                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                                            <input
                                                                type="text"
                                                                value={searchTerms[denomination] || ''}
                                                                onChange={(e) => {
                                                                    setSearchTerms(prev => ({ ...prev, [denomination]: e.target.value }));
                                                                    setPage(denomination, 1);
                                                                }}
                                                                placeholder="Kart nömrəsi ilə axtar..."
                                                                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Cards Table */}
                                                    {paginatedData.cards.length > 0 ? (
                                                        <>
                                                            <div className="overflow-x-auto">
                                                                <table className="min-w-full divide-y divide-gray-200">
                                                                    <thead className="bg-gray-50">
                                                                        <tr>
                                                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                                                #
                                                                            </th>
                                                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                                                Kart Nömrəsi
                                                                            </th>
                                                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                                                Status
                                                                            </th>
                                                                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                                                                Əməliyyatlar
                                                                            </th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                                        {paginatedData.cards.map((card, index) => (
                                                                            <tr key={card.id} className="hover:bg-gray-50">
                                                                                <td className="px-4 py-3 text-sm text-gray-500">
                                                                                    {(paginatedData.currentPage - 1) * 10 + index + 1}
                                                                                </td>
                                                                                <td className="px-4 py-3 text-sm font-mono text-gray-900">
                                                                                    {card.card_number}
                                                                                </td>
                                                                                <td className="px-4 py-3 text-sm">
                                                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                                        Konfiqurasiya olunub
                                                                                    </span>
                                                                                </td>
                                                                                <td className="px-4 py-3 text-sm text-right">
                                                                                    <Link
                                                                                        href={`/gift-cards/${card.id}`}
                                                                                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
                                                                                    >
                                                                                        <EyeIcon className="w-4 h-4" />
                                                                                        Bax
                                                                                    </Link>
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>

                                                            {/* Pagination */}
                                                            {paginatedData.totalPages > 1 && (
                                                                <div className="mt-4 flex items-center justify-between">
                                                                    <div className="text-sm text-gray-700">
                                                                        {paginatedData.totalCards} nəticədən{' '}
                                                                        {(paginatedData.currentPage - 1) * 10 + 1}-
                                                                        {Math.min(paginatedData.currentPage * 10, paginatedData.totalCards)} arası
                                                                    </div>
                                                                    <div className="flex gap-2">
                                                                        <button
                                                                            onClick={() => setPage(denomination, paginatedData.currentPage - 1)}
                                                                            disabled={paginatedData.currentPage === 1}
                                                                            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                        >
                                                                            Əvvəlki
                                                                        </button>
                                                                        <span className="px-3 py-1 text-sm text-gray-700">
                                                                            Səhifə {paginatedData.currentPage} / {paginatedData.totalPages}
                                                                        </span>
                                                                        <button
                                                                            onClick={() => setPage(denomination, paginatedData.currentPage + 1)}
                                                                            disabled={paginatedData.currentPage === paginatedData.totalPages}
                                                                            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                        >
                                                                            Növbəti
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <div className="text-center py-8 text-sm text-gray-500">
                                                            Axtarışa uyğun kart tapılmadı
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Recently Activated Cards */}
                    {activeCards.length > 0 && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                Son Aktivləşdirilən Kartlar
                            </h2>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Kart Nömrəsi
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Nominal
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Cari Balans
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Müştəri
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Aktivləşmə Tarixi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {activeCards.map(card => (
                                            <tr key={card.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                                                    {card.card_number}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    ₼{card.denomination}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                                                    ₼{card.current_balance ? Number(card.current_balance).toFixed(2) : '0.00'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {card.customer?.name || '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {card.activated_at ? new Date(card.activated_at).toLocaleDateString('az-AZ') : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {freeCards.length === 0 && Object.keys(configuredCards).length === 0 && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                            <GiftIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-semibold text-gray-900">Boş kart yoxdur</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Super admin sizə hədiyyə kartları təyin etməlidir
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
