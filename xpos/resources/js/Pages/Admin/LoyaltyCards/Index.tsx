import { Head, Link, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import SuperAdminNav from '@/Components/SuperAdminNav';

interface LoyaltyCard {
    id: number;
    card_number: string;
    status: 'free' | 'used' | 'inactive';
    account_id: number | null;
    customer_id: number | null;
    assigned_at: string | null;
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
    used: number;
    inactive: number;
}

interface Account {
    id: number;
    company_name: string;
}

interface Props {
    cards: {
        data: LoyaltyCard[];
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
    };
    accounts: Account[];
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function LoyaltyCardsIndex({ cards, stats, filters, accounts, flash }: Props) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [showGenerateForm, setShowGenerateForm] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        quantity: '100',
        account_id: '',
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (statusFilter) params.append('status', statusFilter);
        window.location.href = `/admin/loyalty-cards?${params.toString()}`;
    };

    const handleGenerateCards = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('superadmin.loyalty-cards.generate'), {
            onSuccess: () => {
                reset();
                setShowGenerateForm(false);
            },
        });
    };

    const handleDeactivateCard = (card: LoyaltyCard) => {
        if (confirm(`Kart ${card.card_number} deaktivasiya etmək istədiyinizdən əminsiniz?`)) {
            router.post(route('superadmin.loyalty-cards.deactivate', card.id), {}, {
                preserveScroll: true,
            });
        }
    };

    const handleActivateCard = (card: LoyaltyCard) => {
        if (confirm(`Kart ${card.card_number} aktivləşdirmək istədiyinizdən əminsiniz?`)) {
            router.post(route('superadmin.loyalty-cards.activate', card.id), {}, {
                preserveScroll: true,
            });
        }
    };

    const handleUnassignCard = (card: LoyaltyCard) => {
        if (confirm(`Kart ${card.card_number} müştəridən ayırmaq istədiyinizdən əminsiniz?`)) {
            router.post(route('superadmin.loyalty-cards.unassign', card.id), {}, {
                preserveScroll: true,
            });
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'free':
                return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Azad</span>;
            case 'used':
                return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">İstifadə olunur</span>;
            case 'inactive':
                return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Deaktiv</span>;
            default:
                return null;
        }
    };

    return (
        <>
            <Head title="Loaylıq Kartları - Super Admin" />

            <div className="min-h-screen bg-gray-50">
                <div className="bg-white shadow">
                    <div className="mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="py-6">
                            <h1 className="text-3xl font-bold text-gray-900">
                                Loaylıq Kartları İdarəsi
                            </h1>
                            <p className="mt-2 text-sm text-gray-600">
                                Fiziki loaylıq kartlarını yaradın və idarə edin
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <SuperAdminNav />
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
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-4 mb-8">
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
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
                                                Azad Kartlar
                                            </dt>
                                            <dd className="text-lg font-semibold text-green-600">
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
                                        <svg className="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                İstifadə olunan
                                            </dt>
                                            <dd className="text-lg font-semibold text-blue-600">
                                                {stats.used}
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
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                        </svg>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Deaktiv
                                            </dt>
                                            <dd className="text-lg font-semibold text-gray-600">
                                                {stats.inactive}
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
                            <div className="flex-1 max-w-lg">
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
                                        className="border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        <option value="">Hamı</option>
                                        <option value="free">Azad</option>
                                        <option value="used">İstifadə olunan</option>
                                        <option value="inactive">Deaktiv</option>
                                    </select>
                                    <PrimaryButton type="submit">
                                        Axtar
                                    </PrimaryButton>
                                </form>
                            </div>
                            <div className="flex space-x-2">
                                <Link href={route('superadmin.loyalty-cards.reports')}>
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
                                <form onSubmit={handleGenerateCards} className="max-w-md">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                Hesab seçin *
                                            </label>
                                            <select
                                                value={data.account_id}
                                                onChange={(e) => setData('account_id', e.target.value)}
                                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
                                        Hesab
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Müştəri
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Təyin tarixi
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
                                                {card.customer ? (
                                                    <>
                                                        <div>{card.customer.name}</div>
                                                        <div className="text-xs text-gray-500">{card.customer.phone}</div>
                                                    </>
                                                ) : '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {card.assigned_at ? new Date(card.assigned_at).toLocaleDateString('az-AZ') : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end space-x-2">
                                                {card.status === 'used' && (
                                                    <button
                                                        onClick={() => handleUnassignCard(card)}
                                                        className="text-indigo-600 hover:text-indigo-900"
                                                    >
                                                        Ayır
                                                    </button>
                                                )}
                                                {card.status === 'free' && (
                                                    <button
                                                        onClick={() => handleDeactivateCard(card)}
                                                        className="text-red-600 hover:text-red-900"
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
            </div>
        </>
    );
}
