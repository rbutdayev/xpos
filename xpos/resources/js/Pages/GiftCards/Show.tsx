import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import {
    ArrowLeftIcon,
    CreditCardIcon,
    UserIcon,
    ClockIcon,
    ReceiptPercentIcon,
    BanknotesIcon,
    ListBulletIcon,
    ArrowPathIcon,
} from '@heroicons/react/24/outline';

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
    sale?: {
        sale_id: number;
        total: number;
    };
    created_at: string;
}

interface GiftCard {
    id: number;
    card_number: string;
    denomination: number | null;
    initial_balance: number | null;
    current_balance: number | null;
    status: 'free' | 'configured' | 'active' | 'depleted' | 'expired' | 'inactive';
    customer?: {
        id: number;
        name: string;
        phone?: string;
        email?: string;
    };
    activated_at?: string;
    expiry_date?: string;
    fiscal_document_id?: string;
    fiscal_number?: string;
    notes?: string;
    created_at: string;
    transactions: GiftCardTransaction[];
}

interface ShowProps extends PageProps {
    card: GiftCard;
    giftCardsEnabled?: boolean;
    discountsEnabled?: boolean;
}

export default function Show({ auth, card, giftCardsEnabled = true, discountsEnabled = false }: ShowProps) {
    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { label: string; class: string }> = {
            free: { label: 'Boş', class: 'bg-gray-100 text-gray-800' },
            configured: { label: 'Konfiqurasiya olunub', class: 'bg-blue-100 text-blue-800' },
            active: { label: 'Aktiv', class: 'bg-green-100 text-green-800' },
            depleted: { label: 'İstifadə olunub', class: 'bg-red-100 text-red-800' },
            expired: { label: 'Vaxtı keçib', class: 'bg-orange-100 text-orange-800' },
            inactive: { label: 'Qeyri-aktiv', class: 'bg-gray-100 text-gray-800' },
        };

        const config = statusConfig[status] || statusConfig.free;

        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.class}`}>
                {config.label}
            </span>
        );
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

    const handleReactivate = () => {
        if (confirm('Bu kartı yenidən satış üçün sıfırlamaq istədiyinizə əminsiniz? Bütün məlumatlar təmizlənəcək və kart yenidən konfiqurasiya edilmiş status alacaq.')) {
            router.post(`/gift-cards/${card.id}/reactivate`, {}, {
                preserveScroll: true,
            });
        }
    };

    const isExpiringSoon = card.expiry_date && new Date(card.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const canReactivate = card.status === 'depleted' || card.status === 'expired';

    return (
        <AuthenticatedLayout>
            <Head title={`Hədiyyə Kartı - ${card.card_number}`} />

            <div className="py-6">
                <div className="w-full px-4 sm:px-6 lg:px-8">
                    {/* Back Button */}
                    <div className="mb-6">
                        <Link
                            href="/gift-cards"
                            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
                        >
                            <ArrowLeftIcon className="w-4 h-4 mr-1" />
                            Geri
                        </Link>
                    </div>

                    {/* Card Header */}
                    <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg shadow-lg p-6 mb-6 text-white">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <h1 className="text-3xl font-bold mb-2 font-mono">{card.card_number}</h1>
                                <div className="flex items-center gap-3 flex-wrap">
                                    {getStatusBadge(card.status)}
                                    {isExpiringSoon && card.status === 'active' && (
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-400 text-yellow-900">
                                            Tezliklə bitmə tarixi keçir
                                        </span>
                                    )}
                                    {canReactivate && (
                                        <button
                                            onClick={handleReactivate}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-pink-600 rounded-md hover:bg-pink-50 font-medium shadow-sm transition-colors"
                                        >
                                            <ArrowPathIcon className="w-4 h-4" />
                                            Yenidən Aktivləşdir
                                        </button>
                                    )}
                                </div>
                            </div>
                            <CreditCardIcon className="w-16 h-16 opacity-50" />
                        </div>

                        {card.current_balance !== null && (
                            <div className="mt-6">
                                <p className="text-sm opacity-90">Cari Balans</p>
                                <p className="text-4xl font-bold mt-1">₼{Number(card.current_balance).toFixed(2)}</p>
                                {card.initial_balance && (
                                    <p className="text-sm opacity-75 mt-1">
                                        İlkin balans: ₼{Number(card.initial_balance).toFixed(2)}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Card Details */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Basic Information */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Əsas Məlumat</h2>
                                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Kart Nömrəsi</dt>
                                        <dd className="mt-1 text-sm text-gray-900 font-mono">{card.card_number}</dd>
                                    </div>
                                    {card.denomination && (
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Nominal</dt>
                                            <dd className="mt-1 text-sm text-gray-900 font-semibold">₼{card.denomination}</dd>
                                        </div>
                                    )}
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Status</dt>
                                        <dd className="mt-1">{getStatusBadge(card.status)}</dd>
                                    </div>
                                    {card.activated_at && (
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Aktivləşmə Tarixi</dt>
                                            <dd className="mt-1 text-sm text-gray-900">
                                                {new Date(card.activated_at).toLocaleString('az-AZ')}
                                            </dd>
                                        </div>
                                    )}
                                    {card.expiry_date && (
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Bitmə Tarixi</dt>
                                            <dd className="mt-1 text-sm text-gray-900">
                                                {new Date(card.expiry_date).toLocaleDateString('az-AZ')}
                                            </dd>
                                        </div>
                                    )}
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Yaradılma Tarixi</dt>
                                        <dd className="mt-1 text-sm text-gray-900">
                                            {new Date(card.created_at).toLocaleString('az-AZ')}
                                        </dd>
                                    </div>
                                </dl>
                            </div>

                            {/* Fiscal Information */}
                            {(card.fiscal_document_id || card.fiscal_number) && (
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                        <ReceiptPercentIcon className="w-5 h-5 mr-2 text-gray-500" />
                                        Fiskal Məlumat
                                    </h2>
                                    <dl className="grid grid-cols-1 gap-4">
                                        {card.fiscal_document_id && (
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">Fiskal Sənəd ID</dt>
                                                <dd className="mt-1 text-xs text-gray-900 font-mono break-all">
                                                    {card.fiscal_document_id}
                                                </dd>
                                            </div>
                                        )}
                                        {card.fiscal_number && (
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">Fiskal Nömrə</dt>
                                                <dd className="mt-1 text-sm text-gray-900 font-mono">
                                                    {card.fiscal_number}
                                                </dd>
                                            </div>
                                        )}
                                    </dl>
                                </div>
                            )}

                            {/* Transaction History */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                    <ClockIcon className="w-5 h-5 mr-2 text-gray-500" />
                                    Əməliyyat Tarixçəsi
                                </h2>
                                {card.transactions.length > 0 ? (
                                    <div className="space-y-4">
                                        {card.transactions.map((transaction) => (
                                            <div
                                                key={transaction.id}
                                                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            {getTransactionTypeBadge(transaction.transaction_type)}
                                                            <span className="text-xs text-gray-500">
                                                                {new Date(transaction.created_at).toLocaleString('az-AZ')}
                                                            </span>
                                                        </div>
                                                        {transaction.notes && (
                                                            <p className="text-sm text-gray-600">{transaction.notes}</p>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <p className={`text-lg font-semibold ${
                                                            transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                                                        }`}>
                                                            {transaction.amount > 0 ? '+' : ''}₼{Math.abs(Number(transaction.amount)).toFixed(2)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                                                    <span>
                                                        Əvvəlki: ₼{Number(transaction.balance_before).toFixed(2)} → Sonra: ₼{Number(transaction.balance_after).toFixed(2)}
                                                    </span>
                                                    <span>{transaction.user.name}</span>
                                                </div>
                                                {transaction.sale && (
                                                    <div className="mt-2 pt-2 border-t border-gray-100">
                                                        <Link
                                                            href={`/sales/${transaction.sale.sale_id}`}
                                                            className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                                                        >
                                                            <BanknotesIcon className="w-4 h-4 mr-1" />
                                                            Satış #{transaction.sale.sale_id} (₼{transaction.sale.total})
                                                        </Link>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 text-center py-8">Hələ əməliyyat aparılmayıb</p>
                                )}
                            </div>

                            {/* Notes */}
                            {card.notes && (
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Qeydlər</h2>
                                    <p className="text-sm text-gray-700">{card.notes}</p>
                                </div>
                            )}
                        </div>

                        {/* Customer Information */}
                        <div className="lg:col-span-1">
                            {card.customer ? (
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                        <UserIcon className="w-5 h-5 mr-2 text-gray-500" />
                                        Müştəri Məlumatı
                                    </h2>
                                    <dl className="space-y-3">
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Ad</dt>
                                            <dd className="mt-1 text-sm text-gray-900 font-semibold">
                                                {card.customer.name}
                                            </dd>
                                        </div>
                                        {card.customer.phone && (
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">Telefon</dt>
                                                <dd className="mt-1 text-sm text-gray-900">
                                                    <a
                                                        href={`tel:${card.customer.phone}`}
                                                        className="text-blue-600 hover:text-blue-800"
                                                    >
                                                        {card.customer.phone}
                                                    </a>
                                                </dd>
                                            </div>
                                        )}
                                        {card.customer.email && (
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">Email</dt>
                                                <dd className="mt-1 text-sm text-gray-900">
                                                    <a
                                                        href={`mailto:${card.customer.email}`}
                                                        className="text-blue-600 hover:text-blue-800"
                                                    >
                                                        {card.customer.email}
                                                    </a>
                                                </dd>
                                            </div>
                                        )}
                                        <div className="pt-3">
                                            <Link
                                                href={`/customers/${card.customer.id}`}
                                                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                            >
                                                Müştəri profilinə keç →
                                            </Link>
                                        </div>
                                    </dl>
                                </div>
                            ) : (
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                    <div className="text-center py-8">
                                        <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
                                        <p className="mt-2 text-sm text-gray-500">Müştəri təyin edilməyib</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
