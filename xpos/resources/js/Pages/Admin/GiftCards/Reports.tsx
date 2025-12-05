import { Head, Link } from '@inertiajs/react';
import SuperAdminNav from '@/Components/SuperAdminNav';

interface AccountStats {
    account_id: number;
    account_name: string;
    total_cards: number;
    active_cards: number;
    depleted_cards: number;
    expired_cards: number;
    total_issued: number;
    total_redeemed: number;
    current_balance: number;
}

interface StatusSummary {
    free: number;
    configured: number;
    active: number;
    depleted: number;
    expired: number;
    inactive: number;
}

interface RedemptionStats {
    total_redemptions: number;
    total_amount_redeemed: number;
    average_redemption: number;
    redemptions_today: number;
    redemptions_this_week: number;
    redemptions_this_month: number;
}

interface Props {
    accountStats: AccountStats[];
    statusSummary: StatusSummary;
    redemptionStats: RedemptionStats;
    totalBalance: number;
    totalIssued: number;
}

export default function GiftCardReports({
    accountStats,
    statusSummary,
    redemptionStats,
    totalBalance,
    totalIssued,
}: Props) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('az-AZ', {
            style: 'currency',
            currency: 'AZN',
        }).format(amount);
    };

    return (
        <>
            <Head title="Hədiyyə Kartları Hesabatlar" />

            <div className="min-h-screen bg-gray-50">
                <div className="bg-white shadow">
                    <div className="mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="py-6 flex justify-between items-center">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    Hədiyyə Kartları Hesabatlar
                                </h1>
                                <p className="mt-2 text-sm text-gray-600">
                                    Bütün hesablar üzrə hədiyyə kartları statistikası
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

                    {/* Overall Stats */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-4 mb-8">
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <svg className="h-8 w-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Cəmi Buraxılmış
                                            </dt>
                                            <dd className="text-2xl font-bold text-gray-900">
                                                {formatCurrency(totalIssued)}
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
                                        <svg className="h-8 w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Aktiv Balans
                                            </dt>
                                            <dd className="text-2xl font-bold text-green-600">
                                                {formatCurrency(totalBalance)}
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
                                        <svg className="h-8 w-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                        </svg>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                İstifadə Edilib
                                            </dt>
                                            <dd className="text-2xl font-bold text-blue-600">
                                                {formatCurrency(redemptionStats.total_amount_redeemed)}
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
                                        <svg className="h-8 w-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                                        </svg>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Orta İstifadə
                                            </dt>
                                            <dd className="text-2xl font-bold text-indigo-600">
                                                {formatCurrency(redemptionStats.average_redemption)}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Status Summary */}
                    <div className="bg-white shadow rounded-lg mb-8">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">Status üzrə Bölgü</h2>
                        </div>
                        <div className="px-6 py-4">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                <div className="text-center p-4 bg-gray-50 rounded-lg">
                                    <div className="text-2xl font-bold text-gray-800">{statusSummary.free}</div>
                                    <div className="text-sm text-gray-500 mt-1">Azad</div>
                                </div>
                                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                                    <div className="text-2xl font-bold text-yellow-800">{statusSummary.configured}</div>
                                    <div className="text-sm text-yellow-600 mt-1">Konfiqurasiya</div>
                                </div>
                                <div className="text-center p-4 bg-green-50 rounded-lg">
                                    <div className="text-2xl font-bold text-green-800">{statusSummary.active}</div>
                                    <div className="text-sm text-green-600 mt-1">Aktiv</div>
                                </div>
                                <div className="text-center p-4 bg-blue-50 rounded-lg">
                                    <div className="text-2xl font-bold text-blue-800">{statusSummary.depleted}</div>
                                    <div className="text-sm text-blue-600 mt-1">İstifadə olunub</div>
                                </div>
                                <div className="text-center p-4 bg-red-50 rounded-lg">
                                    <div className="text-2xl font-bold text-red-800">{statusSummary.expired}</div>
                                    <div className="text-sm text-red-600 mt-1">Vaxtı keçib</div>
                                </div>
                                <div className="text-center p-4 bg-gray-50 rounded-lg">
                                    <div className="text-2xl font-bold text-gray-800">{statusSummary.inactive}</div>
                                    <div className="text-sm text-gray-500 mt-1">Deaktiv</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Redemption Stats */}
                    <div className="bg-white shadow rounded-lg mb-8">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">İstifadə Statistikası</h2>
                        </div>
                        <div className="px-6 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div>
                                    <div className="text-sm text-gray-500">Cəmi İstifadə</div>
                                    <div className="text-2xl font-bold text-gray-900 mt-1">
                                        {redemptionStats.total_redemptions}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-500">Bu Gün</div>
                                    <div className="text-2xl font-bold text-gray-900 mt-1">
                                        {redemptionStats.redemptions_today}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-500">Bu Həftə</div>
                                    <div className="text-2xl font-bold text-gray-900 mt-1">
                                        {redemptionStats.redemptions_this_week}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-500">Bu Ay</div>
                                    <div className="text-2xl font-bold text-gray-900 mt-1">
                                        {redemptionStats.redemptions_this_month}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Account Stats Table */}
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">Hesab üzrə Statistika</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Hesab
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Cəmi Kartlar
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Aktiv
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            İstifadə olunub
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Vaxtı keçib
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Buraxılmış
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            İstifadə edilib
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Cari Balans
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {accountStats.map((account) => (
                                        <tr key={account.account_id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {account.account_name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className="text-sm text-gray-900">{account.total_cards}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                    {account.active_cards}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                    {account.depleted_cards}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                                    {account.expired_cards}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                                                {formatCurrency(account.total_issued)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                                                {formatCurrency(account.total_redeemed)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-green-600">
                                                {formatCurrency(account.current_balance)}
                                            </td>
                                        </tr>
                                    ))}
                                    {accountStats.length === 0 && (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-12 text-center">
                                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                <h3 className="mt-2 text-sm font-medium text-gray-900">Məlumat yoxdur</h3>
                                                <p className="mt-1 text-sm text-gray-500">Hələ heç bir hesab üzrə kart yaradılmayıb</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
