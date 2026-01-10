import { Head, Link, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import SuperAdminLayout from '@/Layouts/SuperAdminLayout';

interface GiftCard {
    id: number;
    card_number: string;
    status: 'free' | 'configured' | 'active' | 'depleted' | 'expired' | 'inactive';
    account_id: number | null;
    customer_id: number | null;
    denomination: number | null;
    initial_balance: number;
    current_balance: number;
    expiry_date: string | null;
    activated_at: string | null;
    created_at: string;
    account?: {
        id: number;
        company_name: string;
    };
    customer?: {
        id: number;
        name: string;
        phone: string;
    };
}

interface Stats {
    total: number;
    free: number;
    configured: number;
    active: number;
    depleted: number;
    expired: number;
    inactive: number;
    total_balance: number;
}

interface Account {
    id: number;
    company_name: string;
}

interface Props {
    cards: {
        data: GiftCard[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    stats: Stats;
    filters: {
        search?: string;
        status?: string;
        account_id?: number;
        balance?: number;
    };
    accounts: Account[];
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function GiftCardsIndex({ cards, stats, filters, accounts, flash }: Props) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [accountFilter, setAccountFilter] = useState(filters.account_id?.toString() || '');
    const [showGenerateForm, setShowGenerateForm] = useState(false);
    const [selectedCards, setSelectedCards] = useState<number[]>([]);

    const { data, setData, post, processing, errors, reset } = useForm({
        quantity: '100',
        account_id: '',
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (statusFilter) params.append('status', statusFilter);
        if (accountFilter) params.append('account_id', accountFilter);
        window.location.href = `/admin/gift-cards?${params.toString()}`;
    };

    const handleGenerateCards = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('superadmin.gift-cards.generate'), {
            onSuccess: () => {
                reset();
                setShowGenerateForm(false);
            },
        });
    };

    const handleDeactivateCard = (card: GiftCard) => {
        if (confirm(`Kart ${card.card_number} deaktivasiya etmək istədiyinizdən əminsiniz?`)) {
            router.post(route('superadmin.gift-cards.deactivate', card.id), {}, {
                preserveScroll: true,
            });
        }
    };

    const handleActivateCard = (card: GiftCard) => {
        if (confirm(`Kart ${card.card_number} aktivləşdirmək istədiyinizdən əminsiniz?`)) {
            router.post(route('superadmin.gift-cards.activate', card.id), {}, {
                preserveScroll: true,
            });
        }
    };

    const handleSelectCard = (cardId: number) => {
        setSelectedCards(prev =>
            prev.includes(cardId)
                ? prev.filter(id => id !== cardId)
                : [...prev, cardId]
        );
    };

    const handleSelectAll = () => {
        const allCardIds = cards.data.map(card => card.id);

        if (selectedCards.length === allCardIds.length) {
            setSelectedCards([]);
        } else {
            setSelectedCards(allCardIds);
        }
    };

    const handleBulkDelete = () => {
        if (selectedCards.length === 0) {
            alert('Zəhmət olmasa silmək üçün kart seçin');
            return;
        }

        if (confirm(`⚠️ DİQQƏT: ${selectedCards.length} kartı silmək istədiyinizdən əminsiniz?\n\nBu əməliyyat geri alına bilməz!`)) {
            router.post(route('superadmin.gift-cards.bulk-delete'), {
                card_ids: selectedCards
            }, {
                preserveScroll: true,
                onSuccess: () => {
                    setSelectedCards([]);
                }
            });
        }
    };

    const handleDeleteCard = (card: GiftCard) => {
        if (confirm(`⚠️ Kart ${card.card_number} silmək istədiyinizdən əminsiniz?\n\nBu əməliyyat geri alına bilməz!`)) {
            router.delete(route('superadmin.gift-cards.destroy', card.id), {
                preserveScroll: true,
            });
        }
    };

    const totalCardsCount = cards.data.length;

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'free':
                return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Azad</span>;
            case 'configured':
                return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Konfiqurasiya olunub</span>;
            case 'active':
                return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Aktiv</span>;
            case 'depleted':
                return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">İstifadə olunub</span>;
            case 'expired':
                return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Vaxtı keçib</span>;
            case 'inactive':
                return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Deaktiv</span>;
            default:
                return null;
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('az-AZ', {
            style: 'currency',
            currency: 'AZN',
        }).format(amount);
    };

    return (
        <SuperAdminLayout title="Hədiyyə Kartları İdarəsi">
            <Head title="Hədiyyə Kartları - Super Admin" />

            <div className="space-y-6">
                <p className="text-sm text-gray-600">
                    Hədiyyə kartlarını yaradın və idarə edin
                </p>

                    {/* Flash Messages */}
                    {flash?.success && (
                        <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
                            <div className="flex">
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-green-800">
                                        {flash.success}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {flash?.error && (
                        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                            <div className="flex">
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-red-800">
                                        {flash.error}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-5 mb-8">
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Ümumi Kartlar
                                            </dt>
                                            <dd className="text-lg font-semibold text-gray-900">
                                                {stats.total}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Aktiv Kartlar
                                            </dt>
                                            <dd className="text-lg font-semibold text-green-600">
                                                {stats.active}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                        </svg>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Boş Kartlar
                                            </dt>
                                            <dd className="text-lg font-semibold text-gray-600">
                                                {stats.free}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <svg className="h-6 w-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Konfiqurasiya Olunmuş
                                            </dt>
                                            <dd className="text-lg font-semibold text-yellow-600">
                                                {stats.configured}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <svg className="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                İstifadə Olunmuş
                                            </dt>
                                            <dd className="text-lg font-semibold text-blue-600">
                                                {stats.depleted}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <svg className="h-6 w-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Vaxtı keçib
                                            </dt>
                                            <dd className="text-lg font-semibold text-red-600">
                                                {stats.expired}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <svg className="h-6 w-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Ümumi Balans
                                            </dt>
                                            <dd className="text-lg font-semibold text-purple-600">
                                                {formatCurrency(stats.total_balance)}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions Bar */}
                    <div className="bg-white rounded-lg shadow p-6 mb-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                            <div className="flex-1 max-w-2xl">
                                <form onSubmit={handleSearch} className="flex space-x-2">
                                    <TextInput
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Kart nömrəsi ilə axtar..."
                                        className="flex-1"
                                    />
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="border-gray-300 rounded-md shadow-sm focus:border-slate-500 focus:ring-slate-500"
                                    >
                                        <option value="">Hamısı</option>
                                        <option value="free">Azad</option>
                                        <option value="configured">Konfiqurasiya olunub</option>
                                        <option value="active">Aktiv</option>
                                        <option value="depleted">İstifadə olunub</option>
                                        <option value="expired">Vaxtı keçib</option>
                                        <option value="inactive">Deaktiv</option>
                                    </select>
                                    <select
                                        value={accountFilter}
                                        onChange={(e) => setAccountFilter(e.target.value)}
                                        className="border-gray-300 rounded-md shadow-sm focus:border-slate-500 focus:ring-slate-500"
                                    >
                                        <option value="">Bütün hesablar</option>
                                        {accounts.map((account) => (
                                            <option key={account.id} value={account.id}>
                                                {account.company_name}
                                            </option>
                                        ))}
                                    </select>
                                    <PrimaryButton type="submit">
                                        Axtar
                                    </PrimaryButton>
                                </form>
                            </div>
                            <div className="flex space-x-2">
                                {selectedCards.length > 0 && (
                                    <DangerButton
                                        type="button"
                                        onClick={handleBulkDelete}
                                    >
                                        Seçilənləri Sil ({selectedCards.length})
                                    </DangerButton>
                                )}
                                <Link href={route('superadmin.gift-cards.reports')}>
                                    <SecondaryButton type="button">
                                        Hesabatlar
                                    </SecondaryButton>
                                </Link>
                                <PrimaryButton
                                    type="button"
                                    onClick={() => setShowGenerateForm(!showGenerateForm)}
                                >
                                    Kart Yarat
                                </PrimaryButton>
                            </div>
                        </div>

                        {/* Generate Form */}
                        {showGenerateForm && (
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <h3 className="text-md font-semibold text-gray-900 mb-2">
                                    Boş Hədiyyə Kartları Yarat
                                </h3>
                                <p className="text-sm text-gray-600 mb-4">
                                    Boş kart ID-ləri yaradın və hesaba təyin edin. Hesab sahibi öz admin panelində kartları konfiqurasiya edəcək.
                                </p>
                                <form onSubmit={handleGenerateCards} className="max-w-md">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                Hesab seçin *
                                            </label>
                                            <select
                                                value={data.account_id}
                                                onChange={(e) => setData('account_id', e.target.value)}
                                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-slate-500 focus:ring-slate-500"
                                                required
                                            >
                                                <option value="">Hesab seçin...</option>
                                                {accounts.map((account) => (
                                                    <option key={account.id} value={account.id}>
                                                        {account.company_name}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.account_id && (
                                                <p className="mt-1 text-sm text-red-600">{errors.account_id}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                Kartların sayı (maksimum 1000)
                                            </label>
                                            <TextInput
                                                type="number"
                                                min="1"
                                                max="1000"
                                                value={data.quantity}
                                                onChange={(e) => setData('quantity', e.target.value)}
                                                className="mt-1 block w-full"
                                                required
                                            />
                                            {errors.quantity && (
                                                <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>
                                            )}
                                        </div>
                                        <div className="flex space-x-2">
                                            <PrimaryButton type="submit" disabled={processing}>
                                                {processing ? 'Yaradılır...' : 'Yarat'}
                                            </PrimaryButton>
                                            <SecondaryButton
                                                type="button"
                                                onClick={() => {
                                                    setShowGenerateForm(false);
                                                    reset();
                                                }}
                                            >
                                                Ləğv et
                                            </SecondaryButton>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>

                    {/* Cards Table */}
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        {totalCardsCount > 0 && (
                            <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center">
                                <input
                                    type="checkbox"
                                    checked={selectedCards.length === totalCardsCount && totalCardsCount > 0}
                                    onChange={handleSelectAll}
                                    className="h-4 w-4 text-indigo-600 focus:ring-slate-500 border-gray-300 rounded"
                                />
                                <label className="ml-2 text-sm text-gray-600">
                                    Bütün kartları seç ({totalCardsCount})
                                </label>
                            </div>
                        )}
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <span className="sr-only">Seç</span>
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Kart Nömrəsi
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Hesab
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Balans
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
                                    <tr key={card.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="checkbox"
                                                checked={selectedCards.includes(card.id)}
                                                onChange={() => handleSelectCard(card.id)}
                                                className="h-4 w-4 text-indigo-600 focus:ring-slate-500 border-gray-300 rounded"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {card.card_number}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(card.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {card.account ? card.account.company_name : '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {formatCurrency(card.current_balance)}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                İlkin: {formatCurrency(card.initial_balance)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {card.customer ? (
                                                    <>
                                                        <div>{card.customer.name}</div>
                                                        <div className="text-xs text-gray-500">{card.customer.phone}</div>
                                                    </>
                                                ) : '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {card.expiry_date ? new Date(card.expiry_date).toLocaleDateString('az-AZ') : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end space-x-2">
                                                <Link
                                                    href={route('superadmin.gift-cards.show', card.id)}
                                                    className="text-slate-600 hover:text-slate-900"
                                                >
                                                    Bax
                                                </Link>
                                                {card.status !== 'inactive' && (
                                                    <button
                                                        onClick={() => handleDeactivateCard(card)}
                                                        className="text-orange-600 hover:text-orange-900"
                                                    >
                                                        Deaktiv et
                                                    </button>
                                                )}
                                                {card.status === 'inactive' && (
                                                    <button
                                                        onClick={() => handleActivateCard(card)}
                                                        className="text-green-600 hover:text-green-900"
                                                    >
                                                        Aktiv et
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteCard(card)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Sil
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        {cards.last_page > 1 && (
                            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                                <div className="flex-1 flex justify-between sm:hidden">
                                    {cards.current_page > 1 && (
                                        <a
                                            href={`?page=${cards.current_page - 1}`}
                                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                        >
                                            Əvvəlki
                                        </a>
                                    )}
                                    {cards.current_page < cards.last_page && (
                                        <a
                                            href={`?page=${cards.current_page + 1}`}
                                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                        >
                                            Növbəti
                                        </a>
                                    )}
                                </div>
                                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm text-gray-700">
                                            <span className="font-medium">{cards.total}</span> nəticədən{' '}
                                            <span className="font-medium">{(cards.current_page - 1) * cards.per_page + 1}</span>-
                                            <span className="font-medium">{Math.min(cards.current_page * cards.per_page, cards.total)}</span> arası göstərilir
                                        </p>
                                    </div>
                                    <div>
                                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                            {Array.from({ length: cards.last_page }, (_, i) => i + 1).map((page) => (
                                                <a
                                                    key={page}
                                                    href={`?page=${page}`}
                                                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                        page === cards.current_page
                                                            ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    {page}
                                                </a>
                                            ))}
                                        </nav>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
            </div>
        </SuperAdminLayout>
    );
}
