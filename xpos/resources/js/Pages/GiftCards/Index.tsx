import React, { useState, Fragment } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import {
    GiftIcon,
    MagnifyingGlassIcon,
    AdjustmentsHorizontalIcon,
    Cog6ToothIcon,
    EllipsisVerticalIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon,
    ArrowPathIcon,
    XMarkIcon,
    ClockIcon,
    UserIcon,
    BanknotesIcon,
} from '@heroicons/react/24/outline';
import { Menu, Transition, Dialog } from '@headlessui/react';
import SharedDataTable, { BulkAction } from '@/Components/SharedDataTable';

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

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSearch();
    };

    const handleSearch = () => {
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

    // Handle double-click to view gift card
    const handleRowDoubleClick = (card: GiftCard) => {
        router.visit(`/gift-cards/${card.id}`);
    };

    // Handle bulk delete
    const handleBulkDelete = (selectedIds: (string | number)[]) => {
        const confirmMessage = `Seçilmiş ${selectedIds.length} hədiyyə kartını silmək istədiyinizə əminsiniz?`;

        if (!confirm(confirmMessage)) {
            return;
        }

        router.delete('/gift-cards/bulk-delete', {
            data: { ids: selectedIds },
            onError: (errors: any) => {
                alert('Xəta baş verdi');
            },
            preserveScroll: true
        });
    };

    // Define columns for SharedDataTable
    const columns = [
        {
            key: 'card_number',
            label: 'Kart Nömrəsi',
            sortable: true,
            render: (card: GiftCard) => (
                <div className="text-sm font-mono font-medium text-gray-900">
                    {card.card_number}
                </div>
            )
        },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            render: (card: GiftCard) => getStatusBadge(card)
        },
        {
            key: 'denomination',
            label: 'Nominal',
            render: (card: GiftCard) => (
                <div className="text-sm text-gray-900">
                    {card.denomination ? `₼${card.denomination}` : '-'}
                </div>
            )
        },
        {
            key: 'current_balance',
            label: 'Cari Balans',
            render: (card: GiftCard) => (
                <div className="text-sm font-semibold text-gray-900">
                    {card.current_balance !== null ? `₼${Number(card.current_balance).toFixed(2)}` : '-'}
                </div>
            )
        },
        {
            key: 'customer',
            label: 'Müştəri',
            hideOnMobile: true,
            render: (card: GiftCard) => (
                <div>
                    <div className="text-sm text-gray-900">
                        {card.customer?.name || '-'}
                    </div>
                    {card.customer?.phone && (
                        <div className="text-xs text-gray-500">
                            {card.customer.phone}
                        </div>
                    )}
                </div>
            )
        },
        {
            key: 'expiry_date',
            label: 'Bitmə tarixi',
            hideOnMobile: true,
            render: (card: GiftCard) => (
                <div className="text-sm text-gray-900">
                    {card.expiry_date
                        ? new Date(card.expiry_date).toLocaleDateString('az-AZ')
                        : '-'}
                </div>
            )
        }
    ];

    // Get bulk actions - dynamic based on selection
    const getBulkActions = (selectedIds: (string | number)[], selectedCards: GiftCard[]): BulkAction[] => {
        // If only ONE card is selected, show individual actions
        if (selectedIds.length === 1 && selectedCards.length === 1) {
            const card = selectedCards[0];

            const actions: BulkAction[] = [
                {
                    label: 'Baxış',
                    icon: <EyeIcon className="w-4 h-4" />,
                    variant: 'view' as const,
                    onClick: () => router.visit(`/gift-cards/${card.id}`)
                },
                {
                    label: 'Sil',
                    icon: <TrashIcon className="w-4 h-4" />,
                    variant: 'danger' as const,
                    onClick: () => {
                        if (confirm(`${card.card_number} kartını silmək istədiyinizə əminsiniz?`)) {
                            router.delete(`/gift-cards/${card.id}`, {
                                preserveScroll: true
                            });
                        }
                    }
                }
            ];

            // Add reactivate option for depleted/expired cards
            if (card.status === 'depleted' || card.status === 'expired') {
                actions.splice(1, 0, {
                    label: 'Yenidən Aktivləşdir',
                    icon: <ArrowPathIcon className="w-4 h-4" />,
                    variant: 'secondary' as const,
                    onClick: () => handleReactivate(card.id)
                });
            }

            return actions;
        }

        // Multiple cards selected - show bulk delete
        return [
            {
                label: 'Kütləvi Sil',
                icon: <TrashIcon className="w-4 h-4" />,
                variant: 'danger' as const,
                onClick: handleBulkDelete
            }
        ];
    };

    return (
        <AuthenticatedLayout>
            <Head title="Hədiyyə Kartları" />
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
                        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Kart nömrəsi ilə axtar..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-slate-500 focus:border-slate-500"
                                    />
                                </div>
                            </div>
                            <div className="w-full md:w-48">
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-slate-500 focus:border-slate-500"
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
                                    className="px-6 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-600 font-medium"
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

                    {/* Cards Table - Using SharedDataTable */}
                    <SharedDataTable
                        data={cards as any}
                        columns={columns as any}
                        selectable={true}
                        bulkActions={getBulkActions}
                        searchValue={search}
                        onSearchChange={setSearch}
                        searchPlaceholder="Kart nömrəsi ilə axtar..."
                        filters={[
                            {
                                key: 'status',
                                type: 'dropdown' as const,
                                label: 'Status',
                                value: status,
                                onChange: setStatus,
                                options: [
                                    { value: '', label: 'Bütün statuslar' },
                                    { value: 'free', label: 'Boş' },
                                    { value: 'configured', label: 'Konfiqurasiya olunub' },
                                    { value: 'active', label: 'Aktiv' },
                                    { value: 'depleted', label: 'İstifadə olunub' },
                                    { value: 'expired', label: 'Vaxtı keçib' },
                                    { value: 'inactive', label: 'Qeyri-aktiv' }
                                ]
                            }
                        ]}
                        onSearch={handleSearch}
                        onReset={handleClearFilters}
                        emptyState={{
                            icon: <GiftIcon className="w-12 h-12" />,
                            title: 'Hədiyyə kartı tapılmadı',
                            description: 'Axtarış kriteriyalarınızı dəyişdirin və ya yeni kart konfiqurasiya edin'
                        }}
                        fullWidth={true}
                        dense={true}
                        onRowDoubleClick={handleRowDoubleClick}
                        rowClassName={(card: GiftCard) =>
                            `cursor-pointer hover:bg-blue-50 transition-all duration-200`
                        }
                    />
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
                                                    className="text-sm text-slate-600 hover:text-slate-800 font-medium"
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
