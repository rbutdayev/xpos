import { Head, Link } from '@inertiajs/react';
import SuperAdminNav from '@/Components/SuperAdminNav';

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
    fiscal_document_id: string | null;
    fiscal_number: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    account?: {
        id: number;
        company_name: string;
        contact_email: string;
        contact_phone: string;
    };
    customer?: {
        id: number;
        name: string;
        phone: string;
        email: string;
    };
}

interface Transaction {
    id: number;
    transaction_type: 'issue' | 'activate' | 'redeem' | 'refund' | 'adjust' | 'expire' | 'cancel';
    amount: number;
    balance_before: number;
    balance_after: number;
    notes: string | null;
    created_at: string;
    user?: {
        id: number;
        name: string;
    };
    sale?: {
        sale_id: number;
        sale_number: string;
    };
}

interface Props {
    card: GiftCard;
    transactions: Transaction[];
}

export default function GiftCardShow({ card, transactions }: Props) {
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'free':
                return <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Azad</span>;
            case 'configured':
                return <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Konfiqurasiya olunub</span>;
            case 'active':
                return <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-green-100 text-green-800">Aktiv</span>;
            case 'depleted':
                return <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">İstifadə olunub</span>;
            case 'expired':
                return <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-red-100 text-red-800">Vaxtı keçib</span>;
            case 'inactive':
                return <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Deaktiv</span>;
            default:
                return null;
        }
    };

    const getTransactionTypeBadge = (type: string) => {
        switch (type) {
            case 'issue':
                return <span className="px-2 py-1 text-xs font-semibold rounded bg-purple-100 text-purple-800">Yaradılma</span>;
            case 'activate':
                return <span className="px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800">Aktivləşdirmə</span>;
            case 'redeem':
                return <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">İstifadə</span>;
            case 'refund':
                return <span className="px-2 py-1 text-xs font-semibold rounded bg-yellow-100 text-yellow-800">Geri qaytarma</span>;
            case 'adjust':
                return <span className="px-2 py-1 text-xs font-semibold rounded bg-orange-100 text-orange-800">Düzəliş</span>;
            case 'expire':
                return <span className="px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-800">Vaxtı keçmə</span>;
            case 'cancel':
                return <span className="px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-800">Ləğv</span>;
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

    const formatDateTime = (date: string | null) => {
        if (!date) return '-';
        return new Date(date).toLocaleString('az-AZ', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <>
            <Head title={`Hədiyyə Kartı ${card.card_number}`} />

            <div className="min-h-screen bg-gray-50">
                <div className="bg-white shadow">
                    <div className="mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="py-6 flex justify-between items-center">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    Hədiyyə Kartı #{card.card_number}
                                </h1>
                                <p className="mt-2 text-sm text-gray-600">
                                    Kartın təfərrüatları və əməliyyat tarixçəsi
                                </p>
                            </div>
                            <Link
                                href={route('superadmin.gift-cards.index')}
                                className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md font-semibold text-xs text-gray-700 uppercase tracking-widest shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            >
                                ← Geri
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <SuperAdminNav />

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {/* Card Details */}
                        <div className="bg-white shadow rounded-lg overflow-hidden">
                            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900">Kart Məlumatları</h2>
                            </div>
                            <div className="px-6 py-4 space-y-4">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Kart Nömrəsi</dt>
                                    <dd className="mt-1 text-lg font-mono font-semibold text-gray-900">{card.card_number}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                                    <dd className="mt-1">{getStatusBadge(card.status)}</dd>
                                </div>
                                {card.denomination && (
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Nominal</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{formatCurrency(card.denomination)}</dd>
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">İlkin Balans</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{formatCurrency(card.initial_balance)}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Cari Balans</dt>
                                        <dd className="mt-1 text-lg font-semibold text-green-600">{formatCurrency(card.current_balance)}</dd>
                                    </div>
                                </div>
                                {card.expiry_date && (
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Bitmə Tarixi</dt>
                                        <dd className="mt-1 text-sm text-gray-900">
                                            {new Date(card.expiry_date).toLocaleDateString('az-AZ')}
                                        </dd>
                                    </div>
                                )}
                                {card.activated_at && (
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Aktivləşdirmə Tarixi</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{formatDateTime(card.activated_at)}</dd>
                                    </div>
                                )}
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Yaradılma Tarixi</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{formatDateTime(card.created_at)}</dd>
                                </div>
                                {card.notes && (
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Qeydlər</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{card.notes}</dd>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Account & Customer Info */}
                        <div className="space-y-6">
                            {/* Account Details */}
                            <div className="bg-white shadow rounded-lg overflow-hidden">
                                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                                    <h2 className="text-lg font-semibold text-gray-900">Hesab Məlumatları</h2>
                                </div>
                                <div className="px-6 py-4">
                                    {card.account ? (
                                        <div className="space-y-3">
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">Şirkət</dt>
                                                <dd className="mt-1 text-sm text-gray-900">{card.account.company_name}</dd>
                                            </div>
                                            {card.account.contact_email && (
                                                <div>
                                                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                                                    <dd className="mt-1 text-sm text-gray-900">{card.account.contact_email}</dd>
                                                </div>
                                            )}
                                            {card.account.contact_phone && (
                                                <div>
                                                    <dt className="text-sm font-medium text-gray-500">Telefon</dt>
                                                    <dd className="mt-1 text-sm text-gray-900">{card.account.contact_phone}</dd>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500">Hesab təyin edilməyib</p>
                                    )}
                                </div>
                            </div>

                            {/* Customer Details */}
                            <div className="bg-white shadow rounded-lg overflow-hidden">
                                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                                    <h2 className="text-lg font-semibold text-gray-900">Müştəri Məlumatları</h2>
                                </div>
                                <div className="px-6 py-4">
                                    {card.customer ? (
                                        <div className="space-y-3">
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">Ad</dt>
                                                <dd className="mt-1 text-sm text-gray-900">{card.customer.name}</dd>
                                            </div>
                                            {card.customer.phone && (
                                                <div>
                                                    <dt className="text-sm font-medium text-gray-500">Telefon</dt>
                                                    <dd className="mt-1 text-sm text-gray-900">{card.customer.phone}</dd>
                                                </div>
                                            )}
                                            {card.customer.email && (
                                                <div>
                                                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                                                    <dd className="mt-1 text-sm text-gray-900">{card.customer.email}</dd>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500">Müştəri təyin edilməyib</p>
                                    )}
                                </div>
                            </div>

                            {/* Fiscal Info */}
                            {(card.fiscal_document_id || card.fiscal_number) && (
                                <div className="bg-white shadow rounded-lg overflow-hidden">
                                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                                        <h2 className="text-lg font-semibold text-gray-900">Fiskal Məlumatları</h2>
                                    </div>
                                    <div className="px-6 py-4 space-y-3">
                                        {card.fiscal_document_id && (
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">Fiskal Sənəd ID</dt>
                                                <dd className="mt-1 text-xs font-mono text-gray-900 break-all">
                                                    {card.fiscal_document_id}
                                                </dd>
                                            </div>
                                        )}
                                        {card.fiscal_number && (
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">Fiskal Nömrə</dt>
                                                <dd className="mt-1 text-sm font-mono text-gray-900">{card.fiscal_number}</dd>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Transaction History */}
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">Əməliyyat Tarixçəsi</h2>
                        </div>
                        {transactions.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Tarix
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Növ
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Məbləğ
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Əvvəlki Balans
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Sonrakı Balans
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                İstifadəçi
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Qeyd
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {transactions.map((transaction) => (
                                            <tr key={transaction.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {formatDateTime(transaction.created_at)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getTransactionTypeBadge(transaction.transaction_type)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                                                    {formatCurrency(transaction.amount)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                                                    {formatCurrency(transaction.balance_before)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                                    {formatCurrency(transaction.balance_after)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {transaction.user ? transaction.user.name : '-'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {transaction.notes || '-'}
                                                    {transaction.sale && (
                                                        <span className="ml-2 text-xs text-gray-400">
                                                            (Satış #{transaction.sale.sale_number})
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="px-6 py-12 text-center">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <h3 className="mt-2 text-sm font-medium text-gray-900">Əməliyyat yoxdur</h3>
                                <p className="mt-1 text-sm text-gray-500">Bu kart üzrə hələ heç bir əməliyyat edilməyib</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
